    const EPUB_ENTITY_MAP = {
      amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
      mdash: '—', ndash: '–', hellip: '…', ldquo: '“', rdquo: '”',
      lsquo: '‘', rsquo: '’', middot: '·', bull: '•', copy: '©', reg: '®',
      trade: '™', deg: '°', plusmn: '±', times: '×', divide: '÷',
      laquo: '«', raquo: '»', euro: '€', pound: '£', yen: '¥', cent: '¢',
      sect: '§', para: '¶', dagger: '†', dagger_lower: '‡',
    };

    // Small bounded concurrency for async archive reads. The browser can overlap
    // DecompressionStream work, but unbounded chapter/image reads would hold too
    // many buffers in memory at once.
    async function mapLimit(items, limit, worker) {
      const source = Array.isArray(items) ? items : [];
      const results = new Array(source.length);
      let next = 0;
      async function run() {
        while (true) {
          const index = next;
          next += 1;
          if (index >= source.length) return;
          try {
            results[index] = await worker(source[index], index);
          } catch (error) {
            results[index] = null;
          }
        }
      }
      const workers = [];
      const width = Math.min(Math.max(1, Number(limit) || 1), source.length);
      for (let index = 0; index < width; index += 1) workers.push(run());
      await Promise.all(workers);
      return results;
    }

    function decodeEpubEntities(value) {
      return String(value || '').replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z][a-z0-9]+);/gi, function replace(match, body) {
        if (body.charAt(0) === '#') {
          const hex = body.charAt(1).toLowerCase() === 'x';
          const code = parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
          if (Number.isFinite(code) && code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)) {
            try { return String.fromCodePoint(code); } catch (error) { return match; }
          }
          return match;
        }
        const key = body.toLowerCase();
        return Object.prototype.hasOwnProperty.call(EPUB_ENTITY_MAP, key) ? EPUB_ENTITY_MAP[key] : match;
      });
    }

    function stripEpubMarkup(value) {
      return collapseWhitespace(decodeEpubEntities(String(value || '').replace(/<[^>]*>/g, ' ')));
    }

    function parseXmlAttributes(source) {
      const attrs = {};
      const pattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
      let match = pattern.exec(source);
      while (match) {
        attrs[match[1].toLowerCase()] = decodeEpubEntities(match[2] !== undefined ? match[2] : match[3]);
        match = pattern.exec(source);
      }
      return attrs;
    }

    function decodeZipName(bytes) {
      try {
        return new TextDecoder('utf-8').decode(bytes);
      } catch (error) {
        return '';
      }
    }

    function normalizeArchivePath(value) {
      let path = String(value || '').replace(/\\/g, '/');
      path = path.replace(/^\/+/, '').replace(/^\.\//, '');
      const pieces = path.split('/');
      const out = [];
      pieces.forEach(function part(piece) {
        if (!piece || piece === '.') return;
        if (piece === '..') out.pop();
        else out.push(piece);
      });
      return out.join('/');
    }

    function safeDecodeUri(value) {
      try { return decodeURIComponent(value); } catch (error) { return value; }
    }

    function findZipEntry(archive, path) {
      const clean = normalizeArchivePath(path);
      const decoded = normalizeArchivePath(safeDecodeUri(clean));
      const candidates = decoded === clean ? [clean] : [clean, decoded];
      for (let index = 0; index < candidates.length; index += 1) {
        if (archive.entries.has(candidates[index])) return archive.entries.get(candidates[index]);
      }
      const lower = clean.toLowerCase();
      for (let index = 0; index < archive.names.length; index += 1) {
        if (archive.names[index].toLowerCase() === lower) return archive.entries.get(archive.names[index]);
      }
      return null;
    }

    async function readZipArchive(input) {
      const isBlob = typeof Blob !== 'undefined' && (input instanceof Blob || (input && typeof input.slice === 'function' && typeof input.size === 'number' && !(input instanceof Uint8Array)));
      let length = 0;
      let bytes = null;
      let view = null;
      let eocd = -1;
      let directoryOffset = 0;
      let entryCount = 0;

      if (isBlob) {
        length = input.size;
        if (length < 22) throw new Error('epub-invalid');
        const stop = Math.max(0, length - 22 - 65535);
        const tailBlob = input.slice(stop, length);
        const tailBytes = new Uint8Array(await tailBlob.arrayBuffer());
        const tailView = new DataView(tailBytes.buffer, tailBytes.byteOffset, tailBytes.byteLength);
        for (let index = tailBytes.byteLength - 22; index >= 0; index -= 1) {
          if (tailView.getUint32(index, true) === 0x06054b50) {
            eocd = stop + index;
            const disk = tailView.getUint16(index + 4, true);
            const directoryDisk = tailView.getUint16(index + 6, true);
            entryCount = tailView.getUint16(index + 10, true);
            directoryOffset = tailView.getUint32(index + 16, true);
            if (disk !== 0 || directoryDisk !== 0) throw new Error('epub-invalid');
            if (entryCount === 0xffff || directoryOffset === 0xffffffff) throw new Error('epub-invalid');
            break;
          }
        }
        if (eocd < 0) throw new Error('epub-invalid');
        const dirBlob = input.slice(directoryOffset, eocd);
        bytes = new Uint8Array(await dirBlob.arrayBuffer());
        view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      } else {
        if (input && typeof input.arrayBuffer === 'function' && !(input instanceof Uint8Array)) {
          bytes = new Uint8Array(await input.arrayBuffer());
        } else {
          bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
        }
        view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        length = bytes.byteLength;
        if (length < 22) throw new Error('epub-invalid');
        const stop = Math.max(0, length - 22 - 65535);
        for (let index = length - 22; index >= stop; index -= 1) {
          if (view.getUint32(index, true) === 0x06054b50) {
            eocd = index;
            break;
          }
        }
        if (eocd < 0) throw new Error('epub-invalid');
        const disk = view.getUint16(eocd + 4, true);
        const directoryDisk = view.getUint16(eocd + 6, true);
        entryCount = view.getUint16(eocd + 10, true);
        directoryOffset = view.getUint32(eocd + 16, true);
        if (disk !== 0 || directoryDisk !== 0) throw new Error('epub-invalid');
        if (entryCount === 0xffff || directoryOffset === 0xffffffff) throw new Error('epub-invalid');
      }

      const entries = new Map();
      const names = [];
      let cursor = isBlob ? 0 : directoryOffset;
      for (let index = 0; index < entryCount; index += 1) {
        if (cursor + 46 > bytes.byteLength || view.getUint32(cursor, true) !== 0x02014b50) throw new Error('epub-invalid');
        const flags = view.getUint16(cursor + 8, true);
        const method = view.getUint16(cursor + 10, true);
        const compressedSize = view.getUint32(cursor + 20, true);
        const uncompressedSize = view.getUint32(cursor + 24, true);
        const nameLength = view.getUint16(cursor + 28, true);
        const extraLength = view.getUint16(cursor + 30, true);
        const commentLength = view.getUint16(cursor + 32, true);
        const localOffset = view.getUint32(cursor + 42, true);
        if (flags & 0x1) throw new Error('epub-encrypted');
        if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || localOffset === 0xffffffff) throw new Error('epub-invalid');
        if (!nameLength || cursor + 46 + nameLength > bytes.byteLength) throw new Error('epub-invalid');
        const name = normalizeArchivePath(decodeZipName(bytes.subarray(cursor + 46, cursor + 46 + nameLength)));
        if (name && !name.endsWith('/') && (method === 0 || method === 8)) {
          entries.set(name, {
            name: name,
            flags: flags,
            method: method,
            compressedSize: compressedSize,
            size: uncompressedSize,
            localOffset: localOffset,
          });
          names.push(name);
        }
        cursor += 46 + nameLength + extraLength + commentLength;
      }
      if (!entries.size) throw new Error('epub-invalid');

      async function readBytes(path) {
        const entry = findZipEntry(archive, path);
        if (!entry) throw new Error('epub-invalid');
        let compressed = null;
        if (isBlob) {
          if (entry.localOffset + 30 > length) throw new Error('epub-invalid');
          const headerBlob = input.slice(entry.localOffset, entry.localOffset + 30);
          const headerBytes = new Uint8Array(await headerBlob.arrayBuffer());
          const headerView = new DataView(headerBytes.buffer, headerBytes.byteOffset, headerBytes.byteLength);
          if (headerView.getUint32(0, true) !== 0x04034b50) throw new Error('epub-invalid');
          const nameLength = headerView.getUint16(26, true);
          const extraLength = headerView.getUint16(28, true);
          const start = entry.localOffset + 30 + nameLength + extraLength;
          const end = start + entry.compressedSize;
          if (start < 0 || end > length || end < start) throw new Error('epub-invalid');
          if (entry.size > 8 * 1024 * 1024) throw new Error('epub-too-large');
          const dataBlob = input.slice(start, end);
          compressed = new Uint8Array(await dataBlob.arrayBuffer());
        } else {
          if (entry.localOffset + 30 > length || view.getUint32(entry.localOffset, true) !== 0x04034b50) throw new Error('epub-invalid');
          const nameLength = view.getUint16(entry.localOffset + 26, true);
          const extraLength = view.getUint16(entry.localOffset + 28, true);
          const start = entry.localOffset + 30 + nameLength + extraLength;
          const end = start + entry.compressedSize;
          if (start < 0 || end > length || end < start) throw new Error('epub-invalid');
          if (entry.size > 8 * 1024 * 1024) throw new Error('epub-too-large');
          compressed = bytes.subarray(start, end);
        }
        if (entry.method === 0) return compressed.slice ? compressed.slice() : compressed;
        if (entry.method === 8) return inflateRawBytes(compressed);
        throw new Error('epub-unsupported');
      }

      const archive = {
        entries: entries,
        names: names,
        has: function has(path) { return Boolean(findZipEntry(archive, path)); },
        readBytes: readBytes,
        readText: async function readText(path) {
          return decodeTextBytes(await readBytes(path));
        },
      };
      return archive;
    }

    async function inflateRawBytes(data) {
      if (!data || !data.length) return new Uint8Array(0);
      if (typeof DecompressionStream !== 'function' || typeof Blob !== 'function' || typeof Response !== 'function') {
        throw new Error('epub-unsupported');
      }
      try {
        const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        return new Uint8Array(await new Response(stream).arrayBuffer());
      } catch (error) {
        if (error && error.message === 'epub-unsupported') throw error;
        throw new Error('epub-invalid');
      }
    }

    function resolveEpubPath(basePath, href) {
      const raw = safeDecodeUri(String(href || '').split('#')[0].split('?')[0]).replace(/\\/g, '/').trim();
      if (!raw) return null;
      if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return null;
      const baseDirectory = basePath.indexOf('/') >= 0 ? basePath.slice(0, basePath.lastIndexOf('/')) : '';
      const pieces = (baseDirectory ? baseDirectory.split('/') : []).concat(raw.split('/'));
      const out = [];
      pieces.forEach(function part(piece) {
        if (!piece || piece === '.') return;
        if (piece === '..') out.pop();
        else out.push(piece);
      });
      return out.join('/');
    }

    const ALLOWED_EPUB_INLINE_TAGS = new Set([
      'strong', 'b', 'em', 'i', 's', 'del', 'u', 'code',
      'ruby', 'rt', 'rp', 'small', 'sub', 'sup', 'a', 'abbr', 'span', 'br',
      'cite', 'q', 'mark'
    ]);

    const PRESERVED_EPUB_BLOCK_TAGS = new Set([
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'blockquote', 'pre', 'ul', 'ol', 'li', 'figure', 'figcaption', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr',
      'aside'
    ]);

    function extractEpubChapter(rawHtml, fallbackTitle) {
      const source = String(rawHtml || '');
      const titleMatch = source.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
      const headingMatch = source.match(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/i);
      let title = stripEpubMarkup(headingMatch ? headingMatch[1] : titleMatch ? titleMatch[1] : '');
      if (!title) title = fallbackTitle;

      let html = source
        .replace(/<\?xml[\s\S]*?\?>/gi, '')
        .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<(script|style|head|noscript|meta|link|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
        .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

      // Pictures are lifted out before the tags go: each one becomes a paragraph of
      // its own holding a placeholder, so the picture keeps its place in the text
      // instead of vanishing with the markup. The placeholder is resolved to a real
      // file name once the archive has been read.
      const pictures = [];
      html = html.replace(/<img\b([^>]*?)\/?>/gi, function capture(match, rawAttrs) {
        const attrs = parseXmlAttributes(rawAttrs);
        if (!attrs.src) return ' ';
        pictures.push({ src: attrs.src, alt: attrs.alt || attrs.title || '' });
        return '\n\n\u0000img:' + (pictures.length - 1) + '\u0000\n\n';
      });

      const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
      let content = bodyMatch ? bodyMatch[1] : html;

      // Preserve block boundaries for containers
      content = content
        .replace(/<\/(table|blockquote|pre|ul|ol|figure|aside|h[1-6])>/gi, '$&\n\n')
        .replace(/<(table|blockquote|pre|ul|ol|figure|aside|h[1-6])\b[^>]*>/gi, '\n\n$&')
        .replace(/<\/(?:p|div|section|article)>/gi, '\n\n')
        .replace(/<(?:p|div|section|article)\b([^>]*)>/gi, function keepContainerId(match, attrs) {
          const idMatch = attrs.match(/\bid\s*=\s*("[^"]*"|'[^']*')/i);
          const epubTypeMatch = attrs.match(/\bepub:type\s*=\s*("[^"]*"|'[^']*')/i);
          if (idMatch) {
            const safeType = epubTypeMatch ? ' ' + epubTypeMatch[0] : '';
            return '\n\n<span ' + idMatch[0] + safeType + '></span> ';
          }
          return '\n\n';
        });

      // Sanitize attributes and preserve allowed tags (ruby, strong, em, table, etc.)
      content = content.replace(/<\/?([a-z0-9]+)\b([^>]*)>/gi, function keepTag(match, tagName, attrs) {
        const tag = tagName.toLowerCase();
        if (ALLOWED_EPUB_INLINE_TAGS.has(tag) || PRESERVED_EPUB_BLOCK_TAGS.has(tag)) {
          if (match.startsWith('</')) return '</' + tag + '>';
          let safeAttrs = '';
          const hrefMatch = attrs.match(/\bhref\s*=\s*("[^"]*"|'[^']*')/i);
          const classMatch = attrs.match(/\bclass\s*=\s*("[^"]*"|'[^']*')/i);
          const idMatch = attrs.match(/\bid\s*=\s*("[^"]*"|'[^']*')/i);
          const nameMatch = attrs.match(/\bname\s*=\s*("[^"]*"|'[^']*')/i);
          const roleMatch = attrs.match(/\brole\s*=\s*("[^"]*"|'[^']*')/i);
          const epubTypeMatch = attrs.match(/\bepub:type\s*=\s*("[^"]*"|'[^']*')/i);
          const alignMatch = attrs.match(/\balign\s*=\s*("[^"]*"|'[^']*')/i);
          const colspanMatch = attrs.match(/\bcolspan\s*=\s*("[^"]*"|'[^']*')/i);
          const rowspanMatch = attrs.match(/\browspan\s*=\s*("[^"]*"|'[^']*')/i);
          if (hrefMatch) safeAttrs += ' ' + hrefMatch[0];
          if (classMatch) safeAttrs += ' ' + classMatch[0];
          if (idMatch) safeAttrs += ' ' + idMatch[0];
          if (nameMatch) {
            safeAttrs += ' ' + nameMatch[0];
            if (!idMatch) safeAttrs += ' id=' + nameMatch[1];
          }
          if (roleMatch) safeAttrs += ' ' + roleMatch[0];
          if (epubTypeMatch) safeAttrs += ' ' + epubTypeMatch[0];
          if (alignMatch) safeAttrs += ' ' + alignMatch[0];
          if (colspanMatch) safeAttrs += ' ' + colspanMatch[0];
          if (rowspanMatch) safeAttrs += ' ' + rowspanMatch[0];
          return '<' + tag + safeAttrs + '>';
        }
        return '';
      });

      content = decodeEpubEntities(content).replace(/\u00a0/g, ' ').replace(/\r\n?/g, '\n');
      const lines = content.split('\n').map(function clean(line) { return line.replace(/[ \t]+/g, ' ').trim(); });
      const cleaned = lines.join('\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
      let paragraphs = cleaned.split(/\n{2,}/).map(function trim(value) { return value.replace(/[ \t]+/g, ' ').trim(); }).filter(Boolean);
      if (paragraphs.length && collapseWhitespace(stripHtmlTags(paragraphs[0])) === collapseWhitespace(title)) {
        paragraphs = paragraphs.slice(1);
      }
      if (!paragraphs.length) return { title: title, paragraphs: [], pictures: pictures };
      return { title: title, paragraphs: paragraphs, pictures: pictures };
    }

    function imageExtension(mime) {
      if (mime === 'image/png') return 'png';
      if (mime === 'image/webp') return 'webp';
      if (mime === 'image/gif') return 'gif';
      return 'jpg';
    }

    // Reads every picture a chapter references and gives it a name the folder can
    // hold: `img-3-2.png` (chapter 3, second picture). Unreadable or unsupported
    // pictures are reported as an empty name so the caller can say so in place.
    // If skipImageBytes is true (during batch imports), we only compute names and
    // skip decompressing megabytes of image bytes into memory.
    async function collectChapterImages(archive, chapterPath, pictures, chapterNumber, rawImages, skipImageBytes) {
      const images = {};
      const names = [];
      if (skipImageBytes) {
        for (let index = 0; index < pictures.length; index += 1) {
          const ref = pictures[index];
          const mime = ref && ref.src ? epubImageMime({ href: ref.src }) : null;
          names.push('img-' + chapterNumber + '-' + (index + 1) + '.' + (mime ? imageExtension(mime) : 'jpg'));
        }
        return { images: images, names: names };
      }
      const found = await mapLimit(pictures, 2, async function readImage(ref, index) {
        try {
          const target = resolveEpubPath(chapterPath, ref.src);
          if (!target || !archive.has(target)) return null;
          const mime = epubImageMime({ href: ref.src });
          if (!mime) return null;
          const bytes = await archive.readBytes(target);
          if (!bytes.length) return null;
          const name = 'img-' + chapterNumber + '-' + (index + 1) + '.' + imageExtension(mime);
          return {
            index: index,
            name: name,
            data: rawImages ? { mime: mime, bytes: bytes } : 'data:' + mime + ';base64,' + bytesToBase64(bytes),
          };
        } catch (error) {
          /* A broken picture must not cost the reader the chapter. */
          return null;
        }
      });
      found.forEach(function store(item) {
        if (!item) { names.push(''); return; }
        images[item.name] = item.data;
        names[item.index] = item.name;
      });
      for (let index = 0; index < pictures.length; index += 1) {
        if (typeof names[index] !== 'string') names[index] = '';
      }
      return { images: images, names: names };
    }

    function firstOpfText(opf, localName) {
      const pattern = new RegExp('<(?:[A-Za-z_][\\w.-]*:)?' + localName + '\\b[^>]*>([\\s\\S]*?)<\\/(?:[A-Za-z_][\\w.-]*:)?' + localName + '>', 'i');
      const match = opf.match(pattern);
      return match ? stripEpubMarkup(match[1]) : '';
    }

    function parseEpubManifest(opf) {
      const items = [];
      const pattern = /<item\b([^>]*?)\/?>/gi;
      let match = pattern.exec(opf);
      while (match) {
        const attrs = parseXmlAttributes(match[1]);
        if (attrs.id && attrs.href) {
          items.push({
            id: attrs.id,
            href: attrs.href,
            mediaType: String(attrs['media-type'] || '').toLowerCase(),
            properties: String(attrs.properties || '').toLowerCase(),
          });
        }
        match = pattern.exec(opf);
      }
      return items;
    }

    function parseEpubSpine(opf) {
      const items = [];
      const pattern = /<itemref\b([^>]*?)\/?>/gi;
      let match = pattern.exec(opf);
      while (match) {
        const attrs = parseXmlAttributes(match[1]);
        if (attrs.idref) items.push({ idref: attrs.idref, linear: attrs.linear || 'yes' });
        match = pattern.exec(opf);
      }
      return items;
    }

    async function makeCoverThumbnail(bytes, mime) {
      if (!bytes || !bytes.length) return null;
      if (typeof createImageBitmap !== 'function' || typeof OffscreenCanvas !== 'function') {
        if (bytes.length <= 160 * 1024) return 'data:' + mime + ';base64,' + bytesToBase64(bytes);
        return null;
      }
      try {
        const blob = new Blob([bytes], { type: mime });
        const bitmap = await createImageBitmap(blob);
        const maxW = 360;
        const maxH = 504;
        let width = bitmap.width;
        let height = bitmap.height;
        if (width <= 0 || height <= 0) {
          try { bitmap.close(); } catch (e) {}
          return null;
        }
        if (width <= maxW && height <= maxH && bytes.length <= 90 * 1024) {
          try { bitmap.close(); } catch (e) {}
          return 'data:' + mime + ';base64,' + bytesToBase64(bytes);
        }
        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(bitmap, 0, 0, width, height);
        }
        try { bitmap.close(); } catch (e) {}
        const thumbBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.88 });
        canvas.width = 0;
        canvas.height = 0;
        const thumbBytes = new Uint8Array(await thumbBlob.arrayBuffer());
        return 'data:image/jpeg;base64,' + bytesToBase64(thumbBytes);
      } catch (err) {
        if (bytes.length <= 160 * 1024) return 'data:' + mime + ';base64,' + bytesToBase64(bytes);
        return null;
      }
    }

    function epubImageMime(item) {
      const mime = String(item.mediaType || '').toLowerCase();
      if (/^image\/(jpeg|png|webp|gif)$/.test(mime)) return mime;
      const href = String(item.href || '').toLowerCase();
      if (/\.png(?:[?#]|$)/.test(href)) return 'image/png';
      if (/\.webp(?:[?#]|$)/.test(href)) return 'image/webp';
      if (/\.gif(?:[?#]|$)/.test(href)) return 'image/gif';
      if (/\.jpe?g(?:[?#]|$)/.test(href)) return 'image/jpeg';
      return '';
    }

    function findEpubCover(opf, manifest) {
      const imageItems = manifest.filter(function image(item) {
        return Boolean(epubImageMime(item)) && String(item.mediaType || '').toLowerCase() !== 'image/svg+xml';
      });
      const epub3 = imageItems.find(function cover(item) { return item.properties.indexOf('cover-image') >= 0; });
      if (epub3) return epub3;
      const metaPattern = /<meta\b([^>]*?)\/?>/gi;
      let metaMatch = metaPattern.exec(opf);
      while (metaMatch) {
        const attrs = parseXmlAttributes(metaMatch[1]);
        if (String(attrs.name || '').toLowerCase() === 'cover' && attrs.content) {
          const found = manifest.find(function same(item) { return item.id === attrs.content && /^image\//i.test(item.mediaType); });
          if (found) return found;
        }
        metaMatch = metaPattern.exec(opf);
      }
      return imageItems.find(function named(item) {
        return /(^|[/_-])cover([._-]|$)/i.test(item.id) || /cover/i.test(item.href);
      }) || null;
    }

    async function loadEpubNavTitles(archive, opfPath, manifest) {
      const titles = new Map();
      const navItem = manifest.find(function nav(item) {
        return item.properties.split(/\s+/).indexOf('nav') >= 0;
      });
      if (navItem) {
        try {
          const navPath = resolveEpubPath(opfPath, navItem.href);
          if (navPath && archive.has(navPath)) {
            const navHtml = await archive.readText(navPath);
            const tocNav = navHtml.match(/<nav\b[^>]*epub:type\s*=\s*["'][^"']*\btoc\b[^"']*["'][^>]*>([\s\S]*?)<\/nav>/i);
            const navBody = tocNav ? tocNav[1] : navHtml;
            const linkPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
            let link = linkPattern.exec(navBody);
            while (link) {
              const attrs = parseXmlAttributes(link[1]);
              const label = stripEpubMarkup(link[2]);
              if (attrs.href && label) {
                const target = resolveEpubPath(navPath, attrs.href);
                if (target) titles.set(target.toLowerCase(), label);
              }
              link = linkPattern.exec(navBody);
            }
          }
        } catch (error) {
          /* Fall through to the content headings. */
        }
      }
      if (titles.size) return titles;
      const ncxItem = manifest.find(function byType(item) {
        return item.mediaType === 'application/x-dtbncx+xml';
      }) || manifest.find(function byName(item) { return /\.ncx$/i.test(item.href); });
      if (ncxItem) {
        try {
          const ncxPath = resolveEpubPath(opfPath, ncxItem.href);
          if (ncxPath && archive.has(ncxPath)) {
            const ncx = await archive.readText(ncxPath);
            const pointPattern = /<navPoint\b[^>]*>([\s\S]*?)<\/navPoint>/gi;
            let point = pointPattern.exec(ncx);
            while (point) {
              const labelMatch = point[1].match(/<navLabel\b[^>]*>[\s\S]*?<text\b[^>]*>([\s\S]*?)<\/text>/i);
              const contentMatch = point[1].match(/<content\b([^>]*?)\/?>/i);
              if (labelMatch && contentMatch) {
                const attrs = parseXmlAttributes(contentMatch[1]);
                const label = stripEpubMarkup(labelMatch[1]);
                if (attrs.src && label) {
                  const target = resolveEpubPath(ncxPath, attrs.src);
                  if (target) titles.set(target.toLowerCase(), label);
                }
              }
              point = pointPattern.exec(ncx);
            }
          }
        } catch (error) {
          /* Content headings remain the fallback. */
        }
      }
      return titles;
    }

    async function parseEpubBook(fileName, input, options) {
      const isBlob = typeof Blob !== 'undefined' && (input instanceof Blob || (input && typeof input.slice === 'function' && typeof input.size === 'number' && !(input instanceof Uint8Array)));
      const rawImages = Boolean(options && options.rawImages);
      const skipImageBytes = Boolean(options && (options.skipImageBytes || options.skipImages));
      let archive;
      try {
        archive = await readZipArchive(input);
      } catch (error) {
        if (error && (error.message === 'epub-unsupported' || error.message === 'epub-encrypted')) throw error;
        throw new Error('epub-invalid');
      }

      let containerPath = 'META-INF/container.xml';
      let opfPath = null;
      if (archive.has(containerPath)) {
        try {
          const container = await archive.readText(containerPath);
          const rootfile = container.match(/<rootfile\b([^>]*?)\/?>/i);
          if (rootfile) {
            const attrs = parseXmlAttributes(rootfile[1]);
            if (attrs['full-path']) opfPath = normalizeArchivePath(attrs['full-path']);
          }
        } catch (error) {
          /* Fall back to scanning for an OPF package. */
        }
      }
      if (!opfPath) {
        opfPath = archive.names.find(function find(name) { return /(^|\/)content\.opf$/i.test(name); }) || archive.names.find(function find(name) { return /\.opf$/i.test(name); });
      }
      if (!opfPath || !archive.has(opfPath)) throw new Error('epub-invalid');
      const opf = await archive.readText(opfPath);
      const title = firstOpfText(opf, 'title') || String(fileName || '').replace(/\.epub$/i, '').trim() || UNTITLED;
      const author = firstOpfText(opf, 'creator') || '佚名';
      const manifest = parseEpubManifest(opf);
      const manifestMap = new Map();
      manifest.forEach(function add(item) { manifestMap.set(item.id, item); });
      const spine = parseEpubSpine(opf);
      let coverImage = null;
      const coverItem = findEpubCover(opf, manifest);
      if (coverItem) {
        try {
          const coverPath = resolveEpubPath(opfPath, coverItem.href);
          if (coverPath && archive.has(coverPath)) {
            const coverBytes = await archive.readBytes(coverPath);
            if (coverBytes.length > 0 && coverBytes.length <= 3 * 1024 * 1024) {
              const mime = epubImageMime(coverItem);
              if (mime) coverImage = await makeCoverThumbnail(coverBytes, mime);
            }
          }
        } catch (error) {
          coverImage = null;
        }
      }
      const navTitles = await loadEpubNavTitles(archive, opfPath, manifest);
      let readingOrder = spine.filter(function linear(item) { return item.linear !== 'no'; }).map(function map(item) {
        return manifestMap.get(item.idref);
      }).filter(Boolean);
      if (!readingOrder.length) readingOrder = manifest;
      readingOrder = readingOrder.filter(function media(item) {
        return (item.mediaType.indexOf('html') >= 0 || /\.x?html?$/i.test(item.href)) && item.properties.indexOf('nav') < 0;
      });
      if (!readingOrder.length) throw new Error('epub-empty');

      const chapterTasks = [];
      for (let index = 0; index < readingOrder.length && chapterTasks.length < 320; index += 1) {
        const item = readingOrder[index];
        const path = resolveEpubPath(opfPath, item.href);
        if (!path || !archive.has(path)) continue;
        chapterTasks.push({ item: item, path: path, ordinal: index + 1 });
      }
      const parsedChapters = await mapLimit(chapterTasks, 2, async function parseChapter(task) {
        try {
          const html = await archive.readText(task.path);
          const fallback = '第 ' + task.ordinal + ' 章';
          const extracted = extractEpubChapter(html, fallback);
          if (!extracted.paragraphs.length) return null;
          // Pictures become real files next to the text, and the placeholder paragraph
          // becomes an image line the reader knows how to draw.
          const collected = await collectChapterImages(archive, task.path, extracted.pictures || [], task.ordinal, rawImages, skipImageBytes);
          const paragraphs = [];
          extracted.paragraphs.forEach(function replace(text) {
            const placeholder = /^\u0000img:(\d+)\u0000$/.exec(text.trim());
            if (!placeholder) {
              paragraphs.push(text);
              return;
            }
            const slot = Number(placeholder[1]);
            const name = collected.names[slot];
            if (!name) return;
            const alt = String((extracted.pictures[slot] && extracted.pictures[slot].alt) || '').replace(/[\[\]\n\r]/g, ' ').trim();
            paragraphs.push('![' + alt + '](' + name + ')');
          });
          if (!paragraphs.length) return null;
          const navTitle = navTitles.get(task.path.toLowerCase());
          return {
            title: navTitle || extracted.title || fallback,
            paragraphs: paragraphs,
            images: Object.keys(collected.images).length ? collected.images : undefined,
            path: task.path,
            href: task.item ? task.item.href : undefined,
          };
        } catch (error) {
          return null;
        }
      });
      const chapters = [];
      parsedChapters.forEach(function keep(chapter) {
        if (!chapter) return;
        chapter.id = 'epub-c' + (chapters.length + 1);
        chapters.push(chapter);
      });
      if (!chapters.length) throw new Error('epub-empty');

      const expanded = [];
      chapters.forEach(function split(chapter) {
        if (chapterText(chapter).length > 7600) {
          splitLongChapter(chapter, 3400).forEach(function push(part) { expanded.push(part); });
        } else {
          expanded.push(chapter);
        }
      });
      if (!expanded.length) throw new Error('epub-empty');
      if (expanded.length > 320) expanded.length = 320;
      const byteLength = isBlob ? input.size : (input && input.byteLength ? input.byteLength : 0);
      const seed = hashString(title + ':' + author + ':' + byteLength);
      const cover = LOCAL_COVERS[seed % LOCAL_COVERS.length];
      const glyph = Array.from(title)[0] || '书';
      return {
        id: 'local-' + Date.now().toString(36) + '-' + (seed % 99991).toString(36),
        title: title.slice(0, 100),
        author: author.slice(0, 80),
        subtitle: 'EPUB',
        description: '从 EPUB 导入的书籍，保存在此浏览器中。',
        tags: ['EPUB', '本地导入'],
        source: 'local',
        format: 'epub',
        coverImage: coverImage || undefined,
        addedAt: Date.now(),
        cover: {
          from: cover.from,
          to: cover.to,
          ink: cover.ink,
          accent: cover.accent,
          glyph: glyph,
        },
        chapters: expanded,
      };
    }
