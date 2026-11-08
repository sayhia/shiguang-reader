    const QUOTE_CARD_WIDTH = 1080;
    const QUOTE_CARD_HEIGHT = 1350;
    const QUOTE_CARD_PADDING = 96;
    const QUOTE_CARD_TEXT_WIDTH = QUOTE_CARD_WIDTH - QUOTE_CARD_PADDING * 2;
    const QUOTE_CARD_MAX_CHARS = 300;
    const COLLECTION_MAX_ITEMS = 6;
    const COLLECTION_ITEM_MAX_CHARS = 90;

    const QUOTE_CARD_THEMES = [
      {
        id: 'paper',
        nameKey: 'cardThemePaper',
        bg: '#f5eddd',
        bgTo: '#ecdfc7',
        ink: '#332b20',
        muted: '#8a7860',
        accent: '#a4743f',
        line: 'rgba(94,73,48,0.22)',
        glow: 'rgba(255,255,255,0.6)',
      },
      {
        id: 'ink',
        nameKey: 'cardThemeInk',
        bg: '#181c1f',
        bgTo: '#22282c',
        ink: '#eae3d5',
        muted: '#96958b',
        accent: '#c8a46c',
        line: 'rgba(206,198,181,0.2)',
        glow: 'rgba(200,164,108,0.12)',
      },
      {
        id: 'celadon',
        nameKey: 'cardThemeCeladon',
        bg: '#e9f0e8',
        bgTo: '#dde8dc',
        ink: '#2b3a30',
        muted: '#6e8074',
        accent: '#5f7d5f',
        line: 'rgba(55,78,58,0.2)',
        glow: 'rgba(255,255,255,0.55)',
      },
      {
        id: 'sunset',
        nameKey: 'cardThemeSunset',
        bg: '#fbf3ea',
        bgTo: '#f5decc',
        ink: '#452b1a',
        muted: '#8f684c',
        accent: '#c96a3b',
        line: 'rgba(120,62,25,0.22)',
        glow: 'rgba(255,255,255,0.6)',
      },
      {
        id: 'forest',
        nameKey: 'cardThemeForest',
        bg: '#142019',
        bgTo: '#1e3025',
        ink: '#d2e5d7',
        muted: '#7e9c88',
        accent: '#62ab7e',
        line: 'rgba(195,214,204,0.2)',
        glow: 'rgba(98,171,126,0.15)',
      },
    ];

    const QUOTE_BREAK_BEFORE = '，。、；：？！）》」』”’…·,.;:?!)]}';

    function quoteCardTheme(id) {
      return QUOTE_CARD_THEMES.find(function find(item) { return item.id === id; }) || QUOTE_CARD_THEMES[0];
    }

    function quoteCardText(raw, limit) {
      const clean = String(raw || '')
        .replace(/\r/g, '')
        .split('\n')
        .map(function trim(line) { return line.replace(/[ \t]+$/, ''); })
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      const max = Math.max(8, Number(limit) || QUOTE_CARD_MAX_CHARS);
      if (clean.length <= max) return { text: clean, truncated: false };
      const cut = clean.slice(0, max).replace(/[\s，。、；：,.;:]+$/, '');
      return { text: cut + '…', truncated: true };
    }

    // CJK wraps between any two characters; Latin-script text wraps only at spaces, and a
    // wrapped line never starts with the space it broke at. A word wider than the whole
    // line still breaks per character, so every token always makes progress.
    function wrapQuoteText(text, maxWidth, measure) {
      const lines = [];
      const tokenPattern = /\s+|[\u2E80-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF\u{20000}-\u{3FFFF}]|[^\s\u2E80-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF\u{20000}-\u{3FFFF}]+/gu;
      String(text || '').split('\n').forEach(function paragraph(value) {
        const before = lines.length;
        const tokens = value.match(tokenPattern) || [];
        let line = '';
        function placeByChar(word) {
          Array.from(word).forEach(function add(ch) {
            if (!line || measure(line + ch) <= maxWidth) {
              line += ch;
              return;
            }
            lines.push(line);
            line = ch;
          });
        }
        tokens.forEach(function add(token) {
          if (/^\s+$/.test(token)) {
            if (line) line += token;
            return;
          }
          const next = line + token;
          if (line ? measure(next) <= maxWidth : measure(token) <= maxWidth) {
            line = next;
            return;
          }
          const hangs = Array.from(token).every(function punct(ch) { return QUOTE_BREAK_BEFORE.indexOf(ch) >= 0; });
          if (line && hangs) {
            lines.push(next);
            line = '';
            return;
          }
          const kept = line.replace(/\s+$/, '');
          if (kept) lines.push(kept);
          line = '';
          placeByChar(token);
        });
        line = line.replace(/\s+$/, '');
        if (line) lines.push(line);
        if (lines.length === before) lines.push('');
      });
      return lines;
    }

    function quoteCardLayout(spec, measure) {
      const source = quoteCardText(spec && spec.text, spec && spec.maxChars);
      const noteSource = spec && spec.note ? quoteCardText(spec.note, 140) : { text: '', truncated: false };
      const candidates = [52, 46, 41, 36, 32];
      const areaHeight = 560;
      let body = null;
      for (let index = 0; index < candidates.length; index += 1) {
        const size = candidates[index];
        const lineHeight = Math.round(size * 1.74);
        const lines = wrapQuoteText(source.text, QUOTE_CARD_TEXT_WIDTH, function metric(value) { return measure(value, size); });
        if (!lines.length) {
          body = { size: size, lineHeight: lineHeight, lines: [''] };
          break;
        }
        if (lines.length * lineHeight <= areaHeight) {
          body = { size: size, lineHeight: lineHeight, lines: lines };
          break;
        }
      }
      if (!body) {
        const size = candidates[candidates.length - 1];
        const lineHeight = Math.round(size * 1.74);
        const maxLines = Math.max(1, Math.floor(areaHeight / lineHeight));
        const lines = wrapQuoteText(source.text, QUOTE_CARD_TEXT_WIDTH, function metric(value) { return measure(value, size); }).slice(0, maxLines);
        body = { size: size, lineHeight: lineHeight, lines: lines };
      }
      const noteSize = 25;
      const noteLineHeight = 44;
      const noteAll = noteSource.text
        ? wrapQuoteText(noteSource.text, 720, function metric(value) { return measure(value, noteSize); })
        : [];
      const noteTruncated = noteAll.length > 4;
      const noteLines = noteTruncated ? noteAll.slice(0, 3).concat(['…']) : noteAll;
      const quoteHeight = body.lines.length * body.lineHeight;
      const noteHeight = noteLines.length ? 52 + noteLines.length * noteLineHeight : 0;
      const total = quoteHeight + noteHeight;
      const areaTop = 200;
      const areaBottom = 1108;
      const quoteTop = Math.round(areaTop + Math.max(0, (areaBottom - areaTop - total) / 2));
      const dividerY = quoteTop + quoteHeight + 30;
      const noteTop = dividerY + 48;
      return {
        theme: quoteCardTheme(spec && spec.theme),
        quote: { size: body.size, lineHeight: body.lineHeight, lines: body.lines },
        note: { size: noteSize, lineHeight: noteLineHeight, lines: noteLines, truncated: noteTruncated },
        quoteTop: quoteTop,
        quoteHeight: quoteHeight,
        dividerY: dividerY,
        noteTop: noteTop,
        truncated: source.truncated,
      };
    }

    function setCanvasLetterSpacing(ctx, value) {
      try {
        ctx.letterSpacing = value + 'px';
      } catch (error) {
        /* Older canvas implementations ignore letter spacing. */
      }
    }

    function fitCanvasLine(ctx, text, maxWidth) {
      const value = String(text || '');
      if (!value || ctx.measureText(value).width <= maxWidth) return value;
      const chars = Array.from(value);
      let out = '';
      for (let index = 0; index < chars.length; index += 1) {
        const next = out + chars[index];
        if (ctx.measureText(next + '…').width > maxWidth) break;
        out = next;
      }
      return (out || chars[0] || '') + '…';
    }

    function drawQuoteCard(ctx, spec) {
      if (!ctx) return null;
      const width = QUOTE_CARD_WIDTH;
      const height = QUOTE_CARD_HEIGHT;
      const measure = function measureText(value, size) {
        ctx.font = '500 ' + size + 'px ' + SERIF_FONT;
        return ctx.measureText(value).width;
      };
      const layout = quoteCardLayout(spec, measure);
      const theme = layout.theme;
      const brand = String((spec && spec.brand) || '拾光阅读');
      const date = String((spec && spec.date) || '');
      const bookTitle = String((spec && spec.bookTitle) || '');
      const chapterTitle = String((spec && spec.chapterTitle) || '');

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      const background = ctx.createLinearGradient(0, 0, width * 0.7, height);
      background.addColorStop(0, theme.bg);
      background.addColorStop(1, theme.bgTo);
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(width / 2, height * 0.1, 30, width / 2, height * 0.1, height * 0.95);
      glow.addColorStop(0, theme.glow);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = theme.line;
      ctx.lineWidth = 2;
      ctx.strokeRect(46, 46, width - 92, height - 92);

      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillStyle = theme.muted;
      ctx.font = '500 21px ' + UI_FONT;
      setCanvasLetterSpacing(ctx, 3);
      ctx.fillText(brand, QUOTE_CARD_PADDING, 116);
      if (date) {
        ctx.textAlign = 'right';
        ctx.font = '400 20px ' + UI_FONT;
        setCanvasLetterSpacing(ctx, 1);
        ctx.fillText(date, width - QUOTE_CARD_PADDING, 116);
      }
      ctx.textAlign = 'left';
      setCanvasLetterSpacing(ctx, 0);

      ctx.strokeStyle = theme.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(QUOTE_CARD_PADDING, 166);
      ctx.lineTo(width - QUOTE_CARD_PADDING, 166);
      ctx.stroke();
      ctx.strokeStyle = theme.accent;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 28, 166);
      ctx.lineTo(width / 2 + 28, 166);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.textAlign = 'center';
      ctx.fillStyle = theme.accent;
      ctx.globalAlpha = 0.24;
      ctx.font = '600 88px ' + SERIF_FONT;
      ctx.fillText('“', width / 2, layout.quoteTop - 52);
      ctx.globalAlpha = 1;

      ctx.fillStyle = theme.ink;
      ctx.font = '500 ' + layout.quote.size + 'px ' + SERIF_FONT;
      setCanvasLetterSpacing(ctx, 1.5);
      const startY = layout.quoteTop + layout.quote.lineHeight / 2;
      layout.quote.lines.forEach(function line(text, index) {
        if (!text) return;
        ctx.fillText(text, width / 2, startY + index * layout.quote.lineHeight);
      });
      setCanvasLetterSpacing(ctx, 0);

      ctx.strokeStyle = theme.accent;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 26, layout.dividerY);
      ctx.lineTo(width / 2 + 26, layout.dividerY);
      ctx.stroke();
      ctx.globalAlpha = 1;

      if (layout.note.lines.length) {
        ctx.fillStyle = theme.muted;
        ctx.font = '400 ' + layout.note.size + 'px ' + UI_FONT;
        setCanvasLetterSpacing(ctx, 0.6);
        layout.note.lines.forEach(function line(text, index) {
          if (!text) return;
          ctx.fillText(text, width / 2, layout.noteTop + index * layout.note.lineHeight);
        });
        setCanvasLetterSpacing(ctx, 0);
      }

      const footLine = height - 214;
      ctx.strokeStyle = theme.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(QUOTE_CARD_PADDING, footLine);
      ctx.lineTo(width - QUOTE_CARD_PADDING, footLine);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = theme.ink;
      ctx.font = '600 30px ' + SERIF_FONT;
      setCanvasLetterSpacing(ctx, 1);
      ctx.fillText(fitCanvasLine(ctx, bookTitle, 720), width / 2, footLine + 66);
      setCanvasLetterSpacing(ctx, 0);
      if (chapterTitle) {
        ctx.fillStyle = theme.muted;
        ctx.font = '400 21px ' + UI_FONT;
        setCanvasLetterSpacing(ctx, 0.8);
        ctx.fillText(fitCanvasLine(ctx, chapterTitle, 700), width / 2, footLine + 112);
        setCanvasLetterSpacing(ctx, 0);
      }
      ctx.fillStyle = theme.muted;
      ctx.font = '400 17px ' + UI_FONT;
      setCanvasLetterSpacing(ctx, 2);
      ctx.fillText(brand + (date ? '  ·  ' + date : ''), width / 2, footLine + 148);
      setCanvasLetterSpacing(ctx, 0);
      ctx.restore();
      return layout;
    }

    function paintCardBackground(ctx, theme) {
      const width = QUOTE_CARD_WIDTH;
      const height = QUOTE_CARD_HEIGHT;
      const background = ctx.createLinearGradient(0, 0, width * 0.7, height);
      background.addColorStop(0, theme.bg);
      background.addColorStop(1, theme.bgTo);
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(width / 2, height * 0.1, 30, width / 2, height * 0.1, height * 0.95);
      glow.addColorStop(0, theme.glow);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = theme.line;
      ctx.lineWidth = 2;
      ctx.strokeRect(46, 46, width - 92, height - 92);
    }

    function paintCardHeader(ctx, theme, spec) {
      const brand = String((spec && spec.brand) || '拾光阅读');
      const date = String((spec && spec.date) || '');
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillStyle = theme.muted;
      ctx.font = '500 21px ' + UI_FONT;
      setCanvasLetterSpacing(ctx, 3);
      ctx.fillText(brand, QUOTE_CARD_PADDING, 116);
      if (date) {
        ctx.textAlign = 'right';
        ctx.font = '400 20px ' + UI_FONT;
        setCanvasLetterSpacing(ctx, 1);
        ctx.fillText(date, QUOTE_CARD_WIDTH - QUOTE_CARD_PADDING, 116);
      }
      ctx.textAlign = 'left';
      setCanvasLetterSpacing(ctx, 0);

      ctx.strokeStyle = theme.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(QUOTE_CARD_PADDING, 166);
      ctx.lineTo(QUOTE_CARD_WIDTH - QUOTE_CARD_PADDING, 166);
      ctx.stroke();
      ctx.strokeStyle = theme.accent;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(QUOTE_CARD_WIDTH / 2 - 28, 166);
      ctx.lineTo(QUOTE_CARD_WIDTH / 2 + 28, 166);
      ctx.stroke();
      ctx.globalAlpha = 1;
      return { brand: brand, date: date };
    }

    function collectionCardLayout(spec, measure) {
      const list = Array.isArray(spec && spec.items) ? spec.items : [];
      const cleaned = list
        .map(function clean(value) {
          const raw = typeof value === 'string' ? value : (value && value.text) || '';
          return quoteCardText(raw, spec && spec.itemMaxChars ? spec.itemMaxChars : COLLECTION_ITEM_MAX_CHARS);
        })
        .filter(function has(item) { return Boolean(item.text); });
      const items = cleaned.slice(0, COLLECTION_MAX_ITEMS);
      const dropped = Math.max(0, list.length - items.length);
      const theme = quoteCardTheme(spec && spec.theme);
      const areaTop = 362;
      const areaBottom = 1152;
      const available = areaBottom - areaTop;
      const textWidth = QUOTE_CARD_WIDTH - QUOTE_CARD_PADDING * 2 - 34;
      const sizes = items.length <= 3 ? [52, 46, 40, 34, 28, 22] : [42, 38, 34, 30, 26, 22];

      function build(size) {
        const lineHeight = Math.round(size * 1.62);
        const gap = Math.round(size * 1.2);
        const blocks = items.map(function block(item) {
          const lines = wrapQuoteText(item.text, textWidth, function metric(value) { return measure(value, size); });
          const capped = lines.slice(0, 3);
          if (lines.length > 3 && capped.length) {
            const last = capped[capped.length - 1];
            const chars = Array.from(last);
            capped[capped.length - 1] = chars.slice(0, Math.max(1, chars.length - 1)).join('') + '…';
          }
          return {
            lines: capped,
            height: Math.max(lineHeight, capped.length * lineHeight),
            truncated: lines.length > 3 || item.truncated,
          };
        });
        const total = blocks.reduce(function sum(acc, item) { return acc + item.height; }, 0) + gap * Math.max(0, blocks.length - 1);
        return { size: size, lineHeight: lineHeight, gap: gap, blocks: blocks, total: total };
      }

      let chosen = null;
      for (let index = 0; index < sizes.length; index += 1) {
        const candidate = build(sizes[index]);
        if (candidate.total <= available) {
          chosen = candidate;
          break;
        }
      }
      if (!chosen) chosen = build(sizes[sizes.length - 1]);

      let blocks = chosen.blocks;
      let total = chosen.total;
      while (total > available && blocks.length > 1) {
        blocks = blocks.slice(0, blocks.length - 1);
        total = blocks.reduce(function sum(acc, item) { return acc + item.height; }, 0) + chosen.gap * Math.max(0, blocks.length - 1);
      }

      const top = Math.round(areaTop + Math.max(0, (available - total) / 2));
      return {
        theme: theme,
        items: blocks,
        count: blocks.length,
        size: chosen.size,
        lineHeight: chosen.lineHeight,
        gap: chosen.gap,
        top: top,
        total: total,
        dropped: dropped + Math.max(0, items.length - blocks.length),
        truncated: blocks.some(function truncated(item) { return item.truncated; }),
        titleTop: 232,
        captionTop: 292,
      };
    }

    function drawCollectionCard(ctx, spec) {
      if (!ctx) return null;
      const width = QUOTE_CARD_WIDTH;
      const height = QUOTE_CARD_HEIGHT;
      const measure = function measureText(value, size) {
        ctx.font = '500 ' + size + 'px ' + SERIF_FONT;
        return ctx.measureText(value).width;
      };
      const layout = collectionCardLayout(spec, measure);
      const theme = layout.theme;
      const title = String((spec && spec.title) || '');
      const caption = String((spec && spec.caption) || '');

      ctx.save();
      ctx.clearRect(0, 0, width, height);
      paintCardBackground(ctx, theme);
      const header = paintCardHeader(ctx, theme, spec);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = theme.ink;
      ctx.font = '600 44px ' + SERIF_FONT;
      setCanvasLetterSpacing(ctx, 1.2);
      ctx.fillText(fitCanvasLine(ctx, title, width - QUOTE_CARD_PADDING * 2), width / 2, layout.titleTop);
      setCanvasLetterSpacing(ctx, 0);
      if (caption) {
        ctx.fillStyle = theme.muted;
        ctx.font = '400 21px ' + UI_FONT;
        setCanvasLetterSpacing(ctx, 1.6);
        ctx.fillText(fitCanvasLine(ctx, caption, width - QUOTE_CARD_PADDING * 2), width / 2, layout.captionTop);
        setCanvasLetterSpacing(ctx, 0);
      }

      ctx.textAlign = 'left';
      let cursor = layout.top;
      layout.items.forEach(function block(item) {
        const barX = QUOTE_CARD_PADDING;
        ctx.strokeStyle = theme.accent;
        ctx.globalAlpha = 0.42;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(barX, cursor + 6);
        ctx.lineTo(barX, cursor + item.height - 8);
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.fillStyle = theme.ink;
        ctx.font = '500 ' + layout.size + 'px ' + SERIF_FONT;
        setCanvasLetterSpacing(ctx, 1);
        item.lines.forEach(function line(text, index) {
          if (!text) return;
          ctx.fillText(text, barX + 34, cursor + layout.lineHeight / 2 + index * layout.lineHeight);
        });
        setCanvasLetterSpacing(ctx, 0);
        cursor += item.height + layout.gap;
      });

      const footLine = height - 148;
      ctx.strokeStyle = theme.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(QUOTE_CARD_PADDING, footLine);
      ctx.lineTo(width - QUOTE_CARD_PADDING, footLine);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = theme.muted;
      ctx.font = '400 19px ' + UI_FONT;
      setCanvasLetterSpacing(ctx, 2.4);
      ctx.fillText(fitCanvasLine(ctx, header.brand, width - QUOTE_CARD_PADDING * 2), width / 2, footLine + 46);
      setCanvasLetterSpacing(ctx, 0);
      ctx.restore();
      return layout;
    }

    function quoteCollectionFilename(title) {
      const base = String(title || 'collection')
        .replace(/[\\/:*?"<>|\s]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
      return 'shiguang-excerpts-' + (base || 'collection') + '-' + dayKey() + '.png';
    }

    function quoteCardFilename(bookTitle) {
      const base = String(bookTitle || 'quote')
        .replace(/[\\/:*?"<>|\s]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
      return 'shiguang-quote-' + (base || 'quote') + '-' + dayKey() + '.png';
    }

    function downloadCanvasPng(canvas, filename) {
      if (!canvas || typeof canvas.toDataURL !== 'function') return false;
      try {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        link.remove();
        return true;
      } catch (error) {
        return false;
      }
    }

    function copyCanvasToClipboard(canvas) {
      if (!canvas || typeof canvas.toBlob !== 'function') return Promise.resolve(false);
      if (typeof navigator === 'undefined' || !navigator.clipboard || typeof navigator.clipboard.write !== 'function') return Promise.resolve(false);
      if (typeof ClipboardItem === 'undefined') return Promise.resolve(false);
      const blobPromise = new Promise(function wait(resolve) {
        try {
          canvas.toBlob(function done(blob) { resolve(blob || null); }, 'image/png');
        } catch (error) {
          resolve(null);
        }
      });
      return blobPromise.then(function write(blob) {
        if (!blob) return false;
        try {
          return navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(function ok() { return true; }, function fail() { return false; });
        } catch (error) {
          return false;
        }
      });
    }

    function QuoteCardDialog(props) {
      const t = props.t;
      const [theme, setTheme] = useState(props.theme || 'paper');
      const [showNote, setShowNote] = useState(Boolean(props.note));
      const [busy, setBusy] = useState(false);
      const canvasRef = useRef(null);

      const spec = useMemo(function cardSpec() {
        return {
          text: props.text,
          note: showNote ? props.note : '',
          bookTitle: props.bookTitle,
          chapterTitle: props.chapterTitle,
          date: props.date || fullDateLabel(),
          brand: props.brand || t('brand'),
          theme: theme,
        };
      }, [props.text, props.note, props.bookTitle, props.chapterTitle, props.date, showNote, theme, t]);

      useEffect(function paintCard() {
        const canvas = canvasRef.current;
        if (!canvas || typeof canvas.getContext !== 'function') return;
        try {
          canvas.width = QUOTE_CARD_WIDTH;
          canvas.height = QUOTE_CARD_HEIGHT;
          drawQuoteCard(canvas.getContext('2d'), spec);
        } catch (error) {
          /* Canvas may be unavailable; keep the dialog usable. */
        }
      }, [spec]);

      useEffect(function closeOnEscape() {
        function onKey(event) {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          event.stopPropagation();
          props.onClose();
        }
        document.addEventListener('keydown', onKey, true);
        return function cleanup() { document.removeEventListener('keydown', onKey, true); };
      }, [props.onClose]);

      function saveImage() {
        const ok = downloadCanvasPng(canvasRef.current, quoteCardFilename(props.bookTitle));
        if (props.showToast) props.showToast(ok ? t('imageDownloaded') : t('imageSaveFailed'));
        return ok;
      }

      function copyImage() {
        if (busy) return;
        setBusy(true);
        copyCanvasToClipboard(canvasRef.current).then(function done(ok) {
          setBusy(false);
          if (ok) {
            if (props.showToast) props.showToast(t('imageCopied'));
            return;
          }
          saveImage();
        });
      }

      return h('div', {
        className: 'sr-card-backdrop',
        onMouseDown: function backdrop(event) { if (event.target === event.currentTarget) props.onClose(); },
      },
        h('div', { className: 'sr-card-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('quoteCard') },
          h('div', { className: 'sr-card-head' },
            h('div', null,
              h('h2', null, t('quoteCard')),
              h('p', null, (props.bookTitle || '') + (props.chapterTitle ? ' · ' + props.chapterTitle : '')),
            ),
            h('button', {
              type: 'button',
              className: 'sr-icon-btn',
              onClick: props.onClose,
              title: t('close'),
              'aria-label': t('close'),
            }, h(Icon, { name: 'close', size: 15 })),
          ),
          h('div', { className: 'sr-card-stage' },
            h('canvas', { ref: canvasRef, className: 'sr-card-canvas', role: 'img', 'aria-label': t('quoteCard') }),
          ),
          h('div', { className: 'sr-card-controls' },
            h('div', { className: 'sr-card-themes', role: 'group', 'aria-label': t('cardTheme') },
              QUOTE_CARD_THEMES.map(function swatch(item) {
                return h('button', {
                  key: item.id,
                  type: 'button',
                  className: 'sr-card-theme',
                  'data-theme': item.id,
                  'aria-pressed': theme === item.id,
                  title: t(item.nameKey),
                  onClick: function pick() { setTheme(item.id); },
                },
                  h('span', { className: 'sr-card-theme-dot' }),
                  h('span', null, t(item.nameKey)),
                );
              }),
            ),
            props.note ? h('label', { className: 'sr-card-toggle' },
              h('input', {
                type: 'checkbox',
                checked: showNote,
                onChange: function change(event) { setShowNote(event.target.checked); },
              }),
              h('span', null, t('cardWithNote')),
            ) : null,
          ),
          h('div', { className: 'sr-card-actions' },
            h('button', {
              type: 'button',
              className: 'sr-btn',
              disabled: busy,
              onClick: copyImage,
              title: t('copyImage'),
            }, h(Icon, { name: 'copy', size: 13 }), h('span', null, t('copyImage'))),
            h('button', {
              type: 'button',
              className: 'sr-btn sr-btn-primary',
              onClick: saveImage,
              title: t('downloadImage'),
            }, h(Icon, { name: 'download', size: 13 }), h('span', null, t('downloadImage'))),
            h('button', { type: 'button', className: 'sr-btn', onClick: props.onClose }, t('close')),
          ),
        ),
      );
    }

    function QuoteCollectionDialog(props) {
      const t = props.t;
      const [theme, setTheme] = useState(props.theme || 'paper');
      const [busy, setBusy] = useState(false);
      const canvasRef = useRef(null);

      const spec = useMemo(function cardSpec() {
        return {
          items: props.items || [],
          title: props.title,
          caption: props.caption,
          date: props.date || fullDateLabel(),
          brand: props.brand || t('brand'),
          theme: theme,
        };
      }, [props.items, props.title, props.caption, props.date, theme, t]);

      useEffect(function paintCard() {
        const canvas = canvasRef.current;
        if (!canvas || typeof canvas.getContext !== 'function') return;
        try {
          canvas.width = QUOTE_CARD_WIDTH;
          canvas.height = QUOTE_CARD_HEIGHT;
          drawCollectionCard(canvas.getContext('2d'), spec);
        } catch (error) {
          /* Canvas may be unavailable; keep the dialog usable. */
        }
      }, [spec]);

      useEffect(function closeOnEscape() {
        function onKey(event) {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          event.stopPropagation();
          props.onClose();
        }
        document.addEventListener('keydown', onKey, true);
        return function cleanup() { document.removeEventListener('keydown', onKey, true); };
      }, [props.onClose]);

      function saveImage() {
        const ok = downloadCanvasPng(canvasRef.current, quoteCollectionFilename(props.title));
        if (props.showToast) props.showToast(ok ? t('imageDownloaded') : t('imageSaveFailed'));
        return ok;
      }

      function copyImage() {
        if (busy) return;
        setBusy(true);
        copyCanvasToClipboard(canvasRef.current).then(function done(ok) {
          setBusy(false);
          if (ok) {
            if (props.showToast) props.showToast(t('imageCopied'));
            return;
          }
          saveImage();
        });
      }

      return h('div', {
        className: 'sr-card-backdrop',
        onMouseDown: function backdrop(event) { if (event.target === event.currentTarget) props.onClose(); },
      },
        h('div', { className: 'sr-card-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('quoteCollection') },
          h('div', { className: 'sr-card-head' },
            h('div', null,
              h('h2', null, t('quoteCollection')),
              h('p', null, (props.title || '') + (props.caption ? ' · ' + props.caption : '')),
            ),
            h('button', {
              type: 'button',
              className: 'sr-icon-btn',
              onClick: props.onClose,
              title: t('close'),
              'aria-label': t('close'),
            }, h(Icon, { name: 'close', size: 15 })),
          ),
          h('div', { className: 'sr-card-stage' },
            h('canvas', { ref: canvasRef, className: 'sr-card-canvas', role: 'img', 'aria-label': t('quoteCollection') }),
          ),
          h('div', { className: 'sr-card-controls' },
            h('div', { className: 'sr-card-themes', role: 'group', 'aria-label': t('cardTheme') },
              QUOTE_CARD_THEMES.map(function swatch(item) {
                return h('button', {
                  key: item.id,
                  type: 'button',
                  className: 'sr-card-theme',
                  'data-theme': item.id,
                  'aria-pressed': theme === item.id,
                  title: t(item.nameKey),
                  onClick: function pick() { setTheme(item.id); },
                },
                  h('span', { className: 'sr-card-theme-dot' }),
                  h('span', null, t(item.nameKey)),
                );
              }),
            ),
          ),
          h('div', { className: 'sr-card-actions' },
            h('button', {
              type: 'button',
              className: 'sr-btn',
              disabled: busy,
              onClick: copyImage,
              title: t('copyImage'),
            }, h(Icon, { name: 'copy', size: 13 }), h('span', null, t('copyImage'))),
            h('button', {
              type: 'button',
              className: 'sr-btn sr-btn-primary',
              onClick: saveImage,
              title: t('downloadImage'),
            }, h(Icon, { name: 'download', size: 13 }), h('span', null, t('downloadImage'))),
            h('button', { type: 'button', className: 'sr-btn', onClick: props.onClose }, t('close')),
          ),
        ),
      );
    }
