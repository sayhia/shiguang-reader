    // Every distinct disk failure used to surface as the same "could not write to
    // that folder" toast, which left the user nothing to act on. fsstore reports a
    // code now; this turns it into a sentence that names the cause.
    function fsFailureText(t, error) {
      const code = error && typeof error.message === 'string' ? error.message : '';
      if (code === 'fs-unsupported') return t('fsUnsupported');
      if (code === 'fs-denied') return t('fsPermissionDenied');
      if (code === 'fs-quota') return t('fsQuotaFull');
      if (code === 'fs-conflict') return t('fsNameConflict');
      if (code === 'fs-locked') return t('fsLocked');
      return t('fsLibraryFailed');
    }

    const MAX_CACHED_CHAPTERS = 5;
    const bookChaptersCache = new Map();

    function setCachedChapters(bookId, chapters) {
      if (!bookId || !Array.isArray(chapters) || !chapters.length) return;
      if (bookChaptersCache.has(bookId)) bookChaptersCache.delete(bookId);
      bookChaptersCache.set(bookId, chapters);
      if (bookChaptersCache.size > MAX_CACHED_CHAPTERS) {
        const oldest = bookChaptersCache.keys().next().value;
        bookChaptersCache.delete(oldest);
      }
    }

    // Undo for a delete: puts the removed books and every trace of them back from
    // the snapshot taken at the click, on top of the *current* state. Restoring the
    // whole snapshot instead would also revert whatever happened during the undo
    // window — reading progress, a new highlight, an import.
    function restoreRemovedBooks(current, snapshot, ids) {
      const now = current && typeof current === 'object' ? current : {};
      const before = snapshot && typeof snapshot === 'object' ? snapshot : {};
      const gone = new Set((Array.isArray(ids) ? ids : []).filter(function ok(id) { return typeof id === 'string' && id; }));
      if (!gone.size) return now;
      const currentBooks = Array.isArray(now.customBooks) ? now.customBooks : [];
      const snapshotBooks = Array.isArray(before.customBooks) ? before.customBooks : [];
      const currentById = new Map();
      currentBooks.forEach(function index(book) { if (book && book.id) currentById.set(book.id, book); });
      const snapshotIds = new Set(snapshotBooks.map(function id(book) { return book && book.id; }));
      // Books added since the delete stay in front, where an import puts them; the
      // rest keep the order they had, with the restored ones back in their place.
      const added = currentBooks.filter(function fresh(book) { return book && !snapshotIds.has(book.id); });
      const ordered = [];
      snapshotBooks.forEach(function each(book) {
        if (!book) return;
        if (currentById.has(book.id)) ordered.push(currentById.get(book.id));
        else if (gone.has(book.id)) ordered.push(book);
      });
      const customBooks = added.concat(ordered);
      function mergeMap(nowMap, beforeMap) {
        const out = Object.assign({}, nowMap && typeof nowMap === 'object' ? nowMap : {});
        const old = beforeMap && typeof beforeMap === 'object' ? beforeMap : {};
        gone.forEach(function put(id) {
          if (Object.prototype.hasOwnProperty.call(old, id) && !Object.prototype.hasOwnProperty.call(out, id)) out[id] = old[id];
        });
        return out;
      }
      function mergeByBook(nowList, beforeList) {
        const list = Array.isArray(nowList) ? nowList : [];
        const back = (Array.isArray(beforeList) ? beforeList : []).filter(function hit(item) {
          return item && gone.has(item.bookId) && list.indexOf(item) < 0;
        });
        return back.length ? list.concat(back) : list;
      }
      function mergeIds(nowList, beforeList) {
        const out = (Array.isArray(nowList) ? nowList : []).slice();
        (Array.isArray(beforeList) ? beforeList : []).forEach(function each(id, index) {
          if (!gone.has(id) || out.indexOf(id) >= 0) return;
          out.splice(Math.min(index, out.length), 0, id);
        });
        return out;
      }
      const nowStats = now.stats && typeof now.stats === 'object' ? now.stats : {};
      const beforeStats = before.stats && typeof before.stats === 'object' ? before.stats : {};
      return Object.assign({}, now, {
        customBooks: customBooks,
        progress: mergeMap(now.progress, before.progress),
        reviews: mergeMap(now.reviews, before.reviews),
        userTags: mergeMap(now.userTags, before.userTags),
        highlights: mergeByBook(now.highlights, before.highlights),
        bookmarks: mergeByBook(now.bookmarks, before.bookmarks),
        sessions: mergeByBook(now.sessions, before.sessions),
        pins: mergeIds(now.pins, before.pins),
        wishlist: mergeIds(now.wishlist, before.wishlist),
        shelved: mergeIds(now.shelved, before.shelved),
        stats: Object.assign({}, nowStats, { byBook: mergeMap(nowStats.byBook, beforeStats.byBook) }),
        lastBookId: now.lastBookId == null && gone.has(before.lastBookId) ? before.lastBookId : now.lastBookId,
      });
    }

    // Undo for a bulk finish / unfinish: only the books the click changed, and only
    // while they still carry the flag it set — progress made since is kept.
    function undoFinishedBulk(progress, before, ids, flag) {
      const map = progress && typeof progress === 'object' ? progress : {};
      const old = before && typeof before === 'object' ? before : {};
      let changed = false;
      const next = Object.assign({}, map);
      (Array.isArray(ids) ? ids : []).forEach(function each(id) {
        const current = map[id];
        if (Boolean(current && current.completed) !== flag) return;
        changed = true;
        if (old[id]) next[id] = old[id];
        else delete next[id];
      });
      return changed ? next : map;
    }

    function ReadingApp() {
      useLocaleTick();
      const t = translate;

      const boot = useRef(null);
      if (boot.current === null) boot.current = loadState();
      const [state, setState] = useState(boot.current);
      const [cacheTick, setCacheTick] = useState(0);
      const [tab, setTab] = useState('shelf');
      const [query, setQuery] = useState('');
      const [shelfTagFilter, setShelfTagFilter] = useState('');
      const [reader, setReader] = useState(null);
      const [detailId, setDetailId] = useState(null);
      const [toast, setToast] = useState(null);
      const [importProgress, setImportProgress] = useState(null);
      const [importDetailsOpen, setImportDetailsOpen] = useState(false);
      const [dragActive, setDragActive] = useState(false);
      const [pasteOpen, setPasteOpen] = useState(false);
      const [paletteOpen, setPaletteOpen] = useState(false);
      const toastTimer = useRef(null);
      const dragDepth = useRef(0);
      const storageWarned = useRef(false);
      const snapshotWarned = useRef(false);
      const stateRef = useRef(state);
      const readerRef = useRef(null);
      const [persistTick, setPersistTick] = useState(0);
      const scrollRef = useRef(null);
      const fileRef = useRef(null);
      const backupRef = useRef(null);
      const importingRef = useRef(false);
      const activePoolRef = useRef(null);
      useEffect(function cleanupPoolOnUnmount() {
        return function unmount() {
          if (activePoolRef.current) {
            try { activePoolRef.current.dispose(); } catch (error) { /* ignore */ }
            activePoolRef.current = null;
          }
        };
      }, []);
      stateRef.current = state;
      readerRef.current = reader;

      const allBooks = useMemo(function booksMemo() {
        return BUILTIN_BOOKS.concat(state.customBooks);
      }, [state.customBooks]);
      const bookMap = useMemo(function mapMemo() {
        const map = new Map();
        allBooks.forEach(function add(book) { map.set(book.id, book); });
        return map;
      }, [allBooks]);
      const detailBook = useMemo(function findDetail() {
        if (!detailId) return null;
        const found = bookMap.get(detailId);
        if (!found) return null;
        if (Array.isArray(found.chapters) && found.chapters.length) return found;
        if (bookChaptersCache.has(found.id)) {
          const cached = bookChaptersCache.get(found.id);
          if (Array.isArray(cached) && cached.length) {
            return Object.assign({}, found, { chapters: cached });
          }
        }
        return found;
      }, [detailId, bookMap, cacheTick]);

      const showToast = useCallback(function toastMessage(message, action) {
        const duration = action ? 5200 : 3000;
        setToast({ message: message, key: Date.now(), action: action || null });
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(function hide() { setToast(null); }, duration);
      }, []);

      function runToastAction() {
        const action = toast && toast.action;
        if (toastTimer.current) {
          window.clearTimeout(toastTimer.current);
          toastTimer.current = null;
        }
        setToast(null);
        if (action && typeof action.onClick === 'function') action.onClick();
      }

      useEffect(function cleanupToastTimer() {
        return function cleanup() {
          if (toastTimer.current) window.clearTimeout(toastTimer.current);
        };
      }, []);

      // ⌘K / Ctrl+K works from anywhere, including inside the reader.
      useEffect(function paletteShortcut() {
        function onKeyDown(event) {
          if (!(event.metaKey || event.ctrlKey)) return;
          if (String(event.key || '').toLowerCase() !== 'k') return;
          event.preventDefault();
          event.stopPropagation();
          setPaletteOpen(function toggle(open) { return !open; });
        }
        window.addEventListener('keydown', onKeyDown, true);
        return function cleanup() { window.removeEventListener('keydown', onKeyDown, true); };
      }, []);

      useEffect(function persistSoon() {
        if (importingRef.current) return undefined;
        const timer = window.setTimeout(function persist() {
          if (importingRef.current) return;
          const saved = saveState(state);
          // With no shelf cap, running out of quota is the realistic failure, so
          // the warning must be able to fire again: remember it only until the
          // next save that works, otherwise one early full-storage toast would
          // silence every later failed import in the same session.
          if (saved) storageWarned.current = false;
          else if (!storageWarned.current) {
            storageWarned.current = true;
            showToast(t('storageFull'));
          }
          // Mirror the same payload into the library folder so the Host can read a
          // complete library without the browser. Best effort: a revoked permission
          // must never surface as a reading error — but say it once, because a
          // snapshot that never lands leaves the Host-side tools on stale data.
          if (state.fsLibrary) {
            fsWriteLibrarySnapshot(stateForStorage(state)).then(function wrote(result) {
              if (result === false && !snapshotWarned.current) {
                snapshotWarned.current = true;
                showToast(t('fsSnapshotFailed'));
              }
            }).catch(function ignore() {});
          }
        }, 600);
        return function cleanup() { window.clearTimeout(timer); };
        // persistTick: an import holds saves off while it runs; bumping it once the
        // import is over saves the shelf the import ended with.
      }, [state, showToast, t, persistTick]);

      // Restore the remembered library directory on launch and pull folder bodies back
      // into memory, so search, cards and export do not see metadata only. Without a
      // browser that can mount a folder there is nothing to restore: bodies live on
      // disk or nowhere.
      useEffect(function restoreLibraryDirectory() {
        let cancelled = false;
        if (!fsLibrarySupported()) return undefined;
        fsRestoreDirectory().then(function restored(info) {
          // No remembered handle, or the browser wants a fresh permission click:
          // without a mounted folder there is nothing to hydrate or migrate.
          if (cancelled || !info || !info.granted) return undefined;
          if (!stateRef.current.fsLibrary) {
            setState(function mark(previous) {
              return previous.fsLibrary ? previous : Object.assign({}, previous, { fsLibrary: { name: info.name } });
            });
          }
          // Bodies written before v1.46 are JSON blobs sitting in a folder people
          // open in Finder. Rewrite them as text once, after the bodies are back in
          // memory — a folder that keeps its books as JSON is the complaint that
          // started this.
          function afterBodies() {
            if (cancelled) return undefined;
            return fsMigrateBodiesToText(stateRef.current.customBooks).then(function adopt(migrated) {
              if (!migrated.length) return 0;
              setState(function keep(previous) {
                return Object.assign({}, previous, {
                  customBooks: previous.customBooks.map(function each(book) {
                    const hit = migrated.find(function same(item) { return item.id === book.id; });
                    if (!hit) return book;
                    return Object.assign({}, book, {
                      chapters: hit.chapters,
                      chapterIds: chapterIdsOf(hit),
                    });
                  }),
                });
              });
              return migrated.length;
            }).catch(function ignore() { return 0; });
          }
          return adoptFolderSnapshot().then(afterBodies, afterBodies);
        }).catch(function ignore() { /* stay on browser storage */ });
        return function cleanup() { cancelled = true; };
      }, []);

      useEffect(function persistOnExit() {
        function saveNow() { saveState(stateRef.current); }
        function onVisibility() { if (document.hidden) saveNow(); }
        window.addEventListener('beforeunload', saveNow);
        document.addEventListener('visibilitychange', onVisibility);
        return function cleanup() {
          window.removeEventListener('beforeunload', saveNow);
          document.removeEventListener('visibilitychange', onVisibility);
          saveNow();
        };
      }, []);

      useEffect(function syncOtherTabs() {
        function onStorage(event) {
          if (event.key !== STORAGE_KEY || !event.newValue) return;
          try {
            setState(normalizeState(JSON.parse(event.newValue)));
          } catch (error) {
            /* Ignore malformed external writes. */
          }
        }
        window.addEventListener('storage', onStorage);
        return function cleanup() { window.removeEventListener('storage', onStorage); };
      }, []);

      useEffect(function guardFileDropNavigation() {
        function preventNavigation(event) {
          if (!event.dataTransfer) return;
          const types = event.dataTransfer.types;
          if (types && Array.prototype.indexOf.call(types, 'Files') >= 0) event.preventDefault();
        }
        window.addEventListener('dragover', preventNavigation);
        window.addEventListener('drop', preventNavigation);
        return function cleanup() {
          window.removeEventListener('dragover', preventNavigation);
          window.removeEventListener('drop', preventNavigation);
        };
      }, []);

      useEffect(function resetScrollOnTab() {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
      }, [tab]);

      useEffect(function collapseHostRightbarForReader() {
        if (!reader) return undefined;
        if (layoutService && typeof layoutService.closeRightbar === 'function') {
          try { layoutService.closeRightbar(); } catch (error) { /* ignore */ }
        }
      }, [reader]);

      useEffect(function migrateLargeCovers() {
        const books = Array.isArray(state.customBooks) ? state.customBooks : [];
        const hasLarge = books.some(function check(b) {
          return b && typeof b.coverImage === 'string' && b.coverImage.length > 120000;
        });
        if (!hasLarge) return undefined;
        let cancelled = false;
        async function run() {
          const currentBooks = stateRef.current.customBooks || [];
          const updates = new Map();
          for (let i = 0; i < currentBooks.length; i += 1) {
            if (cancelled) return;
            const book = currentBooks[i];
            if (book && typeof book.coverImage === 'string' && book.coverImage.length > 120000) {
              try {
                const optimized = await downscaleCoverDataUrl(book.coverImage, 360, 504);
                if (optimized && optimized.length < book.coverImage.length) {
                  updates.set(book.id, optimized);
                }
              } catch (e) {
                /* skip */
              }
              if (updates.size > 0 && updates.size % 4 === 0) {
                await new Promise(function yieldTick(res) { setTimeout(res, 40); });
              }
            }
          }
          if (cancelled || !updates.size) return;
          setState(function apply(previous) {
            return Object.assign({}, previous, {
              customBooks: (previous.customBooks || []).map(function replace(b) {
                if (updates.has(b.id)) {
                  return Object.assign({}, b, { coverImage: updates.get(b.id) });
                }
                return b;
              }),
            });
          });
        }
        const timer = setTimeout(run, 2000);
        return function cleanup() {
          cancelled = true;
          clearTimeout(timer);
        };
      }, []);

      useEffect(function recoverDegradedCovers() {
        if (!fsDirectory || !fsLibrarySupported()) return undefined;
        const books = Array.isArray(state.customBooks) ? state.customBooks : [];
        const hasDegraded = books.some(function check(b) {
          return b && b.source === 'local' && typeof b.coverImage === 'string' && b.coverImage.length < 28000;
        });
        if (!hasDegraded) return undefined;
        let cancelled = false;
        async function run() {
          const currentBooks = stateRef.current.customBooks || [];
          const updates = new Map();
          for (let i = 0; i < currentBooks.length; i += 1) {
            if (cancelled) return;
            const book = currentBooks[i];
            if (book && book.source === 'local' && typeof book.coverImage === 'string' && book.coverImage.length < 28000) {
              try {
                const recovered = await fsRecoverBookCover(fsDirectory, book.id);
                if (recovered && recovered.length > book.coverImage.length) {
                  updates.set(book.id, recovered);
                }
              } catch (e) {
                /* skip */
              }
              if (updates.size > 0 && updates.size % 2 === 0) {
                await new Promise(function yieldTick(res) { setTimeout(res, 60); });
              }
            }
          }
          if (cancelled || !updates.size) return;
          setState(function apply(previous) {
            return Object.assign({}, previous, {
              customBooks: (previous.customBooks || []).map(function replace(b) {
                if (updates.has(b.id)) {
                  return Object.assign({}, b, { coverImage: updates.get(b.id) });
                }
                return b;
              }),
            });
          });
        }
        const timer = setTimeout(run, 1500);
        return function cleanup() {
          cancelled = true;
          clearTimeout(timer);
        };
      }, [fsDirectory]);

      // Disk-backed library: bodies stay in memory for the session, browser storage
      // keeps metadata only. The mounted handle is the source of truth here, not the
      // state flag — a folder picked moments ago is writable before any re-render.
      async function persistBodies(books) {
        if (!Array.isArray(books) || !books.length) return [];
        if (!fsDirectory || !fsLibrarySupported()) return [];
        try {
          await fsEnsureDirectory();
        } catch (error) {
          return [];
        }
        const done = [];
        for (let index = 0; index < books.length; index += 1) {
          try {
            await fsWriteBookBody(books[index]);
            done.push(books[index].id);
            if (books[index] && books[index].id && Array.isArray(books[index].chapters) && books[index].chapters.length) {
              setCachedChapters(books[index].id, books[index].chapters);
            }
          } catch (error) {
            /* Leave the body in localStorage for this book rather than losing it. */
          }
        }
        if (done.length) {
          setState(function mark(previous) {
            return stripDiskBackedBodies(markBodiesOnDisk(previous, done), true);
          });
        }
        return done;
      }

      // Reads a body back from the picked folder before the reader opens it.
      async function readStoredBody(book) {
        if (!book) return [];
        if (bookChaptersCache.has(book.id)) {
          const cached = bookChaptersCache.get(book.id);
          if (Array.isArray(cached) && cached.length) return cached;
        }
        await fsEnsureDirectory();
        let lastError = null;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            const chapters = await fsReadBookBody(book);
            if (Array.isArray(chapters) && chapters.length) {
              setCachedChapters(book.id, chapters);
              return chapters;
            }
          } catch (error) {
            lastError = error;
          }
          if (attempt < 2) {
            await new Promise(function wait(resolve) {
              setTimeout(resolve, 100 * (attempt + 1));
            });
          }
        }
        if (lastError) throw lastError;
        return [];
      }

      async function withBookBody(book) {
        if (!book) return null;
        if (Array.isArray(book.chapters) && book.chapters.length) {
          setCachedChapters(book.id, book.chapters);
          return book;
        }
        if (bookChaptersCache.has(book.id)) {
          const cached = bookChaptersCache.get(book.id);
          if (Array.isArray(cached) && cached.length) {
            return Object.assign({}, book, { chapters: cached });
          }
        }
        if (book.chaptersInFs !== true) return book;
        const loadingTimer = setTimeout(function hint() {
          showToast(t('loadingBookBody'));
        }, 300);
        try {
          const chapters = await readStoredBody(book);
          clearTimeout(loadingTimer);
          if (!Array.isArray(chapters) || !chapters.length) throw new Error('fs-body-empty');
          setCachedChapters(book.id, chapters);
          setCacheTick(function tick(c) { return c + 1; });
          return Object.assign({}, book, { chapters: chapters });
        } catch (error) {
          clearTimeout(loadingTimer);
          // A body file that is missing and a folder we lost permission to are two
          // different problems for the user, even though both land here.
          showToast(fsErrorCode(error) === 'fs-denied' ? t('fsPermissionDenied') : t('fsBodyMissing'));
          return null;
        }
      }

      // Browser storage lost everything but the folder survived: the snapshot is the
      // only copy left, so the shelf comes back from it. Bodies stay on disk and load on demand.
      async function adoptFolderSnapshot() {
        let snapshot = null;
        try {
          snapshot = await fsReadLibrarySnapshot();
        } catch (error) {
          snapshot = null;
        }
        const adopted = snapshot ? adoptLibrarySnapshot(stateRef.current, snapshot) : null;
        if (!adopted) return 0;
        setState(adopted);
        showToast(fill(t('fsLibraryRestored'), { n: adopted.customBooks.length }));
        return 0;
      }

      const openReader = useCallback(async function open(book, chapterIndex, percent) {
        if (!book) return;
        const ready = await withBookBody(book);
        if (!ready || !Array.isArray(ready.chapters) || !ready.chapters.length) return;
        setCachedChapters(ready.id, ready.chapters);
        book = ready;
        const saved = stateRef.current.progress[book.id];
        let targetChapter = chapterIndex;
        let targetPercent = percent;
        if (targetChapter === undefined) {
          if (saved && !saved.completed) {
            targetChapter = saved.chapterIndex || 0;
            targetPercent = saved.percent || 0;
          } else {
            targetChapter = 0;
            targetPercent = 0;
          }
        }
        const chapterIndexSafe = clamp(Number(targetChapter) || 0, 0, Math.max(0, book.chapters.length - 1));
        const percentSafe = clamp(Number(targetPercent) || 0, 0, 1);
        setState(function markOpened(previous) {
          return Object.assign({}, previous, { lastBookId: book.id, lastReadAt: Date.now() });
        });
        setReader({
          bookId: book.id,
          chapterIndex: chapterIndexSafe,
          percent: percentSafe,
          sessionKey: Date.now(),
        });
        setDetailId(null);
        setTab('shelf');
      }, []);

      useEffect(function hydrateDetailChapters() {
        if (!detailId) return;
        const target = bookMap.get(detailId);
        if (target && target.chaptersInFs === true && (!Array.isArray(target.chapters) || !target.chapters.length) && !bookChaptersCache.has(target.id)) {
          withBookBody(target);
        }
      }, [detailId, bookMap]);

      useEffect(function hydrateReaderChapters() {
        if (!reader) return;
        const target = bookMap.get(reader.bookId);
        if (target && target.chaptersInFs === true && (!Array.isArray(target.chapters) || !target.chapters.length) && !bookChaptersCache.has(target.id)) {
          withBookBody(target);
        }
      }, [reader, bookMap]);

      const handleContinue = useCallback(function continueBook(book) {
        if (!book) return;
        const saved = stateRef.current.progress[book.id];
        if (!saved || saved.completed) {
          openReader(book, 0, 0);
        } else {
          openReader(book, saved.chapterIndex || 0, saved.percent || 0);
        }
      }, [openReader]);

      // ⌘O / Ctrl+O quickly opens the continue / recent reading book from outside the reader.
      useEffect(function quickOpenShortcut() {
        function onKeyDown(event) {
          if (!(event.metaKey || event.ctrlKey)) return;
          if (String(event.key || '').toLowerCase() !== 'o') return;
          if (readerRef.current) return;
          event.preventDefault();
          event.stopPropagation();
          const target = resolveContinueBook(allBooks, stateRef.current.progress, stateRef.current.shelved);
          if (target) {
            handleContinue(target);
          } else {
            showToast(t('noBooksToRead'));
          }
        }
        window.addEventListener('keydown', onKeyDown, true);
        return function cleanup() { window.removeEventListener('keydown', onKeyDown, true); };
      }, [allBooks, handleContinue, showToast, t]);

      const handleProgress = useCallback(function progress(bookId, chapterIndex, percent) {
        setState(function apply(previous) {
          const custom = Array.isArray(previous.customBooks) ? previous.customBooks : [];
          const book = bookMap.get(bookId) || custom.find(function(b) { return b && b.id === bookId; });
          if (!book) return previous;
          const cached = bookChaptersCache.get(bookId);
          const chapters = (Array.isArray(book.chapters) && book.chapters.length)
            ? book.chapters
            : (Array.isArray(cached) && cached.length ? cached : null);
          const existing = previous.progress[bookId];
          const chapterCount = Math.max(1, chapters ? chapters.length : ((book.chapterIds && book.chapterIds.length) || (book.chapterCount) || 1));
          const nextChapter = clamp(Number(chapterIndex) || 0, 0, chapterCount - 1);
          const nextPercent = clamp(Number(percent) || 0, 0, 1);
          if (existing && existing.chapterIndex === nextChapter && Math.abs((existing.percent || 0) - nextPercent) < 0.0001) {
            return previous;
          }
          const nextProgress = Object.assign({}, previous.progress);
          const chapter = chapters ? chapters[nextChapter] : null;
          const existingMarks = existing && existing.chapterMarks ? existing.chapterMarks : {};
          nextProgress[bookId] = {
            chapterIndex: nextChapter,
            percent: nextPercent,
            completed: Boolean(existing && existing.completed),
            updatedAt: Date.now(),
            // A zero offset means "just opened"; keep the earlier resume point instead of wiping it.
            chapterMarks: nextPercent > 0
              ? recordChapterMark(existingMarks, chapter ? chapter.id : ((book.chapterIds && book.chapterIds[nextChapter]) || ''), nextPercent)
              : existingMarks,
          };
          return Object.assign({}, previous, {
            progress: nextProgress,
            lastBookId: bookId,
            lastReadAt: Date.now(),
          });
        });
      }, [bookMap]);

      const handleFinish = useCallback(function finish(bookId) {
        setState(function apply(previous) {
          const existing = previous.progress[bookId] || { chapterIndex: 0, percent: 1 };
          const nextProgress = Object.assign({}, previous.progress);
          nextProgress[bookId] = Object.assign({}, existing, {
            completed: true,
            percent: 1,
            updatedAt: Date.now(),
          });
          return Object.assign({}, previous, {
            progress: nextProgress,
            lastBookId: bookId,
            lastReadAt: Date.now(),
          });
        });
      }, []);

      const addReadingSeconds = useCallback(function addSeconds(seconds, bookId) {
        const value = Math.round(Number(seconds) || 0);
        if (value <= 0) return;
        setState(function apply(previous) {
          const key = dayKey();
          const add = Math.min(600, value);
          const days = Object.assign({}, previous.stats.days);
          days[key] = Math.min(86400, (Number(days[key]) || 0) + add);
          const byBook = Object.assign({}, previous.stats.byBook);
          if (bookId) byBook[bookId] = (Number(byBook[bookId]) || 0) + add;
          return Object.assign({}, previous, { stats: Object.assign({}, previous.stats, { days: days, byBook: byBook }) });
        });
      }, []);

      const addHighlight = useCallback(function highlight(item) {
        setState(function apply(previous) {
          const existing = previous.highlights.find(function same(entry) {
            return entry.bookId === item.bookId && entry.chapterId === item.chapterId && entry.start === item.start && entry.end === item.end;
          });
          if (existing) {
            if (!item.note) return previous;
            return Object.assign({}, previous, {
              highlights: previous.highlights.map(function update(entry) {
                return entry.id === existing.id
                  ? Object.assign({}, entry, { note: item.note, color: item.color || entry.color, createdAt: Date.now() })
                  : entry;
              }),
            });
          }
          return Object.assign({}, previous, {
            highlights: [item].concat(previous.highlights).slice(0, MAX_HIGHLIGHTS),
          });
        });
      }, []);

      const updateBookCover = useCallback(function update(bookId, coverImage) {
        setState(function apply(previous) {
          let changed = false;
          const customBooks = previous.customBooks.map(function updateOne(book) {
            if (book.id !== bookId) return book;
            const validCover = typeof coverImage === 'string' && /^data:image\/(?:jpeg|png|webp|gif);base64,/.test(coverImage) && coverImage.length <= 800000;
            const next = validCover
              ? Object.assign({}, book, { coverImage: coverImage })
              : Object.assign({}, book, { coverImage: undefined });
            if (next.coverImage !== book.coverImage) changed = true;
            return next;
          });
          return changed ? Object.assign({}, previous, { customBooks: customBooks }) : previous;
        });
        showToast(t('coverUpdated'));
      }, [showToast, t]);

      const updateBookMetadata = useCallback(function update(bookId, patch) {
        setState(function apply(previous) {
          let changed = false;
          const customBooks = previous.customBooks.map(function updateOne(book) {
            if (book.id !== bookId) return book;
            const next = withBookMetadata(book, patch);
            if (next !== book) changed = true;
            return next;
          });
          return changed ? Object.assign({}, previous, { customBooks: customBooks }) : previous;
        });
        showToast(t('bookUpdated'));
      }, [showToast, t]);

      const updateHighlight = useCallback(function update(id, patch) {
        setState(function apply(previous) {
          let changed = false;
          const highlights = previous.highlights.map(function entry(item) {
            if (item.id !== id) return item;
            const nextNote = typeof patch.note === 'string' ? patch.note.slice(0, 4000) : item.note;
            const nextColor = HIGHLIGHT_COLORS.some(function same(color) { return color.id === patch.color; }) ? patch.color : item.color;
            const currentTags = Array.isArray(item.tags) ? item.tags : [];
            const nextTags = Array.isArray(patch.tags) ? cleanNoteTags(patch.tags) : currentTags;
            if (nextNote === item.note && nextColor === item.color && sameTagList(nextTags, currentTags)) return item;
            changed = true;
            return Object.assign({}, item, { note: nextNote, color: nextColor, tags: nextTags });
          });
          return changed ? Object.assign({}, previous, { highlights: highlights }) : previous;
        });
      }, []);

      const deleteHighlight = useCallback(function remove(id) {
        const item = stateRef.current.highlights.find(function find(entry) { return entry.id === id; });
        if (!item) return;
        setState(function apply(previous) {
          return Object.assign({}, previous, {
            highlights: previous.highlights.filter(function keep(entry) { return entry.id !== id; }),
          });
        });
        showToast(t('highlightDeleted'), {
          label: t('undo'),
          onClick: function restore() {
            setState(function apply(previous) {
              if (previous.highlights.some(function exists(entry) { return entry.id === id; })) return previous;
              return Object.assign({}, previous, { highlights: [item].concat(previous.highlights).slice(0, MAX_HIGHLIGHTS) });
            });
          },
        });
      }, [showToast, t]);

      const deleteAnnotations = useCallback(function bulkDelete(highlightIds, bookmarkIds) {
        const hSet = new Set(Array.isArray(highlightIds) ? highlightIds : []);
        const bSet = new Set(Array.isArray(bookmarkIds) ? bookmarkIds : []);
        if (!hSet.size && !bSet.size) return;
        const removedHighlights = stateRef.current.highlights.filter(function pick(item) { return hSet.has(item.id); });
        const removedBookmarks = stateRef.current.bookmarks.filter(function pick(item) { return bSet.has(item.id); });
        if (!removedHighlights.length && !removedBookmarks.length) return;
        setState(function apply(previous) {
          return Object.assign({}, previous, {
            highlights: previous.highlights.filter(function pick(item) { return !hSet.has(item.id); }),
            bookmarks: previous.bookmarks.filter(function pick(item) { return !bSet.has(item.id); }),
          });
        });
        showToast(t('annotationsDeleted'), {
          label: t('undo'),
          onClick: function restore() {
            setState(function apply(previous) {
              const existingHighlights = new Set(previous.highlights.map(function item(note) { return note.id; }));
              const existingBookmarks = new Set(previous.bookmarks.map(function item(bookmark) { return bookmark.id; }));
              const addHighlights = removedHighlights.filter(function item(note) { return !existingHighlights.has(note.id); });
              const addBookmarks = removedBookmarks.filter(function item(bookmark) { return !existingBookmarks.has(bookmark.id); });
              return Object.assign({}, previous, {
                highlights: addHighlights.concat(previous.highlights).slice(0, MAX_HIGHLIGHTS),
                bookmarks: addBookmarks.concat(previous.bookmarks).slice(0, 400),
              });
            });
          },
        });
      }, [showToast, t]);

      const addBookmark = useCallback(function bookmark(item) {
        setState(function apply(previous) {
          const duplicate = previous.bookmarks.some(function same(entry) {
            return entry.bookId === item.bookId && entry.chapterId === item.chapterId && Math.abs(entry.percent - item.percent) < 0.025;
          });
          if (duplicate) return previous;
          return Object.assign({}, previous, {
            bookmarks: [item].concat(previous.bookmarks).slice(0, 400),
          });
        });
      }, []);

      const updateBookmark = useCallback(function update(id, patch) {
        setState(function apply(previous) {
          return Object.assign({}, previous, {
            bookmarks: previous.bookmarks.map(function item(bookmark) {
              if (bookmark.id !== id) return bookmark;
              return Object.assign({}, bookmark, {
                note: typeof patch.note === 'string' ? patch.note.trim().slice(0, 500) : bookmark.note,
              });
            }),
          });
        });
      }, []);

      const removeBookmark = useCallback(function remove(id) {
        const item = stateRef.current.bookmarks.find(function find(entry) { return entry.id === id; });
        if (!item) return;
        setState(function apply(previous) {
          return Object.assign({}, previous, {
            bookmarks: previous.bookmarks.filter(function keep(entry) { return entry.id !== id; }),
          });
        });
        showToast(t('bookmarkDeleted'), {
          label: t('undo'),
          onClick: function restore() {
            setState(function apply(previous) {
              if (previous.bookmarks.some(function exists(entry) { return entry.id === id; })) return previous;
              return Object.assign({}, previous, { bookmarks: [item].concat(previous.bookmarks).slice(0, 400) });
            });
          },
        });
      }, [showToast, t]);

      const addReadingSession = useCallback(function addSession(session) {
        if (!session || typeof session.bookId !== 'string') return;
        const seconds = Math.round(Number(session.seconds) || 0);
        if (seconds < 30) return;
        const startedAt = Number(session.startedAt) || (Date.now() - seconds * 1000);
        const record = {
          id: newId('session'),
          bookId: session.bookId,
          startedAt: startedAt,
          endedAt: Date.now(),
          seconds: Math.min(86400, seconds),
          chapterIndex: Math.max(0, Math.round(Number(session.chapterIndex) || 0)),
        };
        setState(function apply(previous) {
          return Object.assign({}, previous, {
            sessions: [record].concat(previous.sessions || []).slice(0, 100),
          });
        });
      }, []);

      const updateSettings = useCallback(function update(patch) {
        setState(function apply(previous) {
          return Object.assign({}, previous, { settings: Object.assign({}, previous.settings, patch) });
        });
      }, []);

      const updateGoal = useCallback(function update(minutes) {
        const value = clamp(Math.round((Number(minutes) || DEFAULT_WEEKLY_GOAL_MINUTES) / 15) * 15, 30, 1440);
        setState(function apply(previous) {
          return Object.assign({}, previous, {
            stats: Object.assign({}, previous.stats, { goalMinutes: value }),
          });
        });
      }, []);

      const clearReadingStats = useCallback(function clearStats() {
        setState(function apply(previous) {
          return Object.assign({}, previous, {
            lastBookId: null,
            lastReadAt: 0,
            sessions: [],
            stats: Object.assign({}, previous.stats, { days: {}, byBook: {} }),
          });
        });
        showToast(t('statsCleared'));
      }, [showToast, t]);

      const clearAnnotations = useCallback(function clearNotes() {
        setState(function apply(previous) {
          return Object.assign({}, previous, { highlights: [], bookmarks: [] });
        });
        showToast(t('annotationsCleared'));
      }, [showToast, t]);

      const resetAllData = useCallback(function reset() {
        // Wipe the snapshot first: a stale one would resurrect the library on the next
        // launch just because the folder is still granted. The folder itself is kept —
        // losing the grant is a browser concern, not part of "reset reading data".
        fsDeleteLibrarySnapshot().catch(function ignore() {});
        setState(function apply(previous) {
          const next = defaultState();
          return previous && previous.fsLibrary ? Object.assign(next, { fsLibrary: previous.fsLibrary }) : next;
        });
        setTab('shelf');
        setDetailId(null);
        showToast(t('dataReset'));
      }, [showToast, t]);

      // Bodies survive a delete that could not reach the folder (revoked permission,
      // interrupted batch). Those files are dead weight; clean them on request only.
      const cleanOrphanBodies = useCallback(async function cleanOrphans() {
        if (!stateRef.current.fsLibrary || !fsLibrarySupported()) {
          showToast(t('fsUnsupported'));
          return 0;
        }
        let ids = [];
        try {
          await fsEnsureDirectory();
          ids = await fsListBookIds();
        } catch (error) {
          showToast(fsFailureText(t, error));
          return 0;
        }
        const books = Array.isArray(stateRef.current.customBooks) ? stateRef.current.customBooks : [];
        const orphans = orphanBodyIds(ids, books);
        if (!orphans.length) {
          showToast(t('fsNoOrphans'));
          return 0;
        }
        let removed = 0;
        for (let index = 0; index < orphans.length; index += 1) {
          try {
            if (await fsDeleteBodyFile(orphans[index])) removed += 1;
          } catch (error) {
            /* Keep going: one stuck file must not block the rest. */
          }
        }
        showToast(fill(t('fsOrphansRemoved'), { n: removed }));
        return removed;
      }, [showToast, t]);

      const updateShelfSort = useCallback(function update(sort) {
        if (['recent', 'title', 'author', 'added', 'progress', 'rating'].indexOf(sort) < 0) return;
        setState(function apply(previous) { return Object.assign({}, previous, { shelfSort: sort }); });
      }, []);

      const updateShelfView = useCallback(function update(view) {
        if (['grid', 'list', 'group'].indexOf(view) < 0) return;
        setState(function apply(previous) { return Object.assign({}, previous, { shelfView: view }); });
      }, []);

      const togglePin = useCallback(function toggle(bookId) {
        const wasPinned = (stateRef.current.pins || []).indexOf(bookId) >= 0;
        setState(function apply(previous) {
          const pins = Array.isArray(previous.pins) ? previous.pins : [];
          const next = pins.indexOf(bookId) >= 0
            ? pins.filter(function keep(id) { return id !== bookId; })
            : [bookId].concat(pins).slice(0, 100);
          return Object.assign({}, previous, { pins: next });
        });
        showToast(wasPinned ? t('bookUnpinned') : t('bookPinned'));
      }, [showToast, t]);

      // One toast and one state write for a whole selection, instead of N toggles.
      const setPinned = useCallback(function bulkPin(ids, pinned) {
        const result = mergePins(stateRef.current.pins || [], ids, pinned === true);
        if (!result.changed.length) {
          if ((Array.isArray(ids) ? ids : []).length) showToast(pinned === true ? t('booksAlreadyPinned') : t('booksAlreadyUnpinned'));
          return;
        }
        setState(function apply(previous) {
          return Object.assign({}, previous, { pins: mergePins(previous.pins || [], ids, pinned === true).pins });
        });
        showToast(fill(t(pinned === true ? 'booksPinnedBulk' : 'booksUnpinnedBulk'), { n: result.changed.length }));
      }, [showToast, t]);

      const toggleWishlist = useCallback(function toggle(bookId) {
        const wasListed = (stateRef.current.wishlist || []).indexOf(bookId) >= 0;
        setState(function apply(previous) {
          const wishlist = Array.isArray(previous.wishlist) ? previous.wishlist : [];
          const next = wishlist.indexOf(bookId) >= 0
            ? wishlist.filter(function keep(id) { return id !== bookId; })
            : [bookId].concat(wishlist).slice(0, 200);
          return Object.assign({}, previous, { wishlist: next });
        });
        showToast(wasListed ? t('removedWishlist') : t('addedWishlist'));
      }, [showToast, t]);

      const toggleShelved = useCallback(function toggle(bookId) {
        const wasShelved = (stateRef.current.shelved || []).indexOf(bookId) >= 0;
        setState(function apply(previous) {
          return Object.assign({}, previous, { shelved: toggleId(previous.shelved, bookId, 200) });
        });
        showToast(wasShelved ? t('bookUnshelved') : t('bookShelved'));
      }, [showToast, t]);

      // Batch shelve / unshelve from the multi-select bar.
      const setShelvedBulk = useCallback(function bulk(ids, flag) {
        const want = flag === true;
        const preview = setIdsBulk(stateRef.current.shelved, ids, want, 200);
        if (!preview.changed.length) {
          showToast(t(want ? 'booksAlreadyShelved' : 'booksAlreadyUnshelved'));
          return;
        }
        setState(function apply(previous) {
          return Object.assign({}, previous, { shelved: setIdsBulk(previous.shelved, ids, want, 200).list });
        });
        showToast(fill(t(want ? 'booksShelvedBulk' : 'booksUnshelvedBulk'), { n: preview.changed.length }));
      }, [showToast, t]);

      const setWishlistBulk = useCallback(function bulk(ids, flag) {
        const want = flag === true;
        const preview = setIdsBulk(stateRef.current.wishlist, ids, want, 200);
        if (!preview.changed.length) {
          showToast(t(want ? 'booksAlreadyWishlisted' : 'booksAlreadyUnwishlisted'));
          return;
        }
        setState(function apply(previous) {
          return Object.assign({}, previous, { wishlist: setIdsBulk(previous.wishlist, ids, want, 200).list });
        });
        showToast(fill(t(want ? 'booksWishlistedBulk' : 'booksUnwishlistedBulk'), { n: preview.changed.length }));
      }, [showToast, t]);

      const toggleFinished = useCallback(function toggle(bookId) {
        const current = stateRef.current.progress[bookId];
        const wasFinished = Boolean(current && current.completed);
        setState(function apply(previous) {
          const existing = previous.progress[bookId] || { chapterIndex: 0, percent: 0, updatedAt: Date.now() };
          const next = Object.assign({}, existing, {
            completed: !wasFinished,
            percent: wasFinished ? 0 : 1,
            updatedAt: Date.now(),
          });
          return Object.assign({}, previous, {
            progress: Object.assign({}, previous.progress, { [bookId]: next }),
          });
        });
        showToast(wasFinished ? t('markedReading') : t('markedFinished'));
      }, [showToast, t]);

      // Batch finish / unfinish with one state write and a whole-selection undo.
      const setFinishedBulk = useCallback(function bulk(ids, flag) {
        const previous = stateRef.current;
        const want = flag === true;
        const preview = setBooksFinished(previous.progress, ids, want, Date.now());
        if (!preview.changed) {
          showToast(t(want ? 'booksAlreadyFinished' : 'booksAlreadyReading'));
          return;
        }
        // Only the books this click flips, as they were before it.
        const before = {};
        const flipped = (Array.isArray(ids) ? ids : []).filter(function changes(id) {
          const item = previous.progress[id];
          if (Boolean(item && item.completed) === want) return false;
          if (item) before[id] = item;
          return true;
        });
        setState(function apply(nextState) {
          return Object.assign({}, nextState, { progress: setBooksFinished(nextState.progress, ids, want, Date.now()).progress });
        });
        showToast(fill(t(want ? 'booksFinishedBulk' : 'booksReadingBulk'), { n: preview.changed }), {
          label: t('undo'),
          onClick: function restore() {
            setState(function undo(current) {
              const progress = undoFinishedBulk(current.progress, before, flipped, want);
              return progress === current.progress ? current : Object.assign({}, current, { progress: progress });
            });
          },
        });
      }, [showToast, t]);

      const saveReview = useCallback(function save(bookId, rating, text) {
        const stars = clamp(Math.round(Number(rating) || 0), 0, 5);
        const body = String(text || '').trim().slice(0, 2000);
        setState(function apply(previous) {
          const reviews = Object.assign({}, previous.reviews);
          if (!stars && !body) delete reviews[bookId];
          else reviews[bookId] = { rating: stars, text: body, updatedAt: Date.now() };
          return Object.assign({}, previous, { reviews: reviews });
        });
        showToast(t('reviewSaved'));
      }, [showToast, t]);

      const addBookTag = useCallback(function add(bookId, rawTag) {
        const tag = String(rawTag || '').trim().slice(0, MAX_TAG_LENGTH);
        if (!tag) return;
        setState(function apply(previous) {
          const current = cleanUserTags(previous.userTags && previous.userTags[bookId]);
          if (current.indexOf(tag) >= 0 || current.length >= MAX_BOOK_TAGS) return previous;
          const userTags = Object.assign({}, previous.userTags, { [bookId]: current.concat(tag) });
          return Object.assign({}, previous, { userTags: userTags });
        });
      }, []);

      const removeBookTag = useCallback(function remove(bookId, tag) {
        setState(function apply(previous) {
          const current = cleanUserTags(previous.userTags && previous.userTags[bookId]);
          if (current.indexOf(tag) < 0) return previous;
          const next = current.filter(function keep(item) { return item !== tag; });
          const userTags = Object.assign({}, previous.userTags);
          if (next.length) userTags[bookId] = next;
          else delete userTags[bookId];
          return Object.assign({}, previous, { userTags: userTags });
        });
      }, []);

      const renameNoteTag = useCallback(function rename(oldTag, nextTag) {
        const cleaned = cleanNoteTags([nextTag])[0];
        if (!oldTag || !cleaned || oldTag === cleaned) return;
        setState(function apply(previous) {
          const highlights = renameHighlightTag(previous.highlights, oldTag, cleaned);
          return highlights === previous.highlights ? previous : Object.assign({}, previous, { highlights: highlights });
        });
        showToast(t('tagRenamed'));
      }, [showToast, t]);

      const deleteNoteTag = useCallback(function remove(tag) {
        if (!tag) return;
        setState(function apply(previous) {
          const highlights = removeHighlightTag(previous.highlights, tag);
          return highlights === previous.highlights ? previous : Object.assign({}, previous, { highlights: highlights });
        });
        showToast(t('tagDeleted'));
      }, [showToast, t]);

      const renameBookTag = useCallback(function rename(oldTag, nextTag) {
        const cleaned = cleanUserTags([nextTag])[0];
        if (!oldTag || !cleaned || oldTag === cleaned) return;
        setState(function apply(previous) {
          const userTags = renameBookTagEverywhere(previous.userTags, oldTag, cleaned);
          return userTags === previous.userTags ? previous : Object.assign({}, previous, { userTags: userTags });
        });
        showToast(t('bookTagRenamed'));
      }, [showToast, t]);

      const bulkTagHighlights = useCallback(function bulkTag(highlightIds, rawTag, mode) {
        const ids = Array.isArray(highlightIds) ? highlightIds : [];
        const tag = cleanNoteTags([rawTag])[0];
        if (!tag || !ids.length) return;
        if (mode === 'remove') {
          const preview = removeTagFromHighlights(stateRef.current.highlights, ids, tag);
          if (!preview.removed) {
            showToast(fill(t('bulkTagNoSuch'), { tag: tag }));
            return;
          }
          setState(function apply(previous) {
            const result = removeTagFromHighlights(previous.highlights, ids, tag);
            return result.removed ? Object.assign({}, previous, { highlights: result.items }) : previous;
          });
          showToast(fill(t('bulkTagRemoved'), { n: preview.removed, tag: tag }));
          return;
        }
        const preview = applyTagToHighlights(stateRef.current.highlights, ids, tag);
        if (!preview.applied && !preview.skipped) {
          showToast(fill(t('bulkTagExisting'), { tag: tag }));
          return;
        }
        setState(function apply(previous) {
          const result = applyTagToHighlights(previous.highlights, ids, tag);
          return result.applied ? Object.assign({}, previous, { highlights: result.items }) : previous;
        });
        showToast(preview.skipped
          ? fill(t('bulkTagPartial'), { n: preview.applied, tag: tag, skipped: preview.skipped })
          : fill(t('bulkTagAdded'), { n: preview.applied, tag: tag }));
      }, [showToast, t]);

      // Batch recolor from the notes multi-select bar; one state write, one toast.
      const recolorHighlightsBulk = useCallback(function bulk(highlightIds, color) {
        const preview = recolorHighlights(stateRef.current.highlights, highlightIds, color);
        if (!preview.changed) {
          showToast(t('bulkColorNoChange'));
          return;
        }
        setState(function apply(previous) {
          return Object.assign({}, previous, { highlights: recolorHighlights(previous.highlights, highlightIds, color).items });
        });
        showToast(fill(t('bulkColored'), { n: preview.changed }));
      }, [showToast, t]);

      const bulkTagBooks = useCallback(function bulkTag(bookIds, rawTag, mode) {
        const ids = Array.isArray(bookIds) ? bookIds : [];
        const tag = cleanUserTags([rawTag])[0];
        if (!tag || !ids.length) return;
        if (mode === 'remove') {
          const preview = removeTagFromBooks(stateRef.current.userTags, ids, tag);
          if (!preview.removed) {
            showToast(fill(t('bookTagBulkNoSuch'), { tag: tag }));
            return;
          }
          setState(function apply(previous) {
            const result = removeTagFromBooks(previous.userTags, ids, tag);
            return result.removed ? Object.assign({}, previous, { userTags: result.userTags }) : previous;
          });
          showToast(fill(t('bookTagBulkRemoved'), { n: preview.removed, tag: tag }));
          return;
        }
        const preview = applyTagToBooks(stateRef.current.userTags, ids, tag);
        if (!preview.applied && !preview.skipped) {
          showToast(fill(t('bookTagBulkExisting'), { tag: tag }));
          return;
        }
        setState(function apply(previous) {
          const result = applyTagToBooks(previous.userTags, ids, tag);
          return result.applied ? Object.assign({}, previous, { userTags: result.userTags }) : previous;
        });
        showToast(preview.skipped
          ? fill(t('bookTagBulkPartial'), { n: preview.applied, tag: tag, skipped: preview.skipped })
          : fill(t('bookTagBulkAdded'), { n: preview.applied, tag: tag }));
      }, [showToast, t]);

      const purgeBookTag = useCallback(function purge(tag) {        if (!tag) return;
        setState(function apply(previous) {
          const userTags = removeBookTagEverywhere(previous.userTags, tag);
          return userTags === previous.userTags ? previous : Object.assign({}, previous, { userTags: userTags });
        });
        showToast(t('bookTagDeleted'));
      }, [showToast, t]);

      const exitReader = useCallback(function exit() {
        setReader(null);
        setTab('shelf');
        try {
          const app = document.querySelector('.sr-app');
          if (app) {
            app.style.removeProperty('background');
            app.style.removeProperty('--sr-bg');
          }
          const centerCol = document.querySelector('[class*="_centerCol"]');
          if (centerCol) {
            centerCol.style.removeProperty('background');
          }
        } catch (e) { /* ignore */ }
      }, []);

      useEffect(function sanitizeShelfTheme() {
        if (!reader) {
          try {
            const app = document.querySelector('.sr-app');
            if (app) {
              app.style.removeProperty('background');
              app.style.removeProperty('--sr-bg');
            }
            const centerCol = document.querySelector('[class*="_centerCol"]');
            if (centerCol) {
              centerCol.style.removeProperty('background');
            }
          } catch (e) { /* ignore */ }
        }
      }, [reader]);
      const openBook = useCallback(function open(book) {
        if (book) setDetailId(book.id);
      }, []);

      const jumpFromNote = useCallback(function jump(bookId, chapterIndex, percent) {
        const book = bookMap.get(bookId);
        if (book) openReader(book, chapterIndex, percent);
      }, [bookMap, openReader]);

      function importErrorMessage(error) {
        const code = error && error.message;
        if (code === 'empty') return t('importEmpty');
        if (code === 'wrong-type') return t('importWrongType');
        if (code === 'epub-too-large') return t('epubContentTooLarge');
        if (code === 'epub-unsupported') return t('epubUnsupported');
        if (code === 'epub-invalid' || code === 'epub-empty' || code === 'epub-encrypted') return t('epubError');
        if (code === 'book-drm') return t('importDrm');
        if (code === 'book-unsupported') return t('importUnsupportedVariant');
        if (code === 'book-invalid' || code === 'book-empty') return t('importBookError');
        // Unknown failure: keep the real reason visible so it can be reported instead of guessed at.
        const reason = String(code || '').trim().slice(0, 80);
        if (reason) return fill(t('importFailedReason'), { reason: reason });
        return t('importError');
      }

      // A body has exactly one home: the library folder. There is no browser-storage
      // branch and no hidden disk to fall back to. Once a folder is mounted there is
      // nothing to probe: metadata always fits, and a body that fails to reach disk
      // keeps its text in memory and says so.
      async function ensureLibraryFolder() {
        if (fsDirectory) {
          // After a browser restart the remembered handle says 'prompt'. Ask now,
          // while the import click still counts as a user gesture — asking from
          // the first body write is too late and fails the whole batch.
          try {
            await fsEnsureDirectory();
            return true;
          } catch (error) {
            showToast(fsFailureText(t, error));
            return false;
          }
        }
        if (!fsLibrarySupported()) {
          showToast(t('importNeedsLibrary'));
          return false;
        }
        try {
          const info = await fsChooseDirectory();
          await fsEnsureDirectory();
          setState(function mount(previous) {
            return previous.fsLibrary ? previous : Object.assign({}, previous, { fsLibrary: { name: info.name } });
          });
          try {
            await fsWriteSnapshotNow(stateForStorage(stateRef.current));
          } catch (error) {
            showToast(t('fsSnapshotFailed'));
          }
          return true;
        } catch (error) {
          showToast(fsFailureText(t, error));
          return false;
        }
      }

      function nextPaint() {
        // Do not wait for requestAnimationFrame: background tabs pause it, and a
        // long import must keep making progress even when the tab is hidden.
        return new Promise(function wait(resolve) { setTimeout(resolve, 0); });
      }

      // Parsing is CPU-heavy, especially EPUB unzip and XML extraction. A small
      // worker pool moves that work off the UI thread. If Workers, Blob URLs or the
      // worker script are unavailable, callers fall back to parseFileForImport on
      // the main thread; state and folder writes always stay on the main thread.
      function createParsePool() {
        if (typeof Worker !== 'function' || typeof Blob !== 'function'
          || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function'
          || !PARSE_WORKER_SOURCE) return null;
        let url = '';
        try {
          url = URL.createObjectURL(new Blob([PARSE_WORKER_SOURCE], { type: 'text/javascript' }));
          const size = 1;
          const workers = [];
          const pending = new Map();
          let nextId = 0;
          let broken = false;

          function failAll(message) {
            broken = true;
            pending.forEach(function reject(slot) { slot.reject(new Error(message)); });
            pending.clear();
          }

          let jobsCompleted = 0;
          // Per worker slot: terminate + respawn, rejecting whatever it still holds.
          const failHandlers = [];

          function spawn(workerIndex) {
            const worker = new Worker(url);
            worker.onmessage = function onMessage(event) {
              const job = event.data || {};
              const slot = pending.get(job.id);
              if (!slot) return;
              pending.delete(job.id);
              if (job.ok) slot.resolve({ book: job.book });
              else slot.reject(new Error(job.message || 'parse-worker-error'));

              jobsCompleted += 1;
              if (jobsCompleted >= 30 && !broken) {
                let busy = false;
                pending.forEach(function check(s) {
                  if (s.workerIndex === workerIndex) busy = true;
                });
                if (!busy) {
                  jobsCompleted = 0;
                  try { worker.terminate(); } catch (e) {}
                  workers[workerIndex] = spawn(workerIndex);
                }
              }
            };
            function handleFailure(msg) {
              if (broken) return;
              pending.forEach(function check(slot, id) {
                if (slot.workerIndex === workerIndex) {
                  pending.delete(id);
                  slot.reject(new Error(msg));
                }
              });
              try { worker.terminate(); } catch (e) {}
              if (!broken) workers[workerIndex] = spawn(workerIndex);
            }
            failHandlers[workerIndex] = handleFailure;
            worker.onerror = function onError(errorEvent) {
              if (errorEvent && typeof errorEvent.preventDefault === 'function') errorEvent.preventDefault();
              handleFailure('parse-worker-crash');
            };
            worker.onmessageerror = function onMessageError(errorEvent) {
              if (errorEvent && typeof errorEvent.preventDefault === 'function') errorEvent.preventDefault();
              handleFailure('parse-worker-message');
            };
            return worker;
          }

          for (let index = 0; index < size; index += 1) workers.push(spawn(index));

          return {
            size: size,
            parse: function parse(file) {
              if (broken) return Promise.reject(new Error('parse-worker-broken'));
              return new Promise(function run(resolve, reject) {
                const id = ++nextId;
                const timer = setTimeout(function timeout() {
                  if (!pending.has(id)) return;
                  const slot = pending.get(id);
                  pending.delete(id);
                  reject(new Error('parse-worker-timeout'));
                  // A worker stuck on one file stays stuck: every later job would
                  // wait out its own 60 s behind it. Replace it.
                  const fail = failHandlers[slot.workerIndex];
                  if (typeof fail === 'function') fail('parse-worker-timeout');
                }, 60000);
                const targetWorkerIndex = id % workers.length;
                pending.set(id, {
                  workerIndex: targetWorkerIndex,
                  resolve: function (res) { clearTimeout(timer); resolve(res); },
                  reject: function (err) { clearTimeout(timer); reject(err); },
                });
                const kind = bookFileKind(file.name, file.type);
                try {
                  workers[targetWorkerIndex].postMessage({ id: id, file: file, name: file.name, kind: kind });
                } catch (error) {
                  clearTimeout(timer);
                  pending.delete(id);
                  reject(error);
                }
              });
            },
            dispose: function dispose() {
              broken = true;
              pending.forEach(function reject(slot) { slot.reject(new Error('parse-worker-disposed')); });
              pending.clear();
              workers.forEach(function stop(worker) { try { worker.terminate(); } catch (error) { /* ignore */ } });
              try { URL.revokeObjectURL(url); } catch (error) { /* ignore */ }
            },
          };
        } catch (error) {
          if (url) { try { URL.revokeObjectURL(url); } catch (ignore) { /* ignore */ } }
          return null;
        }
      }

      function dataUrlForRawImage(value) {
        if (!value || !(value.bytes instanceof Uint8Array)) return value;
        return 'data:' + (value.mime || 'image/jpeg') + ';base64,' + bytesToBase64(value.bytes);
      }

      // A failed disk write leaves the book in memory. Convert the import-only raw
      // image buffers to data URLs so the reader can still draw them.
      function materializeRawImages(book) {
        const chapters = Array.isArray(book && book.chapters) ? book.chapters : [];
        let changed = false;
        const next = chapters.map(function each(chapter) {
          if (!chapter || !chapter.images || typeof chapter.images !== 'object') return chapter;
          const images = {};
          Object.keys(chapter.images).forEach(function eachImage(name) {
            const value = chapter.images[name];
            images[name] = dataUrlForRawImage(value);
            if (images[name] !== value) changed = true;
          });
          return changed ? Object.assign({}, chapter, { images: images }) : chapter;
        });
        return changed ? Object.assign({}, book, { chapters: next }) : book;
      }

      function chaptersContentSize(chapters) {
        return (Array.isArray(chapters) ? chapters : []).reduce(function sum(total, chapter) {
          const paragraphs = chapter && Array.isArray(chapter.paragraphs) ? chapter.paragraphs : [];
          return total + paragraphs.reduce(function add(inner, text) { return inner + String(text || '').length; }, 0);
        }, 0);
      }

      // Disk-backed books lose their paragraph arrays after import. Their persisted
      // importSignature is the fast path; older libraries have no such field, so for
      // a same-title candidate read the readable body once and compare its real
      // content size. This is why re-importing a book from before v1.100 is skipped.
      async function matchesExistingBook(book, existingBooks) {
        const signature = importBookSignature(book);
        const title = String(book && book.title || '').trim().toLowerCase();
        const list = Array.isArray(existingBooks) ? existingBooks : [];
        for (let index = 0; index < list.length; index += 1) {
          const candidate = list[index];
          if (!candidate || candidate.id === book.id) continue;
          if (importBookSignature(candidate) === signature) return true;
          if (String(candidate.title || '').trim().toLowerCase() !== title) continue;
          if (candidate.importSignature) continue;
          if (Array.isArray(candidate.chapters) && candidate.chapters.length) continue;
          if (!candidate.chaptersInFs) continue;
          try {
            const chapters = await fsReadBookBody(candidate, { skipImages: true });
            if (title + ':' + chaptersContentSize(chapters) === signature) return true;
          } catch (error) {
            /* unreadable body: do not falsely call it a duplicate */
          }
        }
        return false;
      }

      // Import a batch in a pipeline: workers parse ahead, up to three books are
      // written to the folder concurrently, and finished books are added to the
      // shelf in parse order. Hundreds of EPUBs never pile up in memory; state and
      // the File System Access handles stay on the main thread.
      async function importMany(files) {
        const total = files.length;
        const pool = createParsePool();
        activePoolRef.current = pool;
        const known = new Set();
        const existingByTitle = new Map();
        (Array.isArray(stateRef.current.customBooks) ? stateRef.current.customBooks : []).forEach(function signature(book) {
          known.add(importBookSignature(book));
          const key = String(book && book.title || '').trim().toLowerCase();
          if (!existingByTitle.has(key)) existingByTitle.set(key, []);
          existingByTitle.get(key).push(book);
        });
        const existingSignatures = new Map();

        async function existingSignature(book) {
          if (existingSignatures.has(book.id)) return existingSignatures.get(book.id);
          let signature = null;
          if (book.importSignature) signature = book.importSignature;
          else if (Array.isArray(book.chapters) && book.chapters.length) signature = importBookSignature(book);
          else if (book.chaptersInFs) {
            try {
              const chapters = await fsReadBookBody(book, { skipImages: true });
              signature = String(book.title || '').trim().toLowerCase() + ':' + chaptersContentSize(chapters);
            } catch (error) {
              signature = null;
            }
          }
          existingSignatures.set(book.id, signature);
          return signature;
        }

        async function isDuplicateImport(book, signature) {
          if (known.has(signature)) return true;
          const sameTitle = existingByTitle.get(String(book.title || '').trim().toLowerCase()) || [];
          for (let index = 0; index < sameTitle.length; index += 1) {
            const stored = await existingSignature(sameTitle[index]);
            if (stored && stored === signature) return true;
          }
          return false;
        }
        let firstImportedBook = null;
        const pendingBooks = [];
        let accepted = 0;
        let failed = 0;
        let skipped = 0;
        let unwritten = 0;
        let switched = false;
        const writeQueue = [];
        const maxWrites = 1;

        function flushPending() {
          if (!pendingBooks.length) return;
          const batch = pendingBooks.splice(0, pendingBooks.length);
          setState(function add(previous) {
            const existing = Array.isArray(previous.customBooks) ? previous.customBooks : [];
            const ids = new Set(existing.map(function id(item) { return item.id; }));
            const fresh = batch.filter(function keep(item) { return !ids.has(item.id); });
            if (!fresh.length) return previous;
            return Object.assign({}, previous, { customBooks: fresh.concat(existing) });
          });
        }

        function parsed(file) {
          const fallback = function fallback() {
            return parseFileForImport(file, { skipImageBytes: true }).then(function done(book) {
              return { book: book, file: file, error: null };
            });
          };
          const job = pool ? pool.parse(file) : fallback();
          return job.catch(fallback).then(
            function ok(result) { return { book: result.book, file: file, error: null }; },
            function fail(error) { return { book: null, file: file, error: error }; }
          );
        }

        function writeImportedBook(book, file) {
          if (file) {
            try { fsRememberSource(book.id, file.name, file, isEpubBook(book)); } catch (error) { /* body can still be written */ }
          }
          if (Array.isArray(book.chapters) && book.chapters.length) {
            setCachedChapters(book.id, book.chapters);
          }
          // An EPUB's pictures come back from its original file; every other
          // format keeps them only in the .assets folder, so they are written now.
          return fsWriteNewBookBody(book, { skipImages: isEpubBook(book) }).then(
            function stored() {
              const copy = Object.assign({}, book, {
                chaptersInFs: true,
                chapterCount: Array.isArray(book.chapters) ? book.chapters.length : 0,
                chapterIds: chapterIdsOf(book),
                charCount: bookCharCount(book),
                importSignature: importBookSignature(book),
              });
              delete book.chapters;
              delete copy.chapters;
              fsForgetSource(book.id);
              return { stored: copy, unwritten: false };
            },
            function failed() {
              fsForgetSource(book.id);
              // The folder did not take it, so memory is the only copy: keep the
              // chapters (pictures as data URLs the reader can draw), or the book
              // would sit on the shelf unopenable while its signature blocked any
              // re-import.
              const kept = materializeRawImages(book);
              const copy = Object.assign({}, kept, {
                chaptersInFs: false,
                chapterCount: Array.isArray(book.chapters) ? book.chapters.length : 0,
                chapterIds: chapterIdsOf(book),
                charCount: bookCharCount(book),
                importSignature: importBookSignature(book),
              });
              delete book.chapters;
              return { stored: copy, unwritten: true };
            }
          );
        }

        async function finishWrite(job) {
          const settled = await job;
          accepted += 1;
          if (settled.unwritten) unwritten += 1;
          if (!firstImportedBook) firstImportedBook = settled.stored;
          pendingBooks.push(settled.stored);
          if (accepted === 1 || pendingBooks.length >= 25) flushPending();
          if (!switched) {
            switched = true;
            setTab('shelf');
            setQuery('');
          }
          await new Promise(function yieldTick(res) { setTimeout(res, 20); });
        }

        let nextFileIndex = 0;
        function launchParse() {
          if (nextFileIndex >= files.length) return null;
          const fileIndex = nextFileIndex;
          nextFileIndex += 1;
          const file = files[fileIndex];
          return {
            index: fileIndex,
            file: file,
            promise: parsed(file),
          };
        }

        // Keep at most pool.size tasks parsing at any time (sliding window)
        const parseWindow = [];
        const concurrency = pool ? pool.size : 1;
        for (let i = 0; i < concurrency && i < files.length; i += 1) {
          const task = launchParse();
          if (task) parseWindow.push(task);
        }

        setImportDetailsOpen(false);
        setImportProgress({ total: total, done: 0, ok: 0, fail: 0, skipped: 0, current: '' });
        try {
          while (parseWindow.length > 0) {
            const current = parseWindow.shift();
            const file = current.file;
            const index = current.index;

            const nextTask = launchParse();
            if (nextTask) parseWindow.push(nextTask);

            const report = index === 0 || index % 5 === 0;
            if (report) {
              setImportProgress(function currentProg(previous) {
                return previous ? Object.assign({}, previous, { current: file.name, done: index }) : previous;
              });
              await nextPaint();
            }

            const result = await current.promise;
            current.promise = null;
            current.file = null;

            if (!result || result.error || !result.book) {
              failed += 1;
            } else {
              const book = result.book;
              result.book = null;

              const signature = importBookSignature(book);
              if (await isDuplicateImport(book, signature)) {
                skipped += 1;
                fsForgetSource(book.id);
                delete book.chapters;
              } else {
                known.add(signature);
                writeQueue.push(writeImportedBook(book, file));
                if (writeQueue.length >= maxWrites) await finishWrite(writeQueue.shift());
              }
            }

            if (report || index === files.length - 1 || accepted === 1) {
              setImportProgress(function finishedProg(previous) {
                return previous ? Object.assign({}, previous, {
                  done: index + 1,
                  ok: accepted,
                  fail: failed,
                  skipped: skipped,
                  current: file.name,
                }) : previous;
              });
              await nextPaint();
            }
          }
          while (writeQueue.length) await finishWrite(writeQueue.shift());
          flushPending();
          setDetailId(null);
          if (!accepted) {
            if (failed) showToast(t('importError'));
            else if (skipped) showToast(fill(t('importDuplicateSkipped'), { n: skipped }));
            else showToast(t('importError'));
            return;
          }
          if (unwritten) {
            const folderName = stateRef.current.fsLibrary ? stateRef.current.fsLibrary.name : '';
            showToast(fill(t('fsLibraryPartial'), {
              n: accepted - unwritten,
              fail: unwritten,
              name: folderName,
            }));
            return;
          }
          if (failed) {
            showToast(fill(t('importBatchPartial'), { ok: accepted, fail: failed }));
            return;
          }
          if (skipped) {
            showToast(fill(t('importDuplicateSkipped'), { n: skipped }));
            return;
          }
          showToast(fill(t('importBatchSuccess'), { n: accepted }), {
            label: t('readNow'),
            onClick: function read() {
              setDetailId(null);
              if (firstImportedBook) openReader(firstImportedBook, 0, 0);
            },
          });
        } finally {
          if (pool) pool.dispose();
          if (activePoolRef.current === pool) activePoolRef.current = null;
          while (writeQueue.length) { try { await finishWrite(writeQueue.shift()); } catch (error) { /* keep going */ } }
          flushPending();
          setImportProgress(null);
          setImportDetailsOpen(false);
        }
      }

      async function parseFileForImport(file, options) {
        const kind = bookFileKind(file.name, file.type);
        if (!kind) throw new Error('wrong-type');
        if (kind === 'epub') {
          const book = await parseEpubBook(file.name, file, options);
          // Pass the file/Blob directly without loading hundreds of megabytes into ArrayBuffers
          fsRememberSource(book.id, file.name, file, true);
          return book;
        }
        const buffer = await file.arrayBuffer();
        return parseBookBytesSafely(kind, file.name, new Uint8Array(buffer));
      }

      async function importFiles(fileList) {
        const files = Array.from(fileList || []);
        if (!files.length) return;
        if (importingRef.current) {
          showToast(t('importBusy'));
          return;
        }
        importingRef.current = true;
        try {
          // Bodies live only in the library folder, so the folder comes first: asking
          // before anything touches state means a cancelled picker leaves no
          // half-imported book behind, and the import click supplies the user gesture
          // the directory picker requires.
          if (!(await ensureLibraryFolder())) return;
          if (files.length > 1) {
            await importMany(files);
            return;
          }
          else {
            const singleKind = bookFileKind(files[0].name, files[0].type);
            if (singleKind === 'epub') showToast(t('importingEpub'));
            else if (singleKind && singleKind !== 'text') showToast(t('importingBook'));
          }
          const books = [];
          const errors = [];
          for (let index = 0; index < files.length; index += 1) {
            try {
              books.push(await parseFileForImport(files[index]));
            } catch (error) {
              errors.push(error);
            }
          }
          if (!books.length) {
            showToast(files.length === 1 ? importErrorMessage(errors[0]) : t('importError'));
            return;
          }
          const customBooks = Array.isArray(stateRef.current.customBooks) ? stateRef.current.customBooks : [];
          if (books.length === 1 && await matchesExistingBook(books[0], customBooks)) {
            fsForgetSource(books[0].id);
            setDetailId(null);
            showToast(t('importDuplicateSingle'));
            return;
          }
          // Same file imported twice gets a fresh random id, so dedupe by title + content size instead.
          books.forEach(function markSignature(book) { book.importSignature = importBookSignature(book); });
          const split = splitDuplicateImports(books, customBooks);
          const accepted = split.accepted;
          if (accepted.length) {
            const previous = stateRef.current;
            const ids = new Set(accepted.map(function id(book) { return book.id; }));
            const next = Object.assign({}, previous, {
              customBooks: accepted.concat((previous.customBooks || []).filter(function keep(book) { return !ids.has(book.id); })),
            });
            setState(next);
            setTab('shelf');
            setQuery('');
          }
          const parkedBodies = accepted.length ? await persistBodies(accepted) : [];
          const folderName = stateRef.current.fsLibrary ? stateRef.current.fsLibrary.name : '';
          const leftBehind = folderName ? unwrittenBookIds(accepted, parkedBodies) : [];
          if (leftBehind.length) {
            // The folder is the copy the Agent can read; a book stuck in browser
            // storage is not "saved" in the sense the user asked for.
            showToast(fill(t('fsLibraryPartial'), {
              n: accepted.length - leftBehind.length,
              fail: leftBehind.length,
              name: folderName,
            }));
            return;
          }
          if (files.length === 1 && errors.length === 0) {
            if (accepted.length === 1) {
              const importedBook = accepted[0];
              setDetailId(importedBook.id);
              showToast(fill(t('importSuccess'), { title: importedBook.title }), {
                label: t('readNow'),
                onClick: function read() {
                  setDetailId(null);
                  openReader(importedBook, 0, 0);
                },
              });
              return;
            }
            if (split.skipped.length) {
              setDetailId(null);
              showToast(t('importDuplicateSingle'));
              return;
            }
          }
          setDetailId(null);
          if (!accepted.length) {
            showToast(t('importDuplicateSingle'));
            return;
          }
          const failed = errors.length + (books.length - accepted.length - split.skipped.length);
          if (failed) showToast(fill(t('importBatchPartial'), { ok: accepted.length, fail: failed }));
          else if (split.skipped.length) showToast(fill(t('importDuplicateSkipped'), { n: split.skipped.length }));
          else showToast(fill(t('importBatchSuccess'), { n: accepted.length }), {
            label: t('readNow'),
            onClick: function read() {
              setDetailId(null);
              openReader(accepted[0], 0, 0);
            },
          });
        } catch (error) {
          // Never fail silently: the toast carries the reason and the busy flag is released below.
          showToast(importErrorMessage(error));
        } finally {
          importingRef.current = false;
          // Every save during the import was skipped, and the last shelf update may
          // already have rendered: without this nudge it would never reach
          // localStorage or library.json.
          setPersistTick(function bump(tick) { return tick + 1; });
        }
      }

      function importFile(event) {
        // Snapshot the FileList first: clearing input.value can empty the live FileList in some browsers.
        const files = Array.from((event.target && event.target.files) || []);
        if (event.target) event.target.value = '';
        if (files.length) importFiles(files);
      }

      async function importPastedBook(input) {
        const title = String(input.title || '').trim() || t('pasteUntitled');
        const author = String(input.author || '').trim();
        const text = String(input.text || '');
        if (!text.trim()) {
          showToast(t('importEmpty'));
          return false;
        }
        try {
          // Same rule as the file import: the folder is settled before any state
          // changes, so a cancelled picker leaves nothing behind.
          if (!(await ensureLibraryFolder())) return false;
          const parsed = parseImportedBook(title + '.txt', text);
          const book = withBookMetadata(parsed, { title: title, author: author || parsed.author });
          const customBooks = Array.isArray(stateRef.current.customBooks) ? stateRef.current.customBooks : [];
          if (await matchesExistingBook(book, customBooks)) {
            showToast(t('importDuplicateSingle'));
            return false;
          }
          book.importSignature = importBookSignature(book);
          // Pasting the same article twice would otherwise add a second identical book.
          const split = splitDuplicateImports([book], customBooks);
          if (!split.accepted.length) {
            showToast(t('importDuplicateSingle'));
            return false;
          }
          const next = Object.assign({}, stateRef.current, {
            customBooks: [book].concat(stateRef.current.customBooks || []),
          });
          setState(next);
          setTab('shelf');
          setQuery('');
          setDetailId(book.id);
          setPasteOpen(false);
          showToast(fill(t('importSuccess'), { title: book.title }), {
            label: t('readNow'),
            onClick: function read() {
              setDetailId(null);
              openReader(book, 0, 0);
            },
          });
          persistBodies([book]);
          return true;
        } catch (error) {
          showToast(error && error.message === 'empty' ? t('importEmpty') : t('importError'));
          return false;
        }
      }

      function triggerImport() {
        if (fileRef.current) fileRef.current.click();
      }

      async function exportBackup() {
        // A body on disk is not in memory until something reads it, and a backup
        // without the text is not a backup. Read each one into a copy of the
        // library — never into state, which keeps bodies on demand.
        const current = stateRef.current;
        const books = Array.isArray(current.customBooks) ? current.customBooks : [];
        let folderReady = null;
        let missing = 0;
        const customBooks = [];
        for (let index = 0; index < books.length; index += 1) {
          const book = books[index];
          if (!book || book.chaptersInFs !== true || (Array.isArray(book.chapters) && book.chapters.length)) {
            customBooks.push(book);
            continue;
          }
          let chapters = null;
          try {
            if (folderReady === null) {
              folderReady = await fsEnsureDirectory().then(function ok() { return true; }, function no() { return false; });
            }
            if (folderReady) chapters = await fsReadBookBody(book);
          } catch (error) {
            chapters = null;
          }
          if (Array.isArray(chapters) && chapters.length) {
            // The body travels inside the backup, so the restored book must not
            // claim it lives in a folder: a different folder would not have it.
            customBooks.push(Object.assign({}, book, { chapters: chapters, chaptersInFs: false }));
          } else {
            missing += 1;
            customBooks.push(book);
          }
        }
        const payload = makeBackupPayload(Object.assign({}, current, { customBooks: customBooks }));
        const ok = downloadTextFile('shiguang-reader-backup-' + dayKey() + '.json', JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
        if (!ok) showToast(t('exportFailed'));
        else showToast(missing ? t('fsBodyMissing') : t('backupExported'));
      }

      function exportBooklistPalette() {
        const markdown = booklistMarkdown(allBooks, stateRef.current, t);
        const filename = 'shiguang-booklist-' + dayKey() + '.md';
        const ok = downloadMarkdownFile(filename, markdown);
        showToast(ok ? t('booklistExported') : t('exportFailed'));
      }

      function copyBookTitlesPalette() {
        const text = buildBookTitlesText(allBooks);
        if (!text) return;
        copyTextToClipboard(text).then(function done(ok) {
          showToast(ok ? fill(t('bookTitlesCopied'), { n: allBooks.length }) : t('copyFailed'));
        });
      }

      function showTodaySummaryPalette() {
        const key = dayKey();
        const todaySeconds = (stateRef.current.stats && stateRef.current.stats.days && stateRef.current.stats.days[key]) || 0;
        if (!todaySeconds) {
          showToast(t('todaySummaryEmpty'));
          return;
        }
        const todayRows = sessionsOnDay(stateRef.current.sessions, key);
        const bookIds = new Set(todayRows.map(function b(r) { return r.bookId; }).filter(Boolean));
        const bookCount = bookIds.size || 1;
        showToast(fill(t('todaySummaryToast'), { time: formatDuration(todaySeconds, t), books: bookCount }));
      }

      function triggerRestoreBackup() {
        if (backupRef.current) backupRef.current.click();
      }

      async function restoreBackup(event) {
        const file = event.target.files && event.target.files[0];
        if (event.target) event.target.value = '';
        if (!file) return;
        if (file.size > 30 * 1024 * 1024) {
          showToast(t('backupTooLarge'));
          return;
        }
        try {
          const next = parseBackupPayload(await file.text());
          const previous = stateRef.current;
          setState(next);
          // persistBodies is a no-op without a mounted folder; a body it cannot write
          // (an EPUB whose original is not in this folder) stays in state as before.
          if (fsDirectory) persistBodies(restoredBodiesToPersist(next));
          setReader(null);
          setDetailId(null);
          setTab('shelf');
          setQuery('');
          showToast(t('backupRestored'), {
            label: t('undo'),
            onClick: function restorePrevious() {
              // Undoing a restore is meant to bring the whole library back as it
              // was. The one thing worth keeping from the undo window is a book
              // that arrived in it (an import finishing): its body is already in
              // the folder, and dropping its shelf entry would orphan it.
              setState(function undo(current) {
                const known = new Set((previous.customBooks || []).concat(next.customBooks || []).map(function id(book) { return book && book.id; }));
                const arrived = (Array.isArray(current.customBooks) ? current.customBooks : []).filter(function fresh(book) {
                  return book && !known.has(book.id);
                });
                if (!arrived.length) return previous;
                return Object.assign({}, previous, { customBooks: arrived.concat(previous.customBooks || []) });
              });
              setTab('shelf');
            },
          });
        } catch (error) {
          showToast(t('backupInvalid'));
        }
      }

      function isFileDrag(event) {
        const transfer = event.dataTransfer;
        if (!transfer) return false;
        return Array.prototype.indexOf.call(transfer.types || [], 'Files') >= 0;
      }

      function onDragEnter(event) {
        if (!isFileDrag(event)) return;
        event.preventDefault();
        dragDepth.current += 1;
        setDragActive(true);
      }

      function onDragOver(event) {
        if (!isFileDrag(event)) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
      }

      function onDragLeave(event) {
        if (!dragActive) return;
        event.preventDefault();
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragActive(false);
      }

      function onDrop(event) {
        const files = event.dataTransfer && event.dataTransfer.files;
        if (!files || !files.length) return;
        event.preventDefault();
        dragDepth.current = 0;
        setDragActive(false);
        importFiles(files);
      }

      // The folder the library used before a re-pick, if it is a different folder
      // and can still be read — the only place disk-only bodies can come from.
      async function readablePreviousRoot(previousRoot) {
        if (!previousRoot || previousRoot === fsDirectory) return null;
        try {
          if (typeof previousRoot.isSameEntry === 'function' && await previousRoot.isSameEntry(fsDirectory)) return null;
          const options = { mode: 'read' };
          let permission = await previousRoot.queryPermission(options);
          if (permission !== 'granted') permission = await previousRoot.requestPermission(options);
          return permission === 'granted' ? previousRoot : null;
        } catch (error) {
          return null;
        }
      }

      // Points the library at a real folder, then moves every existing body into it.
      const chooseLibraryDir = useCallback(async function choose() {
        if (!fsLibrarySupported()) {
          showToast(t('fsUnsupported'));
          return;
        }
        try {
          const previousRoot = fsDirectory;
          const info = await fsChooseDirectory();
          await fsEnsureDirectory();
          const oldRoot = await readablePreviousRoot(previousRoot);
          const books = (stateRef.current.customBooks || []).slice();
          const written = [];
          const done = [];
          for (let index = 0; index < books.length; index += 1) {
            const book = books[index];
            try {
              // A body that lives only on disk has nothing in memory to write: an
              // attempt would replace the text with an empty file. It is either
              // already in this folder (the same folder picked again, or one moved
              // here), or its files are carried over from the previous folder.
              if (book.chaptersInFs === true) {
                if (await fsHasBookBody(book)) {
                  done.push(book.id);
                  continue;
                }
                if (oldRoot && await fsCopyBookFromDirectory(oldRoot, book)) {
                  done.push(book.id);
                  continue;
                }
              }
              if (!(Array.isArray(book.chapters) && book.chapters.length)) continue;
              await fsWriteBookBody(book);
              written.push(book.id);
              done.push(book.id);
            } catch (error) {
              /* This book keeps its body where it was. */
            }
          }
          // Only books whose chapters were just written get new chapter ids from
          // them; a book copied or found on disk keeps the ids it already has.
          const next = Object.assign({}, stateRef.current, { fsLibrary: { name: info.name } });
          if (written.length) {
            next.customBooks = stripDiskBackedBodies(markBodiesOnDisk(next, written), true).customBooks;
          }
          // The snapshot is what the Host reads, so prove it is writable before
          // telling the user the folder is ready — a folder that takes bodies but
          // not library.json would look fine and silently break `reading_search`.
          let snapshotOk = true;
          try {
            await fsWriteSnapshotNow(stateForStorage(next));
          } catch (error) {
            snapshotOk = false;
          }
          setState(next);
          const unwritten = unwrittenBookIds(books, done);
          if (!snapshotOk) showToast(t('fsSnapshotFailed'));
          else if (unwritten.length) showToast(fill(t('fsLibraryPartial'), { n: done.length, fail: unwritten.length, name: info.name }));
          else showToast(fill(t('fsLibraryReady'), { n: done.length, name: info.name }));
        } catch (error) {
          showToast(fsFailureText(t, error));
        }
      }, [showToast, t]);

      // A body file leaves the folder only after the undo window has closed — the
      // undo button restores metadata alone, so a file deleted at the click would
      // leave the restored book unopenable. The delay outlives the 5200 ms undo
      // toast; taking the undo cancels the removal outright.
      function scheduleBodyRemoval(ids) {
        return deferBodyRemoval(ids, function remove(id) {
          bookChaptersCache.delete(id);
          if (!fsDirectory) return;
          fsDeleteBookBody(id).catch(function ignore() {});
        }, 6000, window.setTimeout, window.clearTimeout);
      }

      const removeCustomBook = useCallback(function remove(bookId) {
        const previous = stateRef.current;
        const preview = removeBooksFromState(previous, [bookId]);
        if (!preview.removed.length) return;
        setState(preview.state);
        const cancelRemoval = scheduleBodyRemoval([bookId]);
        setDetailId(null);
        showToast(t('bookRemoved'), {
          label: t('undo'),
          onClick: function restore() {
            cancelRemoval();
            setState(function undo(current) { return restoreRemovedBooks(current, previous, preview.removed); });
          },
        });
      }, [showToast, t]);

      // Batch delete from the shelf; one state write, one toast, undoable as a whole.
      const deleteBooks = useCallback(function removeMany(ids) {
        const previous = stateRef.current;
        const preview = removeBooksFromState(previous, ids);
        if (!preview.removed.length) {
          showToast(t('deleteBooksNone'));
          return 0;
        }
        setState(preview.state);
        const cancelRemoval = scheduleBodyRemoval(preview.removed);
        setDetailId(null);
        showToast(fill(t('booksDeleted'), { n: preview.removed.length }), {
          label: t('undo'),
          onClick: function restore() {
            cancelRemoval();
            setState(function undo(current) { return restoreRemovedBooks(current, previous, preview.removed); });
          },
        });
        return preview.removed.length;
      }, [showToast, t]);

      const currentBook = useMemo(function findCurrent() {
        if (!reader) return null;
        let found = bookMap.get(reader.bookId);
        if (!found) {
          const custom = Array.isArray(state.customBooks) ? state.customBooks : [];
          found = custom.find(function(b) { return b && b.id === reader.bookId; });
        }
        if (!found) return null;
        if (Array.isArray(found.chapters) && found.chapters.length) return found;
        if (bookChaptersCache.has(found.id)) {
          const cached = bookChaptersCache.get(found.id);
          if (Array.isArray(cached) && cached.length) {
            return Object.assign({}, found, { chapters: cached });
          }
        }
        return null;
      }, [reader, bookMap, state.customBooks, cacheTick]);
      const paletteShortcutLabel = /Mac|iPhone|iPad/i.test(
        (typeof navigator !== 'undefined' && (navigator.platform || navigator.userAgent)) || '',
      ) ? '⌘K' : 'Ctrl K';
      const paletteActions = [
        { id: 'import', label: t('importBook'), hint: t('paletteHintImport'), icon: 'upload', run: triggerImport },
        { id: 'paste', label: t('pasteImport'), hint: t('paletteHintPaste'), icon: 'clipboard', run: function openPaste() { setPasteOpen(true); } },
        {
          id: 'surprise',
          label: t('surpriseMe'),
          hint: t('paletteHintSurprise'),
          icon: 'sparkle',
          run: function random() {
            const pick = pickRandomBook(allBooks, stateRef.current.progress, Math.random());
            if (pick) openReader(pick);
          },
        },
        {
          id: 'surpriseQuote',
          label: t('surpriseQuote'),
          hint: t('paletteHintSurpriseQuote'),
          icon: 'quote',
          run: function randomQuote() {
            const pick = pickRandomHighlight(stateRef.current.highlights, Math.random());
            if (pick) {
              openPaletteNote(pick);
            } else {
              showToast(t('noHighlights'));
            }
          },
        },
        { id: 'shelf', label: t('navShelf'), hint: t('paletteHintShelf'), icon: 'book', run: function goShelf() { setTab('shelf'); } },
        { id: 'notes', label: t('navNotes'), hint: t('paletteHintNotes'), icon: 'pen', run: function goNotes() { setTab('notes'); } },
        { id: 'stats', label: t('navStats'), hint: t('paletteHintStats'), icon: 'chart', run: function goStats() { setTab('stats'); } },
        { id: 'today', label: t('todayReadingSummary'), hint: t('paletteHintTodaySummary'), icon: 'clock', run: showTodaySummaryPalette },
        { id: 'titles', label: t('copyBookTitles'), hint: t('paletteHintCopyTitles'), icon: 'copy', run: copyBookTitlesPalette },
        { id: 'booklist', label: t('exportBooklist'), hint: t('paletteHintBooklist'), icon: 'list', run: exportBooklistPalette },
        { id: 'backup', label: t('exportBackup'), hint: t('paletteHintBackup'), icon: 'download', run: exportBackup },
        { id: 'restore', label: t('restoreBackup'), hint: t('paletteHintRestore'), icon: 'refresh', run: triggerRestoreBackup },
      ];
      if (state.fsLibrary && fsLibrarySupported()) {
        paletteActions.push({
          id: 'cleanup',
          label: t('fsCleanupOrphans'),
          hint: t('paletteHintCleanup'),
          icon: 'trash',
          run: cleanOrphanBodies,
        });
      }
      const paletteRecent = Object.keys(state.progress || {})
        .sort(function latest(a, b) {
          return ((state.progress[b] || {}).updatedAt || 0) - ((state.progress[a] || {}).updatedAt || 0);
        })
        .map(function resolve(id) { return bookMap.get(id); })
        .filter(Boolean)
        .slice(0, 4);
      const paletteMarks = {};
      Object.keys(state.progress || {}).forEach(function collect(id) {
        const item = state.progress[id];
        if (item && item.chapterMarks) paletteMarks[id] = item.chapterMarks;
      });

      function openPaletteChapter(book, chapterIndex, percent) {
        openReader(book, chapterIndex, percent || 0);
      }

      function openPaletteNote(note) {
        const book = bookMap.get(note.bookId);
        if (!book) return;
        const chapter = Array.isArray(book.chapters) ? book.chapters[note.chapterIndex] : null;
        const body = chapter ? chapterText(chapter) : '';
        const percent = body.length ? clamp(note.start / body.length, 0, 1) : 0;
        openReader(book, note.chapterIndex, percent);
      }

      const tabs = [
        { id: 'shelf', label: t('navShelf'), count: allBooks.length },
        { id: 'notes', label: t('navNotes'), count: state.highlights.length },
        { id: 'stats', label: t('navStats'), count: 0 },
      ];

      const header = h('header', { className: 'sr-header', 'data-window-drag': 'true' },
        h('div', { className: 'sr-header-inner' },
          h('div', { className: 'sr-brand' },
            h('div', { className: 'sr-brand-mark' }, h(BrandMark, { size: 21 })),
            h('div', { className: 'sr-brand-text' },
              h('h1', { className: 'sr-brand-title' }, t('brand')),
              importProgress ? h('button', {
                type: 'button',
                className: 'sr-brand-import-pill' + (importDetailsOpen ? ' sr-brand-import-pill--active' : ''),
                title: fill(t('importProgressStats'), {
                  ok: importProgress.ok,
                  skipped: importProgress.skipped,
                  fail: importProgress.fail,
                }) + (importProgress.current ? '\n' + fill(t('importProgressCurrent'), { name: importProgress.current }) : ''),
                onClick: function toggleDetails(e) {
                  e.stopPropagation();
                  setImportDetailsOpen(function (prev) { return !prev; });
                },
              },
                h(Icon, { name: 'refresh', size: 10, className: 'sr-spin' }),
                h('span', { className: 'sr-brand-import-label' }, t('importProgressShortPrefix')),
                h('span', { className: 'sr-brand-import-count' }, importProgress.done + '/' + importProgress.total),
                h('span', { className: 'sr-brand-import-pct' }, Math.round((importProgress.done / Math.max(1, importProgress.total)) * 100) + '%'),
                h('span', {
                  className: 'sr-brand-import-bar',
                  style: { width: Math.round((importProgress.done / Math.max(1, importProgress.total)) * 100) + '%' },
                }),
              ) : h('span', { className: 'sr-brand-sub' }, t('brandSub')),
            ),
            importProgress && importDetailsOpen ? h('div', {
              className: 'sr-import-progress',
              role: 'status',
              'aria-live': 'polite',
            },
              h('div', { className: 'sr-import-progress-head' },
                h('div', { className: 'sr-import-progress-title-wrap' },
                  h(Icon, { name: 'refresh', size: 12, className: 'sr-spin' }),
                  h('strong', null, t('importProgressTitle')),
                  h('span', { className: 'sr-import-progress-count' }, importProgress.done + ' / ' + importProgress.total),
                ),
                h('button', {
                  type: 'button',
                  className: 'sr-import-progress-btn',
                  title: t('close'),
                  onClick: function closeDetails(e) {
                    e.stopPropagation();
                    setImportDetailsOpen(false);
                  },
                }, h(Icon, { name: 'close', size: 11 })),
              ),
              h('div', { className: 'sr-import-progress-track' },
                h('span', { style: { width: Math.round((importProgress.done / Math.max(1, importProgress.total)) * 100) + '%' } }),
              ),
              h('div', { className: 'sr-import-progress-file' }, fill(t('importProgressCurrent'), { name: importProgress.current || '…' })),
              h('div', { className: 'sr-import-progress-stats' }, fill(t('importProgressStats'), {
                ok: importProgress.ok,
                skipped: importProgress.skipped,
                fail: importProgress.fail,
              })),
              h('div', { className: 'sr-import-progress-hint' }, t('importProgressHint')),
            ) : null,
          ),
          h('div', { className: 'sr-nav', role: 'tablist', 'aria-label': t('brand') },
            tabs.map(function nav(item) {
              return h('button', {
                key: item.id,
                type: 'button',
                className: 'sr-nav-item',
                role: 'tab',
                'aria-selected': tab === item.id,
                onClick: function switchTab() { setTab(item.id); },
              },
                h('span', null, item.label),
                item.count ? h('span', { className: 'sr-nav-count' }, item.count) : null,
              );
            }),
          ),
          h('div', { className: 'sr-header-actions' },
            h('button', {
              type: 'button',
              className: 'sr-palette-trigger',
              onClick: function openPalette() { setPaletteOpen(true); },
              title: t('paletteTitle'),
              'aria-label': t('paletteTitle'),
            },
              h(Icon, { name: 'search', size: 12 }),
              h('span', { className: 'sr-palette-trigger-label' }, t('paletteTrigger')),
              h('kbd', null, paletteShortcutLabel),
            ),
            tab === 'shelf' ? h('label', { className: 'sr-search' },
              h(Icon, { name: 'search', size: 14 }),
              h('input', {
                type: 'search',
                value: query,
                placeholder: t('searchPlaceholder'),
                'aria-label': t('searchAria'),
                onChange: function change(event) { setQuery(event.target.value); },
              }),
            ) : null,
            h('button', { type: 'button', className: 'sr-btn sr-btn-icon-only', onClick: function openPaste() { setPasteOpen(true); }, title: t('pasteImport'), 'aria-label': t('pasteImport') },
              h(Icon, { name: 'clipboard', size: 14 }),
            ),
            h('button', { type: 'button', className: 'sr-btn sr-btn-primary', onClick: triggerImport, title: t('importHint') },
              h(Icon, { name: 'upload', size: 14 }),
              h('span', null, t('importBook')),
            ),
          ),
        ),
        tab === 'shelf' ? h('div', { className: 'sr-mobile-search' },
          h(Icon, { name: 'search', size: 14 }),
          h('input', {
            type: 'search',
            value: query,
            placeholder: t('searchPlaceholder'),
            'aria-label': t('searchAria'),
            onChange: function change(event) { setQuery(event.target.value); },
          }),
        ) : null,
      );

      const content = tab === 'shelf'
        ? h(ShelfView, {
          state: state,
          books: allBooks,
          highlights: state.highlights,
          t: t,
          query: query,
          showToast: showToast,
          onOpenBook: openBook,
          onContinueBook: handleContinue,
          onClearSearch: function clear() { setQuery(''); },
          onImport: triggerImport,
          onExportBackup: exportBackup,
          onRestoreBackup: triggerRestoreBackup,
          onSortChange: updateShelfSort,
          onViewChange: updateShelfView,
          onJumpContent: jumpFromNote,
          userTags: state.userTags || {},
          onRenameTag: renameBookTag,
          onDeleteTag: purgeBookTag,
          onSetPinned: setPinned,
          onBulkTag: bulkTagBooks,
          onDeleteBooks: deleteBooks,
          onPickLibraryDir: chooseLibraryDir,
          onCleanOrphans: cleanOrphanBodies,
          fsLibrary: state.fsLibrary || null,
          fsSupported: fsLibrarySupported(),
          shelfTagFilter: shelfTagFilter,
          onClearShelfTagFilter: function clearShelfTag() { setShelfTagFilter(''); },
          onSetFinished: setFinishedBulk,
          onSetShelved: setShelvedBulk,
          onSetWishlist: setWishlistBulk,
        })
        : tab === 'notes'
          ? h(NotesView, {
            books: allBooks,
            highlights: state.highlights,
            bookmarks: state.bookmarks,
            t: t,
            onJump: jumpFromNote,
            onDeleteHighlight: deleteHighlight,
            onUpdateHighlight: updateHighlight,
            onDeleteBookmark: removeBookmark,
            onBulkDelete: deleteAnnotations,
            onUpdateBookmark: updateBookmark,
            reviews: state.reviews || {},
            onOpenBook: openBook,
            onRenameTag: renameNoteTag,
            onDeleteTag: deleteNoteTag,
            onBulkTag: bulkTagHighlights,
            onBulkColor: recolorHighlightsBulk,
            showToast: showToast,
          })
          : h(StatsView, {
            books: allBooks,
            highlights: state.highlights,
            state: state,
            t: t,
            onOpen: openBook,
            onUpdateGoal: updateGoal,
            onClearStats: clearReadingStats,
            onClearAnnotations: clearAnnotations,
            onResetAll: resetAllData,
            onExportBackup: exportBackup,
            showToast: showToast,
          });

      const shell = h('div', {
        className: 'sr-shell',
        onDragEnter: onDragEnter,
        onDragOver: onDragOver,
        onDragLeave: onDragLeave,
        onDrop: onDrop,
      },
        header,
        h('div', { className: 'sr-scroll', ref: scrollRef },
          h('div', { className: 'sr-content' }, content),
        ),
        dragActive
          ? h('div', { className: 'sr-drop-overlay', 'aria-hidden': 'true' },
            h('div', { className: 'sr-drop-card' },
              h(Icon, { name: 'upload', size: 30 }),
              h('strong', null, t('dropBook')),
              h('span', null, t('dropBookHint')),
            ),
          )
          : null,
      );

      return h('div', { className: 'sr-app' },
        h('style', null, CSS),
        currentBook && reader
          ? h(Reader, {
            key: reader.sessionKey,
            book: currentBook,
            initialChapterIndex: reader.chapterIndex,
            initialPercent: reader.percent,
            settings: state.settings,
            highlights: state.highlights,
            bookmarks: state.bookmarks,
            chapterMarks: (state.progress[currentBook.id] && state.progress[currentBook.id].chapterMarks) || {},
            t: t,
            onUpdateSettings: updateSettings,
            onProgress: handleProgress,
            onFinish: handleFinish,
            onExit: exitReader,
            addHighlight: addHighlight,
            deleteHighlight: deleteHighlight,
            updateHighlight: updateHighlight,
            addBookmark: addBookmark,
            removeBookmark: removeBookmark,
            onUpdateBookmark: updateBookmark,
            onAddSeconds: addReadingSeconds,
            onSessionEnd: addReadingSession,
            showToast: showToast,
          })
          : shell,
        pasteOpen ? h(PasteImportDialog, {
          t: t,
          onClose: function close() { setPasteOpen(false); },
          onImport: importPastedBook,
        }) : null,
        !currentBook && detailBook
          ? h(BookDetail, {
            book: detailBook,
            progress: state.progress[detailBook.id],
            t: t,
            onClose: function close() { setDetailId(null); },
            onRead: openReader,
            onRemove: removeCustomBook,
            onUpdateBook: updateBookMetadata,
            onUpdateCover: updateBookCover,
            showToast: showToast,
            pinned: (state.pins || []).indexOf(detailBook.id) >= 0,
            wishlisted: (state.wishlist || []).indexOf(detailBook.id) >= 0,
            onToggleWishlist: toggleWishlist,
            shelved: (state.shelved || []).indexOf(detailBook.id) >= 0,
            onToggleShelved: toggleShelved,
            onToggleFinished: toggleFinished,
            review: (state.reviews || {})[detailBook.id] || null,
            onSaveReview: saveReview,
            similar: similarBooks(detailBook, allBooks, 4),
            bookSessions: sessionsForBook(state.sessions, detailBook.id, 3),
            onOpenBook: openBook,
            onTogglePin: togglePin,
            userTags: (state.userTags || {})[detailBook.id] || [],
            onAddTag: addBookTag,
            onRemoveTag: removeBookTag,
            readingSeconds: Number(state.stats.byBook[detailBook.id]) || 0,
            dailyPaceSeconds: averageDailySeconds(state.stats.days || {}, 7),
            noteCount: state.highlights.filter(function countNote(item) { return item.bookId === detailBook.id; }).length,
            bookmarkCount: state.bookmarks.filter(function countBookmark(item) { return item.bookId === detailBook.id; }).length,
            notes: state.highlights
              .filter(function bookNote(item) { return item.bookId === detailBook.id; })
              .sort(function latest(a, b) { return b.createdAt - a.createdAt; }),
            bookNotes: state.bookmarks.filter(function bookBookmark(item) { return item.bookId === detailBook.id; }),
          })
          : null,
        h('input', {
          ref: fileRef,
          type: 'file',
          multiple: true,
          accept: BOOK_FILE_ACCEPT,
          className: 'sr-hidden-input',
          tabIndex: -1,
          'aria-hidden': 'true',
          onChange: importFile,
        }),
        h('input', {
          ref: backupRef,
          type: 'file',
          accept: '.json,application/json',
          className: 'sr-hidden-input',
          tabIndex: -1,
          'aria-hidden': 'true',
          onChange: restoreBackup,
        }),
        paletteOpen ? h(CommandPalette, {
          t: t,
          books: allBooks,
          highlights: state.highlights,
          userTags: state.userTags || {},
          progress: state.progress || {},
          bookMarks: paletteMarks,
          recent: paletteRecent,
          actions: paletteActions,
          onOpenBook: function openPaletteBook(book) { handleContinue(book); },
          onOpenChapter: openPaletteChapter,
          onOpenNote: openPaletteNote,
          onSelectTag: function selectPaletteTag(tag) {
            setTab('shelf');
            setReader(null);
            setDetailId(null);
            setShelfTagFilter(tag);
          },
          onClose: function closePalette() { setPaletteOpen(false); },
        }) : null,
        toast
          ? h('div', { className: 'sr-toast', key: toast.key, role: 'status' },
            h(Icon, { name: 'check', size: 14 }),
            h('span', { className: 'sr-toast-text' }, toast.message),
            toast.action ? h('button', {
              type: 'button',
              className: 'sr-toast-action',
              onClick: runToastAction,
            }, toast.action.label) : null,
          )
          : null,
      );
    }

    const ComponentBase = (React && React.Component) || class MockComponent {};

    class ReadingErrorBoundary extends ComponentBase {
      constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
      }
      static getDerivedStateFromError(error) {
        return { hasError: true, error: error };
      }
      componentDidCatch(error, errorInfo) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[shiguang-reader] Recovered from render error:', error, errorInfo);
        }
      }
      render() {
        if (this.state.hasError) {
          const t = translate;
          const that = this;
          return h('div', {
            className: 'sr-app',
            style: { padding: '40px 24px', textAlign: 'center', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
          },
            h('style', null, CSS),
            h('div', {
              className: 'sr-empty',
              style: { maxWidth: 460, margin: '0 auto', background: 'var(--dsw-alias-bg-layer-2)', padding: '36px 28px', borderRadius: 16, border: '1px solid var(--dsw-alias-border-l1)' },
            },
              h(Icon, { name: 'book-open', size: 44 }),
              h('h3', { style: { margin: '18px 0 8px', fontSize: 18, fontWeight: 600 } }, t('crashRecoverTitle')),
              h('p', { style: { opacity: 0.75, fontSize: 14, lineHeight: 1.6, marginBottom: 24 } }, t('crashRecoverHint')),
              h('button', {
                type: 'button',
                className: 'sr-btn sr-btn--primary',
                style: { padding: '8px 20px', borderRadius: 8, cursor: 'pointer' },
                onClick: function reset() {
                  that.setState({ hasError: false, error: null });
                },
              }, t('crashRecoverAction'))
            )
          );
        }
        return this.props.children;
      }
    }

    function ReadingAppRoot(props) {
      return h(ReadingErrorBoundary, null, h(ReadingApp, props));
    }

    function PanelIcon(props) {
      const size = props && props.size ? props.size : 20;
      return h(Icon, { name: 'book-open', size: size, strokeWidth: 1.6 });
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        const locale = typeof ctx.get === 'function' ? ctx.get('locale') : undefined;
        localeService = locale || null;
        translate = makeTranslate(localeService);
        try {
          layoutService = (typeof ctx.get === 'function' ? ctx.get('layout') : null) || null;
        } catch (error) {
          layoutService = null;
        }

        if (localeService) {
          ctx.effect(function registerDictionaries() {
            const disposers = [];
            function add(localeId, dict) {
              try {
                disposers.push(localeService.register(NS, localeId, dict));
              } catch (error) {
                /* Duplicate or unsupported locale tag: keep the other registrations. */
              }
            }
            ['zh-CN', 'zh', 'zh-Hans'].forEach(function zh(id) { add(id, ZH); });
            ['en', 'en-US'].forEach(function en(id) { add(id, EN); });
            return function cleanup() {
              disposers.forEach(function dispose(fn) {
                try { fn(); } catch (error) { /* ignore */ }
              });
            };
          }, 'shiguang-reader:dictionaries');
        }

        ctx.slots.inject('sidebar.panellist', function sidebarEntry() {
          return ctx.slots.register({
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: 26,
            label: function label() { return translate('brand'); },
          }, PanelIcon);
        });

        ctx.slots.inject('main', function mainPanel() {
          return ctx.slots.register({
            name: 'main',
            key: PANEL_ID,
          }, ReadingAppRoot);
        });
      },
    };
