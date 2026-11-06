    // Reads the OS color scheme; degrades to "light" when matchMedia is unavailable.
    function readSystemDark() {
      if (typeof window === 'undefined' || !window.matchMedia) return false;
      try { return window.matchMedia('(prefers-color-scheme: dark)').matches === true; } catch (error) { return false; }
    }

    // The full-screen picture. Escape, the close button, or a click on the dark
    // area puts the page back; a click on the picture itself does not. A separate
    // function so the behaviour can be checked without a DOM renderer.
    function readerLightbox(zoom, t, onClose) {
      if (!zoom || !zoom.src) return null;
      return h('div', {
        className: 'sr-lightbox',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': zoom.alt || t('imageZoomHint'),
        onClick: onClose,
      },
        h('img', {
          className: 'sr-lightbox-img',
          src: zoom.src,
          alt: zoom.alt || '',
          onClick: function keep(event) { event.stopPropagation(); },
        }),
        zoom.alt ? h('p', { className: 'sr-lightbox-caption' }, zoom.alt) : null,
        h('button', {
          type: 'button',
          className: 'sr-lightbox-close',
          title: t('closePanel'),
          'aria-label': t('closePanel'),
          onClick: function close(event) { event.stopPropagation(); onClose(); },
        }, h(Icon, { name: 'close', size: 18 })),
      );
    }

    function Reader(props) {
      const t = props.t;
      const book = props.book || {};
      const chapters = Array.isArray(book.chapters) && book.chapters.length
        ? book.chapters
        : [{ id: 'empty-c1', title: book.title || '正文', paragraphs: [] }];
      const settings = props.settings || {};
      const initialIndex = clamp(Number(props.initialChapterIndex) || 0, 0, Math.max(0, chapters.length - 1));
      const initialPercent = clamp(Number(props.initialPercent) || 0, 0, 1);

      const [chapterIndex, setChapterIndex] = useState(initialIndex);
      const [page, setPage] = useState(0);
      const [pageCount, setPageCount] = useState(1);
      const [chrome, setChrome] = useState(true);
      const [drawer, setDrawer] = useState(null);
      const [notesTab, setNotesTab] = useState('highlights');
      const [searchQuery, setSearchQuery] = useState('');
      const [searchText, setSearchText] = useState('');
      const [searchCursor, setSearchCursor] = useState(-1);
      const [searchScope, setSearchScope] = useState('book');
      const [settingsOpen, setSettingsOpen] = useState(false);
      const [helpOpen, setHelpOpen] = useState(false);
      const [helpCategory, setHelpCategory] = useState('all');
      const [helpQuery, setHelpQuery] = useState('');
      const [box, setBox] = useState({ w: 0, h: 0 });
      const [fontTick, setFontTick] = useState(0);
      const [progressTick, setProgressTick] = useState(0);
      const [animate, setAnimate] = useState(false);
      const [toolbar, setToolbar] = useState(null);
      const [noteDraft, setNoteDraft] = useState(null);
      const [peek, setPeek] = useState(null);
      const [footnote, setFootnote] = useState(null);
      const [selectionColor, setSelectionColor] = useState(null);
      const activeSelectionColor = selectionColor || settings.highlightColor || 'amber';
      const [bookmarkDraft, setBookmarkDraft] = useState(null);
      const [tts, setTts] = useState({ status: 'idle', index: 0, total: 0, rate: clamp(Number(settings.speechRate) || 1, 0.5, 2), excerpt: '' });
      const [voices, setVoices] = useState([]);
      const [sleepMinutes, setSleepMinutes] = useState(0);
      const [isFullscreen, setIsFullscreen] = useState(false);
      const [clockText, setClockText] = useState(function initClock() {
        return formatClock(new Date());
      });
      useEffect(function updateClock() {
        function tick() { setClockText(formatClock(new Date())); }
        const timer = setInterval(tick, 20000);
        return function clear() { clearInterval(timer); };
      }, []);
      const [cardHighlight, setCardHighlight] = useState(null);
      const [tocOnlyNotes, setTocOnlyNotes] = useState(false);
      const [tocQuery, setTocQuery] = useState('');
      const [notesQuery, setNotesQuery] = useState('');
      const [notesColorFilter, setNotesColorFilter] = useState('all');
      const [timeMode, setTimeMode] = useState('chapterTime');
      const [fontQuickOpen, setFontQuickOpen] = useState(false);
      const [hoverScrub, setHoverScrub] = useState(null);
      const [fontHud, setFontHud] = useState(0);
      const [chapterHud, setChapterHud] = useState(null);
      const [pageJumpOpen, setPageJumpOpen] = useState(false);
      const [pageJumpDraft, setPageJumpDraft] = useState('');
      const [rulerOpen, setRulerOpen] = useState(Boolean(settings.readingRuler));
      const [rulerY, setRulerY] = useState(160);
      const [jumpReturn, setJumpReturn] = useState(null);
      // A picture in the page is often too small to actually read — a scan, a map,
      // a plate of calligraphy. Clicking one opens it full-screen.
      const [zoomImage, setZoomImage] = useState(null);
      const pageJumpInputRef = useRef(null);
      const [systemDark, setSystemDark] = useState(readSystemDark);
      const activeThemeId = resolveReaderTheme(settings.theme, systemDark);
      const currentTheme = READER_THEMES.find(function find(themeItem) { return themeItem.id === activeThemeId; }) || READER_THEMES[0];
      const sleepTimerRef = useRef(null);
      const fontHudTimerRef = useRef(null);
      const chapterHudTimerRef = useRef(null);
      const sessionStartRef = useRef(Date.now());
      const sessionSecondsRef = useRef(0);
      const sessionReportedRef = useRef(false);
      const chapterIndexRef = useRef(chapterIndex);
      const onSessionEndRef = useRef(props.onSessionEnd);
      chapterIndexRef.current = chapterIndex;
      onSessionEndRef.current = props.onSessionEnd;

      const readerRef = useRef(null);
      const stageRef = useRef(null);
      const columnsRef = useRef(null);
      const endRef = useRef(null);
      const boxRef = useRef({ w: 0, h: 0 });
      const pageRef = useRef(0);
      const countRef = useRef(1);
      const currentPercentRef = useRef(initialPercent);
      const pendingRef = useRef(initialPercent);
      const suppressClickRef = useRef(false);
      const suppressTimerRef = useRef(null);
      const readyRef = useRef(false);
      const pointerRef = useRef(null);
      const noteRef = useRef(null);
      const searchRef = useRef(null);
      const ttsRef = useRef({ active: false, paused: false, chunks: [], offsets: [], index: 0, chapterIndex: 0, lang: 'zh-CN', rate: 1, utterance: null });
      const autoSpeechRef = useRef(null);

      const chapter = (chapters.length ? chapters[clamp(chapterIndex, 0, Math.max(0, chapters.length - 1))] : null) || { id: '', title: '', paragraphs: [] };
      const offsets = useMemo(function offsetsMemo() { return chapterBaseOffsets(chapter); }, [chapter]);
      const chapterString = useMemo(function textMemo() { return chapterText(chapter); }, [chapter]);
      const chapterHighlights = useMemo(function highlightMemo() {
        return (props.highlights || [])
          .filter(function match(item) {
            return item.bookId === book.id && chapter && item.chapterId === chapter.id;
          })
          .sort(function order(a, b) { return a.start - b.start; });
      }, [props.highlights, book.id, chapter && chapter.id]);
      const bookmarksForBook = useMemo(function bookmarksMemo() {
        return props.bookmarks
          .filter(function match(item) { return item.bookId === book.id; })
          .sort(function order(a, b) { return b.createdAt - a.createdAt; });
      }, [props.bookmarks, book.id]);
      const bookHighlights = useMemo(function bookHighlightsMemo() {
        return props.highlights.filter(function match(item) { return item.bookId === book.id; });
      }, [props.highlights, book.id]);
      const gap = box.w && box.w < 700 ? 34 : 56;
      const pageW = box.w;
      const pageH = box.h;
      const step = pageW + gap;
      const progressPercentValue = pageCount <= 1 ? 0 : clamp(page / (pageCount - 1), 0, 1);
      const remainingMinutes = remainingReadingMinutes(chapterString, progressPercentValue);
      const remainingLabel = remainingMinutes ? fill(t('remainingMinutes'), { n: remainingMinutes }) : t('chapterAlmostDone');
      const overallBookPct = clamp(Math.round(((chapterIndex + progressPercentValue) / Math.max(1, chapters.length)) * 100), 0, 100);
      const currentBookmark = bookmarksForBook.find(function same(item) {
        return item.chapterIndex === chapterIndex && Math.abs(item.percent - progressPercentValue) < 0.035;
      });
      const peekHighlight = peek ? props.highlights.find(function find(item) { return item.id === peek.id; }) : null;
      const pageLabel = fill(t('pageOf'), { n: Math.min(page + 1, pageCount), m: pageCount });
      const searchResultAll = useMemo(function searchAllMemo() {
        return searchBookChapters(chapters, searchText, 80);
      }, [chapters, searchText]);
      const searchResultChapter = useMemo(function searchChapterMemo() {
        return searchBookChapters(chapters, searchText, 80, { chapterIndex: chapterIndex });
      }, [chapters, searchText, chapterIndex]);
      const searchResult = searchScope === 'chapter' ? searchResultChapter : searchResultAll;
      const quickKeywords = useMemo(function getKeywords() {
        const set = new Set();
        bookHighlights.forEach(function h(item) {
          const t = item.text.trim();
          if (t.length >= 2 && t.length <= 8) set.add(t);
        });
        chapters.forEach(function c(item) {
          const cleaned = item.title.replace(/^第?[0-9零一二三四五六七八九十百千]+[章节回卷集篇部话]?\s*/, '').trim();
          if (cleaned.length >= 2 && cleaned.length <= 6) set.add(cleaned);
        });
        return Array.from(set).slice(0, 8);
      }, [bookHighlights, chapters]);

      pageRef.current = page;
      countRef.current = pageCount;
      currentPercentRef.current = progressPercentValue;

      const dismissPopovers = useCallback(function dismiss() {
        setToolbar(null);
        setPeek(null);
        setFootnote(null);
        setFontQuickOpen(false);
        setPageJumpOpen(false);
      }, []);

      const showChapterHud = useCallback(function announce(chapIndex, chapTitle) {
        setChapterHud({ index: chapIndex, title: chapTitle });
        if (chapterHudTimerRef.current) window.clearTimeout(chapterHudTimerRef.current);
        chapterHudTimerRef.current = window.setTimeout(function hide() {
          chapterHudTimerRef.current = null;
          setChapterHud(null);
        }, 1500);
      }, []);

      const goChapter = useCallback(function go(index, mode, percent, keepDrawer) {
        if (index < 0 || index >= chapters.length) return;
        dismissPopovers();
        if (!keepDrawer) setDrawer(null);
        setSettingsOpen(false);
        if (mode !== 'start' && mode !== 'last') setChrome(true);
        const targetChapter = chapters[index];
        let target = mode === 'last' ? 'last' : mode === 'page' && typeof percent === 'number' ? { page: Math.round(percent) } : mode === 'anchor' && percent ? { anchorId: String(percent) } : typeof percent === 'number' ? clamp(percent, 0, 1) : 0;
        if (mode === 'resume') {
          target = chapterResumePercent(props.chapterMarks, targetChapter ? targetChapter.id : '');
        }
        if (index === chapterIndex) {
          if (target === 'last') setPage(Math.max(0, pageCount - 1));
          else if (mode === 'page' && typeof percent === 'number') setPage(clamp(Math.round(percent), 0, Math.max(0, pageCount - 1)));
          else if (mode === 'anchor' && percent && columnsRef.current) {
            let el = null;
            try { el = columnsRef.current.querySelector('#' + CSS.escape(String(percent))); } catch (e) {}
            if (el) {
              const containerRect = columnsRef.current.getBoundingClientRect();
              const elRect = el.getBoundingClientRect();
              const stepSize = pageW + gap;
              const actualLeft = (elRect.left - containerRect.left) + page * stepSize;
              setPage(clamp(Math.floor(actualLeft / stepSize), 0, Math.max(0, pageCount - 1)));
            }
          }
          else if (typeof target === 'number' && target > 0) setPage(Math.round(clamp(target, 0, 1) * Math.max(0, pageCount - 1)));
          else if (mode !== 'resume' || typeof percent === 'number') setPage(0);
          return;
        }
        showChapterHud(index, targetChapter ? targetChapter.title : '');
        pendingRef.current = target;
        readyRef.current = false;
        setAnimate(false);
        setPage(0);
        setChapterIndex(index);
      }, [chapterIndex, chapters, pageCount, dismissPopovers, props.chapterMarks, showChapterHud]);

      const audioCtxRef = useRef(null);
      const playPaperSound = useCallback(function playSound() {
        if (!settings.paperSound) return;
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (!AudioContext) return;
          if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
          const ctx = audioCtxRef.current;
          if (ctx.state === 'suspended') ctx.resume();
          const bufferSize = Math.floor(ctx.sampleRate * 0.042);
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
          }
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(650, ctx.currentTime);
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.045, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.042);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          noise.start();
        } catch (e) {
          /* audio unavailable or blocked */
        }
      }, [settings.paperSound]);

      const nextPage = useCallback(function next() {
        if (!pageW || !pageH) return;
        dismissPopovers();
        if (page < pageCount - 1) {
          playPaperSound();
          setPage(page + 1);
          return;
        }
        if (chapterIndex < chapters.length - 1) {
          playPaperSound();
          goChapter(chapterIndex + 1, 'start');
          return;
        }
        props.onFinish(book.id);
        props.showToast(t('readerFinished'));
      }, [book.id, chapterIndex, chapters.length, dismissPopovers, goChapter, page, pageCount, pageH, pageW, playPaperSound, props.onFinish, props.showToast, t]);

      const prevPage = useCallback(function previous() {
        if (!pageW || !pageH) return;
        dismissPopovers();
        if (page > 0) {
          playPaperSound();
          setPage(page - 1);
          return;
        }
        if (chapterIndex > 0) {
          playPaperSound();
          goChapter(chapterIndex - 1, 'last');
          return;
        }
        props.showToast(t('firstPage'));
      }, [chapterIndex, dismissPopovers, goChapter, page, pageH, pageW, playPaperSound, props.showToast, t]);

      const applySettings = useCallback(function update(patch) {
        if ('fontSize' in patch || 'lineHeight' in patch || 'fontFamily' in patch || 'letterSpacing' in patch || 'paragraphSpacing' in patch || 'pageWidth' in patch) {
          pendingRef.current = currentPercentRef.current;
          readyRef.current = false;
        }
        props.onUpdateSettings(patch);
      }, [props.onUpdateSettings]);

      // A short-lived "Aa 20px" HUD so keyboard resizing is visible without opening a panel.
      const showFontHud = useCallback(function announce(size) {
        setFontHud(Number(size) || 0);
        if (fontHudTimerRef.current) window.clearTimeout(fontHudTimerRef.current);
        fontHudTimerRef.current = window.setTimeout(function hide() {
          fontHudTimerRef.current = null;
          setFontHud(0);
        }, 1100);
      }, []);

      const changeFontSize = useCallback(function step(delta) {
        const next = stepFontSize(settings.fontSize, delta);
        if (next !== settings.fontSize) applySettings({ fontSize: next });
        showFontHud(next);
        return next;
      }, [applySettings, settings.fontSize, showFontHud]);

      const resetFontSize = useCallback(function reset() {
        if (settings.fontSize !== FONT_SIZE_DEFAULT) applySettings({ fontSize: FONT_SIZE_DEFAULT });
        showFontHud(FONT_SIZE_DEFAULT);
      }, [applySettings, settings.fontSize, showFontHud]);

      useLayoutEffect(function measure() {
        const element = stageRef.current;
        if (!element) return undefined;
        function update() {
          const rect = element.getBoundingClientRect();
          if (rect.width < 80 || rect.height < 80) return;
          const next = { w: Math.floor(rect.width), h: Math.floor(rect.height) };
          if (Math.abs(boxRef.current.w - next.w) < 1 && Math.abs(boxRef.current.h - next.h) < 1) return;
          if (boxRef.current.w > 0) {
            pendingRef.current = currentPercentRef.current;
            readyRef.current = false;
          }
          boxRef.current = next;
          setBox(next);
        }
        update();
        let observer = null;
        if (typeof ResizeObserver === 'function') {
          observer = new ResizeObserver(update);
          observer.observe(element);
        } else {
          window.addEventListener('resize', update);
        }
        return function cleanup() {
          if (observer) observer.disconnect();
          else window.removeEventListener('resize', update);
        };
      }, []);

      useEffect(function focusReader() {
        if (readerRef.current) {
          try { readerRef.current.focus({ preventScroll: true }); } catch (error) { /* ignore */ }
        }
      }, []);

      useEffect(function collapseHostRightbarOnReaderMount() {
        let frameClean = null;
        function enforceFullWidth() {
          try {
            const frame = document.querySelector('.PIRFFq_frame, [class*="_frame"]');
            if (frame && frame.style) {
              const current = frame.style.getPropertyValue('grid-template-columns');
              if (current !== 'auto 1fr 0px') {
                if (!frameClean) {
                  const original = frame.style.gridTemplateColumns;
                  frameClean = function restore() {
                    if (original) frame.style.gridTemplateColumns = original;
                    else frame.style.removeProperty('grid-template-columns');
                  };
                }
                frame.style.setProperty('grid-template-columns', 'auto 1fr 0px', 'important');
              }
            }
          } catch (e) { /* ignore */ }

          try {
            const rightbar = document.querySelector('[data-rightbar-col], [class*="_rightbarCol"]');
            if (rightbar && rightbar.style) {
              rightbar.style.setProperty('display', 'none', 'important');
              rightbar.style.setProperty('width', '0px', 'important');
              rightbar.style.setProperty('min-width', '0px', 'important');
              rightbar.style.setProperty('max-width', '0px', 'important');
              rightbar.style.setProperty('visibility', 'hidden', 'important');
              rightbar.style.setProperty('pointer-events', 'none', 'important');
            }
          } catch (e) { /* ignore */ }

          try {
            const handle = document.querySelector('.PIRFFq_handle, [data-side="rightbar"]');
            if (handle && handle.style) {
              handle.style.setProperty('display', 'none', 'important');
            }
          } catch (e) { /* ignore */ }
        }

        enforceFullWidth();
        window.addEventListener('resize', enforceFullWidth);

        return function cleanup() {
          window.removeEventListener('resize', enforceFullWidth);
          if (frameClean) frameClean();
          try {
            const frame = document.querySelector('.PIRFFq_frame, [class*="_frame"]');
            if (frame && frame.style) frame.style.removeProperty('background');
          } catch (e) { /* ignore */ }
          try {
            const rightbar = document.querySelector('[data-rightbar-col], [class*="_rightbarCol"]');
            if (rightbar && rightbar.style) {
              rightbar.style.removeProperty('display');
              rightbar.style.removeProperty('width');
              rightbar.style.removeProperty('min-width');
              rightbar.style.removeProperty('max-width');
              rightbar.style.removeProperty('visibility');
              rightbar.style.removeProperty('pointer-events');
            }
          } catch (e) { /* ignore */ }
          try {
            const handle = document.querySelector('.PIRFFq_handle, [data-side="rightbar"]');
            if (handle && handle.style) {
              handle.style.removeProperty('display');
            }
          } catch (e) { /* ignore */ }
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
        };
      }, []);

      useEffect(function bindWheelSwipe() {
        const element = stageRef.current;
        if (!element || typeof element.addEventListener !== 'function') return undefined;
        let deltaAccum = 0;
        let lastSwipe = 0;
        function onWheel(event) {
          if (event.ctrlKey || event.metaKey) return;
          const dominant = Math.abs(event.deltaX) >= Math.abs(event.deltaY)
            ? event.deltaX
            : event.deltaY;
          if (Math.abs(dominant) < 3) return;
          deltaAccum += dominant;
          const now = Date.now();
          if (Math.abs(deltaAccum) >= 48 && (now - lastSwipe) > 340) {
            if (deltaAccum > 0) {
              nextPage();
            } else {
              prevPage();
            }
            lastSwipe = now;
            deltaAccum = 0;
            if (event.cancelable) event.preventDefault();
          }
        }
        element.addEventListener('wheel', onWheel, { passive: false });
        return function unbind() {
          element.removeEventListener('wheel', onWheel);
        };
      }, [nextPage, prevPage]);

      useEffect(function watchSystemTheme() {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const query = window.matchMedia('(prefers-color-scheme: dark)');
        function update() { setSystemDark(query.matches === true); }
        if (typeof query.addEventListener === 'function') query.addEventListener('change', update);
        else if (typeof query.addListener === 'function') query.addListener(update);
        return function cleanup() {
          if (typeof query.removeEventListener === 'function') query.removeEventListener('change', update);
          else if (typeof query.removeListener === 'function') query.removeListener(update);
        };
      }, []);

      useEffect(function readyFonts() {
        let alive = true;
        if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') {
          document.fonts.ready.then(function loaded() {
            if (alive) setFontTick(function bump(value) { return value + 1; });
          }).catch(function ignore() {});
        }
        return function cleanup() { alive = false; };
      }, []);

      useEffect(function enableAnimation() {
        if (animate) return undefined;
        const frame = window.requestAnimationFrame(function turnOn() { setAnimate(true); });
        return function cleanup() { window.cancelAnimationFrame(frame); };
      }, [animate, chapterIndex]);

      useLayoutEffect(function paginate() {
        const element = columnsRef.current;
        if (!element || !pageW || !pageH) return;
        const stepSize = pageW + gap;
        const totalWidth = element.scrollWidth;
        let measuredCount = Math.round((totalWidth + gap) / stepSize);
        if (endRef.current) {
          const containerRect = element.getBoundingClientRect();
          const endRect = endRef.current.getBoundingClientRect();
          const endColumn = Math.round((endRect.left - containerRect.left) / stepSize) + 1;
          measuredCount = Math.max(measuredCount, endColumn);
        }
        const nextCount = Math.max(1, measuredCount);
        setPageCount(nextCount);
        let target = pageRef.current;
        if (pendingRef.current !== null) {
          if (pendingRef.current === 'last') target = nextCount - 1;
          else if (typeof pendingRef.current === 'object' && pendingRef.current && pendingRef.current.page !== undefined) target = clamp(pendingRef.current.page, 0, nextCount - 1);
          else if (typeof pendingRef.current === 'object' && pendingRef.current && pendingRef.current.anchorId) {
            let el = null;
            try { el = element.querySelector('#' + CSS.escape(pendingRef.current.anchorId)); } catch (e) {}
            if (el) {
              const containerRect = element.getBoundingClientRect();
              const elRect = el.getBoundingClientRect();
              const actualLeft = elRect.left - containerRect.left;
              target = clamp(Math.floor(actualLeft / stepSize), 0, nextCount - 1);
            }
          }
          else target = Math.round(clamp(Number(pendingRef.current) || 0, 0, 1) * Math.max(0, nextCount - 1));
          pendingRef.current = null;
        } else {
          target = clamp(target, 0, nextCount - 1);
        }
        setPage(function same(previous) { return previous === target ? previous : target; });
        readyRef.current = false;
        const frame = window.requestAnimationFrame(function announce() {
          readyRef.current = true;
          setProgressTick(function bump(value) { return value + 1; });
        });
        return function cleanup() { window.cancelAnimationFrame(frame); };
      }, [book.id, chapter.id, chapterIndex, pageW, pageH, gap, settings.fontSize, settings.lineHeight, settings.fontFamily, settings.letterSpacing, settings.paragraphSpacing, settings.pageWidth, fontTick, chapterHighlights.length]);

      useEffect(function reportProgress() {
        if (!readyRef.current) return;
        const percent = pageCount <= 1 ? 0 : clamp(page / (pageCount - 1), 0, 1);
        props.onProgress(book.id, chapterIndex, percent);
      }, [book.id, chapterIndex, page, pageCount, progressTick, props.onProgress]);

      const addSecondsRef = useRef(props.onAddSeconds);
      addSecondsRef.current = props.onAddSeconds;
      useEffect(function trackReadingTime() {
        let last = Date.now();
        function flush() {
          const now = Date.now();
          const delta = (now - last) / 1000;
          last = now;
          if (!document.hidden && delta > 0) {
            const seconds = Math.min(300, Math.round(delta));
            addSecondsRef.current(seconds, book.id);
            sessionSecondsRef.current += seconds;
          }
        }
        const timer = window.setInterval(function tick() {
          if (document.hidden) {
            last = Date.now();
            return;
          }
          flush();
        }, 30000);
        function onVisibility() {
          if (document.hidden) last = Date.now();
          else last = Date.now();
        }
        document.addEventListener('visibilitychange', onVisibility);
        return function cleanup() {
          window.clearInterval(timer);
          document.removeEventListener('visibilitychange', onVisibility);
          if (!document.hidden) flush();
          if (!sessionReportedRef.current && sessionSecondsRef.current >= 30 && onSessionEndRef.current) {
            sessionReportedRef.current = true;
            onSessionEndRef.current({
              bookId: book.id,
              startedAt: sessionStartRef.current,
              seconds: Math.round(sessionSecondsRef.current),
              chapterIndex: chapterIndexRef.current,
            });
          }
        };
      }, []);

      useEffect(function keyboard() {
        function onKey(event) {
          const target = event.target;
          const tag = target && target.tagName ? target.tagName : '';
          if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (target && target.isContentEditable)) return;
          if (event.key === '?' && !noteDraft) {
            event.preventDefault();
            setSettingsOpen(false);
            setDrawer(null);
            dismissPopovers();
            setChrome(true);
            setHelpOpen(true);
            return;
          }
          if ((event.metaKey || event.ctrlKey) && String(event.key).toLowerCase() === 'f' && !noteDraft) {
            event.preventDefault();
            setSettingsOpen(false);
            setSearchQuery('');
            setSearchText('');
            setDrawer('search');
            return;
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            if (zoomImage) { setZoomImage(null); return; }
            if (helpOpen) { setHelpOpen(false); return; }
            if (pageJumpOpen) { setPageJumpOpen(false); return; }
            if (bookmarkDraft) { setBookmarkDraft(null); return; }
            if (noteDraft) { setNoteDraft(null); return; }
            if (settingsOpen) { setSettingsOpen(false); return; }
            if (fontQuickOpen) { setFontQuickOpen(false); return; }
            if (drawer) { setDrawer(null); return; }
            if (toolbar || peek || footnote) { dismissPopovers(); return; }
            if (!chrome) { setChrome(true); return; }
            props.onExit();
            return;
          }
          if (zoomImage || noteDraft || settingsOpen || drawer || helpOpen || bookmarkDraft || pageJumpOpen) return;
          if (!event.metaKey && !event.ctrlKey && !event.altKey) {
            const plainKey = String(event.key).toLowerCase();
            if (plainKey === 'b') { event.preventDefault(); toggleBookmark(); return; }
            if (plainKey === 'r') { event.preventDefault(); toggleSpeech(); return; }
            if (plainKey === 't') { event.preventDefault(); setDrawer('toc'); return; }
            if (plainKey === 'h') { event.preventDefault(); dismissPopovers(); setChrome(!chrome); return; }
            if (plainKey === 'f') { event.preventDefault(); toggleFullscreen(); return; }
            if (plainKey === 'l') {
              event.preventDefault();
              const next = !(settings.readingRuler || rulerOpen);
              setRulerOpen(next);
              applySettings({ readingRuler: next });
              props.showToast(next ? t('rulerOn') : t('rulerOff'));
              return;
            }
            if (plainKey === 'g') {
              event.preventDefault();
              dismissPopovers();
              setPageJumpDraft(String(page + 1));
              setPageJumpOpen(true);
              return;
            }
            if (plainKey === 'u' || event.key === 'Backspace') {
              if (jumpReturn) {
                event.preventDefault();
                goChapter(jumpReturn.chapterIndex, 'page', jumpReturn.page);
                setJumpReturn(null);
                return;
              }
            }
            if (event.key === '-' || event.key === '_') { event.preventDefault(); changeFontSize(-1); return; }
            if (event.key === '=' || event.key === '+') { event.preventDefault(); changeFontSize(1); return; }
            if (event.key === '0') { event.preventDefault(); resetFontSize(); return; }
            if (event.key === ']') { event.preventDefault(); if (chapterIndex < chapters.length - 1) goChapter(chapterIndex + 1, 'resume'); return; }
            if (event.key === '[') { event.preventDefault(); if (chapterIndex > 0) goChapter(chapterIndex - 1, 'resume'); return; }
          }
          if (tag === 'BUTTON' && (event.key === ' ' || event.key === 'Enter')) return;
          const action = readerKeyAction(event.key, {
            meta: event.metaKey,
            ctrl: event.ctrlKey,
            alt: event.altKey,
            shift: event.shiftKey,
          });
          if (action === 'nextPage') {
            event.preventDefault();
            nextPage();
            return;
          }
          if (action === 'prevPage') {
            event.preventDefault();
            prevPage();
            return;
          }
          if (action === 'firstPage') {
            event.preventDefault();
            dismissPopovers();
            setPage(0);
            return;
          }
          if (action === 'lastPage') {
            event.preventDefault();
            dismissPopovers();
            setPage(Math.max(0, pageCount - 1));
            return;
          }
        }
        window.addEventListener('keydown', onKey);
        return function cleanup() { window.removeEventListener('keydown', onKey); };
      }, [bookmarkDraft, changeFontSize, chrome, dismissPopovers, drawer, fontQuickOpen, helpOpen, nextPage, noteDraft, page, pageCount, pageJumpOpen, peek, prevPage, props.onExit, resetFontSize, settingsOpen, toolbar, toggleBookmark, toggleFullscreen, toggleSpeech, zoomImage]);

      useEffect(function dismissOnOutside() {
        if (!toolbar && !peek && !fontQuickOpen && !pageJumpOpen) return undefined;
        function onDown(event) {
          const target = event.target;
          if (target && typeof target.closest === 'function') {
            if (target.closest('.sr-selection-toolbar') || target.closest('.sr-hl-peek')) return;
            if (target.closest('.sr-font-quick') || target.closest('.sr-font-anchor')) return;
            if (target.closest('.sr-page-jump-popover') || target.closest('.sr-page-jump-trigger')) return;
          }
          dismissPopovers();
        }
        document.addEventListener('pointerdown', onDown, true);
        return function cleanup() { document.removeEventListener('pointerdown', onDown, true); };
      }, [dismissPopovers, fontQuickOpen, pageJumpOpen, peek, toolbar]);

      useEffect(function focusPageJump() {
        if (!pageJumpOpen) return;
        const frame = window.requestAnimationFrame(function focus() {
          if (pageJumpInputRef.current) {
            pageJumpInputRef.current.focus();
            pageJumpInputRef.current.select();
          }
        });
        return function cleanup() { window.cancelAnimationFrame(frame); };
      }, [pageJumpOpen]);

      useEffect(function focusNoteEditor() {
        if (!noteDraft) return;
        const frame = window.requestAnimationFrame(function focus() {
          if (noteRef.current) noteRef.current.focus();
        });
        return function cleanup() { window.cancelAnimationFrame(frame); };
      }, [noteDraft]);

      useEffect(function scrollCurrentTocIntoView() {
        if (drawer !== 'toc') return;
        const frame = window.requestAnimationFrame(function scroll() {
          const active = document.querySelector('.sr-toc-row[data-current="true"]');
          if (active && typeof active.scrollIntoView === 'function') {
            active.scrollIntoView({ block: 'center', behavior: 'instant' });
          }
        });
        return function cleanup() { window.cancelAnimationFrame(frame); };
      }, [drawer, chapterIndex]);

      useEffect(function scrollActiveSearchIntoView() {
        if (drawer !== 'search' || searchCursor < 0) return;
        const frame = window.requestAnimationFrame(function scroll() {
          const active = document.querySelector('.sr-search-result[data-active="true"]');
          if (active && typeof active.scrollIntoView === 'function') {
            active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        });
        return function cleanup() { window.cancelAnimationFrame(frame); };
      }, [drawer, searchCursor]);

      useEffect(function clearSuppressTimer() {
        return function cleanup() {
          if (suppressTimerRef.current) window.clearTimeout(suppressTimerRef.current);
        };
      }, []);

      useEffect(function clearHudTimers() {
        return function cleanup() {
          if (fontHudTimerRef.current) window.clearTimeout(fontHudTimerRef.current);
          if (chapterHudTimerRef.current) window.clearTimeout(chapterHudTimerRef.current);
        };
      }, []);

      useEffect(function preloadNextChapter() {
        if (chapterIndex < chapters.length - 1 && page >= Math.max(0, pageCount - 2)) {
          const nextChapter = chapters[chapterIndex + 1];
          if (nextChapter && Array.isArray(nextChapter.paragraphs)) {
            chapterBaseOffsets(nextChapter);
          }
        }
      }, [chapterIndex, chapters, page, pageCount]);

      useEffect(function isolateReaderTheme() {
        // Reader theme palette is scoped strictly to .sr-reader.
        // Clean up any background properties on outer containers so the host and shelf never inherit reader background.
        function sanitizeHostTheme() {
          try {
            const app = readerRef.current ? readerRef.current.closest('.sr-app') : document.querySelector('.sr-app');
            if (app) {
              app.style.removeProperty('background');
              app.style.removeProperty('--sr-bg');
            }
            const centerCol = readerRef.current ? readerRef.current.closest('[class*="_centerCol"]') : document.querySelector('[class*="_centerCol"]');
            if (centerCol) {
              centerCol.style.removeProperty('background');
            }
          } catch (e) { /* ignore */ }
        }
        sanitizeHostTheme();
        return sanitizeHostTheme;
      }, [activeThemeId]);

      useEffect(function focusSearch() {
        if (drawer !== 'search') return undefined;
        const frame = window.requestAnimationFrame(function focus() {
          if (searchRef.current) searchRef.current.focus();
        });
        return function cleanup() { window.cancelAnimationFrame(frame); };
      }, [drawer]);

      useEffect(function debounceSearch() {
        if (drawer !== 'search') return undefined;
        const timer = window.setTimeout(function settle() {
          setSearchText(searchQuery.trim());
        }, 150);
        return function cleanup() { window.clearTimeout(timer); };
      }, [drawer, searchQuery]);

      useEffect(function cleanupSpeech() {
        return function cleanup() {
          ttsRef.current.active = false;
          ttsRef.current.paused = false;
          if (sleepTimerRef.current) { window.clearTimeout(sleepTimerRef.current); sleepTimerRef.current = null; }
          try {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
          } catch (error) {
            /* speech synthesis may be unavailable */
          }
        };
      }, []);

      useEffect(function loadSpeechVoices() {
        if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;
        const synth = window.speechSynthesis;
        function load() {
          try { setVoices(synth.getVoices() || []); } catch (error) { setVoices([]); }
        }
        load();
        if (synth.addEventListener) synth.addEventListener('voiceschanged', load);
        else synth.onvoiceschanged = load;
        return function cleanup() {
          if (synth.removeEventListener) synth.removeEventListener('voiceschanged', load);
          else if (synth.onvoiceschanged === load) synth.onvoiceschanged = null;
        };
      }, []);

      useEffect(function syncSpeechRate() {
        const rate = clamp(Number(settings.speechRate) || 1, 0.5, 2);
        ttsRef.current.rate = rate;
        setTts(function applyRate(previous) {
          return previous.rate === rate ? previous : Object.assign({}, previous, { rate: rate });
        });
      }, [settings.speechRate]);

      useEffect(function watchFullscreen() {
        function update() {
          setIsFullscreen(Boolean(document.fullscreenElement && readerRef.current && document.fullscreenElement === readerRef.current));
        }
        document.addEventListener('fullscreenchange', update);
        update();
        return function cleanup() {
          document.removeEventListener('fullscreenchange', update);
          try {
            if (document.fullscreenElement && document.fullscreenElement === readerRef.current) document.exitFullscreen();
          } catch (error) {
            /* fullscreen may already be gone */
          }
        };
      }, []);

      useEffect(function stopSpeechOnChapterChange() {
        if (ttsRef.current.active && ttsRef.current.chapterIndex !== chapterIndex) stopSpeech();
      }, [chapterIndex]);

      useEffect(function resumeSpeechOnNextChapter() {
        const pending = autoSpeechRef.current;
        if (!pending || pending.chapterIndex !== chapterIndex) return;
        autoSpeechRef.current = null;
        startSpeech();
      }, [chapterIndex]);

      useEffect(function autoHideControls() {
        if (!settings.autoHideChrome || !chrome) return undefined;
        if (drawer || settingsOpen || noteDraft || toolbar || peek) return undefined;
        const timer = window.setTimeout(function hideControls() {
          setChrome(false);
        }, 6000);
        return function cleanup() { window.clearTimeout(timer); };
      }, [settings.autoHideChrome, chrome, drawer, settingsOpen, noteDraft, toolbar, peek, page, chapterIndex]);

      useEffect(function eyeCareTimer() {
        const timer = setInterval(function checkRest() {
          const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 60000);
          if (elapsed > 0 && elapsed % 30 === 0 && sessionSecondsRef.current !== elapsed) {
            sessionSecondsRef.current = elapsed;
            props.showToast(fill(t('eyeCareReminderHint'), { n: elapsed }));
          }
        }, 60000);
        return function cleanup() { clearInterval(timer); };
      }, [props.showToast, t]);

      function suppressNextClick() {
        suppressClickRef.current = true;
        if (suppressTimerRef.current) window.clearTimeout(suppressTimerRef.current);
        suppressTimerRef.current = window.setTimeout(function release() {
          suppressClickRef.current = false;
          suppressTimerRef.current = null;
        }, 380);
      }

      function locatePoint(node, offset) {
        if (!node || !columnsRef.current) return null;
        const element = node.nodeType === 1 ? node : node.parentElement;
        if (!element) return null;
        const paragraph = element.closest('[data-p]');
        if (!paragraph || !columnsRef.current.contains(paragraph)) return null;
        const index = Number(paragraph.getAttribute('data-p'));
        if (!Number.isFinite(index)) return null;
        const range = document.createRange();
        try {
          range.selectNodeContents(paragraph);
          range.setEnd(node, offset);
        } catch (error) {
          return null;
        }
        const local = range.toString().length;
        const base = offsets.offsets[index];
        if (typeof base !== 'number') return null;
        return { paragraph: index, absolute: base + local };
      }

      function popoverPosition(rect, halfWidth) {
        const half = Math.min(halfWidth || 160, Math.max(80, (window.innerWidth - 28) / 2));
        const center = rect.left + rect.width / 2;
        const x = clamp(center, half + 14, window.innerWidth - half - 14);
        const below = rect.top < 100;
        const y = below ? rect.bottom + 10 : rect.top - 10;
        return { x: x, y: y, below: below };
      }

      function handlePointerDown(event) {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        pointerRef.current = { x: event.clientX, y: event.clientY, type: event.pointerType };
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) suppressNextClick();
      }

      function handlePointerUp(event) {
        const start = pointerRef.current;
        pointerRef.current = null;
        if (start && start.type !== 'mouse') {
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (Math.abs(dx) > 54 && Math.abs(dx) > Math.abs(dy) * 1.25) {
            suppressNextClick();
            if (dx < 0) nextPage();
            else prevPage();
            return;
          }
        }
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !selection.rangeCount) return;
        const range = selection.getRangeAt(0);
        if (!columnsRef.current || !columnsRef.current.contains(range.commonAncestorContainer)) return;
        const first = locatePoint(range.startContainer, range.startOffset);
        const second = locatePoint(range.endContainer, range.endOffset);
        if (!first || !second) return;
        let startOffset = Math.min(first.absolute, second.absolute);
        let endOffset = Math.max(first.absolute, second.absolute);
        const raw = chapterString.slice(startOffset, endOffset);
        if (!raw.trim()) return;
        startOffset += raw.length - raw.trimStart().length;
        endOffset -= raw.length - raw.trimEnd().length;
        const text = chapterString.slice(startOffset, endOffset);
        if (!text.trim()) return;
        suppressNextClick();
        const rect = range.getBoundingClientRect();
        const position = popoverPosition(rect, 215);
        setSelectionColor(null);
        setToolbar({
          start: startOffset,
          end: endOffset,
          text: text,
          x: position.x,
          y: position.y,
          below: position.below,
        });
        setPeek(null);
        try { selection.removeAllRanges(); } catch (error) { /* ignore */ }
      }

      function handleStageClick(event) {
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          return;
        }
        const target = event.target;
        if (target && typeof target.closest === 'function' && target.closest('mark[data-hl]')) {
          const mark = target.closest('mark[data-hl]');
          const id = mark.getAttribute('data-hl');
          const item = props.highlights.find(function find(highlight) { return highlight.id === id; });
          if (!item) return;
          const rect = mark.getBoundingClientRect();
          const position = popoverPosition(rect, 159);
          dismissPopovers();
          setPeek({ id: id, x: position.x, y: position.y, below: position.below });
          return;
        }
        const anchor = target && typeof target.closest === 'function' ? target.closest('a') : null;
        if (anchor) {
          let href = anchor.getAttribute('href') || '';
          if (!href) return;
          try { href = decodeURIComponent(href); } catch (e) { /* ignore */ }
          if (/^https?:\/\//i.test(href) || /^mailto:/i.test(href)) {
            event.preventDefault();
            try { window.open(href, '_blank', 'noopener,noreferrer'); } catch (e) { /* ignore */ }
            return;
          }

          event.preventDefault();
          event.stopPropagation();

          const epubType = anchor.getAttribute('epub:type') || '';
          const role = anchor.getAttribute('role') || '';
          const className = anchor.className || '';
          const hashIdx = href.indexOf('#');
          const targetPath = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
          const targetId = hashIdx >= 0 ? href.slice(hashIdx + 1) : '';

          // 1. Is this a footnote?
          const isNoteRef = /noteref|footnote|comment/i.test(epubType) ||
            /noteref|doc-noteref/i.test(role) ||
            /noteref|footnote/i.test(className) ||
            /(^|[-_])(fn|footnote|note|comment)([-_0-9]|$)/i.test(targetId) ||
            Boolean(anchor.closest('sup')) ||
            /^[\[(]?[0-9*注†‡§#]+[\])]?$/.test(anchor.textContent.trim());

          if (targetId && (isNoteRef || !targetPath)) {
            let el = null;
            try {
              el = (columnsRef.current && columnsRef.current.querySelector('#' + CSS.escape(targetId))) ||
                   document.getElementById(targetId);
            } catch (e) { /* ignore */ }

            let noteText = '';
            let noteHtml = '';

            if (el) {
              const container = el.closest('aside, li, dd, p, div') || el.parentElement || el;
              noteText = (container.innerText || container.textContent || '').trim();
              noteHtml = container.innerHTML;
            }

            if (!noteText) {
              // Search in current chapter or other chapters
              const idPattern = new RegExp('id=["\']' + targetId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\']', 'i');
              for (let i = 0; i < chapters.length; i += 1) {
                const c = chapters[i];
                const pList = c.paragraphs || [];
                const foundIdx = pList.findIndex(function(p) { return idPattern.test(p); });
                if (foundIdx >= 0) {
                  let p = pList[foundIdx];
                  let clean = stripHtmlTags(p).trim();
                  if (!clean && pList[foundIdx + 1]) {
                    p = pList[foundIdx + 1];
                    clean = stripHtmlTags(p).trim();
                  }
                  if (clean) {
                    noteText = clean;
                    noteHtml = p;
                    break;
                  }
                }
              }
            }

            const isTargetFootnote = el && (el.tagName === 'ASIDE' || /footnote|noteref/i.test(el.getAttribute('epub:type') || '') || /footnote/i.test(el.className || '') || /(^|[-_])(fn|footnote|note|comment)([-_0-9]|$)/i.test(el.id || ''));
            if (noteText && (isNoteRef || isTargetFootnote)) {
              const rect = anchor.getBoundingClientRect();
              const position = popoverPosition(rect, 170);
              dismissPopovers();
              setFootnote({
                id: targetId,
                title: anchor.textContent.trim() || t('footnote'),
                html: noteHtml,
                text: noteText,
                x: position.x,
                y: position.y,
                below: position.below,
              });
              return;
            }
          }

          // 2. If it's NOT a footnote, it is an internal jump link (章节跳转 / 锚点跳转)!
          // 2a. In current chapter:
          if (targetId && (!targetPath || targetPath === (chapter.href || '') || targetPath === (chapter.path || ''))) {
            let el = null;
            try {
              el = (columnsRef.current && columnsRef.current.querySelector('#' + CSS.escape(targetId))) ||
                   document.getElementById(targetId);
            } catch (e) { /* ignore */ }
            if (el && columnsRef.current) {
              dismissPopovers();
              const containerRect = columnsRef.current.getBoundingClientRect();
              const elRect = el.getBoundingClientRect();
              const stepSize = pageW + gap;
              const actualLeft = (elRect.left - containerRect.left) + page * stepSize;
              const targetPage = Math.floor(actualLeft / stepSize);
              setJumpReturn({ chapterIndex: chapterIndex, page: page });
              setPage(clamp(targetPage, 0, Math.max(0, pageCount - 1)));
              return;
            }
          }

          // 2b. In another chapter:
          let targetChapIdx = -1;
          if (targetPath) {
            const cleanPath = targetPath.toLowerCase().replace(/^[./]+/, '');
            const targetFileName = cleanPath.split('/').pop();
            targetChapIdx = chapters.findIndex(function(c) {
              const cHref = String(c.href || '').toLowerCase().replace(/^[./]+/, '');
              const cPath = String(c.path || '').toLowerCase().replace(/^[./]+/, '');
              const cFile = cHref.split('/').pop() || cPath.split('/').pop();
              return (cHref && (cHref === cleanPath || cHref.endsWith('/' + cleanPath))) ||
                     (cPath && (cPath === cleanPath || cPath.endsWith('/' + cleanPath))) ||
                     (targetFileName && cFile === targetFileName);
            });
          }
          if (targetChapIdx < 0 && targetId) {
            const idPattern = new RegExp('id=["\']' + targetId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\']', 'i');
            targetChapIdx = chapters.findIndex(function(c) {
              return (c.paragraphs || []).some(function(p) { return idPattern.test(p); });
            });
          }

          if (targetChapIdx >= 0) {
            dismissPopovers();
            setJumpReturn({ chapterIndex: chapterIndex, page: page });
            if (targetId) {
              goChapter(targetChapIdx, 'anchor', targetId);
            } else {
              goChapter(targetChapIdx, 'page', 0);
            }
            return;
          }

          return;
        }
        if (target && typeof target.closest === 'function' && target.closest('button')) return;
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) return;
        dismissPopovers();
        if (drawer || settingsOpen || noteDraft) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const ratio = (event.clientX - rect.left) / Math.max(1, rect.width);
        if (ratio < 0.24) prevPage();
        else if (ratio > 0.76) nextPage();
        else setChrome(function toggle(value) { return !value; });
      }

      function handleStageDoubleClick(event) {
        const target = event.target;
        if (target && typeof target.closest === 'function' && target.closest('a,button,mark[data-hl],input,textarea,.sr-figure-zoom')) return;
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) return;
        event.preventDefault();
        toggleFullscreen();
      }

      function createHighlightFromToolbar() {
        if (!toolbar) return;
        props.addHighlight({
          id: newId('hl'),
          bookId: book.id,
          chapterIndex: chapterIndex,
          chapterId: chapter.id,
          start: toolbar.start,
          end: toolbar.end,
          text: toolbar.text,
          note: '',
          color: activeSelectionColor,
          createdAt: Date.now(),
        });
        setToolbar(null);
        props.showToast(t('highlighted'));
      }

      function createThoughtDraft() {
        if (!toolbar) return;
        setNoteDraft({
          start: toolbar.start,
          end: toolbar.end,
          text: toolbar.text,
          note: '',
          color: activeSelectionColor,
        });
        setToolbar(null);
      }

      async function copyToolbarText() {
        if (!toolbar) return;
        const text = toolbar.text;
        try {
          if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            await navigator.clipboard.writeText(text);
          } else {
            const area = document.createElement('textarea');
            area.value = text;
            area.setAttribute('readonly', '');
            area.style.position = 'fixed';
            area.style.opacity = '0';
            document.body.appendChild(area);
            area.select();
            document.execCommand('copy');
            area.remove();
          }
          props.showToast(t('copied'));
        } catch (error) {
          props.showToast(t('copied'));
        }
        setToolbar(null);
      }

      async function copyToolbarQuote() {
        if (!toolbar) return;
        const text = toolbar.text;
        const quote = buildQuoteText(text, book.title, chapter.title);
        const ok = await copyTextToClipboard(quote);
        props.showToast(ok ? t('quoteCopied') : t('copyFailed'));
        setToolbar(null);
      }

      function searchSelectionText() {
        if (!toolbar) return;
        const query = toolbar.text.trim();
        if (!query) return;
        setSearchText(query);
        setSearchQuery(query);
        setSearchCursor(-1);
        setDrawer('search');
        setToolbar(null);
      }

      function openThoughtEditor(item) {
        if (!item) return;
        setNoteDraft({
          id: item.id,
          start: item.start,
          end: item.end,
          text: item.text,
          note: item.note || '',
          color: item.color || 'amber',
        });
        setDrawer(null);
        setPeek(null);
        setToolbar(null);
      }

      function saveThought() {
        if (!noteDraft) return;
        const body = noteDraft.note.trim();
        if (noteDraft.id) {
          props.updateHighlight(noteDraft.id, { note: body, color: noteDraft.color });
          setNoteDraft(null);
          props.showToast(t('thoughtSaved'));
          return;
        }
        if (!body) return;
        props.addHighlight({
          id: newId('hl'),
          bookId: book.id,
          chapterIndex: chapterIndex,
          chapterId: chapter.id,
          start: noteDraft.start,
          end: noteDraft.end,
          text: noteDraft.text,
          note: body,
          color: noteDraft.color,
          createdAt: Date.now(),
        });
        setNoteDraft(null);
        props.showToast(t('thoughtSaved'));
      }

      function jumpToHighlight(item) {
        const targetChapter = chapters[item.chapterIndex];
        const total = targetChapter ? chapterText(targetChapter).length : 0;
        const percent = total ? clamp(item.start / total, 0, 1) : 0;
        goChapter(item.chapterIndex, 'percent', percent);
      }

      function speechIsSupported() {
        return typeof window !== 'undefined' && Boolean(window.speechSynthesis) && typeof window.SpeechSynthesisUtterance === 'function';
      }

      function pickSpeechVoice(lang) {
        try {
          const available = window.speechSynthesis.getVoices() || [];
          const preferred = settings.speechVoice;
          if (preferred) {
            const chosen = available.find(function voice(item) { return (item.voiceURI || item.name) === preferred || item.name === preferred; });
            if (chosen) return chosen;
          }
          const exact = available.find(function voice(item) { return String(item.lang || '').toLowerCase() === String(lang).toLowerCase(); });
          if (exact) return exact;
          const base = String(lang).split('-')[0].toLowerCase();
          return available.find(function voice(item) { return String(item.lang || '').toLowerCase().indexOf(base) === 0; }) || null;
        } catch (error) {
          return null;
        }
      }

      function finishSpeech(failed) {
        const session = ttsRef.current;
        session.active = false;
        session.paused = false;
        session.utterance = null;
        const nextChapter = failed ? null : nextSpeechChapter(chapterIndex, chapters.length);
        if (nextChapter !== null) {
          autoSpeechRef.current = { chapterIndex: nextChapter };
          setTts(function nextChapterState(previous) {
            return Object.assign({}, previous, { status: 'playing', index: 0, total: 0, excerpt: t('speechNextChapter') });
          });
          goChapter(nextChapter, 'start');
          return;
        }
        autoSpeechRef.current = null;
        clearSleepTimer();
        setSleepMinutes(0);
        setTts(function idle(previous) { return Object.assign({}, previous, { status: 'idle', index: 0, total: 0, excerpt: '' }); });
        if (failed) props.showToast(t('speechError'));
        else props.showToast(t('speechFinished'));
      }

      function speakSpeechChunk(index) {
        const session = ttsRef.current;
        if (!session.active) return;
        if (index >= session.chunks.length) {
          finishSpeech(false);
          return;
        }
        const synth = window.speechSynthesis;
        if (!synth) {
          finishSpeech(true);
          return;
        }
        let utterance;
        try {
          utterance = new window.SpeechSynthesisUtterance(session.chunks[index]);
        } catch (error) {
          finishSpeech(true);
          return;
        }
        utterance.lang = session.lang;
        utterance.rate = session.rate;
        const voice = pickSpeechVoice(session.lang);
        if (voice) utterance.voice = voice;
        session.index = index;
        session.utterance = utterance;
        const excerpt = session.chunks[index];
        setTts(function speaking(previous) {
          return Object.assign({}, previous, { status: 'playing', index: index, total: session.chunks.length, excerpt: excerpt });
        });
        if (session.offsets && typeof session.offsets[index] === 'number' && chapterString.length > 0) {
          const targetPercent = clamp(session.offsets[index] / chapterString.length, 0, 1);
          const targetPage = Math.round(targetPercent * Math.max(0, countRef.current - 1));
          if (targetPage !== pageRef.current) setPage(targetPage);
        }
        utterance.onend = function onEnd() {
          if (!session.active) return;
          speakSpeechChunk(index + 1);
        };
        utterance.onerror = function onError(event) {
          if (!session.active) return;
          const code = event && event.error;
          if (code === 'canceled' || code === 'interrupted') return;
          finishSpeech(true);
        };
        try {
          synth.speak(utterance);
        } catch (error) {
          finishSpeech(true);
        }
      }

      function startSpeech() {
        if (!speechIsSupported()) {
          props.showToast(t('speechUnsupported'));
          return;
        }
        const session = ttsRef.current;
        session.active = false;
        session.paused = false;
        try { window.speechSynthesis.cancel(); } catch (error) { /* ignore */ }
        const startChar = chapterString.length > 1 ? Math.floor(progressPercentValue * chapterString.length) : 0;
        const chunks = splitSpeechChunks(chapterString.slice(startChar), 180);
        if (!chunks.length) {
          props.showToast(t('speechFinished'));
          return;
        }
        session.active = true;
        session.paused = false;
        session.chunks = chunks;
        session.offsets = speechChunkOffsets(chunks, startChar);
        session.index = 0;
        session.chapterIndex = chapterIndex;
        session.lang = speechLanguage(chapterString);
        session.rate = tts.rate || 1;
        session.utterance = null;
        setTts(function start(previous) {
          return Object.assign({}, previous, { status: 'playing', index: 0, total: chunks.length, excerpt: chunks[0] });
        });
        speakSpeechChunk(0);
      }

      function toggleSpeech() {
        if (!speechIsSupported()) {
          props.showToast(t('speechUnsupported'));
          return;
        }
        const synth = window.speechSynthesis;
        if (tts.status === 'playing') {
          try { synth.pause(); } catch (error) { /* ignore */ }
          ttsRef.current.paused = true;
          setTts(function paused(previous) { return Object.assign({}, previous, { status: 'paused' }); });
          return;
        }
        if (tts.status === 'paused') {
          try { synth.resume(); } catch (error) { /* ignore */ }
          ttsRef.current.paused = false;
          setTts(function resumed(previous) { return Object.assign({}, previous, { status: 'playing' }); });
          return;
        }
        startSpeech();
      }

      function clearSleepTimer() {
        if (sleepTimerRef.current) {
          window.clearTimeout(sleepTimerRef.current);
          sleepTimerRef.current = null;
        }
      }

      function cycleSleepTimer() {
        const next = nextSleepTimer(sleepMinutes);
        clearSleepTimer();
        setSleepMinutes(next);
        if (next > 0) {
          sleepTimerRef.current = window.setTimeout(function sleep() {
            sleepTimerRef.current = null;
            setSleepMinutes(0);
            stopSpeech();
            props.showToast(t('sleepFinished'));
          }, next * 60000);
        }
      }

      function stopSpeech() {
        autoSpeechRef.current = null;
        clearSleepTimer();
        setSleepMinutes(0);
        const session = ttsRef.current;
        session.active = false;
        session.paused = false;
        session.utterance = null;
        try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (error) { /* ignore */ }
        setTts(function stop(previous) { return Object.assign({}, previous, { status: 'idle', index: 0, total: 0, excerpt: '' }); });
      }

      function cycleSpeechRate() {
        const rates = [0.85, 1, 1.2, 1.5];
        const currentIndex = rates.indexOf(tts.rate);
        const next = rates[(currentIndex + 1) % rates.length];
        ttsRef.current.rate = next;
        setTts(function rate(previous) { return Object.assign({}, previous, { rate: next }); });
        applySettings({ speechRate: next });
      }

      function toggleBookmark() {
        if (currentBookmark) {
          props.removeBookmark(currentBookmark.id);
          props.showToast(t('bookmarkRemoved'));
          return;
        }
        props.addBookmark({
          id: newId('bm'),
          bookId: book.id,
          chapterIndex: chapterIndex,
          chapterId: chapter.id,
          percent: progressPercentValue,
          page: page + 1,
          chapterTitle: chapter.title,
          excerpt: readerExcerptAt(chapterString, progressPercentValue, 110),
          createdAt: Date.now(),
        });
        props.showToast(t('bookmarkAdded'));
      }

      function closeTopOverlay() {
        if (noteDraft) { setNoteDraft(null); return; }
        if (settingsOpen) { setSettingsOpen(false); return; }
        if (drawer) { setDrawer(null); return; }
        setToolbar(null);
        setPeek(null);
        setFootnote(null);
      }

      function segmentParagraph(text, base, highlights) {
        const ranges = [];
        highlights.forEach(function collect(item) {
          const start = clamp(item.start - base, 0, text.length);
          const end = clamp(item.end - base, 0, text.length);
          if (end > start) ranges.push({ item: item, start: start, end: end });
        });
        if (!ranges.length) return renderInline(text, 'p-' + base);
        ranges.sort(function order(a, b) { return a.start - b.start; });
        const nodes = [];
        let cursor = 0;
        ranges.forEach(function range(item) {
          const start = Math.max(cursor, item.start);
          const end = Math.max(start, item.end);
          if (start > cursor) {
            nodes.push.apply(nodes, renderInline(text.slice(cursor, start), 'r-' + base + '-' + cursor));
          }
          if (end > start) {
            const color = HIGHLIGHT_COLORS.find(function find(entry) { return entry.id === item.item.color; }) || HIGHLIGHT_COLORS[0];
            nodes.push(h('mark', {
              key: 'hl-' + item.item.id + '-' + start,
              className: 'sr-hl',
              'data-hl': item.item.id,
              'data-style': item.item.style || 'highlight',
              'data-note': item.item.note ? 'true' : 'false',
              style: { '--sr-hl': color.value },
            }, renderInline(text.slice(start, end), 'hl-' + base + '-' + start)));
          }
          cursor = Math.max(cursor, end);
        });
        if (cursor < text.length) {
          nodes.push.apply(nodes, renderInline(text.slice(cursor), 'r-' + base + '-' + cursor));
        }
        return nodes;
      }

      const paragraphNodes = useMemo(function calcNodes() {
        return chapter.paragraphs.map(function paragraph(text, index) {
          // A picture line is a place in the text where the book had a picture. The
          // bytes live in the chapter's image map (loaded from the folder), so an
          // illustrated page looks like one instead of showing `![图注](img-1-1.jpg)`.
          const picture = imageParagraph(text);
          if (picture) {
            const src = chapter.images && chapter.images[picture.name];
            if (src) {
              const openZoom = function openZoom(event) {
                // The page turns on click; opening a picture must not also turn it.
                if (event) event.stopPropagation();
                setZoomImage({ src: src, alt: picture.alt });
              };
              return h('figure', {
                key: index,
                'data-p': index,
                className: 'sr-figure sr-figure-zoom',
                role: 'button',
                tabIndex: 0,
                title: t('imageZoomHint'),
                onClick: openZoom,
                onKeyDown: function key(event) {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openZoom(event);
                  }
                },
              },
                h('img', { src: src, alt: picture.alt, loading: 'lazy', decoding: 'async' }),
                picture.alt ? h('figcaption', null, picture.alt) : null,
              );
            }
            return h('p', { key: index, 'data-p': index, className: 'sr-figure-missing' },
              t('imageMissing', { name: picture.name }));
          }
          const trimmed = text.trim();

          // 1. EPUB Rich HTML block (ruby, strong, em, table, blockquote, footnotes, headings)
          if (/<[a-z0-9]+\b[^>]*>/i.test(text)) {
            const base = offsets.offsets[index];
            const cleanLen = stripHtmlTags(text).length;
            const relevantHls = chapterHighlights.filter(function(h) {
              return h.end > base && h.start < base + cleanLen;
            });
            const renderedHtml = applyHtmlHighlights(text, base, relevantHls);

            if (trimmed.startsWith('<table') && trimmed.endsWith('</table>')) {
              return h('div', {
                key: index,
                'data-p': index,
                className: 'sr-table-wrap',
                role: 'region',
                'aria-label': t('table'),
                tabIndex: 0,
                dangerouslySetInnerHTML: { __html: renderedHtml }
              });
            }
            if (trimmed.startsWith('<blockquote') && trimmed.endsWith('</blockquote>')) {
              return h('blockquote', {
                key: index,
                'data-p': index,
                className: 'sr-quote',
                dangerouslySetInnerHTML: { __html: renderedHtml.replace(/^<blockquote\b[^>]*>/i, '').replace(/<\/blockquote>$/i, '') }
              });
            }
            if (/^<h[1-6]\b/i.test(trimmed) && /<\/h[1-6]>$/i.test(trimmed)) {
              const Tag = trimmed.slice(1, 3).toLowerCase();
              return h(Tag, {
                key: index,
                'data-p': index,
                className: 'sr-subheading',
                dangerouslySetInnerHTML: { __html: renderedHtml.replace(/^<h[1-6]\b[^>]*>/i, '').replace(/<\/h[1-6]>$/i, '') }
              });
            }
            if (/^<aside\b/i.test(trimmed) && /<\/aside>$/i.test(trimmed)) {
              const idMatch = trimmed.match(/\bid=["']([^"']+)["']/i);
              return h('aside', {
                key: index,
                'data-p': index,
                id: idMatch ? idMatch[1] : undefined,
                className: 'sr-aside-note',
                dangerouslySetInnerHTML: { __html: renderedHtml.replace(/^<aside\b[^>]*>/i, '').replace(/<\/aside>$/i, '') }
              });
            }
            if (trimmed.startsWith('<hr')) {
              return h('div', { key: index, 'data-p': index, className: 'sr-divider-wrap' }, h('hr', { className: 'sr-divider' }));
            }
            const pIdMatch = trimmed.match(/^<p\b[^>]*\bid=["']([^"']+)["']/i);
            const pClassMatch = trimmed.match(/^<p\b[^>]*\bclass=["']([^"']+)["']/i);
            const pInnerHtml = /^<p\b[^>]*>/i.test(renderedHtml)
              ? renderedHtml.replace(/^<p\b[^>]*>/i, '').replace(/<\/p>$/i, '')
              : renderedHtml;
            return h('p', {
              key: index,
              'data-p': index,
              id: pIdMatch ? pIdMatch[1] : undefined,
              className: pClassMatch ? pClassMatch[1] : undefined,
              dangerouslySetInnerHTML: { __html: pInnerHtml }
            });
          }

          // 2. Divider line (***, ---, ___, ❦, etc.)
          const isDivider = trimmed === '***' || trimmed === '---' || trimmed === '___' || trimmed === '———' || trimmed === '···' || trimmed === '❦' || trimmed === '~~~';
          if (isDivider) {
            return h('div', {
              key: index,
              'data-p': index,
              className: 'sr-divider-wrap',
            }, h('hr', { className: 'sr-divider' }));
          }

          // 2. Fenced code block (```lang ... ``` or ~~~lang ... ~~~)
          if ((trimmed.startsWith('```') || trimmed.startsWith('~~~')) && (text.includes('\n') || trimmed.length > 3)) {
            const lines = text.split('\n');
            const firstLine = lines[0].trim();
            const fence = firstLine.startsWith('```') ? '```' : '~~~';
            const lang = firstLine.slice(fence.length).trim();
            const lastLine = lines[lines.length - 1].trim();
            const codeLines = lines.slice(1, (lines.length > 1 && lastLine.startsWith(fence)) ? lines.length - 1 : lines.length);
            const codeContent = codeLines.join('\n');

            return h('div', {
              key: index,
              'data-p': index,
              className: 'sr-code-container',
              role: 'region',
              'aria-label': (lang ? lang + ' ' : '') + t('codeBlock'),
            },
              h('div', { className: 'sr-code-header' },
                h('span', { className: 'sr-code-lang' }, lang || 'CODE'),
                h('button', {
                  type: 'button',
                  className: 'sr-code-copy-btn',
                  'aria-label': t('copyShort'),
                  onClick: function onCopy(e) {
                    e.stopPropagation();
                    copyTextToClipboard(codeContent).then(function() {
                      props.showToast(t('copied'));
                    });
                  },
                }, t('copyShort')),
              ),
              h('pre', { className: 'sr-code-pre', tabIndex: 0 },
                h('code', { className: lang ? 'language-' + lang : undefined }, codeContent)
              )
            );
          }

          // 3. Math block ($$ ... $$)
          if (trimmed.startsWith('$$') && (trimmed.endsWith('$$') || text.includes('\n'))) {
            const mathContent = trimmed.replace(/^\$\$\s*/, '').replace(/\s*\$\$$/, '');
            return h('div', {
              key: index,
              'data-p': index,
              className: 'sr-math-block',
              role: 'math',
              'aria-label': t('mathFormula'),
              tabIndex: 0,
            },
              h('code', { className: 'sr-math-tex' }, mathContent)
            );
          }

          // 4. Markdown table (| col1 | col2 |\n| --- | --- |\n...)
          if (text.includes('|') && text.includes('\n')) {
            const tableData = parseMarkdownTable(text);
            if (tableData) {
              return h('div', {
                key: index,
                'data-p': index,
                className: 'sr-table-wrap',
                role: 'region',
                'aria-label': t('table'),
                tabIndex: 0,
              },
                h('table', { className: 'sr-table' },
                  h('thead', null,
                    h('tr', null,
                      tableData.headers.map(function(cell, cIdx) {
                        return h('th', { key: cIdx, style: { textAlign: cell.align } }, renderInline(cell.text, 'th-' + index + '-' + cIdx));
                      })
                    )
                  ),
                  h('tbody', null,
                    tableData.rows.map(function(row, rIdx) {
                      return h('tr', { key: rIdx },
                        row.map(function(cell, cIdx) {
                          return h('td', { key: cIdx, style: { textAlign: cell.align } }, renderInline(cell.text, 'td-' + index + '-' + rIdx + '-' + cIdx));
                        })
                      );
                    })
                  )
                )
              );
            }
          }

          // 5. Callouts (> [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION])
          if (/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i.test(trimmed)) {
            const calloutData = parseMarkdownCallout(text);
            if (calloutData) {
              const CALLOUT_ICONS = {
                note: 'ℹ️',
                tip: '💡',
                important: '❗',
                warning: '⚠️',
                caution: '🛑',
              };
              return h('div', {
                key: index,
                'data-p': index,
                className: 'sr-callout',
                'data-type': calloutData.type,
                role: 'note',
              },
                h('div', { className: 'sr-callout-title', style: { fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' } },
                  CALLOUT_ICONS[calloutData.type] || '💡',
                  ' ' + calloutData.type.toUpperCase()
                ),
                h('div', { className: 'sr-callout-body' },
                  calloutData.lines.map(function(line, lIdx) {
                    return h('p', { key: lIdx, style: { margin: '4px 0', textIndent: 0 } }, renderInline(line, 'callout-' + index + '-' + lIdx));
                  })
                )
              );
            }
          }

          // 6. Blockquote (> quote)
          if (trimmed.startsWith('>') && trimmed.split('\n').every(function(l) { return !l.trim() || l.trim().startsWith('>'); })) {
            const quoteText = text.split('\n').map(function(l) { return l.replace(/^\s*>\s?/, ''); }).join('\n');
            return h('blockquote', {
              key: index,
              'data-p': index,
              className: 'sr-quote',
            }, renderInline(quoteText, 'q-' + index));
          }

          // 7. Markdown list / task list
          if (text.includes('\n') || /^([-*+]|\d+\.)\s+/.test(trimmed)) {
            const listData = parseMarkdownList(text);
            if (listData) {
              const ListTag = listData.isOrdered ? 'ol' : 'ul';
              return h(ListTag, {
                key: index,
                'data-p': index,
                className: listData.hasTask ? 'sr-task-list' : undefined,
                style: { margin: 'calc(var(--sr-para-gap,.9em) * .8) 0', paddingLeft: '1.8em', textIndent: 0 },
              },
                listData.items.map(function(item, iIdx) {
                  if (item.isTask) {
                    return h('li', {
                      key: iIdx,
                      className: 'sr-task-item' + (item.checked ? ' sr-task-done' : ''),
                      style: { listStyleType: 'none', marginLeft: '-1.2em', display: 'flex', alignItems: 'baseline', gap: '8px' },
                    },
                      h('input', {
                        type: 'checkbox',
                        checked: item.checked,
                        disabled: true,
                        className: 'sr-task-checkbox',
                        'aria-label': item.text,
                      }),
                      h('span', null, renderInline(item.text, 'task-' + index + '-' + iIdx))
                    );
                  }
                  return h('li', { key: iIdx }, renderInline(item.text, 'li-' + index + '-' + iIdx));
                })
              );
            }
          }

          // 8. Subheadings (##, ###, etc.)
          const headingMatch = trimmed.match(/^(#{2,6})\s+(.+)$/);
          if (headingMatch) {
            const level = headingMatch[1].length;
            const headingClean = headingMatch[2].trim();
            const Tag = 'h' + Math.min(6, level + 1);
            return h(Tag, {
              key: index,
              'data-p': index,
              className: 'sr-subheading',
              id: 'h-' + index,
            }, segmentParagraph(headingClean, offsets.offsets[index], chapterHighlights));
          }

          // 9. Traditional verse & quotes
          const verse = text.indexOf('\n') >= 0 && (trimmed.charAt(0) === '《' || trimmed.startsWith('诗') || trimmed.startsWith('——'));
          const quote = (trimmed.length > 20 && ((trimmed.startsWith('“') && trimmed.endsWith('”')) || (trimmed.startsWith('「') && trimmed.endsWith('」')) || (trimmed.startsWith('『') && trimmed.endsWith('』')))) || trimmed.startsWith('》');
          const pClass = verse ? 'sr-verse' : (quote ? 'sr-quote' : undefined);

          // 10. Normal paragraph
          return h('p', {
            key: index,
            'data-p': index,
            className: pClass,
          }, segmentParagraph(text, offsets.offsets[index], chapterHighlights));
        });
      }, [chapter.id, chapter.paragraphs, chapter.images, chapterHighlights, offsets]);

      function drawerNotes() {
        const q = notesQuery.trim().toLowerCase();
        const filteredHighlights = bookHighlights
          .slice()
          .filter(function flt(n) {
            if (notesColorFilter === 'thought') return Boolean(n.note && n.note.trim());
            if (notesColorFilter !== 'all' && n.color !== notesColorFilter) return false;
            if (!q) return true;
            return (n.text && n.text.toLowerCase().includes(q)) || (n.note && n.note.toLowerCase().includes(q));
          })
          .sort(function order(a, b) { return a.chapterIndex - b.chapterIndex || a.start - b.start; });

        const filteredBookmarks = bookmarksForBook
          .slice()
          .filter(function flt(b) {
            if (!q) return true;
            return (b.chapterTitle && b.chapterTitle.toLowerCase().includes(q)) || (b.note && b.note.toLowerCase().includes(q)) || (b.excerpt && b.excerpt.toLowerCase().includes(q));
          });

        return h(React.Fragment, null,
          h('div', { className: 'sr-scrim', onClick: function close() { setDrawer(null); } }),
          h('aside', { className: 'sr-drawer sr-drawer--right', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('bookNotes') },
            h('div', { className: 'sr-drawer-head' },
              h('div', { className: 'sr-drawer-head-main' },
                h('div', { className: 'sr-drawer-kicker' }, book.author),
                h('h2', null, t('bookNotes')),
                h('p', null, book.title),
              ),
              h('button', { type: 'button', className: 'sr-reader-icon', onClick: function close() { setDrawer(null); }, title: t('closePanel'), 'aria-label': t('closePanel') },
                h(Icon, { name: 'close', size: 16 }),
              ),
            ),
            h('div', { className: 'sr-drawer-tabs' },
              h('button', { type: 'button', className: 'sr-drawer-tab', 'aria-pressed': notesTab === 'highlights', onClick: function tab() { setNotesTab('highlights'); } },
                t('highlightCount', { n: filteredHighlights.length }),
              ),
              h('button', { type: 'button', className: 'sr-drawer-tab', 'aria-pressed': notesTab === 'bookmarks', onClick: function tab() { setNotesTab('bookmarks'); } },
                t('bookmarkCount', { n: filteredBookmarks.length }),
              ),
            ),
            (bookHighlights.length > 0 || bookmarksForBook.length > 0) ? h('div', { className: 'sr-notes-filter-box' },
              h('div', { className: 'sr-notes-search-field' },
                h(Icon, { name: 'search', size: 12 }),
                h('input', {
                  type: 'text',
                  value: notesQuery,
                  placeholder: t('searchNotesPlaceholder'),
                  onChange: function onQ(e) { setNotesQuery(e.target.value); },
                }),
                notesQuery ? h('button', {
                  type: 'button',
                  className: 'sr-toc-search-clear',
                  onClick: function clear() { setNotesQuery(''); },
                  title: t('clearSearch'),
                  'aria-label': t('clearSearch'),
                }, h(Icon, { name: 'close', size: 10 })) : null,
              ),
              notesTab === 'highlights' && bookHighlights.length > 0 ? h('div', { className: 'sr-notes-filter-chips', role: 'group', 'aria-label': t('filterAll') },
                h('button', {
                  type: 'button',
                  className: 'sr-notes-chip',
                  'data-active': notesColorFilter === 'all' ? 'true' : 'false',
                  onClick: function setAll() { setNotesColorFilter('all'); },
                }, t('filterAll')),
                h('button', {
                  type: 'button',
                  className: 'sr-notes-chip',
                  'data-active': notesColorFilter === 'thought' ? 'true' : 'false',
                  onClick: function setThought() { setNotesColorFilter(notesColorFilter === 'thought' ? 'all' : 'thought'); },
                }, '💭 ' + t('thought')),
                HIGHLIGHT_COLORS.map(function dot(c) {
                  return h('button', {
                    key: c.id,
                    type: 'button',
                    className: 'sr-notes-chip sr-notes-chip--color',
                    'data-active': notesColorFilter === c.id ? 'true' : 'false',
                    style: { '--sr-chip-color': c.value },
                    onClick: function pickColor() { setNotesColorFilter(notesColorFilter === c.id ? 'all' : c.id); },
                    title: c.id,
                    'aria-label': c.id,
                  }, h('span', { className: 'sr-notes-color-pip' }));
                }),
              ) : null,
            ) : null,
            notesTab === 'highlights'
              ? h('div', { className: 'sr-drawer-body' },
                filteredHighlights.length === 0
                  ? h('div', { className: 'sr-drawer-empty' }, h(Icon, { name: 'pen', size: 24 }), h('div', null, t('noHighlights')))
                  : filteredHighlights
                    .map(function item(note) {
                      const color = HIGHLIGHT_COLORS.find(function find(entry) { return entry.id === note.color; }) || HIGHLIGHT_COLORS[0];
                      const noteChapter = chapters[note.chapterIndex];
                      return h('article', { key: note.id, className: 'sr-drawer-note', style: { '--sr-hl': color.value } },
                        h('p', { className: 'sr-drawer-note-quote' }, note.text),
                        note.note ? h('div', { className: 'sr-drawer-note-thought' }, note.note) : null,
                        h('div', { className: 'sr-drawer-note-foot' },
                          h('span', { className: 'sr-drawer-note-meta' }, (noteChapter ? noteChapter.title : '') + ' · ' + dateLabel(note.createdAt)),
                          h('div', { className: 'sr-drawer-note-actions' },
                            h('button', { type: 'button', className: 'sr-mini-action', onClick: function jump() { setJumpReturn({ chapterIndex: chapterIndex, page: page }); jumpToHighlight(note); } }, t('jumpToText')),
                            h('button', {
                              type: 'button',
                              className: 'sr-mini-action',
                              title: t('copyQuote'),
                              onClick: function copy() {
                                const quote = buildQuoteText(note.text, book.title, noteChapter ? noteChapter.title : '');
                                copyTextToClipboard(quote).then(function done(ok) {
                                  props.showToast(ok ? t('quoteCopied') : t('copyFailed'));
                                });
                              },
                            }, t('copyQuote')),
                            h('button', { type: 'button', className: 'sr-mini-action', onClick: function edit() { openThoughtEditor(note); } }, note.note ? t('editThought') : t('addNote')),
                            h('button', { type: 'button', className: 'sr-mini-action', 'data-danger': 'true', onClick: function remove() { props.deleteHighlight(note.id); } }, t('delete')),
                          ),
                        ),
                      );
                    }),
              )
              : h('div', { className: 'sr-drawer-body' },
                filteredBookmarks.length === 0
                  ? h('div', { className: 'sr-drawer-empty' }, h(Icon, { name: 'bookmark', size: 24 }), h('div', null, t('noBookmarks')))
                  : filteredBookmarks.map(function bookmark(item) {
                    return h('div', { key: item.id, className: 'sr-bookmark-row' },
                      h('button', { type: 'button', className: 'sr-bookmark-main', onClick: function jump() { setJumpReturn({ chapterIndex: chapterIndex, page: page }); goChapter(item.chapterIndex, 'percent', item.percent); } },
                        h('strong', null, item.chapterTitle || (chapters[item.chapterIndex] ? chapters[item.chapterIndex].title : '')),
                        item.excerpt ? h('span', { className: 'sr-bookmark-excerpt' }, item.excerpt) : null,
                        item.note ? h('span', { className: 'sr-bookmark-note' }, item.note) : null,
                        h('small', null, fill(t('bookmarkPage'), { n: item.page }) + ' · ' + dateLabel(item.createdAt)),
                      ),
                      h('button', { type: 'button', className: 'sr-mini-action', onClick: function editNote() { setBookmarkDraft({ id: item.id, note: item.note || '', chapterTitle: item.chapterTitle, page: item.page }); } }, t('bookmarkNote')),
                      h('button', { type: 'button', className: 'sr-mini-action', 'data-danger': 'true', onClick: function remove() { props.removeBookmark(item.id); } }, t('delete')),
                    );
                  }),
              ),
            h('div', { className: 'sr-drawer-foot' },
              h('span', null, t('savedLocally')),
              bookHighlights.length > 0 || bookmarksForBook.length > 0 ? h('button', {
                type: 'button',
                className: 'sr-mini-action sr-export-notes-btn',
                onClick: function exportNotes() {
                  const toExport = filteredHighlights.length > 0 ? filteredHighlights : bookHighlights;
                  let md = '# 《' + (book.title || '') + '》' + (t('notes') || '笔记') + '\n\n';
                  if (book.author) md += '> ' + t('author') + '：' + book.author + '\n\n';
                  if (toExport.length > 0) {
                    md += '## ' + t('highlight') + ' (' + toExport.length + ')\n\n';
                    toExport.forEach(function entry(n) {
                      const cTitle = chapters[n.chapterIndex] ? chapters[n.chapterIndex].title : '';
                      md += '- **[' + cTitle + ']** ' + n.text.trim() + '\n';
                      if (n.note) md += '  > 💭 ' + n.note.trim() + '\n';
                      md += '\n';
                    });
                  }
                  if (filteredBookmarks.length > 0) {
                    md += '## ' + t('bookmark') + ' (' + filteredBookmarks.length + ')\n\n';
                    filteredBookmarks.forEach(function bm(b) {
                      md += '- **' + (b.chapterTitle || '') + '** (p.' + (b.page + 1) + ')' + (b.note ? '：' + b.note : '') + '\n';
                    });
                  }
                  copyTextToClipboard(md).then(function done(ok) {
                    props.showToast(ok ? t('exportNotesDone') : t('copyFailed'));
                  });
                },
              }, h(Icon, { name: 'download', size: 11 }), h('span', null, t('exportNotesMd'))) : null,
            ),
          ),
        );
      }

      function drawerContents() {
        const overview = chapterOverview(book, chapterIndex, props.highlights, props.bookmarks);
        const marks = props.chapterMarks || {};
        const needle = tocQuery.trim().toLowerCase();
        const visible = overview.filter(function match(item) {
          if (tocOnlyNotes && !item.current && item.notes <= 0 && item.bookmarks <= 0) return false;
          if (!needle) return true;
          return item.title.toLowerCase().indexOf(needle) >= 0;
        });
        const readCount = overview.filter(function read(item) { return item.read; }).length;
        return h(React.Fragment, null,
          h('div', { className: 'sr-scrim', onClick: function close() { setDrawer(null); } }),
          h('aside', { className: 'sr-drawer', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('readerToc') },
            h('div', { className: 'sr-drawer-head' },
              h('div', { className: 'sr-drawer-head-main' },
                h('div', { className: 'sr-drawer-kicker' }, book.author),
                h('h2', null, t('chapterList')),
                h('p', null, book.title + ' · ' + t('bookChapters', { n: chapters.length })),
              ),
              h('button', { type: 'button', className: 'sr-reader-icon', onClick: function close() { setDrawer(null); }, title: t('closePanel'), 'aria-label': t('closePanel') },
                h(Icon, { name: 'close', size: 16 }),
              ),
            ),
            h('div', { className: 'sr-toc-tools' },
              h('span', { className: 'sr-toc-summary' }, fill(t('tocReadProgress'), { read: readCount, total: chapters.length })),
              h('button', {
                type: 'button',
                className: 'sr-toc-filter',
                'aria-pressed': tocOnlyNotes ? 'true' : 'false',
                onClick: function toggle() { setTocOnlyNotes(!tocOnlyNotes); },
              }, h(Icon, { name: 'pen', size: 10 }), t('tocOnlyNotes')),
            ),
            h('div', { className: 'sr-toc-search' },
              h(Icon, { name: 'search', size: 13 }),
              h('input', {
                type: 'search',
                value: tocQuery,
                placeholder: t('tocSearchPlaceholder'),
                'aria-label': t('tocSearchPlaceholder'),
                onChange: function change(event) { setTocQuery(event.target.value); },
              }),
              tocQuery ? h('button', {
                type: 'button',
                className: 'sr-toc-search-clear',
                onClick: function clear() { setTocQuery(''); },
                title: t('searchClear'),
                'aria-label': t('searchClear'),
              }, h(Icon, { name: 'close', size: 11 })) : null,
              tocQuery.trim() && !visible.length ? h('span', { className: 'sr-toc-search-empty' }, t('tocNoMatch')) : null,
            ),
            h('div', { className: 'sr-drawer-body' },
              visible.map(function row(item) {
                const marked = chapterResumePercent(marks, item.id);
                const fillRatio = item.current ? progressPercentValue : (marked > 0 ? marked : (item.read ? 1 : 0));
                return h('button', {
                  key: item.id,
                  type: 'button',
                  className: 'sr-toc-row',
                  'data-current': item.current ? 'true' : 'false',
                  'data-read': item.read ? 'true' : 'false',
                  title: item.current
                    ? t('currentChapter')
                    : (marked > 0 ? fill(t('tocReadPercent'), { n: Math.round(marked * 100) }) : ''),
                  onClick: function open() { setJumpReturn({ chapterIndex: chapterIndex, page: page }); goChapter(item.index, 'resume'); },
                },
                  h('span', { className: 'sr-toc-num' }, item.read ? h(Icon, { name: 'check', size: 10 }) : String(item.index + 1).padStart(2, '0')),
                  h('span', { className: 'sr-toc-copy' },
                    h('strong', null, item.title),
                    h('small', null, fill(t('estimatedMinutes'), { n: item.minutes }) + (marked > 0 && !item.current ? ' · ' + fill(t('tocReadPercent'), { n: Math.round(marked * 100) }) : '')),
                    fillRatio > 0
                      ? h('span', { className: 'sr-toc-progress', 'aria-hidden': 'true' },
                        h('span', { className: 'sr-toc-progress-fill', style: { width: Math.max(2, Math.round(fillRatio * 100)) + '%' } }),
                      )
                      : null,
                  ),
                  h('span', { className: 'sr-toc-badges' },
                    item.notes ? h('span', { className: 'sr-toc-badge', title: t('highlight') }, h(Icon, { name: 'pen', size: 9 }), item.notes) : null,
                    item.bookmarks ? h('span', { className: 'sr-toc-badge', title: t('bookmark') }, h(Icon, { name: 'bookmark', size: 9 }), item.bookmarks) : null,
                  ),
                  item.current ? h('span', { className: 'sr-toc-mark' }) : null,
                );
              }),
            ),
            h('div', { className: 'sr-drawer-foot' }, t('readerHint')),
          ),
        );
      }

      function jumpToSearchResult(item, index, keepDrawer) {
        if (!item) return;
        if (Number.isFinite(index)) setSearchCursor(index);
        const percent = item.chapterLength ? clamp(item.start / item.chapterLength, 0, 1) : 0;
        goChapter(item.chapterIndex, 'percent', percent, keepDrawer === true);
      }

      // Enter steps forward, Shift+Enter steps back; both wrap around the result list.
      function stepSearchResult(direction) {
        const list = searchResult.results;
        if (!list.length) return;
        const next = stepIndex(searchCursor, list.length, direction);
        jumpToSearchResult(list[next], next, true);
      }

      function drawerSearch() {
        const isChapter = searchScope === 'chapter';
        const results = searchResult.results;
        return h(React.Fragment, null,
          h('div', { className: 'sr-scrim', onClick: function close() { setDrawer(null); } }),
          h('aside', { className: 'sr-drawer sr-drawer--right sr-drawer--search', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('searchInBook') },
            h('div', { className: 'sr-drawer-head' },
              h('div', { className: 'sr-drawer-head-main' },
                h('div', { className: 'sr-drawer-kicker' }, book.title),
                h('h2', null, t('searchInBook')),
                h('p', null, searchText ? (fill(t('searchResultCount'), { n: results.length }) + (isChapter ? ' (' + t('searchScopeChapter') + ')' : '')) : t('searchHint')),
              ),
              h('button', { type: 'button', className: 'sr-reader-icon', onClick: function close() { setDrawer(null); }, title: t('closePanel'), 'aria-label': t('closePanel') },
                h(Icon, { name: 'close', size: 16 }),
              ),
            ),
            h('div', { className: 'sr-drawer-body sr-search-body' },
              h('div', { className: 'sr-search-field' },
                h(Icon, { name: 'search', size: 14 }),
                h('input', {
                  ref: searchRef,
                  type: 'search',
                  value: searchQuery,
                  placeholder: t('searchBookPlaceholder'),
                  'aria-label': t('searchBookPlaceholder'),
                  onChange: function change(event) { setSearchQuery(event.target.value); setSearchCursor(-1); },
                  onKeyDown: function keys(event) {
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      setDrawer(null);
                      return;
                    }
                    if (event.key === 'Enter' && results.length) {
                      event.preventDefault();
                      stepSearchResult(event.shiftKey ? -1 : 1);
                      return;
                    }
                    if (event.key === 'F3' || ((event.metaKey || event.ctrlKey) && (event.key === 'g' || event.key === 'G'))) {
                      event.preventDefault();
                      stepSearchResult(event.shiftKey ? -1 : 1);
                    }
                  },
                }),
                results.length ? h('div', { className: 'sr-search-nav' },
                  h('span', { className: 'sr-search-nav-count' }, (searchCursor >= 0 ? searchCursor + 1 : 0) + ' / ' + results.length),
                  h('button', {
                    type: 'button',
                    className: 'sr-search-step',
                    title: t('searchPrevHit'),
                    'aria-label': t('searchPrevHit'),
                    onClick: function prev() { stepSearchResult(-1); },
                  }, h(Icon, { name: 'chevron-left', size: 12 })),
                  h('button', {
                    type: 'button',
                    className: 'sr-search-step',
                    title: t('searchNextHit'),
                    'aria-label': t('searchNextHit'),
                    onClick: function next() { stepSearchResult(1); },
                  }, h(Icon, { name: 'chevron-right', size: 12 })),
                ) : null,
                searchQuery ? h('button', {
                  type: 'button',
                  className: 'sr-search-clear',
                  onClick: function clear() { setSearchQuery(''); setSearchText(''); setSearchCursor(-1); if (searchRef.current) searchRef.current.focus(); },
                  title: t('searchClear'),
                  'aria-label': t('searchClear'),
                }, h(Icon, { name: 'close', size: 12 })) : null,
              ),
              chapters.length > 1 ? h('div', { className: 'sr-search-scopes', role: 'tablist', 'aria-label': t('searchScope') },
                h('button', {
                  type: 'button',
                  role: 'tab',
                  className: 'sr-search-scope' + (!isChapter ? ' is-active' : ''),
                  'aria-selected': !isChapter ? 'true' : 'false',
                  onClick: function setBookScope() {
                    if (!isChapter) return;
                    setSearchScope('book');
                    setSearchCursor(-1);
                  },
                },
                  h('span', null, t('searchScopeBook')),
                  searchText ? h('span', { className: 'sr-search-scope-count' }, searchResultAll.results.length + (searchResultAll.truncated ? '+' : '')) : null,
                ),
                h('button', {
                  type: 'button',
                  role: 'tab',
                  className: 'sr-search-scope' + (isChapter ? ' is-active' : ''),
                  'aria-selected': isChapter ? 'true' : 'false',
                  onClick: function setChapterScope() {
                    if (isChapter) return;
                    setSearchScope('chapter');
                    setSearchCursor(-1);
                  },
                },
                  h('span', null, t('searchScopeChapter')),
                  searchText ? h('span', { className: 'sr-search-scope-count' }, searchResultChapter.results.length + (searchResultChapter.truncated ? '+' : '')) : null,
                ),
              ) : null,
              !searchText
                ? h('div', { className: 'sr-search-empty' },
                  h(Icon, { name: 'search', size: 27 }),
                  h('p', null, t('searchHint')),
                  quickKeywords.length ? h('div', { className: 'sr-search-suggest-box' },
                    h('span', { className: 'sr-search-suggest-title' }, t('quickKeywords')),
                    h('div', { className: 'sr-search-suggest-chips' },
                      quickKeywords.map(function word(kw) {
                        return h('button', {
                          key: kw,
                          type: 'button',
                          className: 'sr-search-suggest-chip',
                          onClick: function pickKeyword() {
                            setSearchQuery(kw);
                            setSearchText(kw);
                          },
                        }, kw);
                      }),
                    ),
                  ) : null,
                )
                : results.length === 0
                  ? h('div', { className: 'sr-search-empty' },
                    h(Icon, { name: 'quote', size: 27 }),
                    h('strong', null, isChapter ? t('searchNoChapterResult') : t('searchNoResult')),
                    h('p', null, isChapter ? t('searchNoChapterResultHint') : t('searchNoResultHint')),
                  )
                  : h(React.Fragment, null,
                    h('div', { className: 'sr-search-meta', role: 'status' },
                      h('span', null, fill(t('searchResultCount'), { n: results.length }) + (isChapter ? ' · ' + chapter.title : '')),
                      searchResult.truncated ? h('span', null, fill(t('searchTruncated'), { n: results.length })) : null,
                    ),
                    h('div', { className: 'sr-search-results' },
                      results.map(function row(item, index) {
                        return h('button', {
                          key: item.chapterId + '-' + item.start + '-' + index,
                          type: 'button',
                          className: 'sr-search-result',
                          'data-active': index === searchCursor ? 'true' : 'false',
                          onClick: function jump() { setJumpReturn({ chapterIndex: chapterIndex, page: page }); jumpToSearchResult(item, index); },
                        },
                          h('div', { className: 'sr-search-result-head' },
                            h('span', { className: 'sr-search-result-chapter' }, item.chapterTitle),
                            h('div', { className: 'sr-search-result-actions' },
                              h('button', {
                                type: 'button',
                                className: 'sr-search-copy-btn',
                                title: t('copyQuote'),
                                'aria-label': t('copyQuote'),
                                onClick: function copy(event) {
                                  event.stopPropagation();
                                  event.preventDefault();
                                  const isExpanded = index === searchCursor;
                                  const lead = isExpanded ? (item.wideBefore || item.before) : item.before;
                                  const tail = isExpanded ? (item.wideAfter || item.after) : item.after;
                                  const snippet = (lead + item.match + tail).trim();
                                  const quote = buildQuoteText(snippet, book.title, item.chapterTitle);
                                  copyTextToClipboard(quote).then(function done(ok) {
                                    props.showToast(ok ? t('quoteCopied') : t('copyFailed'));
                                  });
                                },
                              }, h(Icon, { name: 'copy', size: 12 })),
                              h('span', { className: 'sr-search-result-index' }, String(index + 1).padStart(2, '0')),
                            ),
                          ),
                          h('p', { className: 'sr-search-result-text' },
                            index === searchCursor ? (item.wideBefore || item.before) : item.before,
                            h('mark', null, item.match),
                            index === searchCursor ? (item.wideAfter || item.after) : item.after,
                          ),
                        );
                      }),
                    ),
                  ),
            ),
            h('div', { className: 'sr-drawer-foot' }, t('readerHint')),
          ),
        );
      }

      function settingsSheet() {
        return h(React.Fragment, null,
          h('div', { className: 'sr-sheet-scrim', onClick: function close() { setSettingsOpen(false); } }),
          h('div', { className: 'sr-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('readerSettings') },
            h('div', { className: 'sr-sheet-head' },
              h('strong', null, t('readerSettings')),
              h('div', { className: 'sr-sheet-head-actions' },
                h('button', {
                  type: 'button',
                  className: 'sr-reader-icon',
                  onClick: function help() { setSettingsOpen(false); setHelpOpen(true); },
                  title: t('shortcuts'),
                  'aria-label': t('shortcuts'),
                }, h(Icon, { name: 'help', size: 16 })),
                h('button', { type: 'button', className: 'sr-reader-icon', onClick: function close() { setSettingsOpen(false); }, title: t('close'), 'aria-label': t('close') },
                  h(Icon, { name: 'close', size: 16 }),
                ),
              ),
            ),
            h('div', { className: 'sr-setting-group' },
              h('div', { className: 'sr-setting-label' },
                t('theme'),
                h('span', null, settings.theme === 'auto'
                  ? (t('themeAuto') + ' · ' + t('theme' + activeThemeId.charAt(0).toUpperCase() + activeThemeId.slice(1)))
                  : t('theme' + activeThemeId.charAt(0).toUpperCase() + activeThemeId.slice(1)))
              ),
              h('div', { className: 'sr-theme-grid' },
                READER_THEMES.map(function swatch(themeItem) {
                  return h('button', {
                    key: themeItem.id,
                    type: 'button',
                    className: 'sr-theme-swatch',
                    'aria-pressed': settings.theme === themeItem.id,
                    'aria-label': t('theme' + themeItem.id.charAt(0).toUpperCase() + themeItem.id.slice(1)),
                    style: { '--sw-bg': themeItem.bg, '--sw-ink': themeItem.ink },
                    onClick: function pick() { applySettings({ theme: themeItem.id }); },
                  },
                    h('span', null, t('theme' + themeItem.id.charAt(0).toUpperCase() + themeItem.id.slice(1))),
                    settings.theme === themeItem.id ? h('span', { className: 'sr-theme-check', 'aria-hidden': 'true' }, h(Icon, { name: 'check', size: 10 })) : null,
                  );
                }),
                h('button', {
                  key: 'auto',
                  type: 'button',
                  className: 'sr-theme-swatch sr-theme-swatch--auto',
                  'aria-pressed': settings.theme === 'auto',
                  'aria-label': t('themeAuto'),
                  title: t('themeAuto'),
                  style: { '--sw-bg': 'linear-gradient(to right, #f3ede2 0%, #f3ede2 50%, #151a1d 50%, #151a1d 100%)', '--sw-ink': '#322920' },
                  onClick: function pick() { applySettings({ theme: 'auto' }); },
                },
                  h('span', null, t('themeAuto')),
                  settings.theme === 'auto' ? h('span', { className: 'sr-theme-check', 'aria-hidden': 'true' }, h(Icon, { name: 'check', size: 10 })) : null,
                ),
              ),
            ),
            h('div', { className: 'sr-setting-group' },
              h('div', { className: 'sr-setting-label' }, t('highlightColor')),
              h('div', { className: 'sr-setting-color-row' },
                HIGHLIGHT_COLORS.map(function colorDot(color) {
                  return h('button', {
                    key: color.id,
                    type: 'button',
                    className: 'sr-setting-color',
                    style: { background: color.value },
                    'aria-pressed': (settings.highlightColor || 'amber') === color.id,
                    'aria-label': t('color' + color.id.charAt(0).toUpperCase() + color.id.slice(1)),
                    title: t('color' + color.id.charAt(0).toUpperCase() + color.id.slice(1)),
                    onClick: function pick() { applySettings({ highlightColor: color.id }); },
                  });
                }),
              ),
            ),
            h('div', { className: 'sr-setting-group' },
              h('div', { className: 'sr-setting-label' }, t('fontSize'), h('span', null, settings.fontSize + 'px')),
              h('div', { className: 'sr-font-row' },
                h('div', { className: 'sr-font-sample' }, t('fontPreview'), h('small', null, t('readerHint'))),
                h('div', { className: 'sr-stepper' },
                  h('button', { type: 'button', className: 'sr-step-btn', 'aria-label': t('decreaseFont'), onClick: function smaller() { changeFontSize(-1); } }, h(Icon, { name: 'minus', size: 13 })),
                  h('span', { className: 'sr-step-value' }, String(settings.fontSize)),
                  h('button', { type: 'button', className: 'sr-step-btn', 'aria-label': t('increaseFont'), onClick: function larger() { changeFontSize(1); } }, h(Icon, { name: 'plus', size: 13 })),
                ),
              ),
            ),
            h('div', { className: 'sr-setting-group' },
              h('div', { className: 'sr-setting-label' }, t('lineHeight')),
              h('div', { className: 'sr-font-row' },
                h('div', { className: 'sr-font-sample', style: { fontSize: '12px', opacity: .7 } }, settings.lineHeight.toFixed(2)),
                h('div', { className: 'sr-segment' },
                  [{ value: 1.7, key: 'lineCompact' }, { value: 1.95, key: 'lineNormal' }, { value: 2.2, key: 'lineLoose' }].map(function option(item) {
                    return h('button', {
                      key: item.key,
                      type: 'button',
                      'aria-pressed': Math.abs(settings.lineHeight - item.value) < 0.01,
                      onClick: function pick() { applySettings({ lineHeight: item.value }); },
                    }, t(item.key));
                  }),
                ),
              ),
            ),
            h('div', { className: 'sr-setting-group' },
              h('div', { className: 'sr-setting-label' }, t('fontFamily')),
              h('div', { className: 'sr-segment', style: { width: '100%' } },
                h('button', { type: 'button', 'aria-pressed': settings.fontFamily === 'serif', onClick: function serif() { applySettings({ fontFamily: 'serif' }); }, style: { flex: 1 } }, t('fontSerif')),
                h('button', { type: 'button', 'aria-pressed': settings.fontFamily === 'sans', onClick: function sans() { applySettings({ fontFamily: 'sans' }); }, style: { flex: 1 } }, t('fontSans')),
                h('button', { type: 'button', 'aria-pressed': settings.fontFamily === 'kai', onClick: function kai() { applySettings({ fontFamily: 'kai' }); }, style: { flex: 1 } }, t('fontKai')),
                h('button', { type: 'button', 'aria-pressed': settings.fontFamily === 'dyslexic', onClick: function dyslexic() { applySettings({ fontFamily: 'dyslexic' }); }, style: { flex: 1 } }, t('fontDyslexic')),
                h('button', { type: 'button', 'aria-pressed': settings.fontFamily === 'system', onClick: function system() { applySettings({ fontFamily: 'system' }); }, style: { flex: 1 } }, t('fontSystem')),
              ),
            ),
            h('div', { className: 'sr-setting-group' },
              h('div', { className: 'sr-setting-label' }, t('letterSpacing'), h('span', null, settings.letterSpacing.toFixed(2) + 'em')),
              h('div', { className: 'sr-segment', style: { width: '100%' } },
                [{ value: 0.01, key: 'lineCompact' }, { value: 0.03, key: 'lineNormal' }, { value: 0.06, key: 'lineLoose' }].map(function option(item) {
                  return h('button', {
                    key: item.key,
                    type: 'button',
                    'aria-pressed': Math.abs(settings.letterSpacing - item.value) < 0.004,
                    onClick: function pick() { applySettings({ letterSpacing: item.value }); },
                    style: { flex: 1 },
                  }, t(item.key));
                }),
              ),
            ),
            h('div', { className: 'sr-setting-group' },
              h('div', { className: 'sr-setting-label' }, t('paragraphSpacing'), h('span', null, settings.paragraphSpacing.toFixed(2) + 'em')),
              h('div', { className: 'sr-segment', style: { width: '100%' } },
                [{ value: 0.65, key: 'lineCompact' }, { value: 0.9, key: 'lineNormal' }, { value: 1.25, key: 'lineLoose' }].map(function option(item) {
                  return h('button', {
                    key: item.key,
                    type: 'button',
                    'aria-pressed': Math.abs(settings.paragraphSpacing - item.value) < 0.02,
                    onClick: function pick() { applySettings({ paragraphSpacing: item.value }); },
                    style: { flex: 1 },
                  }, t(item.key));
                }),
              ),
            ),
            h('div', { className: 'sr-setting-group' },
              h('div', { className: 'sr-setting-label' }, t('pageWidth')),
              h('div', { className: 'sr-segment', style: { width: '100%' } },
                [{ value: 'compact', key: 'lineCompact' }, { value: 'comfortable', key: 'lineNormal' }, { value: 'wide', key: 'lineLoose' }].map(function option(item) {
                  return h('button', {
                    key: item.value,
                    type: 'button',
                    'aria-pressed': settings.pageWidth === item.value,
                    onClick: function pick() { applySettings({ pageWidth: item.value }); },
                    style: { flex: 1 },
                  }, t(item.key));
                }),
              ),
            ),
            h('div', { className: 'sr-setting-group' },
              h('div', { className: 'sr-setting-label' }, t('textAlign')),
              h('div', { className: 'sr-segment', style: { width: '100%' } },
                h('button', {
                  type: 'button',
                  'aria-pressed': (settings.textAlign || 'justify') === 'justify',
                  onClick: function justify() { applySettings({ textAlign: 'justify' }); },
                  style: { flex: 1 },
                }, t('alignJustify')),
                h('button', {
                  type: 'button',
                  'aria-pressed': settings.textAlign === 'left',
                  onClick: function left() { applySettings({ textAlign: 'left' }); },
                  style: { flex: 1 },
                }, t('alignLeft')),
              ),
            ),
            h('div', { className: 'sr-setting-group' },
              h('div', { className: 'sr-setting-toggle-row' },
                h('div', null,
                  h('div', { className: 'sr-setting-label', style: { marginBottom: '3px' } }, t('autoHideChrome')),
                  h('p', { className: 'sr-setting-hint' }, t('autoHideChromeHint')),
                ),
                h('button', {
                  type: 'button',
                  role: 'switch',
                  className: 'sr-switch',
                  'aria-checked': settings.autoHideChrome,
                  'aria-label': t('autoHideChrome'),
                  onClick: function toggle() { applySettings({ autoHideChrome: !settings.autoHideChrome }); },
                }, h('span', { className: 'sr-switch-thumb' })),
              ),
            ),
            h('div', { className: 'sr-setting-group' },
              h('div', { className: 'sr-setting-toggle-row' },
                h('div', null,
                  h('div', { className: 'sr-setting-label', style: { marginBottom: '3px' } }, t('paperSound')),
                  h('p', { className: 'sr-setting-hint' }, t('paperSoundHint')),
                ),
                h('button', {
                  type: 'button',
                  role: 'switch',
                  className: 'sr-switch',
                  'aria-checked': settings.paperSound === true,
                  'aria-label': t('paperSound'),
                  onClick: function toggleSound() { applySettings({ paperSound: !settings.paperSound }); },
                }, h('span', { className: 'sr-switch-thumb' })),
              ),
            ),
            h('div', { className: 'sr-setting-group' },
              h('div', { className: 'sr-setting-toggle-row' },
                h('div', null,
                  h('div', { className: 'sr-setting-label', style: { marginBottom: '3px' } }, t('readingRuler')),
                  h('p', { className: 'sr-setting-hint' }, t('readingRulerHint')),
                ),
                h('button', {
                  type: 'button',
                  role: 'switch',
                  className: 'sr-switch',
                  'aria-checked': Boolean(settings.readingRuler || rulerOpen),
                  'aria-label': t('readingRuler'),
                  onClick: function toggleRuler() {
                    const next = !(settings.readingRuler || rulerOpen);
                    setRulerOpen(next);
                    applySettings({ readingRuler: next });
                    props.showToast(next ? t('rulerOn') : t('rulerOff'));
                  },
                }, h('span', { className: 'sr-switch-thumb' })),
              ),
            ),
            h('div', { className: 'sr-setting-group' },
              h('div', { className: 'sr-setting-label' }, t('speechVoice')),
              voices.length
                ? h('select', {
                  className: 'sr-setting-select',
                  value: settings.speechVoice || '',
                  'aria-label': t('speechVoice'),
                  onChange: function change(event) { applySettings({ speechVoice: event.target.value }); },
                },
                  h('option', { value: '' }, t('systemVoiceDefault')),
                  voices.map(function voice(item) {
                    return h('option', { key: item.voiceURI || item.name, value: item.voiceURI || item.name },
                      item.name + ' · ' + item.lang,
                    );
                  }),
                )
                : h('p', { className: 'sr-setting-hint' }, t('noVoices')),
            ),
            h('div', { className: 'sr-sheet-foot' },
              h('button', {
                type: 'button',
                className: 'sr-text-btn',
                onClick: function resetSettings() {
                  applySettings({
                    theme: 'paper',
                    fontSize: 19,
                    lineHeight: 1.95,
                    fontFamily: 'serif',
                    letterSpacing: 0.02,
                    paragraphSpacing: 0.9,
                    pageWidth: 'comfortable',
                    textAlign: 'justify',
                    autoHideChrome: false,
                    paperSound: false,
                    readingRuler: false,
                  });
                  props.showToast(t('settingsReset'));
                },
              }, h(Icon, { name: 'refresh', size: 11 }), h('span', null, t('resetSettings'))),
              h('p', { className: 'sr-sheet-note' }, t('savedLocally')),
            ),
          ),
        );
      }

      function toggleFullscreen() {
        const element = readerRef.current;
        if (!element) return;
        try {
          if (document.fullscreenElement) {
            const exit = document.exitFullscreen();
            if (exit && exit.catch) exit.catch(function failed() { props.showToast(t('fullscreenUnsupported')); });
          } else if (element.requestFullscreen) {
            const request = element.requestFullscreen();
            if (request && request.catch) request.catch(function failed() { props.showToast(t('fullscreenUnsupported')); });
          } else {
            props.showToast(t('fullscreenUnsupported'));
          }
        } catch (error) {
          props.showToast(t('fullscreenUnsupported'));
        }
      }

      function shortcutHelp() {
        const rows = [
          { category: 'nav', label: t('shortcutTurnPages'), keys: ['←/→', '↑/↓', 'J/K', 'Space', 'PgUp/PgDn'] },
          { category: 'nav', label: t('shortcutFirstPage') + ' / ' + t('shortcutLastPage'), keys: ['Home', 'End'] },
          { category: 'nav', label: t('prevChapter') + ' / ' + t('nextChapter'), keys: ['[', ']'] },
          { category: 'nav', label: t('shortcutPageJump'), keys: ['G'] },
          { category: 'nav', label: t('shortcutToc'), keys: ['T'] },
          { category: 'nav', label: t('returnPreviousReadLabel'), keys: ['U', 'Backspace'] },
          { category: 'view', label: t('shortcutFont'), keys: ['-', '=', '0'] },
          { category: 'view', label: t('shortcutChrome'), keys: ['H'] },
          { category: 'view', label: t('shortcutFullscreen'), keys: ['F'] },
          { category: 'view', label: t('shortcutRuler'), keys: ['L'] },
          { category: 'tools', label: t('shortcutSearch'), keys: ['⌘/Ctrl', 'F'] },
          { category: 'tools', label: t('searchNextHit') + ' / ' + t('searchPrevHit'), keys: ['↵', '⇧↵'] },
          { category: 'tools', label: t('shortcutBookmark'), keys: ['B'] },
          { category: 'tools', label: t('shortcutSpeech'), keys: ['R'] },
          { category: 'tools', label: t('shortcutClose'), keys: ['Esc'] },
          { category: 'tools', label: t('shortcutHelp'), keys: ['?'] },
        ];
        const query = helpQuery.trim().toLowerCase();
        const filtered = rows.filter(function match(item) {
          if (helpCategory !== 'all' && item.category !== helpCategory) return false;
          if (!query) return true;
          if (item.label.toLowerCase().indexOf(query) >= 0) return true;
          return item.keys.some(function matchKey(k) { return k.toLowerCase().indexOf(query) >= 0; });
        });
        const categories = [
          { id: 'all', label: t('shortcutCatAll') },
          { id: 'nav', label: t('shortcutCatNav') },
          { id: 'view', label: t('shortcutCatView') },
          { id: 'tools', label: t('shortcutCatTools') },
        ];
        return h('div', {
          className: 'sr-help-backdrop',
          onMouseDown: function backdrop(event) { if (event.target === event.currentTarget) { setHelpOpen(false); setHelpQuery(''); } },
        },
          h('div', { className: 'sr-help-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('shortcuts') },
            h('div', { className: 'sr-help-head' },
              h('div', null,
                h('div', { className: 'sr-drawer-kicker' }, book.title),
                h('h2', null, t('shortcuts')),
              ),
              h('button', { type: 'button', className: 'sr-reader-icon', onClick: function close() { setHelpOpen(false); setHelpQuery(''); }, title: t('close'), 'aria-label': t('close') },
                h(Icon, { name: 'close', size: 16 }),
              ),
            ),
            h('div', { className: 'sr-help-search' },
              h(Icon, { name: 'search', size: 12 }),
              h('input', {
                type: 'search',
                value: helpQuery,
                placeholder: t('shortcutSearchPlaceholder'),
                onChange: function change(e) { setHelpQuery(e.target.value); },
              }),
              helpQuery ? h('button', {
                type: 'button',
                className: 'sr-help-search-clear',
                onClick: function clear() { setHelpQuery(''); },
                title: t('searchClear'),
              }, h(Icon, { name: 'close', size: 10 })) : null,
            ),
            h('div', { className: 'sr-help-tabs' },
              categories.map(function cat(c) {
                return h('button', {
                  key: c.id,
                  type: 'button',
                  className: 'sr-help-tab',
                  'data-active': helpCategory === c.id ? 'true' : 'false',
                  onClick: function select() { setHelpCategory(c.id); },
                }, c.label);
              }),
            ),
            h('div', { className: 'sr-shortcut-list' },
              filtered.length
                ? filtered.map(function row(item) {
                  return h('div', { key: item.label, className: 'sr-shortcut-row' },
                    h('span', null, item.label),
                    h('span', { className: 'sr-keys' }, item.keys.map(function keycap(key) { return h('kbd', { key: key }, key); })),
                  );
                })
                : h('div', { className: 'sr-help-empty' }, t('shortcutNoMatch')),
            ),
            h('p', { className: 'sr-help-hint' }, t('readerHint')),
          ),
        );
      }

      function bookmarkNoteComposer() {
        if (!bookmarkDraft) return null;
        return h('div', {
          className: 'sr-thought-backdrop',
          onMouseDown: function backdrop(event) { if (event.target === event.currentTarget) setBookmarkDraft(null); },
        },
          h('div', { className: 'sr-thought-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('bookmarkNoteTitle') },
            h('div', { className: 'sr-thought-head' },
              h('div', null,
                h('h2', null, t('bookmarkNoteTitle')),
                h('p', null, (bookmarkDraft.chapterTitle || '') + ' · ' + fill(t('bookmarkPage'), { n: bookmarkDraft.page })),
              ),
              h('button', { type: 'button', className: 'sr-reader-icon', onClick: function close() { setBookmarkDraft(null); }, title: t('close'), 'aria-label': t('close') },
                h(Icon, { name: 'close', size: 16 }),
              ),
            ),
            h('textarea', {
              className: 'sr-thought-textarea',
              value: bookmarkDraft.note,
              maxLength: 500,
              autoFocus: true,
              placeholder: t('bookmarkNotePlaceholder'),
              'aria-label': t('bookmarkNotePlaceholder'),
              onChange: function change(event) { setBookmarkDraft(Object.assign({}, bookmarkDraft, { note: event.target.value })); },
              onKeyDown: function keys(event) {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  event.stopPropagation();
                  setBookmarkDraft(null);
                } else if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.preventDefault();
                  props.onUpdateBookmark(bookmarkDraft.id, { note: bookmarkDraft.note });
                  setBookmarkDraft(null);
                  props.showToast(t('bookmarkNoteSaved'));
                }
              },
            }),
            h('div', { className: 'sr-thought-tools' },
              h('div', null),
              h('div', { className: 'sr-thought-actions' },
                h('button', { type: 'button', className: 'sr-reader-btn', onClick: function cancel() { setBookmarkDraft(null); } }, t('cancel')),
                h('button', {
                  type: 'button',
                  className: 'sr-reader-btn sr-reader-btn--primary',
                  onClick: function save() {
                    props.onUpdateBookmark(bookmarkDraft.id, { note: bookmarkDraft.note });
                    setBookmarkDraft(null);
                    props.showToast(t('bookmarkNoteSaved'));
                  },
                }, t('save')),
              ),
            ),
          ),
        );
      }

      function thoughtComposer() {
        if (!noteDraft) return null;
        return h('div', {
          className: 'sr-thought-backdrop',
          onMouseDown: function backdrop(event) { if (event.target === event.currentTarget) setNoteDraft(null); },
        },
          h('div', { className: 'sr-thought-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('noteComposerTitle') },
            h('div', { className: 'sr-thought-head' },
              h('div', null,
                h('h2', null, noteDraft.id ? t('editThought') : t('noteComposerTitle')),
                h('p', null, t('noteComposerHint')),
              ),
              h('button', { type: 'button', className: 'sr-reader-icon', onClick: function close() { setNoteDraft(null); }, title: t('close'), 'aria-label': t('close') },
                h(Icon, { name: 'close', size: 16 }),
              ),
            ),
            h('p', { className: 'sr-thought-quote' }, noteDraft.text),
            h('textarea', {
              ref: noteRef,
              className: 'sr-thought-textarea',
              value: noteDraft.note,
              placeholder: t('notePlaceholder'),
              'aria-label': t('notePlaceholder'),
              onChange: function change(event) { setNoteDraft(Object.assign({}, noteDraft, { note: event.target.value })); },
              onKeyDown: function keys(event) {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  event.stopPropagation();
                  setNoteDraft(null);
                } else if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.preventDefault();
                  saveThought();
                }
              },
            }),
            h('div', { className: 'sr-thought-tools' },
              h('div', { className: 'sr-color-row' },
                HIGHLIGHT_COLORS.map(function dot(color) {
                  return h('button', {
                    key: color.id,
                    type: 'button',
                    className: 'sr-color-dot',
                    style: { background: color.value },
                    'aria-label': t('color' + color.id.charAt(0).toUpperCase() + color.id.slice(1)),
                    'aria-pressed': noteDraft.color === color.id,
                    onClick: function pick() { setNoteDraft(Object.assign({}, noteDraft, { color: color.id })); },
                  });
                }),
              ),
              h('div', { className: 'sr-thought-actions' },
                h('button', { type: 'button', className: 'sr-reader-btn', onClick: function cancel() { setNoteDraft(null); } }, t('cancel')),
                h('button', { type: 'button', className: 'sr-reader-btn sr-reader-btn--primary', disabled: !noteDraft.id && !noteDraft.note.trim(), onClick: saveThought }, t('save')),
              ),
            ),
          ),
        );
      }

      if (!chapters.length) {
        return h('div', {
          className: 'sr-reader',
          'data-theme': activeThemeId,
        },
          h('header', { className: 'sr-reader-top' },
            h('div', { className: 'sr-reader-top-left' },
              h('button', { type: 'button', className: 'sr-reader-back', onClick: props.onExit, title: t('readerBack') },
                h(Icon, { name: 'chevron-left', size: 15 }),
                h('span', null, t('readerBack')),
              ),
            ),
          ),
          h('div', { className: 'sr-empty', style: { padding: '80px 20px', textAlign: 'center' } },
            h('p', null, t('loadingBookBody') || '加载中...'),
          ),
        );
      }

      return h('div', {
        className: 'sr-reader',
        'data-theme': activeThemeId,
        'data-page-width': settings.pageWidth,
        'data-tts': tts.status === 'idle' ? 'false' : 'true',
        ref: readerRef,
        tabIndex: -1,
      },
        h('div', {
          className: 'sr-sr-only',
          role: 'status',
          'aria-live': 'polite',
          'aria-atomic': 'true',
        }, fill(t('readingLivePage'), { chapter: chapter.title, page: page + 1, total: pageCount })),
        h('div', { className: 'sr-reader-slim-progress', style: { width: overallBookPct + '%' }, 'aria-hidden': 'true', title: overallBookPct + '%' }),
        h('header', { className: 'sr-reader-top' + (chrome ? '' : ' is-hidden') },
          h('div', { className: 'sr-reader-top-left' },
            h('button', { type: 'button', className: 'sr-reader-back', onClick: props.onExit, title: t('readerBack') },
              h(Icon, { name: 'chevron-left', size: 15 }),
              h('span', null, t('readerBack')),
            ),
            jumpReturn ? h('button', {
              type: 'button',
              className: 'sr-jump-return',
              title: fill(t('returnPreviousRead'), { n: jumpReturn.page + 1 }),
              'aria-label': fill(t('returnPreviousRead'), { n: jumpReturn.page + 1 }),
              onClick: function goBack() {
                const prev = jumpReturn;
                setJumpReturn(null);
                if (prev.chapterIndex === chapterIndex) {
                  setPage(prev.page);
                } else {
                  goChapter(prev.chapterIndex, 'page', prev.page);
                }
              },
            },
              h(Icon, { name: 'arrow-left', size: 12 }),
              h('span', null, t('returnPreviousReadLabel')),
            ) : null,
          ),
          h('div', { className: 'sr-reader-top-center' },
            h('button', {
              type: 'button',
              className: 'sr-chapter-nav',
              disabled: chapterIndex <= 0,
              title: t('prevChapter'),
              'aria-label': t('prevChapter'),
              onClick: function prev() { goChapter(chapterIndex - 1, 'resume'); },
            }, h(Icon, { name: 'chevron-left', size: 13 })),
            h('button', {
              type: 'button',
              className: 'sr-reader-top-center-copy sr-top-toc-trigger',
              title: fill(t('openChapterTocHint'), { n: chapterIndex + 1 }),
              'aria-label': fill(t('openChapterTocHint'), { n: chapterIndex + 1 }),
              onClick: function toggleToc() { setDrawer(drawer === 'toc' ? null : 'toc'); },
            },
              h('small', null, book.title + (chapters.length > 1 ? ' · ' + (chapterIndex + 1) + '/' + chapters.length : '') + ' · ' + Math.round(progressPercentValue * 100) + '%'),
              h('strong', null, chapter.title),
            ),
            h('button', {
              type: 'button',
              className: 'sr-chapter-nav',
              disabled: chapterIndex >= chapters.length - 1,
              title: t('nextChapter'),
              'aria-label': t('nextChapter'),
              onClick: function next() { goChapter(chapterIndex + 1, 'resume'); },
            }, h(Icon, { name: 'chevron-right', size: 13 })),
          ),
          h('div', { className: 'sr-reader-top-right' },
            h('div', { className: 'sr-font-anchor' },
              h('button', {
                type: 'button',
                className: 'sr-reader-icon sr-font-trigger',
                'data-on': fontQuickOpen ? 'true' : 'false',
                'aria-expanded': fontQuickOpen ? 'true' : 'false',
                'aria-haspopup': 'dialog',
                title: t('fontQuick'),
                'aria-label': t('fontQuick'),
                onClick: function toggleFontQuick() {
                  if (fontQuickOpen) { setFontQuickOpen(false); return; }
                  dismissPopovers();
                  setFontQuickOpen(true);
                },
              }, h('span', { className: 'sr-font-glyph', 'aria-hidden': 'true' }, 'Aa')),
              fontQuickOpen ? h('div', { className: 'sr-font-quick', role: 'dialog', 'aria-label': t('fontQuick') },
                h('div', { className: 'sr-font-quick-row' },
                  h('button', {
                    type: 'button',
                    className: 'sr-font-step',
                    title: t('decreaseFont'),
                    'aria-label': t('decreaseFont'),
                    disabled: settings.fontSize <= FONT_SIZE_MIN,
                    onClick: function smaller() { changeFontSize(-1); },
                  }, h(Icon, { name: 'minus', size: 13 })),
                  h('span', { className: 'sr-font-quick-value' }, settings.fontSize + 'px'),
                  h('button', {
                    type: 'button',
                    className: 'sr-font-step',
                    title: t('increaseFont'),
                    'aria-label': t('increaseFont'),
                    disabled: settings.fontSize >= FONT_SIZE_MAX,
                    onClick: function larger() { changeFontSize(1); },
                  }, h(Icon, { name: 'plus', size: 13 })),
                ),
                h('div', { className: 'sr-font-quick-foot' },
                  h('button', { type: 'button', className: 'sr-font-quick-link', onClick: resetFontSize }, t('fontReset')),
                  h('button', { type: 'button', className: 'sr-font-quick-link', onClick: function more() { setFontQuickOpen(false); setSettingsOpen(true); } }, t('readerSettings')),
                ),
              ) : null,
            ),
            h('button', {
              type: 'button',
              className: 'sr-reader-icon',
              title: t('searchInBook'),
              'aria-label': t('searchInBook'),
              onClick: function openSearch() {
                setSearchQuery('');
                setSearchText('');
                setDrawer('search');
              },
            }, h(Icon, { name: 'search', size: 17 })),
            h('button', {
              type: 'button',
              className: 'sr-reader-icon',
              'data-on': currentBookmark ? 'true' : 'false',
              title: currentBookmark ? t('readerBookmarkOn') : t('readerBookmark'),
              'aria-label': currentBookmark ? t('readerBookmarkOn') : t('readerBookmark'),
              onClick: toggleBookmark,
            }, h(Icon, { name: currentBookmark ? 'bookmark-filled' : 'bookmark', size: 17 })),
            h('button', {
              type: 'button',
              className: 'sr-reader-icon',
              title: t('notes'),
              'aria-label': t('notes'),
              onClick: function openNotes() { setDrawer('notes'); setNotesTab('highlights'); },
            }, h(Icon, { name: 'notes', size: 17 })),
            h('button', {
              type: 'button',
              className: 'sr-reader-icon',
              title: isFullscreen ? t('exitFullscreen') : t('fullscreen'),
              'aria-label': isFullscreen ? t('exitFullscreen') : t('fullscreen'),
              onClick: toggleFullscreen,
            }, h(Icon, { name: isFullscreen ? 'minimize' : 'maximize', size: 16 })),
          ),
        ),
        h('div', { className: 'sr-page-area' },
          h('button', {
            type: 'button',
            className: 'sr-page-edge sr-page-edge--prev',
            'aria-label': t('prevPage'),
            title: t('prevPage'),
            disabled: page <= 0 && chapterIndex <= 0,
            onClick: function prev(e) { e.stopPropagation(); prevPage(); },
          }, h(Icon, { name: 'chevron-left', size: 18 })),
          h('div', {
            className: 'sr-stage',
            ref: stageRef,
            onPointerDown: handlePointerDown,
            onPointerUp: handlePointerUp,
            onMouseMove: function handleMouseMove(e) {
              if ((rulerOpen || settings.readingRuler) && stageRef.current) {
                const rect = stageRef.current.getBoundingClientRect();
                setRulerY(clamp(e.clientY - rect.top, 24, Math.max(24, rect.height - 24)));
              }
            },
            onClick: handleStageClick,
            onDoubleClick: handleStageDoubleClick,
          },
            (rulerOpen || settings.readingRuler) ? h('div', {
              className: 'sr-reading-ruler',
              style: { top: rulerY + 'px' },
              'aria-hidden': 'true',
            }) : null,
            currentBookmark ? h('button', {
              type: 'button',
              className: 'sr-page-bookmark-ribbon' + (currentBookmark.note ? ' sr-page-bookmark-ribbon--noted' : ''),
              title: currentBookmark.note ? t('bookmarkNoteTitle') + ': ' + currentBookmark.note : t('readerBookmarkOn'),
              'aria-label': t('readerBookmarkOn'),
              onClick: function onRibbonClick(e) {
                e.stopPropagation();
                setBookmarkDraft(currentBookmark);
              },
            }) : null,
            h('div', {
              className: 'sr-page-track',
              'data-instant': animate ? 'false' : 'true',
              style: { transform: 'translate3d(' + (-Math.min(page, pageCount - 1) * step) + 'px,0,0)' },
            },
              h('div', {
                ref: columnsRef,
                className: 'sr-columns',
                'data-font': settings.fontFamily,
                style: {
                  width: pageW || '100%',
                  height: pageH || '100%',
                  columnWidth: pageW || undefined,
                  columnGap: gap,
                  fontSize: settings.fontSize + 'px',
                  lineHeight: String(settings.lineHeight),
                  '--sr-letter-spacing': settings.letterSpacing + 'em',
                  '--sr-para-gap': settings.paragraphSpacing + 'em',
                  '--sr-align': settings.textAlign === 'left' ? 'left' : 'justify',
                  visibility: pageW ? 'visible' : 'hidden',
                },
              },
                h('header', { className: 'sr-chapter-head' },
                  h('span', { className: 'sr-chapter-kicker' }, fill(t('chapterIndex'), { n: chapterIndex + 1 })),
                  h('h1', { className: 'sr-chapter-title' }, chapter.title),
                ),
                paragraphNodes,
                chapterIndex >= chapters.length - 1
                  ? h('div', { className: 'sr-chapter-end sr-chapter-end--book', ref: endRef },
                      h('span', { className: 'sr-book-end-badge' }, '❦ ' + t('readerFinished') + ' ❦'),
                      h('small', { className: 'sr-book-end-sub' }, t('readerFinishedSub')),
                    )
                  : h('div', { className: 'sr-chapter-end', ref: endRef }, '· ' + t('chapterEnd') + ' ·'),
              ),
            ),
          ),
          h('button', {
            type: 'button',
            className: 'sr-page-edge sr-page-edge--next',
            'aria-label': t('nextPage'),
            title: t('nextPage'),
            disabled: page >= pageCount - 1 && chapterIndex >= chapters.length - 1,
            onClick: function next(e) { e.stopPropagation(); nextPage(); },
          }, h(Icon, { name: 'chevron-right', size: 18 })),
        ),
        !chrome ? h('div', {
          className: 'sr-page-meta',
          role: 'button',
          tabIndex: 0,
          title: t('shortcutChrome'),
          'aria-label': t('shortcutChrome'),
          onClick: function showChrome(e) { e.stopPropagation(); setChrome(true); },
          onKeyDown: function handleKey(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setChrome(true); } },
        }, clockText + '  ·  ' + pageLabel + '  ·  ' + fill(t('readerProgress'), { n: Math.round(progressPercentValue * 100) }) + '  ·  ' + remainingLabel) : null,
        h('div', { className: 'sr-reader-bottom' + (chrome ? '' : ' is-hidden') },
          h('div', { className: 'sr-reader-bottom-inner' },
            h('button', { type: 'button', className: 'sr-reader-tool', onClick: function toc() { setDrawer('toc'); }, title: t('readerToc') },
              h(Icon, { name: 'list', size: 14 }),
              h('span', null, t('readerToc')),
            ),
            h('div', {
              className: 'sr-reader-range-wrap',
              onMouseMove: function hover(event) {
                if (pageCount <= 1) return;
                const rect = event.currentTarget.getBoundingClientRect();
                const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
                const targetPage = Math.round(ratio * (pageCount - 1));
                setHoverScrub({ x: clamp(event.clientX - rect.left, 24, Math.max(24, rect.width - 24)), page: targetPage });
              },
              onMouseLeave: function leave() { setHoverScrub(null); },
            },
              hoverScrub ? h('div', {
                className: 'sr-reader-range-tooltip',
                style: { left: hoverScrub.x + 'px' },
              }, t('pageOf', { n: hoverScrub.page + 1, m: pageCount })) : null,
              h('input', {
                type: 'range',
                className: 'sr-reader-range',
                min: 0,
                max: Math.max(0, pageCount - 1),
                step: 1,
                value: Math.min(page, pageCount - 1),
                disabled: pageCount <= 1,
                'aria-label': t('pageOf', { n: page + 1, m: pageCount }),
                onChange: function change(event) { setPage(Number(event.target.value)); dismissPopovers(); },
              }),
              h('div', { className: 'sr-page-jump-anchor' },
                h('button', {
                  type: 'button',
                  className: 'sr-reader-progress-label sr-page-jump-trigger',
                  title: t('jumpToPage') + ' (G)',
                  'aria-haspopup': 'dialog',
                  'aria-expanded': pageJumpOpen ? 'true' : 'false',
                  onClick: function toggleJump() {
                    if (pageJumpOpen) { setPageJumpOpen(false); return; }
                    dismissPopovers();
                    setPageJumpDraft(String(page + 1));
                    setPageJumpOpen(true);
                  },
                }, pageLabel),
                pageJumpOpen ? h('form', {
                  className: 'sr-page-jump-popover',
                  role: 'dialog',
                  'aria-label': t('jumpToPage'),
                  onSubmit: function jump(event) {
                    event.preventDefault();
                    const target = parseInt(pageJumpDraft, 10);
                    if (!Number.isNaN(target)) {
                      setPage(clamp(target, 1, pageCount) - 1);
                    }
                    setPageJumpOpen(false);
                  },
                },
                  h('span', { className: 'sr-page-jump-hint' }, t('jumpPagePrefix')),
                  h('input', {
                    ref: pageJumpInputRef,
                    type: 'number',
                    className: 'sr-page-jump-input',
                    min: 1,
                    max: pageCount,
                    value: pageJumpDraft,
                    placeholder: String(page + 1),
                    onChange: function change(e) { setPageJumpDraft(e.target.value); },
                    onKeyDown: function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); setPageJumpOpen(false); } },
                  }),
                  h('span', { className: 'sr-page-jump-hint' }, '/ ' + pageCount + (t('jumpPageSuffix') ? ' ' + t('jumpPageSuffix') : '')),
                  h('button', { type: 'submit', className: 'sr-page-jump-btn' }, t('jumpBtn')),
                ) : null,
              ),
              h('span', {
                className: 'sr-reader-time',
                title: t('readerProgress'),
                onClick: function cycleTime() {
                  setTimeMode(function next(m) {
                    if (m === 'chapterTime') return 'bookPercent';
                    if (m === 'bookPercent') return 'clock';
                    return 'chapterTime';
                  });
                },
              }, timeMode === 'bookPercent'
                ? fill(t('tocReadPercent'), { n: overallBookPct }) + (isFullscreen ? ' · ' + clockText : '')
                : (timeMode === 'clock'
                  ? clockText
                  : remainingLabel + (isFullscreen ? ' · ' + clockText : ''))),
            ),
            h('button', {
              type: 'button',
              className: 'sr-reader-tool',
              'data-on': tts.status === 'idle' ? 'false' : 'true',
              title: tts.status === 'playing' ? t('pauseReading') : t('readAloud'),
              onClick: toggleSpeech,
            },
              h(Icon, { name: 'volume', size: 15 }),
              h('span', null, t('readAloud')),
            ),
            h('button', { type: 'button', className: 'sr-reader-tool', onClick: function settingsOpenNow() { setSettingsOpen(true); }, title: t('readerSettings') },
              h(Icon, { name: 'type', size: 14 }),
              h('span', null, t('readerSettings')),
            ),
          ),
        ),
        tts.status !== 'idle' ? h('div', {
          className: 'sr-tts-bar',
          'data-status': tts.status,
          role: 'group',
          'aria-label': t('readAloud'),
        },
          h('span', { className: 'sr-tts-icon' }, h(Icon, { name: 'volume', size: 15 })),
          h('div', { className: 'sr-tts-copy' },
            h('strong', null, tts.total > 0 ? t('readingAloud') + ' · ' + (tts.index + 1) + ' / ' + tts.total : t('readingAloud')),
            h('span', null, tts.excerpt),
          ),
          h('div', { className: 'sr-tts-actions' },
            h('button', {
              type: 'button',
              className: 'sr-tts-rate sr-tts-timer',
              'data-on': sleepMinutes > 0 ? 'true' : 'false',
              onClick: cycleSleepTimer,
              title: sleepMinutes > 0 ? fill(t('sleepMinutes'), { n: sleepMinutes }) : t('sleepTimer'),
              'aria-label': sleepMinutes > 0 ? fill(t('sleepMinutes'), { n: sleepMinutes }) : t('sleepTimer'),
            }, sleepMinutes > 0 ? sleepMinutes + 'm' : h(Icon, { name: 'clock', size: 12 })),
            h('button', {
              type: 'button',
              className: 'sr-tts-rate',
              onClick: cycleSpeechRate,
              title: t('speechRate'),
              'aria-label': t('speechRate'),
            }, String(tts.rate).replace(/\.0$/, '') + '×'),
            h('button', {
              type: 'button',
              className: 'sr-tts-btn',
              onClick: toggleSpeech,
              title: tts.status === 'paused' ? t('resumeReading') : t('pauseReading'),
              'aria-label': tts.status === 'paused' ? t('resumeReading') : t('pauseReading'),
            }, h(Icon, { name: tts.status === 'paused' ? 'play' : 'pause', size: 13 })),
            h('button', {
              type: 'button',
              className: 'sr-tts-btn',
              onClick: stopSpeech,
              title: t('stopReading'),
              'aria-label': t('stopReading'),
            }, h(Icon, { name: 'stop', size: 12 })),
          ),
        ) : null,
        fontHud && !fontQuickOpen ? h('div', { className: 'sr-font-hud', role: 'status', 'aria-live': 'polite' },
          h('span', { className: 'sr-font-hud-glyph', 'aria-hidden': 'true' }, 'Aa'),
          h('strong', null, fontHud + 'px'),
        ) : null,
        chapterHud ? h('div', { className: 'sr-chapter-hud', role: 'status', 'aria-live': 'polite' },
          h('span', { className: 'sr-chapter-hud-index' }, fill(t('chapterIndex'), { n: chapterHud.index + 1 })),
          h('strong', null, chapterHud.title),
        ) : null,
        (isFullscreen && !chrome) ? h('button', {
          type: 'button',
          className: 'sr-fullscreen-exit-btn',
          title: t('exitFullscreen'),
          'aria-label': t('exitFullscreen'),
          onClick: toggleFullscreen,
        }, h(Icon, { name: 'minimize', size: 12 }), h('span', null, t('exitFullscreen') + ' (Esc)')) : null,
        h('div', { className: 'sr-reader-corner', 'aria-hidden': 'true' }),
        drawer === 'toc' ? drawerContents() : null,
        drawer === 'notes' ? drawerNotes() : null,
        drawer === 'search' ? drawerSearch() : null,
        settingsOpen ? settingsSheet() : null,
        toolbar ? h('div', {
          className: 'sr-selection-toolbar',
          role: 'toolbar',
          'aria-label': t('highlight'),
          style: {
            left: toolbar.x + 'px',
            top: toolbar.y + 'px',
            transform: toolbar.below ? 'translate(-50%,0)' : 'translate(-50%,-100%)',
          },
        },
          h('div', { className: 'sr-sel-colors', role: 'group', 'aria-label': t('highlightColor') },
            HIGHLIGHT_COLORS.map(function colorDot(color) {
              return h('button', {
                key: color.id,
                type: 'button',
                className: 'sr-sel-color',
                style: { background: color.value },
                'aria-pressed': activeSelectionColor === color.id,
                title: t('color' + color.id.charAt(0).toUpperCase() + color.id.slice(1)),
                'aria-label': t('color' + color.id.charAt(0).toUpperCase() + color.id.slice(1)),
                onClick: function pick() { setSelectionColor(color.id); },
              });
            }),
          ),
          h('span', { className: 'sr-sel-divider', 'aria-hidden': 'true' }),
          h('button', { type: 'button', className: 'sr-sel-btn', title: t('selectionHighlight'), onClick: createHighlightFromToolbar },
            h(Icon, { name: 'pen', size: 13 }),
            h('span', null, t('selectionHighlight')),
          ),
          h('button', { type: 'button', className: 'sr-sel-btn', title: t('selectionThought'), onClick: createThoughtDraft },
            h(Icon, { name: 'message', size: 13 }),
            h('span', null, t('selectionThought')),
          ),
          h('span', { className: 'sr-sel-divider', 'aria-hidden': 'true' }),
          h('button', { type: 'button', className: 'sr-sel-btn', title: t('selectionCopy'), onClick: copyToolbarText },
            h(Icon, { name: 'copy', size: 13 }),
            h('span', null, t('selectionCopy')),
          ),
          h('button', { type: 'button', className: 'sr-sel-btn', title: t('copyQuote'), onClick: copyToolbarQuote },
            h(Icon, { name: 'quote', size: 13 }),
            h('span', null, t('copyQuote')),
          ),
          h('span', { className: 'sr-sel-divider', 'aria-hidden': 'true' }),
          h('button', { type: 'button', className: 'sr-sel-btn', title: t('searchInBook'), onClick: searchSelectionText },
            h(Icon, { name: 'search', size: 13 }),
            h('span', null, t('searchInBook')),
          ),
        ) : null,
        peek && peekHighlight ? h('div', {
          className: 'sr-hl-peek',
          style: {
            left: peek.x + 'px',
            top: peek.y + 'px',
            transform: peek.below ? 'translate(-50%,0)' : 'translate(-50%,-100%)',
            '--sr-hl': (HIGHLIGHT_COLORS.find(function find(entry) { return entry.id === peekHighlight.color; }) || HIGHLIGHT_COLORS[0]).value,
          },
        },
          h('p', { className: 'sr-hl-peek-quote' }, peekHighlight.text),
          peekHighlight.note ? h('p', { className: 'sr-hl-peek-note' }, peekHighlight.note) : null,
          h('div', { className: 'sr-hl-peek-styles', role: 'group', 'aria-label': t('styleHighlight') },
            [
              { id: 'highlight', label: t('styleHighlight') },
              { id: 'underline', label: t('styleUnderline') },
              { id: 'wavy', label: t('styleWavy') },
              { id: 'strike', label: t('styleStrike') },
            ].map(function styleBtn(s) {
              const active = (peekHighlight.style || 'highlight') === s.id;
              return h('button', {
                key: s.id,
                type: 'button',
                className: 'sr-hl-peek-style-btn',
                'data-active': active ? 'true' : 'false',
                onClick: function setStyle() {
                  if (active) return;
                  props.updateHighlight(peekHighlight.id, { style: s.id });
                },
              }, s.label);
            }),
          ),
          h('div', { className: 'sr-hl-peek-foot' },
            h('div', { className: 'sr-hl-peek-colors', role: 'group', 'aria-label': t('highlightColor') },
              HIGHLIGHT_COLORS.map(function dot(c) {
                const active = (peekHighlight.color || 'amber') === c.id;
                return h('button', {
                  key: c.id,
                  type: 'button',
                  className: 'sr-color-dot',
                  'data-active': active ? 'true' : 'false',
                  style: { background: c.value },
                  title: t('color' + c.id.charAt(0).toUpperCase() + c.id.slice(1)),
                  'aria-label': t('color' + c.id.charAt(0).toUpperCase() + c.id.slice(1)),
                  onClick: function changeColor() {
                    if (active) return;
                    props.updateHighlight(peekHighlight.id, { color: c.id });
                  },
                });
              }),
            ),
            h('small', null, dateLabel(peekHighlight.createdAt)),
            h('div', { className: 'sr-hl-peek-actions' },
              h('button', {
                type: 'button',
                className: 'sr-hl-peek-btn',
                onClick: function copy() {
                  copyTextToClipboard(buildQuoteText(peekHighlight.text, book.title, chapter.title)).then(function done(ok) {
                    props.showToast(ok ? t('quoteCopied') : t('copyFailed'));
                  });
                },
              }, t('copyQuote')),
              h('button', {
                type: 'button',
                className: 'sr-hl-peek-btn',
                title: t('copyCallout'),
                onClick: function copyCallout() {
                  copyTextToClipboard(buildCalloutText(peekHighlight.text, peekHighlight.note, book.title, chapter.title, t('thoughtLabel'))).then(function done(ok) {
                    props.showToast(ok ? t('calloutCopied') : t('copyFailed'));
                  });
                },
              }, 'Callout'),
              h('button', {
                type: 'button',
                className: 'sr-hl-peek-btn',
                onClick: function makeCard() {
                  const noteChapter = chapters[clamp(peekHighlight.chapterIndex || 0, 0, Math.max(0, chapters.length - 1))];
                  setCardHighlight({
                    text: peekHighlight.text,
                    note: peekHighlight.note || '',
                    chapterTitle: noteChapter ? noteChapter.title : '',
                    date: peekHighlight.createdAt ? dateLabel(peekHighlight.createdAt) : undefined,
                  });
                  setPeek(null);
                },
              }, t('quoteCardShort')),
              h('button', { type: 'button', className: 'sr-hl-peek-btn', onClick: function edit() { openThoughtEditor(peekHighlight); } }, peekHighlight.note ? t('editThought') : t('addNote')),
              peekHighlight.note ? h('button', {
                type: 'button',
                className: 'sr-hl-peek-btn',
                onClick: function clearThought() {
                  props.updateHighlight(peekHighlight.id, { note: '' });
                  props.showToast(t('thoughtCleared'));
                },
              }, t('clearThought')) : null,
              h('button', { type: 'button', className: 'sr-hl-peek-btn', onClick: function remove() { props.deleteHighlight(peekHighlight.id); setPeek(null); } }, t('delete')),
              h('button', { type: 'button', className: 'sr-hl-peek-btn', onClick: function close() { setPeek(null); } }, t('close')),
            ),
          ),
        ) : null,
        footnote ? h('div', {
          role: 'dialog',
          'aria-label': t('footnote'),
          className: 'sr-footnote-popover',
          style: {
            left: footnote.x + 'px',
            top: footnote.y + 'px',
            transform: footnote.below ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
          },
          onClick: function onFootnoteClick(e) {
            e.stopPropagation();
            if (e.target && typeof e.target.closest === 'function' && e.target.closest('a')) {
              e.preventDefault();
              setFootnote(null);
            }
          },
        },
          h('div', { className: 'sr-footnote-head' },
            h('span', { className: 'sr-footnote-title' },
              h(Icon, { name: 'bookmark', size: 14 }),
              h('span', null, footnote.title ? (t('footnote') + ' ' + footnote.title) : t('footnote')),
            ),
            h('button', {
              type: 'button',
              className: 'sr-footnote-close',
              title: t('close'),
              'aria-label': t('close'),
              onClick: function close() { setFootnote(null); },
            }, h(Icon, { name: 'close', size: 14 })),
          ),
          h('div', {
            className: 'sr-footnote-body',
            dangerouslySetInnerHTML: footnote.html ? { __html: footnote.html } : undefined,
          }, !footnote.html ? footnote.text : null),
        ) : null,
        thoughtComposer(),
        cardHighlight ? h(QuoteCardDialog, {
          t: t,
          text: cardHighlight.text,
          note: cardHighlight.note,
          bookTitle: book.title,
          chapterTitle: cardHighlight.chapterTitle,
          date: cardHighlight.date,
          showToast: props.showToast,
          onClose: function close() { setCardHighlight(null); },
        }) : null,
        bookmarkNoteComposer(),
        helpOpen ? shortcutHelp() : null,
        readerLightbox(zoomImage, t, function close() { setZoomImage(null); }),
      );
    }
