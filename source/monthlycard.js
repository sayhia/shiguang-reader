    const MONTH_CARD_WIDTH = QUOTE_CARD_WIDTH;
    const MONTH_CARD_HEIGHT = QUOTE_CARD_HEIGHT;
    const MONTH_CARD_PADDING = QUOTE_CARD_PADDING;
    const MONTH_CARD_STAT_CENTERS = [244, 540, 836];
    const MONTH_CARD_BOOK_ROWS = [706, 760, 814];
    const MONTH_CARD_QUOTE_TOP = 988;
    const MONTH_CARD_QUOTE_LINE = 56;
    const MONTH_CARD_QUOTE_SIZE = 34;
    const MONTH_CARD_QUOTE_WIDTH = MONTH_CARD_WIDTH - MONTH_CARD_PADDING * 2;

    // Positions for the whole card, so drawing and tests share one source of truth.
    function monthlyCardLayout(spec, measure) {
      const card = spec || {};
      const stats = (Array.isArray(card.stats) ? card.stats : []).slice(0, 3).map(function row(item, index) {
        return {
          x: MONTH_CARD_STAT_CENTERS[index] || MONTH_CARD_STAT_CENTERS[MONTH_CARD_STAT_CENTERS.length - 1],
          value: String((item && item.value) || ''),
          unit: String((item && item.unit) || ''),
          label: String((item && item.label) || ''),
        };
      });
      const books = (Array.isArray(card.books) ? card.books : []).slice(0, 3).map(function row(item, index) {
        return {
          y: MONTH_CARD_BOOK_ROWS[index],
          rank: String(index + 1).padStart(2, '0'),
          title: String((item && item.title) || ''),
          meta: String((item && item.value) || ''),
        };
      });
      const quoteSource = String(card.quote || '').trim();
      let quoteBlock = { lines: [], size: MONTH_CARD_QUOTE_SIZE, lineHeight: MONTH_CARD_QUOTE_LINE, top: MONTH_CARD_QUOTE_TOP };
      if (quoteSource) {
        const candidates = [42, 38, 34];
        for (let index = 0; index < candidates.length; index += 1) {
          const size = candidates[index];
          const lineHeight = Math.round(size * 1.6);
          const lines = wrapQuoteText(quoteSource, MONTH_CARD_QUOTE_WIDTH, function metric(value) {
            return measure(value, size);
          });
          if (lines.length <= 3) {
            quoteBlock = { lines: lines, size: size, lineHeight: lineHeight, top: MONTH_CARD_QUOTE_TOP };
            break;
          }
          if (index === candidates.length - 1) {
            // Cut to three lines and say so: the last line ends in an ellipsis that fits.
            const kept = lines.slice(0, 3);
            const tail = Array.from(kept[2]);
            const trimTail = function trimTail() { return tail.join('').replace(/[\s，。、；：,.;:…]+$/, ''); };
            while (tail.length > 1 && measure(trimTail() + '…', size) > MONTH_CARD_QUOTE_WIDTH) tail.pop();
            kept[2] = trimTail() + '…';
            quoteBlock = { lines: kept, size: size, lineHeight: lineHeight, top: MONTH_CARD_QUOTE_TOP };
          }
        }
      }
      const quoteHeight = quoteBlock.lines.length ? (quoteBlock.lines.length - 1) * quoteBlock.lineHeight : 0;
      return {
        theme: quoteCardTheme(card.theme),
        stats: stats,
        books: books,
        quote: quoteBlock,
        quoteBookY: quoteBlock.lines.length ? MONTH_CARD_QUOTE_TOP + quoteHeight + 60 : 0,
        hasQuote: quoteBlock.lines.length > 0,
      };
    }

    function drawMonthlyCard(ctx, spec) {
      if (!ctx) return null;
      const width = MONTH_CARD_WIDTH;
      const height = MONTH_CARD_HEIGHT;
      const card = spec || {};
      const measure = function measureText(value, size) {
        ctx.font = '500 ' + size + 'px ' + SERIF_FONT;
        return ctx.measureText(value).width;
      };
      const layout = monthlyCardLayout(card, measure);
      const theme = layout.theme;

      ctx.save();
      ctx.clearRect(0, 0, width, height);
      paintCardBackground(ctx, theme);
      paintCardHeader(ctx, theme, { brand: card.brand, date: card.date });

      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      // Kicker: small, letter-spaced, accent coloured.
      ctx.fillStyle = theme.accent;
      ctx.font = '500 22px ' + UI_FONT;
      setCanvasLetterSpacing(ctx, 4);
      ctx.fillText(String(card.kicker || ''), width / 2, 246);
      setCanvasLetterSpacing(ctx, 0);

      // Big month title.
      ctx.fillStyle = theme.ink;
      ctx.font = '600 64px ' + SERIF_FONT;
      setCanvasLetterSpacing(ctx, 3);
      ctx.fillText(fitCanvasLine(ctx, String(card.monthLabel || ''), 820), width / 2, 330);
      setCanvasLetterSpacing(ctx, 0);

      // Three headline numbers.
      layout.stats.forEach(function each(item) {
        ctx.fillStyle = theme.ink;
        ctx.font = '600 54px ' + SERIF_FONT;
        setCanvasLetterSpacing(ctx, 1);
        const label = item.unit ? item.value + item.unit : item.value;
        const widthLimit = 250;
        ctx.fillText(fitCanvasLine(ctx, label, widthLimit), item.x, 458);
        setCanvasLetterSpacing(ctx, 0);
        ctx.fillStyle = theme.muted;
        ctx.font = '400 21px ' + UI_FONT;
        setCanvasLetterSpacing(ctx, 2);
        ctx.fillText(item.label, item.x, 514);
        setCanvasLetterSpacing(ctx, 0);
      });

      ctx.strokeStyle = theme.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(MONTH_CARD_PADDING, 592);
      ctx.lineTo(width - MONTH_CARD_PADDING, 592);
      ctx.stroke();

      // Most-read books.
      ctx.fillStyle = theme.muted;
      ctx.font = '500 20px ' + UI_FONT;
      setCanvasLetterSpacing(ctx, 3);
      ctx.fillText(String(card.booksLabel || ''), width / 2, 648);
      setCanvasLetterSpacing(ctx, 0);

      if (layout.books.length) {
        layout.books.forEach(function each(item) {
          ctx.textAlign = 'left';
          ctx.fillStyle = theme.accent;
          ctx.globalAlpha = 0.72;
          ctx.font = '500 20px ' + UI_FONT;
          ctx.fillText(item.rank, MONTH_CARD_PADDING, item.y);
          ctx.globalAlpha = 1;

          ctx.fillStyle = theme.ink;
          ctx.font = '500 30px ' + SERIF_FONT;
          ctx.fillText(fitCanvasLine(ctx, item.title, 560), MONTH_CARD_PADDING + 56, item.y);

          ctx.textAlign = 'right';
          ctx.fillStyle = theme.muted;
          ctx.font = '400 21px ' + UI_FONT;
          ctx.fillText(item.meta, width - MONTH_CARD_PADDING, item.y);
          ctx.textAlign = 'center';
        });
      } else if (card.booksEmpty) {
        ctx.fillStyle = theme.muted;
        ctx.font = '400 24px ' + SERIF_FONT;
        ctx.fillText(String(card.booksEmpty), width / 2, MONTH_CARD_BOOK_ROWS[1]);
      }

      if (card.bestDay) {
        ctx.fillStyle = theme.muted;
        ctx.font = '400 22px ' + UI_FONT;
        setCanvasLetterSpacing(ctx, 1);
        ctx.fillText(String(card.bestDayLabel || '') + ' ' + String(card.bestDay), width / 2, 876);
        setCanvasLetterSpacing(ctx, 0);
      }

      // Signature excerpt from this month.
      if (layout.hasQuote) {
        ctx.fillStyle = theme.muted;
        ctx.font = '500 20px ' + UI_FONT;
        setCanvasLetterSpacing(ctx, 3);
        ctx.fillText(String(card.quoteLabel || ''), width / 2, 930);
        setCanvasLetterSpacing(ctx, 0);

        ctx.fillStyle = theme.accent;
        ctx.globalAlpha = 0.24;
        ctx.font = '600 76px ' + SERIF_FONT;
        ctx.fillText('“', width / 2, MONTH_CARD_QUOTE_TOP - 46);
        ctx.globalAlpha = 1;

        ctx.fillStyle = theme.ink;
        ctx.font = '500 ' + layout.quote.size + 'px ' + SERIF_FONT;
        setCanvasLetterSpacing(ctx, 1.4);
        layout.quote.lines.forEach(function line(text, index) {
          if (!text) return;
          ctx.fillText(text, width / 2, layout.quote.top + index * layout.quote.lineHeight);
        });
        setCanvasLetterSpacing(ctx, 0);

        if (card.quoteBook) {
          ctx.fillStyle = theme.muted;
          ctx.font = '400 22px ' + UI_FONT;
          setCanvasLetterSpacing(ctx, 1);
          ctx.fillText('—— ' + String(card.quoteBook), width / 2, layout.quoteBookY);
          setCanvasLetterSpacing(ctx, 0);
        }
      } else if (card.noQuote) {
        ctx.fillStyle = theme.muted;
        ctx.font = '400 26px ' + SERIF_FONT;
        setCanvasLetterSpacing(ctx, 1);
        ctx.fillText(String(card.noQuote), width / 2, 1064);
        setCanvasLetterSpacing(ctx, 0);
      }

      // Footer.
      const footLine = height - 112;
      ctx.strokeStyle = theme.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(MONTH_CARD_PADDING, footLine);
      ctx.lineTo(width - MONTH_CARD_PADDING, footLine);
      ctx.stroke();

      ctx.fillStyle = theme.muted;
      ctx.font = '400 21px ' + UI_FONT;
      setCanvasLetterSpacing(ctx, 2);
      ctx.fillText(String(card.footer || ''), width / 2, footLine + 44);
      setCanvasLetterSpacing(ctx, 0);

      ctx.restore();
      return layout;
    }

    function monthlyCardFilename(month) {
      const base = String(month || dayKey()).replace(/[^0-9-]+/g, '-').replace(/^-+|-+$/g, '');
      return 'shiguang-month-' + (base || dayKey()) + '.png';
    }

    function MonthlyCardDialog(props) {
      const t = props.t;
      const [theme, setTheme] = useState(props.theme || 'paper');
      const [busy, setBusy] = useState(false);
      const canvasRef = useRef(null);
      const summary = props.summary || {};

      const spec = useMemo(function cardSpec() {
        const monthLabel = fill(t('monthHeading'), { y: summary.year, m: summary.monthNumber });
        return {
          theme: theme,
          brand: props.brand || t('brand'),
          date: props.date || fullDateLabel(),
          kicker: t('monthCardKicker'),
          monthLabel: monthLabel,
          stats: [
            {
              value: formatDuration(summary.seconds || 0, t).replace(/\s/g, ''),
              unit: '',
              label: t('monthCardTime'),
            },
            { value: String(summary.activeDays || 0), unit: t('monthCardDayUnit'), label: t('monthCardDays') },
            { value: String(summary.bookCount || 0), unit: t('monthCardBookUnit'), label: t('monthCardBooks') },
          ],
          booksLabel: t('monthCardTopBooks'),
          books: (summary.topBooks || []).map(function row(item) {
            return { title: item.title, value: formatDuration(item.seconds, t) };
          }),
          booksEmpty: t('monthCardNoBooks'),
          bestDayLabel: t('monthCardBestDay'),
          bestDay: summary.bestDay
            ? fill(t('monthDayLabel'), { m: summary.monthNumber, d: summary.bestDay.day }) + ' · ' + formatDuration(summary.bestDay.seconds, t)
            : '',
          quoteLabel: t('monthCardQuote'),
          quote: summary.quote ? summary.quote.text : '',
          quoteBook: summary.quote
            ? (summary.quote.bookTitle + (summary.quote.chapterTitle ? ' · ' + summary.quote.chapterTitle : ''))
            : '',
          noQuote: t('monthCardNoQuote'),
          footer: t('brand') + ' · ' + monthLabel,
        };
      }, [summary, theme, t, props.brand, props.date]);

      useEffect(function paintCard() {
        const canvas = canvasRef.current;
        if (!canvas || typeof canvas.getContext !== 'function') return;
        try {
          canvas.width = MONTH_CARD_WIDTH;
          canvas.height = MONTH_CARD_HEIGHT;
          drawMonthlyCard(canvas.getContext('2d'), spec);
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
        const ok = downloadCanvasPng(canvasRef.current, monthlyCardFilename(summary.month));
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

      const monthLabel = fill(t('monthHeading'), { y: summary.year, m: summary.monthNumber });

      return h('div', {
        className: 'sr-card-backdrop',
        onMouseDown: function backdrop(event) { if (event.target === event.currentTarget) props.onClose(); },
      },
        h('div', { className: 'sr-card-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('monthCardTitle') },
          h('div', { className: 'sr-card-head' },
            h('div', null,
              h('h2', null, t('monthCardTitle')),
              h('p', null, monthLabel + ' · ' + t('monthCardSubtitle')),
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
            h('canvas', { ref: canvasRef, className: 'sr-card-canvas', role: 'img', 'aria-label': t('monthCardTitle') }),
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
