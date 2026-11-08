    function paletteSnippet(text, max) {
      const value = String(text || '').replace(/\s+/g, ' ').trim();
      const limit = Math.max(8, Number(max) || 52);
      return value.length > limit ? value.slice(0, limit - 1) + '…' : value;
    }

    function CommandPalette(props) {
      const t = props.t;
      const [text, setText] = useState('');
      const [cursor, setCursor] = useState(0);
      const listRef = useRef(null);

      const query = String(text || '').trim();
      const books = props.books || [];
      const found = paletteResults({
        query: query,
        books: books,
        highlights: props.highlights || [],
        userTags: props.userTags || {},
        limit: 5,
      });
      const bookById = new Map();
      books.forEach(function index(book) { bookById.set(book.id, book); });

      const actionQuery = query.toLowerCase();
      const actions = (props.actions || []).filter(function match(item) {
        if (!actionQuery) return true;
        return (item.label + ' ' + (item.hint || '')).toLowerCase().indexOf(actionQuery) >= 0;
      });

      function bookRow(book) {
        const saved = (props.progress || {})[book.id];
        const percent = saved ? progressPercent(book, saved) : 0;
        return {
          key: 'book-' + book.id,
          icon: 'book',
          kind: t('paletteKindBook'),
          label: book.title,
          meta: [book.author, saved ? fill(t('paletteBookProgress'), { n: percent }) : ''].filter(Boolean).join(' · '),
          run: function open() { props.onOpenBook(book); },
        };
      }

      function chapterRow(item) {
        const marks = (props.bookMarks || {})[item.book.id] || {};
        return {
          key: 'chapter-' + item.book.id + '-' + item.chapter.id,
          icon: 'layers',
          kind: t('paletteKindChapter'),
          label: item.chapter.title,
          meta: item.book.title + ' · ' + fill(t('paletteChapterIndex'), { n: item.chapterIndex + 1 }),
          run: function open() { props.onOpenChapter(item.book, item.chapterIndex, chapterResumePercent(marks, item.chapter.id)); },
        };
      }

      function noteRow(note) {
        const book = bookById.get(note.bookId);
        const chapter = book && book.chapters ? book.chapters[note.chapterIndex] : null;
        return {
          key: 'note-' + note.id,
          icon: 'message',
          kind: t('paletteKindNote'),
          label: paletteSnippet(note.text, 54),
          meta: [book ? book.title : '', chapter ? chapter.title : '', dateLabel(note.createdAt)].filter(Boolean).join(' · '),
          run: function open() { props.onOpenNote(note); },
        };
      }

      function tagRow(item) {
        return {
          key: 'tag-' + item.tag,
          icon: 'tag',
          kind: t('paletteKindTag'),
          label: '#' + item.tag,
          meta: fill(t('paletteTagBooks'), { n: item.count }),
          run: function selectTag() {
            if (typeof props.onSelectTag === 'function') {
              props.onSelectTag(item.tag);
            }
          },
        };
      }

      function actionRow(item) {
        return {
          key: 'action-' + item.id,
          icon: item.icon || 'sparkle',
          kind: t('paletteKindAction'),
          label: item.label,
          meta: item.hint || '',
          run: item.run,
        };
      }

      const groups = [];
      if (!query) {
        const recent = props.recent || [];
        if (recent.length) {
          groups.push({ id: 'recent', label: t('paletteRecent'), rows: recent.map(bookRow) });
        }
        if (actions.length) {
          groups.push({ id: 'actions', label: t('paletteActions'), rows: actions.map(actionRow) });
        }
      } else {
        if (found.tags && found.tags.length) groups.push({ id: 'tags', label: t('paletteTags'), rows: found.tags.map(tagRow) });
        if (found.books.length) groups.push({ id: 'books', label: t('paletteBooks'), rows: found.books.map(bookRow) });
        if (found.chapters.length) groups.push({ id: 'chapters', label: t('paletteChapters'), rows: found.chapters.map(chapterRow) });
        if (found.notes.length) groups.push({ id: 'notes', label: t('paletteNotes'), rows: found.notes.map(noteRow) });
        if (actions.length) groups.push({ id: 'actions', label: t('paletteActions'), rows: actions.map(actionRow) });
      }

      const rows = [];
      groups.forEach(function flatten(group) {
        group.rows.forEach(function push(row) { rows.push(row); });
      });
      const activeIndex = rows.length ? Math.min(cursor, rows.length - 1) : 0;

      useEffect(function clampCursor() {
        if (cursor > rows.length - 1) setCursor(0);
      }, [rows.length]);

      useEffect(function scrollActive() {
        const node = listRef.current && listRef.current.querySelector('[data-active="true"]');
        if (node && typeof node.scrollIntoView === 'function') node.scrollIntoView({ block: 'nearest' });
      }, [activeIndex, query]);

      function runRow(row) {
        if (!row) return;
        props.onClose();
        row.run();
      }

      function handleKeyDown(event) {
        if ((event.nativeEvent && event.nativeEvent.isComposing) || event.keyCode === 229) return;
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setCursor(rows.length ? (activeIndex + 1) % rows.length : 0);
          return;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setCursor(rows.length ? (activeIndex - 1 + rows.length) % rows.length : 0);
          return;
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          runRow(rows[activeIndex]);
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          props.onClose();
        }
      }

      let position = -1;
      return h('div', {
        className: 'sr-palette-backdrop',
        onMouseDown: function backdrop(event) { if (event.target === event.currentTarget) props.onClose(); },
      },
        h('div', {
          className: 'sr-palette',
          role: 'dialog',
          'aria-modal': 'true',
          'aria-label': t('paletteTitle'),
        },
          h('div', { className: 'sr-palette-field' },
            h(Icon, { name: 'search', size: 15 }),
            h('input', {
              type: 'text',
              value: text,
              autoFocus: true,
              placeholder: t('palettePlaceholder'),
              'aria-label': t('palettePlaceholder'),
              onChange: function change(event) { setText(event.target.value); setCursor(0); },
              onKeyDown: handleKeyDown,
            }),
            h('kbd', null, 'esc'),
          ),
          h('div', { className: 'sr-palette-body', ref: listRef },
            rows.length
              ? groups.map(function group(section) {
                return h('div', { key: section.id, className: 'sr-palette-group' },
                  h('div', { className: 'sr-palette-group-label' }, section.label),
                  section.rows.map(function row(item) {
                    position += 1;
                    const index = position;
                    return h('button', {
                      key: item.key,
                      type: 'button',
                      className: 'sr-palette-row',
                      'data-active': index === activeIndex ? 'true' : 'false',
                      onMouseMove: function hover() { if (index !== activeIndex) setCursor(index); },
                      onClick: function pick() { runRow(item); },
                    },
                      h('span', { className: 'sr-palette-icon' }, h(Icon, { name: item.icon, size: 13 })),
                      h('span', { className: 'sr-palette-copy' },
                        h('span', { className: 'sr-palette-label' }, item.label),
                        item.meta ? h('span', { className: 'sr-palette-meta' }, item.meta) : null,
                      ),
                      h('span', { className: 'sr-palette-kind' }, item.kind),
                    );
                  }),
                );
              })
              : h('div', { className: 'sr-palette-empty' },
                h(Icon, { name: 'search', size: 18 }),
                h('span', null, t('paletteEmpty')),
              ),
          ),
          h('div', { className: 'sr-palette-foot' },
            h('span', null, h('kbd', null, '↑'), h('kbd', null, '↓'), t('paletteFootPick')),
            h('span', null, h('kbd', null, '↵'), t('paletteFootOpen')),
            h('span', null, h('kbd', null, 'esc'), t('paletteFootClose')),
          ),
        ),
      );
    }
