    const ICON_SHAPES = {
      book: [
        ['path', { d: 'M12 6.2C10.8 4.8 9 4 7 4H4.2v14.2H10c1.6 0 3 .7 4 1.9 1-1.2 2.4-1.9 4-1.9h5.8V4H19c-2 0-3.8.8-5 2.2Z' }],
        ['path', { d: 'M12 6.2v13.9' }],
      ],
      'book-open': [
        ['path', { d: 'M12 7.2C10.5 5.7 8.4 5 6.2 5H4v13.4h2.4c2 0 3.9.6 5.2 1.9 1.3-1.3 3.2-1.9 5.2-1.9H20V5h-2.2C15.6 5 13.5 5.7 12 7.2Z' }],
        ['path', { d: 'M12 7.4v12.6' }],
      ],
      search: [['circle', { cx: 11, cy: 11, r: 6.1 }], ['path', { d: 'm16 16 4.1 4.1' }]],
      upload: [['path', { d: 'M12 16V4' }], ['path', { d: 'm7 9 5-5 5 5' }], ['path', { d: 'M4 16v2.2c0 .5.4.8.8.8h14.4c.4 0 .8-.3.8-.8V16' }]],
      download: [['path', { d: 'M12 4v11' }], ['path', { d: 'm7.5 10.5 4.5 4.5 4.5-4.5' }], ['path', { d: 'M4.5 20h15' }]],
      plus: [['path', { d: 'M12 5.5v13M5.5 12h13' }]],
      minus: [['path', { d: 'M5.5 12h13' }]],
      'arrow-left': [['path', { d: 'M19 12H5' }], ['path', { d: 'm11 6-6 6 6 6' }]],
      'arrow-right': [['path', { d: 'M5 12h14' }], ['path', { d: 'm13 6 6 6-6 6' }]],
      'chevron-left': [['path', { d: 'm15 5-7 7 7 7' }]],
      'chevron-right': [['path', { d: 'm9 5 7 7-7 7' }]],
      'chevron-down': [['path', { d: 'm5 9.5 7 7 7-7' }]],
      'arrow-up-right': [['path', { d: 'M7 17 17 7' }], ['path', { d: 'M8 7h9v9' }]],
      'arrow-up-left': [['path', { d: 'm17 17-10-10' }], ['path', { d: 'M16 7H7v9' }]],
      'arrow-down-right': [['path', { d: 'm7 7 10 10' }], ['path', { d: 'M8 17h9V8' }]],
      close: [['path', { d: 'm6 6 12 12M18 6 6 18' }]],
      bookmark: [['path', { d: 'M6.5 4.5h11v15.2L12 15.4l-5.5 4.3V4.5Z' }]],
      pin: [['path', { d: 'M9.2 3.8h5.6l-.7 5 3.1 3v1.4H6.8v-1.4l3.1-3-.7-5Z' }], ['path', { d: 'M12 13.4v6.4' }]],
      'pin-filled': [['path', { d: 'M9.2 3.8h5.6l-.7 5 3.1 3v1.4H6.8v-1.4l3.1-3-.7-5Z', fill: 'currentColor' }], ['path', { d: 'M12 13.4v6.4' }]],
      'bookmark-filled': [['path', { d: 'M6.5 4.5h11v15.2L12 15.4l-5.5 4.3V4.5Z', fill: 'currentColor' }]],
      tag: [
        ['path', { d: 'M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z' }],
        ['path', { d: 'M7 7h.01', strokeWidth: 2.6 }],
      ],
      notes: [
        ['path', { d: 'M4.5 5.5h11l4 4v9.5h-15v-13.5Z' }],
        ['path', { d: 'M15 5.5V10h4' }],
        ['path', { d: 'M8 13h7M8 16.4h4.6' }],
      ],
      list: [['path', { d: 'M9 6.5h11M9 12h11M9 17.5h11' }], ['path', { d: 'M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01', strokeWidth: 2.6 }]],
      type: [
        ['path', { d: 'M4.5 7V5.2h15V7' }],
        ['path', { d: 'M12 5.4V19' }],
        ['path', { d: 'M8.3 19h7.4' }],
      ],
      palette: [
        ['path', { d: 'M12 3.8c4.5 0 8 3.2 8 7.2 0 2.3-1.4 3.7-3.4 3.7h-1.8c-1.3 0-2.2.9-2.2 2 0 .5.2.9.5 1.3.3.4.5.8.5 1.3 0 1-.8 1.7-2 1.7-4.4 0-7.6-3.6-7.6-8.1 0-4.7 3.5-9.1 8-9.1Z' }],
        ['circle', { cx: 8, cy: 9.4, r: 1, fill: 'currentColor', stroke: 'none' }],
        ['circle', { cx: 12, cy: 7.2, r: 1, fill: 'currentColor', stroke: 'none' }],
        ['circle', { cx: 16.4, cy: 9.1, r: 1, fill: 'currentColor', stroke: 'none' }],
      ],
      grid: [['rect', { x: 4.2, y: 4.2, width: 6.4, height: 6.4, rx: 1.4 }], ['rect', { x: 13.4, y: 4.2, width: 6.4, height: 6.4, rx: 1.4 }], ['rect', { x: 4.2, y: 13.4, width: 6.4, height: 6.4, rx: 1.4 }], ['rect', { x: 13.4, y: 13.4, width: 6.4, height: 6.4, rx: 1.4 }]],
      layers: [['path', { d: 'm12 3.5 8.5 4.5-8.5 4.5L3.5 8l8.5-4.5Z' }], ['path', { d: 'm3.5 12 8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5' }]],
      sliders: [['path', { d: 'M5 6.5h14M5 12h14M5 17.5h14' }], ['circle', { cx: 9, cy: 6.5, r: 2, fill: 'var(--sr-panel,var(--dsw-alias-bg-layer-1))' }], ['circle', { cx: 15, cy: 12, r: 2, fill: 'var(--sr-panel,var(--dsw-alias-bg-layer-1))' }], ['circle', { cx: 8, cy: 17.5, r: 2, fill: 'var(--sr-panel,var(--dsw-alias-bg-layer-1))' }]],
      check: [['path', { d: 'm5 12.5 4.5 4.5L19 6.5' }]],
      trash: [
        ['path', { d: 'M4.8 7h14.4' }],
        ['path', { d: 'M9.6 7V5.4c0-.7.5-1.2 1.2-1.2h2.4c.7 0 1.2.5 1.2 1.2V7' }],
        ['path', { d: 'M6.6 7l.8 11.2c0 .7.6 1.2 1.3 1.2h6.6c.7 0 1.3-.5 1.3-1.2L17.4 7' }],
        ['path', { d: 'M10.4 11v4.6M13.6 11v4.6' }],
      ],
      quote: [['path', { d: 'M5 13.5c0-3.4 1.9-6 5-7.3' }], ['path', { d: 'M5 13.5h4.2v5H5v-5Z', fill: 'currentColor', stroke: 'none', opacity: '.9' }], ['path', { d: 'M14 13.5c0-3.4 1.9-6 5-7.3' }], ['path', { d: 'M14 13.5h4.2v5H14v-5Z', fill: 'currentColor', stroke: 'none', opacity: '.9' }]],
      flame: [['path', { d: 'M12.2 3.5c.4 3.3-1.7 4.3-2.8 6.1-.8-1.4-.7-2.7-.2-3.8-2.1 1.6-4.2 4-4.2 7.3a7 7 0 0 0 14 0c0-4.4-3.9-7.7-6.8-9.6Z' }], ['path', { d: 'M12.2 20a3.1 3.1 0 0 1-3.1-3.1c0-1.8 1.3-2.7 2.3-4.2.4 1.5 2.6 2.4 2.6 4.4A3 3 0 0 1 12.2 20Z', opacity: '.55' }]],
      clock: [['circle', { cx: 12, cy: 12, r: 8.2 }], ['path', { d: 'M12 7.5V12l3.1 1.8' }]],
      chart: [['path', { d: 'M4 20V4' }], ['path', { d: 'M4 20h16' }], ['path', { d: 'M8 16v-4M12 16V7M16 16v-6' }]],
      star: [['path', { d: 'm12 3.7 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.8l5.8-.8L12 3.7Z' }]],
      'star-filled': [['path', { d: 'm12 3.7 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.8l5.8-.8L12 3.7Z', fill: 'currentColor' }]],
      sparkle: [['path', { d: 'M12 3.7c.6 4.1 2.2 5.7 6.3 6.3-4.1.6-5.7 2.2-6.3 6.3-.6-4.1-2.2-5.7-6.3-6.3 4.1-.6 5.7-2.2 6.3-6.3Z' }], ['path', { d: 'M18.5 15.5c.2 1.3.8 1.9 2.1 2.1-1.3.2-1.9.8-2.1 2.1-.2-1.3-.8-1.9-2.1-2.1 1.3-.2 1.9-.8 2.1-2.1Z', opacity: '.7' }]],
      maximize: [['path', { d: 'M9 4H5a1 1 0 0 0-1 1v4M15 4h4a1 1 0 0 1 1 1v4M9 20H5a1 1 0 0 1-1-1v-4M15 20h4a1 1 0 0 0 1-1v-4' }]],
      minimize: [['path', { d: 'M4 9h4a1 1 0 0 0 1-1V4M20 9h-4a1 1 0 0 1-1-1V4M4 15h4a1 1 0 0 1 1 1v4M20 15h-4a1 1 0 0 0-1 1v4' }]],
      pen: [['path', { d: 'm5 19 1-4.6L16.1 4.3a1.7 1.7 0 0 1 2.4 0l1.2 1.2a1.7 1.7 0 0 1 0 2.4L9.6 18 5 19Z' }], ['path', { d: 'm14.7 5.7 3.6 3.6' }]],
      message: [['path', { d: 'M20 11.4c0 4-3.6 7.1-8 7.1-1 0-2-.2-2.9-.5L4.5 19.5l1.1-3.6A6.6 6.6 0 0 1 4 11.4c0-4 3.6-7.1 8-7.1s8 3.1 8 7.1Z' }], ['path', { d: 'M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01', strokeWidth: 2.4 }]],
      sun: [['circle', { cx: 12, cy: 12, r: 4.1 }], ['path', { d: 'M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M18.5 5.5l-1.4 1.4M6.9 17.1l-1.4 1.4' }]],
      moon: [['path', { d: 'M19.4 14.4A8 8 0 0 1 9.6 4.6a7.9 7.9 0 1 0 9.8 9.8Z' }]],
      leaf: [['path', { d: 'M20 4c-7.5 0-12 3.7-12 9.1 0 2.7 2 4.9 4.6 4.9C18 18 20 12.2 20 4Z' }], ['path', { d: 'M4 20c2.4-5.7 6.4-8.7 12-10.2' }]],
      play: [['path', { d: 'm8 5 11 7-11 7V5Z', fill: 'currentColor', stroke: 'none' }]],
      pause: [['path', { d: 'M9 5v14M15 5v14', strokeWidth: 2.4 }]],
      stop: [['rect', { x: 6, y: 6, width: 12, height: 12, rx: 2, fill: 'currentColor', stroke: 'none' }]],
      copy: [['rect', { x: 8.5, y: 3.8, width: 10.5, height: 12.4, rx: 2 }], ['path', { d: 'M15.4 20.1H6.6A2.2 2.2 0 0 1 4.4 17.9V7.2' }]],
      image: [['rect', { x: 3.5, y: 4.6, width: 17, height: 14.8, rx: 2.2 }], ['circle', { cx: 8.4, cy: 9.8, r: 1.4 }], ['path', { d: 'm5.2 17.1 4.6-4.6 3.2 3.2 2.1-2.1 4.9 4.6' }]],
      clipboard: [['rect', { x: 8, y: 3.8, width: 8, height: 3.5, rx: 1.2 }], ['path', { d: 'M8 5.8H6.3A2.3 2.3 0 0 0 4 8.1v10.3a2.3 2.3 0 0 0 2.3 2.3h11.4a2.3 2.3 0 0 0 2.3-2.3V8.1a2.3 2.3 0 0 0-2.3-2.3H16' }], ['path', { d: 'M9 11.2h6M9 14.2h6M9 17.2h3.8' }]],
      refresh: [['path', { d: 'M20 5.5v5h-5' }], ['path', { d: 'M19.2 10.5A7.5 7.5 0 1 1 12 4.5c2.4 0 4.6 1.1 6 2.9l1.2 2.1' }]],
      help: [['circle', { cx: 12, cy: 12, r: 8.4 }], ['path', { d: 'M9.55 9.2a2.65 2.65 0 0 1 5.1 1.1c0 1.8-2.65 2.1-2.65 4.3' }], ['circle', { cx: 12, cy: 17.6, r: .9, fill: 'currentColor', stroke: 'none' }]],
      volume: [['path', { d: 'M4 9.2h3.2L12 5.5v13l-4.8-3.7H4V9.2Z' }], ['path', { d: 'M15.5 9a4.5 4.5 0 0 1 0 6M18 6.4a7.7 7.7 0 0 1 0 11.2', opacity: '.7' }]],
      more: [['circle', { cx: 5.3, cy: 12, r: 1.1, fill: 'currentColor', stroke: 'none' }], ['circle', { cx: 12, cy: 12, r: 1.1, fill: 'currentColor', stroke: 'none' }], ['circle', { cx: 18.7, cy: 12, r: 1.1, fill: 'currentColor', stroke: 'none' }]],
      feather: [['path', { d: 'M20 4c-3.5-.3-7 .9-9.5 3.4-2.9 2.9-3.1 7.3-.4 10.1 2.8 2.8 7.3 2.5 10.2-.4C22.8 14.5 23 8.9 20 4Z' }], ['path', { d: 'M4 20 15.5 8.5' }]],
    };

    function Icon(props) {
      const size = props.size || 16;
      const shapes = ICON_SHAPES[props.name] || [];
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: props.strokeWidth || 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        focusable: false,
        className: props.className,
        style: props.style,
      }, shapes.map(function shape(node, index) {
        return h(node[0], Object.assign({ key: index }, node[1]));
      }));
    }

    function newId(prefix) {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return prefix + '-' + window.crypto.randomUUID();
      }
      return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
    }

    function hashString(value) {
      let hash = 2166136261;
      for (let i = 0; i < value.length; i += 1) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    }

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function isCjk(text) {
      return /[\u3400-\u9fff]/.test(text || '');
    }

    // An EPUB picture keeps its place in the text as its own paragraph, written the
    // way Markdown writes an image: `![图注](文件名.png)`. It stays readable in the
    // text file, survives a round trip through it, and gives the reader something to
    // swap for the real picture.
    const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

    function imageParagraph(text) {
      const match = IMAGE_LINE.exec(String(text == null ? '' : text).trim());
      if (!match) return null;
      return { alt: match[1], name: match[2] };
    }

    function stripHtmlTags(str) {
      return String(str || '')
        .replace(/<rt\b[^>]*>[\s\S]*?<\/rt>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"');
    }

    function chapterText(chapter) {
      // Picture lines are not prose: keeping them out of this join keeps them out of
      // search snippets, read-aloud chunks, word counts and excerpts.
      const paragraphs = chapter && Array.isArray(chapter.paragraphs) ? chapter.paragraphs : [];
      return paragraphs
        .filter(function keep(text) { return !imageParagraph(text); })
        .map(function toText(text) {
          if (/<[a-z][\s\S]*>/i.test(text)) {
            return stripHtmlTags(text);
          }
          return text;
        })
        .join('\n');
    }

    function bookCharCount(book) {
      if (!book) return 0;
      if (typeof book.charCount === 'number' && Number.isFinite(book.charCount) && book.charCount >= 0) {
        return book.charCount;
      }
      const chapters = Array.isArray(book.chapters) ? book.chapters : [];
      let total = 0;
      chapters.forEach(function count(chapter) {
        const paragraphs = Array.isArray(chapter && chapter.paragraphs) ? chapter.paragraphs : [];
        paragraphs.forEach(function add(text) {
          // `![图注](文件名.png)` is a place for a picture, not words to read.
          if (!imageParagraph(text)) {
            const clean = /<[a-z][\s\S]*>/i.test(text) ? stripHtmlTags(text) : text;
            total += String(clean || '').length;
          }
        });
      });
      return total;
    }

    function estimateMinutes(book) {
      return Math.max(1, Math.round(bookCharCount(book) / 420));
    }

    function formatBookInfo(book) {
      if (!book) return '';
      const title = String(book.title || '').trim();
      const author = String(book.author || '').trim();
      return '《' + title + '》' + (author ? ' ' + author : '');
    }

    function formatWordCount(count, t) {
      const n = Number(count) || 0;
      if (n <= 0) return fill(t('wordCountUnits'), { n: 0 });
      if (n >= 10000) {
        const val = (n / 10000).toFixed(1).replace(/\.0$/, '');
        return fill(t('wordCountTenThousand'), { n: val });
      }
      return fill(t('wordCountUnits'), { n: n.toLocaleString() });
    }

    function formatClock(date) {
      const d = date && typeof date.getHours === 'function' && !isNaN(date.getTime()) ? date : new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return hh + ':' + mm;
    }

    function chapterBaseOffsets(chapter) {
      const offsets = [];
      let cursor = 0;
      const paragraphs = chapter && Array.isArray(chapter.paragraphs) ? chapter.paragraphs : [];
      paragraphs.forEach(function base(text, index) {
        // Picture lines are absent from chapterText, so they must not advance the
        // cursor either — otherwise every highlight after a picture quotes the
        // wrong run of characters.
        offsets[index] = cursor;
        if (imageParagraph(text)) return;
        const cleanLen = (/<[a-z][\s\S]*>/i.test(text) ? stripHtmlTags(text) : text).length;
        cursor += cleanLen + 1;
      });
      return { offsets: offsets, total: Math.max(0, cursor - 1) };
    }

    function progressPercent(book, progress) {
      if (!progress) return 0;
      if (progress.completed) return 100;
      const chapters = (book && Array.isArray(book.chapters)) ? book.chapters : [];
      const chapterCount = Math.max(1, (book && (book.chapterCount || (book.chapterIds && book.chapterIds.length))) || chapters.length || 1);
      const chapterIndex = clamp(Number(progress.chapterIndex) || 0, 0, chapterCount - 1);
      const percent = clamp(Number(progress.percent) || 0, 0, 1);
      return clamp(Math.round(((chapterIndex + percent) / chapterCount) * 100), 0, 99);
    }

    function progressChapter(book, progress) {
      if (!progress || !book) return null;
      const chapters = Array.isArray(book.chapters) ? book.chapters : [];
      if (!chapters.length) return null;
      return chapters[clamp(Number(progress.chapterIndex) || 0, 0, Math.max(0, chapters.length - 1))] || null;
    }

    function dayKey(date) {
      const d = date || new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return year + '-' + month + '-' + day;
    }

    function startOfToday() {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    // Mean seconds/day over the trailing window, counting empty days as zero.
    function averageDailySeconds(days, span) {
      const source = days && typeof days === 'object' ? days : {};
      const total = Math.max(1, Math.min(30, Math.round(Number(span) || 7)));
      const today = startOfToday();
      let sum = 0;
      for (let offset = 0; offset < total; offset += 1) {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
        sum += Math.max(0, Number(source[dayKey(date)]) || 0);
      }
      return sum / total;
    }

    // Projected finish time from the book's own pace. Returns null when the sample is too thin.
    function estimateFinish(book, progress, readSeconds, paceSeconds) {
      const read = Math.max(0, Number(readSeconds) || 0);
      const pace = Math.max(0, Number(paceSeconds) || 0);
      const percent = progressPercent(book, progress);
      if (progress && progress.completed) {
        return { completed: true, percent: 100, totalSeconds: Math.round(read), remainingSeconds: 0, daysLeft: 0, paceSeconds: pace };
      }
      // Below 5% or under a minute of reading the linear projection is pure noise.
      if (!progress || percent < 5 || read < 60) return null;
      const totalSeconds = Math.round(read / (percent / 100));
      const remainingSeconds = Math.max(0, totalSeconds - read);
      if (remainingSeconds < 60) return null;
      return {
        completed: false,
        percent: percent,
        totalSeconds: totalSeconds,
        remainingSeconds: remainingSeconds,
        daysLeft: pace > 0 ? Math.max(1, Math.ceil(remainingSeconds / pace)) : 0,
        paceSeconds: pace,
      };
    }

    function weekSeries(days) {
      const names = ['daySun', 'dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat'];
      const today = startOfToday();
      const series = [];
      for (let offset = 6; offset >= 0; offset -= 1) {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
        const key = dayKey(date);
        series.push({
          key: key,
          label: names[date.getDay()],
          seconds: Math.max(0, Number(days[key]) || 0),
          today: offset === 0,
        });
      }
      return series;
    }

    function dailyGoalMinutes(goalMinutes) {
      const weekly = clamp(Number(goalMinutes) || DEFAULT_WEEKLY_GOAL_MINUTES, 30, 1440);
      return Math.max(5, Math.round(weekly / 7));
    }

    function todayGoalProgress(days, goalMinutes) {
      const targetSeconds = dailyGoalMinutes(goalMinutes) * 60;
      const source = days && typeof days === 'object' ? days : {};
      const seconds = Math.max(0, Number(source[dayKey()]) || 0);
      return {
        targetSeconds: targetSeconds,
        seconds: seconds,
        ratio: targetSeconds ? clamp(seconds / targetSeconds, 0, 1) : 0,
        done: seconds > 0 && seconds >= targetSeconds,
      };
    }

    function recentDays(days, count, shift) {
      const today = startOfToday();
      const out = [];
      const total = Math.max(1, count || 30);
      const back = Math.max(0, Math.round(Number(shift) || 0));
      for (let offset = total - 1; offset >= 0; offset -= 1) {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset - back);
        const key = dayKey(date);
        out.push({
          key: key,
          date: date.getTime(),
          day: date.getDate(),
          weekday: (date.getDay() + 6) % 7,
          seconds: Math.max(0, Number(days[key]) || 0),
          today: back === 0 && offset === 0,
        });
      }
      return out;
    }

    // Wraps an index inside [0, length); a negative cursor starts at either end.
    function stepIndex(current, length, delta) {
      const total = Math.max(0, Math.floor(Number(length) || 0));
      if (!total) return -1;
      const step = Number.isFinite(Number(delta)) ? Math.round(Number(delta)) : 0;
      const from = Number.isFinite(Number(current)) ? Math.floor(Number(current)) : -1;
      if (from < 0) return step < 0 ? total - 1 : 0;
      return ((from + step) % total + total) % total;
    }

    // Maps a keyboard event's key and modifier state to a reader page turn or boundary action.
    function readerKeyAction(key, modifiers) {
      const mods = modifiers || {};
      if (mods.meta || mods.ctrl || mods.alt) return null;
      const plain = String(key || '').toLowerCase();
      if (key === 'ArrowRight' || key === 'ArrowDown' || key === 'PageDown' || plain === 'j' || (key === ' ' && !mods.shift)) {
        return 'nextPage';
      }
      if (key === 'ArrowLeft' || key === 'ArrowUp' || key === 'PageUp' || plain === 'k' || (key === ' ' && mods.shift)) {
        return 'prevPage';
      }
      if (key === 'Home') return 'firstPage';
      if (key === 'End') return 'lastPage';
      return null;
    }

    // Trailing 7 days vs the 7 before them, for the stats week panel.
    function weekComparison(days) {
      const source = days && typeof days === 'object' ? days : {};
      const sumOver = function sum(shift) {
        return recentDays(source, 7, shift).reduce(function add(total, day) { return total + day.seconds; }, 0);
      };
      const current = sumOver(0);
      const previous = sumOver(7);
      const delta = current - previous;
      const ratio = previous > 0 ? delta / previous : (current > 0 ? 1 : 0);
      return {
        current: current,
        previous: previous,
        delta: delta,
        ratio: ratio,
        direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
      };
    }

    // Human label for a week-over-week comparison; keeps the empty week honest.
    function weekDeltaLabel(info, t) {
      const data = info || {};
      if (!data.current && !data.previous) return t('weekNoData');
      if (!data.previous) return t('weekFirstWeek');
      if (data.direction === 'flat') return t('weekFlat');
      const percent = Math.max(1, Math.round(Math.abs(Number(data.ratio) || 0) * 100));
      return fill(t(data.direction === 'up' ? 'weekUp' : 'weekDown'), { n: percent });
    }

    function weekdayTotals(days) {
      const totals = [0, 0, 0, 0, 0, 0, 0];
      if (days && typeof days === 'object') {
        Object.keys(days).forEach(function each(key) {
          const parts = key.split('-').map(Number);
          if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return;
          const date = new Date(parts[0], parts[1] - 1, parts[2]);
          const weekday = (date.getDay() + 6) % 7;
          totals[weekday] += Math.max(0, Number(days[key]) || 0);
        });
      }
      return totals;
    }

    function peakWeekday(rhythm) {
      if (!Array.isArray(rhythm) || !rhythm.length) return null;
      const max = Math.max.apply(null, rhythm);
      if (max <= 0) return null;
      const index = rhythm.indexOf(max);
      const total = rhythm.reduce(function sum(acc, n) { return acc + (Number(n) || 0); }, 0);
      return {
        index: index,
        seconds: max,
        totalSeconds: total,
        ratio: total > 0 ? max / total : 0,
      };
    }

    function heatLevel(seconds) {
      const value = Number(seconds) || 0;
      if (value <= 0) return 0;
      if (value < 15 * 60) return 1;
      if (value < 30 * 60) return 2;
      if (value < 60 * 60) return 3;
      return 4;
    }

    function speechLanguage(text) {
      return /[\u3400-\u9fff]/.test(String(text || '')) ? 'zh-CN' : 'en-US';
    }

    function splitSpeechChunks(text, maxLength) {
      const source = String(text || '').replace(/\s+/g, ' ').trim();
      if (!source) return [];
      const max = Math.max(40, Number(maxLength) || 180);
      const sentences = source.match(/[^。！？!?；;.!?]+[。！？!?；;.!?]?/g) || [source];
      const chunks = [];
      sentences.forEach(function sentence(value) {
        let rest = value.trim();
        if (!rest) return;
        while (rest.length > max) {
          let cut = -1;
          ['，', '、', ',', '；', ';', ' '].forEach(function (delimiter) {
            const at = rest.lastIndexOf(delimiter, max);
            if (at > cut) cut = at;
          });
          if (cut < Math.floor(max * 0.45)) cut = max;
          chunks.push(rest.slice(0, cut + 1).trim());
          rest = rest.slice(cut + 1).trim();
        }
        if (rest) chunks.push(rest);
      });
      return chunks.filter(Boolean);
    }

    function speechChunkOffsets(chunks, startOffset) {
      let cursor = Math.max(0, Number(startOffset) || 0);
      return (chunks || []).map(function offset(chunk) {
        const start = cursor;
        cursor += String(chunk || '').length + 1;
        return start;
      });
    }

    function nextSpeechChapter(currentIndex, chapterCount) {
      const current = Number(currentIndex) || 0;
      const total = Number(chapterCount) || 0;
      return current + 1 < total ? current + 1 : null;
    }

    function readingStreak(days) {
      const cursor = startOfToday();
      if (!(Number(days[dayKey(cursor)]) > 0)) cursor.setDate(cursor.getDate() - 1);
      let count = 0;
      while (count < 3650 && Number(days[dayKey(cursor)]) > 0) {
        count += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
      return count;
    }

    function totalReadingSeconds(days) {
      return Object.keys(days).reduce(function sum(total, key) {
        const value = Number(days[key]);
        return total + (Number.isFinite(value) && value > 0 ? value : 0);
      }, 0);
    }

    function intlLocale() {
      const locale = activeLocale();
      return /^zh/i.test(locale) ? 'zh-CN' : locale || 'en';
    }

    function dateLabel(timestamp) {
      try {
        return new Intl.DateTimeFormat(intlLocale(), { month: 'short', day: 'numeric' }).format(new Date(timestamp));
      } catch (error) {
        const date = new Date(timestamp);
        return (date.getMonth() + 1) + '/' + date.getDate();
      }
    }

    function fullDateLabel() {
      try {
        return new Intl.DateTimeFormat(intlLocale(), { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());
      } catch (error) {
        return dateLabel(Date.now());
      }
    }

    function greetingKey() {
      const hour = new Date().getHours();
      if (hour < 11) return 'greetMorning';
      if (hour < 18) return 'greetAfternoon';
      return 'greetEvening';
    }

    function formatDuration(seconds, t) {
      const minutes = Math.round(Math.max(0, seconds) / 60);
      if (minutes < 60) return fill(t('minutes'), { n: minutes });
      const hours = Math.floor(minutes / 60);
      const rest = minutes % 60;
      if (!rest) return fill(t('hours'), { n: hours });
      return fill(t('hoursMinutes'), { h: hours, m: rest });
    }

    function splitLongText(text, limit) {
      const chunks = [];
      let rest = text;
      while (rest.length > limit) {
        let cut = -1;
        for (let index = Math.min(limit, rest.length - 1); index > limit * 0.55; index -= 1) {
          if (/[。！？；.!?;\n]/.test(rest.charAt(index))) {
            cut = index + 1;
            break;
          }
        }
        if (cut < 0) cut = limit;
        chunks.push(rest.slice(0, cut).trim());
        rest = rest.slice(cut).trim();
      }
      if (rest) chunks.push(rest);
      return chunks;
    }

    function splitLongChapter(chapter, target) {
      const pieces = [];
      let current = [];
      let size = 0;
      function push() {
        if (!current.length) return;
        pieces.push(current);
        current = [];
        size = 0;
      }
      chapter.paragraphs.forEach(function paragraph(text) {
        if (text.length > target * 1.35) {
          push();
          splitLongText(text, target).forEach(function part(chunk) {
            pieces.push([chunk]);
          });
          return;
        }
        if (size + text.length > target && current.length) push();
        current.push(text);
        size += text.length;
      });
      push();
      if (pieces.length <= 1) return [chapter];
      return pieces.map(function make(paragraphs, index) {
        return {
          id: chapter.id + '-' + (index + 1),
          title: index === 0 ? chapter.title : chapter.title + ' · ' + (index + 1),
          paragraphs: paragraphs,
          // The picture map belongs to the whole chapter; a piece only sees the
          // markers it actually contains, so carrying it along costs nothing.
          images: chapter.images,
          href: chapter.href,
          path: chapter.path,
        };
      });
    }

    function decodeTextBytes(bytes) {
      const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
      try {
        if (data.length >= 2 && data[0] === 0xff && data[1] === 0xfe) {
          return new TextDecoder('utf-16le').decode(data);
        }
        if (data.length >= 2 && data[0] === 0xfe && data[1] === 0xff) {
          return new TextDecoder('utf-16be').decode(data);
        }
        try {
          return new TextDecoder('utf-8', { fatal: true }).decode(data);
        } catch (utf8Error) {
          try {
            return new TextDecoder('gb18030').decode(data);
          } catch (gbError) {
            return new TextDecoder('utf-8').decode(data);
          }
        }
      } catch (error) {
        let text = '';
        for (let index = 0; index < data.length; index += 1) text += String.fromCharCode(data[index]);
        return text;
      }
    }

    function parseImportedBook(fileName, raw) {
      const normalized = String(raw || '').replace(/\r\n?/g, '\n').replace(/\u0000/g, '').trim();
      if (!normalized) {
        const error = new Error('empty');
        throw error;
      }
      let title = String(fileName || '').replace(/\.[^.]+$/, '').trim().slice(0, 80) || UNTITLED;
      let author = '本地导入';
      let lines = normalized.split('\n');

      // Frontmatter extraction (YAML --- at the start of Markdown files)
      if (lines[0] && lines[0].trim() === '---') {
        let closingIdx = -1;
        for (let i = 1; i < Math.min(lines.length, 30); i++) {
          if (lines[i].trim() === '---') {
            closingIdx = i;
            break;
          }
        }
        if (closingIdx > 0) {
          const fmLines = lines.slice(1, closingIdx);
          fmLines.forEach(function parseFm(l) {
            const m = l.match(/^(\w+):\s*(.*)$/);
            if (m) {
              const k = m[1].toLowerCase();
              const val = m[2].replace(/^["'\x27]+|["'\x27]+$/g, '').trim();
              if (k === 'title' && val) title = val.slice(0, 80);
              if (k === 'author' && val) author = val.slice(0, 60);
            }
          });
          lines = lines.slice(closingIdx + 1);
        }
      }

      const isMdFile = /\.(md|markdown)$/i.test(fileName) || lines.some(function(l) { return /^#{1,3}\s+/.test(l.trim()); });
      const hasH1 = isMdFile && lines.some(function(l) { return /^#\s+[^\n]+/.test(l.trim()); });
      const hasH2 = isMdFile && lines.some(function(l) { return /^##\s+[^\n]+/.test(l.trim()); });

      const headingPattern = /^(?:第[0-9零〇一二两三四五六七八九十百千万]+[章节回卷篇部](?:[ 　:：·、.\-—].{0,44})?|卷[0-9零〇一二三四五六七八九十百]+(?:[ 　:：·、.\-—].{0,36})?|(?:序章|楔子|引子|尾声|后记|前言|序言|番外)(?:[ 　:：·、.\-—].{0,34})?|chapter\s+[0-9ivxlc]+(?:[ 　:：·、.\-—].{0,44})?|#{1,4}\s+.+)$/i;
      const chapterNamePattern = /^(?:第[0-9零〇一二两三四五六七八九十百千万]+[章节回卷篇部]|卷[0-9零〇一二三四五六七八九十百]+|(?:序章|楔子|引子|尾声|后记|前言|序言|番外)|chapter\s+[0-9ivxlc]+)/i;
      const blankSeparated = /\n[ \t]*\n/.test(normalized);
      const chapters = [];
      let chapterTitle = '';
      let blocks = [];
      let buffer = [];
      let inCodeBlock = false;
      let inMathBlock = false;

      function flushParagraph() {
        if (!buffer.length) return;
        const text = buffer.join('\n').trim();
        buffer = [];
        if (text) blocks.push(text);
      }

      function flushChapter() {
        flushParagraph();
        if (!blocks.length) return;
        chapters.push({
          id: 'imp-c' + (chapters.length + 1),
          title: chapterTitle || '正文',
          paragraphs: blocks.slice(),
        });
        blocks = [];
      }

      function cleanHeading(line) {
        let text = line.trim();
        if (text.charAt(0) === '#') text = text.replace(/^#{1,4}\s*/, '').replace(/\s*#+\s*$/, '');
        return text.replace(/^\*+|\*+$/g, '').trim().slice(0, 64);
      }

      lines.forEach(function each(line) {
        const trimmed = line.trim();

        // 1. Fenced code block: do not parse headings or split paragraphs inside
        if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
          inCodeBlock = !inCodeBlock;
          buffer.push(line);
          if (!inCodeBlock) flushParagraph();
          return;
        }
        if (inCodeBlock) {
          buffer.push(line);
          return;
        }

        // 2. Math block ($$)
        if (trimmed.startsWith('$$')) {
          inMathBlock = !inMathBlock;
          buffer.push(line);
          if (!inMathBlock) flushParagraph();
          return;
        }
        if (inMathBlock) {
          buffer.push(line);
          return;
        }

        // 3. Heading detection:
        let isChapterHeading = false;
        let headingText = '';
        if (trimmed.length > 0 && trimmed.length <= 84) {
          if (hasH1 && /^#\s+[^\n]+/.test(trimmed)) {
            isChapterHeading = true;
            headingText = cleanHeading(trimmed);
          } else if (!hasH1 && hasH2 && /^##\s+[^\n]+/.test(trimmed)) {
            isChapterHeading = true;
            headingText = cleanHeading(trimmed);
          } else if (!hasH1 && !hasH2 && headingPattern.test(trimmed)) {
            isChapterHeading = true;
            headingText = cleanHeading(trimmed);
          }
        }

        if (isChapterHeading) {
          const atStart = chapters.length === 0 && blocks.length === 0 && !chapterTitle;
          if (/^#\s+/.test(trimmed) && atStart && !chapterNamePattern.test(headingText)) {
            return;
          }
          flushChapter();
          chapterTitle = headingText;
          return;
        }

        // 4. In Markdown, dividers (---, ***, ___) become their own standalone blocks
        if (isMdFile && (trimmed === '---' || trimmed === '***' || trimmed === '___')) {
          flushParagraph();
          blocks.push(trimmed);
          return;
        }

        if (!trimmed) {
          if (blankSeparated) flushParagraph();
          return;
        }

        // 5. In Markdown, subheadings (##, ###, etc.) within a chapter become standalone blocks
        if (isMdFile && /^#{2,6}\s+/.test(trimmed)) {
          flushParagraph();
          blocks.push(trimmed);
          return;
        }

        // 6. In Markdown, Callouts (> [!NOTE] etc.) starting line flushes prior buffer
        if (isMdFile && /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i.test(trimmed)) {
          flushParagraph();
          buffer.push(line);
          return;
        }

        if (blankSeparated) {
          buffer.push(line.replace(/\s+$/, ''));
          if (buffer.join('\n').length > 5200) flushParagraph();
        } else {
          blocks.push(trimmed);
        }
      });
      flushChapter();

      if (!chapters.length) {
        const error = new Error('empty');
        throw error;
      }

      if (chapters.length > 1 && chapters[0].title === '正文') {
        const front = chapters[0];
        const frontLength = chapterText(front).length;
        const looksLikeMetadata = front.paragraphs.every(function noSentence(text) {
          return !/[。！？.!?…]$/.test(text.trim());
        });
        if (frontLength <= 90 && front.paragraphs.length <= 2 && looksLikeMetadata) chapters.shift();
      }

      let finalChapters = chapters;
      const totalChars = chapters.reduce(function sum(total, chapter) {
        return total + chapterText(chapter).length;
      }, 0);
      if (chapters.length === 1 && totalChars > 3400) {
        finalChapters = splitLongChapter(chapters[0], 2800);
      }
      if (finalChapters.length > 320) finalChapters = finalChapters.slice(0, 320);
      const seed = hashString(title + ':' + normalized.length);
      const cover = LOCAL_COVERS[seed % LOCAL_COVERS.length];
      return {
        id: 'local-' + Date.now().toString(36) + '-' + (seed % 99991).toString(36),
        title: title,
        author: author,
        subtitle: isMdFile ? 'Markdown' : '本地文本',
        description: isMdFile ? '从 Markdown 导入的文件，保存在此浏览器中。' : '从本地导入的文本，保存在此浏览器中。',
        tags: isMdFile ? ['Markdown', '本地导入'] : ['本地导入'],
        source: 'local',
        format: isMdFile ? 'markdown' : 'txt',
        addedAt: Date.now(),
        cover: cover,
        chapters: finalChapters,
      };
    }

    function parseMarkdownTable(text) {
      if (!text || typeof text !== 'string') return null;
      const lines = text.trim().split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
      if (lines.length < 2) return null;

      function splitRow(line) {
        let clean = line;
        if (clean.startsWith('|')) clean = clean.slice(1);
        if (clean.endsWith('|')) clean = clean.slice(0, -1);
        return clean.split('|').map(function(c) { return c.trim(); });
      }

      const headerCells = splitRow(lines[0]);
      const sepCells = splitRow(lines[1]);
      if (!sepCells.length || !sepCells.every(function(c) { return /^:?-+:?$/.test(c); })) {
        return null;
      }

      const alignments = sepCells.map(function(c) {
        const left = c.startsWith(':');
        const right = c.endsWith(':');
        if (left && right) return 'center';
        if (right) return 'right';
        return 'left';
      });

      const bodyRows = [];
      for (let i = 2; i < lines.length; i++) {
        const cells = splitRow(lines[i]);
        bodyRows.push(cells);
      }

      return {
        headers: headerCells.map(function(headerText, i) {
          return { text: headerText, align: alignments[i] || 'left' };
        }),
        rows: bodyRows.map(function(row) {
          return row.map(function(cell, i) {
            return { text: cell, align: alignments[i] || 'left' };
          });
        }),
      };
    }

    function parseMarkdownList(text) {
      if (!text || typeof text !== 'string') return null;
      const lines = text.trim().split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
      if (!lines.length) return null;

      const isUl = lines.every(function(l) { return /^[-*+]\s+/.test(l); });
      const isOl = lines.every(function(l) { return /^\d+\.\s+/.test(l); });
      if (!isUl && !isOl) return null;

      let hasTask = false;
      const items = lines.map(function(line) {
        if (isUl) {
          const taskMatch = line.match(/^[-*+]\s+\[([ xX])\]\s+(.*)$/);
          if (taskMatch) {
            hasTask = true;
            return {
              isTask: true,
              checked: taskMatch[1].toLowerCase() === 'x',
              text: taskMatch[2],
            };
          }
          return {
            isTask: false,
            text: line.replace(/^[-*+]\s+/, ''),
          };
        } else {
          return {
            isTask: false,
            text: line.replace(/^\d+\.\s+/, ''),
          };
        }
      });

      return { isOrdered: isOl, hasTask: hasTask, items: items };
    }

    function parseMarkdownCallout(text) {
      if (!text || typeof text !== 'string') return null;
      const lines = text.trim().split('\n').map(function(l) { return l.trim(); });
      if (!lines.length) return null;
      const first = lines[0];
      const m = first.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]$/i);
      if (!m) return null;
      const type = m[1].toLowerCase();
      const bodyLines = lines.slice(1).map(function(l) {
        return l.replace(/^>\s?/, '');
      });
      return { type: type, lines: bodyLines };
    }

    function renderInline(text, keyPrefix) {
      if (!text) return [text];
      if (typeof text !== 'string') return [text];
      if (!/[*_~`$\[]/.test(text)) return [text];

      const tokenRegex = /(\*\*([^*]+)\*\*|__([^_]+)__|~~([^~]+)~~|`([^`]+)`|\[\^([^\]]+)\]|\[([^\]]+)\]\(([^)]+)\)|\*([^*]+)\*|_([^_]+)_|\$([^\$]+)\$)/g;
      const nodes = [];
      let lastIndex = 0;
      let match;
      let idx = 0;

      while ((match = tokenRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          nodes.push(text.slice(lastIndex, match.index));
        }
        const k = (keyPrefix || 'md') + '-' + (idx++);
        if (match[2] !== undefined) {
          nodes.push(h('strong', { key: k }, match[2]));
        } else if (match[3] !== undefined) {
          nodes.push(h('strong', { key: k }, match[3]));
        } else if (match[4] !== undefined) {
          nodes.push(h('del', { key: k }, match[4]));
        } else if (match[5] !== undefined) {
          nodes.push(h('code', { key: k }, match[5]));
        } else if (match[6] !== undefined) {
          const fnId = match[6];
          nodes.push(h('sup', { key: k, className: 'sr-footnote-ref' },
            h('a', {
              href: '#fn-' + fnId,
              'epub:type': 'noteref',
              role: 'doc-noteref',
              className: 'sr-link sr-noteref',
            }, '[' + fnId + ']')
          ));
        } else if (match[7] !== undefined) {
          const linkText = match[7];
          const linkHref = match[8];
          const isExternal = /^https?:\/\//i.test(linkHref) || /^mailto:/i.test(linkHref);
          const isDangerous = /^(javascript|vbscript|data):/i.test(linkHref.trim());
          nodes.push(h('a', {
            key: k,
            className: 'sr-link',
            href: isDangerous ? undefined : linkHref,
            target: isExternal ? '_blank' : undefined,
            rel: isExternal ? 'noopener noreferrer' : undefined,
          }, linkText));
        } else if (match[9] !== undefined) {
          nodes.push(h('em', { key: k }, match[9]));
        } else if (match[10] !== undefined) {
          nodes.push(h('em', { key: k }, match[10]));
        } else if (match[11] !== undefined) {
          nodes.push(h('span', { key: k, className: 'sr-math-inline' }, h('code', null, match[11])));
        }
        lastIndex = tokenRegex.lastIndex;
      }
      if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
      }
      return nodes.length ? nodes : [text];
    }

    function injectHighlightIntoHtml(html, start, end, hl) {
      let plainIndex = 0;
      let inTag = false;
      let result = '';
      let markOpen = false;
      const colorVal = hl.colorVal || '#f6c343';
      const openTag = '<mark class="sr-hl" data-hl="' + hl.id + '" data-style="' + (hl.style || 'highlight') + '" data-note="' + (hl.note ? 'true' : 'false') + '" style="--sr-hl: ' + colorVal + '">';
      const closeTag = '</mark>';

      for (let i = 0; i < html.length; i++) {
        const char = html[i];
        if (char === '<') {
          inTag = true;
          if (markOpen) { result += closeTag; markOpen = false; }
          result += char;
          continue;
        }
        if (char === '>') {
          inTag = false;
          result += char;
          continue;
        }
        if (inTag) {
          result += char;
          continue;
        }

        if (!markOpen && plainIndex >= start && plainIndex < end) {
          result += openTag;
          markOpen = true;
        }
        result += char;
        plainIndex++;
        if (markOpen && plainIndex >= end) {
          result += closeTag;
          markOpen = false;
        }
      }
      if (markOpen) result += closeTag;
      return result;
    }

    function applyHtmlHighlights(html, base, highlights) {
      if (!highlights || !highlights.length) return html;
      const sorted = highlights.slice().sort(function(a, b) { return b.start - a.start; });
      let currentHtml = html;
      sorted.forEach(function(h) {
        const s = Math.max(0, h.start - base);
        const e = Math.max(0, h.end - base);
        if (e > s) {
          const color = HIGHLIGHT_COLORS.find(function(entry) { return entry.id === h.color; }) || HIGHLIGHT_COLORS[0];
          currentHtml = injectHighlightIntoHtml(currentHtml, s, e, {
            id: h.id,
            colorVal: color.value,
            style: h.style,
            note: h.note,
          });
        }
      });
      return currentHtml;
    }

    function defaultState() {
      return {
        v: 1,
        settings: {
          theme: 'paper',
          fontSize: 19,
          lineHeight: 1.95,
          fontFamily: 'serif',
          letterSpacing: 0.02,
          paragraphSpacing: 0.9,
          pageWidth: 'comfortable',
          autoHideChrome: false,
          immersive: false,
          layout: 'page',
          chapterOpener: true,
          edgeMeta: true,
          focusMode: false,
          sideRail: false,
          minimalDock: true,
          marginNotes: false,
          marginFootnotes: false,
          chapterRail: false,
          bookCover: true,
          imageLayout: 'inline',
          writingMode: 'horizontal',
          thumbDock: false,
          edgeTap: true,
          preset: 'classic',
          paperSound: false,
          highlightColor: 'amber',
          speechRate: 1,
          speechVoice: '',
          textAlign: 'justify',
          readingRuler: false,
        },
        customBooks: [],
        progress: {},
        bookmarks: [],
        highlights: [],
        stats: { days: {}, goalMinutes: DEFAULT_WEEKLY_GOAL_MINUTES, byBook: {} },
        lastBookId: null,
        lastReadAt: 0,
        shelfSort: 'recent',
        shelfView: 'grid',
        pins: [],
        wishlist: [],
        shelved: [],
        sessions: [],
        reviews: {},
        userTags: {},
        fsLibrary: null,
      };
    }

    function clampSettings(raw) {
      const value = raw && typeof raw === 'object' ? raw : {};
      const themes = ['paper', 'candle', 'snow', 'mint', 'forest', 'night', 'oled', 'eink', 'auto'];
      const widths = ['compact', 'comfortable', 'wide'];
      const letterValue = Number(value.letterSpacing);
      const paragraphValue = Number(value.paragraphSpacing);
      return {
        theme: themes.indexOf(value.theme) >= 0 ? value.theme : 'paper',
        fontSize: clamp(Number(value.fontSize) || FONT_SIZE_DEFAULT, FONT_SIZE_MIN, FONT_SIZE_MAX),
        lineHeight: clamp(Number(value.lineHeight) || 1.95, 1.5, 2.35),
        fontFamily: ['serif', 'sans', 'kai', 'dyslexic', 'system'].indexOf(value.fontFamily) >= 0 ? value.fontFamily : 'serif',
        letterSpacing: clamp(Number.isFinite(letterValue) ? letterValue : 0.02, 0, 0.12),
        paragraphSpacing: clamp(Number.isFinite(paragraphValue) ? paragraphValue : 0.9, 0.5, 1.8),
        pageWidth: widths.indexOf(value.pageWidth) >= 0 ? value.pageWidth : 'comfortable',
        autoHideChrome: value.autoHideChrome === true,
        immersive: value.immersive === true,
        layout: ['page', 'spread', 'scroll'].indexOf(value.layout) >= 0 ? value.layout : 'page',
        chapterOpener: value.chapterOpener !== false,
        edgeMeta: value.edgeMeta !== false,
        focusMode: value.focusMode === true,
        sideRail: value.sideRail === true,
        minimalDock: value.minimalDock !== false,
        marginNotes: value.marginNotes === true,
        marginFootnotes: value.marginFootnotes === true,
        chapterRail: value.chapterRail === true,
        bookCover: value.bookCover !== false,
        imageLayout: ['inline', 'wide', 'margin'].indexOf(value.imageLayout) >= 0 ? value.imageLayout : 'inline',
        writingMode: value.writingMode === 'vertical' ? 'vertical' : 'horizontal',
        thumbDock: value.thumbDock === true,
        edgeTap: value.edgeTap !== false,
        preset: ['classic', 'magazine', 'minimal', 'night', 'custom'].indexOf(value.preset) >= 0 ? value.preset : 'classic',
        paperSound: value.paperSound === true,
        highlightColor: HIGHLIGHT_COLORS.some(function color(item) { return item.id === value.highlightColor; }) ? value.highlightColor : 'amber',
        speechRate: clamp(Number(value.speechRate) || 1, 0.5, 2),
        speechVoice: typeof value.speechVoice === 'string' ? value.speechVoice.slice(0, 200) : '',
        textAlign: value.textAlign === 'left' ? 'left' : 'justify',
        readingRuler: value.readingRuler === true,
      };
    }

    // One font-size step inside the supported range; keeps keyboard stepping honest at both ends.
    function stepFontSize(current, delta) {
      const base = clamp(Math.round(Number(current) || FONT_SIZE_DEFAULT), FONT_SIZE_MIN, FONT_SIZE_MAX);
      const step = Number.isFinite(Number(delta)) ? Math.round(Number(delta)) : 0;
      return clamp(base + step, FONT_SIZE_MIN, FONT_SIZE_MAX);
    }

    // Coarse "when did I last read this book" label for shelf cards.
    // Returns { key, n } for the translator, or null when the book was never opened.
    function lastReadRelative(updatedAt, now) {
      const time = Number(updatedAt) || 0;
      if (!time) return null;
      const current = Number(now) || Date.now();
      function startOfDay(value) {
        const date = new Date(value);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      }
      let days = Math.floor((startOfDay(current) - startOfDay(time)) / 86400000);
      if (days <= 0) return { key: 'lastReadToday', n: 0 };
      if (days === 1) return { key: 'lastReadYesterday', n: 1 };
      if (days < 30) return { key: 'lastReadDaysAgo', n: days };
      if (days < 365) return { key: 'lastReadMonthsAgo', n: Math.max(1, Math.round(days / 30)) };
      return { key: 'lastReadYearsAgo', n: Math.max(1, Math.floor(days / 365)) };
    }

    // Stable signature for an imported book: title + total paragraph characters.
    // Random ids change per import, but re-importing the same file keeps this constant.
    function importBookSignature(book) {
      if (book && typeof book.importSignature === 'string' && book.importSignature) return book.importSignature;
      const title = String(book && book.title || '').trim().toLowerCase();
      const chapters = Array.isArray(book && book.chapters) ? book.chapters : [];
      const size = chapters.reduce(function sum(total, chapter) {
        const paragraphs = Array.isArray(chapter && chapter.paragraphs) ? chapter.paragraphs : [];
        return total + paragraphs.reduce(function add(inner, text) { return inner + String(text || '').length; }, 0);
      }, 0);
      return title + ':' + size;
    }

    // Splits candidate imports into fresh books and ones already on the local shelf
    // (same title + same content size). Also dedupes within the batch itself.
    function splitDuplicateImports(candidates, existingBooks) {
      const signatures = new Set();
      (Array.isArray(existingBooks) ? existingBooks : []).forEach(function each(book) {
        if (book && book.source === 'local') signatures.add(importBookSignature(book));
      });
      const accepted = [];
      const skipped = [];
      (Array.isArray(candidates) ? candidates : []).forEach(function each(book) {
        const signature = importBookSignature(book);
        if (signatures.has(signature)) { skipped.push(book); return; }
        signatures.add(signature);
        accepted.push(book);
      });
      return { accepted: accepted, skipped: skipped };
    }

    // Maps a settings.theme value to a concrete palette; 'auto' follows the OS color scheme.
    function resolveReaderTheme(theme, prefersDark) {
      if (theme === 'auto') return prefersDark === true ? 'night' : 'paper';
      const valid = ['paper', 'candle', 'snow', 'mint', 'forest', 'night', 'oled', 'eink'];
      return valid.indexOf(theme) >= 0 ? theme : 'paper';
    }

    // Adds or removes one id from a capped id list, keeping insertion order.
    function toggleId(list, id, cap) {
      const source = (Array.isArray(list) ? list : []).filter(function ok(item) { return typeof item === 'string' && item; });
      if (typeof id !== 'string' || !id) return source;
      if (source.indexOf(id) >= 0) return source.filter(function keep(item) { return item !== id; });
      const limit = Number.isFinite(Number(cap)) && Number(cap) > 0 ? Math.floor(Number(cap)) : 200;
      return [id].concat(source).slice(0, limit);
    }

    // Bulk add/remove ids in a capped list; shared by pins (cap 100) and shelved (cap 200).
    function setIdsBulk(current, ids, flag, cap) {
      const limit = Number.isFinite(Number(cap)) && Number(cap) > 0 ? Math.floor(Number(cap)) : 200;
      const list = (Array.isArray(current) ? current : []).filter(function keep(id) { return typeof id === 'string' && id; });
      const targets = (Array.isArray(ids) ? ids : []).filter(function valid(id) { return typeof id === 'string' && id; });
      const want = flag === true;
      const changed = targets.filter(function differ(id) { return (list.indexOf(id) >= 0) !== want; });
      if (!changed.length) return { list: list, changed: [] };
      const next = want
        ? Array.from(new Set(changed.concat(list))).slice(0, limit)
        : list.filter(function drop(id) { return changed.indexOf(id) < 0; });
      return { list: next, changed: changed };
    }

    // Bulk pin / unpin: returns the next pin list plus the ids that actually changed.
    function mergePins(current, ids, pinned) {
      const result = setIdsBulk(current, ids, pinned === true, 100);
      return { pins: result.list, changed: result.changed };
    }

    // Map edition of applyTagToHighlights: { [bookId]: tags }, sharing MAX_BOOK_TAGS.
    function applyTagToBooks(userTags, bookIds, rawTag) {
      const map = userTags && typeof userTags === 'object' ? userTags : {};
      const tag = cleanUserTags([rawTag])[0];
      const targets = Array.from(new Set(Array.isArray(bookIds) ? bookIds : []));
      if (!tag || !targets.length) return { userTags: map, tag: tag || '', applied: 0, skipped: 0 };
      let applied = 0;
      let skipped = 0;
      const next = Object.assign({}, map);
      targets.forEach(function each(id) {
        if (typeof id !== 'string' || !id) return;
        const current = cleanUserTags(map[id]);
        if (current.indexOf(tag) >= 0) return;
        if (current.length >= MAX_BOOK_TAGS) { skipped += 1; return; }
        applied += 1;
        next[id] = current.concat(tag);
      });
      return { userTags: applied ? next : map, tag: tag, applied: applied, skipped: skipped };
    }

    function removeTagFromBooks(userTags, bookIds, rawTag) {
      const map = userTags && typeof userTags === 'object' ? userTags : {};
      const tag = cleanUserTags([rawTag])[0];
      const targets = Array.from(new Set(Array.isArray(bookIds) ? bookIds : []));
      if (!tag || !targets.length) return { userTags: map, tag: tag || '', removed: 0 };
      let removed = 0;
      const next = Object.assign({}, map);
      targets.forEach(function each(id) {
        if (typeof id !== 'string' || !id) return;
        const current = cleanUserTags(map[id]);
        if (current.indexOf(tag) < 0) return;
        removed += 1;
        const kept = current.filter(function keep(item) { return item !== tag; });
        if (kept.length) next[id] = kept;
        else delete next[id];
      });
      return { userTags: removed ? next : map, tag: tag, removed: removed };
    }

    // Batch "mark finished / back to reading"; mirrors the single-book toggle's percent semantics.
    function setBooksFinished(progress, ids, flag, now) {
      const map = progress && typeof progress === 'object' ? progress : {};
      const targets = Array.isArray(ids) ? ids.filter(function ok(id) { return typeof id === 'string' && id; }) : [];
      if (!targets.length) return { progress: map, changed: 0 };
      const stamp = Number.isFinite(Number(now)) ? Number(now) : 0;
      let changed = 0;
      const next = Object.assign({}, map);
      targets.forEach(function each(id) {
        const item = map[id];
        if (Boolean(item && item.completed) === flag) return;
        changed += 1;
        const base = item || { chapterIndex: 0, percent: 0, updatedAt: stamp };
        next[id] = Object.assign({}, base, { completed: flag, percent: flag ? 1 : 0, updatedAt: stamp || base.updatedAt || 0 });
      });
      return { progress: changed ? next : map, changed: changed };
    }

    // Dropping books also clears every trace of them; unknown ids are ignored (built-ins stay).
    function removeBooksFromState(state, ids) {
      const source = state && typeof state === 'object' ? state : {};
      const targets = new Set((Array.isArray(ids) ? ids : []).filter(function ok(id) { return typeof id === 'string' && id; }));
      if (!targets.size) return { state: source, removed: [] };
      const customBooks = Array.isArray(source.customBooks) ? source.customBooks : [];
      const removed = customBooks
        .filter(function hit(book) { return book && targets.has(book.id); })
        .map(function id(book) { return book.id; });
      if (!removed.length) return { state: source, removed: [] };
      const gone = new Set(removed);
      const stats = source.stats && typeof source.stats === 'object' ? source.stats : {};
      const byBook = stats.byBook && typeof stats.byBook === 'object' ? stats.byBook : {};
      const pick = function pickMap(map) {
        const out = {};
        Object.keys(map && typeof map === 'object' ? map : {}).forEach(function keep(key) {
          if (!gone.has(key)) out[key] = map[key];
        });
        return out;
      };
      const dropByBook = function dropItem(list) {
        return (Array.isArray(list) ? list : []).filter(function keep(item) { return item && !gone.has(item.bookId); });
      };
      const dropIds = function dropId(list) {
        return (Array.isArray(list) ? list : []).filter(function keep(id) { return !gone.has(id); });
      };
      return {
        state: Object.assign({}, source, {
          customBooks: customBooks.filter(function keep(book) { return book && !gone.has(book.id); }),
          progress: pick(source.progress),
          reviews: pick(source.reviews),
          userTags: pick(source.userTags),
          highlights: dropByBook(source.highlights),
          bookmarks: dropByBook(source.bookmarks),
          sessions: dropByBook(source.sessions),
          pins: dropIds(source.pins),
          wishlist: dropIds(source.wishlist),
          shelved: dropIds(source.shelved),
          stats: Object.assign({}, stats, { byBook: pick(byBook) }),
          lastBookId: gone.has(source.lastBookId) ? null : source.lastBookId,
        }),
        removed: removed,
      };
    }

    function normalizeStoredBook(raw, builtInIds) {
      if (!raw || typeof raw !== 'object') return null;
      if (typeof raw.id !== 'string' || !raw.id.startsWith('local-')) return null;
      if (builtInIds.indexOf(raw.id) >= 0) return null;
      if (typeof raw.title !== 'string' || !raw.title.trim()) return null;
      // A body lives in the picked folder (`chaptersInFs`); the metadata alone is a
      // valid book. `chaptersInOpfs` is only read for libraries an older version
      // parked on Safari / Firefox — nothing writes it any more, and such a book
      // keeps its shelf entry but has no body to open.
      const bodyInFs = raw.chaptersInFs === true;
      const bodyInOpfs = raw.chaptersInOpfs === true;
      const bodyOnDisk = bodyInFs || bodyInOpfs;
      if (!Array.isArray(raw.chapters) && !bodyOnDisk) return null;
      if (Array.isArray(raw.chapters) && !raw.chapters.length && !bodyOnDisk) return null;
      // Chapter and paragraph counts are not capped either: a long book easily
      // passes the old 320-chapter / 5000-paragraph cut, and dropping the tail of
      // somebody's book to save memory is the worst possible trade.
      const chapters = (Array.isArray(raw.chapters) ? raw.chapters : []).map(function chapter(item, index) {
        if (!item || !Array.isArray(item.paragraphs)) return null;
        const paragraphs = item.paragraphs.filter(function text(part) {
          return typeof part === 'string' && part.trim().length > 0;
        });
        if (!paragraphs.length) return null;
        return {
          id: typeof item.id === 'string' ? item.id : 'imp-c' + (index + 1),
          title: typeof item.title === 'string' && item.title.trim() ? item.title.slice(0, 120) : '第 ' + (index + 1) + ' 节',
          paragraphs: paragraphs,
        };
      }).filter(Boolean);
      if (!chapters.length && !bodyOnDisk) return null;
      const cover = raw.cover && typeof raw.cover === 'object' ? raw.cover : LOCAL_COVERS[0];
      const coverImage = typeof raw.coverImage === 'string' && raw.coverImage.length <= 800000 && /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(raw.coverImage)
        ? raw.coverImage
        : undefined;
      return {
        id: raw.id,
        title: raw.title.slice(0, 100),
        author: typeof raw.author === 'string' ? raw.author.slice(0, 80) : '本地导入',
        subtitle: typeof raw.subtitle === 'string' ? raw.subtitle.slice(0, 80) : '本地文本',
        description: typeof raw.description === 'string' ? raw.description.slice(0, 500) : '从本地导入的文本，保存在此浏览器中。',
        tags: Array.isArray(raw.tags) ? raw.tags.filter(function tag(tag) { return typeof tag === 'string'; }).slice(0, 8) : ['本地导入'],
        source: 'local',
        format: (raw.format === 'epub' || raw.format === 'markdown' || raw.format === 'txt')
          ? raw.format
          : (isEpubBook(raw)
              ? 'epub'
              : (isMarkdownBook(raw) ? 'markdown' : undefined)),
        addedAt: Number.isFinite(raw.addedAt) ? raw.addedAt : Date.now(),
        coverImage: coverImage,
        chaptersInFs: bodyInFs || undefined,
        // Kept so a body read back from a readable text file gets the ids its
        // highlights and chapter progress were recorded under.
        chapterIds: bodyInFs && Array.isArray(raw.chapterIds)
          ? raw.chapterIds.filter(function id(value) { return typeof value === 'string' && value.length > 0; })
          : undefined,
        // Persist the duplicate-import fingerprint even after the body leaves
        // memory, so a restart does not turn every disk-backed book into size 0.
        importSignature: typeof raw.importSignature === 'string' && raw.importSignature
          ? raw.importSignature.slice(0, 300)
          : undefined,
        cover: {
          from: typeof cover.from === 'string' ? cover.from : LOCAL_COVERS[0].from,
          to: typeof cover.to === 'string' ? cover.to : LOCAL_COVERS[0].to,
          ink: typeof cover.ink === 'string' ? cover.ink : LOCAL_COVERS[0].ink,
          accent: typeof cover.accent === 'string' ? cover.accent : LOCAL_COVERS[0].accent,
          glyph: typeof cover.glyph === 'string' ? cover.glyph.slice(0, 2) : '书',
        },
        chapters: chapters,
      };
    }

    function normalizeHighlight(raw) {
      if (!raw || typeof raw !== 'object') return null;
      if (typeof raw.id !== 'string' || typeof raw.bookId !== 'string') return null;
      if (typeof raw.chapterId !== 'string') return null;
      const start = Number(raw.start);
      const end = Number(raw.end);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
      return {
        id: raw.id,
        bookId: raw.bookId,
        chapterIndex: clamp(Number(raw.chapterIndex) || 0, 0, 10000),
        chapterId: raw.chapterId,
        start: start,
        end: end,
        text: typeof raw.text === 'string' ? raw.text.slice(0, 4000) : '',
        note: typeof raw.note === 'string' ? raw.note.slice(0, 4000) : '',
        tags: cleanNoteTags(raw.tags),
        color: HIGHLIGHT_COLORS.some(function same(color) { return color.id === raw.color; }) ? raw.color : 'amber',
        createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
      };
    }

    function normalizeBookmark(raw) {
      if (!raw || typeof raw !== 'object') return null;
      if (typeof raw.id !== 'string' || typeof raw.bookId !== 'string') return null;
      if (typeof raw.chapterId !== 'string') return null;
      return {
        id: raw.id,
        bookId: raw.bookId,
        chapterIndex: clamp(Number(raw.chapterIndex) || 0, 0, 10000),
        chapterId: raw.chapterId,
        percent: clamp(Number(raw.percent) || 0, 0, 1),
        note: typeof raw.note === 'string' ? raw.note.slice(0, 500) : '',
        page: Math.max(1, Number(raw.page) || 1),
        chapterTitle: typeof raw.chapterTitle === 'string' ? raw.chapterTitle.slice(0, 160) : '',
        excerpt: typeof raw.excerpt === 'string' ? raw.excerpt.slice(0, 240) : '',
        createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
      };
    }

    function cleanUserTags(value) {
      const out = [];
      const seen = new Set();
      (Array.isArray(value) ? value : []).forEach(function each(item) {
        if (typeof item !== 'string' || out.length >= MAX_BOOK_TAGS) return;
        const tag = item.trim().slice(0, MAX_TAG_LENGTH);
        if (!tag || seen.has(tag)) return;
        seen.add(tag);
        out.push(tag);
      });
      return out;
    }

    function cleanNoteTags(value) {
      const out = [];
      const seen = new Set();
      (Array.isArray(value) ? value : []).forEach(function each(item) {
        if (typeof item !== 'string' || out.length >= MAX_NOTE_TAGS) return;
        const tag = item.trim().replace(/\s+/g, ' ').slice(0, MAX_NOTE_TAG_LENGTH);
        if (!tag) return;
        const key = tag.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        out.push(tag);
      });
      return out;
    }

    function sameTagList(a, b) {
      const left = Array.isArray(a) ? a : [];
      const right = Array.isArray(b) ? b : [];
      if (left.length !== right.length) return false;
      for (let index = 0; index < left.length; index += 1) {
        if (left[index] !== right[index]) return false;
      }
      return true;
    }

    function normalizeUserTags(raw, knownIds) {
      const out = {};
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
      Object.keys(raw).forEach(function each(bookId) {
        if (knownIds.indexOf(bookId) < 0) return;
        const tags = cleanUserTags(raw[bookId]);
        if (tags.length) out[bookId] = tags;
      });
      return out;
    }

    function renameBookTagEverywhere(userTags, oldTag, nextTag) {
      const source = userTags && typeof userTags === 'object' && !Array.isArray(userTags) ? userTags : {};
      const cleaned = cleanUserTags([nextTag])[0];
      if (!oldTag || !cleaned || oldTag === cleaned) return source;
      let changed = false;
      const out = {};
      Object.keys(source).forEach(function each(bookId) {
        const current = cleanUserTags(source[bookId]);
        if (current.indexOf(oldTag) < 0) {
          if (current.length) out[bookId] = current;
          return;
        }
        changed = true;
        const renamed = cleanUserTags(current.map(function swap(tag) { return tag === oldTag ? cleaned : tag; }));
        if (renamed.length) out[bookId] = renamed;
      });
      return changed ? out : source;
    }

    function removeBookTagEverywhere(userTags, tag) {
      const source = userTags && typeof userTags === 'object' && !Array.isArray(userTags) ? userTags : {};
      if (!tag) return source;
      let changed = false;
      const out = {};
      Object.keys(source).forEach(function each(bookId) {
        const current = cleanUserTags(source[bookId]);
        const next = current.filter(function keep(value) { return value !== tag; });
        if (next.length !== current.length) changed = true;
        if (next.length) out[bookId] = next;
      });
      return changed ? out : source;
    }

    function bookTagSummary(userTags) {
      const source = userTags && typeof userTags === 'object' && !Array.isArray(userTags) ? userTags : {};
      const totals = new Map();
      Object.keys(source).forEach(function each(bookId) {
        cleanUserTags(source[bookId]).forEach(function add(tag) {
          totals.set(tag, (totals.get(tag) || 0) + 1);
        });
      });
      return Array.from(totals.entries()).map(function pair(entry) {
        return { tag: entry[0], count: entry[1] };
      }).sort(function order(a, b) {
        return b.count - a.count || a.tag.localeCompare(b.tag, 'zh-Hans');
      });
    }

    // Used by the shelf tag filter. `mode` is 'any' (default) or 'all'.
    function matchBookTags(userTags, bookId, filters, mode) {
      const wanted = Array.isArray(filters) ? filters.filter(function valid(tag) { return typeof tag === 'string' && tag; }) : [];
      if (!wanted.length) return true;
      const tags = cleanUserTags((userTags || {})[bookId]);
      if (mode === 'all') return wanted.every(function has(tag) { return tags.indexOf(tag) >= 0; });
      return wanted.some(function has(tag) { return tags.indexOf(tag) >= 0; });
    }

    function renameHighlightTag(highlights, oldTag, nextTag) {
      const source = Array.isArray(highlights) ? highlights : [];
      const cleaned = cleanNoteTags([nextTag])[0];
      if (!oldTag || !cleaned) return source;
      let changed = false;
      const next = source.map(function entry(item) {
        const tags = Array.isArray(item.tags) ? item.tags : [];
        if (tags.indexOf(oldTag) < 0) return item;
        const renamed = cleanNoteTags(tags.map(function swap(value) { return value === oldTag ? cleaned : value; }));
        if (sameTagList(renamed, tags)) return item;
        changed = true;
        return Object.assign({}, item, { tags: renamed });
      });
      return changed ? next : source;
    }

    function removeHighlightTag(highlights, tag) {
      const source = Array.isArray(highlights) ? highlights : [];
      if (!tag) return source;
      let changed = false;
      const next = source.map(function entry(item) {
        const tags = Array.isArray(item.tags) ? item.tags : [];
        if (tags.indexOf(tag) < 0) return item;
        changed = true;
        return Object.assign({}, item, { tags: tags.filter(function keep(value) { return value !== tag; }) });
      });
      return changed ? next : source;
    }

    // Bulk tagging from the notebook selection bar. Reports how many notes hit the tag cap.
    function applyTagToHighlights(highlights, ids, rawTag) {
      const source = Array.isArray(highlights) ? highlights : [];
      const tag = cleanNoteTags([rawTag])[0];
      const targets = new Set(Array.isArray(ids) ? ids : []);
      if (!tag || !targets.size) return { items: source, tag: tag || '', applied: 0, skipped: 0 };
      let applied = 0;
      let skipped = 0;
      const items = source.map(function each(note) {
        if (!note || !targets.has(note.id)) return note;
        const tags = Array.isArray(note.tags) ? note.tags : [];
        if (tags.indexOf(tag) >= 0) return note;
        if (tags.length >= MAX_NOTE_TAGS) {
          skipped += 1;
          return note;
        }
        applied += 1;
        return Object.assign({}, note, { tags: tags.concat(tag) });
      });
      return { items: applied ? items : source, tag: tag, applied: applied, skipped: skipped };
    }

    // Repaint selected highlights in one go; notes with that color already stay untouched.
    function recolorHighlights(highlights, ids, color) {
      const source = Array.isArray(highlights) ? highlights : [];
      const valid = HIGHLIGHT_COLORS.some(function same(item) { return item.id === color; });
      const targets = new Set(Array.isArray(ids) ? ids : []);
      if (!valid || !targets.size) return { items: source, changed: 0 };
      let changed = 0;
      const items = source.map(function each(note) {
        if (!note || !targets.has(note.id) || note.color === color) return note;
        changed += 1;
        return Object.assign({}, note, { color: color });
      });
      return { items: changed ? items : source, changed: changed };
    }

    function removeTagFromHighlights(highlights, ids, rawTag) {
      const source = Array.isArray(highlights) ? highlights : [];
      const tag = cleanNoteTags([rawTag])[0];
      const targets = new Set(Array.isArray(ids) ? ids : []);
      if (!tag || !targets.size) return { items: source, tag: tag || '', removed: 0 };
      let removed = 0;
      const items = source.map(function each(note) {
        if (!note || !targets.has(note.id)) return note;
        const tags = Array.isArray(note.tags) ? note.tags : [];
        if (tags.indexOf(tag) < 0) return note;
        removed += 1;
        return Object.assign({}, note, { tags: tags.filter(function keep(value) { return value !== tag; }) });
      });
      return { items: removed ? items : source, tag: tag, removed: removed };
    }

    // Whitespace-separated keywords, lowercased and de-duplicated (capped so a pasted paragraph stays cheap).
    function searchTerms(rawQuery) {
      const raw = String(rawQuery == null ? '' : rawQuery).toLowerCase();
      const seen = new Set();
      const terms = [];
      raw.split(/\s+/).forEach(function add(term) {
        if (!term || seen.has(term)) return;
        seen.add(term);
        terms.push(term);
      });
      return terms.slice(0, MAX_SEARCH_TERMS);
    }

    // Every keyword has to appear somewhere in the haystack (AND search).
    function matchAllTerms(haystack, terms) {
      const list = Array.isArray(terms) ? terms : searchTerms(terms);
      if (!list.length) return true;
      const text = String(haystack == null ? '' : haystack).toLowerCase();
      return list.every(function has(term) { return text.indexOf(term) >= 0; });
    }

    // Splits text into matched / unmatched runs so search hits can be marked in place.
    function highlightSegments(text, rawQuery) {
      const source = String(text == null ? '' : text);
      const terms = (Array.isArray(rawQuery) ? rawQuery : searchTerms(rawQuery))
        .filter(function usable(term) { return Boolean(term); });
      if (!source || !terms.length) return [{ text: source, match: false }];
      const haystack = source.toLowerCase();
      const ordered = terms.slice().sort(function byLength(a, b) { return b.length - a.length; });
      const parts = [];
      let cursor = 0;
      while (cursor < source.length && parts.length < 400) {
        let at = -1;
        let width = 0;
        for (let i = 0; i < ordered.length; i += 1) {
          const found = haystack.indexOf(ordered[i], cursor);
          if (found < 0) continue;
          if (at < 0 || found < at || (found === at && ordered[i].length > width)) {
            at = found;
            width = ordered[i].length;
          }
        }
        if (at < 0) break;
        if (at > cursor) parts.push({ text: source.slice(cursor, at), match: false });
        parts.push({ text: source.slice(at, at + width), match: true });
        cursor = at + width;
      }
      if (!parts.length) return [{ text: source, match: false }];
      if (cursor < source.length) parts.push({ text: source.slice(cursor), match: false });
      return parts;
    }

    function normalizeChapterMarks(raw, chapters) {
      const out = {};
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
      const valid = new Set((Array.isArray(chapters) ? chapters : []).map(function id(item) { return item && item.id; }));
      Object.keys(raw).forEach(function each(chapterId) {
        if (!valid.has(chapterId)) return;
        const value = Number(raw[chapterId]);
        if (!Number.isFinite(value) || value < 0 || value > 1) return;
        out[chapterId] = Math.round(clamp(value, 0, 1) * 10000) / 10000;
      });
      return out;
    }

    function recordChapterMark(marks, chapterId, percent) {
      const next = Object.assign({}, marks && typeof marks === 'object' ? marks : {});
      if (typeof chapterId !== 'string' || !chapterId) return next;
      const value = clamp(Number(percent) || 0, 0, 1);
      next[chapterId] = Math.round(value * 10000) / 10000;
      return next;
    }

    function chapterResumePercent(marks, chapterId) {
      if (!marks || typeof marks !== 'object' || !chapterId) return 0;
      const value = Number(marks[chapterId]);
      if (!Number.isFinite(value) || value <= 0 || value >= 0.995) return 0;
      return clamp(value, 0, 1);
    }

    function groupBooksByStatus(books, progress, wishlist, shelved) {
      const groups = [
        { id: 'reading', label: 'shelfReading', books: [] },
        { id: 'shelved', label: 'shelfShelved', books: [] },
        { id: 'wishlist', label: 'shelfWishlist', books: [] },
        { id: 'unread', label: 'unread', books: [] },
        { id: 'finished', label: 'finished', books: [] },
      ];
      const wanted = new Set(Array.isArray(wishlist) ? wishlist : []);
      const parked = new Set(Array.isArray(shelved) ? shelved : []);
      (books || []).forEach(function each(book) {
        const item = progress && progress[book.id];
        // Finished stays finished; parked wins over "in reading"/"unread" for everything else.
        if (item && item.completed) groups[4].books.push(book);
        else if (parked.has(book.id)) groups[1].books.push(book);
        else if (item) groups[0].books.push(book);
        else if (wanted.has(book.id)) groups[2].books.push(book);
        else groups[3].books.push(book);
      });
      return groups.filter(function visible(group) { return group.books.length > 0; });
    }

    function resolveContinueBook(books, progress, shelved) {
      const list = (Array.isArray(books) ? books : []).filter(Boolean);
      if (!list.length) return null;
      const prog = (progress && typeof progress === 'object') ? progress : {};
      const parkedSet = new Set(Array.isArray(shelved) ? shelved : []);
      const recent = list
        .filter(function has(book) { return Boolean(prog[book.id]) && !parkedSet.has(book.id); })
        .sort(function order(a, b) { return ((prog[b.id] || {}).updatedAt || 0) - ((prog[a.id] || {}).updatedAt || 0); });
      return recent[0] || list.find(function unparked(book) { return !parkedSet.has(book.id); }) || null;
    }

    function pickRandomBook(books, progress, randomValue) {
      const list = (Array.isArray(books) ? books : []).filter(Boolean);
      if (!list.length) return null;
      const unread = list.filter(function fresh(book) { return !progress || !progress[book.id]; });
      const unfinished = list.filter(function active(book) {
        const item = progress && progress[book.id];
        return !item || !item.completed;
      });
      const pool = unread.length ? unread : (unfinished.length ? unfinished : list);
      const value = clamp(Number(randomValue) || 0, 0, 0.999999);
      return pool[Math.floor(value * pool.length)] || pool[0];
    }

    function pickRandomHighlight(highlights, randomValue) {
      const list = (Array.isArray(highlights) ? highlights : []).filter(function valid(h) {
        return h && typeof h === 'object' && h.bookId && typeof h.text === 'string' && h.text.trim();
      });
      if (!list.length) return null;
      const value = clamp(Number(randomValue) || 0, 0, 0.999999);
      return list[Math.floor(value * list.length)] || list[0];
    }

    function similarBooks(book, books, limit) {
      const sourceTags = new Set(Array.isArray(book.tags) ? book.tags : []);
      if (!sourceTags.size) return [];
      return (books || []).filter(function other(item) {
        return item.id !== book.id && Array.isArray(item.tags) && item.tags.some(function tag(tagValue) { return sourceTags.has(tagValue); });
      }).map(function score(item, index) {
        const shared = (item.tags || []).filter(function tag(tagValue) { return sourceTags.has(tagValue); }).length;
        return { book: item, score: shared, index: index };
      }).sort(function order(a, b) {
        return b.score - a.score || a.index - b.index;
      }).slice(0, Math.max(1, Number(limit) || 3)).map(function unwrap(item) { return item.book; });
    }

    function pickDailyQuote(highlights, books, dateKeyValue, offset) {
      const bookMap = new Map();
      (books || []).forEach(function add(book) { bookMap.set(book.id, book); });
      const candidates = (Array.isArray(highlights) ? highlights : []).filter(function usable(item) {
        return item && item.text && bookMap.has(item.bookId);
      });
      if (!candidates.length) return null;
      const seed = String(dateKeyValue || '');
      let hash = 0;
      for (let index = 0; index < seed.length; index += 1) hash = ((hash * 31) + seed.charCodeAt(index)) >>> 0;
      const chosen = candidates[(hash + (Math.round(Number(offset) || 0))) % candidates.length];
      const book = bookMap.get(chosen.bookId);
      const chapter = (book && Array.isArray(book.chapters)) ? (book.chapters[chosen.chapterIndex] || null) : null;
      const length = chapter ? chapterText(chapter).length : 0;
      return {
        text: String(chosen.text).trim(),
        bookId: book.id,
        bookTitle: book.title,
        chapterTitle: chapter ? chapter.title : '',
        chapterIndex: chosen.chapterIndex || 0,
        percent: length ? clamp((chosen.start || 0) / length, 0, 1) : 0,
        total: candidates.length,
      };
    }

    function sessionsOnDay(sessions, dateKeyValue) {
      return (Array.isArray(sessions) ? sessions : []).filter(function same(item) {
        const stamp = Number(item.endedAt) || Number(item.startedAt) || 0;
        return stamp > 0 && dayKey(new Date(stamp)) === dateKeyValue;
      }).sort(function latest(a, b) { return (b.endedAt || 0) - (a.endedAt || 0); });
    }

    function sessionsForBook(sessions, bookId, limit) {
      return (Array.isArray(sessions) ? sessions : []).filter(function mine(item) { return item.bookId === bookId; }).sort(function latest(a, b) { return (b.endedAt || 0) - (a.endedAt || 0); }).slice(0, Math.max(1, Number(limit) || 3));
    }

    function remainingReadingMinutes(text, percent) {
      const chars = String(text || '').length;
      const left = Math.max(0, chars * (1 - clamp(Number(percent) || 0, 0, 1)));
      if (!left) return 0;
      return Math.max(1, Math.round(left / 400));
    }

    function chapterOverview(book, currentIndex, highlights, bookmarks) {
      const notes = Array.isArray(highlights) ? highlights : [];
      const marks = Array.isArray(bookmarks) ? bookmarks : [];
      const chapters = Array.isArray(book && book.chapters) ? book.chapters : [];
      const current = clamp(Number(currentIndex) || 0, 0, Math.max(0, chapters.length - 1));
      return chapters.map(function each(chapter, index) {
        const text = chapterText(chapter);
        const chars = text.length;
        return {
          index: index,
          id: chapter.id,
          title: chapter.title,
          read: index < current,
          current: index === current,
          minutes: chars ? Math.max(1, Math.round(chars / 400)) : 0,
          notes: notes.filter(function note(item) { return item.bookId === book.id && item.chapterIndex === index; }).length,
          bookmarks: marks.filter(function mark(item) { return item.bookId === book.id && item.chapterIndex === index; }).length,
        };
      });
    }

    function splitSelectionKeys(keys) {
      const list = Array.isArray(keys) ? keys : [];
      return {
        highlightIds: list.filter(function note(item) { return typeof item === 'string' && item.indexOf('h:') === 0; }).map(function note(item) { return item.slice(2); }),
        bookmarkIds: list.filter(function mark(item) { return typeof item === 'string' && item.indexOf('b:') === 0; }).map(function mark(item) { return item.slice(2); }),
      };
    }

    function invertSelectionKeys(allKeys, selectedKeys) {
      const all = Array.isArray(allKeys) ? allKeys : [];
      const selSet = new Set(Array.isArray(selectedKeys) ? selectedKeys : []);
      return all.filter(function diff(key) { return key && !selSet.has(key); });
    }

    function sortNotebookItems(items, mode, titleFor) {
      const getTitle = typeof titleFor === 'function' ? titleFor : function none() { return ''; };
      const list = Array.isArray(items) ? items.slice() : [];
      return list.sort(function order(a, b) {
        if (mode === 'oldest') return (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0);
        if (mode === 'book') {
          const titleDelta = getTitle(a.bookId).localeCompare(getTitle(b.bookId), 'zh-Hans');
          if (titleDelta !== 0) return titleDelta;
          const chapterDelta = (Number(a.chapterIndex) || 0) - (Number(b.chapterIndex) || 0);
          if (chapterDelta !== 0) return chapterDelta;
          const positionA = Number.isFinite(Number(a.start)) ? Number(a.start) : Number(a.percent) || 0;
          const positionB = Number.isFinite(Number(b.start)) ? Number(b.start) : Number(b.percent) || 0;
          return positionA - positionB;
        }
        return (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0);
      });
    }

    function sortReviewItems(items, mode) {
      const list = Array.isArray(items) ? items.slice() : [];
      return list.sort(function order(a, b) {
        if (mode === 'rating') {
          const delta = (Number(b && b.review && b.review.rating) || 0) - (Number(a && a.review && a.review.rating) || 0);
          if (delta !== 0) return delta;
          return (Number(b && b.review && b.review.updatedAt) || 0) - (Number(a && a.review && a.review.updatedAt) || 0);
        }
        if (mode === 'oldest') return (Number(a && a.review && a.review.updatedAt) || 0) - (Number(b && b.review && b.review.updatedAt) || 0);
        if (mode === 'book') {
          const titleA = a && a.book ? String(a.book.title || '') : '';
          const titleB = b && b.book ? String(b.book.title || '') : '';
          return titleA.localeCompare(titleB, 'zh-Hans');
        }
        return (Number(b && b.review && b.review.updatedAt) || 0) - (Number(a && a.review && a.review.updatedAt) || 0);
      });
    }

    function readingReportMarkdown(state, books, t) {
      const days = state.stats.days || {};
      const totalSeconds = totalReadingSeconds(days);
      const streak = readingStreak(days);
      const highlights = Array.isArray(state.highlights) ? state.highlights : [];
      const bookmarks = Array.isArray(state.bookmarks) ? state.bookmarks : [];
      const sessions = Array.isArray(state.sessions) ? state.sessions : [];
      const finished = books.filter(function done(book) {
        const item = state.progress[book.id];
        return item && item.completed;
      }).length;
      const weekly = weekSeries(days);
      const ranking = bookReadingRanking(books, state.stats.byBook || {}, 5);
      const tastes = tagReadingTotals(books, state.stats.byBook || {}, state.userTags || {}, 6);
      const rhythm = weekdayTotals(days);
      const reviews = state.reviews && typeof state.reviews === 'object' ? state.reviews : {};
      const reviewed = books.filter(function hasReview(book) { return reviews[book.id] && (reviews[book.id].rating || reviews[book.id].text); }).sort(function order(a, b) { return (reviews[b.id].updatedAt || 0) - (reviews[a.id].updatedAt || 0); }).slice(0, 5);
      const achievements = computeAchievements({
        totalSeconds: totalSeconds,
        streak: streak,
        finished: finished,
        highlightCount: highlights.length,
      });
      const titleOf = function title(bookId) {
        const found = books.find(function book(item) { return item.id === bookId; });
        return found ? found.title : '';
      };
      const lines = [];
      lines.push('# ' + t('readingReport'));
      lines.push('');
      lines.push(fullDateLabel());
      lines.push('');
      lines.push('## ' + t('reportOverview'));
      lines.push('');
      lines.push('- ' + t('totalRead') + ': ' + formatDuration(totalSeconds, t));
      lines.push('- ' + t('streakDays') + ': ' + streak);
      lines.push('- ' + t('booksFinished') + ': ' + finished);
      lines.push('- ' + t('notesKept') + ': ' + highlights.length);
      lines.push('- ' + t('notesBookmarks') + ': ' + bookmarks.length);
      lines.push('- ' + t('readingSessions') + ': ' + sessions.length);
      lines.push('');
      lines.push('## ' + t('reportPeriod'));
      lines.push('');
      weekly.forEach(function day(item) {
        lines.push('- ' + dateLabel(item.date) + ': ' + formatDuration(item.seconds, t));
      });
      lines.push('');
      lines.push('## ' + t('weekdayRhythm'));
      lines.push('');
      ['dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat', 'daySun'].forEach(function dayKeyName(index) {
        lines.push('- ' + t(dayKeyName) + ': ' + formatDuration(rhythm[index], t));
      });
      lines.push('');
      if (tastes.length) {
        lines.push('## ' + t('readingTastes'));
        lines.push('');
        tastes.forEach(function item(taste) {
          lines.push('- ' + taste.tag + ': ' + formatDuration(taste.seconds, t));
        });
        lines.push('');
      }
      lines.push('## ' + t('readingRanking'));
      lines.push('');
      if (ranking.length) {
        ranking.forEach(function entry(item, index) {
          lines.push((index + 1) + '. ' + item.book.title + ' — ' + formatDuration(item.seconds, t));
        });
      } else {
        lines.push(t('noReadingRanking'));
      }
      const unlocked = achievements.filter(function item(achievement) { return achievement.unlocked; });
      if (unlocked.length) {
        lines.push('');
        lines.push('## ' + t('reportAchievements'));
        lines.push('');
        unlocked.forEach(function item(achievement) { lines.push('- ' + t(achievement.nameKey)); });
      }
      if (reviewed.length) {
        lines.push('');
        lines.push('## ' + t('myReview'));
        lines.push('');
        reviewed.forEach(function item(book) {
          const review = reviews[book.id];
          const stars = '★'.repeat(clamp(Math.round(Number(review.rating) || 0), 0, 5)) + '☆'.repeat(5 - clamp(Math.round(Number(review.rating) || 0), 0, 5));
          lines.push('- 《' + book.title + '》' + (review.rating ? ' ' + stars : ''));
          if (review.text) lines.push('  - ' + review.text);
        });
        lines.push('');
      }
      if (sessions.length) {
        lines.push('');
        lines.push('## ' + t('readingSessions'));
        lines.push('');
        sessions.slice(0, 5).forEach(function item(session) {
          lines.push('- ' + titleOf(session.bookId) + ' · ' + dateLabel(session.endedAt) + ' · ' + formatDuration(session.seconds, t));
        });
      }
      return lines.join('\n').trim() + '\n';
    }

    function booklistMarkdown(books, state, t) {
      const translate = typeof t === 'function' ? t : function id(k) { return k; };
      const allBooks = Array.isArray(books) ? books : [];
      const s = state && typeof state === 'object' ? state : {};
      const progress = s.progress || {};
      const wishlist = s.wishlist || [];
      const shelved = s.shelved || [];
      const reviews = (s.reviews && typeof s.reviews === 'object') ? s.reviews : {};
      const userTags = (s.userTags && typeof s.userTags === 'object') ? s.userTags : {};
      const byBook = (s.stats && s.stats.byBook && typeof s.stats.byBook === 'object') ? s.stats.byBook : {};
      const pinned = new Set(Array.isArray(s.pins) ? s.pins : []);

      const groups = groupBooksByStatus(allBooks, progress, wishlist, shelved);

      const lines = [];
      lines.push('# ' + translate('brand') + ' · ' + translate('booklistTitle'));
      lines.push('');
      lines.push(fullDateLabel() + ' · ' + fill(translate('booklistSummary'), { n: allBooks.length }));
      lines.push('');

      groups.forEach(function renderGroup(group) {
        lines.push('## ' + translate(group.label) + ' (' + group.books.length + ')');
        lines.push('');
        group.books.forEach(function renderBook(book) {
          const p = progress[book.id];
          const rev = reviews[book.id];
          const tags = userTags[book.id];
          const secs = Number(byBook[book.id]) || 0;
          const isPinned = pinned.has(book.id);

          let head = '- ' + (isPinned ? '📌 ' : '') + '**《' + book.title + '》**' + (book.author ? ' · ' + book.author : '');
          const meta = [];
          if (p) {
            if (p.completed) meta.push(translate('finished'));
            else if (p.percent > 0) meta.push(fill(translate('overallProgress'), { n: Math.round(p.percent * 100) }));
            if (typeof p.chapterIndex === 'number' && book.chapters && book.chapters[p.chapterIndex]) {
              meta.push(book.chapters[p.chapterIndex].title);
            }
          }
          if (secs > 0) {
            meta.push(formatDuration(secs, translate));
          }
          if (rev && rev.rating) {
            meta.push('★'.repeat(clamp(Math.round(rev.rating), 1, 5)));
          }
          if (meta.length) head += ' (' + meta.join(' · ') + ')';
          lines.push(head);

          if (Array.isArray(tags) && tags.length) {
            lines.push('  ' + tags.map(function tag(val) { return '#' + val; }).join(' '));
          }
          if (rev && rev.text) {
            lines.push('  > ' + rev.text);
          }
        });
        lines.push('');
      });

      lines.push('— ' + translate('brand'));
      return lines.join('\n').trim() + '\n';
    }

    function selectedAnnotationsMarkdown(selection, highlights, bookmarks, books, t) {
      const split = splitSelectionKeys(selection);
      const hSet = new Set(split.highlightIds);
      const bSet = new Set(split.bookmarkIds);
      const notes = (Array.isArray(highlights) ? highlights : []).filter(function pick(item) { return hSet.has(item.id); });
      const marks = (Array.isArray(bookmarks) ? bookmarks : []).filter(function pick(item) { return bSet.has(item.id); });
      const bookMap = new Map();
      (books || []).forEach(function add(book) { bookMap.set(book.id, book); });
      const grouped = new Map();
      notes.forEach(function add(note) {
        if (!bookMap.has(note.bookId)) return;
        if (!grouped.has(note.bookId)) grouped.set(note.bookId, { notes: [], marks: [] });
        grouped.get(note.bookId).notes.push(note);
      });
      marks.forEach(function add(mark) {
        if (!bookMap.has(mark.bookId)) return;
        if (!grouped.has(mark.bookId)) grouped.set(mark.bookId, { notes: [], marks: [] });
        grouped.get(mark.bookId).marks.push(mark);
      });
      const lines = ['# ' + t('brand') + ' · ' + t('notesTitle'), '', fullDateLabel(), ''];
      Array.from(grouped.keys()).sort(function order(a, b) {
        return bookMap.get(a).title.localeCompare(bookMap.get(b).title, 'zh-Hans');
      }).forEach(function each(bookId) {
        const book = bookMap.get(bookId);
        const group = grouped.get(bookId);
        lines.push('## ' + book.title);
        lines.push('');
        lines.push('*' + book.author + '*');
        lines.push('');
        group.notes.sort(function order(a, b) { return (a.chapterIndex || 0) - (b.chapterIndex || 0) || (a.start || 0) - (b.start || 0); }).forEach(function note(entry) {
          const chapter = (book && Array.isArray(book.chapters)) ? book.chapters[entry.chapterIndex] : null;
          lines.push(entry.text.split('\n').map(function quote(line) { return '> ' + line; }).join('\n'));
          lines.push('');
          if (entry.note) {
            lines.push('**' + t('thought') + '**');
            lines.push('');
            lines.push(entry.note);
            lines.push('');
          }
          if (Array.isArray(entry.tags) && entry.tags.length) {
            lines.push(entry.tags.map(function tag(value) { return '#' + value; }).join(' '));
            lines.push('');
          }
          lines.push('— ' + (chapter ? chapter.title : '') + ' · ' + dateLabel(entry.createdAt));
          lines.push('');
        });
        if (group.marks.length) {
          lines.push('### ' + t('bookmark'));
          lines.push('');
          group.marks.sort(function order(a, b) { return (a.chapterIndex || 0) - (b.chapterIndex || 0); }).forEach(function mark(entry) {
            const chapter = (book && Array.isArray(book.chapters)) ? book.chapters[entry.chapterIndex] : null;
            lines.push('- **' + (chapter ? chapter.title : '') + '** · ' + fill(t('bookmarkPage'), { n: entry.page }) + ' · ' + dateLabel(entry.createdAt));
            if (entry.excerpt) lines.push('  > ' + entry.excerpt);
            if (entry.note) lines.push('  - ' + entry.note);
          });
          lines.push('');
        }
      });
      return lines.join('\n').trim() + '\n';
    }

    function buildQuoteText(text, bookTitle, chapterTitle) {
      const quote = String(text || '').trim();
      if (!quote) return '';
      let source = '';
      if (bookTitle) source = '——《' + bookTitle + '》';
      if (chapterTitle) source += (source ? ' · ' : '——') + chapterTitle;
      return quote + (source ? '\n' + source : '');
    }

    function buildCalloutText(text, thought, bookTitle, chapterTitle, thoughtLabel) {
      const quote = String(text || '').trim();
      if (!quote) return '';
      let header = '> [!quote]';
      if (bookTitle) {
        header += ' 《' + bookTitle + '》' + (chapterTitle ? ' · ' + chapterTitle : '');
      } else if (chapterTitle) {
        header += ' ' + chapterTitle;
      }
      const quoteLines = quote.split('\n').map(function prefix(line) { return '> ' + line; }).join('\n');
      let result = header + '\n' + quoteLines;
      const note = String(thought || '').trim();
      if (note) {
        const label = thoughtLabel || '想法';
        result += '\n>\n> **' + label + '**：' + note.split('\n').join('\n> ');
      }
      return result;
    }

    function copyTextToClipboard(text) {
      const value = String(text || '');
      if (!value) return Promise.resolve(false);
      function fallback() {
        try {
          const area = document.createElement('textarea');
          area.value = value;
          area.setAttribute('readonly', 'readonly');
          area.style.position = 'fixed';
          area.style.left = '-9999px';
          area.style.opacity = '0';
          document.body.appendChild(area);
          area.select();
          const ok = document.execCommand('copy');
          document.body.removeChild(area);
          return ok;
        } catch (error) {
          return false;
        }
      }
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(value).then(function copied() { return true; }, function failed() { return fallback(); });
        }
      } catch (error) {
        /* fall through to the textarea fallback */
      }
      return Promise.resolve(fallback());
    }

    function buildReviewText(book, review) {
      if (!book || !review) return '';
      const stars = '★'.repeat(clamp(Math.round(Number(review.rating) || 0), 0, 5)) + '☆'.repeat(5 - clamp(Math.round(Number(review.rating) || 0), 0, 5));
      const lines = ['《' + book.title + '》' + (book.author ? ' · ' + book.author : '')];
      if (review.rating) lines.push(stars);
      if (review.text) {
        lines.push('');
        lines.push(String(review.text).trim());
      }
      return lines.join('\n').trim();
    }

    function buildBookTitlesText(books) {
      if (!Array.isArray(books) || !books.length) return '';
      return books.map(function format(book) {
        if (!book) return '';
        const title = String(book.title || '').trim();
        const author = String(book.author || '').trim();
        return '《' + title + '》' + (author ? ' ' + author : '');
      }).filter(Boolean).join('\n');
    }

    function reviewsMarkdown(reviewItems, t) {
      const translate = typeof t === 'function' ? t : function id(k) { return k; };
      const list = Array.isArray(reviewItems) ? reviewItems : [];
      const lines = [];
      lines.push('# ' + translate('brand') + ' · ' + translate('reviewsTab'));
      lines.push('');
      lines.push(fullDateLabel() + ' · ' + fill(translate('reviewsSummary'), { n: list.length }));
      lines.push('');

      list.forEach(function render(item) {
        if (!item || !item.book || !item.review) return;
        const book = item.book;
        const review = item.review;
        const rating = clamp(Math.round(Number(review.rating) || 0), 0, 5);
        const stars = rating > 0 ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : '';
        const dateStr = dateLabel(review.updatedAt);

        lines.push('## 《' + book.title + '》' + (book.author ? ' · ' + book.author : ''));
        const meta = [];
        if (stars) meta.push(stars);
        if (dateStr) meta.push(dateStr);
        if (meta.length) lines.push(meta.join(' · '));
        lines.push('');
        if (review.text) {
          lines.push('> ' + String(review.text).trim().split('\n').join('\n> '));
          lines.push('');
        }
      });

      lines.push('— ' + translate('brand'));
      return lines.join('\n').trim() + '\n';
    }

    function bookNotesMarkdown(book, highlights, bookmarks, t, review) {
      const lines = ['# ' + book.title, '', '*' + book.author + '*', ''];
      if (review && (review.rating || review.text)) {
        lines.push('## ' + t('myReview'));
        lines.push('');
        if (review.rating) {
          lines.push('★'.repeat(clamp(Math.round(Number(review.rating) || 0), 0, 5)) + '☆'.repeat(5 - clamp(Math.round(Number(review.rating) || 0), 0, 5)));
          lines.push('');
        }
        if (review.text) {
          lines.push(String(review.text).trim());
          lines.push('');
        }
      }
      const notes = (Array.isArray(highlights) ? highlights : []).filter(function mine(item) { return item.bookId === book.id; }).sort(function order(a, b) {
        return (a.chapterIndex || 0) - (b.chapterIndex || 0) || (a.start || 0) - (b.start || 0);
      });
      const marks = (Array.isArray(bookmarks) ? bookmarks : []).filter(function mine(item) { return item.bookId === book.id; }).sort(function order(a, b) {
        return (a.chapterIndex || 0) - (b.chapterIndex || 0) || (a.percent || 0) - (b.percent || 0);
      });
      if (notes.length) {
        lines.push('## ' + t('highlight'));
        lines.push('');
        notes.forEach(function entry(note) {
          const chapter = (book && Array.isArray(book.chapters)) ? book.chapters[note.chapterIndex] : null;
          lines.push(note.text.split('\n').map(function quote(line) { return '> ' + line; }).join('\n'));
          lines.push('');
          if (note.note) {
            lines.push('**' + t('thought') + '**');
            lines.push('');
            lines.push(note.note);
            lines.push('');
          }
          if (Array.isArray(note.tags) && note.tags.length) {
            lines.push(note.tags.map(function tag(value) { return '#' + value; }).join(' '));
            lines.push('');
          }
          lines.push('— ' + (chapter ? chapter.title : '') + ' · ' + dateLabel(note.createdAt));
          lines.push('');
        });
      }
      if (marks.length) {
        lines.push('## ' + t('bookmark'));
        lines.push('');
        marks.forEach(function entry(item) {
          const chapter = (book && Array.isArray(book.chapters)) ? book.chapters[item.chapterIndex] : null;
          lines.push('- **' + (chapter ? chapter.title : '') + '** · ' + fill(t('bookmarkPage'), { n: item.page }) + ' · ' + dateLabel(item.createdAt));
          if (item.excerpt) lines.push('  > ' + item.excerpt);
          if (item.note) lines.push('  - ' + item.note);
        });
        lines.push('');
      }
      return lines.join('\n').trim() + '\n';
    }

    // Whole-book export: review and notes first, then every chapter's text.
    function bookFullMarkdown(book, options) {
      const opts = options || {};
      const t = opts.t || function identity(key) { return key; };
      const lines = [bookNotesMarkdown(book, opts.highlights, opts.bookmarks, t, opts.review).trim(), ''];
      const progress = opts.progress;
      if (progress) {
        const percent = Math.round(clamp(Number(progress.percent) || 0, 0, 1) * 100);
        lines.push('**' + t('bookProgress') + '** ' + percent + '%' + (progress.completed ? ' · ' + t('finished') : ''));
        lines.push('');
      }
      lines.push('---');
      lines.push('');
      (book.chapters || []).forEach(function chapter(item, index) {
        lines.push('## ' + (index + 1) + '. ' + item.title);
        lines.push('');
        (item.paragraphs || []).forEach(function paragraph(text) {
          const value = String(text || '').trim();
          if (!value) return;
          lines.push(value);
          lines.push('');
        });
      });
      return lines.join('\n').trim() + '\n';
    }

    function bookMarkdownFilename(title) {
      const base = String(title || 'book')
        .replace(/[\\/:*?"<>|\s]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);
      return 'shiguang-book-' + (base || 'book') + '.md';
    }

    function normalizeSessions(raw, knownIds) {
      if (!Array.isArray(raw)) return [];
      const out = [];
      raw.slice(0, 200).forEach(function each(item, index) {
        if (!item || typeof item !== 'object') return;
        if (typeof item.bookId !== 'string' || knownIds.indexOf(item.bookId) < 0) return;
        const startedAt = Number(item.startedAt);
        const endedAt = Number(item.endedAt);
        const seconds = Math.round(Number(item.seconds));
        if (!Number.isFinite(startedAt) || startedAt <= 0 || !Number.isFinite(seconds) || seconds <= 0 || seconds > 86400) return;
        out.push({
          id: typeof item.id === 'string' && item.id ? item.id.slice(0, 80) : 'session-' + startedAt + '-' + index,
          bookId: item.bookId,
          startedAt: startedAt,
          endedAt: Number.isFinite(endedAt) && endedAt >= startedAt ? endedAt : startedAt + seconds * 1000,
          seconds: seconds,
          chapterIndex: Number.isFinite(Number(item.chapterIndex)) ? Math.max(0, Math.round(Number(item.chapterIndex))) : 0,
        });
      });
      return out.sort(function latest(a, b) { return b.endedAt - a.endedAt; }).slice(0, 100);
    }

    function normalizeReviews(raw, knownIds) {
      const out = {};
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
      Object.keys(raw).forEach(function each(bookId) {
        if (knownIds.indexOf(bookId) < 0) return;
        const item = raw[bookId];
        if (!item || typeof item !== 'object') return;
        const rating = clamp(Math.round(Number(item.rating) || 0), 0, 5);
        const text = typeof item.text === 'string' ? item.text.trim().slice(0, 2000) : '';
        if (!rating && !text) return;
        out[bookId] = { rating: rating, text: text, updatedAt: Number(item.updatedAt) || 0 };
      });
      return out;
    }

    function normalizeState(raw) {
      const base = defaultState();
      if (!raw || typeof raw !== 'object') return base;
      const builtInIds = BUILTIN_BOOKS.map(function id(book) { return book.id; });
      // No shelf cap: storage quota is the only real limit and it reports itself.
      const customBooks = Array.isArray(raw.customBooks)
        ? raw.customBooks.map(function normalize(book) { return normalizeStoredBook(book, builtInIds); }).filter(Boolean)
        : [];
      const knownIds = builtInIds.concat(customBooks.map(function id(book) { return book.id; }));
      const bookById = new Map();
      BUILTIN_BOOKS.concat(customBooks).forEach(function add(book) { bookById.set(book.id, book); });
      const progress = {};
      if (raw.progress && typeof raw.progress === 'object') {
        Object.keys(raw.progress).forEach(function each(id) {
          if (knownIds.indexOf(id) < 0) return;
          const item = raw.progress[id];
          if (!item || typeof item !== 'object') return;
          const known = bookById.get(id);
          const chapterMarks = normalizeChapterMarks(item.chapterMarks, known ? known.chapters : []);
          progress[id] = {
            chapterIndex: Math.max(0, Number(item.chapterIndex) || 0),
            percent: clamp(Number(item.percent) || 0, 0, 1),
            completed: item.completed === true,
            updatedAt: Number.isFinite(item.updatedAt) ? item.updatedAt : 0,
          };
          if (Object.keys(chapterMarks).length) progress[id].chapterMarks = chapterMarks;
        });
      }
      const highlights = Array.isArray(raw.highlights)
        ? raw.highlights.map(normalizeHighlight).filter(function valid(item) {
          return item && knownIds.indexOf(item.bookId) >= 0;
        }).slice(0, MAX_HIGHLIGHTS)
        : [];
      const bookmarks = Array.isArray(raw.bookmarks)
        ? raw.bookmarks.map(normalizeBookmark).filter(function valid(item) {
          return item && knownIds.indexOf(item.bookId) >= 0;
        }).slice(0, 400)
        : [];
      const days = {};
      if (raw.stats && raw.stats.days && typeof raw.stats.days === 'object') {
        Object.keys(raw.stats.days).forEach(function each(key) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
          const value = Number(raw.stats.days[key]);
          if (Number.isFinite(value) && value > 0) days[key] = Math.min(value, 86400);
        });
      }
      const byBook = {};
      if (raw.stats && raw.stats.byBook && typeof raw.stats.byBook === 'object') {
        Object.keys(raw.stats.byBook).forEach(function each(id) {
          if (knownIds.indexOf(id) < 0) return;
          const value = Number(raw.stats.byBook[id]);
          if (Number.isFinite(value) && value > 0) byBook[id] = Math.min(value, 31536000);
        });
      }
      return {
        v: 1,
        settings: clampSettings(raw.settings),
        customBooks: customBooks,
        progress: progress,
        highlights: highlights,
        bookmarks: bookmarks,
        stats: {
          days: days,
          goalMinutes: clamp(Number(raw.stats && raw.stats.goalMinutes) || DEFAULT_WEEKLY_GOAL_MINUTES, 30, 1440),
          byBook: byBook,
        },
        lastBookId: typeof raw.lastBookId === 'string' && knownIds.indexOf(raw.lastBookId) >= 0 ? raw.lastBookId : null,
        lastReadAt: Number.isFinite(raw.lastReadAt) ? raw.lastReadAt : 0,
        shelfSort: ['recent', 'title', 'author', 'added', 'progress', 'rating'].indexOf(raw.shelfSort) >= 0 ? raw.shelfSort : 'recent',
        shelfView: ['grid', 'list', 'group'].indexOf(raw.shelfView) >= 0 ? raw.shelfView : 'grid',
        userTags: normalizeUserTags(raw.userTags, knownIds),
        wishlist: Array.isArray(raw.wishlist) ? Array.from(new Set(raw.wishlist.filter(function wish(id) { return typeof id === 'string' && knownIds.indexOf(id) >= 0; }))).slice(0, 200) : [],
        shelved: Array.isArray(raw.shelved) ? Array.from(new Set(raw.shelved.filter(function parked(id) { return typeof id === 'string' && knownIds.indexOf(id) >= 0; }))).slice(0, 200) : [],
        sessions: normalizeSessions(raw.sessions, knownIds),
        reviews: normalizeReviews(raw.reviews, knownIds),
        pins: Array.isArray(raw.pins) ? Array.from(new Set(raw.pins.filter(function pin(id) { return typeof id === 'string' && knownIds.indexOf(id) >= 0; }))).slice(0, 100) : [],
        fsLibrary: raw.fsLibrary && typeof raw.fsLibrary.name === 'string' && raw.fsLibrary.name
          ? { name: raw.fsLibrary.name.slice(0, 120) }
          : null,
      };
    }

    function loadState() {
      try {
        const text = window.localStorage.getItem(STORAGE_KEY);
        if (!text) return defaultState();
        return normalizeState(JSON.parse(text));
      } catch (error) {
        return defaultState();
      }
    }

    // Copies the state with disk-backed chapter bodies removed, so localStorage only keeps
    // metadata. Books without the chaptersInFs flag are untouched.
    // A body on disk should be a book, not a data structure: plain text, one `# title`
    // line per chapter, a blank line between paragraphs. It opens in TextEdit, greps
    // like any other text file, and a sync folder shows the real title in its name.
    function bookBodyText(book) {
      const chapters = book && Array.isArray(book.chapters) ? book.chapters : [];
      return chapters.map(function each(chapter) {
        const title = String((chapter && chapter.title) || '').trim() || '正文';
        const paragraphs = Array.isArray(chapter && chapter.paragraphs) ? chapter.paragraphs : [];
        const body = paragraphs
          .map(function line(part) { return String(part == null ? '' : part).trim(); })
          .filter(Boolean)
          .join('\n\n');
        return '# ' + title + (body ? '\n\n' + body : '');
      }).join('\n\n');
    }

    // Reads that text back. Chapter ids come from the book's own `chapterIds` when the
    // count still matches, so highlights and bookmarks keep pointing at the chapter
    // the reader was on; otherwise they fall back to the ids the parser would have made.
    function parseBookBodyText(text, ids, prefix) {
      const raw = String(text || '').replace(/\r\n?/g, '\n').trim();
      if (!raw) return [];
      const known = Array.isArray(ids) ? ids : [];
      const collected = [];
      let current = null;
      let inCodeBlock = false;
      raw.split('\n').forEach(function each(line) {
        const trimmed = line.trim();
        if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
          inCodeBlock = !inCodeBlock;
        }
        const heading = !inCodeBlock && /^#\s+(.+?)\s*$/.exec(line);
        if (heading) {
          current = { title: heading[1].slice(0, 120), lines: [] };
          collected.push(current);
          return;
        }
        if (!current) {
          current = { title: '正文', lines: [] };
          collected.push(current);
        }
        current.lines.push(line);
      });
      const chapters = collected.map(function finish(chapter) {
        const paragraphs = chapter.lines.join('\n').split(/\n{2,}/)
          .map(function trim(part) { return part.trim(); })
          .filter(Boolean);
        return { title: chapter.title, paragraphs: paragraphs };
      }).filter(function keep(chapter) { return chapter.paragraphs.length > 0; });
      const stem = prefix || 'imp';
      return chapters.map(function identify(chapter, index) {
        const knownId = known[index];
        return {
          id: typeof knownId === 'string' && knownId ? knownId : stem + '-c' + (index + 1),
          title: chapter.title,
          paragraphs: chapter.paragraphs,
        };
      });
    }

    // Folder bodies leave the payload, but only while a folder is actually mounted —
    // otherwise the flag would be the only copy left.
    function stripDiskBackedBodies(state, withFolder) {
      if (!state || !Array.isArray(state.customBooks)) return state;
      let changed = false;
      const customBooks = state.customBooks.map(function each(book) {
        if (!book) return book;
        if (!(withFolder && book.chaptersInFs === true)) return book;
        if (!Array.isArray(book.chapters) || !book.chapters.length) return book;
        changed = true;
        const copy = Object.assign({}, book);
        delete copy.chapters;
        return copy;
      });
      if (!changed) return state;
      return Object.assign({}, state, { customBooks: customBooks });
    }

    // Books whose body never made it to disk. They are still in browser storage,
    // which is exactly the state the user was told would not happen — so name the
    // count instead of showing a cheerful "ready" toast over a half-local library.
    function unwrittenBookIds(books, written) {
      const list = Array.isArray(books) ? books : [];
      const done = new Set(Array.isArray(written) ? written : []);
      return list
        .map(function id(book) { return book && book.id; })
        .filter(function keep(id) { return typeof id === 'string' && !done.has(id); });
    }

    // Chapter ids as the reader knows them. A readable body file keeps titles and
    // paragraphs but not ids, and every highlight, bookmark and per-chapter progress
    // mark is keyed by an id — so they are copied into the metadata before the body
    // leaves state.
    function chapterIdsOf(book) {
      const chapters = book && Array.isArray(book.chapters) ? book.chapters : [];
      return chapters.map(function id(chapter, index) {
        return chapter && typeof chapter.id === 'string' && chapter.id ? chapter.id : 'imp-c' + (index + 1);
      });
    }

    // Flags the books whose bodies were just written to the library folder. It runs on
    // the state the import produced — reaching for a ref here would flag the previous
    // state and drop the very books that were just added.
    function markBodiesOnDisk(state, ids) {
      if (!state || !Array.isArray(state.customBooks)) return state;
      if (!Array.isArray(ids) || !ids.length) return state;
      return Object.assign({}, state, {
        customBooks: state.customBooks.map(function each(book) {
          if (!book || ids.indexOf(book.id) < 0) return book;
          return Object.assign({}, book, { chaptersInFs: true, chapterIds: chapterIdsOf(book) });
        }),
      });
    }

    function stripFsBookBodies(state) {
      return stripDiskBackedBodies(state, true);
    }

    // What actually gets serialized: disk-backed bodies are replaced by their flag.
    // Used by localStorage and by the folder snapshot.
    function stateForStorage(state) {
      return stripDiskBackedBodies(state, !!fsDirectory);
    }

    // `人间词话--local-3f9a.txt` and its siblings: the id after `--` is the
    // stable part of a book's file names, the title in front of it is not.
    const ORPHAN_NAME = /--([A-Za-z0-9._-]+)\.(?:txt|md|json|epub|assets)$/i;

    // Files with no matching book — left behind by a delete that could not reach
    // the folder. Filenames are sanitized the same way the writer names them.
    function orphanBodyIds(listedFiles, books) {
      const list = Array.isArray(books) ? books : [];
      const keep = new Set();
      const liveIds = new Set();
      const epubIds = new Set();
      list.forEach(function name(book) {
        if (!book || !book.id) return;
        // Every part a live book may have on disk: the readable text, the picture
        // directory, the original EPUB, and the id-only JSON of older versions.
        keep.add(fsBodyFileName(book));
        keep.add(fsAssetsDirName(book));
        keep.add(fsSourceFileName(book, 'epub'));
        keep.add(fsBookFileName(book.id));
        const token = fsIdToken(book.id);
        liveIds.add(token);
        if (isEpubBook(book)) epubIds.add(token);
      });
      return (Array.isArray(listedFiles) ? listedFiles : []).filter(function orphan(file) {
        if (typeof file !== 'string' || !file.length) return false;
        if (keep.has(file)) return false;
        // A rename that could not finish leaves the book's files under its old
        // title. They still carry the live id, and deleting them would delete the
        // only copy of that text — so the id, not the title, decides.
        const match = ORPHAN_NAME.exec(file);
        if (match) {
          const id = match[1];
          if (epubIds.has(id) && /\.(txt|md)$/i.test(file)) return true;
          if (liveIds.has(id)) return false;
        }
        return true;
      });
    }

    // The delete button's undo restores metadata only, so a body file deleted at the
    // very click would leave the restored book unopenable. The file is removed once
    // the undo window has closed instead; taking the undo cancels the removal. Timer
    // functions are injected so tests can drive the clock.
    function deferBodyRemoval(ids, remove, delayMs, setTimeoutFn, clearTimeoutFn) {
      const list = (Array.isArray(ids) ? ids : []).filter(function keep(id) {
        return typeof id === 'string' && id;
      });
      if (!list.length) return function noop() {};
      let settled = false;
      const timer = setTimeoutFn(function fire() {
        settled = true;
        list.forEach(function each(id) {
          try { remove(id); } catch (error) { /* one stuck file must not block the rest */ }
        });
      }, delayMs);
      return function cancel() {
        if (settled) return;
        settled = true;
        clearTimeoutFn(timer);
      };
    }

    // Adopts the folder snapshot only when browser storage has nothing left. A live
    // library is never overwritten, and an empty snapshot never wins.
    function adoptLibrarySnapshot(current, snapshot) {
      const live = current && typeof current === 'object' ? current : {};
      const hasBooks = Array.isArray(live.customBooks) && live.customBooks.length > 0;
      const hasProgress = live.progress && typeof live.progress === 'object' && Object.keys(live.progress).length > 0;
      const hasNotes = (Array.isArray(live.highlights) && live.highlights.length > 0)
        || (Array.isArray(live.bookmarks) && live.bookmarks.length > 0);
      if (hasBooks || hasProgress || hasNotes) return null;
      if (!snapshot || typeof snapshot !== 'object') return null;
      const next = normalizeState(snapshot);
      return next.customBooks.length ? next : null;
    }

    function saveState(state) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateForStorage(state)));
        return true;
      } catch (error) {
        /* Storage can be unavailable or full; the reader keeps working in memory. */
        return false;
      }
    }

    function collapseWhitespace(text) {
      return String(text || '').replace(/\s+/g, ' ').trim();
    }

    function searchBookChapters(chapters, rawQuery, limit, options) {
      const source = Array.isArray(chapters) ? chapters : [];
      const query = String(rawQuery || '').trim();
      const max = Math.max(1, limit || 80);
      if (!query || !source.length) return { query: '', results: [], truncated: false };
      const needle = query.toLowerCase();
      const results = [];
      let truncated = false;
      const opts = options || {};
      const targetChapterIndex = typeof opts.chapterIndex === 'number' && Number.isFinite(opts.chapterIndex) ? opts.chapterIndex : null;
      for (let index = 0; index < source.length; index += 1) {
        if (targetChapterIndex !== null && index !== targetChapterIndex) continue;
        if (results.length >= max) {
          truncated = true;
          break;
        }
        const chapter = chapters[index];
        const text = chapterText(chapter);
        const lower = text.toLowerCase();
        let from = 0;
        while (results.length < max) {
          const at = lower.indexOf(needle, from);
          if (at < 0) break;
          const beforeStart = Math.max(0, at - 42);
          const afterEnd = Math.min(text.length, at + needle.length + 78);
          const wideBeforeStart = Math.max(0, at - 120);
          const wideAfterEnd = Math.min(text.length, at + needle.length + 180);
          results.push({
            chapterIndex: typeof chapter.chapterIndex === 'number' ? chapter.chapterIndex : index,
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            chapterLength: text.length,
            start: at,
            end: at + needle.length,
            before: collapseWhitespace(text.slice(beforeStart, at)),
            match: text.slice(at, at + needle.length),
            after: collapseWhitespace(text.slice(at + needle.length, afterEnd)),
            wideBefore: collapseWhitespace(text.slice(wideBeforeStart, at)),
            wideAfter: collapseWhitespace(text.slice(at + needle.length, wideAfterEnd)),
          });
          from = at + Math.max(1, needle.length);
        }
        if (results.length >= max) {
          const rest = lower.indexOf(needle, from);
          if (rest >= 0) truncated = true;
        }
      }
      return { query: query, results: results, truncated: truncated };
    }

    function makeBackupPayload(state) {
      return {
        __format: 'shiguang-reader-backup',
        version: 1,
        exportedAt: Date.now(),
        data: state,
      };
    }

    function parseBackupPayload(raw) {
      let parsed;
      try {
        parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (error) {
        throw new Error('backup-invalid');
      }
      if (!parsed || parsed.__format !== 'shiguang-reader-backup' || parsed.version !== 1 || !parsed.data) {
        throw new Error('backup-invalid');
      }
      return normalizeState(parsed.data);
    }

    function downloadTextFile(filename, content, mime) {
      try {
        const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(function cleanup() { window.URL.revokeObjectURL(url); }, 600);
        return true;
      } catch (error) {
        return false;
      }
    }

    function downloadMarkdownFile(filename, content) {
      return downloadTextFile(filename, content, 'text/markdown;charset=utf-8');
    }

    function computeAchievements(summary) {
      const totalSeconds = Math.max(0, Number(summary && summary.totalSeconds) || 0);
      const streak = Math.max(0, Number(summary && summary.streak) || 0);
      const finished = Math.max(0, Number(summary && summary.finished) || 0);
      const highlights = Math.max(0, Number(summary && summary.highlightCount) || 0);
      const definitions = [
        { id: 'firstRead', icon: 'book-open', value: Math.min(totalSeconds, 60), target: 60 },
        { id: 'streak3', icon: 'flame', value: Math.min(streak, 3), target: 3 },
        { id: 'streak7', icon: 'flame', value: Math.min(streak, 7), target: 7 },
        { id: 'finish1', icon: 'book', value: Math.min(finished, 1), target: 1 },
        { id: 'finish5', icon: 'sparkle', value: Math.min(finished, 5), target: 5 },
        { id: 'notes10', icon: 'pen', value: Math.min(highlights, 10), target: 10 },
        { id: 'hours10', icon: 'clock', value: Math.min(totalSeconds, 36000), target: 36000 },
        { id: 'hours50', icon: 'leaf', value: Math.min(totalSeconds, 180000), target: 180000 },
      ];
      return definitions.map(function achievement(item) {
        return Object.assign({}, item, {
          unlocked: item.value >= item.target,
          progress: item.target ? Math.min(1, item.value / item.target) : 0,
          nameKey: 'ach' + item.id.charAt(0).toUpperCase() + item.id.slice(1) + 'Name',
          descKey: 'ach' + item.id.charAt(0).toUpperCase() + item.id.slice(1) + 'Desc',
        });
      });
    }

    function tagReadingTotals(books, byBook, userTags, limit) {
      const source = byBook && typeof byBook === 'object' ? byBook : {};
      const extras = userTags && typeof userTags === 'object' ? userTags : {};
      const totals = new Map();
      (books || []).forEach(function add(book) {
        const seconds = Math.max(0, Number(source[book.id]) || 0);
        if (!seconds) return;
        const tags = new Set();
        (Array.isArray(book.tags) ? book.tags : []).forEach(function tag(value) { if (value) tags.add(value); });
        (Array.isArray(extras[book.id]) ? extras[book.id] : []).forEach(function tag(value) { if (value) tags.add(value); });
        tags.forEach(function each(tagValue) {
          const current = totals.get(tagValue) || { tag: tagValue, seconds: 0, books: 0 };
          current.seconds += seconds;
          current.books += 1;
          totals.set(tagValue, current);
        });
      });
      return Array.from(totals.values()).sort(function order(a, b) {
        return b.seconds - a.seconds || a.tag.localeCompare(b.tag, 'zh-Hans');
      }).slice(0, Math.max(1, Number(limit) || 6));
    }

    function bookReadingRanking(books, byBook, limit) {
      const source = byBook && typeof byBook === 'object' ? byBook : {};
      return books.map(function pair(book, index) {
        return { book: book, index: index, seconds: Math.max(0, Number(source[book.id]) || 0) };
      }).filter(function hasTime(item) { return item.seconds > 0; }).sort(function order(a, b) {
        return b.seconds - a.seconds || a.index - b.index;
      }).slice(0, Math.max(1, Number(limit) || 5)).map(function unwrap(item) {
        return { book: item.book, seconds: item.seconds };
      });
    }

    function nextSleepTimer(current) {
      const options = [0, 15, 30, 60];
      const index = options.indexOf(Number(current));
      return options[(index + 1) % options.length];
    }

    function sortShelfBooks(books, progress, pins, sort, reviews) {
      const pinned = new Set(Array.isArray(pins) ? pins : []);
      const indexed = books.map(function wrap(book, index) { return { book: book, index: index }; });
      const mode = ['recent', 'title', 'author', 'added', 'progress', 'rating', 'words'].indexOf(sort) >= 0 ? sort : 'recent';
      const ratings = reviews && typeof reviews === 'object' ? reviews : {};
      indexed.sort(function order(a, b) {
        const pinDelta = (pinned.has(b.book.id) ? 1 : 0) - (pinned.has(a.book.id) ? 1 : 0);
        if (pinDelta !== 0) return pinDelta;
        if (mode === 'title') return String(a.book.title).localeCompare(String(b.book.title), 'zh-Hans');
        if (mode === 'author') return String(a.book.author).localeCompare(String(b.book.author), 'zh-Hans');
        if (mode === 'progress') return progressPercent(b.book, progress[b.book.id]) - progressPercent(a.book, progress[a.book.id]);
        if (mode === 'words') {
          const delta = bookCharCount(b.book) - bookCharCount(a.book);
          if (delta !== 0) return delta;
          return a.index - b.index;
        }
        if (mode === 'rating') {
          const ratingDelta = (Number(ratings[b.book.id] && ratings[b.book.id].rating) || 0) - (Number(ratings[a.book.id] && ratings[a.book.id].rating) || 0);
          if (ratingDelta !== 0) return ratingDelta;
          return a.index - b.index;
        }
        if (mode === 'added') return (Number(b.book.addedAt) || 0) - (Number(a.book.addedAt) || 0);
        const updated = (Number(progress[b.book.id] && progress[b.book.id].updatedAt) || 0) - (Number(progress[a.book.id] && progress[a.book.id].updatedAt) || 0);
        if (updated !== 0) return updated;
        const added = (Number(b.book.addedAt) || 0) - (Number(a.book.addedAt) || 0);
        if (added !== 0) return added;
        return a.index - b.index;
      });
      return indexed.map(function unwrap(item) { return item.book; });
    }

    function withBookMetadata(book, patch) {
      if (!book) return book;
      const nextTitle = typeof patch.title === 'string' ? patch.title.trim().slice(0, 100) : book.title;
      if (!nextTitle) return book;
      const nextAuthor = typeof patch.author === 'string' ? patch.author.trim().slice(0, 80) : book.author;
      if (nextTitle === book.title && nextAuthor === book.author) return book;
      const cover = book.cover && typeof book.cover === 'object' ? Object.assign({}, book.cover) : book.cover;
      if (cover && !book.coverImage) {
        const glyph = Array.from(nextTitle)[0] || cover.glyph;
        cover.glyph = glyph;
      }
      return Object.assign({}, book, {
        title: nextTitle,
        author: nextAuthor || book.author,
        cover: cover,
      });
    }

    function readerExcerptAt(text, percent, maxLength) {
      const source = String(text || '');
      if (!source) return '';
      const length = Math.max(8, Number(maxLength) || 100);
      const start = clamp(Math.floor(source.length * clamp(Number(percent) || 0, 0, 1)), 0, Math.max(0, source.length - 1));
      let excerpt = source.slice(start, start + length).replace(/\s+/g, ' ').trim();
      if (!excerpt) excerpt = source.slice(Math.max(0, start - length), start).replace(/\s+/g, ' ').trim();
      return excerpt.slice(0, 240);
    }

    function searchLibraryBooks(books, rawQuery, limit) {
      const query = String(rawQuery || '').trim();
      const max = Math.max(1, Number(limit) || 8);
      if (!query) return [];
      const results = [];
      for (let index = 0; index < books.length && results.length < max; index += 1) {
        const book = books[index];
        const found = searchBookChapters(book.chapters, query, max - results.length);
        found.results.forEach(function add(item) {
          results.push(Object.assign({}, item, {
            bookId: book.id,
            bookTitle: book.title,
            bookAuthor: book.author,
          }));
        });
      }
      return results.slice(0, max);
    }

    function resultTitle(result) {
      if (!result) return '';
      return result.title || '';
    }

    // Powers the command palette: tags, books, chapter titles and excerpts share one ranked pass.
    function paletteResults(options) {
      const opts = options || {};
      const query = String(opts.query || '').trim();
      const limit = Math.max(1, Math.min(20, Math.round(Number(opts.limit) || 5)));
      const books = Array.isArray(opts.books) ? opts.books : [];
      const highlights = Array.isArray(opts.highlights) ? opts.highlights : [];
      const userTags = opts.userTags && typeof opts.userTags === 'object' ? opts.userTags : {};
      const out = { query: query, tags: [], books: [], chapters: [], notes: [], total: 0 };
      if (!query) return out;

      const isTagPrefix = query.charAt(0) === '#' || query.toLowerCase().indexOf('tag:') === 0;
      const rawTagNeedle = query.charAt(0) === '#'
        ? query.slice(1).trim()
        : query.toLowerCase().indexOf('tag:') === 0
          ? query.slice(4).trim()
          : '';
      const tagNeedle = rawTagNeedle.toLowerCase();
      const needle = query.toLowerCase();

      // Collect all tags across books (builtin and user-assigned)
      const tagBooksMap = new Map();
      books.forEach(function scanTags(book) {
        const bookTags = Array.isArray(book.tags) ? book.tags : [];
        const mine = Array.isArray(userTags[book.id]) ? userTags[book.id] : [];
        const combined = new Set();
        bookTags.forEach(function add(t) { if (t) combined.add(String(t).trim()); });
        mine.forEach(function add(t) { if (t) combined.add(String(t).trim()); });
        combined.forEach(function record(tag) {
          if (!tag) return;
          if (!tagBooksMap.has(tag)) tagBooksMap.set(tag, []);
          tagBooksMap.get(tag).push(book);
        });
      });

      if (isTagPrefix) {
        const matchingTags = [];
        tagBooksMap.forEach(function evaluate(taggedBooks, tagName) {
          if (!tagNeedle || tagName.toLowerCase().indexOf(tagNeedle) >= 0) {
            matchingTags.push({ tag: tagName, count: taggedBooks.length, books: taggedBooks });
          }
        });
        matchingTags.sort(function sortTags(a, b) {
          if (tagNeedle) {
            const aStarts = a.tag.toLowerCase().indexOf(tagNeedle) === 0 ? 0 : 1;
            const bStarts = b.tag.toLowerCase().indexOf(tagNeedle) === 0 ? 0 : 1;
            if (aStarts !== bStarts) return aStarts - bStarts;
          }
          return b.count - a.count || a.tag.localeCompare(b.tag);
        });
        out.tags = matchingTags.slice(0, limit).map(function item(m) {
          return { tag: m.tag, count: m.count };
        });

        const bookSet = new Set();
        matchingTags.forEach(function collectBooks(m) {
          m.books.forEach(function addBook(b) {
            if (out.books.length < limit && !bookSet.has(b.id)) {
              bookSet.add(b.id);
              out.books.push(b);
            }
          });
        });
        out.total = out.tags.length + out.books.length;
        return out;
      }

      function rank(primary, haystack) {
        const text = String(primary || '').toLowerCase();
        if (text.indexOf(needle) === 0) return 0;
        if (text.indexOf(needle) >= 0) return 1;
        if (String(haystack || '').toLowerCase().indexOf(needle) >= 0) return 2;
        return -1;
      }

      const matchingTags = [];
      tagBooksMap.forEach(function evaluate(taggedBooks, tagName) {
        if (tagName.toLowerCase().indexOf(needle) >= 0) {
          matchingTags.push({ tag: tagName, count: taggedBooks.length });
        }
      });
      matchingTags.sort(function sortTags(a, b) {
        const aStarts = a.tag.toLowerCase().indexOf(needle) === 0 ? 0 : 1;
        const bStarts = b.tag.toLowerCase().indexOf(needle) === 0 ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return b.count - a.count || a.tag.localeCompare(b.tag);
      });
      out.tags = matchingTags.slice(0, limit);

      const hits = [];
      books.forEach(function scan(book, index) {
        const mine = Array.isArray(userTags[book.id]) ? userTags[book.id] : [];
        const haystack = [book.author, (book.tags || []).join(' '), mine.join(' ')].join(' ');
        const score = rank(book.title, haystack);
        if (score >= 0) hits.push({ book: book, score: score, index: index });
      });
      hits.sort(function order(a, b) { return a.score - b.score || a.index - b.index; });
      out.books = hits.slice(0, limit).map(function unwrap(item) { return item.book; });

      for (let index = 0; index < books.length; index += 1) {
        if (out.chapters.length >= limit) break;
        const book = books[index];
        (book.chapters || []).forEach(function each(chapter, chapterIndex) {
          if (out.chapters.length >= limit) return;
          if (String(chapter.title || '').toLowerCase().indexOf(needle) < 0) return;
          out.chapters.push({ book: book, chapter: chapter, chapterIndex: chapterIndex });
        });
      }

      const ordered = highlights.slice().sort(function latest(a, b) {
        return (Number(b && b.createdAt) || 0) - (Number(a && a.createdAt) || 0);
      });
      for (let index = 0; index < ordered.length && out.notes.length < limit; index += 1) {
        const note = ordered[index];
        if (!note) continue;
        const body = String(note.text || '') + ' ' + String(note.note || '');
        if (body.toLowerCase().indexOf(needle) < 0) continue;
        out.notes.push(note);
      }

      out.total = out.tags.length + out.books.length + out.chapters.length + out.notes.length;
      return out;
    }

    // Notebook timeline: bucket notes by calendar month, newest month first.
    function groupNotesByMonth(items) {
      const list = Array.isArray(items) ? items : [];
      const buckets = new Map();
      list.forEach(function each(note) {
        const stamp = Number(note && note.createdAt) || 0;
        const date = new Date(stamp || Date.now());
        const month = date.getMonth() + 1;
        const key = date.getFullYear() + '-' + String(month).padStart(2, '0');
        const bucket = buckets.get(key);
        if (bucket) bucket.items.push(note);
        else buckets.set(key, { key: key, year: date.getFullYear(), month: month, items: [note] });
      });
      return Array.from(buckets.values()).sort(function order(a, b) { return b.key.localeCompare(a.key); });
    }

    // Buckets notes by their source book, newest activity first; group order is stable.
    function groupNotesByBook(items, books) {
      const list = Array.isArray(items) ? items : [];
      const bookList = Array.isArray(books) ? books : [];
      const bookMap = new Map();
      bookList.forEach(function each(book) { if (book && book.id) bookMap.set(book.id, book); });
      const buckets = new Map();
      list.forEach(function each(note) {
        if (!note || typeof note.bookId !== 'string') return;
        const stamp = Number(note.createdAt) || 0;
        const bucket = buckets.get(note.bookId);
        if (bucket) {
          bucket.items.push(note);
          if (stamp > bucket.latestAt) bucket.latestAt = stamp;
          return;
        }
        const book = bookMap.get(note.bookId);
        buckets.set(note.bookId, {
          bookId: note.bookId,
          title: book ? book.title : '',
          author: book ? book.author || '' : '',
          items: [note],
          latestAt: stamp,
        });
      });
      return Array.from(buckets.values()).sort(function order(a, b) {
        if (b.latestAt !== a.latestAt) return b.latestAt - a.latestAt;
        return String(a.title).localeCompare(String(b.title), 'zh-Hans');
      });
    }

    // ---- Monthly review -------------------------------------------------

    const TIME_OF_DAY_BUCKETS = [
      { id: 'dawn', from: 0, to: 5 },
      { id: 'morning', from: 6, to: 11 },
      { id: 'afternoon', from: 12, to: 17 },
      { id: 'evening', from: 18, to: 23 },
    ];

    function monthKeyOf(value) {
      const stamp = value instanceof Date ? value.getTime() : Number(value);
      const date = new Date(Number.isFinite(stamp) && stamp > 0 ? stamp : Date.now());
      return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
    }

    // Splits reading sessions into four local-time buckets; always returns all four rows.
    function readingTimeOfDay(sessions) {
      const list = Array.isArray(sessions) ? sessions : [];
      const totals = {};
      TIME_OF_DAY_BUCKETS.forEach(function init(bucket) { totals[bucket.id] = 0; });
      list.forEach(function each(session) {
        const startedAt = Number(session && session.startedAt);
        const seconds = Number(session && session.seconds);
        if (!Number.isFinite(startedAt) || startedAt <= 0 || !Number.isFinite(seconds) || seconds <= 0) return;
        const hour = new Date(startedAt).getHours();
        const bucket = TIME_OF_DAY_BUCKETS.find(function match(item) {
          return hour >= item.from && hour <= item.to;
        }) || TIME_OF_DAY_BUCKETS[0];
        totals[bucket.id] += seconds;
      });
      const total = TIME_OF_DAY_BUCKETS.reduce(function sum(all, bucket) { return all + totals[bucket.id]; }, 0);
      let peak = TIME_OF_DAY_BUCKETS[0];
      TIME_OF_DAY_BUCKETS.forEach(function compare(bucket) {
        if (totals[bucket.id] > totals[peak.id]) peak = bucket;
      });
      return {
        total: total,
        peak: total > 0 ? peak.id : '',
        buckets: TIME_OF_DAY_BUCKETS.map(function row(bucket) {
          return {
            id: bucket.id,
            seconds: totals[bucket.id],
            ratio: total > 0 ? totals[bucket.id] / total : 0,
          };
        }),
      };
    }

    // Everything the monthly card needs, all derived from a single month key.
    function monthlySummary(input) {
      const spec = input || {};
      const days = spec.days && typeof spec.days === 'object' ? spec.days : {};
      const rawMonth = String(spec.month || '');
      const month = /^\d{4}-\d{2}$/.test(rawMonth) ? rawMonth : monthKeyOf(Date.now());
      let seconds = 0;
      let activeDays = 0;
      let bestDay = null;
      Object.keys(days).forEach(function each(key) {
        if (key.slice(0, 7) !== month) return;
        const value = Math.max(0, Number(days[key]) || 0);
        if (value <= 0) return;
        seconds += value;
        activeDays += 1;
        if (!bestDay || value > bestDay.seconds) {
          bestDay = { key: key, day: Number(key.slice(8, 10)) || 1, seconds: value };
        }
      });

      const books = Array.isArray(spec.books) ? spec.books : [];
      const bookMap = new Map();
      books.forEach(function each(book) { if (book && book.id) bookMap.set(book.id, book); });
      const perBook = new Map();
      (Array.isArray(spec.sessions) ? spec.sessions : []).forEach(function each(session) {
        const book = session && bookMap.get(session.bookId);
        const value = Math.max(0, Number(session && session.seconds) || 0);
        if (!book || value <= 0) return;
        if (monthKeyOf(Number(session.startedAt) || 0) !== month) return;
        perBook.set(book.id, (perBook.get(book.id) || 0) + value);
      });
      const topBooks = Array.from(perBook.keys()).map(function row(id) {
        const book = bookMap.get(id);
        return {
          bookId: id,
          title: book.title || '',
          author: book.author || '',
          seconds: perBook.get(id),
        };
      }).sort(function order(a, b) {
        if (b.seconds !== a.seconds) return b.seconds - a.seconds;
        return String(a.title).localeCompare(String(b.title), 'zh-Hans');
      }).slice(0, 3);

      const monthNotes = (Array.isArray(spec.highlights) ? spec.highlights : []).filter(function mine(note) {
        return note && monthKeyOf(Number(note.createdAt) || 0) === month;
      }).sort(function latest(a, b) { return (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0); });
      let quote = null;
      const withText = monthNotes.find(function text(note) { return String(note.text || '').trim(); });
      if (withText) {
        const trimmed = quoteCardText(withText.text, 84);
        const book = bookMap.get(withText.bookId);
        const chapter = book && Array.isArray(book.chapters) ? book.chapters[withText.chapterIndex] : null;
        quote = {
          text: trimmed.text,
          bookTitle: book ? book.title : '',
          chapterTitle: chapter ? chapter.title : '',
        };
      }

      return {
        month: month,
        year: Number(month.slice(0, 4)) || 0,
        monthNumber: Number(month.slice(5, 7)) || 1,
        seconds: seconds,
        activeDays: activeDays,
        bookCount: perBook.size,
        topBooks: topBooks,
        bestDay: bestDay,
        quote: quote,
        noteCount: monthNotes.length,
      };
    }

    function coverFor(book) {
      return book.cover || LOCAL_COVERS[0];
    }

    // Round 49: Privacy-first Zero-PII reader telemetry contract
    function emitReaderTelemetry(eventName, eventData) {
      const allowedEvents = ['render_latency', 'reflow', 'theme_change', 'session_tick', 'notes_export'];
      if (!allowedEvents.includes(eventName)) return null;
      const data = eventData && typeof eventData === 'object' ? eventData : {};
      return {
        event: eventName,
        timestamp: Date.now(),
        themeId: typeof data.themeId === 'string' ? data.themeId : undefined,
        durationMs: typeof data.durationMs === 'number' ? Math.round(data.durationMs) : undefined,
        pageCount: typeof data.pageCount === 'number' ? data.pageCount : undefined,
      };
    }
