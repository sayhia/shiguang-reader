    // Disk-backed library, two tiers. The user-picked folder (Chromium only) is what the
    // Host can read; the origin private file system (all engines) is the fallback that
    // keeps a book alive when localStorage is full. Both store the same body format.
    // Every helper here degrades to "unsupported" when its API is missing.
    const FS_DB_NAME = 'dsh.shiguang-reader.fs.v1';
    const FS_DB_STORE = 'handles';
    const FS_HANDLE_KEY = 'library';
    const FS_BOOKS_DIR = 'books';
    // Written at the root of the chosen folder so the Host (or any tool) can read
    // the whole library — metadata plus which books live on disk — without the browser.
    const FS_SNAPSHOT_FILE = 'library.json';

    let fsDirectory = null;
    let fsSnapshotPending = null;
    let fsSnapshotWriting = false;

    // Two APIs have to be there, not one: `showDirectoryPicker` is Chromium-only
    // (Safari and Firefox never shipped it), and a browser could expose the picker
    // while missing `createWritable`. Writes are the whole point, so writes gate it.
    function fsLibrarySupported() {
      if (typeof window === 'undefined' || typeof window.showDirectoryPicker !== 'function') return false;
      return typeof FileSystemFileHandle === 'function'
        && typeof FileSystemFileHandle.prototype.createWritable === 'function';
    }

    // Turns a DOMException into a stable code the UI can translate. Without this
    // every cause (denied permission, no space, name clash) collapsed into one
    // "could not write, please retry" toast that told the user nothing.
    function fsErrorCode(error) {
      const name = error && typeof error.name === 'string' ? error.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') return 'fs-denied';
      if (name === 'QuotaExceededError') return 'fs-quota';
      if (name === 'TypeMismatchError' || name === 'NotFoundError') return 'fs-conflict';
      if (name === 'NoModificationAllowedError') return 'fs-locked';
      const message = error && typeof error.message === 'string' ? error.message : '';
      if (message === 'fs-unsupported' || message === 'fs-no-handle' || message === 'fs-denied') return message;
      return 'fs-io';
    }

    function fsHandleName() {
      return fsDirectory ? String(fsDirectory.name || '') : '';
    }

    function fsOpenDb() {
      return new Promise(function open(resolve, reject) {
        if (typeof indexedDB === 'undefined') {
          reject(new Error('fs-unsupported'));
          return;
        }
        let request;
        try {
          request = indexedDB.open(FS_DB_NAME, 1);
        } catch (error) {
          reject(new Error('fs-unsupported'));
          return;
        }
        request.onupgradeneeded = function upgrade() {
          const db = request.result;
          if (!db.objectStoreNames.contains(FS_DB_STORE)) db.createObjectStore(FS_DB_STORE);
        };
        request.onsuccess = function ok() { resolve(request.result); };
        request.onerror = function fail() { reject(new Error('fs-idb')); };
      });
    }

    function fsIdbRun(mode, run) {
      return fsOpenDb().then(function withDb(db) {
        return new Promise(function settle(resolve, reject) {
          let transaction;
          try {
            transaction = db.transaction(FS_DB_STORE, mode);
          } catch (error) {
            reject(new Error('fs-idb'));
            return;
          }
          const store = transaction.objectStore(FS_DB_STORE);
          let request;
          try {
            request = run(store);
          } catch (error) {
            reject(new Error('fs-idb'));
            return;
          }
          transaction.oncomplete = function done() {
            try { db.close(); } catch (error) { /* ignore */ }
            resolve(request ? request.result : undefined);
          };
          transaction.onerror = function failed() {
            try { db.close(); } catch (error) { /* ignore */ }
            reject(new Error('fs-idb'));
          };
          transaction.onabort = function aborted() {
            try { db.close(); } catch (error) { /* ignore */ }
            reject(new Error('fs-idb'));
          };
        });
      });
    }

    function fsRememberHandle(handle) {
      return fsIdbRun('readwrite', function put(store) {
        return store.put(handle, FS_HANDLE_KEY);
      });
    }

    function fsLoadRememberedHandle() {
      return fsIdbRun('readonly', function get(store) {
        return store.get(FS_HANDLE_KEY);
      }).catch(function ignore() { return null; });
    }

    // Restores the remembered directory and reports whether it is still readable.
    async function fsRestoreDirectory() {
      if (!fsLibrarySupported()) return null;
      const handle = await fsLoadRememberedHandle();
      if (!handle) return null;
      fsDirectory = handle;
      let granted = false;
      try {
        granted = (await handle.queryPermission({ mode: 'readwrite' })) === 'granted';
      } catch (error) {
        granted = false;
      }
      return { name: fsHandleName(), granted: granted };
    }

    // Must be called from a user gesture; remembers the handle for next launch.
    async function fsChooseDirectory() {
      if (!fsLibrarySupported()) throw new Error('fs-unsupported');
      const handle = await window.showDirectoryPicker({ id: 'shiguang-library', mode: 'readwrite' });
      fsDirectory = handle;
      // Remembering is best-effort and must never delay the pick: a stalled IndexedDB
      // (private mode, quota, headless) would otherwise block the whole import flow.
      fsRememberHandle(handle).catch(function ignore() {});
      return { name: fsHandleName(), granted: true };
    }

    // Re-asks for permission on the remembered handle (needed after a browser restart).
    async function fsEnsureDirectory() {
      if (!fsDirectory) throw new Error('fs-no-handle');
      const options = { mode: 'readwrite' };
      try {
        if ((await fsDirectory.queryPermission(options)) === 'granted') return true;
        if ((await fsDirectory.requestPermission(options)) === 'granted') return true;
      } catch (error) {
        throw new Error('fs-denied');
      }
      throw new Error('fs-denied');
    }

    async function fsBooksDirectory(create) {
      if (!fsDirectory) throw new Error('fs-no-handle');
      return fsDirectory.getDirectoryHandle(FS_BOOKS_DIR, { create: create !== false });
    }

    // Legacy body name (one JSON blob per book). Still read so libraries written
    // by earlier versions keep working; nothing writes it any more.
    function fsBookFileName(id) {
      return String(id || '').replace(/[^A-Za-z0-9._-]/g, '_') + '.json';
    }

    function fsSafeName(text, max) {
      const cleaned = String(text || '')
        .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max || 60);
      return cleaned || '未命名';
    }

    function fsIdToken(id) {
      return String(id || '').replace(/[^A-Za-z0-9._-]/g, '_');
    }

    // One book is up to three things in the folder, all sharing a stem:
    //   `人间词话--local-3f9a.txt`      正文：人能读、宿主工具也能读
    //   `人间词话--local-3f9a.epub`     原始文件：内容以它为准，图片也从它来
    //   `人间词话--local-3f9a.assets/`  正文引用到的图片
    // The id suffix keeps them together when the title changes.
    function fsBookStem(book) {
      return fsSafeName(book && book.title) + '--' + fsIdToken(book && book.id);
    }

    function fsBodyFileName(book) {
      return fsBookStem(book) + '.txt';
    }

    function fsAssetsDirName(book) {
      return fsBookStem(book) + '.assets';
    }

    function fsSourceFileName(book, ext) {
      return fsBookStem(book) + '.' + (ext || 'epub');
    }

    function fsBodySuffix(id) {
      return '--' + fsIdToken(id) + '.txt';
    }

    function fsAssetsSuffix(id) {
      return '--' + fsIdToken(id) + '.assets';
    }

    function fsSourceSuffix(id) {
      return '--' + fsIdToken(id) + '.epub';
    }

    // Bytes of a book being imported, held only until they are written next to the
    // text. The original is what any future re-parse and every picture come from;
    // the text file is a readable view, not the whole book.
    const fsSourceQueue = new Map();
    const fsInFlightWrites = new Map();

    function fsRememberSource(bookId, fileName, bytesOrFile) {
      if (!bookId || !bytesOrFile) return false;
      const size = typeof bytesOrFile.size === 'number' ? bytesOrFile.size : (typeof bytesOrFile.length === 'number' ? bytesOrFile.length : 0);
      if (!size) return false;
      if (!/\.epub$/i.test(String(fileName || ''))) return false;
      fsSourceQueue.set(bookId, bytesOrFile);
      fsSourceImages.delete(bookId);
      return true;
    }

    // Drop bytes for an import that was skipped before it ever reached the folder.
    function fsForgetSource(bookId) {
      if (!bookId) return;
      fsSourceQueue.delete(bookId);
      fsSourceImages.delete(bookId);
    }

    // base64 without atob: the tests run in a bare VM, and this is the only place
    // that needs it. Chapter images are kept in memory as data URLs, so the prefix
    // is dropped first — decoding the whole URL would quietly base64 the word
    // "data" and write garbage bytes to the folder.
    function fsBase64ToBytes(value) {
      const raw = String(value || '');
      const comma = raw.indexOf(',');
      const body = /^data:/i.test(raw) && comma >= 0 ? raw.slice(comma + 1) : raw;
      const clean = body.replace(/[^A-Za-z0-9+/=]/g, '');
      const table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      const out = [];
      let buffer = 0;
      let bits = 0;
      for (let index = 0; index < clean.length; index += 1) {
        const char = clean.charAt(index);
        if (char === '=') break;
        const at = table.indexOf(char);
        if (at < 0) continue;
        buffer = (buffer << 6) | at;
        bits += 6;
        if (bits >= 8) {
          bits -= 8;
          out.push((buffer >> bits) & 0xff);
        }
      }
      return new Uint8Array(out);
    }

    function fsImageMime(name) {
      if (/\.png$/i.test(name)) return 'image/png';
      if (/\.webp$/i.test(name)) return 'image/webp';
      if (/\.gif$/i.test(name)) return 'image/gif';
      return 'image/jpeg';
    }

    async function fsRemoveEntry(directory, name, recursive) {
      try {
        await directory.removeEntry(name, recursive ? { recursive: true } : undefined);
        return true;
      } catch (error) {
        return false;
      }
    }

    // Opens a writable, asking for permission once more when the handle still says
    // 'prompt' (the usual state after a browser restart). Everything else is
    // rethrown as a code so the caller can say what actually went wrong.
    async function fsOpenWritable(file) {
      try {
        return await file.createWritable();
      } catch (error) {
        if (fsErrorCode(error) !== 'fs-denied') throw new Error(fsErrorCode(error));
        await fsEnsureDirectory();
        try {
          return await file.createWritable();
        } catch (retryError) {
          throw new Error(fsErrorCode(retryError));
        }
      }
    }

    // Pictures referenced anywhere in this book, keyed by the file name the text uses.
    function fsChapterImages(book) {
      const images = new Map();
      const chapters = Array.isArray(book && book.chapters) ? book.chapters : [];
      chapters.forEach(function each(chapter) {
        const map = chapter && chapter.images;
        if (!map || typeof map !== 'object') return;
        Object.keys(map).forEach(function add(name) {
          if (!images.has(name)) images.set(name, map[name]);
        });
      });
      return images;
    }

    async function fsWriteChapterImages(directory, book) {
      const images = fsChapterImages(book);
      const dirName = fsAssetsDirName(book);
      if (!images.size) {
        await fsRemoveEntry(directory, dirName, true);
        return 0;
      }
      let target;
      try {
        target = await directory.getDirectoryHandle(dirName, { create: true });
      } catch (error) {
        return 0;
      }
      const written = new Set();
      for (const entry of images) {
        try {
          const value = entry[1];
          const bytes = value && value.bytes instanceof Uint8Array ? value.bytes : fsBase64ToBytes(String(value || ''));
          if (!bytes.length) continue;
          const file = await target.getFileHandle(entry[0], { create: true });
          const writable = await fsOpenWritable(file);
          try {
            await writable.write(bytes);
          } finally {
            await writable.close();
          }
          written.add(entry[0]);
        } catch (error) {
          /* One broken picture must not cost the rest of the book. */
        }
      }
      try {
        for await (const item of target.values()) {
          if (item.kind === 'file' && !written.has(item.name)) await fsRemoveEntry(target, item.name);
        }
      } catch (error) {
        /* Enumeration is best-effort; a stale picture is harmless. */
      }
      return written.size;
    }

    async function fsWriteBookSource(directory, book) {
      const source = fsSourceQueue.get(book.id);
      if (!source) return false;
      try {
        const file = await directory.getFileHandle(fsSourceFileName(book, 'epub'), { create: true });
        const writable = await fsOpenWritable(file);
        try {
          await writable.write(source);
        } finally {
          await writable.close();
        }
        return true;
      } catch (error) {
        return false;
      } finally {
        fsSourceQueue.delete(book.id);
      }
    }

    // The original file only exists in the session that imported it. Renaming a
    // book in a later session would otherwise write a new stem and then delete the
    // old `.epub` as stale — throwing away the only copy of the book's source and
    // its pictures. Reading it back into the queue first means the rename moves it.
    async function fsAdoptStaleSource(directory, book) {
      if (fsSourceQueue.has(book.id)) return false;
      const suffix = fsSourceSuffix(book.id);
      const target = fsSourceFileName(book, 'epub');
      try {
        let staleName = '';
        for await (const entry of directory.values()) {
          if (entry.kind === 'file' && entry.name.endsWith(suffix) && entry.name !== target) {
            staleName = entry.name;
            break;
          }
        }
        if (!staleName) return false;
        const file = await directory.getFileHandle(staleName, { create: false });
        const bytes = new Uint8Array(await (await file.getFile()).arrayBuffer());
        if (!bytes.length) return false;
        fsSourceQueue.set(book.id, bytes);
        return true;
      } catch (error) {
        return false;
      }
    }

    // Fast path for a brand-new import. A fresh random id cannot have an older
    // body, source, picture folder or legacy JSON, so the two directory scans in
    // fsWriteBookBody (adopt stale source + remove stale siblings) are pure
    // overhead. Hundreds of imports pay for those scans once per book; avoid them.
    async function fsWriteNewBookBody(book, options) {
      if (!book || !book.id) throw new Error('fs-no-book');
      const writePromise = (async function doWrite() {
        const skipImages = Boolean(options && options.skipImages);
        const directory = await fsBooksDirectory(true);
        const file = await directory.getFileHandle(fsBodyFileName(book), { create: true });
        const bodyWrite = (async function writeBody() {
          const writable = await fsOpenWritable(file);
          try {
            await writable.write(bookBodyText(book));
          } finally {
            await writable.close();
          }
        })();
        const imageWrite = !skipImages && fsChapterImages(book).size ? fsWriteChapterImages(directory, book) : Promise.resolve(0);
        const sourceWrite = fsWriteBookSource(directory, book);
        await Promise.all([bodyWrite, imageWrite, sourceWrite]);
        return true;
      })();
      fsInFlightWrites.set(book.id, writePromise);
      try {
        return await writePromise;
      } finally {
        fsInFlightWrites.delete(book.id);
        fsSourceQueue.delete(book.id);
      }
    }

    async function fsWriteBookBody(book) {
      if (!book || !book.id) throw new Error('fs-no-book');
      const writePromise = (async function doWrite() {
        const directory = await fsBooksDirectory(true);
        const name = fsBodyFileName(book);
        const file = await directory.getFileHandle(name, { create: true });
        const writable = await fsOpenWritable(file);
        try {
          await writable.write(bookBodyText(book));
        } finally {
          await writable.close();
        }
        await fsWriteChapterImages(directory, book);
        await fsAdoptStaleSource(directory, book);
        const wroteSource = await fsWriteBookSource(directory, book);
        // New bytes for the original mean any pictures read out of the old one are stale.
        if (wroteSource) fsSourceImages.delete(book.id);
        // One copy of each part per book: drop the JSON written by older versions and
        // anything left under a previous title, so a rename never doubles the folder.
        await fsRemoveEntry(directory, fsBookFileName(book.id));
        const bodySuffix = fsBodySuffix(book.id);
        const sourceSuffix = fsSourceSuffix(book.id);
        const assetsSuffix = fsAssetsSuffix(book.id);
        const sourceName = fsSourceFileName(book, 'epub');
        const stale = [];
        for await (const entry of directory.values()) {
          // The three files this save just wrote are the keepers.
          if (entry.name === name || entry.name === fsAssetsDirName(book) || entry.name === sourceName) continue;
          const endsWithSource = entry.name.endsWith(sourceSuffix);
          // Without bytes this save wrote, a source file is the last copy there is:
          // leave it where it is rather than deleting it for tidiness.
          if (endsWithSource && !wroteSource) continue;
          if (entry.name.endsWith(bodySuffix) || endsWithSource || entry.name.endsWith(assetsSuffix)) {
            stale.push({ name: entry.name, directory: entry.kind === 'directory' });
          }
        }
        for (let index = 0; index < stale.length; index += 1) {
          await fsRemoveEntry(directory, stale[index].name, stale[index].directory);
        }
        return true;
      })();
      fsInFlightWrites.set(book.id, writePromise);
      try {
        return await writePromise;
      } finally {
        fsInFlightWrites.delete(book.id);
        fsSourceQueue.delete(book.id);
      }
    }

    // The pictures the book's own file can give back: `.assets/` is a cache, not the
    // only copy. Without this, deleting that folder — or a save that half failed —
    // made every picture unreadable while the original EPUB sat right beside it.
    // `null` is cached too, so a file that will not parse is not retried per picture.
    const fsSourceImages = new Map();
    const MAX_SOURCE_IMAGES = 2;

    function setSourceImages(id, map) {
      if (!id) return;
      if (fsSourceImages.has(id)) fsSourceImages.delete(id);
      fsSourceImages.set(id, map);
      if (fsSourceImages.size > MAX_SOURCE_IMAGES) {
        const oldest = fsSourceImages.keys().next().value;
        fsSourceImages.delete(oldest);
      }
    }

    async function fsSourceImageMap(directory, id) {
      if (fsSourceImages.has(id)) return fsSourceImages.get(id);
      let map = null;
      try {
        const suffix = fsSourceSuffix(id);
        let sourceName = '';
        for await (const entry of directory.values()) {
          if (entry.kind === 'file' && entry.name.endsWith(suffix)) {
            sourceName = entry.name;
            break;
          }
        }
        if (sourceName) {
          const file = await directory.getFileHandle(sourceName, { create: false });
          const raw = await file.getFile();
          if (raw) {
            const isStreamable = typeof Blob !== 'undefined' && (raw instanceof Blob || (typeof raw.slice === 'function' && typeof raw.size === 'number'));
            const input = isStreamable ? raw : new Uint8Array(await raw.arrayBuffer());
            const parsed = await parseEpubBook(sourceName, input);
            map = new Map();
            const parsedChapters = Array.isArray(parsed && parsed.chapters) ? parsed.chapters : [];
            parsedChapters.forEach(function each(chapter) {
              const images = chapter && chapter.images;
              if (!images || typeof images !== 'object') return;
              Object.keys(images).forEach(function put(name) {
                if (!map.has(name)) map.set(name, images[name]);
              });
            });
          }
        }
      } catch (error) {
        map = null;
      }
      setSourceImages(id, map);
      return map;
    }

    async function fsRecoverBookCover(directory, id) {
      if (!directory || !id) return null;
      try {
        const suffix = fsSourceSuffix(id);
        let sourceName = '';
        for await (const entry of directory.values()) {
          if (entry.kind === 'file' && entry.name.endsWith(suffix)) {
            sourceName = entry.name;
            break;
          }
        }
        if (!sourceName) return null;
        const file = await directory.getFileHandle(sourceName, { create: false });
        const raw = await file.getFile();
        if (!raw) return null;
        const isStreamable = typeof Blob !== 'undefined' && (raw instanceof Blob || (typeof raw.slice === 'function' && typeof raw.size === 'number'));
        const input = isStreamable ? raw : new Uint8Array(await raw.arrayBuffer());
        const parsed = await parseEpubBook(sourceName, input, { skipImageBytes: true });
        return (parsed && parsed.coverImage) || null;
      } catch (error) {
        return null;
      }
    }

    async function fsReadChapterImages(directory, chapters, id) {
      const suffix = fsAssetsSuffix(id);
      let assets = null;
      try {
        let assetsName = '';
        for await (const entry of directory.values()) {
          if (entry.kind === 'directory' && entry.name.endsWith(suffix)) {
            assetsName = entry.name;
            break;
          }
        }
        if (assetsName) assets = await directory.getDirectoryHandle(assetsName, { create: false });
      } catch (error) {
        assets = null;
      }
      let rebuilt;
      let loaded = 0;
      for (let index = 0; index < chapters.length; index += 1) {
        const chapter = chapters[index];
        const map = {};
        for (let position = 0; position < chapter.paragraphs.length; position += 1) {
          const picture = imageParagraph(chapter.paragraphs[position]);
          if (!picture) continue;
          let restored = '';
          if (assets) {
            try {
              const file = await assets.getFileHandle(picture.name, { create: false });
              const bytes = new Uint8Array(await (await file.getFile()).arrayBuffer());
              if (bytes.length) {
                restored = 'data:' + fsImageMime(picture.name) + ';base64,' + bytesToBase64(bytes);
              }
            } catch (error) {
              /* Not in the cache folder — the original file is the next place to look. */
            }
          }
          if (!restored) {
            if (rebuilt === undefined) rebuilt = await fsSourceImageMap(directory, id);
            if (rebuilt && rebuilt.has(picture.name)) restored = rebuilt.get(picture.name) || '';
          }
          if (restored) {
            map[picture.name] = restored;
            loaded += 1;
          }
        }
        if (Object.keys(map).length) chapter.images = map;
      }
      return loaded;
    }

    async function fsReadBookBody(book, options) {
      const id = typeof book === 'string' ? book : (book && book.id);
      if (id && fsInFlightWrites.has(id)) {
        await fsInFlightWrites.get(id).catch(function ignore() {});
      }
      const known = typeof book === 'object' && book ? book.chapterIds : undefined;
      const directory = await fsBooksDirectory(false);
      let file = null;
      if (book && typeof book === 'object' && book.title && book.id) {
        try {
          file = await directory.getFileHandle(fsBodyFileName(book), { create: false });
        } catch (error) {
          file = null;
        }
      }
      if (!file) {
        const suffix = fsBodySuffix(id);
        let bodyName = '';
        for await (const entry of directory.values()) {
          if (entry.kind === 'file' && entry.name.endsWith(suffix)) {
            bodyName = entry.name;
            break;
          }
        }
        if (bodyName) {
          file = await directory.getFileHandle(bodyName, { create: false });
        }
      }
      if (file) {
        const text = await (await file.getFile()).text();
        const chapters = parseBookBodyText(text, known);
        if (!(options && options.skipImages === true)) await fsReadChapterImages(directory, chapters, id);
        return chapters;
      }
      // A body written by an older version.
      const legacyFile = await directory.getFileHandle(fsBookFileName(id), { create: false });
      const parsed = JSON.parse(await (await legacyFile.getFile()).text());
      return Array.isArray(parsed && parsed.chapters) ? parsed.chapters : [];
    }

    async function fsDeleteBookBody(book) {
      const id = typeof book === 'string' ? book : (book && book.id);
      let removed = false;
      // A folder that is gone, or a books/ subfolder never created, simply means
      // there is nothing left to delete — deleting twice must stay quiet.
      let directory = null;
      try {
        directory = await fsBooksDirectory(false);
      } catch (error) {
        directory = null;
      }
      const bodySuffix = fsBodySuffix(id);
      const sourceSuffix = fsSourceSuffix(id);
      const assetsSuffix = fsAssetsSuffix(id);
      const doomed = [];
      if (directory) {
        for await (const entry of directory.values()) {
          const match = entry.name.endsWith(bodySuffix)
            || entry.name.endsWith(sourceSuffix)
            || entry.name.endsWith(assetsSuffix);
          if (match) doomed.push({ name: entry.name, directory: entry.kind === 'directory' });
        }
        for (let index = 0; index < doomed.length; index += 1) {
          if (await fsRemoveEntry(directory, doomed[index].name, doomed[index].directory)) removed = true;
        }
        if (await fsRemoveEntry(directory, fsBookFileName(id))) removed = true;
      }
      fsSourceQueue.delete(id);
      fsSourceImages.delete(id);
      return removed;
    }

    // Deletes one body file by the name it was listed under. Orphan cleanup works on
    // names, not ids: a file left by an older version has no id the holder knows.
    async function fsDeleteBodyFile(name) {
      if (!name) return false;
      let directory = null;
      try {
        directory = await fsBooksDirectory(false);
      } catch (error) {
        return false;
      }
      return fsRemoveEntry(directory, name, /\.assets$/i.test(name));
    }

    // Rewrites bodies that older versions left as JSON into readable text files, so
    // an existing library becomes browsable instead of staying a pile of blobs. Only
    // books still on the shelf are touched, and the JSON is removed by the writer
    // only after the text is safely on disk — a failure leaves the old file alone.
    // Returns what it read, so the caller can keep both the chapters and their ids:
    // a text file has no room for ids, and those ids are what highlights hang on.
    async function fsMigrateBodiesToText(books) {
      const done = [];
      if (!fsDirectory) return done;
      const list = Array.isArray(books) ? books : [];
      if (!list.length) return done;
      const names = [];
      try {
        const directory = await fsBooksDirectory(false);
        for await (const entry of directory.values()) {
          if (entry.kind === 'file' && /\.json$/i.test(entry.name)) names.push(entry.name);
        }
      } catch (error) {
        return done;
      }
      if (!names.length) return done;
      const byLegacyName = new Map();
      list.forEach(function index(book) {
        if (!book || !book.id || book.chaptersInFs !== true) return;
        byLegacyName.set(fsBookFileName(book.id), book);
      });
      if (!byLegacyName.size) return done;
      for (let index = 0; index < names.length; index += 1) {
        const book = byLegacyName.get(names[index]);
        if (!book) continue;
        try {
          const chapters = Array.isArray(book.chapters) && book.chapters.length
            ? book.chapters
            : await fsReadBookBody(book);
          if (!chapters.length) continue;
          await fsWriteBookBody({ id: book.id, title: book.title, chapters: chapters });
          done.push({ id: book.id, chapters: chapters });
        } catch (error) {
          /* Next launch tries again; the JSON is still there. */
        }
      }
      return done;
    }

    // Everything one book can leave in the folder, for orphan detection: the text,
    // the original EPUB, the picture directory, and the JSON of older versions.
    async function fsListBookIds() {
      const directory = await fsBooksDirectory(false);
      const names = [];
      for await (const entry of directory.values()) {
        if (entry.kind === 'file' && /\.(txt|json|epub)$/i.test(entry.name)) names.push(entry.name);
        else if (entry.kind === 'directory' && /\.assets$/i.test(entry.name)) names.push(entry.name);
      }
      return names;
    }

    // Writes the metadata snapshot into the library folder. Writes coalesce: a
    // second save during an in-flight write replaces the pending payload instead
    // of starting a competing writable stream on the same file.
    async function fsWriteLibrarySnapshot(payload) {
      if (!fsDirectory || !payload) return false;
      fsSnapshotPending = payload;
      if (fsSnapshotWriting) return true;
      fsSnapshotWriting = true;
      let wrote = false;
      try {
        while (fsSnapshotPending) {
          const next = fsSnapshotPending;
          fsSnapshotPending = null;
          const file = await fsDirectory.getFileHandle(FS_SNAPSHOT_FILE, { create: true });
          const writable = await fsOpenWritable(file);
          try {
            await writable.write(JSON.stringify(next));
          } finally {
            await writable.close();
          }
          wrote = true;
        }
      } catch (error) {
        fsSnapshotPending = null;
        wrote = false;
      } finally {
        fsSnapshotWriting = false;
      }
      return wrote;
    }

    // Writes the snapshot and *waits*, so picking a folder that cannot be written
    // fails immediately with a real reason instead of on some later silent save.
    async function fsWriteSnapshotNow(payload) {
      if (!fsDirectory) throw new Error('fs-no-handle');
      const file = await fsDirectory.getFileHandle(FS_SNAPSHOT_FILE, { create: true });
      const writable = await fsOpenWritable(file);
      try {
        await writable.write(JSON.stringify(payload || {}));
      } finally {
        await writable.close();
      }
      return true;
    }

    // Reads the snapshot back. Only used when browser storage turns out empty:
    // the folder is then the only copy of the library left.
    async function fsReadLibrarySnapshot() {
      if (!fsDirectory) return null;
      const file = await fsDirectory.getFileHandle(FS_SNAPSHOT_FILE, { create: false });
      const handle = await file.getFile();
      const text = await handle.text();
      return JSON.parse(text);
    }

    async function fsDeleteLibrarySnapshot() {
      if (!fsDirectory) return false;
      try {
        await fsDirectory.removeEntry(FS_SNAPSHOT_FILE);
        return true;
      } catch (error) {
        return false;
      }
    }
