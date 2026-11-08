    function BrandMark(props) {
      return h('svg', {
        width: props && props.size ? props.size : 22,
        height: props && props.size ? props.size : 22,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.45,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        focusable: false,
      },
        h('path', { d: 'M12 6.7C10.8 5.4 9.1 4.7 7.2 4.7H4.7v13.1h2.6c1.8 0 3.5.6 4.7 1.8 1.2-1.2 2.9-1.8 4.7-1.8h2.6V4.7h-2.5c-1.9 0-3.6.7-4.8 2Z' }),
        h('path', { d: 'M12 6.8v12.6' }),
        h('circle', { cx: 17.9, cy: 6.2, r: 2.1, fill: 'currentColor', stroke: 'none', opacity: '.8' }),
      );
    }

    function CoverComponent(props) {
      const book = props.book;
      const cover = coverFor(book);
      const [failedId, setFailedId] = useState(null);
      const imageFailed = failedId === book.id;
      const hasCoverImage = typeof book.coverImage === 'string' && book.coverImage.indexOf('data:image/') === 0;
      const showImage = hasCoverImage && !imageFailed;
      const classes = ['sr-cover'];
      if (props.size) classes.push('sr-cover--' + props.size);
      if (showImage) classes.push('sr-cover--image');
      const badge = book.source === 'local' ? props.t('importedBadge') : book.source === 'classic' ? props.t('publicBadge') : props.t('originalBadge');
      const pct = props.progress || 0;

      let fallbackContent = null;
      if (!showImage) {
        const title = book.title || '';
        const latin = !isCjk(title);
        const horizontal = latin || title.length > 10;
        const longTitle = !horizontal && title.length > 4;
        const extraLong = !horizontal && title.length > 7;
        const titleClasses = ['sr-cover-title'];
        if (horizontal) titleClasses.push('sr-cover-title--latin');
        else if (extraLong) titleClasses.push('sr-cover-title--xlong');
        else if (longTitle) titleClasses.push('sr-cover-title--long');
        fallbackContent = [
          h('span', { key: 'g', className: 'sr-cover-glyph' }, cover.glyph || title.slice(0, 1)),
          h('span', { key: 'm', className: 'sr-cover-mark' }, '拾光'),
          h('span', { key: 't', className: titleClasses.join(' ') }, title),
          h('span', { key: 'a', className: 'sr-cover-author' + (latin ? ' sr-cover-author--latin' : '') }, book.author),
        ];
      }

      return h('div', {
        className: classes.join(' '),
        style: {
          '--cv-a': cover.from,
          '--cv-b': cover.to,
          '--cv-ink': cover.ink,
          '--cv-accent': cover.accent,
        },
        'aria-hidden': true,
      },
        showImage ? h('img', {
          className: 'sr-cover-image',
          src: book.coverImage,
          alt: '',
          loading: 'lazy',
          decoding: 'async',
          onError: function fail() { setFailedId(book.id); },
        }) : fallbackContent,
        props.showBadge === false ? null : h('span', { className: 'sr-cover-badge' }, badge),
        pct > 0 ? h('span', { className: 'sr-cover-progress' }, h('span', { style: { width: clamp(pct, 0, 100) + '%' } })) : null,
      );
    }
    const Cover = (React && React.memo) ? React.memo(CoverComponent) : CoverComponent;

    function Ring(props) {
      const value = clamp(Number(props.value) || 0, 0, 1);
      const radius = 15.25;
      const circumference = 2 * Math.PI * radius;
      return h('svg', {
        className: 'sr-ring',
        viewBox: '0 0 36 36',
        'aria-hidden': true,
        focusable: false,
      },
        h('circle', { className: 'sr-ring-track', cx: 18, cy: 18, r: radius }),
        h('circle', {
          className: 'sr-ring-fill',
          cx: 18,
          cy: 18,
          r: radius,
          style: {
            strokeDasharray: circumference + ' ' + circumference,
            strokeDashoffset: circumference * (1 - value),
          },
        }),
      );
    }

    function EmptyArt() {
      return h('svg', {
        width: 116,
        height: 90,
        viewBox: '0 0 116 90',
        fill: 'none',
        'aria-hidden': true,
        focusable: false,
        className: 'sr-empty-art',
      },
        h('path', { d: 'M19 63c13-6 27-4 38 4 11-8 26-10 39-4V23c-13-5-27-3-39 5-12-8-26-10-38-5v40Z', fill: 'color-mix(in oklab, var(--dsw-alias-brand-primary) 8%, var(--dsw-alias-bg-layer-1))', stroke: 'var(--dsw-alias-border-l2)', strokeWidth: 1.2 }),
        h('path', { d: 'M57 28v39', stroke: 'var(--dsw-alias-border-l2)', strokeWidth: 1.1, opacity: '.7' }),
        h('path', { d: 'M28 34c8-2 15-.5 22 4M28 42c8-2 15-.5 22 4M66 38c7-4 14-5 21-4M66 46c7-4 14-5 21-4', stroke: 'var(--dsw-alias-label-secondary)', strokeWidth: 1, opacity: '.28', strokeLinecap: 'round' }),
        h('path', { d: 'M86 19c.4 3.2 1.8 4.6 5 5-3.2.4-4.6 1.8-5 5-.4-3.2-1.8-4.6-5-5 3.2-.4 4.6-1.8 5-5Z', fill: 'var(--dsw-alias-brand-primary)', opacity: '.5' }),
        h('circle', { cx: 24, cy: 21, r: 2, fill: 'var(--dsw-alias-brand-primary)', opacity: '.3' }),
        h('circle', { cx: 98, cy: 47, r: 1.4, fill: 'var(--dsw-alias-brand-primary)', opacity: '.28' }),
      );
    }

    function EmptyState(props) {
      return h('div', { className: 'sr-empty' },
        props.art || h(EmptyArt),
        h('h3', null, props.title),
        h('p', null, props.text),
        props.action ? h('button', { type: 'button', className: 'sr-btn sr-btn-primary', onClick: props.action }, props.actionLabel) : null,
      );
    }

    function PasteImportDialog(props) {
      const t = props.t;
      const [title, setTitle] = useState('');
      const [author, setAuthor] = useState('');
      const [text, setText] = useState('');
      const titleRef = useRef(null);

      useEffect(function focusTitle() {
        const frame = window.requestAnimationFrame(function focus() {
          if (titleRef.current) titleRef.current.focus();
        });
        function onKey(event) {
          if (event.key === 'Escape') {
            event.preventDefault();
            props.onClose();
          }
        }
        document.addEventListener('keydown', onKey, true);
        return function cleanup() {
          window.cancelAnimationFrame(frame);
          document.removeEventListener('keydown', onKey, true);
        };
      }, []);

      return h('div', {
        className: 'sr-paste-backdrop',
        onMouseDown: function backdrop(event) { if (event.target === event.currentTarget) props.onClose(); },
      },
        h('form', {
          className: 'sr-paste-card',
          role: 'dialog',
          'aria-modal': 'true',
          'aria-label': t('pasteImport'),
          onSubmit: function submit(event) {
            event.preventDefault();
            if (!text.trim()) return;
            props.onImport({ title: title, author: author, text: text });
          },
        },
          h('div', { className: 'sr-paste-head' },
            h('div', null,
              h('h2', null, t('pasteImport')),
              h('p', null, t('pasteImportHint')),
            ),
            h('button', { type: 'button', className: 'sr-icon-btn', onClick: props.onClose, title: t('close'), 'aria-label': t('close') },
              h(Icon, { name: 'close', size: 16 }),
            ),
          ),
          h('div', { className: 'sr-paste-fields' },
            h('label', null,
              h('span', null, t('pasteTitleLabel')),
              h('input', {
                ref: titleRef,
                type: 'text',
                value: title,
                maxLength: 100,
                onChange: function change(event) { setTitle(event.target.value); },
              }),
            ),
            h('label', null,
              h('span', null, t('pasteAuthorLabel')),
              h('input', {
                type: 'text',
                value: author,
                maxLength: 80,
                onChange: function change(event) { setAuthor(event.target.value); },
              }),
            ),
          ),
          h('label', { className: 'sr-paste-text' },
            h('span', null, t('pasteTextLabel')),
            h('textarea', {
              value: text,
              placeholder: t('pasteTextPlaceholder'),
              onChange: function change(event) { setText(event.target.value); },
            }),
          ),
          h('div', { className: 'sr-paste-foot' },
            h('span', null, t('importHint')),
            h('div', { className: 'sr-paste-actions' },
              h('button', { type: 'button', className: 'sr-btn sr-btn-sm', onClick: props.onClose }, t('cancel')),
              h('button', { type: 'submit', className: 'sr-btn sr-btn-sm sr-btn-primary', disabled: !text.trim() }, t('pasteImportAction')),
            ),
          ),
        ),
      );
    }

    // Renders the "3 days ago read" hint under a card; silent for books never opened.
    function lastReadLabel(progress, t) {
      const relative = lastReadRelative(progress && progress.updatedAt);
      if (!relative) return null;
      return h('span', { className: 'sr-book-last' }, fill(t(relative.key), { n: relative.n }));
    }

    // Same wording as lastReadLabel but always returns text, so a card can keep a
    // fixed-height last-read slot and every progress bar in a row lines up.
    function lastReadInline(progress, t, fallback) {
      const relative = lastReadRelative(progress && progress.updatedAt);
      if (relative) return fill(t(relative.key), { n: relative.n });
      return fallback || '';
    }

    function BookCardComponent(props) {
      const book = props.book;
      const pct = progressPercent(book, props.progress);
      const selecting = props.selectMode === true;
      const picked = selecting && props.selected === true;
      const completed = Boolean(props.progress && props.progress.completed);
      return h('button', {
        type: 'button',
        className: 'sr-book-card',
        'data-select-mode': selecting ? 'true' : 'false',
        'data-selected': picked ? 'true' : 'false',
        'aria-pressed': selecting ? picked : undefined,
        onClick: function open(event) {
          if (selecting) { if (props.onSelect) props.onSelect(book, event); return; }
          props.onOpen(book);
        },
        onKeyDown: function onKey(event) {
          if (selecting) return;
          if (event.key === ' ' && props.onContinue) {
            event.preventDefault();
            event.stopPropagation();
            props.onContinue(book);
          }
        },
        'aria-keyshortcuts': 'Space',
        'aria-label': book.title + ' · ' + book.author,
      },
        h('div', { className: 'sr-book-cover-wrap' },
          h(Cover, { book: book, t: props.t, progress: pct }),
          // A span, not a nested <button>: the card itself is the focusable control
          // (Space continues reading), and nested buttons break Tab order.
          !selecting && props.onContinue ? h('span', {
            className: 'sr-book-quick-read',
            'aria-hidden': 'true',
            title: completed ? props.t('reread') : (pct > 0 ? props.t('continueReading') : props.t('readNow')),
            onClick: function quickRead(e) {
              e.stopPropagation();
              e.preventDefault();
              props.onContinue(book);
            },
          }, h(Icon, { name: 'play', size: 12 })) : null,
        ),
        selecting ? h('span', { className: 'sr-book-check', 'aria-hidden': 'true' }, picked ? h(Icon, { name: 'check', size: 11 }) : null) : null,
        props.pinned ? h('span', { className: 'sr-book-pin', title: props.t('pinned'), 'aria-hidden': 'true' }, h(Icon, { name: 'pin-filled', size: 9 })) : null,
        h('div', { className: 'sr-book-meta' },
          h('p', { className: 'sr-book-title' }, book.title),
          h('p', { className: 'sr-book-author' }, book.author),
          props.rating ? h('div', { className: 'sr-book-rating' },
            [1, 2, 3, 4, 5].map(function star(value) { return h(Icon, { key: value, name: value <= props.rating ? 'star-filled' : 'star', size: 8 }); }),
          ) : null,
          h('div', { className: 'sr-book-progress' },
            h('span', { className: 'sr-book-track' }, h('span', { className: 'sr-book-fill', style: { width: pct + '%' } })),
            h('span', { className: 'sr-book-pct' }, completed ? props.t('finished') : (pct > 0 ? pct + '%' : '')),
          ),
          h('span', { className: 'sr-book-last' },
            lastReadInline(props.progress, props.t, props.progress ? '' : props.t('unread')),
          ),
        ),
      );
    }
    const BookCard = (React && React.memo) ? React.memo(BookCardComponent) : BookCardComponent;

    function BookListRowComponent(props) {
      const book = props.book;
      const pct = progressPercent(book, props.progress);
      const selecting = props.selectMode === true;
      const picked = selecting && props.selected === true;
      const completed = Boolean(props.progress && props.progress.completed);
      const totalWords = bookCharCount(book);
      return h('button', {
        type: 'button',
        className: 'sr-book-row',
        'data-select-mode': selecting ? 'true' : 'false',
        'data-selected': picked ? 'true' : 'false',
        'aria-pressed': selecting ? picked : undefined,
        onClick: function open(event) {
          if (selecting) { if (props.onSelect) props.onSelect(book, event); return; }
          props.onOpen(book);
        },
        onKeyDown: function onKey(event) {
          if (selecting) return;
          if (event.key === ' ' && props.onContinue) {
            event.preventDefault();
            event.stopPropagation();
            props.onContinue(book);
          }
        },
        'aria-keyshortcuts': 'Space',
        'aria-label': book.title + ' · ' + book.author,
      },
        selecting ? h('span', { className: 'sr-book-check sr-book-check--row', 'aria-hidden': 'true' }, picked ? h(Icon, { name: 'check', size: 11 }) : null) : null,
        h(Cover, { book: book, t: props.t, size: 'sm', showBadge: false }),
        h('div', { className: 'sr-book-row-main' },
          h('div', { className: 'sr-book-row-title' },
            h('span', null, book.title),
            props.pinned ? h(Icon, { name: 'pin-filled', size: 10 }) : null,
          ),
          h('div', { className: 'sr-book-row-meta' },
            book.author + (book.subtitle ? ' · ' + book.subtitle : ''),
            totalWords > 0 ? h('span', { className: 'sr-book-row-words' }, formatWordCount(totalWords, props.t)) : null,
            props.rating ? h('span', { className: 'sr-book-row-rating' }, h(Icon, { name: 'star-filled', size: 9 }), String(props.rating)) : null,
          ),
          h('div', { className: 'sr-book-row-progress' },
            h('span', { className: 'sr-book-track' }, h('span', { className: 'sr-book-fill', style: { width: pct + '%' } })),
          ),
        ),
        h('div', { className: 'sr-book-row-side' },
          !selecting && props.onContinue ? h('span', {
            className: 'sr-book-row-read-btn',
            'aria-hidden': 'true',
            title: completed ? props.t('reread') : (pct > 0 ? props.t('continueReading') : props.t('readNow')),
            onClick: function quickRead(e) {
              e.stopPropagation();
              e.preventDefault();
              props.onContinue(book);
            },
          }, h(Icon, { name: 'play', size: 10 }), h('span', null, completed ? props.t('reread') : (pct > 0 ? props.t('continueReading') : props.t('readNow')))) : null,
          h('span', { className: 'sr-book-row-pct' }, completed ? props.t('finished') : (pct > 0 ? pct + '%' : props.t('unread'))),
          lastReadLabel(props.progress, props.t),
          h(Icon, { name: 'chevron-right', size: 14 }),
        ),
      );
    }
    const BookListRow = (React && React.memo) ? React.memo(BookListRowComponent) : BookListRowComponent;

    function ImportCard(props) {
      return h('button', { type: 'button', className: 'sr-import-card', onClick: props.onImport },
        h(Icon, { name: 'upload', size: 21 }),
        h('span', { className: 'sr-import-title' }, props.t('importCardTitle')),
        h('span', { className: 'sr-import-text' }, props.t('importCardText')),
        h('span', { className: 'sr-import-multi' }, props.t('importMultiHint')),
      );
    }

    function ShelfView(props) {
      const t = props.t;
      const state = props.state;
      const books = props.books;
      const [filter, setFilter] = useState(props.initialFilter || 'all');
      const [tagFilters, setTagFilters] = useState(
        props.shelfTagFilter
          ? [props.shelfTagFilter]
          : (Array.isArray(props.initialTagFilters) ? props.initialTagFilters : []),
      );
      useEffect(function syncShelfTagFilter() {
        if (props.shelfTagFilter) {
          setFilter('all');
          setTagFilters([props.shelfTagFilter]);
          if (typeof props.onClearShelfTagFilter === 'function') {
            props.onClearShelfTagFilter();
          }
        }
      }, [props.shelfTagFilter]);
      // A finished import must always land in view, so drop filters that would hide the new books.
      const bookCountRef = useRef(books.length);
      useEffect(function revealImportedBooks() {
        if (books.length > bookCountRef.current) {
          setFilter('all');
          setTagFilters([]);
        }
        bookCountRef.current = books.length;
      }, [books.length]);
      const [tagMatch, setTagMatch] = useState(props.initialTagMatch === 'all' ? 'all' : 'any');
      useEffect(function publishShelfUi() {
        if (typeof props.onShelfUiChange === 'function') {
          props.onShelfUiChange({ filter: filter, tagFilters: tagFilters, tagMatch: tagMatch });
        }
      }, [filter, tagFilters, tagMatch]);
      const [tagManagerOpen, setTagManagerOpen] = useState(false);
      const [quoteOffset, setQuoteOffset] = useState(0);
      const [cardQuote, setCardQuote] = useState(null);
      const [contentResults, setContentResults] = useState([]);
      const [searchingContent, setSearchingContent] = useState(false);
      const [selectMode, setSelectMode] = useState(props.initialSelectMode === true);
      const [selected, setSelected] = useState(Array.isArray(props.initialSelected) ? props.initialSelected : []);
      const lastSelectedRef = useRef(null);
      const [bulkTagOpen, setBulkTagOpen] = useState(false);
      const [bulkTagDraft, setBulkTagDraft] = useState('');
      const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
      const [deleteConfirm, setDeleteConfirm] = useState(false);
      const query = (props.query || '').trim().toLowerCase();
      const progress = state.progress || {};

      const continueBook = useMemo(function calcContinue() {
        return resolveContinueBook(books, progress, state.shelved);
      }, [books, progress, state.shelved]);
      const continueProgress = continueBook ? progress[continueBook.id] : null;
      const continueChapter = continueBook ? progressChapter(continueBook, continueProgress) : null;
      const continuePct = continueBook ? progressPercent(continueBook, continueProgress) : 0;
      const completedContinue = continueProgress && continueProgress.completed;

      const weeklyStats = useMemo(function calcWeeklyStats() {
        const days = (state.stats && state.stats.days) || {};
        const weekly = weekSeries(days);
        const weeklySeconds = weekly.reduce(function sum(total, day) { return total + day.seconds; }, 0);
        const goalMinutes = clamp(Number(state.stats && state.stats.goalMinutes) || DEFAULT_WEEKLY_GOAL_MINUTES, 30, 1440);
        const goalSeconds = goalMinutes * 60;
        const weeklyGoalRatio = clamp(weeklySeconds / goalSeconds, 0, 1);
        const streak = readingStreak(days);
        const todayGoal = todayGoalProgress(days, state.stats && state.stats.goalMinutes);
        const goalRemain = Math.max(0, Math.ceil((goalSeconds - weeklySeconds) / 60));
        return {
          weekly: weekly,
          weeklySeconds: weeklySeconds,
          goalSeconds: goalSeconds,
          weeklyGoalRatio: weeklyGoalRatio,
          streak: streak,
          todayGoal: todayGoal,
          goalRemain: goalRemain,
        };
      }, [state.stats]);
      const weekly = weeklyStats.weekly;
      const weeklySeconds = weeklyStats.weeklySeconds;
      const weeklyGoalRatio = weeklyStats.weeklyGoalRatio;
      const streak = weeklyStats.streak;
      const todayGoal = weeklyStats.todayGoal;

      const dailyQuote = useMemo(function calcDailyQuote() {
        return pickDailyQuote(props.highlights, books, dayKey(), quoteOffset);
      }, [props.highlights, books, quoteOffset]);

      const reviews = state.reviews || {};
      // Tag summary lives above `filtered` so the filter can validate stale tag picks (renamed/deleted elsewhere).
      const tagsData = useMemo(function calcTags() {
        const summary = bookTagSummary(props.userTags || {});
        return {
          tagSummary: summary,
          tagCounts: new Map(summary.map(function pair(item) { return [item.tag, item.count]; })),
          userTagList: summary.map(function label(item) { return item.tag; }),
        };
      }, [props.userTags]);
      const tagSummary = tagsData.tagSummary;
      const tagCounts = tagsData.tagCounts;
      const userTagList = tagsData.userTagList;
      const liveTagFilters = useMemo(function calcLiveFilters() {
        return tagFilters.filter(function alive(tag) { return tagCounts.has(tag); });
      }, [tagFilters, tagCounts]);

      // The status chip and the tag picks narrow first. The query only narrows the
      // visible grid; the in-text search runs over the same narrowed scope, so the
      // chips, the card grid and the "正文匹配" list can never disagree.
      const scopedBooks = useMemo(function filterScope() {
        return books.filter(function filterScopedBook(book) {
          if (filter === 'reading') {
            const item = progress[book.id];
            if (!item || item.completed || (state.shelved || []).indexOf(book.id) >= 0) return false;
          }
          if (filter === 'finished' && !(progress[book.id] && progress[book.id].completed)) return false;
          if (filter === 'local' && book.source !== 'local') return false;
          if (filter === 'wishlist' && (state.wishlist || []).indexOf(book.id) < 0) return false;
          if (filter === 'shelved' && (state.shelved || []).indexOf(book.id) < 0) return false;
          if (filter === 'reviewed' && !reviews[book.id]) return false;
          if (filter === 'annotated'
            && !(state.highlights || []).some(function note(item) { return item.bookId === book.id; })
            && !(state.bookmarks || []).some(function mark(item) { return item.bookId === book.id; })) return false;
          if (!matchBookTags(props.userTags || {}, book.id, liveTagFilters, tagMatch)) return false;
          return true;
        });
      }, [books, filter, progress, state.wishlist, state.shelved, reviews, state.highlights, state.bookmarks, props.userTags, liveTagFilters, tagMatch]);

      const filtered = useMemo(function filterBooks() {
        if (!query) return scopedBooks;
        return scopedBooks.filter(function filterBook(book) {
          const haystack = (book.title + ' ' + book.author + ' ' + (book.tags || []).join(' ') + ' ' + ((props.userTags || {})[book.id] || []).join(' ')).toLowerCase();
          return haystack.indexOf(query) >= 0;
        });
      }, [scopedBooks, query, props.userTags]);

      useEffect(function searchBookText() {
        const needle = (props.query || '').trim();
        if (!needle) {
          setContentResults([]);
          setSearchingContent(false);
          return undefined;
        }
        setSearchingContent(true);
        const timer = window.setTimeout(function runSearch() {
          setContentResults(searchLibraryBooks(scopedBooks, needle, 6));
          setSearchingContent(false);
        }, 220);
        return function cleanup() { window.clearTimeout(timer); };
      }, [props.query, scopedBooks]);

      const counts = useMemo(function calcCounts() {
        let reading = 0;
        let finished = 0;
        let local = 0;
        let wishlist = 0;
        let shelved = 0;
        let reviewed = 0;
        let annotated = 0;
        const wishlistSet = new Set(state.wishlist || []);
        const shelvedSet = new Set(state.shelved || []);
        const annotatedSet = new Set();
        (state.highlights || []).forEach(function addH(item) { if (item && item.bookId) annotatedSet.add(item.bookId); });
        (state.bookmarks || []).forEach(function addB(item) { if (item && item.bookId) annotatedSet.add(item.bookId); });

        for (let i = 0; i < books.length; i += 1) {
          const book = books[i];
          const id = book.id;
          const prog = progress[id];
          if (prog) {
            if (prog.completed) finished += 1;
            else if (!shelvedSet.has(id)) reading += 1;
          }
          if (book.source === 'local') local += 1;
          if (wishlistSet.has(id)) wishlist += 1;
          if (shelvedSet.has(id)) shelved += 1;
          if (reviews[id]) reviewed += 1;
          if (annotatedSet.has(id)) annotated += 1;
        }

        return {
          all: books.length,
          reading: reading,
          finished: finished,
          local: local,
          wishlist: wishlist,
          shelved: shelved,
          reviewed: reviewed,
          annotated: annotated,
        };
      }, [books, progress, state.wishlist, state.shelved, reviews, state.highlights, state.bookmarks]);

      const sort = state.shelfSort || 'recent';
      const view = ['grid', 'list', 'group'].indexOf(state.shelfView) >= 0 ? state.shelfView : 'grid';
      const pins = state.pins || [];
      const ordered = useMemo(function sortBooks() {
        return sortShelfBooks(filtered, progress, pins, sort, reviews);
      }, [filtered, progress, pins, sort, reviews]);

      const shelfGridRef = useRef(null);
      const lastWindowRef = useRef(null);
      const [virtualWindow, setVirtualWindow] = useState(function initWindow() {
        return {
          start: 0,
          end: Math.min(ordered.length, 40),
          padTop: 0,
          padBottom: 0,
          showImport: true,
        };
      });

      useEffect(function monitorShelfScroll() {
        const el = shelfGridRef.current;
        if (!el || typeof window === 'undefined') return undefined;
        const scrollEl = el.closest('.sr-scroll');
        if (!scrollEl) return undefined;

        // Restore a shelf scroll position once, on the first measure after a reader
        // round-trip: the virtual spacer has to be sized for that position first,
        // otherwise the write is clamped and the position is lost.
        let pendingRestore = Math.max(0, Number(props.initialScrollTop) || 0);
        function consumeRestore() {
          if (!(pendingRestore > 0)) return;
          const target = pendingRestore;
          pendingRestore = 0;
          if (typeof props.onShelfScrollRestored === 'function') props.onShelfScrollRestored();
          let attempts = 0;
          const applyRestore = function applyRestore() {
            if (!scrollEl || attempts > 10) return;
            attempts += 1;
            if (Math.abs(scrollEl.scrollTop - target) <= 2) return;
            scrollEl.scrollTop = target;
            window.requestAnimationFrame(applyRestore);
          };
          window.requestAnimationFrame(applyRestore);
        }

        let rafId = null;
        function measure() {
          rafId = null;
          const total = ordered.length;
          if (total <= 40) {
            const next = { start: 0, end: total, padTop: 0, padBottom: 0, showImport: true };
            const prev = lastWindowRef.current;
            if (!prev || prev.start !== next.start || prev.end !== next.end || prev.padTop !== next.padTop || prev.padBottom !== next.padBottom) {
              lastWindowRef.current = next;
              setVirtualWindow(next);
            }
            consumeRestore();
            return;
          }

          const rect = el.getBoundingClientRect();
          const sRect = scrollEl.getBoundingClientRect();
          const scrollTop = pendingRestore > 0 ? pendingRestore : scrollEl.scrollTop;
          const viewportH = scrollEl.clientHeight || window.innerHeight || 900;
          const gridTop = Math.max(0, rect.top - sRect.top + scrollTop);
          const gridW = el.clientWidth || 1000;
          const scrollY = Math.max(0, scrollTop - gridTop);

          let next;
          if (view === 'list') {
            const sampleRow = el.querySelector('.sr-book-row');
            const rowH = (sampleRow ? sampleRow.getBoundingClientRect().height : 76) + 7;
            const totalItems = total + 1;
            const startRow = Math.max(0, Math.floor(scrollY / rowH) - 4);
            const endRow = Math.min(totalItems, Math.ceil((scrollY + viewportH) / rowH) + 4);
            next = {
              start: Math.min(total, startRow),
              end: Math.min(total, endRow),
              padTop: startRow * rowH,
              padBottom: Math.max(0, (totalItems - endRow) * rowH),
              showImport: endRow >= totalItems,
            };
          } else {
            const gapX = 19;
            const gapY = 26;
            const minW = gridW < 500 ? 118 : 138;
            const cols = Math.max(1, Math.floor((gridW + gapX) / (minW + gapX)));
            const colW = (gridW - (cols - 1) * gapX) / cols;
            const sampleCard = el.querySelector('.sr-book-card');
            const measuredCardH = sampleCard ? sampleCard.getBoundingClientRect().height : 0;
            const cardH = measuredCardH > 0 ? measuredCardH : Math.round(colW * (4 / 3) + 100);
            const rowH = cardH + gapY;

            const totalItems = total + 1;
            const totalRows = Math.ceil(totalItems / cols);

            const startRow = Math.max(0, Math.floor(scrollY / rowH) - 2);
            const endRow = Math.min(totalRows, Math.ceil((scrollY + viewportH) / rowH) + 2);

            next = {
              start: startRow * cols,
              end: Math.min(total, endRow * cols),
              padTop: startRow * rowH,
              padBottom: Math.max(0, (totalRows - endRow) * rowH),
              showImport: endRow >= totalRows,
            };
          }

          const prev = lastWindowRef.current;
          if (!prev || prev.start !== next.start || prev.end !== next.end || prev.padTop !== next.padTop || prev.padBottom !== next.padBottom || prev.showImport !== next.showImport) {
            lastWindowRef.current = next;
            setVirtualWindow(next);
          }
          consumeRestore();
        }

        function onScroll() {
          if (rafId === null) {
            rafId = window.requestAnimationFrame(measure);
          }
        }

        measure();
        scrollEl.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        return function cleanup() {
          if (rafId !== null) window.cancelAnimationFrame(rafId);
          scrollEl.removeEventListener('scroll', onScroll);
          window.removeEventListener('resize', onScroll);
        };
      }, [ordered.length, view]);

      const statusGroups = useMemo(function calcStatusGroups() {
        if (view !== 'group') return [];
        return groupBooksByStatus(ordered, progress, state.wishlist || [], state.shelved || []);
      }, [view, ordered, progress, state.wishlist, state.shelved]);
      // Group view draws a capped slice of each group until it is expanded. Selection,
      // select-all, invert and shift-ranges all work over exactly what is drawn, in the
      // order it is drawn, so a bulk action never reaches a book the reader cannot see.
      const groupCap = 48;
      const [expandedGroups, setExpandedGroups] = useState([]);
      const displayed = useMemo(function calcDisplayed() {
        if (view !== 'group') return ordered;
        return statusGroups.reduce(function collect(list, group) {
          return list.concat(expandedGroups.indexOf(group.id) >= 0 ? group.books : group.books.slice(0, groupCap));
        }, []);
      }, [view, ordered, statusGroups, expandedGroups]);
      const visibleIds = displayed.map(function id(book) { return book.id; });

      const sourceById = useMemo(function createSourceMap() {
        const map = new Map();
        for (let i = 0; i < books.length; i += 1) {
          map.set(books[i].id, books[i]);
        }
        return map;
      }, [books]);

      const selectionInfo = useMemo(function calcSelection() {
        if (!selected.length) {
          return {
            selectedSet: new Set(),
            selectedVisible: [],
            deletableIds: [],
            selectedAllFinished: false,
            selectedAllShelved: false,
            selectedAllWishlisted: false,
            selectedAllPinned: false,
          };
        }
        const selectedSet = new Set(selected);
        const visibleSet = new Set(displayed.map(function id(book) { return book.id; }));
        const selectedVisible = selected.filter(function inView(id) { return visibleSet.has(id); });
        const deletableIds = selectedVisible.filter(function local(id) {
          const book = sourceById.get(id);
          return Boolean(book) && book.source === 'local';
        });
        const selectedAllFinished = selectedVisible.length > 0 && selectedVisible.every(function done(id) {
          return Boolean(progress[id] && progress[id].completed);
        });
        const selectedAllShelved = selectedVisible.length > 0 && selectedVisible.every(function parked(id) {
          return (state.shelved || []).indexOf(id) >= 0;
        });
        const selectedAllWishlisted = selectedVisible.length > 0 && selectedVisible.every(function wanted(id) {
          return (state.wishlist || []).indexOf(id) >= 0;
        });
        const selectedAllPinned = selectedVisible.length > 0 && selectedVisible.every(function pinned(id) {
          return pins.indexOf(id) >= 0;
        });
        return {
          selectedSet: selectedSet,
          selectedVisible: selectedVisible,
          deletableIds: deletableIds,
          selectedAllFinished: selectedAllFinished,
          selectedAllShelved: selectedAllShelved,
          selectedAllWishlisted: selectedAllWishlisted,
          selectedAllPinned: selectedAllPinned,
        };
      }, [selected, displayed, sourceById, progress, state.shelved, state.wishlist, pins]);

      const selectedSet = selectionInfo.selectedSet;
      const selectedVisible = selectionInfo.selectedVisible;
      const deletableIds = selectionInfo.deletableIds;
      const selectedAllFinished = selectionInfo.selectedAllFinished;
      const selectedAllShelved = selectionInfo.selectedAllShelved;
      const selectedAllWishlisted = selectionInfo.selectedAllWishlisted;
      const selectedAllPinned = selectionInfo.selectedAllPinned;

      function exitSelect() {
        lastSelectedRef.current = null;
        setSelectMode(false);
        setSelected([]);
        setBulkTagOpen(false);
        setBulkTagDraft('');
        setDeleteConfirm(false);
        setBulkMenuOpen(false);
      }

      // The shift-click anchor is a book id, resolved against the order on screen at click
      // time, so it survives sort/filter changes and follows group view's own order.
      const toggleSelect = useCallback(function toggle(book, event) {
        const visibleIds = displayed.map(function id(item) { return item.id; });
        const index = visibleIds.indexOf(book.id);
        const anchor = lastSelectedRef.current !== null ? visibleIds.indexOf(lastSelectedRef.current) : -1;
        if (event && event.shiftKey && anchor >= 0 && index >= 0) {
          const start = Math.min(anchor, index);
          const end = Math.max(anchor, index);
          const range = visibleIds.slice(start, end + 1);
          setSelected(function applyRange(previous) {
            return Array.from(new Set(previous.concat(range)));
          });
          return;
        }
        lastSelectedRef.current = book.id;
        setSelected(function apply(previous) {
          return previous.indexOf(book.id) >= 0
            ? previous.filter(function keep(id) { return id !== book.id; })
            : previous.concat([book.id]);
        });
      }, [displayed]);

      useEffect(function escapeSelectMode() {
        if (!selectMode) return undefined;
        function onKey(event) {
          if (event.key !== 'Escape') return;
          // The bulk-tag input, the tag manager and card dialogs consume their own Escape.
          if (event.defaultPrevented) return;
          if (event.isComposing || event.keyCode === 229) return;
          if (tagManagerOpen) return;
          event.preventDefault();
          // Close the innermost open layer first; only a bare Escape leaves select mode.
          if (deleteConfirm) { setDeleteConfirm(false); return; }
          if (bulkTagOpen) { setBulkTagOpen(false); setBulkTagDraft(''); return; }
          if (bulkMenuOpen) { setBulkMenuOpen(false); return; }
          exitSelect();
        }
        window.addEventListener('keydown', onKey);
        return function cleanup() { window.removeEventListener('keydown', onKey); };
      }, [selectMode, bulkMenuOpen, bulkTagOpen, deleteConfirm, tagManagerOpen]);

      function bulkPin(pinned) {
        if (!selectedVisible.length || typeof props.onSetPinned !== 'function') return;
        props.onSetPinned(selectedVisible, pinned);
      }

      function applyBulkTag(mode) {
        const tag = bulkTagDraft.trim();
        if (!tag || !selectedVisible.length || typeof props.onBulkTag !== 'function') return;
        props.onBulkTag(selectedVisible, tag, mode);
        setBulkTagDraft('');
      }

      function confirmDelete() {
        if (!deletableIds.length || typeof props.onDeleteBooks !== 'function') return;
        props.onDeleteBooks(deletableIds);
        exitSelect();
      }

      function exportBooklist(targetBooks) {
        const list = Array.isArray(targetBooks) && targetBooks.length
          ? targetBooks.map(function resolve(item) {
              return typeof item === 'string' ? sourceById.get(item) : item;
            }).filter(Boolean)
          : books;
        const markdown = booklistMarkdown(list, state, t);
        const filename = 'shiguang-booklist-' + dayKey() + '.md';
        const ok = downloadMarkdownFile(filename, markdown);
        props.showToast(ok ? t('booklistExported') : t('exportFailed'));
      }

      function copyBooklist(targetBooks) {
        const list = Array.isArray(targetBooks) && targetBooks.length
          ? targetBooks.map(function resolve(item) {
              return typeof item === 'string' ? sourceById.get(item) : item;
            }).filter(Boolean)
          : books;
        const markdown = booklistMarkdown(list, state, t);
        copyTextToClipboard(markdown).then(function done(ok) {
          props.showToast(ok ? t('booklistCopied') : t('copyFailed'));
        });
      }

      function copyBookTitles(targetBooks) {
        const list = Array.isArray(targetBooks) && targetBooks.length
          ? targetBooks.map(function resolve(item) {
              return typeof item === 'string' ? sourceById.get(item) : item;
            }).filter(Boolean)
          : books;
        const text = buildBookTitlesText(list);
        if (!text) return;
        copyTextToClipboard(text).then(function done(ok) {
          props.showToast(ok ? fill(t('bookTitlesCopied'), { n: list.length }) : t('copyFailed'));
        });
      }
      const sortOptions = [
        { value: 'recent', label: t('sortRecent') },
        { value: 'progress', label: t('sortProgress') },
        { value: 'rating', label: t('sortRating') },
        { value: 'words', label: t('sortWords') },
        { value: 'title', label: t('sortTitle') },
        { value: 'author', label: t('sortAuthor') },
        { value: 'added', label: t('sortAdded') },
      ];

      function toggleTagFilter(tag) {
        setTagFilters(function apply(previous) {
          return previous.indexOf(tag) >= 0
            ? previous.filter(function keep(item) { return item !== tag; })
            : previous.concat(tag);
        });
      }

      function handleTagRename(oldTag, nextTag) {
        if (typeof props.onRenameTag === 'function') props.onRenameTag(oldTag, nextTag);
        setTagFilters(function swap(list) {
          return list.map(function item(tag) { return tag === oldTag ? nextTag : tag; });
        });
      }

      function handleTagDelete(tag) {
        if (typeof props.onDeleteTag === 'function') props.onDeleteTag(tag);
        setTagFilters(function drop(list) {
          return list.filter(function keep(item) { return item !== tag; });
        });
      }

      const libraryEmpty = books.length === 0;
      const narrowed = Boolean(query) || filter !== 'all' || liveTagFilters.length > 0;
      const todayGoalRemainSeconds = Math.max(0, todayGoal.targetSeconds - todayGoal.seconds);

      return h('div', null,
        !query ? h('section', { className: 'sr-hero-grid' },
          h('div', { className: 'sr-hero-main' },
            h('div', { className: 'sr-hero-copy' },
              h('span', { className: 'sr-hero-kicker' }, t('heroKicker')),
              h('h1', { className: 'sr-hero-title' },
                t('heroTitleA'),
                h('span', null, t('heroTitleB')),
              ),
              h('p', null, t('heroCopy')),
              h('div', { className: 'sr-hero-tip' },
                h(Icon, { name: 'leaf', size: 13 }),
                h('span', null, t('greetSub')),
              ),
            ),
            continueBook ? h('button', {
              type: 'button',
              className: 'sr-continue-card',
              onClick: function go() { props.onContinueBook(continueBook); },
              title: completedContinue ? t('reread') : t('continueReading'),
            },
              h(Cover, { book: continueBook, t: t, progress: continuePct, showBadge: false }),
              h('div', { className: 'sr-continue-info' },
                h('span', { className: 'sr-continue-label' }, completedContinue ? t('finished') : t('continueReading')),
                h('span', { className: 'sr-continue-title' }, continueBook.title),
                h('span', { className: 'sr-continue-meta' },
                  continueChapter ? t('currentChapter') + ' · ' + continueChapter.title : t('firstBook'),
                ),
                h('div', { className: 'sr-continue-progress' },
                  h('span', { className: 'sr-continue-track' }, h('span', { className: 'sr-continue-fill', style: { width: continuePct + '%' } })),
                  h('span', { className: 'sr-continue-pct' }, continuePct + '%'),
                ),
              ),
              h('span', {
                className: 'sr-continue-go',
                'aria-hidden': 'true',
              }, h(Icon, { name: 'arrow-right', size: 16 })),
            ) : libraryEmpty ? h('button', {
              type: 'button',
              className: 'sr-continue-card sr-firstrun-card',
              onClick: function firstRunImport() { props.onImport(); },
              title: t('heroFirstRunTitle'),
            },
              h('span', { className: 'sr-firstrun-mark', 'aria-hidden': 'true' }, h(Icon, { name: 'upload', size: 22 })),
              h('div', { className: 'sr-continue-info' },
                h('span', { className: 'sr-continue-label' }, t('heroFirstRunLabel')),
                h('span', { className: 'sr-continue-title' }, t('heroFirstRunTitle')),
                h('span', { className: 'sr-continue-meta' }, t('heroFirstRunHint')),
              ),
              h('span', { className: 'sr-continue-go', 'aria-hidden': 'true' }, h(Icon, { name: 'arrow-right', size: 16 })),
            ) : null,
          ),
          h('aside', { className: 'sr-goal-card' },
            h('div', { className: 'sr-goal-top' },
              h('div', { className: 'sr-ring-wrap' },
                h(Ring, { value: weeklyGoalRatio }),
                h('span', { className: 'sr-ring-label' }, Math.round(weeklyGoalRatio * 100) + '%'),
              ),
              h('div', null,
                h('div', { className: 'sr-goal-kicker' }, t('weekReading')),
                h('div', { className: 'sr-goal-time' }, formatDuration(weeklySeconds, t).replace(/\s/g, '')),
                h('div', { className: 'sr-goal-streak' },
                  h(Icon, { name: 'flame', size: 12 }),
                  h('span', null, t('streak')),
                  h('strong', null, t('streakValue', { n: streak })),
                ),
              ),
            ),
            h('div', { className: 'sr-goal-daily' },
              h('div', { className: 'sr-goal-daily-head' },
                h('span', null, t('todayGoal')),
                h('strong', null, formatDuration(todayGoal.seconds, t).replace(/\s/g, '') + ' / ' + formatDuration(todayGoal.targetSeconds, t).replace(/\s/g, '')),
              ),
              h('span', { className: 'sr-goal-daily-track', title: todayGoal.done ? t('todayGoalDone') : t('todayGoal') },
                h('span', {
                  className: 'sr-goal-daily-fill',
                  'data-done': todayGoal.done ? 'true' : 'false',
                  style: { width: Math.round(todayGoal.ratio * 100) + '%' },
                }),
              ),
            ),
            dailyQuote ? h('div', { className: 'sr-daily-wrap' },
              h('button', {
                type: 'button',
                className: 'sr-goal-quote sr-daily-quote',
                onClick: function openQuote() { props.onJumpContent(dailyQuote.bookId, dailyQuote.chapterIndex, dailyQuote.percent); },
              },
                h('span', { className: 'sr-daily-kicker' }, t('dailyQuote')),
                h('p', null, '“' + dailyQuote.text + '”'),
                h('span', null, dailyQuote.bookTitle + (dailyQuote.chapterTitle ? ' · ' + dailyQuote.chapterTitle : '')),
              ),
              h('div', { className: 'sr-daily-actions' },
                h('button', {
                  type: 'button',
                  className: 'sr-daily-action',
                  title: t('copyQuote'),
                  onClick: function copyQuote() {
                    copyTextToClipboard(buildQuoteText(dailyQuote.text, dailyQuote.bookTitle, dailyQuote.chapterTitle)).then(function done(ok) {
                      props.showToast(ok ? t('quoteCopied') : t('copyFailed'));
                    });
                  },
                }, h(Icon, { name: 'copy', size: 10 }), h('span', null, t('copyShort'))),
                h('button', {
                  type: 'button',
                  className: 'sr-daily-action',
                  title: t('quoteCard'),
                  onClick: function makeCard() { setCardQuote(dailyQuote); },
                }, h(Icon, { name: 'image', size: 10 }), h('span', null, t('quoteCardShort'))),
                dailyQuote.total > 1 ? h('button', {
                  type: 'button',
                  className: 'sr-daily-action',
                  title: t('anotherQuote'),
                  onClick: function nextQuote() { setQuoteOffset(quoteOffset + 1); },
                }, h(Icon, { name: 'refresh', size: 10 }), h('span', null, t('anotherQuote'))) : null,
              ),
            ) : h('div', { className: 'sr-goal-quote' },
              h('p', null, t('quote')),
              h('span', null, t('quoteBy')),
            ),
          ),
        ) : null,
        h('div', { className: 'sr-greeting-line' },
          h('p', { className: 'sr-greeting-text' },
            h('time', { dateTime: dayKey() }, fullDateLabel()),
            h('span', { className: 'sr-greeting-dot', 'aria-hidden': 'true' }, '·'),
            h('span', null, t(greetingKey())),
          ),
          libraryEmpty || todayGoal.done ? null : h('span', { className: 'sr-greeting-goal' },
            t('todayGoal') + ' · ' + fill(t('goalDailyRemain'), { n: Math.ceil(todayGoalRemainSeconds / 60) }),
          ),
        ),
        h('section', null,
          h('div', { className: 'sr-section-head' },
            h('div', null,
              h(query ? 'h1' : 'h2', { className: 'sr-section-title' }, query ? t('searchAria') : t('shelfTitle')),
              h('p', null, query ? t('shelfSearchHint') : t('shelfSubtitle')),
            ),
            libraryEmpty ? null : h('div', { className: 'sr-shelf-head-tools' },
              narrowed ? h('span', { className: 'sr-count-chip', 'aria-live': 'polite' }, filtered.length + ' / ' + books.length) : null,
              h('button', {
                type: 'button',
                className: 'sr-icon-btn',
                title: t('surpriseMe'),
                'aria-label': t('surpriseMe'),
                onClick: function surprise() {
                  const picked = pickRandomBook(books, progress, Math.random());
                  if (picked) props.onOpenBook(picked);
                },
              }, h(Icon, { name: 'sparkle', size: 14 })),
              h('button', {
                type: 'button',
                className: 'sr-icon-btn',
                'data-on': selectMode ? 'true' : 'false',
                title: selectMode ? t('done') : t('selectBooks'),
                'aria-label': selectMode ? t('done') : t('selectBooks'),
                'aria-pressed': selectMode,
                onClick: function toggleSelectMode() {
                  if (selectMode) { exitSelect(); return; }
                  lastSelectedRef.current = null;
                  setSelected([]);
                  setBulkMenuOpen(false);
                  setSelectMode(true);
                },
              }, h(Icon, { name: 'check', size: 14 })),
              h('div', { className: 'sr-view-toggle', role: 'group', 'aria-label': t('viewMode') },
                h('button', {
                  type: 'button',
                  className: 'sr-view-btn',
                  'aria-pressed': view === 'grid',
                  title: t('gridView'),
                  'aria-label': t('gridView'),
                  onClick: function grid() { props.onViewChange('grid'); },
                }, h(Icon, { name: 'grid', size: 13 })),
                h('button', {
                  type: 'button',
                  className: 'sr-view-btn',
                  'aria-pressed': view === 'list',
                  title: t('listView'),
                  'aria-label': t('listView'),
                  onClick: function list() { props.onViewChange('list'); },
                }, h(Icon, { name: 'list', size: 13 })),
                h('button', {
                  type: 'button',
                  className: 'sr-view-btn',
                  'aria-pressed': view === 'group',
                  title: t('groupView'),
                  'aria-label': t('groupView'),
                  onClick: function group() { props.onViewChange('group'); },
                }, h(Icon, { name: 'layers', size: 13 })),
              ),
              h('label', { className: 'sr-sort' },
                h(Icon, { name: 'sliders', size: 12 }),
                h('select', {
                  value: sort,
                  'aria-label': t('sortBy'),
                  title: t('sortBy'),
                  onChange: function change(event) { props.onSortChange(event.target.value); },
                },
                  sortOptions.map(function option(item) { return h('option', { key: item.value, value: item.value }, item.label); }),
                ),
              ),
            ),
          ),
          libraryEmpty ? null : h('div', { className: 'sr-filter-row' },
            h('button', { type: 'button', className: 'sr-chip', 'aria-pressed': filter === 'all', onClick: function all() { setFilter('all'); setTagFilters([]); } },
              t('shelfAll'), h('span', { className: 'sr-chip-count' }, counts.all),
            ),
            h('button', { type: 'button', className: 'sr-chip', 'aria-pressed': filter === 'reading', onClick: function reading() { setFilter('reading'); } },
              t('shelfReading'), h('span', { className: 'sr-chip-count' }, counts.reading),
            ),
            h('button', { type: 'button', className: 'sr-chip', 'aria-pressed': filter === 'finished', onClick: function finished() { setFilter('finished'); } },
              t('shelfFinished'), h('span', { className: 'sr-chip-count' }, counts.finished),
            ),
            counts.local ? h('button', { type: 'button', className: 'sr-chip', 'aria-pressed': filter === 'local', onClick: function local() { setFilter('local'); } },
              t('shelfLocal'), h('span', { className: 'sr-chip-count' }, counts.local),
            ) : null,
            counts.wishlist ? h('button', { type: 'button', className: 'sr-chip', 'aria-pressed': filter === 'wishlist', onClick: function wishlist() { setFilter('wishlist'); } },
              t('shelfWishlist'), h('span', { className: 'sr-chip-count' }, counts.wishlist),
            ) : null,
            counts.shelved ? h('button', { type: 'button', className: 'sr-chip', 'aria-pressed': filter === 'shelved', onClick: function shelved() { setFilter('shelved'); } },
              t('shelfShelved'), h('span', { className: 'sr-chip-count' }, counts.shelved),
            ) : null,
            counts.reviewed ? h('button', { type: 'button', className: 'sr-chip', 'aria-pressed': filter === 'reviewed', onClick: function reviewed() { setFilter('reviewed'); } },
              t('shelfReviewed'), h('span', { className: 'sr-chip-count' }, counts.reviewed),
            ) : null,
            counts.annotated ? h('button', { type: 'button', className: 'sr-chip', 'aria-pressed': filter === 'annotated', onClick: function annotated() { setFilter('annotated'); } },
              t('shelfAnnotated'), h('span', { className: 'sr-chip-count' }, counts.annotated),
            ) : null,
          ),
          userTagList.length ? h('div', { className: 'sr-tag-filter-row' },
            h('span', { className: 'sr-tag-filter-label' }, t('tagsLabel')),
            userTagList.map(function tag(value) {
              return h('button', {
                key: value,
                type: 'button',
                className: 'sr-tag-chip',
                'aria-pressed': liveTagFilters.indexOf(value) >= 0,
                onClick: function pick() { toggleTagFilter(value); },
              }, h('span', { className: 'sr-tag-hash' }, '#'), value,
                h('span', { className: 'sr-tag-count' }, tagCounts.get(value) || 0));
            }),
            liveTagFilters.length > 1 ? h('button', {
              type: 'button',
              className: 'sr-tag-mode',
              title: t('tagMatchHint'),
              onClick: function toggleMatch() { setTagMatch(tagMatch === 'all' ? 'any' : 'all'); },
            }, t(tagMatch === 'all' ? 'tagMatchAll' : 'tagMatchAny')) : null,
            liveTagFilters.length ? h('button', {
              type: 'button',
              className: 'sr-link-btn',
              onClick: function clearTags() { setTagFilters([]); },
            }, t('searchClear')) : null,
            h('button', {
              type: 'button',
              className: 'sr-link-btn sr-tag-manage',
              onClick: function openManager() { setTagManagerOpen(true); },
            }, t('bookTagManager')),
          ) : null,
          selectMode ? h('div', { className: 'sr-shelf-select sr-batch-dock', role: 'region', 'aria-label': t('bulkActions') },
            bulkMenuOpen ? h(React.Fragment, null,
              h('button', {
                type: 'button',
                className: 'sr-bulk-scrim',
                tabIndex: -1,
                'aria-label': t('close'),
                onClick: function closeMenu() { setBulkMenuOpen(false); },
              }),
              h('div', { className: 'sr-bulk-menu sr-batch-popover-menu', role: 'menu', 'aria-label': t('bulkActions') },
                h('button', {
                  type: 'button', role: 'menuitem', disabled: !selectedVisible.length,
                  onClick: function wishlist() {
                    setBulkMenuOpen(false);
                    if (typeof props.onSetWishlist === 'function') props.onSetWishlist(selectedVisible, !selectedAllWishlisted);
                  },
                }, h(Icon, { name: selectedAllWishlisted ? 'bookmark-filled' : 'bookmark', size: 13 }),
                  h('span', null, selectedAllWishlisted ? t('removeWishlist') : t('wantToRead'))),
                h('button', {
                  type: 'button', role: 'menuitem', disabled: !selectedVisible.length,
                  onClick: function pin() { setBulkMenuOpen(false); bulkPin(!selectedAllPinned); },
                }, h(Icon, { name: selectedAllPinned ? 'pin-filled' : 'pin', size: 13 }),
                  h('span', null, selectedAllPinned ? t('unpinSelected') : t('pinSelected'))),
                h('div', { className: 'sr-bulk-menu-divider', role: 'separator' }),
                h('button', {
                  type: 'button', role: 'menuitem', disabled: !selectedVisible.length,
                  onClick: function copy() { setBulkMenuOpen(false); copyBooklist(selectedVisible); },
                }, h(Icon, { name: 'copy', size: 13 }), h('span', null, t('copyBooklist'))),
                h('button', {
                  type: 'button', role: 'menuitem', disabled: !selectedVisible.length,
                  onClick: function titles() { setBulkMenuOpen(false); copyBookTitles(selectedVisible); },
                }, h(Icon, { name: 'type', size: 13 }), h('span', null, t('copyBookTitles'))),
                h('button', {
                  type: 'button', role: 'menuitem', disabled: !selectedVisible.length,
                  onClick: function exportSelection() { setBulkMenuOpen(false); exportBooklist(selectedVisible); },
                }, h(Icon, { name: 'download', size: 13 }), h('span', null, t('exportBooklist'))),
                h('div', { className: 'sr-bulk-menu-divider', role: 'separator' }),
                h('button', {
                  type: 'button', role: 'menuitem', disabled: !deletableIds.length,
                  className: 'sr-bulk-menu-danger',
                  onClick: function remove() {
                    setBulkMenuOpen(false);
                    setBulkTagOpen(false);
                    setDeleteConfirm(true);
                  },
                }, h(Icon, { name: 'trash', size: 13 }), h('span', null, t('deleteBooks'))),
              ),
            ) : null,
            deleteConfirm ? h(React.Fragment, null,
              h('button', {
                type: 'button',
                className: 'sr-bulk-scrim',
                tabIndex: -1,
                'aria-label': t('close'),
                onClick: function cancel() { setDeleteConfirm(false); },
              }),
              h('div', { className: 'sr-shelf-delete-bar sr-batch-popover', role: 'alertdialog' },
                h('div', { className: 'sr-batch-popover-danger-head' },
                  h(Icon, { name: 'trash', size: 14 }),
                  h('span', null, fill(t('confirmDeleteBooks'), { n: deletableIds.length })),
                ),
                h('div', { className: 'sr-shelf-delete-actions' },
                  h('button', { type: 'button', className: 'sr-btn sr-btn-sm', onClick: function cancel() { setDeleteConfirm(false); } }, t('cancel')),
                  h('button', {
                    type: 'button',
                    className: 'sr-btn sr-btn-sm sr-btn-danger',
                    disabled: !deletableIds.length,
                    onClick: confirmDelete,
                  }, t('confirmRemove')),
                ),
              ),
            ) : null,
            bulkTagOpen ? h(React.Fragment, null,
              h('button', {
                type: 'button',
                className: 'sr-bulk-scrim',
                tabIndex: -1,
                'aria-label': t('close'),
                onClick: function closeTag() { setBulkTagOpen(false); setBulkTagDraft(''); },
              }),
              h('div', { className: 'sr-shelf-bulk-tag sr-batch-popover', role: 'dialog', 'aria-label': t('bulkTag') },
                h('div', { className: 'sr-batch-popover-head' },
                  h('span', { className: 'sr-batch-popover-title' },
                    h(Icon, { name: 'tag', size: 13 }),
                    h('strong', null, fill(t('bulkTagFor'), { n: selectedVisible.length })),
                  ),
                  h('button', {
                    type: 'button',
                    className: 'sr-icon-btn sr-batch-popover-close',
                    'aria-label': t('close'),
                    onClick: function closeTag() { setBulkTagOpen(false); setBulkTagDraft(''); },
                  }, h(Icon, { name: 'close', size: 12 })),
                ),
                h('div', { className: 'sr-batch-popover-input-row' },
                  h('input', {
                    type: 'text',
                    className: 'sr-bulk-tag-input',
                    value: bulkTagDraft,
                    maxLength: MAX_TAG_LENGTH,
                    autoFocus: true,
                    placeholder: t('bulkTagPlaceholder'),
                    'aria-label': t('bulkTagPlaceholder'),
                    onChange: function change(event) { setBulkTagDraft(event.target.value); },
                    onKeyDown: function key(event) {
                      if ((event.nativeEvent && event.nativeEvent.isComposing) || event.keyCode === 229) return;
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        applyBulkTag('add');
                      } else if (event.key === 'Escape') {
                        event.preventDefault();
                        setBulkTagOpen(false);
                        setBulkTagDraft('');
                      }
                    },
                  }),
                  h('button', {
                    type: 'button',
                    className: 'sr-btn sr-btn-sm sr-btn-primary',
                    disabled: !bulkTagDraft.trim() || !selectedVisible.length,
                    onClick: function add() { applyBulkTag('add'); },
                  }, t('bulkTagAdd')),
                  h('button', {
                    type: 'button',
                    className: 'sr-btn sr-btn-sm',
                    disabled: !bulkTagDraft.trim() || !selectedVisible.length,
                    onClick: function remove() { applyBulkTag('remove'); },
                  }, t('bulkTagRemove')),
                ),
                userTagList.length ? h('div', { className: 'sr-shelf-bulk-tag-suggest' },
                  userTagList.slice(0, 10).map(function sug(value) {
                    return h('button', {
                      key: value,
                      type: 'button',
                      className: 'sr-tag-chip',
                      'aria-pressed': bulkTagDraft === value,
                      onClick: function pick() { setBulkTagDraft(value); },
                    }, h('span', { className: 'sr-tag-hash' }, '#'), value);
                  }),
                ) : null,
              ),
            ) : null,
            h('div', { className: 'sr-batch-dock-inner' },
              h('div', { className: 'sr-shelf-select-main' },
                h('div', { className: 'sr-shelf-select-summary' },
                  h('span', { className: 'sr-shelf-select-dot', 'aria-hidden': 'true' }),
                  h('strong', { className: 'sr-shelf-select-count' }, fill(t('selectedBooksCount'), { n: selectedVisible.length })),
                ),
                h('div', { className: 'sr-shelf-select-links' },
                  h('button', {
                    type: 'button',
                    className: 'sr-link-btn sr-select-all',
                    onClick: function selectAll() {
                      lastSelectedRef.current = null;
                      setSelected(Array.from(new Set(selected.concat(visibleIds))));
                    },
                  }, t('selectAll')),
                  h('button', {
                    type: 'button',
                    className: 'sr-link-btn sr-select-invert',
                    disabled: !visibleIds.length,
                    onClick: function invert() {
                      lastSelectedRef.current = null;
                      setSelected(invertSelectionKeys(visibleIds, selected));
                    },
                  }, t('invertSelection')),
                  h('button', {
                    type: 'button',
                    className: 'sr-link-btn sr-select-clear',
                    disabled: !selected.length,
                    onClick: function clear() {
                      lastSelectedRef.current = null;
                      setSelected([]);
                    },
                  }, t('clearSelection')),
                ),
              ),
              h('div', { className: 'sr-batch-divider', 'aria-hidden': 'true' }),
              h('div', { className: 'sr-shelf-select-actions' },
                h('button', {
                  type: 'button',
                  className: 'sr-bulk-action',
                  disabled: !selectedVisible.length,
                  'data-active': selectedAllFinished ? 'true' : 'false',
                  'aria-label': selectedAllFinished ? t('markReading') : t('markFinished'),
                  onClick: function toggleFinished() {
                    if (typeof props.onSetFinished !== 'function') return;
                    props.onSetFinished(selectedVisible, !selectedAllFinished);
                  },
                }, h(Icon, { name: selectedAllFinished ? 'book-open' : 'check', size: 13 }),
                  h('span', null, selectedAllFinished ? t('markReading') : t('markFinished'))),
                h('button', {
                  type: 'button',
                  className: 'sr-bulk-action',
                  disabled: !selectedVisible.length,
                  'data-active': selectedAllShelved ? 'true' : 'false',
                  'aria-label': selectedAllShelved ? t('unshelveBook') : t('shelveBook'),
                  onClick: function toggleBulkShelved() {
                    if (typeof props.onSetShelved !== 'function') return;
                    props.onSetShelved(selectedVisible, !selectedAllShelved);
                  },
                }, h(Icon, { name: 'pause', size: 13 }),
                  h('span', null, selectedAllShelved ? t('unshelveBook') : t('shelveBook'))),
                h('button', {
                  type: 'button',
                  className: 'sr-bulk-action',
                  'aria-expanded': bulkTagOpen ? 'true' : 'false',
                  'aria-label': t('bulkTag'),
                  'data-active': bulkTagOpen ? 'true' : 'false',
                  disabled: !selectedVisible.length,
                  onClick: function toggleTagRow() {
                    setBulkTagOpen(!bulkTagOpen);
                    setBulkTagDraft('');
                    setBulkMenuOpen(false);
                    setDeleteConfirm(false);
                  },
                }, h(Icon, { name: 'tag', size: 13 }), h('span', null, t('bulkTag'))),
                h('button', {
                  type: 'button',
                  className: 'sr-bulk-more',
                  'aria-haspopup': 'menu',
                  'aria-expanded': bulkMenuOpen ? 'true' : 'false',
                  'aria-label': t('moreActions'),
                  disabled: !selectedVisible.length,
                  onClick: function toggleMenu() {
                    setBulkMenuOpen(!bulkMenuOpen);
                    setBulkTagOpen(false);
                    setDeleteConfirm(false);
                  },
                }, h(Icon, { name: 'more', size: 14 }), h('span', null, t('moreActions'))),
              ),
              h('div', { className: 'sr-batch-divider', 'aria-hidden': 'true' }),
              h('button', {
                type: 'button',
                className: 'sr-bulk-done',
                onClick: exitSelect,
              }, h(Icon, { name: 'check', size: 13 }), h('span', null, t('done'))),
            ),
          ) : null,
          query && (contentResults.length || searchingContent || ordered.length) ? h('div', { className: 'sr-content-results' },
            h('div', { className: 'sr-content-head' },
              h('span', null, t('searchInContent')),
              h('span', { 'aria-live': 'polite' }, searchingContent ? t('searchingContent') : fill(t('searchResultCount'), { n: contentResults.length })),
            ),
            contentResults.length
              ? contentResults.map(function result(item) {
                return h('button', {
                  key: item.bookId + '-' + item.chapterId + '-' + item.start,
                  type: 'button',
                  className: 'sr-content-result',
                  onClick: function open() {
                    const percent = item.chapterLength ? clamp(item.start / item.chapterLength, 0, 1) : 0;
                    props.onJumpContent(item.bookId, item.chapterIndex, percent);
                  },
                },
                  h('div', { className: 'sr-content-result-body' },
                    h('div', { className: 'sr-content-result-head' },
                      h('strong', null, item.bookTitle),
                      h('span', null, item.chapterTitle),
                    ),
                    h('p', null, item.before, h('mark', null, item.match), item.after),
                  ),
                  h(Icon, { name: 'arrow-up-right', size: 13, style: { flex: 'none', opacity: .4 } }),
                );
              })
              : !searchingContent ? h('div', { className: 'sr-content-empty' }, t('searchNoResult')) : null,
          ) : null,
          ordered.length
            ? view === 'group'
              ? h('div', { ref: shelfGridRef, className: 'sr-status-groups' },
                statusGroups.map(function group(item) {
                  const groupExpanded = expandedGroups.indexOf(item.id) >= 0;
                  const groupSlice = groupExpanded ? item.books : item.books.slice(0, groupCap);
                  const groupHidden = item.books.length - groupSlice.length;
                  return h('section', { key: item.id, className: 'sr-status-group' },
                    h('div', { className: 'sr-status-head' },
                      h('h3', null, t(item.label)),
                      h('span', { className: 'sr-status-count' }, item.books.length),
                    ),
                    h('div', { className: 'sr-shelf-grid' },
                      groupSlice.map(function card(book) {
                        return h(BookCard, {
                          key: book.id,
                          book: book,
                          t: t,
                          progress: progress[book.id],
                          pinned: pins.indexOf(book.id) >= 0,
                          rating: Number(reviews[book.id] && reviews[book.id].rating) || 0,
                          selectMode: selectMode,
                          selected: selectedSet.has(book.id),
                          onSelect: toggleSelect,
                          onOpen: props.onOpenBook,
                          onContinue: props.onContinueBook,
                        });
                      }),
                    ),
                    groupHidden > 0 ? h('button', {
                      type: 'button',
                      className: 'sr-btn sr-btn-sm sr-status-more',
                      style: { marginTop: 12 },
                      onClick: function expand() {
                        setExpandedGroups(function add(previous) {
                          return previous.indexOf(item.id) >= 0 ? previous : previous.concat(item.id);
                        });
                      },
                    }, fill(t('groupShowAll'), { n: item.books.length })) : null,
                  );
                }),
              )
              : view === 'list'
              ? h('div', {
                ref: shelfGridRef,
                className: 'sr-book-list',
                style: {
                  paddingTop: virtualWindow.padTop ? virtualWindow.padTop + 'px' : undefined,
                  paddingBottom: virtualWindow.padBottom ? virtualWindow.padBottom + 'px' : undefined,
                },
              },
                ordered.slice(virtualWindow.start, virtualWindow.end).map(function row(book) {
                  return h(BookListRow, {
                    key: book.id,
                    book: book,
                    t: t,
                    progress: progress[book.id],
                    pinned: pins.indexOf(book.id) >= 0,
                    rating: Number(reviews[book.id] && reviews[book.id].rating) || 0,
                    selectMode: selectMode,
                    selected: selectedSet.has(book.id),
                    onSelect: toggleSelect,
                    onOpen: props.onOpenBook,
                    onContinue: props.onContinueBook,
                  });
                }),
                virtualWindow.showImport ? h('button', { type: 'button', className: 'sr-book-row sr-book-row-import', onClick: props.onImport },
                  h('span', { className: 'sr-book-import-icon' }, h(Icon, { name: 'upload', size: 16 })),
                  h('div', { className: 'sr-book-row-main' },
                    h('div', { className: 'sr-book-row-title' }, h('span', null, t('importCardTitle'))),
                    h('div', { className: 'sr-book-row-meta' }, t('dropBookHint')),
                  ),
                  h(Icon, { name: 'arrow-up-right', size: 13, style: { opacity: .4 } }),
                ) : null,
              )
              : h('div', {
                ref: shelfGridRef,
                className: 'sr-shelf-grid',
                style: {
                  paddingTop: virtualWindow.padTop ? virtualWindow.padTop + 'px' : undefined,
                  paddingBottom: virtualWindow.padBottom ? virtualWindow.padBottom + 'px' : undefined,
                },
              },
                ordered.slice(virtualWindow.start, virtualWindow.end).map(function card(book) {
                  return h(BookCard, {
                    key: book.id,
                    book: book,
                    t: t,
                    progress: progress[book.id],
                    pinned: pins.indexOf(book.id) >= 0,
                    rating: Number(reviews[book.id] && reviews[book.id].rating) || 0,
                    selectMode: selectMode,
                    selected: selectedSet.has(book.id),
                    onSelect: toggleSelect,
                    onOpen: props.onOpenBook,
                    onContinue: props.onContinueBook,
                  });
                }),
                virtualWindow.showImport ? h(ImportCard, { key: '__import__', t: t, onImport: props.onImport }) : null,
              )
            : query && (contentResults.length || searchingContent)
              ? null
              : h(EmptyState, {
                title: query
                  ? t('noSearchTitle')
                  : libraryEmpty
                    ? t('emptyShelfTitle')
                    : liveTagFilters.length
                      ? t('tagFilterEmpty')
                      : t('filterEmpty'),
                text: query
                  ? t('noSearchText')
                  : libraryEmpty
                    ? t('emptyShelfText')
                    : liveTagFilters.length
                      ? fill(t('tagFilterEmptyHint'), { tags: liveTagFilters.map(function hash(tag) { return '#' + tag; }).join(' ') })
                      : t('filterEmptyHint'),
                action: query
                  ? function clear() { props.onClearSearch(); }
                  : libraryEmpty
                    ? null
                    : liveTagFilters.length
                      ? function clearTags() { setTagFilters([]); }
                      : filter !== 'all'
                        ? function showAll() { setFilter('all'); }
                        : null,
                actionLabel: query
                  ? t('clearSearch')
                  : libraryEmpty
                    ? null
                    : liveTagFilters.length
                      ? t('searchClear')
                      : filter !== 'all'
                        ? t('showAllBooks')
                        : null,
              }),
          h('div', { className: 'sr-shelf-footer' },
            h('span', null, t('savedLocally')),
            h('div', { className: 'sr-shelf-footer-actions' },
              books.length ? h('button', { type: 'button', className: 'sr-text-btn', onClick: function exp() { exportBooklist(); } },
                h(Icon, { name: 'list', size: 11 }),
                h('span', null, t('exportBooklist')),
              ) : null,
              books.length ? h('button', { type: 'button', className: 'sr-text-btn', onClick: function cp() { copyBooklist(); } },
                h(Icon, { name: 'copy', size: 11 }),
                h('span', null, t('copyBooklist')),
              ) : null,
              h('button', { type: 'button', className: 'sr-text-btn', onClick: props.onExportBackup },
                h(Icon, { name: 'download', size: 11 }),
                h('span', null, t('exportBackup')),
              ),
              h('button', { type: 'button', className: 'sr-text-btn', onClick: props.onRestoreBackup },
                h(Icon, { name: 'upload', size: 11 }),
                h('span', null, t('restoreBackup')),
              ),
              props.fsSupported ? h('button', {
                type: 'button',
                className: 'sr-text-btn',
                title: t('fsLibraryHint'),
                onClick: props.onPickLibraryDir,
              },
                h(Icon, { name: 'download', size: 11 }),
                h('span', null, props.fsLibrary && props.fsLibrary.name
                  ? fill(t('fsLibraryActive'), { name: props.fsLibrary.name })
                  : t('fsLibraryPick')),
              ) : null,
              props.fsSupported && props.fsLibrary && props.onCleanOrphans ? h('button', {
                type: 'button',
                className: 'sr-text-btn',
                title: t('paletteHintCleanup'),
                onClick: props.onCleanOrphans,
              },
                h(Icon, { name: 'trash', size: 11 }),
                h('span', null, t('fsCleanupOrphans')),
              ) : null,
            ),
          ),
        ),
        cardQuote ? h(QuoteCardDialog, {
          t: t,
          text: cardQuote.text,
          note: '',
          bookTitle: cardQuote.bookTitle,
          chapterTitle: cardQuote.chapterTitle,
          showToast: props.showToast,
          onClose: function close() { setCardQuote(null); },
        }) : null,
        tagManagerOpen ? h(TagManagerDialog, {
          t: t,
          tags: userTagList,
          counts: tagCounts,
          title: t('bookTagManager'),
          hint: t('bookTagManagerHint'),
          empty: t('bookTagsEmpty'),
          onRename: handleTagRename,
          onDelete: handleTagDelete,
          onClose: function close() { setTagManagerOpen(false); },
        }) : null,
      );
    }

    function StatsView(props) {
      const t = props.t;
      const [pendingReset, setPendingReset] = useState(null);
      const [heatShift, setHeatShift] = useState(0);
      const [selectedHeatDay, setSelectedHeatDay] = useState(null);
      const [monthCardOpen, setMonthCardOpen] = useState(false);
      const days = props.state.stats.days || {};
      const weekly = weekSeries(days);
      const weekDelta = weekComparison(days);
      const weekDeltaTone = weekDelta.previous > 0 ? weekDelta.direction : 'none';
      const weeklySeconds = weekly.reduce(function sum(total, day) { return total + day.seconds; }, 0);
      const totalSeconds = totalReadingSeconds(days);
      const streak = readingStreak(days);
      const todaySeconds = Number(days[dayKey()]) || 0;
      const finished = props.books.filter(function done(book) {
        const item = props.state.progress[book.id];
        return item && item.completed;
      }).length;
      const started = props.books.filter(function startedBook(book) { return Boolean(props.state.progress[book.id]); });
      const goalMinutes = clamp(Number(props.state.stats.goalMinutes) || DEFAULT_WEEKLY_GOAL_MINUTES, 30, 1440);
      const goalSeconds = goalMinutes * 60;
      const goalRatio = clamp(weeklySeconds / goalSeconds, 0, 1);
      const todayGoal = todayGoalProgress(days, goalMinutes);
      const todayGoalRemain = Math.max(0, Math.ceil((todayGoal.targetSeconds - todayGoal.seconds) / 60));
      const maxSeconds = Math.max(1800, weekly.reduce(function max(value, day) { return Math.max(value, day.seconds); }, 0));
      const recent = started.slice().sort(function order(a, b) {
        return (props.state.progress[b.id].updatedAt || 0) - (props.state.progress[a.id].updatedAt || 0);
      }).slice(0, 4);
      const goalRemain = Math.max(0, Math.ceil((goalSeconds - weeklySeconds) / 60));
      const heatDays = recentDays(days, 30, heatShift);
      const rhythm = weekdayTotals(days);
      const rhythmMax = Math.max(1, Math.max.apply(null, rhythm));
      const rhythmPeak = peakWeekday(rhythm);
      const heatTotal = heatDays.reduce(function sum(total, day) { return total + day.seconds; }, 0);
      const heatOffset = heatDays.length ? heatDays[0].weekday : 0;
      const weekdayKeys = ['dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat', 'daySun'];
      const achievements = computeAchievements({ totalSeconds: totalSeconds, streak: streak, finished: finished, highlightCount: props.highlights.length });
      const unlockedAchievements = achievements.filter(function unlocked(item) { return item.unlocked; }).length;
      const ranking = bookReadingRanking(props.books, props.state.stats.byBook || {}, 5);
      const rankingMax = ranking.length ? ranking[0].seconds : 1;
      const tastes = tagReadingTotals(props.books, props.state.stats.byBook || {}, props.state.userTags || {}, 6);
      const tastesMax = tastes.length ? tastes[0].seconds : 1;
      const sessions = (props.state.sessions || []).slice(0, 6);
      const monthSummary = monthlySummary({
        days: days,
        sessions: props.state.sessions,
        highlights: props.highlights,
        books: props.books,
        month: monthKeyOf(Date.now()),
      });
      const timeOfDay = readingTimeOfDay(props.state.sessions);
      const timeOfDayLabels = { dawn: 'todDawn', morning: 'todMorning', afternoon: 'todAfternoon', evening: 'todEvening' };
      const timeOfDayPeakLabel = timeOfDay.peak ? t(timeOfDayLabels[timeOfDay.peak]) : '';

      function exportReport() {
        const markdown = readingReportMarkdown(props.state, props.books, t);
        if (downloadTextFile('shiguang-reading-report-' + dayKey() + '.md', markdown, 'text/markdown;charset=utf-8')) {
          props.showToast(t('reportExported'));
        }
      }

      function statCard(icon, value, unit, label) {
        return h('div', { className: 'sr-stat-card' },
          h('div', { className: 'sr-stat-icon' }, h(Icon, { name: icon, size: 15 })),
          h('div', { className: 'sr-stat-value' }, value, unit ? h('small', null, unit) : null),
          h('div', { className: 'sr-stat-label' }, label),
        );
      }

      return h('div', null,
        h('div', { className: 'sr-page-head' },
          h('div', null,
            h('h1', null, t('statsTitle')),
            h('p', null, t('statsSubtitle')),
          ),
          h('div', { className: 'sr-page-head-actions' },
            h('button', {
              type: 'button',
              className: 'sr-btn sr-btn-sm',
              onClick: function openMonthCard() { setMonthCardOpen(true); },
              title: t('monthCardTitle'),
            },
              h(Icon, { name: 'sparkle', size: 12 }),
              h('span', null, t('monthCardOpen')),
            ),
            h('button', { type: 'button', className: 'sr-btn sr-btn-sm', onClick: exportReport },
              h(Icon, { name: 'download', size: 12 }),
              h('span', null, t('exportReport')),
            ),
            h('div', { className: 'sr-page-head-stat' },
              h('strong', null, formatDuration(todaySeconds, t).replace(/\s/g, '')),
              h('span', null, t('todayReading')),
            ),
          ),
        ),
        h('div', { className: 'sr-stat-grid' },
          statCard('clock', formatDuration(totalSeconds, t).replace(/\s/g, ''), null, t('totalRead')),
          statCard('flame', streak, t('streakValue', { n: '' }).replace(/\s/g, ''), t('streakDays')),
          statCard('book-open', finished, null, t('booksFinished')),
          statCard('feather', props.highlights.length, null, t('notesKept')),
        ),
        h('div', { className: 'sr-chart-grid' },
          h('div', { className: 'sr-panel' },
            h('div', { className: 'sr-panel-head' },
              h('div', null,
                h('h2', null, t('weekChart')),
                h('p', null, t('weeklyTotal') + ' · ' + formatDuration(weeklySeconds, t), ' · ',
                  h('span', { className: 'sr-week-delta', 'data-direction': weekDeltaTone }, weekDeltaLabel(weekDelta, t)),
                ),
              ),
              h('div', { className: 'sr-panel-total' },
                h('strong', null, Math.round(weeklySeconds / 60)),
                h('span', null, t('minutes', { n: '' }).replace(/\s/g, '')),
              ),
            ),
            h('div', { className: 'sr-bars' },
              weekly.map(function bar(day) {
                const height = day.seconds > 0 ? Math.max(4, (day.seconds / maxSeconds) * 100) : 2;
                return h('div', { key: day.key, className: 'sr-bar-col', 'data-today': day.today ? 'true' : 'false' },
                  h('div', { className: 'sr-bar-value' }, day.seconds > 0 ? Math.round(day.seconds / 60) : ''),
                  h('div', { className: 'sr-bar-slot' },
                    h('div', { className: 'sr-bar', style: { height: height + '%' } }),
                  ),
                  h('span', { className: 'sr-bar-label' }, t(day.label)),
                );
              }),
            ),
          ),
          h('div', { className: 'sr-panel sr-goal-panel' },
            h('div', { className: 'sr-goal-panel-top' },
              h('div', { className: 'sr-goal-panel-ring' },
                h(Ring, { value: goalRatio }),
                h('span', { className: 'sr-ring-label' }, Math.round(goalRatio * 100) + '%'),
              ),
              h('div', { className: 'sr-goal-panel-text' },
                h('small', null, goalRatio >= 1 ? t('goalDone') : t('goalTodo')),
                h('strong', null, formatDuration(weeklySeconds, t)),
                h('p', null, goalRatio >= 1 ? t('goalReached') : fill(t('goalHint'), { n: goalRemain })),
              ),
            ),
            h('div', { className: 'sr-goal-daily', title: t('goalSplitHint') },
              h('div', { className: 'sr-goal-daily-head' },
                h('div', { className: 'sr-goal-daily-title-wrap' },
                  h('span', null, t('todayGoal')),
                  todayGoal.done ? h('span', { className: 'sr-goal-badge-done' }, t('todayGoalAchievedBadge')) : null,
                ),
                h('strong', null, formatDuration(todayGoal.seconds, t).replace(/\s/g, '') + ' / ' + formatDuration(todayGoal.targetSeconds, t).replace(/\s/g, '')),
              ),
              h('span', { className: 'sr-goal-daily-track' },
                h('span', {
                  className: 'sr-goal-daily-fill',
                  'data-done': todayGoal.done ? 'true' : 'false',
                  style: { width: Math.round(todayGoal.ratio * 100) + '%' },
                }),
              ),
              h('small', { className: 'sr-goal-daily-note' }, todayGoal.done ? t('todayGoalDone') : fill(t('goalDailyRemain'), { n: todayGoalRemain })),
            ),
            h('div', { className: 'sr-goal-adjust' },
              h('span', null, t('adjustGoal')),
              h('div', { className: 'sr-goal-stepper-wrap' },
                h('div', { className: 'sr-goal-stepper' },
                  h('button', {
                    type: 'button',
                    'aria-label': t('decreaseGoal'),
                    disabled: goalMinutes <= 30,
                    onClick: function decrease() { props.onUpdateGoal(goalMinutes - 15); },
                  }, h(Icon, { name: 'minus', size: 12 })),
                  h('span', null, formatDuration(goalSeconds, t)),
                  h('button', {
                    type: 'button',
                    'aria-label': t('increaseGoal'),
                    disabled: goalMinutes >= 1440,
                    onClick: function increase() { props.onUpdateGoal(goalMinutes + 15); },
                  }, h(Icon, { name: 'plus', size: 12 })),
                ),
                h('small', { className: 'sr-goal-daily-avg' }, fill(t('goalDailyAvgHint'), { n: Math.max(1, Math.round(goalMinutes / 7)) })),
              ),
            ),
            h('div', { className: 'sr-goal-panel-note' }, t('quote'), h('span', { style: { display: 'block', marginTop: 5, fontSize: '9px', letterSpacing: '.03em' } }, t('quoteBy'))),
          ),
        ),
        h('div', { className: 'sr-panel sr-heatmap-panel' },
          h('div', { className: 'sr-panel-head' },
            h('div', null,
              h('h2', null, t('heatmapTitle')),
              h('p', null, fill(t('heatmapSubtitle'), { time: formatDuration(heatTotal, t) })),
            ),
            h('span', { className: 'sr-count-chip' }, t('todayReading') + ' ' + formatDuration(todaySeconds, t)),
          ),
          h('div', { className: 'sr-heatmap-period' },
            h('button', { type: 'button', className: 'sr-heat-nav', onClick: function older() { setHeatShift(heatShift + 30); setSelectedHeatDay(null); }, title: t('previousPeriod'), 'aria-label': t('previousPeriod') },
              h(Icon, { name: 'chevron-left', size: 12 }),
            ),
            h('span', null, dateLabel(heatDays[0].date) + ' — ' + dateLabel(heatDays[heatDays.length - 1].date)),
            h('button', { type: 'button', className: 'sr-heat-nav', disabled: heatShift === 0, onClick: function newer() { setHeatShift(Math.max(0, heatShift - 30)); setSelectedHeatDay(null); }, title: t('nextPeriod'), 'aria-label': t('nextPeriod') },
              h(Icon, { name: 'chevron-right', size: 12 }),
            ),
          ),
          h('div', { className: 'sr-heatmap-weekdays' },
            weekdayKeys.map(function weekday(key) { return h('span', { key: key }, t(key)); }),
          ),
          h('div', { className: 'sr-heatmap-grid' },
            Array.from({ length: heatOffset }).map(function blank(_, index) {
              return h('span', { key: 'blank-' + index, className: 'sr-heat-blank' });
            }),
            heatDays.map(function cell(day) {
              return h('button', {
                key: day.key,
                type: 'button',
                className: 'sr-heat-cell',
                'data-level': heatLevel(day.seconds),
                'data-today': day.today ? 'true' : 'false',
                'data-selected': selectedHeatDay && selectedHeatDay.key === day.key ? 'true' : 'false',
                'aria-pressed': selectedHeatDay && selectedHeatDay.key === day.key,
                title: dateLabel(day.date) + ' · ' + formatDuration(day.seconds, t),
                onClick: function select() { setSelectedHeatDay(selectedHeatDay && selectedHeatDay.key === day.key ? null : day); },
              }, h('span', null, day.day));
            }),
          ),
          h('div', { className: 'sr-heatmap-legend' },
            h('span', null, t('heatmapLess')),
            [0, 1, 2, 3, 4].map(function level(index) {
              return h('span', { key: index, className: 'sr-heat-legend-swatch', 'data-level': index });
            }),
            h('span', null, t('heatmapMore')),
          ),
          selectedHeatDay ? h('div', { className: 'sr-heat-detail' },
            h('div', { className: 'sr-heat-detail-head' },
              h('div', null,
                h('strong', null, dateLabel(selectedHeatDay.date)),
                h('span', null, formatDuration(selectedHeatDay.seconds, t)),
              ),
              h('button', { type: 'button', className: 'sr-icon-btn', onClick: function close() { setSelectedHeatDay(null); }, title: t('close'), 'aria-label': t('close') },
                h(Icon, { name: 'close', size: 13 }),
              ),
            ),
            (function daySessions() {
              const rows = sessionsOnDay(props.state.sessions, selectedHeatDay.key);
              if (!rows.length) return h('p', { className: 'sr-heat-detail-empty' }, t('noDaySessions'));
              return h('div', { className: 'sr-heat-detail-list' }, rows.map(function row(item) {
                const book = props.books.find(function find(bookItem) { return bookItem.id === item.bookId; });
                const chapter = book && Array.isArray(book.chapters) ? book.chapters[item.chapterIndex] : null;
                return h('button', { key: item.id, type: 'button', className: 'sr-heat-detail-row', onClick: function open() { if (book) props.onOpen(book); } },
                  h('span', { className: 'sr-heat-detail-dot' }, h(Icon, { name: 'clock', size: 10 })),
                  h('span', { className: 'sr-heat-detail-book' }, (book ? book.title : '') + (chapter ? ' · ' + chapter.title : '')),
                  h('span', { className: 'sr-heat-detail-time' }, formatDuration(item.seconds, t)),
                );
              }));
            })(),
          ) : null,
        ),
        h('div', { className: 'sr-panel sr-rhythm-panel' },
          h('div', { className: 'sr-panel-head' },
            h('div', null,
              h('h2', null, t('weekdayRhythm')),
              h('p', null, t('weekdayRhythmSubtitle')),
            ),
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
              rhythmPeak ? h('span', { className: 'sr-count-chip sr-rhythm-peak-chip' }, fill(t('mostActiveWeekdayHint'), { day: t(weekdayKeys[rhythmPeak.index]), pct: Math.round(rhythmPeak.ratio * 100) })) : null,
              h('span', { className: 'sr-count-chip' }, formatDuration(rhythm.reduce(function sum(total, item) { return total + item; }, 0), t)),
            ),
          ),
          h('div', { className: 'sr-rhythm-bars' },
            rhythm.map(function bar(seconds, index) {
              const isPeak = rhythmPeak && rhythmPeak.index === index && seconds > 0;
              const height = seconds > 0 ? Math.max(5, (seconds / rhythmMax) * 100) : 2;
              return h('div', { key: index, className: 'sr-rhythm-col' + (isPeak ? ' is-peak' : '') },
                h('span', { className: 'sr-rhythm-value' }, seconds > 0 ? Math.round(seconds / 60) : ''),
                h('div', { className: 'sr-rhythm-slot' }, h('div', { className: 'sr-rhythm-bar', style: { height: height + '%' } })),
                h('span', { className: 'sr-rhythm-label' }, t(weekdayKeys[index])),
              );
            }),
          ),
        ),
        h('div', { className: 'sr-panel sr-tod-panel' },
          h('div', { className: 'sr-panel-head' },
            h('div', null,
              h('h2', null, t('timeOfDayTitle')),
              h('p', null, t('timeOfDaySubtitle')),
            ),
            timeOfDay.total
              ? h('span', { className: 'sr-count-chip' }, fill(t('timeOfDayPeak'), { label: timeOfDayPeakLabel }))
              : h('span', { className: 'sr-count-chip' }, formatDuration(0, t)),
          ),
          timeOfDay.total
            ? h('div', { className: 'sr-tod-rows' },
              timeOfDay.buckets.map(function row(item) {
                const percent = Math.round(item.ratio * 100);
                return h('div', {
                  key: item.id,
                  className: 'sr-tod-row',
                  'data-peak': item.id === timeOfDay.peak ? 'true' : 'false',
                },
                  h('span', { className: 'sr-tod-label' }, t(timeOfDayLabels[item.id])),
                  h('div', { className: 'sr-tod-track' },
                    h('div', { className: 'sr-tod-fill', style: { width: percent > 0 ? Math.max(3, percent) + '%' : '0%' } }),
                  ),
                  h('span', { className: 'sr-tod-time' }, formatDuration(item.seconds, t)),
                  h('span', { className: 'sr-tod-pct' }, percent + '%'),
                );
              }),
            )
            : h('p', { className: 'sr-tod-empty' }, t('timeOfDayEmpty')),
        ),
        h('div', { className: 'sr-panel sr-achievements-panel' },
          h('div', { className: 'sr-panel-head' },
            h('div', null,
              h('h2', null, t('achievementsTitle')),
              h('p', null, t('achievementsSubtitle')),
            ),
            h('span', { className: 'sr-count-chip' }, unlockedAchievements + ' / ' + achievements.length),
          ),
          h('div', { className: 'sr-achievements-grid' },
            achievements.map(function card(item) {
              return h('div', { key: item.id, className: 'sr-achievement', 'data-unlocked': item.unlocked ? 'true' : 'false' },
                h('div', { className: 'sr-achievement-icon' }, h(Icon, { name: item.icon, size: 15 })),
                h('div', { className: 'sr-achievement-copy' },
                  h('strong', null, t(item.nameKey)),
                  h('span', null, t(item.descKey)),
                ),
                h('span', { className: 'sr-achievement-state' }, item.unlocked ? t('achievementUnlocked') : Math.round(item.progress * 100) + '%'),
                h('div', { className: 'sr-achievement-progress' },
                  h('span', { className: 'sr-achievement-track' }, h('span', { className: 'sr-achievement-fill', style: { width: Math.round(item.progress * 100) + '%' } })),
                ),
              );
            }),
          ),
        ),
        h('div', { className: 'sr-panel' },
          h('div', { className: 'sr-panel-head' },
            h('div', null,
              h('h2', null, t('readingRanking')),
              h('p', null, t('readingRankingSubtitle')),
            ),
          ),
          ranking.length
            ? h('div', { className: 'sr-ranking-list' },
              ranking.map(function rank(item, index) {
                return h('button', { key: item.book.id, type: 'button', className: 'sr-ranking-row', onClick: function open() { props.onOpen(item.book); } },
                  h('span', { className: 'sr-ranking-index' }, String(index + 1).padStart(2, '0')),
                  h(Cover, { book: item.book, t: t, size: 'sm', showBadge: false }),
                  h('div', { className: 'sr-ranking-main' },
                    h('strong', null, item.book.title),
                    h('span', { className: 'sr-ranking-bar' }, h('span', { style: { width: Math.max(4, Math.round((item.seconds / rankingMax) * 100)) + '%' } })),
                  ),
                  h('span', { className: 'sr-ranking-time' }, formatDuration(item.seconds, t)),
                );
              }),
            )
            : h('div', { className: 'sr-ranking-empty' }, t('noReadingRanking')),
        ),
        h('div', { className: 'sr-panel' },
          h('div', { className: 'sr-panel-head' },
            h('div', null,
              h('h2', null, t('readingTastes')),
              h('p', null, t('readingTastesSubtitle')),
            ),
            h('span', { className: 'sr-count-chip' }, t('tagsLabel') + ' ' + tastes.length),
          ),
          tastes.length ? h('div', { className: 'sr-taste-list' },
            tastes.map(function row(item) {
              return h('div', { key: item.tag, className: 'sr-taste-row' },
                h('span', { className: 'sr-taste-name' }, item.tag),
                h('div', { className: 'sr-taste-bar' }, h('span', { style: { width: Math.max(4, Math.round((item.seconds / tastesMax) * 100)) + '%' } })),
                h('span', { className: 'sr-taste-time' }, formatDuration(item.seconds, t)),
              );
            }),
          ) : h('div', { className: 'sr-ranking-empty' }, t('noReadingTastes')),
        ),
        h('div', { className: 'sr-panel' },
          h('div', { className: 'sr-panel-head' },
            h('div', null,
              h('h2', null, t('recentReading')),
              h('p', null, t('statsEmptyHint')),
            ),
            h('span', { className: 'sr-count-chip' }, t('bookCount', { n: started.length })),
          ),
          recent.length ? h('div', { className: 'sr-recent-list' },
            recent.map(function row(book) {
              const pct = progressPercent(book, props.state.progress[book.id]);
              return h('button', { key: book.id, type: 'button', className: 'sr-recent-row', onClick: function open() { props.onOpen(book); } },
                h(Cover, { book: book, t: t, size: 'sm', showBadge: false }),
                h('div', { className: 'sr-recent-meta' },
                  h('strong', null, book.title),
                  h('span', null, book.author + ' · ' + (props.state.progress[book.id].completed ? t('finished') : t('overallProgress', { n: pct }))),
                ),
                h('div', { className: 'sr-recent-bar' },
                  h('div', { className: 'sr-recent-track' }, h('div', { className: 'sr-recent-fill', style: { width: pct + '%' } })),
                  h('div', { className: 'sr-recent-pct' }, pct + '%'),
                ),
              );
            }),
          ) : h('div', { style: { padding: '22px 0 13px', textAlign: 'center', color: 'var(--dsw-alias-label-secondary)', fontSize: '11px' } }, t('noRecent')),
        ),
        h('div', { className: 'sr-panel' },
          h('div', { className: 'sr-panel-head' },
            h('div', null,
              h('h2', null, t('readingSessions')),
              h('p', null, t('readingSessionsSubtitle')),
            ),
            h('span', { className: 'sr-count-chip' }, fill(t('sessionCount'), { n: (props.state.sessions || []).length })),
          ),
          sessions.length
            ? h('div', { className: 'sr-session-list' },
              sessions.map(function row(session) {
                const sessionBook = props.books.find(function find(book) { return book.id === session.bookId; });
                if (!sessionBook) return null;
                const chapter = Array.isArray(sessionBook.chapters) ? sessionBook.chapters[session.chapterIndex] : null;
                return h('button', { key: session.id, type: 'button', className: 'sr-session-row', onClick: function open() { props.onOpen(sessionBook); } },
                  h('span', { className: 'sr-session-dot' }, h(Icon, { name: 'clock', size: 11 })),
                  h('div', { className: 'sr-session-main' },
                    h('strong', null, sessionBook.title),
                    h('span', null, (chapter ? chapter.title + ' · ' : '') + dateLabel(session.endedAt) + ' ' + new Date(session.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
                  ),
                  h('span', { className: 'sr-session-time' }, formatDuration(session.seconds, t)),
                );
              }),
            )
            : h('div', { className: 'sr-ranking-empty' }, t('noSessions')),
        ),
        h('div', { className: 'sr-panel sr-data-panel' },
          h('div', { className: 'sr-panel-head' },
            h('div', null,
              h('h2', null, t('dataManagement')),
              h('p', null, t('dataManagementHint')),
            ),
            h('button', { type: 'button', className: 'sr-text-btn', onClick: props.onExportBackup },
              h(Icon, { name: 'download', size: 11 }),
              h('span', null, t('exportBackup')),
            ),
          ),
          h('div', { className: 'sr-data-actions' },
            h('button', { type: 'button', className: 'sr-btn sr-btn-sm', onClick: function ask() { setPendingReset('stats'); } }, t('clearStats')),
            h('button', { type: 'button', className: 'sr-btn sr-btn-sm', onClick: function ask() { setPendingReset('annotations'); } }, t('clearAnnotations')),
            h('button', { type: 'button', className: 'sr-btn sr-btn-sm sr-btn-danger', onClick: function ask() { setPendingReset('all'); } }, t('resetAllData')),
          ),
          pendingReset ? h('div', { className: 'sr-data-confirm' },
            h('p', null, pendingReset === 'stats' ? t('confirmClearStats') : pendingReset === 'annotations' ? t('confirmClearAnnotations') : t('confirmResetAll')),
            h('div', { className: 'sr-data-confirm-actions' },
              h('button', { type: 'button', className: 'sr-btn sr-btn-sm', onClick: function cancel() { setPendingReset(null); } }, t('cancel')),
              h('button', {
                type: 'button',
                className: 'sr-btn sr-btn-sm sr-btn-danger',
                onClick: function confirm() {
                  if (pendingReset === 'stats') props.onClearStats();
                  else if (pendingReset === 'annotations') props.onClearAnnotations();
                  else props.onResetAll();
                  setPendingReset(null);
                },
              }, t('confirm')),
            ),
          ) : null,
        ),
        monthCardOpen ? h(MonthlyCardDialog, {
          t: t,
          summary: monthSummary,
          onClose: function close() { setMonthCardOpen(false); },
          showToast: props.showToast,
        }) : null,
      );
    }

    function BookDetail(props) {
      const t = props.t;
      const book = props.book;
      const progress = props.progress;
      const chapters = Array.isArray(book && book.chapters) ? book.chapters : [];
      const totalChapters = Math.max(1, (book && book.chapterCount) || (book && book.chapterIds && book.chapterIds.length) || chapters.length || 1);
      const pct = progressPercent(book, progress);
      const currentIndex = progress ? clamp(progress.chapterIndex || 0, 0, Math.max(0, chapters.length - 1)) : 0;
      const currentChapter = chapters[currentIndex] || null;
      const closeRef = useRef(null);
      const [confirmRemove, setConfirmRemove] = useState(false);
      const [editing, setEditing] = useState(false);
      const [draftTitle, setDraftTitle] = useState(book.title);
      const [draftAuthor, setDraftAuthor] = useState(book.author);
      const [tagDraft, setTagDraft] = useState('');
      const [chapterFilter, setChapterFilter] = useState('');
      const [draftRating, setDraftRating] = useState(props.review ? props.review.rating : 0);
      const [draftReview, setDraftReview] = useState(props.review ? props.review.text : '');
      const coverInputRef = useRef(null);
      const scrollRef = useRef(null);
      const introRef = useRef(null);
      const reviewRef = useRef(null);
      const notesRef = useRef(null);
      const chaptersRef = useRef(null);
      const completed = Boolean(progress && progress.completed);
      const isReading = Boolean(progress && !completed && (Number(progress.percent) > 0 || Number(progress.chapterIndex) > 0));
      const statusKey = completed ? 'finished' : (props.shelved ? 'shelfShelved' : (isReading ? 'shelfReading' : (props.wishlisted ? 'shelfWishlist' : 'unread')));
      const estimate = estimateFinish(book, progress, Number(props.readingSeconds) || 0, Number(props.dailyPaceSeconds) || 0);
      const marks = (progress && progress.chapterMarks) || {};
      const overview = chapterOverview(book, progress ? currentIndex : 0, props.notes || [], props.bookNotes || []);
      const readChaptersCount = completed
        ? totalChapters
        : (progress ? Math.min(totalChapters, currentIndex + (progress.percent >= 0.95 ? 1 : 0)) : 0);
      const savedReview = props.review || { rating: 0, text: '' };
      const reviewDirty = draftRating !== savedReview.rating || draftReview.trim() !== savedReview.text;

      useEffect(function resetRemove() {
        setConfirmRemove(false);
        setEditing(false);
        setChapterFilter('');
        setDraftTitle(book.title);
        setDraftAuthor(book.author);
        setTagDraft('');
        setDraftRating(props.review ? props.review.rating : 0);
        setDraftReview(props.review ? props.review.text : '');
      }, [book.id]);

      useEffect(function focusAndEscape() {
        const previous = document.activeElement;
        if (closeRef.current) closeRef.current.focus();
        function onKey(event) {
          if (event.key === 'Escape') {
            event.preventDefault();
            props.onClose();
          }
        }
        document.addEventListener('keydown', onKey, true);
        return function cleanup() {
          document.removeEventListener('keydown', onKey, true);
          if (previous && typeof previous.focus === 'function') {
            try { previous.focus(); } catch (error) { /* ignore */ }
          }
        };
      }, []);

      function handleCoverFile(event) {
        const file = event.target.files && event.target.files[0];
        if (event.target) event.target.value = '';
        if (!file) return;
        if (!/^image\/(png|jpeg|webp|gif)$/i.test(file.type)) {
          props.showToast(t('coverInvalid'));
          return;
        }
        if (file.size > 2 * 1024 * 1024) {
          props.showToast(t('coverTooLarge'));
          return;
        }
        const reader = new FileReader();
        reader.onload = async function loaded() {
          const result = String(reader.result || '');
          if (!/^data:image\/(?:jpeg|png|webp|gif);base64,/.test(result)) {
            props.showToast(t('coverInvalid'));
            return;
          }
          const optimized = await downscaleCoverDataUrl(result, 360, 504);
          props.onUpdateCover(book.id, optimized);
        };
        reader.onerror = function failed() { props.showToast(t('coverInvalid')); };
        reader.readAsDataURL(file);
      }

      function jumpToSection(targetRef) {
        const container = scrollRef.current;
        const target = targetRef && targetRef.current;
        if (!container || !target) return;
        const top = target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 10;
        if (typeof container.scrollTo === 'function') container.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        else container.scrollTop = Math.max(0, top);
      }

      function start() {
        if (completed) {
          props.onRead(book, 0, 0);
        } else if (progress) {
          props.onRead(book, progress.chapterIndex || 0, progress.percent || 0);
        } else {
          props.onRead(book, 0, 0);
        }
      }

      function exportBookMarkdown() {
        const markdown = bookFullMarkdown(book, {
          t: t,
          highlights: props.notes || [],
          bookmarks: props.bookNotes || [],
          review: props.review,
          progress: progress,
        });
        const ok = downloadTextFile(bookMarkdownFilename(book.title), markdown, 'text/markdown;charset=utf-8');
        props.showToast(ok ? t('bookExported') : t('exportFailed'));
      }

      function copyBookInfo() {
        const text = formatBookInfo(book);
        copyTextToClipboard(text).then(function done(ok) {
          props.showToast(ok ? t('bookInfoCopied') : t('copyFailed'));
        });
      }

      const readLabel = completed ? t('reread') : progress ? t('continueReading') : t('startReading');      const footInfo = completed
        ? t('bookFinishedNote')
        : progress && currentChapter
          ? t('lastRead') + ' · ' + currentChapter.title
          : t('startFromZero');

      return h('div', {
        className: 'sr-modal-backdrop',
        onMouseDown: function backdrop(event) { if (event.target === event.currentTarget) props.onClose(); },
      },
        h('div', {
          className: 'sr-detail',
          role: 'dialog',
          'aria-modal': 'true',
          'aria-labelledby': 'sr-detail-title',
        },
          h('div', { className: 'sr-detail-left' },
            h(Cover, { book: book, t: t, size: 'lg', progress: pct }),
            book.source === 'local' ? h('div', { className: 'sr-cover-actions' },
              h('button', { type: 'button', className: 'sr-text-btn', onClick: function pickCover() { if (coverInputRef.current) coverInputRef.current.click(); } },
                h(Icon, { name: 'image', size: 11 }),
                h('span', null, t('changeCover')),
              ),
              book.coverImage ? h('button', { type: 'button', className: 'sr-text-btn', onClick: function removeCover() { props.onUpdateCover(book.id, ''); } }, t('removeCover')) : null,
              h('input', {
                ref: coverInputRef,
                type: 'file',
                accept: 'image/png,image/jpeg,image/webp,image/gif',
                className: 'sr-hidden-input',
                tabIndex: -1,
                'aria-hidden': 'true',
                onChange: handleCoverFile,
              }),
            ) : null,
            h('div', { className: 'sr-detail-meta' },
              h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' } },
                h('span', { className: 'sr-detail-status-chip', 'data-status': statusKey }, statusKey === 'finished' ? t('finished') : t(statusKey)),
                h('span', { className: 'sr-detail-offline-chip', title: t('offlineReadyHint') },
                  h(Icon, { name: 'check', size: 9 }),
                  h('span', null, t('offlineReady')),
                ),
              ),
              h('strong', { id: 'sr-detail-title', title: book.title }, book.title),
              h('span', null, book.author),
              h('span', null, fill(t('bookMeta'), { chapters: totalChapters, minutes: estimateMinutes(book) })),
              h('span', { className: 'sr-detail-chars' },
                fill(t('bookWordCountMeta'), { count: formatWordCount(bookCharCount(book), t) }) +
                (totalChapters > 1 ? ' · ' + fill(t('bookAvgChapterWords'), { count: formatWordCount(Math.round(bookCharCount(book) / totalChapters), t) }) : '')
              ),
            ),
            h('div', { className: 'sr-detail-progress' },
              h('div', { className: 'sr-detail-progress-head' },
                h('span', null, t('bookProgress')),
                h('strong', null, pct + '%'),
              ),
              h('div', { className: 'sr-book-track' }, h('span', { className: 'sr-book-fill', style: { width: pct + '%' } })),
              estimate && !estimate.completed
                ? h('div', { className: 'sr-detail-estimate' },
                  h(Icon, { name: 'clock', size: 10 }),
                  h('span', { className: 'sr-detail-estimate-main' }, fill(t('estRemain'), { time: formatDuration(estimate.remainingSeconds, t) })),
                  estimate.daysLeft
                    ? h('span', { className: 'sr-detail-estimate-sub' }, fill(t('estDays'), { n: estimate.daysLeft }))
                    : null,
                )
                : null,
            ),
            h('button', {
              type: 'button',
              className: 'sr-text-btn sr-detail-finish',
              onClick: function toggleFinish() { props.onToggleFinished(book.id); },
            },
              h(Icon, { name: completed ? 'book-open' : 'check', size: 11 }),
              h('span', null, completed ? t('markReading') : t('markFinished')),
            ),
            (progress && !completed && (progress.chapterIndex > 0 || (progress.percent && progress.percent > 0.02)))
              ? h('button', {
                type: 'button',
                className: 'sr-text-btn sr-detail-restart',
                title: t('readFromBeginningHint'),
                onClick: function restart() { props.onRead(book, 0, 0); },
              },
                h(Icon, { name: 'refresh', size: 10 }),
                h('span', null, t('readFromBeginning')),
              )
              : null,
          ),
          h('div', { className: 'sr-detail-body' },
            h('div', { className: 'sr-detail-head' },
              h('span', { className: 'sr-detail-head-label' }, t('bookActions')),
              h('button', {
                type: 'button',
                className: 'sr-icon-btn',
                onClick: copyBookInfo,
                title: t('copyBookInfo'),
                'aria-label': t('copyBookInfo'),
              }, h(Icon, { name: 'copy', size: 15 })),
              h('button', {
                type: 'button',
                className: 'sr-icon-btn',
                onClick: exportBookMarkdown,
                title: t('exportBookFull'),
                'aria-label': t('exportBookFull'),
              }, h(Icon, { name: 'download', size: 15 })),
              h('button', {
                type: 'button',
                className: 'sr-icon-btn',
                'data-on': props.pinned ? 'true' : 'false',
                onClick: function togglePin() { props.onTogglePin(book.id); },
                title: props.pinned ? t('unpinBook') : t('pinBook'),
                'aria-label': props.pinned ? t('unpinBook') : t('pinBook'),
              }, h(Icon, { name: props.pinned ? 'pin-filled' : 'pin', size: 15 })),
              book.source === 'local' ? h('button', {
                type: 'button',
                className: 'sr-icon-btn',
                onClick: function editBook() {
                  setDraftTitle(book.title);
                  setDraftAuthor(book.author);
                  setEditing(true);
                  setConfirmRemove(false);
                },
                title: t('editBookInfo'),
                'aria-label': t('editBookInfo'),
              }, h(Icon, { name: 'pen', size: 14 })) : null,
              book.source === 'local' ? h('button', {
                type: 'button',
                className: 'sr-icon-btn',
                'data-danger': 'true',
                onClick: function askRemove() { setConfirmRemove(true); setEditing(false); },
                title: t('removeLocalBook'),
                'aria-label': t('removeLocalBook'),
              }, h(Icon, { name: 'trash', size: 15 })) : null,
              h('button', {
                type: 'button',
                className: 'sr-icon-btn',
                ref: closeRef,
                onClick: props.onClose,
                title: t('close'),
                'aria-label': t('close'),
              }, h(Icon, { name: 'close', size: 16 })),
            ),
            editing ? h('form', {
              className: 'sr-book-edit-form',
              onSubmit: function submit(event) {
                event.preventDefault();
                const nextTitle = draftTitle.trim();
                if (!nextTitle) return;
                props.onUpdateBook(book.id, { title: nextTitle, author: draftAuthor.trim() });
                setEditing(false);
              },
            },
              h('div', { className: 'sr-book-edit-fields' },
                h('label', null,
                  h('span', null, t('bookTitleLabel')),
                  h('input', {
                    type: 'text',
                    value: draftTitle,
                    maxLength: 100,
                    autoFocus: true,
                    onChange: function titleChange(event) { setDraftTitle(event.target.value); },
                  }),
                ),
                h('label', null,
                  h('span', null, t('bookAuthorLabel')),
                  h('input', {
                    type: 'text',
                    value: draftAuthor,
                    maxLength: 80,
                    onChange: function authorChange(event) { setDraftAuthor(event.target.value); },
                  }),
                ),
              ),
              h('div', { className: 'sr-book-edit-actions' },
                h('button', { type: 'button', className: 'sr-btn sr-btn-sm', onClick: function cancel() { setEditing(false); } }, t('cancel')),
                h('button', { type: 'submit', className: 'sr-btn sr-btn-sm sr-btn-primary', disabled: !draftTitle.trim() }, t('saveChanges')),
              ),
            ) : null,
            confirmRemove ? h('div', { className: 'sr-detail-remove-bar' },
              h('span', null, t('confirmRemoveBook')),
              h('div', { className: 'sr-detail-remove-actions' },
                h('button', { type: 'button', className: 'sr-btn sr-btn-sm', onClick: function cancel() { setConfirmRemove(false); } }, t('cancel')),
                h('button', { type: 'button', className: 'sr-btn sr-btn-sm sr-btn-danger', onClick: function remove() { props.onRemove(book); } }, t('confirmRemove')),
              ),
            ) : null,
            h('div', { className: 'sr-detail-nav', role: 'navigation', 'aria-label': t('bookSections') },
              h('button', { type: 'button', onClick: function overview() { jumpToSection(introRef); } }, t('bookIntro')),
              h('button', { type: 'button', onClick: function review() { jumpToSection(reviewRef); } }, t('myReview')),
              (props.notes && props.notes.length) || (props.bookNotes && props.bookNotes.length)
                ? h('button', { type: 'button', onClick: function notes() { jumpToSection(notesRef); } }, t('bookNotes'))
                : null,
              h('button', { type: 'button', onClick: function contents() { jumpToSection(chaptersRef); } }, t('chapterList')),
            ),
            h('div', { className: 'sr-detail-scroll', ref: scrollRef },
              h('div', { className: 'sr-tag-row' },
                h('span', { className: 'sr-tag', 'data-accent': 'true' }, book.source === 'local' ? t('importedBadge') : book.source === 'classic' ? t('publicBadge') : t('originalBadge')),
                (book.tags || []).map(function tag(value) { return h('span', { key: value, className: 'sr-tag' }, value); }),
              ),
              h('div', { className: 'sr-user-tag-editor' },
                h('div', { className: 'sr-detail-section-label' },
                  h('span', null, t('tagsLabel')),
                  h('span', null, (props.userTags || []).length ? String((props.userTags || []).length) : ''),
                ),
                h('div', { className: 'sr-user-tag-list' },
                  (props.userTags || []).length
                    ? (props.userTags || []).map(function userTag(tag) {
                      return h('span', { key: tag, className: 'sr-user-tag' },
                        h('span', null, tag),
                        h('button', {
                          type: 'button',
                          className: 'sr-user-tag-remove',
                          onClick: function remove() { props.onRemoveTag(book.id, tag); },
                          title: t('removeTag'),
                          'aria-label': t('removeTag') + ': ' + tag,
                        }, h(Icon, { name: 'close', size: 9 })),
                      );
                    })
                    : h('span', { className: 'sr-user-tag-empty' }, t('noTags')),
                ),
                h('form', {
                  className: 'sr-tag-add',
                  onSubmit: function submit(event) {
                    event.preventDefault();
                    const tag = tagDraft.trim();
                    if (!tag) return;
                    props.onAddTag(book.id, tag);
                    setTagDraft('');
                  },
                },
                  h('input', {
                    type: 'text',
                    value: tagDraft,
                    maxLength: 24,
                    placeholder: t('tagPlaceholder'),
                    'aria-label': t('tagPlaceholder'),
                    onChange: function change(event) { setTagDraft(event.target.value); },
                  }),
                  h('button', { type: 'submit', className: 'sr-tag-add-btn', disabled: !tagDraft.trim() },
                    h(Icon, { name: 'plus', size: 11 }),
                    h('span', null, t('addTag')),
                  ),
                ),
              ),
              h('div', { className: 'sr-detail-bookstats' },
                h('div', null,
                  h(Icon, { name: 'clock', size: 13 }),
                  h('strong', null, formatDuration(props.readingSeconds || 0, t)),
                  h('span', null, t('totalRead')),
                ),
                h('div', null,
                  h(Icon, { name: 'pen', size: 13 }),
                  h('strong', null, props.noteCount || 0),
                  h('span', null, t('highlight')),
                ),
                h('div', null,
                  h(Icon, { name: 'bookmark', size: 13 }),
                  h('strong', null, props.bookmarkCount || 0),
                  h('span', null, t('bookmark')),
                ),
              ),
              props.bookSessions && props.bookSessions.length ? h('div', { className: 'sr-detail-sessions' },
                h('div', { className: 'sr-detail-section-label' }, h('span', null, t('bookSessions'))),
                h('div', { className: 'sr-book-session-list' },
                  props.bookSessions.map(function session(item) {
                    const sessionChapter = chapters[item.chapterIndex];
                    return h('button', {
                      key: item.id,
                      type: 'button',
                      className: 'sr-book-session',
                      onClick: function open() { props.onRead(book, item.chapterIndex, 0); },
                    },
                      h(Icon, { name: 'clock', size: 11 }),
                      h('span', { className: 'sr-book-session-chapter' }, sessionChapter ? sessionChapter.title : ''),
                      h('span', { className: 'sr-book-session-time' }, formatDuration(item.seconds, t)),
                      h('small', null, dateLabel(item.endedAt)),
                    );
                  }),
                ),
              ) : null,
              h('p', { className: 'sr-detail-desc', ref: introRef }, book.description),
              h('div', { className: 'sr-detail-review', ref: reviewRef },
                h('div', { className: 'sr-detail-notes-head' },
                  h('div', { className: 'sr-detail-section-label' },
                    h('span', null, t('myReview')),
                    props.review && props.review.updatedAt ? h('span', null, dateLabel(props.review.updatedAt)) : null,
                  ),
                  props.review && (props.review.rating || props.review.text) ? h('button', {
                    type: 'button',
                    className: 'sr-text-btn',
                    onClick: function copyReview() {
                      copyTextToClipboard(buildReviewText(book, props.review)).then(function done(ok) {
                        props.showToast(ok ? t('reviewCopied') : t('copyFailed'));
                      });
                    },
                  }, h(Icon, { name: 'copy', size: 10 }), h('span', null, t('copyReview'))) : null,
                ),
                h('div', { className: 'sr-review-stars', role: 'group', 'aria-label': t('myReview') },
                  [1, 2, 3, 4, 5].map(function star(value) {
                    return h('button', {
                      key: value,
                      type: 'button',
                      className: 'sr-review-star',
                      'data-on': draftRating >= value ? 'true' : 'false',
                      'aria-pressed': draftRating >= value,
                      title: fill(t('ratingStar'), { n: value }),
                      'aria-label': fill(t('ratingStar'), { n: value }),
                      onClick: function pick() { setDraftRating(draftRating === value ? 0 : value); },
                    }, h(Icon, { name: draftRating >= value ? 'star-filled' : 'star', size: 16 }));
                  }),
                ),
                h('textarea', {
                  className: 'sr-review-text',
                  value: draftReview,
                  maxLength: 2000,
                  placeholder: t('reviewPlaceholder'),
                  'aria-label': t('reviewPlaceholder'),
                  onChange: function change(event) { setDraftReview(event.target.value); },
                }),
                h('div', { className: 'sr-review-actions' },
                  h('button', {
                    type: 'button',
                    className: 'sr-btn sr-btn-sm sr-btn-primary',
                    disabled: !reviewDirty,
                    onClick: function save() {
                      const body = draftReview.trim();
                      setDraftReview(body);
                      props.onSaveReview(book.id, draftRating, body);
                    },
                  }, t('saveReview')),
                ),
              ),
              props.similar && props.similar.length ? h('div', { className: 'sr-detail-similar' },
                h('div', { className: 'sr-detail-section-label' }, h('span', null, t('similarBooks'))),
                h('div', { className: 'sr-similar-list' },
                  props.similar.map(function other(item) {
                    return h('button', {
                      key: item.id,
                      type: 'button',
                      className: 'sr-similar-card',
                      onClick: function open() { props.onOpenBook(item); },
                    },
                      h(Cover, { book: item, t: t, size: 'sm', showBadge: false }),
                      h('span', { className: 'sr-similar-title' }, item.title),
                      h('span', { className: 'sr-similar-author' }, item.author),
                    );
                  }),
                ),
              ) : null,
              props.notes && props.notes.length ? h('div', { className: 'sr-detail-notes', ref: notesRef },
                h('div', { className: 'sr-detail-notes-head' },
                  h('div', { className: 'sr-detail-section-label' },
                    h('span', null, t('bookNotes')),
                    h('span', null, t('highlightCount', { n: props.notes.length })),
                  ),
                  h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                    h('button', {
                      type: 'button',
                      className: 'sr-text-btn',
                      onClick: function copyNotes() {
                        const markdown = bookNotesMarkdown(book, props.notes || [], props.bookNotes || [], t, props.review);
                        copyTextToClipboard(markdown).then(function done(ok) {
                          props.showToast(ok ? t('bookNotesCopied') : t('copyFailed'));
                        });
                      },
                    }, h(Icon, { name: 'copy', size: 11 }), h('span', null, t('copyBookNotes'))),
                    h('button', {
                      type: 'button',
                      className: 'sr-text-btn',
                      onClick: function exportNotes() {
                        const markdown = bookNotesMarkdown(book, props.notes || [], props.bookNotes || [], t, props.review);
                        const safeTitle = book.title.replace(/[\\/:*?"<>|]/g, '-').slice(0, 40) || 'book';
                        if (downloadTextFile(safeTitle + '-notes.md', markdown, 'text/markdown;charset=utf-8')) props.showToast(t('bookNotesExported'));
                      },
                    }, h(Icon, { name: 'download', size: 11 }), h('span', null, t('exportBookNotes'))),
                  ),
                ),
                props.notes.slice(0, 3).map(function preview(note) {
                  const noteChapter = chapters[note.chapterIndex];
                  const color = HIGHLIGHT_COLORS.find(function find(item) { return item.id === note.color; }) || HIGHLIGHT_COLORS[0];
                  const total = noteChapter ? chapterText(noteChapter).length : 0;
                  const percent = total ? clamp(note.start / total, 0, 1) : 0;
                  return h('button', {
                    key: note.id,
                    type: 'button',
                    className: 'sr-detail-note',
                    onClick: function openNote() { props.onRead(book, note.chapterIndex, percent); },
                  },
                    h('span', { className: 'sr-detail-note-mark', style: { '--sr-hl': color.value } }),
                    h('span', { className: 'sr-detail-note-body' },
                      h('span', { className: 'sr-detail-note-quote' }, note.text),
                      note.note ? h('span', { className: 'sr-detail-note-thought' }, note.note) : null,
                      h('small', null, (noteChapter ? noteChapter.title : '') + ' · ' + dateLabel(note.createdAt)),
                    ),
                    h(Icon, { name: 'arrow-up-right', size: 12, style: { flex: 'none', opacity: .4 } }),
                  );
                }),
                props.notes.length > 3 ? h('p', { className: 'sr-detail-notes-more' }, fill(t('moreNotesHint'), { n: props.notes.length - 3 })) : null,
              ) : null,
              props.bookNotes && props.bookNotes.length ? h('div', { className: 'sr-detail-notes sr-detail-bookmarks', ref: props.notes && props.notes.length ? null : notesRef },
                h('div', { className: 'sr-detail-notes-head' },
                  h('div', { className: 'sr-detail-section-label' },
                    h('span', null, t('bookmark')),
                    h('span', null, t('bookmarkCount', { n: props.bookNotes.length })),
                  ),
                ),
                props.bookNotes.slice().sort(function latest(a, b) { return b.createdAt - a.createdAt; }).slice(0, 3).map(function preview(item) {
                  const markChapter = chapters[item.chapterIndex];
                  return h('button', {
                    key: item.id,
                    type: 'button',
                    className: 'sr-detail-bookmark',
                    onClick: function openBookmark() { props.onRead(book, item.chapterIndex, item.percent || 0); },
                  },
                    h(Icon, { name: 'bookmark', size: 12, style: { flex: 'none', opacity: .55 } }),
                    h('span', { className: 'sr-detail-bookmark-body' },
                      item.excerpt ? h('span', { className: 'sr-detail-bookmark-excerpt' }, item.excerpt) : h('span', { className: 'sr-detail-bookmark-excerpt' }, (markChapter ? markChapter.title : '') + ' · ' + fill(t('bookmarkPage'), { n: item.page })),
                      item.note ? h('span', { className: 'sr-detail-bookmark-note' }, item.note) : null,
                      h('small', null, (markChapter ? markChapter.title : '') + ' · ' + dateLabel(item.createdAt)),
                    ),
                    h(Icon, { name: 'arrow-up-right', size: 12, style: { flex: 'none', opacity: .35 } }),
                  );
                }),
                props.bookNotes.length > 3 ? h('p', { className: 'sr-detail-notes-more' }, fill(t('moreBookmarksHint'), { n: props.bookNotes.length - 3 })) : null,
              ) : null,
              h('div', { className: 'sr-detail-section-label sr-detail-chapters-head', ref: chaptersRef },
                h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                  h('span', null, t('chapterList')),
                  h('span', null, (progress || completed) ? fill(t('tocReadProgress'), { read: readChaptersCount, total: totalChapters }) : t('bookChapters', { n: totalChapters })),
                ),
                totalChapters > 6 ? h('div', { className: 'sr-detail-chapter-search' },
                  h(Icon, { name: 'search', size: 11 }),
                  h('input', {
                    type: 'search',
                    value: chapterFilter,
                    placeholder: t('tocSearchPlaceholder'),
                    'aria-label': t('tocSearchPlaceholder'),
                    onChange: function change(e) { setChapterFilter(e.target.value); },
                  }),
                  chapterFilter ? h('button', {
                    type: 'button',
                    className: 'sr-clear-btn',
                    onClick: function clear() { setChapterFilter(''); },
                    title: t('clearSearch'),
                    'aria-label': t('clearSearch'),
                  }, h(Icon, { name: 'close', size: 10 })) : null,
                ) : null,
              ),
              h('div', { className: 'sr-chapter-list' },
                (function renderChapters() {
                  const filteredOverview = overview.filter(function keep(item) {
                    if (!chapterFilter.trim()) return true;
                    const q = chapterFilter.trim().toLowerCase();
                    return item.title.toLowerCase().indexOf(q) >= 0 || String(item.index + 1).indexOf(q) >= 0;
                  });
                  if (!filteredOverview.length) {
                    return h('p', { className: 'sr-detail-no-chapters' }, t('tocNoMatch'));
                  }
                  return filteredOverview.map(function row(item) {
                    const isCurrent = Boolean(progress) && item.index === currentIndex && !completed;
                    const isRead = completed ? true : (Boolean(progress) && item.index < currentIndex);
                    const marked = chapterResumePercent(marks, item.id);
                    const resumePoint = isCurrent
                      ? (Number(progress.percent) > 0 ? Number(progress.percent) : (marked > 0 ? marked : 0))
                      : (marked > 0 ? marked : 0);
                    const rowTitle = isCurrent
                      ? t('currentChapter')
                      : (marked > 0 ? fill(t('tocReadPercent'), { n: Math.round(marked * 100) }) : '');
                    return h('button', {
                      key: item.id,
                      type: 'button',
                      className: 'sr-chapter-row',
                      'data-current': isCurrent ? 'true' : 'false',
                      'data-read': isRead ? 'true' : 'false',
                      title: rowTitle,
                      onClick: function readChapter() { props.onRead(book, item.index, resumePoint); },
                    },
                      h('span', { className: 'sr-chapter-num' }, isRead ? h(Icon, { name: 'check', size: 10 }) : String(item.index + 1).padStart(2, '0')),
                      h('span', { className: 'sr-chapter-name' }, item.title),
                      (item.notes || item.bookmarks || (marked > 0 && !isRead && !isCurrent) || item.minutes > 0 || isCurrent) ? h('span', { className: 'sr-chapter-row-meta' },
                        item.minutes > 0 ? h('span', { className: 'sr-chapter-min' }, fill(t('estimatedMinutes'), { n: item.minutes })) : null,
                        item.notes ? h('span', { className: 'sr-chapter-badge', title: t('highlight') }, h(Icon, { name: 'pen', size: 9 }), item.notes) : null,
                        item.bookmarks ? h('span', { className: 'sr-chapter-badge', title: t('bookmark') }, h(Icon, { name: 'bookmark', size: 9 }), item.bookmarks) : null,
                        marked > 0 && !isRead && !isCurrent ? h('span', { className: 'sr-chapter-percent' }, Math.round(marked * 100) + '%') : null,
                        isCurrent ? h('span', { className: 'sr-chapter-dot' }) : null,
                      ) : null,
                    );
                  });
                })(),
              ),
            ),
            h('div', { className: 'sr-detail-foot' },
              h('span', { className: 'sr-detail-foot-info' }, footInfo),
              h('div', { className: 'sr-detail-actions' },
                h('button', {
                  type: 'button',
                  className: 'sr-btn sr-wishlist-btn',
                  'data-on': props.wishlisted ? 'true' : 'false',
                  onClick: function toggleWishlist() { props.onToggleWishlist(book.id); },
                },
                  h(Icon, { name: 'bookmark', size: 12 }),
                  h('span', null, props.wishlisted ? t('removeWishlist') : t('wantToRead')),
                ),
                h('button', {
                  type: 'button',
                  className: 'sr-btn sr-shelve-btn',
                  'data-on': props.shelved ? 'true' : 'false',
                  title: props.shelved ? t('unshelveHint') : t('shelveHint'),
                  onClick: function toggleShelved() { props.onToggleShelved(book.id); },
                },
                  h(Icon, { name: 'pause', size: 12 }),
                  h('span', null, props.shelved ? t('unshelveBook') : t('shelveBook')),
                ),
                (progress && !completed && (progress.chapterIndex > 0 || (progress.percent && progress.percent > 0.02)))
                  ? h('button', {
                    type: 'button',
                    className: 'sr-btn sr-restart-btn',
                    title: t('readFromBeginningHint'),
                    onClick: function restart() { props.onRead(book, 0, 0); },
                  },
                    h(Icon, { name: 'refresh', size: 12 }),
                    h('span', null, t('readFromBeginning')),
                  )
                  : null,
                h('button', { type: 'button', className: 'sr-btn sr-btn-primary', onClick: start },
                  h(Icon, { name: 'play', size: 12 }),
                  h('span', null, readLabel),
                ),
              ),
            ),
          ),
        ),
      );
    }
