    // ---------------------------------------------------------------------------
    // Book formats beyond TXT / Markdown / EPUB: MOBI / AZW / AZW3 / PRC and
    // FB2 (+ FBZ). Each one is turned into exactly what an EPUB
    // chapter already is — sanitized HTML paragraphs (via extractEpubChapter) plus
    // `![alt](img-3-1.png)` picture lines with a name -> data URL map — so the
    // reader, search, footnote popovers and the host tools need nothing new.
    //
    // Unlike EPUB, the original file is not kept in the library folder: the
    // readable `.txt` body and the `.assets/` pictures are the whole book.
    //
    // Everything here runs in the import worker and in the bare test VM, so there
    // is no DOMParser: FB2's XML is read with a small hand-written scanner.
    // ---------------------------------------------------------------------------

    const DOCUMENT_FORMATS = {
      fb2: { label: 'FB2' },
      mobi: { label: 'MOBI' },
    };

    // Extensions the file picker offers, and the kind each name/type maps to.
    const BOOK_FILE_ACCEPT = [
      '.txt', '.text', '.md', '.markdown', '.epub',
      '.fb2', '.fbz', '.zip',
      '.mobi', '.azw', '.azw3', '.prc', '.pdb',
      'text/plain', 'text/markdown', 'application/epub+zip',
      'application/x-fictionbook+xml',
      'application/x-mobipocket-ebook', 'application/vnd.amazon.ebook',
    ].join(',');

    function bookFileKind(name, type) {
      const lower = String(name || '').toLowerCase();
      const mime = String(type || '').toLowerCase();
      if (/\.epub$/.test(lower) || mime === 'application/epub+zip') return 'epub';
      if (/\.(?:fb2\.zip|fbz)$/.test(lower)) return 'fbz';
      if (/\.fb2$/.test(lower) || mime === 'application/x-fictionbook+xml' || mime === 'application/x-fictionbook') return 'fb2';
      if (/\.(?:mobi|azw|azw3|prc|pdb)$/.test(lower) || mime === 'application/x-mobipocket-ebook' || mime === 'application/vnd.amazon.ebook') return 'mobi';
      if (/\.(?:txt|text|md|markdown)$/.test(lower)) return 'text';
      // A bare `.zip` is only taken when it is named like a zipped FB2 (above).
      // HTML and RTF are not supported: their text/* types must not fall through
      // to plain text and import as markup.
      if (/\.(?:html?|xhtml?|xht|htmlz|rtf|docx?)$/.test(lower)) return '';
      if (mime === 'text/html' || mime === 'text/rtf' || mime === 'text/xml') return '';
      if (/^text\//.test(mime)) return 'text';
      return '';
    }

    // One entry point for every kind except EPUB, which keeps its own streaming
    // path (and its original file) in the callers.
    async function parseBookBytes(kind, fileName, bytes) {
      const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
      if (kind === 'text') return parseImportedBook(fileName, decodeTextBytes(data));
      if (kind === 'fb2') return parseFb2Book(fileName, data);
      if (kind === 'fbz') return parseFbzBook(fileName, data);
      if (kind === 'mobi') return parseMobiBook(fileName, data);
      throw new Error('wrong-type');
    }

    // Malformed binaries surface as RangeErrors from DataView or as bad offsets;
    // report them as an unreadable book instead of a raw engine message.
    async function parseBookBytesSafely(kind, fileName, bytes) {
      try {
        return await parseBookBytes(kind, fileName, bytes);
      } catch (error) {
        if (error instanceof RangeError || error instanceof TypeError) throw new Error('book-invalid');
        throw error;
      }
    }

    // ---------------------------------------------------------------------------
    // Shared helpers
    // ---------------------------------------------------------------------------

    function escapeBookHtml(value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function cleanAnchorId(value) {
      return String(value || '').replace(/^#/, '').replace(/[^A-Za-z0-9_.:-]/g, '_').slice(0, 80);
    }

    function latin1String(bytes, start, end) {
      let out = '';
      const stop = Math.min(bytes.length, end === undefined ? bytes.length : end);
      const chunk = 0x8000;
      for (let index = start || 0; index < stop; index += chunk) {
        out += String.fromCharCode.apply(null, bytes.subarray(index, Math.min(stop, index + chunk)));
      }
      return out;
    }

    function latin1Bytes(text) {
      const out = new Uint8Array(text.length);
      for (let index = 0; index < text.length; index += 1) out[index] = text.charCodeAt(index) & 0xff;
      return out;
    }

    function concatBytes(parts) {
      let total = 0;
      parts.forEach(function size(part) { total += part.length; });
      const out = new Uint8Array(total);
      let at = 0;
      parts.forEach(function copy(part) { out.set(part, at); at += part.length; });
      return out;
    }

    // Decodes with a named charset when the runtime knows it, otherwise falls back
    // to the BOM / UTF-8 / GB18030 guess every text import already uses.
    function decodeWithCharset(bytes, charset) {
      const label = String(charset || '').trim().toLowerCase();
      if (label && !/^utf-?8$/.test(label)) {
        try {
          return new TextDecoder(label).decode(bytes);
        } catch (error) {
          /* unknown label: guess instead */
        }
      }
      return decodeTextBytes(bytes);
    }

    function sniffImageMime(bytes) {
      if (!bytes || bytes.length < 4) return '';
      if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif';
      if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
        && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'image/webp';
      return '';
    }

    function base64ToBytesLoose(value) {
      // fsBase64ToBytes lives in fsstore.js, which the parse worker does not load.
      const clean = String(value || '').replace(/[^A-Za-z0-9+/]/g, '');
      const table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      const out = new Uint8Array(Math.floor(clean.length * 3 / 4));
      let buffer = 0;
      let bits = 0;
      let at = 0;
      for (let index = 0; index < clean.length; index += 1) {
        buffer = (buffer << 6) | table.indexOf(clean.charAt(index));
        bits += 6;
        if (bits >= 8) {
          bits -= 8;
          out[at] = (buffer >> bits) & 0xff;
          at += 1;
        }
      }
      return out.subarray(0, at);
    }

    // A forgiving XML reader: elements, attributes, text and CDATA. Element names
    // are kept lower-cased both with their prefix (`w:p`) and without (`p`).
    function parseXmlTree(source) {
      const root = { name: '#root', local: '#root', attrs: {}, children: [] };
      const stack = [root];
      const text = String(source || '');
      const pattern = /<!\[CDATA\[([\s\S]*?)\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE(?:[^>[]|\[[\s\S]*?\])*>|<\/\s*([^\s>]+)\s*>|<([A-Za-z_][^\s>/]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
      let last = 0;
      let match;
      function addText(value, raw) {
        if (!value) return;
        stack[stack.length - 1].children.push({ text: raw ? value : decodeEpubEntities(value) });
      }
      while ((match = pattern.exec(text)) !== null) {
        if (match.index > last) addText(text.slice(last, match.index), false);
        last = pattern.lastIndex;
        if (match[1] !== undefined) {
          addText(match[1], true);
        } else if (match[2]) {
          const closing = match[2].toLowerCase();
          for (let depth = stack.length - 1; depth > 0; depth -= 1) {
            if (stack[depth].name === closing) {
              stack.length = depth;
              break;
            }
          }
        } else if (match[3]) {
          const name = match[3].toLowerCase();
          const colon = name.indexOf(':');
          const node = {
            name: name,
            local: colon >= 0 ? name.slice(colon + 1) : name,
            attrs: parseXmlAttributes(match[4] || ''),
            children: [],
          };
          stack[stack.length - 1].children.push(node);
          if (!match[5]) stack.push(node);
        }
      }
      if (last < text.length) addText(text.slice(last), false);
      return root;
    }

    function xmlChildren(node, local) {
      return (node && node.children ? node.children : []).filter(function match(child) {
        return child.local && (!local || child.local === local);
      });
    }

    function xmlFirst(node, local) {
      if (!node || !node.children) return null;
      for (let index = 0; index < node.children.length; index += 1) {
        const child = node.children[index];
        if (child.local === local) return child;
        const deeper = xmlFirst(child, local);
        if (deeper) return deeper;
      }
      return null;
    }

    function xmlText(node) {
      if (!node) return '';
      if (typeof node.text === 'string') return node.text;
      return (node.children || []).map(xmlText).join('');
    }

    // Matches the chapter lines a TXT import already recognises, for documents
    // whose chapters are ordinary paragraphs instead of headings.
    const DOC_CHAPTER_LINE = /^(?:第[0-9０-９零〇一二两三四五六七八九十百千万]+[章节回卷篇部集幕](?:[ 　:：·、.\-—].{0,40})?|卷[0-9零〇一二三四五六七八九十百]+(?:[ 　:：·、.\-—].{0,36})?|(?:序章|序言|序幕|楔子|引子|尾声|后记|前言|番外|终章)(?:[ 　:：·、.\-—].{0,34})?|(?:chapter|part|book)\s+(?:[0-9]+|[ivxlc]+|[a-z]+)\b.{0,44}|chapter\s*(?:[0-9]+|[ivxlc]+)\b.{0,44}|(?:prologue|epilogue|preface|introduction)\b.{0,40})$/i;

    // Splits one HTML document into chapter-sized HTML segments. The level used is
    // the shallowest heading (h1-h3) that appears at least twice — so a lone <h1>
    // book title over a run of <h2> chapters splits at the <h2>s — then Kindle
    // page breaks; with neither, the document is one segment.
    function splitHtmlDocument(html) {
      let body = String(html || '');
      const bodyMatch = /<body\b[^>]*>([\s\S]*?)(?:<\/body\s*>|$)/i.exec(body);
      if (bodyMatch) body = bodyMatch[1];
      body = body
        .replace(/<head\b[\s\S]*?<\/head\s*>/gi, '')
        .replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1\s*>/gi, '');
      const counts = [0, 0, 0, 0];
      body.replace(/<h([1-3])\b/gi, function count(match, level) { counts[Number(level)] += 1; return match; });
      let splitter = null;
      for (let level = 1; level <= 3; level += 1) {
        if (counts[level] >= 2) {
          splitter = new RegExp('(?=<h' + level + '\\b)', 'i');
          break;
        }
      }
      if (!splitter && (body.match(/<mbp:pagebreak\b/gi) || []).length >= 2) {
        splitter = /<mbp:pagebreak\b[^>]*>/i;
      }
      if (!splitter) return [body];
      const flags = splitter.flags.indexOf('g') >= 0 ? splitter.flags : splitter.flags + 'g';
      const parts = body.split(new RegExp(splitter.source, flags));
      // A link target placed right before a chapter heading (MOBI `filepos`) belongs
      // to the chapter that heading opens, not to the end of the one before it.
      for (let index = 0; index + 1 < parts.length; index += 1) {
        const trailing = TRAILING_ANCHORS.exec(parts[index]);
        if (!trailing) continue;
        parts[index] = parts[index].slice(0, trailing.index);
        const next = parts[index + 1];
        const heading = /<\/h[1-6]\s*>/i.exec(next);
        parts[index + 1] = heading
          ? next.slice(0, heading.index + heading[0].length) + trailing[0] + next.slice(heading.index + heading[0].length)
          : trailing[0] + next;
      }
      return parts.filter(function hasText(part) {
        return /\S/.test(part.replace(/<[^>]*>/g, '')) || /<(?:img|image)\b/i.test(part);
      });
    }

    const TRAILING_ANCHORS = /(?:\s*<(a|span)\b[^>]*\bid\s*=\s*["'][^"']*["'][^>]*>\s*<\/\1\s*>)+\s*$/i;
    const ANCHOR_ONLY_PARAGRAPH = /^(?:<(a|span)\b[^>]*>\s*<\/\1\s*>\s*)+$/i;

    // An empty `<a id>` / `<span id>` on a line of its own is a link target, not a
    // paragraph: fold it into the next paragraph with text so it neither shows as
    // a blank line nor gets lost. Picture lines stay pure `![alt](name)`.
    function foldAnchorParagraphs(paragraphs) {
      const out = [];
      let carry = '';
      paragraphs.forEach(function each(text) {
        if (ANCHOR_ONLY_PARAGRAPH.test(text.trim())) {
          carry += text.trim();
          return;
        }
        if (carry && !imageParagraph(text)) {
          const trimmed = text.trim();
          // A table must stay `<table…` from its first character (the body file and
          // the reader both key on it), so the target waits for the next paragraph.
          if (/^<table\b/i.test(trimmed)) {
            out.push(text);
            return;
          }
          const container = /^<(?:blockquote|aside|ul|ol|figure|pre|h[1-6])\b[^>]*>/i.exec(trimmed);
          out.push(container
            ? trimmed.slice(0, container[0].length) + carry + trimmed.slice(container[0].length)
            : carry + text);
          carry = '';
          return;
        }
        out.push(text);
      });
      if (carry) {
        for (let index = out.length - 1; index >= 0; index -= 1) {
          if (!imageParagraph(out[index])) {
            out[index] += carry;
            break;
          }
        }
      }
      return out;
    }

    function chapterNameOf(paragraph) {
      if (imageParagraph(paragraph)) return '';
      if (/^<(?:table|ul|ol|pre|blockquote|aside|figure)\b/i.test(paragraph.trim())) return '';
      const text = collapseWhitespace(stripHtmlTags(paragraph));
      if (!text || text.length > 50) return '';
      return DOC_CHAPTER_LINE.test(text) ? text : '';
    }

    // "I hope Mr. Bingley will like it. CHAPTER II." — a picture caption run into the
    // heading. Only a prefix that ends a sentence is dropped, so a heading such as
    // "Notes on Chapter 3" keeps its words.
    function tidyChapterTitle(title) {
      const text = collapseWhitespace(title);
      if (!text || DOC_CHAPTER_LINE.test(text)) return text;
      const pattern = /chapter|part\s|第[0-9０-９零〇一二两三四五六七八九十百千万]+[章节回卷]/gi;
      let match;
      let at = -1;
      while ((match = pattern.exec(text)) !== null) at = match.index;
      if (at <= 0) return text;
      const tail = text.slice(at);
      if (tail.length <= 50 && DOC_CHAPTER_LINE.test(tail) && /[.!?。！？”"’」』)]\s*$/.test(text.slice(0, at))) return tail;
      return text;
    }

    // A chapter line on its own `<br>`-separated line within the first paragraphs.
    function chapterLineNear(paragraphs) {
      const limit = Math.min(paragraphs.length, 4);
      for (let index = 0; index < limit; index += 1) {
        if (imageParagraph(paragraphs[index])) continue;
        const lines = paragraphs[index].split(/<br\s*\/?>/i);
        for (let at = 0; at < lines.length; at += 1) {
          const name = chapterNameOf(lines[at]);
          if (name) return name.slice(0, 64);
        }
      }
      return '';
    }

    // The link targets inside a paragraph that is about to become a chapter title.
    function anchorsOf(paragraph) {
      return (String(paragraph || '').match(/<(a|span)\b[^>]*\bid\s*=[^>]*>\s*<\/\1\s*>/gi) || []).join('');
    }

    // Turns a leading "第三章" paragraph into the title; its link targets move on.
    function takeTitleParagraph(paragraphs) {
      const head = paragraphs[0];
      const anchors = anchorsOf(head);
      const rest = paragraphs.slice(1);
      return { title: chapterNameOf(head).slice(0, 64), paragraphs: anchors ? foldAnchorParagraphs([anchors].concat(rest)) : rest };
    }

    // A document without headings whose chapters are plain "第一章 …" paragraphs.
    function splitChapterByChapterLines(chapter) {
      const marks = [];
      chapter.paragraphs.forEach(function find(paragraph, index) {
        if (chapterNameOf(paragraph)) marks.push(index);
      });
      if (marks.length < 2) return [chapter];
      const pieces = [];
      const front = chapter.paragraphs.slice(0, marks[0]);
      if (front.some(function prose(text) { return collapseWhitespace(stripHtmlTags(text)) || imageParagraph(text); })) {
        pieces.push({ title: chapter.title, paragraphs: front });
      }
      marks.forEach(function piece(start, position) {
        const end = position + 1 < marks.length ? marks[position + 1] : chapter.paragraphs.length;
        if (end - start < 2) return;
        pieces.push(takeTitleParagraph(chapter.paragraphs.slice(start, end)));
      });
      return pieces.map(function withImages(piece) {
        return Object.assign({}, piece, { images: chapterImagesFor(piece.paragraphs, chapter.images) });
      });
    }

    function chapterImagesFor(paragraphs, images) {
      if (!images) return undefined;
      const out = {};
      paragraphs.forEach(function each(text) {
        const picture = imageParagraph(text);
        if (picture && images[picture.name]) out[picture.name] = images[picture.name];
      });
      return Object.keys(out).length ? out : undefined;
    }

    function imageDataUrl(image) {
      return 'data:' + image.mime + ';base64,' + bytesToBase64(image.bytes);
    }

    // segments: [{ html, title? }]. resolveImage(src) -> { bytes, mime } | null (may be async).
    async function chaptersFromHtmlSegments(segments, resolveImage, options) {
      const chapters = [];
      const imageCache = new Map();
      let pictureCount = 0;
      for (let index = 0; index < segments.length; index += 1) {
        const segment = segments[index];
        const ordinal = chapters.length + 1;
        const fallback = segment.title || '第 ' + ordinal + ' 节';
        const extracted = extractEpubChapter('<html><body>' + segment.html + '</body></html>', fallback);
        const images = {};
        const paragraphs = [];
        for (let position = 0; position < extracted.paragraphs.length; position += 1) {
          const text = extracted.paragraphs[position];
          const placeholder = /^\u0000img:(\d+)\u0000$/.exec(text.trim());
          if (!placeholder) {
            // A picture inside a kept container (a table cell, a figure) cannot be
            // drawn there; drop its placeholder rather than show control characters.
            const clean = text.replace(/\u0000img:\d+\u0000/g, '').trim();
            if (clean) paragraphs.push(clean);
            continue;
          }
          const picture = extracted.pictures[Number(placeholder[1])];
          if (!picture || !resolveImage) continue;
          let resolved = imageCache.get(picture.src);
          if (resolved === undefined) {
            try {
              resolved = (await resolveImage(picture.src)) || null;
            } catch (error) {
              resolved = null;
            }
            if (resolved && !sniffImageMime(resolved.bytes)) resolved = null;
            if (resolved) {
              pictureCount += 1;
              resolved = {
                name: 'img-' + pictureCount + '.' + imageExtension(resolved.mime),
                url: imageDataUrl(resolved),
              };
            }
            imageCache.set(picture.src, resolved);
          }
          if (!resolved) continue;
          images[resolved.name] = resolved.url;
          const alt = String(picture.alt || '').replace(/[\[\]\n\r]/g, ' ').trim();
          paragraphs.push('![' + alt + '](' + resolved.name + ')');
        }
        let title = segment.title || tidyChapterTitle(extracted.title) || fallback;
        let body = foldAnchorParagraphs(paragraphs);
        // A segment cut at a page break with no heading: a leading "第三章" line is
        // its title. (A lone segment is left whole for the chapter-line splitter.)
        if (segments.length > 1 && !segment.title && extracted.title === fallback && body.length > 1) {
          if (chapterNameOf(body[0])) {
            const taken = takeTitleParagraph(body);
            title = taken.title;
            body = taken.paragraphs;
          } else {
            // Older Kindle books often end an illustrated opening paragraph with
            // `<br/>CHAPTER II.`: name the chapter after it but keep the paragraph.
            const line = chapterLineNear(body);
            if (line) title = line;
          }
        }
        if (!body.length) continue;
        chapters.push({
          title: String(title).replace(/\s+/g, ' ').trim().slice(0, 100) || fallback,
          paragraphs: body,
          images: Object.keys(images).length ? images : undefined,
        });
      }
      let result = chapters;
      if (result.length === 1 && !(options && options.keepSingle)) result = splitChapterByChapterLines(result[0]);
      const expanded = [];
      result.forEach(function split(chapter) {
        if (chapterText(chapter).length > 7600) {
          splitLongChapter(Object.assign({ id: 'doc' }, chapter), 3400).forEach(function push(part) {
            expanded.push({ title: part.title, paragraphs: part.paragraphs, images: chapterImagesFor(part.paragraphs, chapter.images) });
          });
        } else {
          expanded.push(chapter);
        }
      });
      return expanded.map(function identify(chapter, index) {
        const out = { id: 'doc-c' + (index + 1), title: chapter.title, paragraphs: chapter.paragraphs };
        if (chapter.images) out.images = chapter.images;
        return out;
      });
    }

    async function finishDocumentBook(format, fileName, meta, chapters, byteLength) {
      if (!chapters.length) throw new Error('empty');
      const info = DOCUMENT_FORMATS[format];
      const label = (meta && meta.label) || info.label;
      const fallbackTitle = String(fileName || '').replace(/\.(?:fb2\.zip|[^.]+)$/i, '').trim();
      const title = (collapseWhitespace(meta && meta.title) || fallbackTitle || UNTITLED).slice(0, 100);
      const author = (collapseWhitespace(meta && meta.author) || '佚名').slice(0, 80);
      let coverImage = null;
      if (meta && meta.cover && meta.cover.bytes && meta.cover.bytes.length && meta.cover.bytes.length <= 3 * 1024 * 1024) {
        try {
          coverImage = await makeCoverThumbnail(meta.cover.bytes, meta.cover.mime);
        } catch (error) {
          coverImage = null;
        }
      }
      const seed = hashString(title + ':' + author + ':' + (byteLength || 0));
      const cover = LOCAL_COVERS[seed % LOCAL_COVERS.length];
      return {
        id: 'local-' + Date.now().toString(36) + '-' + (seed % 99991).toString(36),
        title: title,
        author: author,
        subtitle: label,
        description: '从 ' + label + ' 导入的书籍，保存在你的书库目录中。',
        tags: [label, '本地导入'],
        source: 'local',
        format: format,
        coverImage: coverImage || undefined,
        addedAt: Date.now(),
        cover: {
          from: cover.from,
          to: cover.to,
          ink: cover.ink,
          accent: cover.accent,
          glyph: Array.from(title)[0] || '书',
        },
        chapters: chapters,
      };
    }

    async function openBookArchive(bytes) {
      try {
        return await readZipArchive(bytes);
      } catch (error) {
        if (error && error.message === 'epub-encrypted') throw new Error('book-drm');
        if (error && error.message === 'epub-unsupported') throw error;
        throw new Error('book-invalid');
      }
    }

    // ---------------------------------------------------------------------------
    // FB2 / FBZ
    // ---------------------------------------------------------------------------

    function xmlDeclaredEncoding(bytes) {
      const head = latin1String(bytes, 0, Math.min(bytes.length, 400));
      const match = /<\?xml[^>]*encoding\s*=\s*["']([^"']+)["']/i.exec(head);
      return match ? match[1] : '';
    }

    function fb2Href(node) {
      const attrs = node.attrs || {};
      return attrs['l:href'] || attrs['xlink:href'] || attrs.href || Object.keys(attrs).reduce(function find(found, key) {
        return found || (/:href$/.test(key) ? attrs[key] : '');
      }, '');
    }

    function fb2Inline(node, notes) {
      return (node.children || []).map(function each(child) {
        if (typeof child.text === 'string') return escapeBookHtml(child.text);
        const inner = fb2Inline(child, notes);
        switch (child.local) {
          case 'strong': return '<strong>' + inner + '</strong>';
          case 'emphasis': return '<em>' + inner + '</em>';
          case 'strikethrough': return '<s>' + inner + '</s>';
          case 'sub': return '<sub>' + inner + '</sub>';
          case 'sup': return '<sup>' + inner + '</sup>';
          case 'code': return '<code>' + inner + '</code>';
          case 'image': {
            const href = fb2Href(child);
            return href ? '<img src="' + escapeBookHtml(href) + '" alt=""/>' : '';
          }
          case 'a': {
            const href = fb2Href(child);
            if (/^#/.test(href)) {
              const id = cleanAnchorId(href);
              if (child.attrs.type === 'note' || notes.has(id)) {
                return '<sup><a href="#' + id + '" epub:type="noteref">' + (inner || '*') + '</a></sup>';
              }
              return '<a href="#' + id + '">' + inner + '</a>';
            }
            if (/^(?:https?:|mailto:)/i.test(href)) return '<a href="' + escapeBookHtml(href) + '">' + inner + '</a>';
            return inner;
          }
          default: return inner;
        }
      }).join('');
    }

    function fb2IdAttr(node) {
      return node.attrs && node.attrs.id ? ' id="' + cleanAnchorId(node.attrs.id) + '"' : '';
    }

    // Block content of a section (everything but nested sections) as HTML.
    function fb2Blocks(nodes, notes) {
      const out = [];
      nodes.forEach(function each(node) {
        if (!node.local) return;
        switch (node.local) {
          case 'p':
            out.push('<p' + fb2IdAttr(node) + '>' + fb2Inline(node, notes) + '</p>');
            break;
          case 'subtitle':
            out.push('<h4' + fb2IdAttr(node) + '>' + fb2Inline(node, notes) + '</h4>');
            break;
          case 'empty-line':
            break;
          case 'image': {
            const href = fb2Href(node);
            if (href) out.push('<img src="' + escapeBookHtml(href) + '" alt="' + escapeBookHtml(node.attrs.alt || node.attrs.title || '') + '"/>');
            break;
          }
          case 'title':
            out.push('<p><strong>' + xmlChildren(node, 'p').map(function line(p) { return fb2Inline(p, notes); }).join('<br/>') + '</strong></p>');
            break;
          case 'epigraph':
          case 'cite':
            out.push('<blockquote' + fb2IdAttr(node) + '>' + fb2Blocks(node.children, notes).join('') + '</blockquote>');
            break;
          case 'text-author':
            out.push('<p>—— ' + fb2Inline(node, notes) + '</p>');
            break;
          case 'poem': {
            const parts = [];
            (node.children || []).forEach(function part(child) {
              if (child.local === 'stanza') {
                const lines = xmlChildren(child, 'v').map(function verse(v) { return fb2Inline(v, notes); });
                const stanzaTitle = xmlFirst(child, 'title');
                if (stanzaTitle) parts.push('<p><strong>' + escapeBookHtml(collapseWhitespace(xmlText(stanzaTitle))) + '</strong></p>');
                if (lines.length) parts.push('<p>' + lines.join('<br/>') + '</p>');
              } else if (child.local === 'title') {
                parts.push('<p><strong>' + escapeBookHtml(collapseWhitespace(xmlText(child))) + '</strong></p>');
              } else if (child.local === 'epigraph' || child.local === 'text-author' || child.local === 'date') {
                parts.push(fb2Blocks([child], notes).join('') || '<p>' + fb2Inline(child, notes) + '</p>');
              }
            });
            out.push('<blockquote class="poem"' + fb2IdAttr(node) + '>' + parts.join('') + '</blockquote>');
            break;
          }
          case 'table': {
            const rows = xmlChildren(node, 'tr').map(function row(tr) {
              return '<tr>' + (tr.children || []).filter(function cell(c) { return c.local === 'td' || c.local === 'th'; }).map(function cell(c) {
                return '<' + c.local + '>' + fb2Inline(c, notes) + '</' + c.local + '>';
              }).join('') + '</tr>';
            });
            if (rows.length) out.push('<table>' + rows.join('') + '</table>');
            break;
          }
          case 'section':
            break;
          default:
            if ((node.children || []).length) out.push('<p>' + fb2Inline(node, notes) + '</p>');
        }
      });
      return out;
    }

    function fb2SectionTitle(section) {
      const title = xmlChildren(section, 'title')[0];
      if (!title) return '';
      const lines = xmlChildren(title, 'p').map(function line(p) { return collapseWhitespace(xmlText(p)); }).filter(Boolean);
      return (lines.length ? lines.join(' · ') : collapseWhitespace(xmlText(title))).slice(0, 100);
    }

    // Every section with its own text becomes a chapter. A section that only
    // groups others ("第一部") passes its title down as a heading of the first one.
    function fb2Sections(section, notes, carried, out) {
      const title = fb2SectionTitle(section);
      const ownNodes = (section.children || []).filter(function own(child) { return child.local && child.local !== 'section' && child.local !== 'title'; });
      const blocks = fb2Blocks(ownNodes, notes);
      const children = xmlChildren(section, 'section');
      const anchor = section.attrs && section.attrs.id ? '<a id="' + cleanAnchorId(section.attrs.id) + '"></a>' : '';
      const hasText = blocks.some(function text(block) { return /\S/.test(block.replace(/<(?!img)[^>]*>/g, '')); });
      if (hasText) {
        // <h4>, not <h3>: the extractor takes the first h1-h3 as a duplicate of the
        // chapter title and drops it, and this part title is not the chapter's.
        const heading = carried.length ? '<h4>' + carried.map(escapeBookHtml).join(' · ') + '</h4>' : '';
        out.push({ title: title || carried[carried.length - 1] || '', html: heading + anchor + blocks.join('') });
        carried = [];
      } else if (title) {
        carried = carried.concat([title]);
      }
      children.forEach(function child(next, index) {
        fb2Sections(next, notes, index === 0 ? carried : [], out);
      });
    }

    function fb2NotesHtml(body) {
      const notes = [];
      xmlChildren(body, 'section').forEach(function collect(section) {
        const inner = xmlChildren(section, 'section');
        if (inner.length) {
          inner.forEach(function deeper(child) { notes.push(child); });
          return;
        }
        notes.push(section);
      });
      return notes.map(function note(section) {
        const id = section.attrs && section.attrs.id ? cleanAnchorId(section.attrs.id) : '';
        const label = fb2SectionTitle(section);
        const blocks = fb2Blocks((section.children || []).filter(function own(c) { return c.local && c.local !== 'title'; }), new Set());
        const text = blocks.join('').replace(/^<p>/, '<p>' + (label ? '<strong>' + escapeBookHtml(label) + '</strong> ' : ''));
        return '<aside' + (id ? ' id="' + id + '"' : '') + ' epub:type="footnote">' + (text || '<p>' + escapeBookHtml(label) + '</p>') + '</aside>';
      }).join('');
    }

    async function parseFb2Book(fileName, bytes, label) {
      const source = decodeWithCharset(bytes, xmlDeclaredEncoding(bytes));
      if (!/<FictionBook\b/i.test(source.slice(0, 20000))) throw new Error('book-invalid');
      const tree = parseXmlTree(source);
      const book = xmlFirst(tree, 'fictionbook');
      if (!book) throw new Error('book-invalid');
      const titleInfo = xmlFirst(xmlFirst(book, 'description'), 'title-info');
      const title = collapseWhitespace(xmlText(xmlFirst(titleInfo, 'book-title')));
      const authors = xmlChildren(titleInfo, 'author').map(function name(author) {
        const parts = ['first-name', 'middle-name', 'last-name'].map(function part(key) { return collapseWhitespace(xmlText(xmlFirst(author, key))); }).filter(Boolean);
        return parts.length ? parts.join(' ') : collapseWhitespace(xmlText(xmlFirst(author, 'nickname')));
      }).filter(Boolean);

      const binaries = new Map();
      xmlChildren(book, 'binary').forEach(function keep(binary) {
        const id = binary.attrs && binary.attrs.id;
        if (id) binaries.set(cleanAnchorId(id), binary);
      });
      function binaryImage(href) {
        const binary = binaries.get(cleanAnchorId(String(href || '').replace(/^#/, '')));
        if (!binary) return null;
        const bytesOut = base64ToBytesLoose(xmlText(binary));
        const mime = sniffImageMime(bytesOut);
        return mime ? { bytes: bytesOut, mime: mime } : null;
      }

      const bodies = xmlChildren(book, 'body');
      const noteBodies = bodies.filter(function notes(body) { return /notes|comments|footnotes/i.test(String(body.attrs && body.attrs.name || '')); });
      const mainBodies = bodies.filter(function main(body) { return noteBodies.indexOf(body) < 0; });
      if (!mainBodies.length) throw new Error('book-empty');
      const notes = new Set();
      noteBodies.forEach(function ids(body) {
        (function walk(node) {
          (node.children || []).forEach(function child(c) {
            if (c.local === 'section' && c.attrs && c.attrs.id) notes.add(cleanAnchorId(c.attrs.id));
            if (c.local) walk(c);
          });
        })(body);
      });

      const segments = [];
      mainBodies.forEach(function body(main) {
        const intro = fb2Blocks((main.children || []).filter(function own(c) { return c.local && c.local !== 'section' && c.local !== 'title'; }), notes);
        const bodyTitle = xmlChildren(main, 'title')[0];
        if (intro.length && intro.some(function text(block) { return /\S/.test(block.replace(/<(?!img)[^>]*>/g, '')); })) {
          segments.push({ title: (bodyTitle && collapseWhitespace(xmlText(bodyTitle))) || title || '', html: intro.join('') });
        }
        xmlChildren(main, 'section').forEach(function section(s) { fb2Sections(s, notes, [], segments); });
      });
      const notesHtml = noteBodies.map(fb2NotesHtml).join('');
      if (notesHtml) segments.push({ title: '注释', html: notesHtml });

      const coverImage = xmlFirst(xmlFirst(titleInfo, 'coverpage'), 'image');
      const cover = coverImage ? binaryImage(fb2Href(coverImage)) : null;
      const chapters = await chaptersFromHtmlSegments(segments, binaryImage, { keepSingle: segments.length > 1 });
      return finishDocumentBook('fb2', fileName, { title: title, author: authors.join(' / '), cover: cover, label: label }, chapters, bytes.length);
    }

    async function parseFbzBook(fileName, bytes) {
      const archive = await openBookArchive(bytes);
      const name = archive.names.find(function fb2(entry) { return /\.fb2$/i.test(entry); });
      if (!name) throw new Error('book-invalid');
      const inner = await archive.readBytes(name);
      return parseFb2Book(fileName.replace(/\.(?:zip|fbz)$/i, ''), inner, 'FB2');
    }

    // ---------------------------------------------------------------------------
    // One HTML document -> book (MOBI text is HTML)
    // ---------------------------------------------------------------------------

    async function htmlDocumentBook(format, fileName, html, resolveImage, meta, byteLength) {
      const segments = splitHtmlDocument(html).map(function segment(part) { return { html: part }; });
      const chapters = await chaptersFromHtmlSegments(segments, resolveImage, { keepSingle: segments.length > 1 });
      return finishDocumentBook(format, fileName, meta, chapters, byteLength);
    }

    // ---------------------------------------------------------------------------
    // MOBI / AZW / AZW3 / PRC (and plain PalmDOC .pdb)
    // ---------------------------------------------------------------------------

    function palmDocDecompress(input) {
      const out = new Uint8Array(input.length * 5 + 16);
      let i = 0;
      let o = 0;
      while (i < input.length) {
        const c = input[i];
        i += 1;
        if (c >= 1 && c <= 8) {
          for (let k = 0; k < c && i < input.length; k += 1) {
            out[o] = input[i];
            o += 1;
            i += 1;
          }
        } else if (c < 0x80) {
          out[o] = c;
          o += 1;
        } else if (c >= 0xc0) {
          out[o] = 0x20;
          out[o + 1] = c ^ 0x80;
          o += 2;
        } else {
          if (i >= input.length) break;
          const pair = (c << 8) | input[i];
          i += 1;
          const distance = (pair >> 3) & 0x7ff;
          const length = (pair & 7) + 3;
          if (!distance || distance > o) continue;
          for (let k = 0; k < length; k += 1) {
            out[o] = out[o - distance];
            o += 1;
          }
        }
      }
      return out.subarray(0, o);
    }

    // Size of the trailing entries a text record carries after its text
    // (multibyte overlap, TBS indexing data...), per the record-0 extra flags.
    function mobiTrailingSize(record, flags) {
      const size = record.length;
      let total = 0;
      let bits = flags >> 1;
      while (bits) {
        if (bits & 1) {
          let pos = size - total;
          let shift = 0;
          let value = 0;
          while (pos > 0) {
            const byte = record[pos - 1];
            value |= (byte & 0x7f) << shift;
            shift += 7;
            pos -= 1;
            if ((byte & 0x80) || shift >= 28) break;
          }
          total += value;
        }
        bits >>= 1;
      }
      if (flags & 1) {
        const at = size - total - 1;
        if (at >= 0) total += (record[at] & 3) + 1;
      }
      return Math.min(total, size);
    }

    // HUFF/CDIC decompression (Amazon's own MOBI encoder uses it).
    function createHuffReader(records) {
      const huff = records[0];
      if (!huff || latin1String(huff, 0, 4) !== 'HUFF') throw new Error('book-invalid');
      const view = new DataView(huff.buffer, huff.byteOffset, huff.byteLength);
      const off1 = view.getUint32(8);
      const off2 = view.getUint32(12);
      const dict1 = [];
      for (let index = 0; index < 256; index += 1) {
        const value = view.getUint32(off1 + index * 4);
        const length = value & 0x1f;
        dict1.push({ length: length, term: Boolean(value & 0x80), max: (Math.floor(value / 256) + 1) * Math.pow(2, 32 - length) - 1 });
      }
      const minCode = [0];
      const maxCode = [0];
      for (let length = 1; length <= 32; length += 1) {
        minCode.push(view.getUint32(off2 + (length - 1) * 8) * Math.pow(2, 32 - length));
        maxCode.push((view.getUint32(off2 + (length - 1) * 8 + 4) + 1) * Math.pow(2, 32 - length) - 1);
      }
      const dictionary = [];
      records.slice(1).forEach(function cdic(record) {
        if (latin1String(record, 0, 4) !== 'CDIC') return;
        const cv = new DataView(record.buffer, record.byteOffset, record.byteLength);
        const phrases = cv.getUint32(8);
        const bits = cv.getUint32(12);
        const count = Math.min(Math.pow(2, bits), phrases - dictionary.length);
        for (let index = 0; index < count; index += 1) {
          const offset = cv.getUint16(16 + index * 2);
          const blen = cv.getUint16(16 + offset);
          dictionary.push({ bytes: record.subarray(18 + offset, 18 + offset + (blen & 0x7fff)), done: Boolean(blen & 0x8000) });
        }
      });

      function peek32(data, bitPos) {
        const byte = bitPos >>> 3;
        const shift = bitPos & 7;
        const b = function at(k) { return byte + k < data.length ? data[byte + k] : 0; };
        const high = ((b(0) << 24) >>> 0) + (b(1) << 16) + (b(2) << 8) + b(3);
        if (!shift) return high;
        return ((high * Math.pow(2, shift)) % 4294967296) + (b(4) >> (8 - shift));
      }

      function unpack(data, depth) {
        if (depth > 32) throw new Error('book-invalid');
        const parts = [];
        let bitsLeft = data.length * 8;
        let pos = 0;
        while (true) {
          const code = peek32(data, pos);
          const entry = dict1[code >>> 24];
          let length = entry.length;
          let max = entry.max;
          if (!entry.term) {
            while (length < 32 && code < minCode[length]) length += 1;
            max = maxCode[length];
          }
          if (!length) throw new Error('book-invalid');
          pos += length;
          bitsLeft -= length;
          if (bitsLeft < 0) break;
          const slot = Math.floor((max - code) / Math.pow(2, 32 - length));
          const phrase = dictionary[slot];
          if (!phrase) throw new Error('book-invalid');
          if (!phrase.done) {
            dictionary[slot] = null;
            phrase.bytes = unpack(phrase.bytes, depth + 1);
            phrase.done = true;
            dictionary[slot] = phrase;
          }
          parts.push(phrase.bytes);
        }
        return concatBytes(parts);
      }
      return function decompress(data) { return unpack(data, 0); };
    }

    function base32Index(value) {
      const digits = '0123456789ABCDEFGHIJKLMNOPQRSTUV';
      let out = 0;
      String(value || '').toUpperCase().split('').forEach(function add(char) {
        const at = digits.indexOf(char);
        if (at >= 0) out = out * 32 + at;
      });
      return out;
    }

    function mobiCharset(code) {
      if (code === 65001) return 'utf-8';
      if (code === 1252 || !code) return 'windows-1252';
      return 'windows-' + code;
    }

    async function parseMobiBook(fileName, bytes) {
      if (bytes.length < 86) throw new Error('book-invalid');
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const kind = latin1String(bytes, 60, 68);
      if (kind === 'TPZ3XXXX' || latin1String(bytes, 0, 4) === 'TPZ0') throw new Error('book-unsupported');
      if (kind !== 'BOOKMOBI' && kind !== 'TEXtREAd') throw new Error('book-invalid');
      const count = view.getUint16(76);
      if (!count || 78 + count * 8 > bytes.length) throw new Error('book-invalid');
      const offsets = [];
      for (let index = 0; index < count; index += 1) offsets.push(view.getUint32(78 + index * 8));
      function record(index) {
        if (index < 0 || index >= count) return new Uint8Array(0);
        const start = offsets[index];
        const end = index + 1 < count ? offsets[index + 1] : bytes.length;
        if (start > bytes.length || end < start) return new Uint8Array(0);
        return bytes.subarray(start, Math.min(end, bytes.length));
      }
      const header = record(0);
      if (header.length < 16) throw new Error('book-invalid');
      const hv = new DataView(header.buffer, header.byteOffset, header.byteLength);
      const compression = hv.getUint16(0);
      const textLength = hv.getUint32(4);
      const textRecords = hv.getUint16(8);
      let encoding = 1252;
      let extraFlags = 0;
      let firstImage = -1;
      let version = 0;
      let title = latin1String(bytes, 0, 32).replace(/\u0000[\s\S]*$/, '').replace(/_/g, ' ');
      const authors = [];
      let coverOffset = -1;
      let flowEnd = -1;
      let huff = null;
      if (kind === 'BOOKMOBI') {
        if (hv.getUint16(12) !== 0) throw new Error('book-drm');
        if (header.length >= 24 && latin1String(header, 16, 20) === 'MOBI') {
          const headerLength = hv.getUint32(20);
          encoding = hv.getUint32(28);
          version = header.length >= 40 ? hv.getUint32(36) : 0;
          if (header.length >= 112) firstImage = hv.getUint32(108);
          if (headerLength >= 0xe4 && header.length >= 0xf4) extraFlags = hv.getUint16(0xf2);
          if (header.length >= 92) {
            const nameOffset = hv.getUint32(84);
            const nameLength = hv.getUint32(88);
            if (nameLength && nameOffset + nameLength <= header.length) {
              title = decodeWithCharset(header.subarray(nameOffset, nameOffset + nameLength), mobiCharset(encoding));
            }
          }
          if (compression === 17480 && header.length >= 120) {
            const huffStart = hv.getUint32(112);
            const huffCount = hv.getUint32(116);
            const huffRecords = [];
            for (let index = 0; index < huffCount; index += 1) huffRecords.push(record(huffStart + index));
            huff = createHuffReader(huffRecords);
          }
          if (version >= 8 && header.length >= 0xc8) {
            const fdst = hv.getUint32(0xc0);
            const fdstRecord = fdst > 0 && fdst < count ? record(fdst) : null;
            if (fdstRecord && fdstRecord.length >= 20 && latin1String(fdstRecord, 0, 4) === 'FDST') {
              const fv = new DataView(fdstRecord.buffer, fdstRecord.byteOffset, fdstRecord.byteLength);
              flowEnd = fv.getUint32(16);
            }
          }
          const exthFlags = header.length >= 132 ? hv.getUint32(128) : 0;
          const exthStart = 16 + headerLength;
          if ((exthFlags & 0x40) && exthStart + 12 <= header.length && latin1String(header, exthStart, exthStart + 4) === 'EXTH') {
            const entries = hv.getUint32(exthStart + 8);
            let at = exthStart + 12;
            for (let index = 0; index < entries && at + 8 <= header.length; index += 1) {
              const type = hv.getUint32(at);
              const length = hv.getUint32(at + 4);
              if (length < 8 || at + length > header.length) break;
              const data = header.subarray(at + 8, at + length);
              if (type === 100) authors.push(decodeWithCharset(data, mobiCharset(encoding)));
              else if (type === 503) title = decodeWithCharset(data, mobiCharset(encoding)) || title;
              else if (type === 201 && data.length >= 4) coverOffset = new DataView(data.buffer, data.byteOffset, data.byteLength).getUint32(0);
              at += length;
            }
          }
        }
      }
      if (compression !== 1 && compression !== 2 && compression !== 17480) throw new Error('book-unsupported');

      const parts = [];
      for (let index = 1; index <= textRecords && index < count; index += 1) {
        let data = record(index);
        if (extraFlags) data = data.subarray(0, data.length - mobiTrailingSize(data, extraFlags));
        if (compression === 2) parts.push(palmDocDecompress(data));
        else if (compression === 17480) parts.push(huff(data));
        else parts.push(data);
      }
      let raw = concatBytes(parts);
      if (textLength && raw.length > textLength) raw = raw.subarray(0, textLength);
      if (flowEnd > 0 && flowEnd < raw.length) raw = raw.subarray(0, flowEnd);
      if (!raw.length) throw new Error('empty');

      const charset = mobiCharset(encoding);
      let html;
      if (kind === 'TEXtREAd') {
        html = decodeWithCharset(raw, charset).split(/\n\s*\n|\r\n\s*\r\n/).map(function para(text) {
          return '<p>' + escapeBookHtml(text.trim()).replace(/\r?\n/g, '<br/>') + '</p>';
        }).join('');
      } else {
        // MOBI 6 links point at byte offsets (`filepos`): drop an anchor at each one
        // before decoding, so the table of contents keeps working.
        let latin = latin1String(raw);
        if (version < 8) {
          const targets = new Set();
          latin.replace(/filepos\s*=\s*["']?0*(\d+)/gi, function collect(match, position) {
            targets.add(Number(position));
            return match;
          });
          if (targets.size) {
            const sorted = Array.from(targets).filter(function inside(n) { return n >= 0 && n < latin.length; }).sort(function asc(a, b) { return a - b; });
            const pieces = [];
            let last = 0;
            sorted.forEach(function insert(position) {
              pieces.push(latin.slice(last, position), '<a id="filepos' + position + '"></a>');
              last = position;
            });
            pieces.push(latin.slice(last));
            latin = pieces.join('');
          }
          latin = latin.replace(/(<a\b[^>]*?)\bfilepos\s*=\s*["']?0*(\d+)["']?/gi, '$1href="#filepos$2"');
        }
        html = decodeWithCharset(latin1Bytes(latin), charset);
        html = html
          .replace(/<img\b([^>]*?)\b(?:hi|lo)?recindex\s*=\s*["']?(\d+)["']?([^>]*)>/gi, function recindex(match, before, index, after) {
            return '<img src="mobi:' + Number(index) + '"' + before.replace(/\bsrc\s*=\s*("[^"]*"|'[^']*'|\S+)/i, '') + after + '>';
          })
          .replace(/kindle:embed:([0-9A-Va-v]+)(?:\?[^"'\s>]*)?/g, function embed(match, index) {
            return 'mobi:' + base32Index(index);
          })
          .replace(/\bhref\s*=\s*["']kindle:[^"']*["']/gi, '');
        if (version >= 8) {
          // KF8 keeps each file as a skeleton followed by its fragments; flatten them
          // into one body so the fragments that follow a `</html>` are not lost.
          html = '<body>' + html
            .replace(/<\?xml[\s\S]*?\?>/gi, '')
            .replace(/<!DOCTYPE[^>]*>/gi, '')
            .replace(/<head\b[\s\S]*?<\/head\s*>/gi, '')
            .replace(/<\/?(?:html|body)\b[^>]*>/gi, '') + '</body>';
        }
      }

      function imageRecord(position) {
        if (firstImage < 0 || firstImage >= count || position < 0) return null;
        const data = record(firstImage + position);
        const mime = sniffImageMime(data);
        return mime ? { bytes: data, mime: mime } : null;
      }
      const cover = coverOffset >= 0 && coverOffset !== 0xffffffff ? imageRecord(coverOffset) : null;
      const meta = {
        title: collapseWhitespace(title),
        author: authors.map(collapseWhitespace).filter(Boolean).join(' / '),
        cover: cover,
        label: version >= 8 ? 'AZW3' : /\.azw$/i.test(fileName) ? 'AZW' : 'MOBI',
      };
      return htmlDocumentBook('mobi', fileName, html, function resolve(src) {
        const match = /^mobi:(\d+)$/.exec(String(src || ''));
        return match ? imageRecord(Number(match[1]) - 1) : null;
      }, meta, bytes.length);
    }
