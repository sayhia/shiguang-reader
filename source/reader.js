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

    // What the page renders: the global settings with this book's own settings on top.
    function effectiveReaderSettings(stored, bookId) {
      const base = stored && typeof stored === 'object' ? stored : {};
      const overrides = (base.bookSettings && bookId && base.bookSettings[bookId]) || {};
      return Object.assign({}, base, overrides);
    }

    // The settings that reflow the text. Pagination is only redone (and the
    // reading position re-anchored) when one of these really changes.
    function readerLayoutSignature(settings, bookId) {
      const value = settings || {};
      const imageLayout = (value.imageLayouts && value.imageLayouts[bookId]) || value.imageLayout || 'inline';
      return [
        value.fontSize, value.lineHeight, value.fontFamily, value.letterSpacing, value.paragraphSpacing,
        value.pageWidth, value.layout || 'page', value.writingMode || 'horizontal', imageLayout,
      ].join('|');
    }

    // `CSS` in this bundle is the plugin's stylesheet string (styles.js), which hides
    // the browser's CSS namespace: a bare CSS.escape throws and every anchor lookup
    // silently failed. Go through window.CSS, with a small fallback.
    function cssEscapeIdent(value) {
      const text = String(value);
      if (typeof window !== 'undefined' && window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(text);
      return text.replace(/[^a-zA-Z0-9_\u00A0-\uFFFF-]/g, function escapeChar(char) { return '\\' + char; })
        .replace(/^(-?)([0-9])/, function escapeDigit(match, dash, digit) { return dash + '\\3' + digit + ' '; });
    }

    // Which page holds a point `offset` px from the start of the chapter's columns.
    // In two-column mode a "page" is a spread of two columns.
    function readerAnchorPage(offset, stepSize, spread, count) {
      const column = Math.max(0, Math.floor((Number(offset) || 0) / Math.max(1, stepSize)));
      return clamp(spread ? Math.floor(column / 2) : column, 0, Math.max(0, count - 1));
    }

    // The page-jump box takes a physical page number, the one the page label shows
    // ("7–8 / 20"); in two-column mode that maps onto the spread holding it.
    function readerPageJumpIndex(value, spread, totalPages, pageCount) {
      const total = spread ? Math.max(1, totalPages) : Math.max(1, pageCount);
      const physical = clamp(Math.round(Number(value) || 1), 1, total);
      return clamp(spread ? Math.floor((physical - 1) / 2) : physical - 1, 0, Math.max(0, pageCount - 1));
    }

    // Keys that are preferences rather than a look: changing them does not turn the
    // preset into "custom" and does not take the place of the settings undo step.
    const READER_QUIET_SETTING_KEYS = ['speechRate'];

    function Reader(props) {
      const t = props.t;
      const book = props.book || {};
      const chapters = Array.isArray(book.chapters) && book.chapters.length
        ? book.chapters
        : [{ id: 'empty-c1', title: book.title || '正文', paragraphs: [] }];
      const storedSettings = props.settings || {};
      const bookOverrides = (storedSettings.bookSettings && storedSettings.bookSettings[book.id]) || {};
      // A book that has its own settings opens with the "this book" scope selected,
      // so the panel edits what the page actually shows.
      const [settingsScope, setSettingsScope] = useState(Object.keys(bookOverrides).length ? 'book' : 'global');
      // The book's own settings always apply; the scope only decides where edits are saved.
      const settings = effectiveReaderSettings(storedSettings, book.id);
      const initialIndex = clamp(Number(props.initialChapterIndex) || 0, 0, Math.max(0, chapters.length - 1));
      const initialPercent = clamp(Number(props.initialPercent) || 0, 0, 1);

      const [chapterIndex, setChapterIndex] = useState(initialIndex);
      const [page, setPage] = useState(0);
      const [pageCount, setPageCount] = useState(1);
      const [totalPages, setTotalPages] = useState(1);
      const [scrollRatio, setScrollRatio] = useState(0);
      const [chrome, setChrome] = useState(true);
      const [drawer, setDrawer] = useState(null);
      const [notesTab, setNotesTab] = useState('highlights');
      const [searchQuery, setSearchQuery] = useState('');
      const [searchText, setSearchText] = useState('');
      const [searchCursor, setSearchCursor] = useState(-1);
      const [searchScope, setSearchScope] = useState('book');
      const [settingsOpen, setSettingsOpen] = useState(false);
      const [settingsTab, setSettingsTab] = useState('appearance');
      const [savedPulse, setSavedPulse] = useState(false);
      const [undoAvailable, setUndoAvailable] = useState(false);
      const [redoAvailable, setRedoAvailable] = useState(false);
      const [settingsSearchOpen, setSettingsSearchOpen] = useState(false);
      const [settingsQuery, setSettingsQuery] = useState('');
      const [railPinned, setRailPinned] = useState(false);
      const [clearBookConfirm, setClearBookConfirm] = useState(false);
      const [scrubDraft, setScrubDraft] = useState(null);
      const [tourOpen, setTourOpen] = useState(function initialTour() {
        try { return window.localStorage.getItem('sr-reader-tour-v1') !== '1'; } catch (error) { return false; }
      });
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
      const [sleepMinutes, setSleepMinutes] = useState(0);
      const [isFullscreen, setIsFullscreen] = useState(false);
      const [cardHighlight, setCardHighlight] = useState(null);
      const [tocOnlyNotes, setTocOnlyNotes] = useState(false);
      const [tocQuery, setTocQuery] = useState('');
      const [notesQuery, setNotesQuery] = useState('');
      const [notesColorFilter, setNotesColorFilter] = useState('all');
      const [topMenuOpen, setTopMenuOpen] = useState(false);
      const topMenuRef = useRef(null);
      const topMoreButtonRef = useRef(null);
      const topMenuWasOpenRef = useRef(false);
      const [hoverScrub, setHoverScrub] = useState(null);
      const [fontHud, setFontHud] = useState(0);
      const [chapterHud, setChapterHud] = useState(null);
      const [pageJumpOpen, setPageJumpOpen] = useState(false);
      const [pageJumpDraft, setPageJumpDraft] = useState('');
      const [widthDraft, setWidthDraft] = useState(null);
      const widthDragRef = useRef(false);
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
      const savedPulseTimerRef = useRef(null);
      const settingsPanelRef = useRef(null);
      const settingsReturnFocusRef = useRef(null);
      const settingsRef = useRef(settings);
      const storedSettingsRef = useRef(storedSettings);
      const settingsScopeRef = useRef(settingsScope);
      const undoSettingsRef = useRef(null);
      const redoSettingsRef = useRef(null);
      settingsRef.current = settings;
      storedSettingsRef.current = storedSettings;
      settingsScopeRef.current = settingsScope;
      const chapterHudTimerRef = useRef(null);
      const sessionStartRef = useRef(Date.now());
      const sessionSecondsRef = useRef(0);
      // The minute the last eye-care reminder fired at. Kept apart from the session
      // seconds, which are what the reading session reports.
      const eyeCareMinuteRef = useRef(0);
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
      const touchStartYRef = useRef(0);
      const rangeScrubRef = useRef(false);
      const noteRef = useRef(null);
      const searchRef = useRef(null);
      const ttsRef = useRef({ active: false, paused: false, chunks: [], offsets: [], index: 0, chapterIndex: 0, lang: 'zh-CN', rate: 1, utterance: null });
      const autoSpeechRef = useRef(null);

      const chapter = (chapters.length ? chapters[clamp(chapterIndex, 0, Math.max(0, chapters.length - 1))] : null) || { id: '', title: '', paragraphs: [] };
      const offsets = useMemo(function offsetsMemo() { return chapterBaseOffsets(chapter); }, [chapter]);
      const chapterString = useMemo(function textMemo() { return chapterText(chapter); }, [chapter]);
      const bookHasImages = useMemo(function imageMemo() { return chapters.some(function has(ch) { return ch && ch.images && Object.keys(ch.images).length > 0; }); }, [chapters]);
      const chapterHasImages = Boolean(chapter && chapter.images && Object.keys(chapter.images).length > 0);
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
      const chapterBookmarks = useMemo(function chapterBookmarksMemo() {
        return bookmarksForBook.filter(function inChapter(item) { return item.chapterIndex === chapterIndex; }).slice(0, 5);
      }, [bookmarksForBook, chapterIndex]);
      const dockedRail = Boolean(drawer) && typeof window !== 'undefined' && window.innerWidth >= 1100;
      const bookHighlights = useMemo(function bookHighlightsMemo() {
        return props.highlights.filter(function match(item) { return item.bookId === book.id; });
      }, [props.highlights, book.id]);
      const layout = settings.layout || 'page';
      const bookImageLayout = (settings.imageLayouts && settings.imageLayouts[book.id]) || settings.imageLayout || 'inline';
      const scrollMode = layout === 'scroll';
      const spread = layout === 'spread' && box.w >= 640;
      const gap = spread && settings.spreadGutter === 'compact' ? 28 : (box.w && box.w < 700 ? 34 : 56);
      const pageW = spread ? Math.max(120, Math.floor((box.w - gap) / 2)) : box.w;
      const pageH = box.h;
      const pageAreaSide = typeof window !== 'undefined' ? Math.min(96, Math.max(30, window.innerWidth * 0.07)) : 72;
      const pageWidthTarget = typeof window === 'undefined' ? 860 : (settings.pageWidth === 'full' && chapterHasImages ? window.innerWidth : pageWidthPixels(settings.pageWidth, settings.pageWidthPx));
      const marginNotesVisible = settings.marginNotes === true && typeof window !== 'undefined' && window.innerWidth >= 1300 && (window.innerWidth - pageWidthTarget - pageAreaSide * 2) >= 300;
      const step = pageW + gap;
      const viewStep = spread ? step * 2 : step;
      const progressPercentValue = scrollMode ? scrollRatio : (pageCount <= 1 ? 0 : clamp(page / (pageCount - 1), 0, 1));
      const overallBookPct = clamp(Math.round(((chapterIndex + progressPercentValue) / Math.max(1, chapters.length)) * 100), 0, 100);
      const currentBookmark = bookmarksForBook.find(function same(item) {
        return item.chapterIndex === chapterIndex && Math.abs(item.percent - progressPercentValue) < 0.035;
      });
      const peekHighlight = peek ? props.highlights.find(function find(item) { return item.id === peek.id; }) : null;
      const pageStart = spread ? page * 2 + 1 : page + 1;
      const pageEnd = spread ? Math.min(pageStart + 1, totalPages) : pageStart;
      // The page-jump box counts the same pages as the label: physical pages, so in
      // two-column mode "7" lands on the spread that shows page 7.
      const jumpPageTotal = spread ? Math.max(1, totalPages) : pageCount;
      const pageLabel = scrollMode
        ? Math.round(scrollRatio * 100) + '%'
        : spread
          ? (pageStart === pageEnd ? String(pageStart) : pageStart + '–' + pageEnd) + ' / ' + Math.max(1, totalPages)
          : fill(t('pageOf'), { n: Math.min(page + 1, pageCount), m: pageCount });
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
        setPageJumpOpen(false);
        setTopMenuOpen(false);
      }, []);

      const showChapterHud = useCallback(function announce(chapIndex, chapTitle) {
        setChapterHud({ index: chapIndex, title: chapTitle });
        if (chapterHudTimerRef.current) window.clearTimeout(chapterHudTimerRef.current);
        chapterHudTimerRef.current = window.setTimeout(function hide() {
          chapterHudTimerRef.current = null;
          setChapterHud(null);
        }, 1500);
      }, []);

      // Which page (spread index in two-column mode) holds an element of the chapter.
      // The columns box and the element sit inside the same translated page track,
      // so their offset is already measured from the chapter start: no page offset.
      const anchorPageIndex = useCallback(function locate(container, el, count) {
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        return readerAnchorPage(elRect.left - containerRect.left, pageW + gap, spread, count);
      }, [pageW, gap, spread]);

      // Scroll layout: put the reading position at a ratio of the chapter, the same
      // way the progress slider does (vertical writing scrolls right-to-left).
      const scrollToRatio = useCallback(function scrollTo(value) {
        const ratio = clamp(Number(value) || 0, 0, 1);
        const element = columnsRef.current;
        if (element) {
          const vertical = settings.writingMode === 'vertical';
          const max = Math.max(0, vertical ? element.scrollWidth - element.clientWidth : element.scrollHeight - element.clientHeight);
          if (vertical) element.scrollLeft = -ratio * max;
          else element.scrollTop = ratio * max;
        }
        setScrollRatio(ratio);
        currentPercentRef.current = ratio;
      }, [settings.writingMode]);

      const goChapter = useCallback(function go(index, mode, percent, keepDrawer) {
        if (index < 0 || index >= chapters.length) return;
        dismissPopovers();
        if (!keepDrawer && !railPinned) setDrawer(null);
        setSettingsOpen(false);
        if (mode !== 'start' && mode !== 'last') setChrome(true);
        const targetChapter = chapters[index];
        let target = mode === 'last' ? 'last' : mode === 'page' && typeof percent === 'number' ? { page: Math.round(percent) } : mode === 'anchor' && percent ? { anchorId: String(percent) } : typeof percent === 'number' ? clamp(percent, 0, 1) : 0;
        if (mode === 'resume') {
          target = chapterResumePercent(props.chapterMarks, targetChapter ? targetChapter.id : '');
        }
        if (index === chapterIndex && scrollMode && mode !== 'anchor') {
          // setPage means nothing in the scroll layout: move the scroll position instead.
          if (target === 'last') scrollToRatio(1);
          else if (target && typeof target === 'object') scrollToRatio(0);
          else if (typeof target === 'number' && target > 0) scrollToRatio(target);
          else if (mode !== 'resume' || typeof percent === 'number') scrollToRatio(0);
          return;
        }
        if (index === chapterIndex) {
          if (target === 'last') setPage(Math.max(0, pageCount - 1));
          else if (mode === 'page' && typeof percent === 'number') setPage(clamp(Math.round(percent), 0, Math.max(0, pageCount - 1)));
          else if (mode === 'anchor' && percent && columnsRef.current) {
            let el = null;
            try {
              const cleanAId = String(percent).replace(/^#/, '');
              const esc = cssEscapeIdent(cleanAId);
              el = columnsRef.current.querySelector('#' + esc) ||
                   columnsRef.current.querySelector('[name="' + esc + '"]') ||
                   columnsRef.current.querySelector('[data-slug="' + esc.toLowerCase() + '"]');
            } catch (e) {}
            if (el) {
              if (scrollMode) {
                el.scrollIntoView({ block: 'center', inline: 'center' });
                const element = columnsRef.current;
                const vertical = settings.writingMode === 'vertical';
                const max = Math.max(0, vertical ? element.scrollWidth - element.clientWidth : element.scrollHeight - element.clientHeight);
                const position = vertical ? Math.abs(element.scrollLeft) : element.scrollTop;
                const ratio = max > 0 ? clamp(position / max, 0, 1) : 0;
                setScrollRatio(ratio);
                currentPercentRef.current = ratio;
                return;
              }
              setPage(anchorPageIndex(columnsRef.current, el, pageCount));
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
      }, [chapterIndex, chapters, pageCount, dismissPopovers, props.chapterMarks, showChapterHud, spread, railPinned, scrollMode, scrollToRatio, anchorPageIndex, settings.writingMode]);

      const nextPage = useCallback(function next() {
        if (scrollMode) {
          dismissPopovers();
          const element = columnsRef.current;
          if (!element) return;
          const vertical = settings.writingMode === 'vertical';
          const max = Math.max(0, vertical ? element.scrollWidth - element.clientWidth : element.scrollHeight - element.clientHeight);
          const position = vertical ? Math.abs(element.scrollLeft) : element.scrollTop;
          if (max - position > 8) {
            const amount = Math.max(160, (vertical ? element.clientWidth : element.clientHeight) * 0.82);
            element.scrollBy({ left: vertical ? -amount : 0, top: vertical ? 0 : amount, behavior: 'smooth' });
            return;
          }
          if (chapterIndex < chapters.length - 1) {
            goChapter(chapterIndex + 1, 'start');
            return;
          }
          props.onFinish(book.id);
          props.showToast(t('readerFinished'));
          return;
        }
        if (!pageW || !pageH) return;
        dismissPopovers();
        if (page < pageCount - 1) {
          setPage(page + 1);
          return;
        }
        if (chapterIndex < chapters.length - 1) {
          goChapter(chapterIndex + 1, 'start');
          return;
        }
        props.onFinish(book.id);
        props.showToast(t('readerFinished'));
      }, [book.id, chapterIndex, chapters.length, dismissPopovers, goChapter, page, pageCount, pageH, pageW, props.onFinish, props.showToast, t, scrollMode, settings.writingMode]);

      const prevPage = useCallback(function previous() {
        if (scrollMode) {
          dismissPopovers();
          const element = columnsRef.current;
          if (!element) return;
          const vertical = settings.writingMode === 'vertical';
          const position = vertical ? Math.abs(element.scrollLeft) : element.scrollTop;
          if (position > 8) {
            const amount = Math.max(160, (vertical ? element.clientWidth : element.clientHeight) * 0.82);
            element.scrollBy({ left: vertical ? amount : 0, top: vertical ? 0 : -amount, behavior: 'smooth' });
            return;
          }
          if (chapterIndex > 0) {
            goChapter(chapterIndex - 1, 'last');
            return;
          }
          props.showToast(t('firstPage'));
          return;
        }
        if (!pageW || !pageH) return;
        dismissPopovers();
        if (page > 0) {
          setPage(page - 1);
          return;
        }
        if (chapterIndex > 0) {
          goChapter(chapterIndex - 1, 'last');
          return;
        }
        props.showToast(t('firstPage'));
      }, [chapterIndex, dismissPopovers, goChapter, page, pageH, pageW, props.showToast, t, scrollMode, settings.writingMode]);

      const applySettings = useCallback(function update(rawPatch, options) {
        const patch = Object.assign({}, rawPatch);
        if (patch.marginNotes === true) { patch.chapterRail = false; patch.marginFootnotes = false; }
        if (patch.chapterRail === true) { patch.marginNotes = false; patch.marginFootnotes = false; }
        if (patch.marginFootnotes === true) { patch.marginNotes = false; patch.chapterRail = false; }
        if (patch.writingMode === 'vertical') patch.layout = 'scroll';
        if (patch.layout && patch.layout !== 'scroll' && settingsRef.current.writingMode === 'vertical') patch.writingMode = 'horizontal';
        if (patch.marginFootnotes === true && typeof window !== 'undefined' && window.innerWidth < 760) patch.marginFootnotes = false;
        if (patch.marginNotes === true && typeof window !== 'undefined' && window.innerWidth < 1300) patch.marginNotes = false;
        // A quiet change (read-aloud speed, the ruler shortcut) is a preference, not a
        // new look: the preset stays as it is and the undo step keeps the last real edit.
        const quiet = (options && options.quiet === true) || Object.keys(patch).every(function isQuiet(key) {
          return READER_QUIET_SETTING_KEYS.indexOf(key) >= 0;
        });
        const next = quiet || Object.prototype.hasOwnProperty.call(patch, 'preset')
          ? patch
          : Object.assign({ preset: 'custom' }, patch);
        const storedNow = storedSettingsRef.current || {};
        const bookScope = settingsScopeRef.current === 'book';
        const existing = (storedNow.bookSettings && storedNow.bookSettings[book.id]) || {};
        const storedNext = bookScope
          ? Object.assign({}, storedNow, { bookSettings: Object.assign({}, storedNow.bookSettings || {}, { [book.id]: Object.assign({}, existing, next) }) })
          : Object.assign({}, storedNow, next);
        // Only re-anchor when the text really reflows. Picking the value that is
        // already selected would otherwise leave progress saving switched off
        // (nothing re-paginates to switch it back on) and a stale target behind.
        if (readerLayoutSignature(settingsRef.current, book.id) !== readerLayoutSignature(effectiveReaderSettings(storedNext, book.id), book.id)) {
          pendingRef.current = currentPercentRef.current;
          readyRef.current = false;
        }
        if (!quiet) {
          undoSettingsRef.current = { active: settingsRef.current, scope: settingsScopeRef.current, stored: storedSettingsRef.current };
          redoSettingsRef.current = null;
          setUndoAvailable(true);
          setRedoAvailable(false);
        }
        if (bookScope) {
          props.onUpdateSettings({ bookSettings: storedNext.bookSettings });
        } else {
          props.onUpdateSettings(next);
        }
        if ('layout' in patch || 'writingMode' in patch) {
          props.showToast(t('layoutPositionKept'));
        }
        setSavedPulse(true);
        if (savedPulseTimerRef.current) window.clearTimeout(savedPulseTimerRef.current);
        savedPulseTimerRef.current = window.setTimeout(function clearSaved() {
          savedPulseTimerRef.current = null;
          setSavedPulse(false);
        }, 3000);
      }, [book.id, props.onUpdateSettings, props.showToast, t]);

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

      useEffect(function clearSavedTimer() {
        return function cleanup() {
          if (savedPulseTimerRef.current) window.clearTimeout(savedPulseTimerRef.current);
        };
      }, []);

      useEffect(function settingsFocusLifecycle() {
        if (settingsOpen) {
          settingsReturnFocusRef.current = document.activeElement;
          const frame = window.requestAnimationFrame(function focusTab() {
            const target = document.getElementById('sr-settings-tab-' + settingsTab);
            if (target) target.focus();
          });
          return function cleanup() { window.cancelAnimationFrame(frame); };
        }
        const previous = settingsReturnFocusRef.current;
        settingsReturnFocusRef.current = null;
        if (previous && typeof previous.focus === 'function') {
          try { previous.focus({ preventScroll: true }); } catch (error) { /* ignore */ }
        }
        return undefined;
      }, [settingsOpen]);
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
        if (scrollMode) return undefined;
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
      }, [nextPage, prevPage, scrollMode]);

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

      useEffect(function resetSettingsScroll() {
        if (!settingsOpen) return;
        const panel = settingsPanelRef.current;
        if (panel) panel.scrollTop = 0;
      }, [settingsOpen, settingsTab]);

      useEffect(function enableAnimation() {
        if (animate) return undefined;
        const frame = window.requestAnimationFrame(function turnOn() { setAnimate(true); });
        return function cleanup() { window.cancelAnimationFrame(frame); };
      }, [animate, chapterIndex]);

      useLayoutEffect(function paginate() {
        if (scrollMode) {
          setPageCount(1);
          setTotalPages(1);
          readyRef.current = true;
          return undefined;
        }
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
        const totalColumns = Math.max(1, measuredCount);
        const nextCount = Math.max(1, spread ? Math.ceil(totalColumns / 2) : totalColumns);
        setTotalPages(totalColumns);
        setPageCount(nextCount);
        let target = pageRef.current;
        if (pendingRef.current !== null) {
          if (pendingRef.current === 'last') target = nextCount - 1;
          else if (typeof pendingRef.current === 'object' && pendingRef.current && pendingRef.current.page !== undefined) target = clamp(pendingRef.current.page, 0, nextCount - 1);
          else if (typeof pendingRef.current === 'object' && pendingRef.current && pendingRef.current.anchorId) {
            let el = null;
            try {
              const cleanAId = String(pendingRef.current.anchorId).replace(/^#/, '');
              const esc = cssEscapeIdent(cleanAId);
              el = element.querySelector('#' + esc) ||
                   element.querySelector('[name="' + esc + '"]') ||
                   element.querySelector('[data-slug="' + esc.toLowerCase() + '"]');
            } catch (e) {}
            if (el) target = anchorPageIndex(element, el, nextCount);
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
      }, [book.id, chapter.id, chapterIndex, pageW, pageH, gap, settings.fontSize, settings.lineHeight, settings.fontFamily, settings.letterSpacing, settings.paragraphSpacing, settings.pageWidth, settings.writingMode, layout, bookImageLayout, fontTick, chapterHighlights.length, spread, scrollMode, anchorPageIndex]);

      useEffect(function clearWidthDraft() {
        if (!settingsOpen) {
          widthDragRef.current = false;
          setWidthDraft(null);
        }
      }, [settingsOpen]);

      useEffect(function reportProgress() {
        if (!readyRef.current) return;
        const percent = scrollMode ? scrollRatio : (pageCount <= 1 ? 0 : clamp(page / (pageCount - 1), 0, 1));
        props.onProgress(book.id, chapterIndex, percent);
      }, [book.id, chapterIndex, page, pageCount, progressTick, props.onProgress, scrollMode, scrollRatio]);

      useEffect(function alignScrollChapter() {
        if (!scrollMode) return undefined;
        const element = columnsRef.current;
        if (!element) return undefined;
        let target = pendingRef.current;
        if (target === null || target === undefined) {
          target = chapterIndex === initialIndex
            ? (currentPercentRef.current || initialPercent)
            : 0;
        }
        let ratio = 0;
        let anchorId = '';
        if (target === 'last') ratio = 1;
        else if (typeof target === 'number') ratio = clamp(target, 0, 1);
        else if (target && typeof target === 'object' && typeof target.percent === 'number') ratio = clamp(target.percent, 0, 1);
        else if (target && typeof target === 'object' && target.page !== undefined && pageCount > 1) ratio = clamp(target.page / (pageCount - 1), 0, 1);
        else if (target && typeof target === 'object' && target.anchorId) anchorId = String(target.anchorId);
        pendingRef.current = null;
        const frame = window.requestAnimationFrame(function scrollTo() {
          if (anchorId) {
            let anchor = null;
            try {
              const cleanAId = anchorId.replace(/^#/, '');
              const esc = cssEscapeIdent(cleanAId);
              anchor = element.querySelector('#' + esc) || element.querySelector('[name="' + esc + '"]') || element.querySelector('[data-slug="' + esc.toLowerCase() + '"]');
            } catch (e) { /* ignore */ }
            if (anchor) anchor.scrollIntoView({ block: 'center', inline: 'center' });
          }
          const vertical = settings.writingMode === 'vertical';
          const max = Math.max(0, vertical ? element.scrollWidth - element.clientWidth : element.scrollHeight - element.clientHeight);
          if (!anchorId) {
            if (vertical) element.scrollLeft = -ratio * max;
            else element.scrollTop = ratio * max;
          }
          const position = vertical ? Math.abs(element.scrollLeft) : element.scrollTop;
          const actualRatio = anchorId && max > 0 ? clamp(position / max, 0, 1) : ratio;
          setScrollRatio(actualRatio);
          currentPercentRef.current = actualRatio;
          readyRef.current = true;
        });
        return function cleanup() { window.cancelAnimationFrame(frame); };
      }, [scrollMode, chapterIndex, initialIndex, initialPercent, pageCount, layout, settings.fontSize, settings.lineHeight, settings.fontFamily, settings.letterSpacing, settings.paragraphSpacing, settings.pageWidth, settings.writingMode, bookImageLayout, fontTick]);

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
            if (topMenuOpen) { setTopMenuOpen(false); return; }
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
              const next = (settings.readingGuide || 'none') === 'ruler' ? 'none' : 'ruler';
              applySettings({ readingGuide: next }, { quiet: true });
              props.showToast(next === 'ruler' ? t('rulerOn') : t('rulerOff'));
              return;
            }
            if (plainKey === 'g') {
              event.preventDefault();
              dismissPopovers();
              setPageJumpDraft(String(pageStart));
              setPageJumpOpen(true);
              return;
            }
            if (plainKey === 'u' || event.key === 'Backspace') {
              if (jumpReturn) {
                event.preventDefault();
                returnFromJump();
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
          if (scrollMode && !event.metaKey && !event.ctrlKey && !event.altKey && (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
            const element = columnsRef.current;
            if (element) {
              event.preventDefault();
              const vertical = settings.writingMode === 'vertical';
              if (vertical) {
                element.scrollBy({ left: event.key === 'ArrowLeft' ? 96 : -96, behavior: 'smooth' });
              } else {
                element.scrollBy({ top: event.key === 'ArrowDown' ? 96 : -96, behavior: 'smooth' });
              }
            }
            return;
          }
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
            if (scrollMode) scrollToRatio(0);
            else setPage(0);
            return;
          }
          if (action === 'lastPage') {
            event.preventDefault();
            dismissPopovers();
            if (scrollMode) scrollToRatio(1);
            else setPage(Math.max(0, pageCount - 1));
            return;
          }
        }
        window.addEventListener('keydown', onKey);
        return function cleanup() { window.removeEventListener('keydown', onKey); };
      }, [applySettings, bookmarkDraft, changeFontSize, chapterIndex, chapters.length, chrome, dismissPopovers, drawer, goChapter, helpOpen, jumpReturn, nextPage, noteDraft, page, pageCount, pageJumpOpen, pageStart, peek, prevPage, props.onExit, props.showToast, resetFontSize, scrollMode, scrollToRatio, settings.readingGuide, settings.writingMode, settingsOpen, t, toolbar, topMenuOpen, toggleBookmark, toggleFullscreen, toggleSpeech, zoomImage]);

      useEffect(function dismissOnOutside() {
        if (!toolbar && !peek && !pageJumpOpen && !topMenuOpen) return undefined;
        function onDown(event) {
          const target = event.target;
          if (target && typeof target.closest === 'function') {
            if (target.closest('.sr-selection-toolbar') || target.closest('.sr-hl-peek')) return;
            if (target.closest('.sr-page-jump-popover') || target.closest('.sr-page-jump-trigger')) return;
            if (target.closest('.sr-top-more') || target.closest('.sr-top-more-trigger')) return;
          }
          dismissPopovers();
        }
        document.addEventListener('pointerdown', onDown, true);
        return function cleanup() { document.removeEventListener('pointerdown', onDown, true); };
      }, [dismissPopovers, pageJumpOpen, peek, toolbar, topMenuOpen]);

      useEffect(function returnTopMenuFocus() {
        if (topMenuWasOpenRef.current && !topMenuOpen && topMoreButtonRef.current) topMoreButtonRef.current.focus();
        topMenuWasOpenRef.current = topMenuOpen;
      }, [topMenuOpen]);

      useEffect(function focusTopMenu() {
        if (!topMenuOpen || !topMenuRef.current) return undefined;
        const frame = window.requestAnimationFrame(function focus() {
          const first = topMenuRef.current && topMenuRef.current.querySelector('button');
          if (first) first.focus();
        });
        return function cleanup() { window.cancelAnimationFrame(frame); };
      }, [topMenuOpen]);

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
        if (!settings.immersive || !chrome) return undefined;
        if (drawer || settingsOpen || noteDraft || toolbar || peek) return undefined;
        const timer = window.setTimeout(function hideControls() {
          setChrome(false);
        }, 6000);
        return function cleanup() { window.clearTimeout(timer); };
      }, [settings.immersive, chrome, drawer, settingsOpen, noteDraft, toolbar, peek, page, chapterIndex]);

      useEffect(function applyImmersiveDefault() {
        setChrome(!settings.immersive);
      }, [settings.immersive]);

      useEffect(function revealChromeAtEdges() {
        if (!settings.immersive) return undefined;
        const element = readerRef.current;
        if (!element || typeof element.addEventListener !== 'function') return undefined;
        let hideTimer = null;
        function scheduleHide() {
          if (hideTimer) window.clearTimeout(hideTimer);
          hideTimer = window.setTimeout(function hide() {
            hideTimer = null;
            if (!drawer && !settingsOpen && !noteDraft && !toolbar && !peek) setChrome(false);
          }, 2800);
        }
        function onMove(event) {
          const rect = element.getBoundingClientRect();
          const y = event.clientY - rect.top;
          if (y < 56 || y > rect.height - 56) {
            setChrome(true);
            scheduleHide();
          }
        }
        function onLeave() {
          if (!drawer && !settingsOpen && !noteDraft && !toolbar && !peek) setChrome(false);
        }
        element.addEventListener('pointermove', onMove);
        element.addEventListener('pointerleave', onLeave);
        return function cleanup() {
          if (hideTimer) window.clearTimeout(hideTimer);
          element.removeEventListener('pointermove', onMove);
          element.removeEventListener('pointerleave', onLeave);
        };
      }, [settings.immersive, drawer, settingsOpen, noteDraft, toolbar, peek]);

      useEffect(function centerFocusBand() {
        if (settings.readingGuide === 'focus' && box.h) setRulerY(Math.round(box.h * 0.45));
      }, [settings.readingGuide, box.h]);

      useEffect(function eyeCareTimer() {
        const timer = setInterval(function checkRest() {
          const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 60000);
          if (elapsed > 0 && elapsed % 30 === 0 && eyeCareMinuteRef.current !== elapsed) {
            eyeCareMinuteRef.current = elapsed;
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
        // Measured in the paragraph's rendered text; selectionHighlightRange maps it
        // back to raw offsets through the paragraph's inline map.
        const local = range.toString().length;
        if (typeof offsets.offsets[index] !== 'number') return null;
        return { paragraph: index, local: local };
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
        const picked = selectionHighlightRange(chapter.paragraphs, offsets.offsets, paragraphLayout.maps, first, second);
        if (!picked) return;
        const startOffset = picked.start;
        const endOffset = picked.end;
        const text = picked.text;
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

      function handleRootTouchStart(event) {
        if (!event.touches || !event.touches[0]) return;
        touchStartYRef.current = event.touches[0].clientY;
      }

      function handleRootTouchEnd() {
        if (!settings.immersive) return;
        if (drawer || settingsOpen || noteDraft) return;
        const element = readerRef.current;
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const y = touchStartYRef.current - rect.top;
        if (y < 64 || y > rect.height - 64) setChrome(true);
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
          const cleanTargetId = targetId ? targetId.replace(/^#/, '') : '';

          // 1. Is this a footnote?
          const isNoteRef = /noteref|footnote|comment/i.test(epubType) ||
            /noteref|doc-noteref/i.test(role) ||
            /noteref|footnote/i.test(className) ||
            /(^|[-_])(fn|footnote|note|comment)([-_0-9]|$)/i.test(cleanTargetId) ||
            Boolean(anchor.closest('sup')) ||
            /^[\[(]?[0-9*注†‡§#]+[\])]?$/.test(anchor.textContent.trim());

          if (cleanTargetId && (isNoteRef || !targetPath)) {
            let el = null;
            try {
              const esc = cssEscapeIdent(cleanTargetId);
              el = (columnsRef.current && (
                columnsRef.current.querySelector('#' + esc) ||
                columnsRef.current.querySelector('[name="' + esc + '"]') ||
                columnsRef.current.querySelector('[data-slug="' + esc.toLowerCase() + '"]')
              )) || document.getElementById(cleanTargetId);
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
              const idPattern = new RegExp('(?:id|name)=["\']' + cleanTargetId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\']', 'i');
              const rawFnId = cleanTargetId.replace(/^fn[-_]/i, '');
              const mdFnPattern = new RegExp('^\\[\\^' + rawFnId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\]:\\s*([\\s\\S]*)$', 'm');
              for (let i = 0; i < chapters.length; i += 1) {
                const c = chapters[i];
                const pList = c.paragraphs || [];
                const foundIdx = pList.findIndex(function(p) {
                  return idPattern.test(p) || mdFnPattern.test(p);
                });
                if (foundIdx >= 0) {
                  let p = pList[foundIdx];
                  const mdm = p.match(mdFnPattern);
                  if (mdm) {
                    noteText = mdm[1].trim();
                    noteHtml = '<p>' + mdm[1].trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>';
                    break;
                  }
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
                id: cleanTargetId,
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
          if (cleanTargetId && (!targetPath || targetPath === (chapter.href || '') || targetPath === (chapter.path || ''))) {
            let el = null;
            try {
              const esc = cssEscapeIdent(cleanTargetId);
              el = (columnsRef.current && (
                columnsRef.current.querySelector('#' + esc) ||
                columnsRef.current.querySelector('[name="' + esc + '"]') ||
                columnsRef.current.querySelector('[data-slug="' + esc.toLowerCase() + '"]')
              )) || document.getElementById(cleanTargetId);
            } catch (e) { /* ignore */ }
            if (el && columnsRef.current && columnsRef.current.contains(el)) {
              dismissPopovers();
              rememberJumpReturn();
              if (scrollMode) {
                el.scrollIntoView({ block: 'center', inline: 'center' });
                const element = columnsRef.current;
                const vertical = settings.writingMode === 'vertical';
                const max = Math.max(0, vertical ? element.scrollWidth - element.clientWidth : element.scrollHeight - element.clientHeight);
                const position = vertical ? Math.abs(element.scrollLeft) : element.scrollTop;
                const ratio = max > 0 ? clamp(position / max, 0, 1) : 0;
                setScrollRatio(ratio);
                currentPercentRef.current = ratio;
                return;
              }
              setPage(anchorPageIndex(columnsRef.current, el, pageCount));
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
          if (cleanTargetId) {
            const idPattern = new RegExp('(?:id|name)=["\']' + cleanTargetId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\']', 'i');
            const targetIdClean = cleanTargetId.toLowerCase().replace(/[-_]+/g, ' ').trim();
            const candidateIdx = chapters.findIndex(function(c) {
              if (c.id === cleanTargetId) return true;
              if (c.title && c.title.toLowerCase().trim() === targetIdClean) return true;
              return (c.paragraphs || []).some(function(p) {
                if (idPattern.test(p)) return true;
                const cleanP = p.replace(/^#+\s*/, '').trim().toLowerCase();
                return cleanP === targetIdClean || cleanP.replace(/[^\w\u4e00-\u9fa5-]+/g, '-') === cleanTargetId.toLowerCase();
              });
            });
            if (candidateIdx >= 0) {
              targetChapIdx = candidateIdx;
            }
          }

          if (targetChapIdx >= 0) {
            dismissPopovers();
            rememberJumpReturn();
            if (cleanTargetId) {
              goChapter(targetChapIdx, 'anchor', cleanTargetId);
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
        if (ratio < 0.12) prevPage();
        else if (ratio > 0.88) nextPage();
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

      // Where "return" brings the reader back to. The percent is what counts in the
      // scroll layout, where there is only ever one "page".
      function rememberJumpReturn() {
        setJumpReturn({ chapterIndex: chapterIndex, page: page, percent: currentPercentRef.current });
      }

      function returnFromJump() {
        const previous = jumpReturn;
        if (!previous) return;
        setJumpReturn(null);
        if (scrollMode) {
          goChapter(previous.chapterIndex, 'percent', typeof previous.percent === 'number' ? previous.percent : 0);
        } else if (previous.chapterIndex === chapterIndex) {
          setPage(clamp(previous.page, 0, Math.max(0, pageCount - 1)));
        } else {
          goChapter(previous.chapterIndex, 'page', previous.page);
        }
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
          if (scrollMode && columnsRef.current) {
            const element = columnsRef.current;
            const vertical = settings.writingMode === 'vertical';
            const max = Math.max(0, vertical ? element.scrollWidth - element.clientWidth : element.scrollHeight - element.clientHeight);
            if (vertical) element.scrollLeft = -targetPercent * max;
            else element.scrollTop = targetPercent * max;
            setScrollRatio(targetPercent);
            currentPercentRef.current = targetPercent;
          } else {
            const targetPage = Math.round(targetPercent * Math.max(0, countRef.current - 1));
            if (targetPage !== pageRef.current) setPage(targetPage);
          }
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

      function dismissTour() {
        setTourOpen(false);
        try { window.localStorage.setItem('sr-reader-tour-v1', '1'); } catch (error) { /* ignore */ }
      }

      function closeTopOverlay() {
        if (noteDraft) { setNoteDraft(null); return; }
        if (settingsOpen) { setSettingsOpen(false); return; }
        if (drawer) { setDrawer(null); return; }
        setToolbar(null);
        setPeek(null);
        setFootnote(null);
      }

      // Highlights are stored in raw paragraph offsets; `map` (inlineOffsetMap) turns
      // them into rendered positions, so a highlight on a paragraph with `**`,
      // `[^n]` or link syntax wraps the words the reader chose and never splits a
      // Markdown token.
      function segmentParagraph(map, base, highlights) {
        const length = map.rendered.length;
        const ranges = [];
        highlights.forEach(function collect(item) {
          const start = clamp(inlineRenderedOffset(map, item.start - base, 'start'), 0, length);
          const end = clamp(inlineRenderedOffset(map, item.end - base, 'end'), 0, length);
          if (end > start) ranges.push({ item: item, start: start, end: end });
        });
        if (!ranges.length) return renderInlineRange(map, 0, length, 'p-' + base);
        ranges.sort(function order(a, b) { return a.start - b.start; });
        const nodes = [];
        let cursor = 0;
        ranges.forEach(function range(item) {
          const start = Math.max(cursor, item.start);
          const end = Math.max(start, item.end);
          if (start > cursor) {
            nodes.push.apply(nodes, renderInlineRange(map, cursor, start, 'r-' + base + '-' + cursor));
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
            }, renderInlineRange(map, start, end, 'hl-' + base + '-' + start)));
          }
          cursor = Math.max(cursor, end);
        });
        if (cursor < length) {
          nodes.push.apply(nodes, renderInlineRange(map, cursor, length, 'r-' + base + '-' + cursor));
        }
        return nodes;
      }

      // The nodes, and for each paragraph drawn through segmentParagraph its inline
      // offset map (other paragraphs show their clean raw text, so they need none).
      const paragraphLayout = useMemo(function calcNodes() {
        const maps = [];
        const nodes = chapter.paragraphs.map(function paragraph(text, index) {
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
          let safeText = text;
          if (!safeText.includes('<blockquote')) safeText = safeText.replace(/<\/blockquote\s*>/gi, '');
          if (!safeText.includes('<table')) safeText = safeText.replace(/<\/table\s*>/gi, '');
          if (!safeText.includes('<aside')) safeText = safeText.replace(/<\/aside\s*>/gi, '');
          if (!safeText.includes('<figure')) safeText = safeText.replace(/<\/figure\s*>/gi, '');
          if (!safeText.includes('<pre')) safeText = safeText.replace(/<\/pre\s*>/gi, '');
          if (!safeText.includes('<ul')) safeText = safeText.replace(/<\/ul\s*>/gi, '');
          if (!safeText.includes('<ol')) safeText = safeText.replace(/<\/ol\s*>/gi, '');
          const trimmed = safeText.trim();
          if (!trimmed) return null;

          // 0. Drop orphaned container tags so they never render as plain text
          if (/^<\/?(?:blockquote|table|aside|figure|pre|code|ul|ol|li|div|p|span|section|article|h[1-6])\s*>$/i.test(trimmed)) {
            return null;
          }

          // 1. EPUB Rich HTML block (ruby, strong, em, table, blockquote, footnotes, headings)
          if (/<\/?([a-z0-9]+)\b[^>]*>/i.test(safeText)) {
            const base = offsets.offsets[index];
            const cleanLen = stripHtmlTags(safeText).length;
            const relevantHls = chapterHighlights.filter(function(h) {
              return h.end > base && h.start < base + cleanLen;
            });
            const renderedHtml = applyHtmlHighlights(sanitizeReaderHtml(safeText), base, relevantHls);

            if (/^<table\b/i.test(trimmed)) {
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
            if (/^<blockquote\b/i.test(trimmed)) {
              const bqIdMatch = trimmed.match(/^<blockquote\b[^>]*\bid=["']([^"']+)["']/i);
              const bqClassMatch = trimmed.match(/^<blockquote\b[^>]*\bclass=["']([^"']+)["']/i);
              const bqInner = renderedHtml.replace(/^<blockquote\b[^>]*>/i, '').replace(/<\/blockquote\s*>$/i, '');
              return h('blockquote', {
                key: index,
                'data-p': index,
                id: bqIdMatch ? bqIdMatch[1] : undefined,
                className: 'sr-quote' + (bqClassMatch ? ' ' + bqClassMatch[1] : ''),
                dangerouslySetInnerHTML: { __html: bqInner }
              });
            }
            if (/^<h[1-6]\b/i.test(trimmed)) {
              const Tag = trimmed.slice(1, 3).toLowerCase();
              return h(Tag, {
                key: index,
                'data-p': index,
                className: 'sr-subheading',
                dangerouslySetInnerHTML: { __html: renderedHtml.replace(/^<h[1-6]\b[^>]*>/i, '').replace(/<\/h[1-6]\s*>$/i, '') }
              });
            }
            if (/^<aside\b/i.test(trimmed)) {
              const idMatch = trimmed.match(/\bid=["']([^"']+)["']/i);
              return h('aside', {
                key: index,
                'data-p': index,
                id: idMatch ? idMatch[1] : undefined,
                className: 'sr-aside-note',
                dangerouslySetInnerHTML: { __html: renderedHtml.replace(/^<aside\b[^>]*>/i, '').replace(/<\/aside\s*>$/i, '') }
              });
            }
            if (trimmed.startsWith('<hr')) {
              return h('div', { key: index, 'data-p': index, className: 'sr-divider-wrap' }, h('hr', { className: 'sr-divider' }));
            }
            if (/^<pre\b/i.test(trimmed)) {
              const codeMatch = trimmed.match(/^<pre\b[^>]*><code\b(?:\s+class=["']([^"']*)["'])?[^>]*>([\s\S]*?)<\/code><\/pre\s*>$/i);
              const langMatch = (codeMatch && codeMatch[1] && codeMatch[1].match(/(?:language-|lang-)?([a-z0-9_-]+)/i)) || trimmed.match(/class=["'](?:language-|lang-|brush:\s*)?([a-z0-9_-]+)/i);
              const lang = (langMatch && langMatch[1]) ? langMatch[1].toUpperCase() : '';
              const preInner = renderedHtml.replace(/^<pre\b[^>]*>/i, '').replace(/<\/pre\s*>$/i, '');
              const plainCode = stripHtmlTags(preInner);
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
                      copyTextToClipboard(plainCode).then(function() {
                        props.showToast(t('copied'));
                      });
                    },
                  }, t('copyShort')),
                ),
                h('pre', {
                  className: 'sr-code-pre',
                  tabIndex: 0,
                  dangerouslySetInnerHTML: { __html: preInner }
                })
              );
            }
            if (/^<(?:ul|ol)\b/i.test(trimmed)) {
              const Tag = trimmed.startsWith('<ol') ? 'ol' : 'ul';
              return h(Tag, {
                key: index,
                'data-p': index,
                style: { margin: 'calc(var(--sr-para-gap,.9em) * .8) 0', paddingLeft: '1.8em', textIndent: 0 },
                dangerouslySetInnerHTML: { __html: renderedHtml.replace(/^<(?:ul|ol)\b[^>]*>/i, '').replace(/<\/(?:ul|ol)\s*>$/i, '') }
              });
            }
            if (/^<figure\b/i.test(trimmed)) {
              return h('figure', {
                key: index,
                'data-p': index,
                className: 'sr-figure',
                dangerouslySetInnerHTML: { __html: renderedHtml.replace(/^<figure\b[^>]*>/i, '').replace(/<\/figure\s*>$/i, '') }
              });
            }
            const pIdMatch = trimmed.match(/^<p\b[^>]*\bid=["']([^"']+)["']/i);
            const pClassMatch = trimmed.match(/^<p\b[^>]*\bclass=["']([^"']+)["']/i);
            const pInnerHtml = /^<p\b[^>]*>/i.test(renderedHtml)
              ? renderedHtml.replace(/^<p\b[^>]*>/i, '').replace(/<\/p\s*>$/i, '')
              : renderedHtml;
            return h('p', {
              key: index,
              'data-p': index,
              id: pIdMatch ? pIdMatch[1] : undefined,
              className: pClassMatch ? pClassMatch[1] : undefined,
              dangerouslySetInnerHTML: { __html: pInnerHtml }
            });
          }

          // 2. Divider line (***, ---, ___, ~~~, ❦, etc.)
          const isDivider = /^([*\-_~=—·❦]\s*){3,}$/.test(trimmed) || trimmed === '❦' || trimmed === '···' || trimmed === '———';
          if (isDivider) {
            return h('div', {
              key: index,
              'data-p': index,
              className: 'sr-divider-wrap',
            }, h('hr', { className: 'sr-divider' }));
          }

          // 2. Fenced code block (```lang ... ``` or ~~~lang ... ~~~)
          const isFencedBlock = (function checkFenced() {
            if (!trimmed.startsWith('```') && !trimmed.startsWith('~~~')) return false;
            const fence = trimmed.startsWith('```') ? '```' : '~~~';
            if (text.includes('\n')) return true;
            const afterOpen = trimmed.slice(fence.length).trim();
            return afterOpen.includes(fence);
          })();

          if (isFencedBlock) {
            const lines = text.split('\n');
            const firstLine = lines[0].trim();
            const fence = firstLine.startsWith('```') ? '```' : '~~~';
            const lang = firstLine.slice(fence.length).trim().replace(/[^a-zA-Z0-9_#-]/g, '');
            const lastLine = lines[lines.length - 1].trim();
            const codeLines = lines.length > 1
              ? lines.slice(1, (lines.length > 1 && lastLine.startsWith(fence)) ? lines.length - 1 : lines.length)
              : [trimmed.slice(fence.length, trimmed.lastIndexOf(fence)).trim()];
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

          // 7b. Markdown footnote definition: [^1]: Note text
          const fnDefMatch = trimmed.match(/^\[\^([^\]]+)\]:\s*([\s\S]*)$/);
          if (fnDefMatch) {
            const fnId = fnDefMatch[1];
            const fnBody = fnDefMatch[2];
            return h('aside', {
              key: index,
              'data-p': index,
              id: 'fn-' + fnId,
              className: 'sr-footnote-def',
              'epub:type': 'footnote',
              role: 'doc-footnote',
            },
              h('span', { className: 'sr-footnote-label', style: { fontWeight: 'bold', marginRight: '6px' } }, '[' + fnId + ']:'),
              renderInline(fnBody, 'fnb-' + index)
            );
          }

          // 8. Subheadings (##, ###, etc.)
          const headingMatch = trimmed.match(/^(#{2,6})\s+(.+)$/);
          if (headingMatch) {
            const level = headingMatch[1].length;
            const headingClean = headingMatch[2].trim();
            const headingSlug = headingClean.toLowerCase().replace(/[^\w\u4e00-\u9fa5-]+/g, '-').replace(/^-+|-+$/g, '');
            const Tag = 'h' + Math.min(6, level + 1);
            return h(Tag, {
              key: index,
              'data-p': index,
              className: 'sr-subheading',
              id: headingSlug || ('h-' + index),
              'data-slug': headingSlug,
            }, segmentParagraph(maps[index] = inlineOffsetMap(headingClean, (text.length - text.trimStart().length) + (trimmed.length - headingMatch[2].length)), offsets.offsets[index], chapterHighlights));
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
          }, segmentParagraph(maps[index] = inlineOffsetMap(text, 0), offsets.offsets[index], chapterHighlights));
        });
        return { nodes: nodes, maps: maps };
      }, [chapter.id, chapter.paragraphs, chapter.images, chapterHighlights, offsets]);
      const paragraphNodes = paragraphLayout.nodes;

      function railPinButton() {
        if (!dockedRail) return null;
        return h('button', {
          type: 'button',
          className: 'sr-reader-icon sr-rail-pin',
          'data-on': railPinned ? 'true' : 'false',
          title: railPinned ? t('unpinRail') : t('pinRail'),
          'aria-label': railPinned ? t('unpinRail') : t('pinRail'),
          onClick: function togglePin() { setRailPinned(!railPinned); },
        }, h(Icon, { name: 'pin', size: 14 }));
      }

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
          dockedRail ? null : h('div', { className: 'sr-scrim', onClick: function close() { setDrawer(null); } }),
          h('aside', { className: 'sr-drawer ' + (dockedRail ? 'sr-drawer--docked' : 'sr-drawer--left'), role: dockedRail ? 'complementary' : 'dialog', 'aria-modal': dockedRail ? 'false' : 'true', 'aria-label': t('bookNotes') },
            railPinButton(),
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
                            h('button', { type: 'button', className: 'sr-mini-action', onClick: function jump() { rememberJumpReturn(); jumpToHighlight(note); } }, t('jumpToText')),
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
                      h('button', { type: 'button', className: 'sr-bookmark-main', onClick: function jump() { rememberJumpReturn(); goChapter(item.chapterIndex, 'percent', item.percent); } },
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
          dockedRail ? null : h('div', { className: 'sr-scrim', onClick: function close() { setDrawer(null); } }),
          h('aside', { className: 'sr-drawer' + (dockedRail ? ' sr-drawer--docked' : ''), role: dockedRail ? 'complementary' : 'dialog', 'aria-modal': dockedRail ? 'false' : 'true', 'aria-label': t('readerToc') },
            railPinButton(),
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
                  onClick: function open() { rememberJumpReturn(); goChapter(item.index, 'resume'); },
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
          dockedRail ? null : h('div', { className: 'sr-scrim', onClick: function close() { setDrawer(null); } }),
          h('aside', { className: 'sr-drawer ' + (dockedRail ? 'sr-drawer--docked' : 'sr-drawer--left') + ' sr-drawer--search', role: dockedRail ? 'complementary' : 'dialog', 'aria-modal': dockedRail ? 'false' : 'true', 'aria-label': t('searchInBook') },
            railPinButton(),
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
                          onClick: function jump() { rememberJumpReturn(); jumpToSearchResult(item, index); },
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
        const themeName = settings.theme === 'auto'
          ? t('themeAuto') + ' · ' + t('theme' + activeThemeId.charAt(0).toUpperCase() + activeThemeId.slice(1))
          : t('theme' + activeThemeId.charAt(0).toUpperCase() + activeThemeId.slice(1));
        const defaultPageWidth = (typeof window !== 'undefined' && window.innerWidth < 760) ? 'compact' : 'comfortable';
        const pageWidthLabel = settings.pageWidth === 'custom'
          ? settings.pageWidthPx + 'px'
          : settings.pageWidth === 'compact' ? t('widthCompact')
            : settings.pageWidth === 'wide' ? t('widthWide')
              : settings.pageWidth === 'full' ? t('widthFull')
                : t('widthComfortable');
        const dirtySettings = {
          appearance: settings.theme !== 'paper' || (settings.highlightColor || 'amber') !== 'amber',
          typography: settings.fontSize !== 19 || settings.lineHeight !== 1.95 || settings.fontFamily !== 'serif' || settings.letterSpacing !== 0.02 || settings.paragraphSpacing !== 0.9 || bookImageLayout !== 'inline' || (settings.writingMode || 'horizontal') !== 'horizontal',
          layout: (settings.layout || 'page') !== 'page' || settings.immersive === true || settings.marginNotes === true || settings.marginFootnotes === true || settings.chapterRail === true || (settings.spreadGutter || 'comfortable') !== 'comfortable' || settings.spreadRule === false,
          reading: (settings.readingGuide || 'none') !== 'none' || settings.pageWidth !== defaultPageWidth || (settings.dockMode || 'auto') !== 'auto',
        };
        const dirtyCount = Object.keys(dirtySettings).filter(function key(name) { return dirtySettings[name]; }).length;
        const settingsTabs = [
          { id: 'appearance', label: t('settingsTabAppearance') },
          { id: 'typography', label: t('settingsTabTypography') },
          { id: 'layout', label: t('settingsTabLayout') },
          { id: 'reading', label: t('settingsTabReading') },
        ];
        function typeField(field) {
          return h('div', {
            key: field.id,
            className: 'sr-type-field' + (field.full ? ' sr-type-field--full' : ''),
            'data-setting': field.id,
          },
            h('div', { className: 'sr-type-label' },
              h('span', null, field.label),
              field.value ? h('em', null, field.value) : null,
            ),
            field.control,
          );
        }
        function readingRow(row) {
          return h('div', { key: row.id, className: 'sr-settings-row', 'data-setting': row.id },
            h('div', { className: 'sr-settings-row-copy' },
              h('strong', null, row.label),
              h('p', null, row.hint),
            ),
            h('button', {
              type: 'button',
              role: 'switch',
              className: 'sr-switch',
              'aria-checked': row.checked,
              'aria-label': row.label,
              onClick: row.onToggle,
            }, h('span', { className: 'sr-switch-thumb' })),
          );
        }
        const presetSettings = {
          classic: {
            preset: 'classic', theme: 'paper', pageWidthPx: 860, layout: 'page', spreadGutter: 'comfortable', spreadRule: true, fontFamily: 'serif', fontSize: 19,
            lineHeight: 1.95, pageWidth: 'comfortable', letterSpacing: 0.02, paragraphSpacing: 0.9,
            immersive: false, dockMode: 'standard', readingGuide: 'none',
            imageLayout: 'inline', writingMode: 'horizontal',
          },
          magazine: {
            preset: 'magazine', theme: 'snow', pageWidthPx: 1120, layout: 'spread', spreadGutter: 'compact', spreadRule: false, fontFamily: 'sans', fontSize: 18,
            lineHeight: 1.8, pageWidth: 'wide', letterSpacing: 0.015, paragraphSpacing: 1.05,
            immersive: false, dockMode: 'standard', readingGuide: 'none',
            imageLayout: 'wide', writingMode: 'horizontal',
          },
          minimal: {
            preset: 'minimal', theme: 'paper', pageWidthPx: 860, layout: 'page', spreadGutter: 'comfortable', spreadRule: true, fontFamily: 'serif', fontSize: 19,
            lineHeight: 1.9, pageWidth: 'comfortable', letterSpacing: 0.02, paragraphSpacing: 0.9,
            immersive: true, dockMode: 'minimal', readingGuide: 'none',
            imageLayout: 'inline', writingMode: 'horizontal',
          },
        };
        function applyPreset(name) {
          const next = presetSettings[name];
          if (next) {
            const imageLayout = next.imageLayout || 'inline';
            applySettings(Object.assign({}, next, {
              imageLayouts: Object.assign({}, settings.imageLayouts || {}, { [book.id]: imageLayout }),
            }));
          }
        }
        function resetCurrentTab() {
          if (settingsTab === 'appearance') {
            applySettings({ theme: 'paper', highlightColor: 'amber' });
          } else if (settingsTab === 'typography') {
            applySettings({ fontFamily: 'serif', fontSize: 19, lineHeight: 1.95, letterSpacing: 0.02, paragraphSpacing: 0.9, imageLayout: 'inline', imageLayouts: imageLayoutsWithoutBook(), writingMode: 'horizontal' });
          } else if (settingsTab === 'layout') {
            applySettings({
              layout: 'page', immersive: false,
              chapterRail: false, marginNotes: false, marginFootnotes: false,
              spreadGutter: 'comfortable', spreadRule: true,
            });
          } else {
            applySettings(readingTabDefaults());
          }
        }
        // The page this book renders picks its picture layout from imageLayouts first,
        // so a reset has to drop the book's entry there as well.
        function imageLayoutsWithoutBook() {
          const next = Object.assign({}, settings.imageLayouts || {});
          delete next[book.id];
          return next;
        }
        // Same values a fresh install starts with (see defaultState): auto dock and a
        // page width that suits the screen, so phones keep the thumb dock and the
        // compact width.
        function readingTabDefaults() {
          const narrow = typeof window !== 'undefined' && window.innerWidth < 760;
          return { readingGuide: 'none', dockMode: 'auto', pageWidth: narrow ? 'compact' : 'comfortable', pageWidthPx: narrow ? 680 : 860 };
        }
        function resetAllSettings() {
          applySettings(Object.assign({}, presetSettings.classic, readingTabDefaults(), {
            highlightColor: 'amber',
            marginNotes: false, marginFootnotes: false, chapterRail: false,
            imageLayouts: imageLayoutsWithoutBook(),
          }));
        }
        function restoreSettingsSnapshot(snapshot) {
          const current = storedSettingsRef.current || {};
          let patch;
          if (snapshot.scope === 'book') {
            const stored = snapshot.stored || {};
            const overrides = Object.assign({}, current.bookSettings || {});
            const previous = (stored.bookSettings && stored.bookSettings[book.id]) || null;
            if (previous) overrides[book.id] = previous;
            else delete overrides[book.id];
            patch = { bookSettings: overrides };
          } else {
            // The global settings as they were. snapshot.active has this book's own
            // settings merged in, which must not leak into the global ones.
            patch = Object.assign({}, snapshot.stored || snapshot.active, { bookSettings: current.bookSettings || {} });
          }
          if (readerLayoutSignature(settingsRef.current, book.id) !== readerLayoutSignature(effectiveReaderSettings(Object.assign({}, current, patch), book.id), book.id)) {
            pendingRef.current = currentPercentRef.current;
            readyRef.current = false;
          }
          props.onUpdateSettings(patch);
        }
        function undoLastSettings() {
          const snapshot = undoSettingsRef.current;
          if (!snapshot) return;
          redoSettingsRef.current = { active: settingsRef.current, scope: settingsScopeRef.current, stored: storedSettingsRef.current };
          setRedoAvailable(true);
          undoSettingsRef.current = null;
          setUndoAvailable(false);
          setSavedPulse(false);
          if (savedPulseTimerRef.current) window.clearTimeout(savedPulseTimerRef.current);
          restoreSettingsSnapshot(snapshot);
        }
        function redoLastSettings() {
          const snapshot = redoSettingsRef.current;
          if (!snapshot) return;
          undoSettingsRef.current = { active: settingsRef.current, scope: settingsScopeRef.current, stored: storedSettingsRef.current };
          setUndoAvailable(true);
          redoSettingsRef.current = null;
          setRedoAvailable(false);
          setSavedPulse(false);
          if (savedPulseTimerRef.current) window.clearTimeout(savedPulseTimerRef.current);
          restoreSettingsSnapshot(snapshot);
        }
        function clearBookOverrides() {
          if (!clearBookConfirm) { setClearBookConfirm(true); return; }
          const stored = storedSettingsRef.current;
          undoSettingsRef.current = { active: settingsRef.current, scope: settingsScopeRef.current, stored: stored };
          setUndoAvailable(true);
          setClearBookConfirm(false);
          const overrides = Object.assign({}, stored.bookSettings || {});
          delete overrides[book.id];
          if (readerLayoutSignature(settingsRef.current, book.id) !== readerLayoutSignature(stored, book.id)) {
            pendingRef.current = currentPercentRef.current;
            readyRef.current = false;
          }
          props.onUpdateSettings({ bookSettings: overrides });
          setSavedPulse(true);
          if (savedPulseTimerRef.current) window.clearTimeout(savedPulseTimerRef.current);
          savedPulseTimerRef.current = window.setTimeout(function clearSaved() { savedPulseTimerRef.current = null; setSavedPulse(false); }, 3000);
        }
        function trapSettingsFocus(event) {
          if (event.key === 'Escape') {
            event.preventDefault();
            setSettingsOpen(false);
            return;
          }
          if (event.key !== 'Tab') return;
          const focusables = Array.from(event.currentTarget.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'))
            .filter(function visible(element) { return element.offsetParent !== null; });
          if (!focusables.length) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
        const searchItems = [
          { tab: 'appearance', id: '', label: t('theme') },
          { tab: 'appearance', id: '', label: t('highlightColor') },
          { tab: 'typography', id: 'font-family', label: t('fontFamily') },
          { tab: 'typography', id: 'font-size', label: t('fontSize') },
          { tab: 'typography', id: 'line-height', label: t('lineHeight') },
          { tab: 'typography', id: 'letter-spacing', label: t('letterSpacing') },
          { tab: 'typography', id: 'paragraph-spacing', label: t('paragraphSpacing') },
          { tab: 'reading', id: 'page-width', label: t('pageWidth') },
          { tab: 'layout', id: '', label: t('readingPreset') },
          { tab: 'layout', id: '', label: t('readingLayout') },
          { tab: 'layout', id: 'immersive', label: t('immersive') },
          { tab: 'layout', id: 'margin-aux', label: t('marginAux') },
          { tab: 'reading', id: 'dock-mode', label: t('dockMode') },
          { tab: 'layout', id: '', label: t('spreadGutter') },
          { tab: 'layout', id: '', label: t('spreadRule') },
          { tab: 'typography', id: 'font-family', label: t('fontSerif') },
          { tab: 'typography', id: 'font-family', label: t('fontSans') },
          { tab: 'typography', id: 'font-family', label: t('fontKai') },
          { tab: 'reading', id: 'reading-guide', label: t('readingGuide') },
          { tab: 'reading', id: '', label: t('speechRate') },
        ];
        const searchResults = settingsQuery.trim()
          ? searchItems.filter(function match(item) { return item.label.toLowerCase().indexOf(settingsQuery.trim().toLowerCase()) >= 0; }).slice(0, 6)
          : [];
        function goToSetting(item) {
          setSettingsTab(item.tab);
          setSettingsSearchOpen(false);
          setSettingsQuery('');
          window.requestAnimationFrame(function first() {
            window.requestAnimationFrame(function second() {
              if (!item.id) {
                const panel = settingsPanelRef.current;
                if (panel) panel.scrollTop = 0;
                return;
              }
              const target = document.querySelector('[data-setting="' + item.id + '"]');
              if (target) {
                const details = target.closest('details');
                if (details) details.open = true;
                target.scrollIntoView({ block: 'center', behavior: 'smooth' });
              }
            });
          });
        }
        const appearancePanel = h('div', { className: 'sr-tab-page' },
          h('div', { className: 'sr-settings-section' },
            h('div', { className: 'sr-settings-section-head' },
              h('span', null, t('theme')),
              h('em', null, themeName),
            ),
            h('div', { className: 'sr-settings-theme-grid' },
              READER_THEMES.filter(function visible(themeItem) { return ['paper', 'candle', 'snow', 'night', 'eink'].indexOf(themeItem.id) >= 0; }).map(function swatch(themeItem) {
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
                type: 'button',
                className: 'sr-theme-swatch sr-theme-swatch--auto',
                'aria-pressed': settings.theme === 'auto',
                'aria-label': t('themeAuto'),
                title: t('themeAuto'),
                style: { '--sw-bg': READER_THEMES[0].bg, '--sw-ink': READER_THEMES[0].ink },
                onClick: function pick() { applySettings({ theme: 'auto' }); },
              },
                h('span', null, t('themeAuto')),
                settings.theme === 'auto' ? h('span', { className: 'sr-theme-check', 'aria-hidden': 'true' }, h(Icon, { name: 'check', size: 10 })) : null,
              ),
            ),
          ),
          h('div', { className: 'sr-settings-section' },
            h('div', { className: 'sr-settings-section-head' },
              h('span', null, t('highlightColor')),
            ),
            h('div', { className: 'sr-settings-color-row' },
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
        );
        const typographyPanel = h('div', { className: 'sr-tab-page sr-type-page' },
          h('div', { className: 'sr-type-grid' },
            typeField({
              id: 'font-family', full: true, label: t('fontFamily'),
              control: h('div', { className: 'sr-segment sr-segment--wide' },
                h('button', { type: 'button', 'aria-pressed': settings.fontFamily === 'serif', onClick: function serif() { applySettings({ fontFamily: 'serif' }); }, style: { flex: 1 } }, t('fontSerif')),
                h('button', { type: 'button', 'aria-pressed': settings.fontFamily === 'sans', onClick: function sans() { applySettings({ fontFamily: 'sans' }); }, style: { flex: 1 } }, t('fontSans')),
                h('button', { type: 'button', 'aria-pressed': settings.fontFamily === 'kai', onClick: function kai() { applySettings({ fontFamily: 'kai' }); }, style: { flex: 1 } }, t('fontKai')),
                h('button', { type: 'button', 'aria-pressed': settings.fontFamily === 'dyslexic', onClick: function dyslexic() { applySettings({ fontFamily: 'dyslexic' }); }, style: { flex: 1 } }, t('fontDyslexic')),
                h('button', { type: 'button', 'aria-pressed': settings.fontFamily === 'system', onClick: function system() { applySettings({ fontFamily: 'system' }); }, style: { flex: 1 } }, t('fontSystem')),
              ),
            }),
            typeField({
              id: 'font-size', label: t('fontSize'), value: settings.fontSize + 'px',
              control: h('div', { className: 'sr-type-size' },
                h('span', { className: 'sr-type-glyph' }, t('fontPreview')),
                h('div', { className: 'sr-stepper' },
                  h('button', { type: 'button', className: 'sr-step-btn', 'aria-label': t('decreaseFont'), onClick: function smaller() { changeFontSize(-1); } }, h(Icon, { name: 'minus', size: 13 })),
                  h('span', { className: 'sr-step-value' }, String(settings.fontSize)),
                  h('button', { type: 'button', className: 'sr-step-btn', 'aria-label': t('increaseFont'), onClick: function larger() { changeFontSize(1); } }, h(Icon, { name: 'plus', size: 13 })),
                ),
              ),
            }),
            typeField({
              id: 'line-height', label: t('lineHeight'), value: settings.lineHeight.toFixed(2),
              control: h('div', { className: 'sr-segment' },
                [{ value: 1.7, key: 'lineCompact' }, { value: 1.95, key: 'lineNormal' }, { value: 2.2, key: 'lineLoose' }].map(function option(item) {
                  return h('button', {
                    key: item.key,
                    type: 'button',
                    'aria-pressed': Math.abs(settings.lineHeight - item.value) < 0.01,
                    onClick: function pick() { applySettings({ lineHeight: item.value }); },
                    style: { flex: 1 },
                  }, t(item.key));
                }),
              ),
            }),
            h('details', { className: 'sr-type-more' },
              h('summary', null, t('moreTypography')),
              h('div', { className: 'sr-type-more-body' },
            typeField({
              id: 'letter-spacing', label: t('letterSpacing'), value: settings.letterSpacing.toFixed(2) + 'em',
              control: h('div', { className: 'sr-segment' },
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
            }),
            typeField({
              id: 'paragraph-spacing', label: t('paragraphSpacing'), value: settings.paragraphSpacing.toFixed(2) + 'em',
              control: h('div', { className: 'sr-segment' },
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
            }),
              ),
            ),
            bookHasImages ?             typeField({
              id: 'image-layout', full: true, label: t('imageLayout'),
              control: h('div', { className: 'sr-segment sr-segment--wide' },
                [{ value: 'inline', key: 'imageLayoutInline' }, { value: 'wide', key: 'imageLayoutWide' }, { value: 'margin', key: 'imageLayoutMargin' }].map(function option(item) {
                  return h('button', {
                    key: item.value,
                    type: 'button',
                    'aria-pressed': bookImageLayout === item.value,
                    onClick: function pick() {
                      applySettings({
                        imageLayout: item.value,
                        imageLayouts: Object.assign({}, settings.imageLayouts || {}, { [book.id]: item.value }),
                      });
                    },
                    style: { flex: 1 },
                  }, t(item.key));
                }),
              ),
            }) : null,
            (settings.layout || 'page') === 'scroll' ?             typeField({
              id: 'writing-mode', full: true, label: t('writingMode'),
              control: h('div', { className: 'sr-segment sr-segment--wide' },
                h('button', { type: 'button', 'aria-pressed': (settings.writingMode || 'horizontal') !== 'vertical', onClick: function horizontal() { applySettings({ writingMode: 'horizontal' }); }, style: { flex: 1 } }, t('writingHorizontal')),
                h('button', { type: 'button', 'aria-pressed': settings.writingMode === 'vertical', onClick: function vertical() { applySettings({ writingMode: 'vertical', layout: 'scroll' }); }, style: { flex: 1 } }, t('writingVertical')),
              ),
            }) : null,
          ),
          (settings.layout || 'page') === 'scroll' ? h('p', { className: 'sr-settings-hint' }, t('writingModeHint')) : null,
        );
        const compactViewport = typeof window !== 'undefined' && window.innerWidth < 760;
        const wideViewport = typeof window !== 'undefined' && window.innerWidth >= 1180;
        const layoutOptions = compactViewport
          ? [{ value: 'page', key: 'layoutPage' }, { value: 'scroll', key: 'layoutScroll' }]
          : [{ value: 'page', key: 'layoutPage' }, { value: 'spread', key: 'layoutSpread' }, { value: 'scroll', key: 'layoutScroll' }];
        const layoutPanel = h('div', { className: 'sr-tab-page' },
          h('div', { className: 'sr-settings-section' },
            h('div', { className: 'sr-settings-section-head' },
              h('span', null, t('readingPreset')),
              settings.preset === 'custom' ? h('em', null, t('presetCustom')) : null,
            ),
            h('div', { className: 'sr-preset-grid' },
              ['classic', 'magazine', 'minimal'].map(function preset(name) {
                const config = presetSettings[name];
                return h('button', {
                  key: name,
                  type: 'button',
                  className: 'sr-preset-card',
                  'aria-pressed': settings.preset === name,
                  'data-theme': config.theme,
                  'data-layout': config.layout,
                  onClick: function pick() { applyPreset(name); },
                },
                  h('span', { className: 'sr-preset-art' }, h('i'), h('i'), h('i'), h('i')),
                  h('span', { className: 'sr-preset-name' }, t('preset' + name.charAt(0).toUpperCase() + name.slice(1))),
                );
              }),
              settings.preset === 'custom' ? h('button', {
                type: 'button',
                className: 'sr-preset-card is-custom',
                'aria-pressed': 'true',
                'data-theme': settings.theme,
                'data-layout': settings.layout,
              },
                h('span', { className: 'sr-preset-art' }, h('i'), h('i'), h('i'), h('i')),
                h('span', { className: 'sr-preset-name' }, t('presetCustom')),
              ) : null,
            ),
          ),
          h('div', { className: 'sr-settings-section' },
            h('div', { className: 'sr-settings-section-head' },
              h('span', null, t('readingLayout')),
            ),
            h('div', { className: 'sr-segment sr-segment--wide' },
              layoutOptions.map(function option(item) {
                return h('button', {
                  key: item.value,
                  type: 'button',
                  'aria-pressed': (settings.layout || 'page') === item.value,
                  onClick: function pick() {
                    const patch = { layout: item.value };
                    if (item.value !== 'scroll' && settings.writingMode === 'vertical') patch.writingMode = 'horizontal';
                    applySettings(patch);
                  },
                  style: { flex: 1 },
                }, t(item.key));
              }),
            ),
            h('p', { className: 'sr-settings-hint' }, t('layoutModeHint')),
            (settings.layout || 'page') === 'spread' ? h('div', { className: 'sr-spread-options' },
              h('div', { className: 'sr-type-label' }, h('span', null, t('spreadGutter'))),
              h('div', { className: 'sr-segment' },
                [{ value: 'comfortable', key: 'spreadGutterComfortable' }, { value: 'compact', key: 'spreadGutterCompact' }].map(function option(item) {
                  return h('button', {
                    key: item.value,
                    type: 'button',
                    'aria-pressed': (settings.spreadGutter || 'comfortable') === item.value,
                    onClick: function pick() { applySettings({ spreadGutter: item.value }); },
                    style: { flex: 1 },
                  }, t(item.key));
                }),
              ),
              h('div', { className: 'sr-setting-toggle-row', style: { marginTop: '8px' } },
                h('span', { className: 'sr-setting-label', style: { marginBottom: 0 } }, t('spreadRule')),
                h('button', {
                  type: 'button',
                  role: 'switch',
                  className: 'sr-switch',
                  'aria-checked': settings.spreadRule !== false,
                  'aria-label': t('spreadRule'),
                  onClick: function toggleRule() { applySettings({ spreadRule: settings.spreadRule === false }); },
                }, h('span', { className: 'sr-switch-thumb' })),
              ),
            ) : null,
          ),
          h('div', { className: 'sr-settings-list' },
            readingRow({
              id: 'immersive', label: t('immersive'), hint: t('immersiveHint'),
              checked: settings.immersive === true,
              onToggle: function toggleImmersive() { applySettings({ immersive: !settings.immersive }); },
            }),
          ),
          (!compactViewport && chapters.length > 1 && (settings.layout || 'page') !== 'scroll') ? h('div', { className: 'sr-margin-aux-field', 'data-setting': 'margin-aux' },
            h('div', { className: 'sr-type-label' }, h('span', null, t('marginAux')), h('small', null, t('marginAuxHint'))),
            h('div', { className: 'sr-segment sr-segment--wide' },
              [{ value: 'none', key: 'marginAuxNone' }, { value: 'notes', key: 'marginAuxNotes' }, { value: 'rail', key: 'marginAuxRail' }, { value: 'footnotes', key: 'marginAuxFootnotes' }].map(function option(item) {
                const current = settings.marginNotes ? 'notes' : settings.chapterRail ? 'rail' : settings.marginFootnotes ? 'footnotes' : 'none';
                return h('button', {
                  key: item.value,
                  type: 'button',
                  'aria-pressed': current === item.value,
                  onClick: function pick() { applySettings({ marginNotes: item.value === 'notes', chapterRail: item.value === 'rail', marginFootnotes: item.value === 'footnotes' }); },
                }, t(item.key));
              }),
              settings.marginNotes && !marginNotesVisible ? h('p', { className: 'sr-settings-hint' }, t('marginNotesWidthHint')) : null,
            ),
          ) : null,
        );
        const readingPanel = h('div', { className: 'sr-tab-page' },
          h('div', { className: 'sr-settings-list' },
            h('div', { className: 'sr-type-field', 'data-setting': 'reading-guide' },
              h('div', { className: 'sr-type-label' }, h('span', null, t('readingGuide')), h('small', null, t('readingGuideHint'))),
              h('div', { className: 'sr-segment sr-segment--wide' },
                [{ value: 'none', key: 'guideNone' }, { value: 'ruler', key: 'guideRuler' }, { value: 'focus', key: 'guideFocus' }].map(function option(item) {
                  return h('button', {
                    key: item.value,
                    type: 'button',
                    'aria-pressed': (settings.readingGuide || 'none') === item.value,
                    onClick: function pick() { applySettings({ readingGuide: item.value }); },
                    style: { flex: 1 },
                  }, t(item.key));
                }),
              ),
            ),
            h('div', { className: 'sr-type-field', 'data-setting': 'dock-mode' },
              h('div', { className: 'sr-type-label' }, h('span', null, t('dockMode'))),
              h('div', { className: 'sr-segment sr-segment--wide' },
                (compactViewport ? [{ value: 'auto', key: 'dockAuto' }, { value: 'standard', key: 'dockStandard' }, { value: 'thumb', key: 'dockThumb' }] : [{ value: 'auto', key: 'dockAuto' }, { value: 'standard', key: 'dockStandard' }, { value: 'minimal', key: 'dockMinimal' }]).map(function option(item) {
                  return h('button', {
                    key: item.value,
                    type: 'button',
                    'aria-pressed': (settings.dockMode || 'auto') === item.value,
                    onClick: function pick() { applySettings({ dockMode: item.value }); },
                    style: { flex: 1 },
                  }, t(item.key));
                }),
              ),
            ),
            h('div', { className: 'sr-type-field', 'data-setting': 'page-width' },
              h('div', { className: 'sr-type-label' }, h('span', null, t('pageWidth')), h('em', null, widthDraft !== null ? widthDraft + 'px' : pageWidthLabel)),
              h('div', { className: 'sr-segment sr-segment--wide' },
                [{ value: 'compact', key: 'widthCompact', px: 680 }, { value: 'comfortable', key: 'widthComfortable', px: 860 }, { value: 'wide', key: 'widthWide', px: 1120 }, { value: 'full', key: 'widthFull', px: 1416 }].map(function option(item) {
                  return h('button', {
                    key: item.value,
                    type: 'button',
                    'aria-pressed': (settings.pageWidth || 'comfortable') === item.value,
                    onClick: function pick() { widthDragRef.current = false; setWidthDraft(null); applySettings({ pageWidth: item.value, pageWidthPx: item.px }); },
                    style: { flex: 1 },
                  }, t(item.key));
                }),
              ),
              h('div', { className: 'sr-width-slider' },
                h('input', {
                  type: 'range',
                  min: 560,
                  max: 1600,
                  step: 20,
                  value: widthDraft !== null ? widthDraft : (settings.pageWidthPx || 860),
                  'aria-label': t('customPageWidth'),
                  onPointerDown: function start() { widthDragRef.current = true; },
                  onChange: function change(event) {
                    const value = Number(event.target.value);
                    if (widthDragRef.current) { setWidthDraft(value); return; }
                    applySettings({ pageWidth: 'custom', pageWidthPx: value });
                  },
                  onPointerUp: function end(event) {
                    if (!widthDragRef.current) return;
                    widthDragRef.current = false;
                    const value = Number(event.currentTarget.value);
                    setWidthDraft(null);
                    applySettings({ pageWidth: 'custom', pageWidthPx: value });
                  },
                  onPointerCancel: function cancel() { widthDragRef.current = false; setWidthDraft(null); },
                  onBlur: function blur() { widthDragRef.current = false; setWidthDraft(null); },
                }),
                h('span', null, widthDraft !== null ? widthDraft + 'px' : (settings.pageWidthPx || 860) + 'px'),
              ),
            ),
          ),
        );
        const panel = settingsTab === 'typography'
          ? typographyPanel
          : settingsTab === 'layout'
            ? layoutPanel
            : settingsTab === 'reading'
              ? readingPanel
              : appearancePanel;
        return h(React.Fragment, null,
          h('div', { className: 'sr-sheet-scrim', onClick: function close() { setSettingsOpen(false); } }),
          h('div', { className: 'sr-sheet sr-settings-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('readerSettings'), onKeyDown: trapSettingsFocus },
            h('div', { className: 'sr-settings-head' },
              h('div', { className: 'sr-settings-heading' },
                h('span', { className: 'sr-settings-kicker' }, t('settingsKicker')),
                h('strong', null, t('readerSettings')),
              ),
              h('div', { className: 'sr-settings-head-actions' },
                h('button', {
                  type: 'button',
                  className: 'sr-reader-icon',
                  title: t('searchSettings'),
                  'aria-label': t('searchSettings'),
                  'aria-expanded': settingsSearchOpen ? 'true' : 'false',
                  onClick: function toggleSearch() { setSettingsSearchOpen(!settingsSearchOpen); setSettingsQuery(''); },
                }, h(Icon, { name: 'search', size: 15 })),
                h('div', { className: 'sr-settings-scope-switch', role: 'group', 'aria-label': t('settingsScope') },
                  h('button', {
                    type: 'button',
                    'aria-pressed': settingsScope === 'global',
                    onClick: function globalScope() { setSettingsScope('global'); },
                  }, t('settingsGlobal')),
                  h('button', {
                    type: 'button',
                    'aria-pressed': settingsScope === 'book',
                    onClick: function bookScope() { setSettingsScope('book'); },
                  }, t('settingsBook')),
                ),
                h('button', { type: 'button', className: 'sr-reader-icon', onClick: function close() { setSettingsOpen(false); }, title: t('close'), 'aria-label': t('close') },
                  h(Icon, { name: 'close', size: 16 }),
                ),
              ),
            ),
            h('div', { className: 'sr-settings-tabs', role: 'tablist', 'aria-label': t('readerSettings') },
              settingsTabs.map(function tab(item, index) {
                return h('button', {
                  key: item.id,
                  type: 'button',
                  role: 'tab',
                  id: 'sr-settings-tab-' + item.id,
                  className: 'sr-settings-tab',
                  'aria-selected': settingsTab === item.id ? 'true' : 'false',
                  'aria-controls': 'sr-settings-panel',
                  tabIndex: settingsTab === item.id ? 0 : -1,
                  onClick: function select() { setSettingsTab(item.id); },
                  onKeyDown: function keys(event) {
                    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') return;
                    event.preventDefault();
                    const nextIndex = event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? settingsTabs.length - 1
                        : (index + (event.key === 'ArrowRight' ? 1 : -1) + settingsTabs.length) % settingsTabs.length;
                    setSettingsTab(settingsTabs[nextIndex].id);
                    const parent = event.currentTarget.parentElement;
                    if (parent && parent.children[nextIndex]) parent.children[nextIndex].focus();
                  },
                }, h('span', null, item.label), dirtySettings[item.id] ? h('i', { className: 'sr-settings-dot', 'aria-hidden': 'true' }) : null);
              }),
            ),
            (settingsScope === 'book' && settingsOpen) ? h('div', { className: 'sr-book-scope-note' },
              h('span', null, Object.keys(bookOverrides).length ? fill(t('bookOverridesActive'), { n: Object.keys(bookOverrides).length }) : t('bookOverridesNone')),
              Object.keys(bookOverrides).length ? h('button', { type: 'button', onClick: clearBookOverrides }, t(clearBookConfirm ? 'clearBookOverridesConfirm' : 'clearBookOverrides')) : null,
            ) : null,
            settingsSearchOpen ? h(React.Fragment, null,
              h('div', { className: 'sr-settings-search' },
                h(Icon, { name: 'search', size: 13 }),
                h('input', {
                  type: 'text',
                  autoFocus: true,
                  value: settingsQuery,
                  placeholder: t('searchSettings'),
                  'aria-label': t('searchSettings'),
                  onChange: function change(event) { setSettingsQuery(event.target.value); },
                  onKeyDown: function keys(event) {
                    if (event.key === 'Escape') { event.preventDefault(); setSettingsSearchOpen(false); setSettingsQuery(''); }
                    if (event.key === 'Enter' && searchResults[0]) { event.preventDefault(); goToSetting(searchResults[0]); }
                  },
                }),
                h('button', { type: 'button', className: 'sr-settings-search-close', onClick: function close() { setSettingsSearchOpen(false); setSettingsQuery(''); }, 'aria-label': t('close') }, h(Icon, { name: 'close', size: 11 })),
              ),
              settingsQuery.trim() ? h('div', { className: 'sr-settings-search-results' },
                searchResults.length
                  ? searchResults.map(function result(item, index) {
                      return h('button', { key: item.tab + '-' + index, type: 'button', onClick: function pick() { goToSetting(item); } },
                        h('span', null, item.label),
                        h('small', null, t('settingsTab' + item.tab.charAt(0).toUpperCase() + item.tab.slice(1))),
                      );
                    })
                  : h('p', null, t('settingsSearchEmpty')),
              ) : null,
            ) : null,
            (settingsTab === 'appearance' || settingsTab === 'typography') ? h('div', { className: 'sr-settings-preview' },
              h('span', { className: 'sr-settings-preview-kicker' }, 'READING SAMPLE'),
              h('p', {
                className: 'sr-settings-preview-text',
                style: { fontSize: Math.max(13, Math.min(20, settings.fontSize * 0.82)) + 'px', lineHeight: String(settings.lineHeight), fontFamily: settings.fontFamily === 'sans' || settings.fontFamily === 'system' || settings.fontFamily === 'dyslexic' ? 'system-ui, -apple-system, sans-serif' : settings.fontFamily === 'kai' ? '"Kaiti SC", "STKaiti", serif' : 'Georgia, "Songti SC", "Noto Serif SC", serif' },
              }, t('settingsPreviewText')),
              h('small', null, settings.fontSize + 'px · ' + settings.lineHeight.toFixed(2) + ' · ' + settings.fontFamily),
            ) : null,
            h('div', {
              ref: settingsPanelRef,
              className: 'sr-settings-panel',
              id: 'sr-settings-panel',
              role: 'tabpanel',
              'aria-labelledby': 'sr-settings-tab-' + settingsTab,
            }, panel),
            h('div', { className: 'sr-sheet-foot' },
              h('div', { className: 'sr-settings-foot-actions' },
                dirtyCount ? h('span', { className: 'sr-settings-dirty-count' }, fill(t('settingsChanged'), { n: dirtyCount })) : null,
                h('button', {
                  type: 'button',
                  className: 'sr-text-btn',
                  title: t('resetThisPageHint'),
                  onClick: resetCurrentTab,
                }, h(Icon, { name: 'refresh', size: 11 }), h('span', null, t('resetThisPage'))),
                h('button', {
                  type: 'button',
                  className: 'sr-text-btn',
                  title: t('resetAllSettingsHint'),
                  onClick: resetAllSettings,
                }, h('span', null, t('resetAllSettings'))),
              ),
              h('p', { className: 'sr-sheet-note' + (savedPulse || undoAvailable || redoAvailable ? ' is-visible' : '') },
                savedPulse ? t('settingsSaved') : null,
                undoAvailable ? h('button', { type: 'button', className: 'sr-note-undo', onClick: undoLastSettings }, t('undo')) : null,
                redoAvailable ? h('button', { type: 'button', className: 'sr-note-undo', onClick: redoLastSettings }, t('redo')) : null,
              ),
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

      function chapterOpenNode() {
        return h('header', { className: 'sr-chapter-head' },
          h('div', { className: 'sr-chapter-meta' },
            h('span', { className: 'sr-chapter-kicker' }, fill(t('chapterIndex'), { n: chapterIndex + 1 })),
            book.author ? h('span', { className: 'sr-chapter-author' }, book.author) : null,
          ),
          h('h1', { className: 'sr-chapter-title' }, chapter.title),
        );
      }

      function chapterEndNode() {
        if (chapterIndex >= chapters.length - 1) {
          return h('div', { className: 'sr-chapter-end sr-chapter-end--book', ref: endRef },
            h('span', { className: 'sr-book-end-badge' }, '❦ ' + t('readerFinished') + ' ❦'),
            h('small', { className: 'sr-book-end-sub' }, t('readerFinishedSub')),
          );
        }
        return h('button', {
          type: 'button',
          className: 'sr-chapter-end sr-chapter-end--next',
          ref: endRef,
          title: t('nextChapter') + ': ' + chapters[chapterIndex + 1].title,
          'aria-label': t('nextChapter') + ': ' + chapters[chapterIndex + 1].title,
          onClick: function nextChapter(event) {
            event.stopPropagation();
            goChapter(chapterIndex + 1, 'start');
          },
        },
          h('span', null, '· ' + t('chapterEnd') + ' ·'),
          h('span', { className: 'sr-chapter-end-next' },
            h('span', null, t('nextChapter')),
            h('strong', null, chapters[chapterIndex + 1].title),
            h(Icon, { name: 'chevron-right', size: 11 }),
          ),
        );
      }

      function applyRangeValue(value) {
        if (scrollMode) {
          const ratio = clamp(Number(value) / 1000, 0, 1);
          const element = columnsRef.current;
          if (element) {
            const vertical = settings.writingMode === 'vertical';
            const max = Math.max(0, vertical ? element.scrollWidth - element.clientWidth : element.scrollHeight - element.clientHeight);
            if (vertical) element.scrollLeft = -ratio * max;
            else element.scrollTop = ratio * max;
          }
          setScrollRatio(ratio);
          currentPercentRef.current = ratio;
          return;
        }
        setPage(Number(value));
        dismissPopovers();
      }

      function handleScroll(event) {
        if (!scrollMode) return;
        const element = event.currentTarget;
        const vertical = settings.writingMode === 'vertical';
        const max = Math.max(0, vertical ? element.scrollWidth - element.clientWidth : element.scrollHeight - element.clientHeight);
        const position = vertical ? Math.abs(element.scrollLeft) : element.scrollTop;
        const ratio = max > 0 ? clamp(position / max, 0, 1) : 0;
        setScrollRatio(ratio);
        currentPercentRef.current = ratio;
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
        'data-has-images': chapterHasImages ? 'true' : 'false',
        'data-layout': settings.layout || 'page',
        'data-spread-gutter': settings.spreadGutter === 'compact' ? 'compact' : 'comfortable',
        'data-spread-rule': settings.spreadRule === false ? 'false' : 'true',
        'data-image-layout': bookImageLayout,
        'data-writing-mode': settings.writingMode === 'vertical' ? 'vertical' : 'horizontal',
        'data-margin-notes': marginNotesVisible ? 'true' : 'false',
        'data-chapter-rail': settings.chapterRail === true ? 'true' : 'false',
        'data-thumb-dock': (settings.dockMode === 'thumb' || settings.dockMode === 'auto' && typeof window !== 'undefined' && window.innerWidth < 760) ? 'true' : 'false',
        'data-rail-open': dockedRail ? 'true' : 'false',
        'data-minimal-dock': (settings.dockMode !== 'standard' && settings.dockMode !== 'thumb') || (settings.dockMode === 'auto' && typeof window !== 'undefined' && window.innerWidth >= 760) ? 'true' : 'false',
        'data-tts': tts.status === 'idle' ? 'false' : 'true',
        ref: readerRef,
        tabIndex: -1,
        onTouchStart: handleRootTouchStart,
        onTouchEnd: handleRootTouchEnd,
      },
        h('div', {
          className: 'sr-sr-only',
          role: 'status',
          'aria-live': 'polite',
          'aria-atomic': 'true',
        }, fill(t('readingLivePage'), { chapter: chapter.title, page: page + 1, total: pageCount })),
        h('div', { className: 'sr-reader-slim-progress', style: { width: overallBookPct + '%' }, 'aria-hidden': 'true', title: overallBookPct + '%' }),
        settings.readingGuide === 'focus' ? h(React.Fragment, null,
          h('div', {
            className: 'sr-focus-mask sr-focus-mask--top',
            style: { height: Math.max(0, rulerY - 130) + 'px' },
            'aria-hidden': 'true',
          }),
          h('div', {
            className: 'sr-focus-mask sr-focus-mask--bottom',
            style: { top: Math.min(box.h, rulerY + 130) + 'px', bottom: '0px' },
            'aria-hidden': 'true',
          }),
        ) : null,
        (!chrome && settings.immersive) ? h('div', { className: 'sr-edge-meta', 'aria-hidden': 'true' },
          h('span', { className: 'sr-edge-book' }, book.title),
          h('span', { className: 'sr-edge-chapter' }, chapter.title + ' · ' + pageLabel),
        ) : null,
        marginNotesVisible ? h('aside', { className: 'sr-margin-notes', 'aria-label': t('marginNotes') },
          h('div', { className: 'sr-margin-notes-head' },
            h('span', null, t('marginNotes')),
            h('small', null, String(chapterHighlights.length + chapterBookmarks.length)),
          ),
          chapterHighlights.length
            ? chapterHighlights.slice(0, 6).map(function marginNote(note) {
                return h('button', {
                  key: note.id,
                  type: 'button',
                  className: 'sr-margin-note',
                  onClick: function jump() { jumpToHighlight(note); },
                },
                  h('span', { className: 'sr-margin-note-mark' }),
                  h('p', null, note.text),
                  note.note ? h('small', null, note.note) : null,
                );
              })
            : h('p', { className: 'sr-margin-empty' }, t('noHighlights')),
          (chapterHighlights.length + chapterBookmarks.length) > 6 ? h('button', {
            type: 'button',
            className: 'sr-margin-more',
            onClick: function openAll() { setDrawer('notes'); },
          }, h('span', null, t('viewAll')), h(Icon, { name: 'chevron-right', size: 10 })) : null,
          chapterBookmarks.length ? h('div', { className: 'sr-margin-bookmarks' },
            chapterBookmarks.map(function marginBookmark(item) {
              return h('button', {
                key: item.id,
                type: 'button',
                className: 'sr-margin-bookmark',
                onClick: function jump() { goChapter(item.chapterIndex, 'percent', item.percent); },
              }, h(Icon, { name: 'bookmark', size: 10 }), h('span', null, item.chapterTitle || chapter.title));
            }),
          ) : null,
        ) : null,
        (settings.chapterRail === true && chapters.length > 1) ? h('nav', { className: 'sr-chapter-rail', 'aria-label': t('readerToc') },
          chapters.map(function railChapter(item, index) {
            return h('button', {
              key: item.id || index,
              type: 'button',
              className: 'sr-chapter-rail-node',
              'data-active': index === chapterIndex ? 'true' : 'false',
              title: item.title,
              'aria-label': item.title,
              onClick: function jump() { goChapter(index, 'resume'); },
            },
              h('span', { className: 'sr-chapter-rail-dot' }),
              h('span', { className: 'sr-chapter-rail-label' }, String(index + 1)),
            );
          }),
        ) : null,
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
              onClick: function goBack() { returnFromJump(); },
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
              h('small', null, chapters.length > 1 ? fill(t('chapterIndex'), { n: chapterIndex + 1 }) + ' / ' + chapters.length : t('reading')),
              h('strong', null, book.title),
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
              'data-on': tts.status === 'idle' ? 'false' : 'true',
              title: tts.status === 'playing' ? t('pauseReading') : tts.status === 'paused' ? t('resumeReading') : t('readAloud'),
              'aria-label': tts.status === 'playing' ? t('pauseReading') : tts.status === 'paused' ? t('resumeReading') : t('readAloud'),
              onClick: toggleSpeech,
            }, h(Icon, { name: tts.status === 'playing' ? 'pause' : 'volume', size: 17 })),
            h('div', { className: 'sr-top-more-anchor' },
              h('button', {
                type: 'button',
                className: 'sr-reader-icon sr-top-more-trigger',
                ref: topMoreButtonRef,
                title: t('more'),
                'aria-label': t('more'),
                'aria-haspopup': 'menu',
                'aria-expanded': topMenuOpen ? 'true' : 'false',
                onClick: function toggleMenu() { setTopMenuOpen(!topMenuOpen); },
              }, h(Icon, { name: 'more', size: 17 })),
              topMenuOpen ? h('div', { className: 'sr-top-more', role: 'menu', ref: topMenuRef, onKeyDown: function menuKeys(event) {
                if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
                event.preventDefault();
                const items = Array.from(event.currentTarget.querySelectorAll('button'));
                const index = items.indexOf(document.activeElement);
                const next = event.key === 'ArrowDown' ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
                if (items[next]) items[next].focus();
              } },
                h('button', { type: 'button', role: 'menuitem', onClick: function openNotes() { setTopMenuOpen(false); setDrawer('notes'); setNotesTab('highlights'); } }, h(Icon, { name: 'notes', size: 14 }), t('notes')),
                h('button', { type: 'button', role: 'menuitem', onClick: function fullscreen() { setTopMenuOpen(false); toggleFullscreen(); } }, h(Icon, { name: isFullscreen ? 'minimize' : 'maximize', size: 14 }), t(isFullscreen ? 'exitFullscreen' : 'fullscreen')),
                h('button', { type: 'button', role: 'menuitem', onClick: function help() { setTopMenuOpen(false); setHelpOpen(true); } }, h(Icon, { name: 'help', size: 14 }), t('shortcuts')),
              ) : null,
            ),
          ),
        ),
        h('div', { className: 'sr-page-area' },
          h('button', {
            type: 'button',
            className: 'sr-page-edge sr-page-edge--prev',
            'aria-label': t('prevPage'),
            title: t('prevPage'),
            disabled: !scrollMode && page <= 0 && chapterIndex <= 0,
            onClick: function prev(e) { e.stopPropagation(); prevPage(); },
          }, h(Icon, { name: 'chevron-left', size: 18 })),
          h('div', {
            className: 'sr-stage' + (spread ? ' sr-stage--spread' : '') + (scrollMode ? ' sr-stage--scroll' : ''),
            'data-mode': scrollMode ? 'scroll' : 'paged',
            style: settings.pageWidth === 'custom' ? { maxWidth: settings.pageWidthPx + 'px' } : undefined,
            ref: stageRef,
            onPointerDown: handlePointerDown,
            onPointerUp: handlePointerUp,
            onMouseMove: function handleMouseMove(e) {
              if ((settings.readingGuide === 'ruler' || settings.readingGuide === 'focus') && stageRef.current) {
                const rect = stageRef.current.getBoundingClientRect();
                setRulerY(clamp(e.clientY - rect.top, 24, Math.max(24, rect.height - 24)));
              }
            },
            onClick: handleStageClick,
            onDoubleClick: handleStageDoubleClick,
          },
            settings.readingGuide === 'ruler' ? h('div', {
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
              style: { transform: scrollMode ? 'none' : 'translate3d(' + (-Math.min(page, pageCount - 1) * viewStep) + 'px,0,0)' },
            },
              h('div', {
                ref: columnsRef,
                className: 'sr-columns' + (scrollMode ? ' sr-columns--scroll' : ''),
                onScroll: scrollMode ? handleScroll : undefined,
                'data-font': settings.fontFamily,
                style: {
                  width: pageW ? (spread ? pageW * 2 + gap : pageW) : '100%',
                  height: pageH || '100%',
                  columnWidth: pageW || undefined,
                  columnGap: gap,
                  fontSize: settings.fontSize + 'px',
                  lineHeight: String(settings.lineHeight),
                  '--sr-letter-spacing': settings.letterSpacing + 'em',
                  '--sr-para-gap': settings.paragraphSpacing + 'em',
                  '--sr-align': 'justify',
                  visibility: pageW ? 'visible' : 'hidden',
                },
              },
                chapterOpenNode(),
                paragraphNodes,
                chapterString.trim() ? null : h('div', { className: 'sr-empty-chapter', role: 'status' }, t('emptyChapter')),
                chapterEndNode(),
              ),
            ),
          ),
          h('button', {
            type: 'button',
            className: 'sr-page-edge sr-page-edge--next',
            'aria-label': t('nextPage'),
            title: t('nextPage'),
            disabled: !scrollMode && page >= pageCount - 1 && chapterIndex >= chapters.length - 1,
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
        }, settings.immersive ? pageLabel : (pageLabel + '  ·  ' + fill(t('readerProgress'), { n: Math.round(progressPercentValue * 100) }))) : null,
        h('div', { className: 'sr-reader-bottom' + (chrome ? '' : ' is-hidden') },
          h('div', { className: 'sr-reader-bottom-inner' },
            (settings.dockMode === 'thumb' || (settings.dockMode === 'auto' && typeof window !== 'undefined' && window.innerWidth < 760)) ? h('button', { type: 'button', className: 'sr-reader-tool sr-thumb-nav', onClick: function prev() { prevPage(); }, title: t('prevPage'), 'aria-label': t('prevPage') },
              h(Icon, { name: 'chevron-left', size: 15 }),
            ) : null,
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
              scrubDraft !== null ? h('div', {
                className: 'sr-reader-scrub-preview',
                style: { left: (scrollMode ? scrubDraft / 10 : (pageCount <= 1 ? 0 : scrubDraft / (pageCount - 1) * 100)) + '%' },
              }, scrollMode ? Math.round(scrubDraft / 10) + '%' : t('pageOf', { n: Math.min(Number(scrubDraft) + 1, pageCount), m: pageCount })) : null,
              h('input', {
                type: 'range',
                className: 'sr-reader-range',
                min: 0,
                max: scrollMode ? 1000 : Math.max(0, pageCount - 1),
                step: 1,
                value: scrubDraft !== null ? scrubDraft : (scrollMode ? Math.round(scrollRatio * 1000) : Math.min(page, pageCount - 1)),
                disabled: scrollMode ? false : pageCount <= 1,
                'aria-label': scrollMode ? pageLabel : t('pageOf', { n: page + 1, m: pageCount }),
                onPointerDown: function started() { rangeScrubRef.current = true; },
                onChange: function change(event) {
                  const value = Number(event.target.value);
                  if (rangeScrubRef.current) {
                    setScrubDraft(value);
                    return;
                  }
                  applyRangeValue(value);
                },
                onPointerUp: function ended(event) {
                  if (!rangeScrubRef.current) return;
                  rangeScrubRef.current = false;
                  const value = Number(event.currentTarget.value);
                  setScrubDraft(null);
                  applyRangeValue(value);
                },
                onPointerCancel: function cancelled() { rangeScrubRef.current = false; setScrubDraft(null); },
                onBlur: function blurred() { rangeScrubRef.current = false; setScrubDraft(null); },
              }),
              h('div', { className: 'sr-page-jump-anchor' },
                h('button', {
                  type: 'button',
                  className: 'sr-reader-progress-label sr-page-jump-trigger',
                  title: t('jumpToPage') + ' (G)',
                  'aria-haspopup': 'dialog',
                  'aria-expanded': pageJumpOpen ? 'true' : 'false',
                  onClick: function toggleJump() {
                    if (scrollMode) return;
                    if (pageJumpOpen) { setPageJumpOpen(false); return; }
                    dismissPopovers();
                    setPageJumpDraft(String(pageStart));
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
                    if (!Number.isNaN(target)) setPage(readerPageJumpIndex(target, spread, totalPages, pageCount));
                    setPageJumpOpen(false);
                  },
                },
                  h('span', { className: 'sr-page-jump-hint' }, t('jumpPagePrefix')),
                  h('input', {
                    ref: pageJumpInputRef,
                    type: 'number',
                    className: 'sr-page-jump-input',
                    min: 1,
                    max: jumpPageTotal,
                    value: pageJumpDraft,
                    placeholder: String(pageStart),
                    onChange: function change(e) { setPageJumpDraft(e.target.value); },
                    onKeyDown: function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); setPageJumpOpen(false); } },
                  }),
                  h('span', { className: 'sr-page-jump-hint' }, '/ ' + jumpPageTotal + (t('jumpPageSuffix') ? ' ' + t('jumpPageSuffix') : '')),
                  h('button', { type: 'submit', className: 'sr-page-jump-btn' }, t('jumpBtn')),
                ) : null,
              ),
            ),
            h('button', { type: 'button', className: 'sr-reader-tool', onClick: function openSettings() { setSettingsOpen(true); }, title: t('readerSettings') },
              h(Icon, { name: 'sliders', size: 14 }),
              h('span', null, t('readerSettings')),
            ),
            (settings.dockMode === 'thumb' || (settings.dockMode === 'auto' && typeof window !== 'undefined' && window.innerWidth < 760)) ? h('button', { type: 'button', className: 'sr-reader-tool sr-thumb-nav', onClick: function next() { nextPage(); }, title: t('nextPage'), 'aria-label': t('nextPage') },
              h(Icon, { name: 'chevron-right', size: 15 }),
            ) : null,
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
        fontHud ? h('div', { className: 'sr-font-hud', role: 'status', 'aria-live': 'polite' },
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
        tourOpen && !settingsOpen && !drawer ? h('div', { className: 'sr-tour', role: 'status' },
          h('div', { className: 'sr-tour-head' },
            h('strong', null, t('tourTitle')),
            h('button', { type: 'button', className: 'sr-reader-icon', onClick: dismissTour, title: t('tourDismiss'), 'aria-label': t('tourDismiss') }, h(Icon, { name: 'close', size: 13 })),
          ),
          h('p', null, t('tourTip1')),
          h('p', null, t('tourTip2')),
          h('p', null, t('tourTip3')),
        ) : null,
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
          className: 'sr-footnote-popover' + (settings.marginFootnotes ? ' sr-footnote-popover--margin' : ''),
          style: settings.marginFootnotes ? {
            left: 'auto',
            right: (settings.marginNotes ? 286 : 30) + 'px',
            top: Math.min(Math.max(footnote.y, 70), Math.max(70, (typeof window !== 'undefined' ? window.innerHeight : 900) - 300)) + 'px',
            transform: 'none',
          } : {
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
