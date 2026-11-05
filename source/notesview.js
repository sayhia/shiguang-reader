    function notebookMarkdown(notes, bookmarks, bookMap, t) {
      const translate = typeof t === 'function' ? t : function id(k) { return k; };
      const lines = [];
      lines.push('# ' + translate('brand') + ' · ' + translate('notesTitle'));
      lines.push('');
      lines.push(fullDateLabel());
      lines.push('');

      const noteList = Array.isArray(notes) ? notes : [];
      const bookmarkList = Array.isArray(bookmarks) ? bookmarks : [];
      lines.push('> ' + fill(translate('notebookSummaryMeta'), { notes: noteList.length, bookmarks: bookmarkList.length }));
      lines.push('');
      let map = bookMap && typeof bookMap.get === 'function' ? bookMap : null;
      if (!map) {
        map = new Map();
        if (Array.isArray(bookMap)) {
          bookMap.forEach(function add(b) { if (b && b.id) map.set(b.id, b); });
        }
      }

      const grouped = new Map();
      noteList.forEach(function group(note) {
        if (!note || typeof note.bookId !== 'string') return;
        if (!grouped.has(note.bookId)) grouped.set(note.bookId, []);
        grouped.get(note.bookId).push(note);
      });

      grouped.forEach(function bookGroup(items, bookId) {
        const book = map.get(bookId);
        if (!book) return;
        lines.push('## ' + book.title);
        lines.push('');
        if (book.author) {
          lines.push('*' + book.author + '*');
          lines.push('');
        }
        items.slice().sort(function order(a, b) {
          return a.chapterIndex - b.chapterIndex || a.start - b.start;
        }).forEach(function entry(note) {
          const chapter = book && Array.isArray(book.chapters) ? book.chapters[note.chapterIndex] : null;
          lines.push(String(note.text || '').split('\n').map(function quoteLine(line) { return '> ' + line; }).join('\n'));
          lines.push('');
          if (note.note) {
            lines.push('**' + translate('thought') + '**');
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
      });

      if (bookmarkList.length) {
        lines.push('## ' + translate('notesBookmarks'));
        lines.push('');
        bookmarkList.forEach(function entry(item) {
          const book = map.get(item.bookId);
          if (!book) return;
          lines.push('- **' + book.title + '** · ' + (item.chapterTitle || '') + ' · ' + fill(translate('bookmarkPage'), { n: item.page }) + ' · ' + dateLabel(item.createdAt));
          if (item.excerpt) lines.push('  > ' + item.excerpt);
          if (item.note) lines.push('  - ' + item.note);
        });
        lines.push('');
      }

      lines.push('— ' + translate('brand'));
      return lines.join('\n');
    }

    function notebookByTagMarkdown(notes, bookMap, t) {
      const translate = typeof t === 'function' ? t : function id(k) { return k; };
      const lines = [];
      lines.push('# ' + translate('brand') + ' · ' + translate('notesByTagTitle'));
      lines.push('');
      lines.push(fullDateLabel());
      lines.push('');

      const noteList = Array.isArray(notes) ? notes : [];
      lines.push('> ' + fill(translate('notebookTagSummaryMeta'), { notes: noteList.length }));
      lines.push('');
      let map = bookMap && typeof bookMap.get === 'function' ? bookMap : null;
      if (!map) {
        map = new Map();
        if (Array.isArray(bookMap)) {
          bookMap.forEach(function add(b) { if (b && b.id) map.set(b.id, b); });
        }
      }

      const byTag = new Map();
      const untagged = [];
      noteList.forEach(function group(note) {
        if (!note) return;
        const tags = Array.isArray(note.tags) && note.tags.length ? note.tags : [];
        if (!tags.length) {
          untagged.push(note);
          return;
        }
        tags.forEach(function pushTag(tag) {
          if (!byTag.has(tag)) byTag.set(tag, []);
          byTag.get(tag).push(note);
        });
      });

      const sortedTags = Array.from(byTag.keys()).sort();
      sortedTags.forEach(function tagGroup(tag) {
        const items = byTag.get(tag);
        lines.push('## #' + tag + ' (' + items.length + ')');
        lines.push('');
        items.forEach(function entry(note) {
          const book = map.get(note.bookId);
          const chapter = book && Array.isArray(book.chapters) ? book.chapters[note.chapterIndex] : null;
          lines.push(String(note.text || '').split('\n').map(function quoteLine(line) { return '> ' + line; }).join('\n'));
          lines.push('');
          if (note.note) {
            lines.push('**' + translate('thought') + '**：' + note.note);
            lines.push('');
          }
          const source = (book ? '《' + book.title + '》' : '') + (chapter ? ' · ' + chapter.title : '');
          lines.push('— ' + source + (note.createdAt ? ' (' + dateLabel(note.createdAt) + ')' : ''));
          lines.push('');
        });
      });

      if (untagged.length) {
        lines.push('## ' + translate('untaggedNotes') + ' (' + untagged.length + ')');
        lines.push('');
        untagged.forEach(function entry(note) {
          const book = map.get(note.bookId);
          const chapter = book && Array.isArray(book.chapters) ? book.chapters[note.chapterIndex] : null;
          lines.push(String(note.text || '').split('\n').map(function quoteLine(line) { return '> ' + line; }).join('\n'));
          lines.push('');
          if (note.note) {
            lines.push('**' + translate('thought') + '**：' + note.note);
            lines.push('');
          }
          const source = (book ? '《' + book.title + '》' : '') + (chapter ? ' · ' + chapter.title : '');
          lines.push('— ' + source + (note.createdAt ? ' (' + dateLabel(note.createdAt) + ')' : ''));
          lines.push('');
        });
      }

      return lines.join('\n').trim() + '\n';
    }

    function TagManagerDialog(props) {
      const t = props.t;
      const tags = Array.isArray(props.tags) ? props.tags : [];
      const counts = props.counts instanceof Map ? props.counts : new Map();
      // Shelf and notes both reuse this dialog; only the copy changes.
      const title = props.title || t('tagManager');
      const hint = props.hint || t('tagManagerHint');
      const emptyText = props.empty || t('noteTagsEmpty');
      const [renaming, setRenaming] = useState(null);
      const [pendingDelete, setPendingDelete] = useState('');

      useEffect(function escape() {
        function onKey(event) {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          if (renaming) setRenaming(null);
          else if (pendingDelete) setPendingDelete('');
          else props.onClose();
        }
        document.addEventListener('keydown', onKey, true);
        return function cleanup() { document.removeEventListener('keydown', onKey, true); };
      }, [renaming, pendingDelete, props.onClose]);

      function submitRename(tag) {
        if (!renaming) return;
        const nextTag = cleanNoteTags([renaming.value])[0];
        setRenaming(null);
        if (!nextTag || nextTag === tag) return;
        props.onRename(tag, nextTag);
      }

      return h('div', {
        className: 'sr-note-editor-backdrop',
        onMouseDown: function backdrop(event) { if (event.target === event.currentTarget) props.onClose(); },
      },
        h('div', { className: 'sr-tag-manager', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
          h('div', { className: 'sr-note-editor-head' },
            h('div', null,
              h('h2', null, title),
              h('p', null, fill(t('tagManagerCount'), { n: tags.length })),
            ),
            h('button', { type: 'button', className: 'sr-icon-btn', onClick: props.onClose, title: t('close'), 'aria-label': t('close') },
              h(Icon, { name: 'close', size: 15 }),
            ),
          ),
          h('p', { className: 'sr-tag-manager-hint' }, hint),
          tags.length ? h('div', { className: 'sr-tag-manager-list' },
            tags.map(function row(tag) {
              const isRenaming = Boolean(renaming && renaming.tag === tag);
              const isPending = pendingDelete === tag;
              return h('div', {
                key: tag,
                className: 'sr-tag-manager-row',
                'data-pending': isPending ? 'true' : 'false',
              },
                h('div', { className: 'sr-tag-manager-main' },
                  isRenaming
                    ? h('input', {
                      className: 'sr-tag-manager-input',
                      value: renaming.value,
                      maxLength: MAX_NOTE_TAG_LENGTH,
                      autoFocus: true,
                      'aria-label': t('tagRenamePlaceholder'),
                      placeholder: t('tagRenamePlaceholder'),
                      onChange: function change(event) { setRenaming({ tag: tag, value: event.target.value }); },
                      onKeyDown: function keys(event) {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          submitRename(tag);
                        } else if (event.key === 'Escape') {
                          event.preventDefault();
                          event.stopPropagation();
                          setRenaming(null);
                        }
                      },
                    })
                    : h('span', { className: 'sr-tag-manager-name' }, '#' + tag),
                  counts.has(tag) ? h('span', { className: 'sr-tag-count' }, counts.get(tag)) : null,
                ),
                h('div', { className: 'sr-tag-manager-actions' },
                  isRenaming
                    ? h(React.Fragment, null,
                      h('button', { type: 'button', className: 'sr-link-btn', onClick: function cancel() { setRenaming(null); } }, t('cancel')),
                      h('button', { type: 'button', className: 'sr-link-btn sr-link-primary', onClick: function save() { submitRename(tag); } }, t('save')),
                    )
                    : isPending
                      ? h(React.Fragment, null,
                        h('button', { type: 'button', className: 'sr-link-btn', onClick: function cancel() { setPendingDelete(''); } }, t('cancel')),
                        h('button', {
                          type: 'button',
                          className: 'sr-link-btn',
                          'data-danger': 'true',
                          onClick: function remove() { setPendingDelete(''); props.onDelete(tag); },
                        }, t('tagDeleteConfirm')),
                      )
                      : h(React.Fragment, null,
                        h('button', {
                          type: 'button',
                          className: 'sr-icon-btn sr-tag-manager-icon',
                          title: t('tagRename'),
                          'aria-label': t('tagRename') + ': ' + tag,
                          onClick: function startRename() { setPendingDelete(''); setRenaming({ tag: tag, value: tag }); },
                        }, h(Icon, { name: 'pen', size: 13 })),
                        h('button', {
                          type: 'button',
                          className: 'sr-icon-btn sr-tag-manager-icon',
                          title: t('tagDelete'),
                          'aria-label': t('tagDelete') + ': ' + tag,
                          onClick: function askDelete() { setRenaming(null); setPendingDelete(tag); },
                        }, h(Icon, { name: 'trash', size: 13 })),
                      ),
                ),
              );
            }),
          ) : h('p', { className: 'sr-tag-manager-empty' }, emptyText),
          h('div', { className: 'sr-tag-manager-foot' },
            h('button', { type: 'button', className: 'sr-btn', onClick: props.onClose }, t('done')),
          ),
        ),
      );
    }

    function NotesView(props) {
      const t = props.t;
      const reviewCount = Object.keys(props.reviews || {}).length;
      const [mode, setMode] = useState(props.highlights.length ? 'highlights' : (Array.isArray(props.bookmarks) && props.bookmarks.length ? 'bookmarks' : (reviewCount ? 'reviews' : 'highlights')));
      const [sortMode, setSortMode] = useState('newest');
      const [collapsedBooks, setCollapsedBooks] = useState([]);
      const [bookFilter, setBookFilter] = useState('all');
      const [thoughtOnly, setThoughtOnly] = useState(false);
      const [noteQuery, setNoteQuery] = useState('');
      const [reviewRatingFilter, setReviewRatingFilter] = useState('all');
      const [colorFilter, setColorFilter] = useState('all');
      const [tagFilters, setTagFilters] = useState([]);
      const [tagMatch, setTagMatch] = useState('any');
      const [tagManagerOpen, setTagManagerOpen] = useState(false);
      const [tagDraft, setTagDraft] = useState('');
      const [bulkTagOpen, setBulkTagOpen] = useState(false);
      const [bulkColorOpen, setBulkColorOpen] = useState(false);
      const [bulkTagDraft, setBulkTagDraft] = useState('');
      const [cardNote, setCardNote] = useState(null);
      const [collectionCard, setCollectionCard] = useState(null);
      const [bookmarkNoteOnly, setBookmarkNoteOnly] = useState(false);
      const [selectMode, setSelectMode] = useState(false);
      const [deleteConfirm, setDeleteConfirm] = useState(false);
      const [selected, setSelected] = useState([]);
      const [editor, setEditor] = useState(null);
      const [bookmarkEditor, setBookmarkEditor] = useState(null);
      const editorRef = useRef(null);
      const bookmarkEditorRef = useRef(null);

      const bookMap = useMemo(function map() {
        const map = new Map();
        props.books.forEach(function add(book) { map.set(book.id, book); });
        return map;
      }, [props.books]);

      function titleFor(bookId) {
        const item = bookMap.get(bookId);
        return item ? item.title : '';
      }

      const notes = useMemo(function sortNotes() {
        return sortNotebookItems(props.highlights, sortMode, titleFor);
      }, [props.highlights, sortMode, bookMap]);

      const bookmarks = useMemo(function sortMarks() {
        return sortNotebookItems(Array.isArray(props.bookmarks) ? props.bookmarks : [], sortMode, titleFor);
      }, [props.bookmarks, sortMode, bookMap]);

      const reviewItems = useMemo(function mapReviews() {
        return Object.keys(props.reviews || {}).map(function pair(bookId) {
          return { book: bookMap.get(bookId), review: props.reviews[bookId] };
        }).filter(function known(item) { return Boolean(item.book && item.review); });
      }, [props.reviews, bookMap]);
      const selectedSet = new Set(selected);
      function toggleSelected(key) {
        setSelected(function apply(previous) {
          return previous.indexOf(key) >= 0 ? previous.filter(function keep(item) { return item !== key; }) : previous.concat(key);
        });
      }
      function exitSelect() {
        setSelectMode(false);
        setSelected([]);
        setBulkColorOpen(false);
        setBulkTagOpen(false);
        setBulkTagDraft('');
        setDeleteConfirm(false);
      }
      const selectedHighlightIds = selected.filter(function isHighlight(key) { return key.indexOf('h:') === 0; }).map(function id(key) { return key.slice(2); });
      function applyBulkTag(mode) {
        const tag = cleanNoteTags([bulkTagDraft])[0];
        if (!tag || !selectedHighlightIds.length) return;
        props.onBulkTag(selectedHighlightIds, tag, mode);
        setBulkTagDraft('');
      }
      function openCollectionCard() {
        const picked = props.highlights.filter(function match(note) { return selectedHighlightIds.indexOf(note.id) >= 0; });
        if (picked.length < 2) {
          props.showToast(t('collectionNeedTwo'));
          return;
        }
        const limited = picked.slice(0, COLLECTION_MAX_ITEMS);
        if (picked.length > COLLECTION_MAX_ITEMS) props.showToast(fill(t('collectionTooMany'), { n: COLLECTION_MAX_ITEMS }));
        const bookIds = limited.reduce(function collect(list, note) {
          return list.indexOf(note.bookId) >= 0 ? list : list.concat(note.bookId);
        }, []);
        const single = bookIds.length === 1 ? bookMap.get(bookIds[0]) : null;
        setCollectionCard({
          items: limited.map(function text(note) { return note.text; }),
          title: single ? single.title : t('collectionMixed'),
          caption: single && single.author
            ? single.author + ' · ' + fill(t('collectionCount'), { n: limited.length })
            : fill(t('collectionCount'), { n: limited.length }),
        });
      }
      const query = noteQuery.trim().toLowerCase();
      const terms = searchTerms(noteQuery);
      const hasQuery = terms.length > 0;
      function renderHits(value) {
        if (!hasQuery) return value;
        const parts = highlightSegments(value, terms);
        if (parts.length === 1 && !parts[0].match) return value;
        return parts.map(function part(item, index) {
          return item.match ? h('mark', { key: index, className: 'sr-hit' }, item.text) : item.text;
        });
      }
      const reviewCounts = useMemo(function calc() {
        let stars5 = 0;
        let stars4Plus = 0;
        let hasText = 0;
        reviewItems.forEach(function item(it) {
          const rating = Math.round(Number(it.review && it.review.rating) || 0);
          if (rating === 5) stars5 += 1;
          if (rating >= 4) stars4Plus += 1;
          if (it.review && it.review.text && it.review.text.trim()) hasText += 1;
        });
        return { stars5: stars5, stars4Plus: stars4Plus, hasText: hasText };
      }, [reviewItems]);

      const colorCounts = useMemo(function calc() {
        const counts = {};
        HIGHLIGHT_COLORS.forEach(function init(c) { counts[c.id] = 0; });
        notes.forEach(function count(note) {
          const col = note.color || 'amber';
          if (counts[col] !== undefined) counts[col] += 1;
        });
        return counts;
      }, [notes]);

      const filteredReviews = sortReviewItems(reviewItems.filter(function search(item) {
        const rating = Math.round(Number(item.review && item.review.rating) || 0);
        if (reviewRatingFilter === '5' && rating !== 5) return false;
        if (reviewRatingFilter === '4' && rating < 4) return false;
        if (reviewRatingFilter === 'hasText' && (!item.review || !item.review.text || !item.review.text.trim())) return false;
        if (!hasQuery) return true;
        const haystack = (item.book.title + ' ' + item.book.author + ' ' + (item.review.text || '')).toLowerCase();
        return matchAllTerms(haystack, terms);
      }), sortMode);
      const filtered = notes.filter(function filter(note) {
        if (bookFilter !== 'all' && note.bookId !== bookFilter) return false;
        if (thoughtOnly && !note.note) return false;
        if (colorFilter !== 'all' && note.color !== colorFilter) return false;
        if (tagFilters.length) {
          const tags = Array.isArray(note.tags) ? note.tags : [];
          const hit = tagMatch === 'all'
            ? tagFilters.every(function has(tag) { return tags.indexOf(tag) >= 0; })
            : tagFilters.some(function has(tag) { return tags.indexOf(tag) >= 0; });
          if (!hit) return false;
        }
        if (!hasQuery) return true;
        const book = bookMap.get(note.bookId);
        const chapter = book && Array.isArray(book.chapters) ? book.chapters[note.chapterIndex] : null;
        const tags = Array.isArray(note.tags) ? note.tags.join(' ') : '';
        const haystack = (note.text + ' ' + note.note + ' ' + tags + ' ' + (book ? book.title + ' ' + book.author : '') + ' ' + (chapter ? chapter.title : '')).toLowerCase();
        return matchAllTerms(haystack, terms);
      });
      const booksWithNotes = [];
      const seen = {};      notes.forEach(function each(note) {
        if (seen[note.bookId]) return;
        seen[note.bookId] = true;
        const book = bookMap.get(note.bookId);
        if (book) booksWithNotes.push(book);
      });
      const visibleBookmarks = bookmarks.filter(function known(item) { return Boolean(bookMap.get(item.bookId)); });
      const booksWithBookmarks = [];
      const seenBm = {};
      visibleBookmarks.forEach(function each(bm) {
        if (seenBm[bm.bookId]) return;
        seenBm[bm.bookId] = true;
        const book = bookMap.get(bm.bookId);
        if (book) booksWithBookmarks.push(book);
      });
      const filteredBookmarks = visibleBookmarks.filter(function filter(item) {
        if (bookFilter !== 'all' && item.bookId !== bookFilter) return false;
        if (bookmarkNoteOnly && !item.note) return false;
        if (!hasQuery) return true;
        const book = bookMap.get(item.bookId);
        if (!book) return false;
        const haystack = (book.title + ' ' + book.author + ' ' + (item.chapterTitle || '') + ' ' + (item.excerpt || '') + ' ' + (item.note || '') + ' ' + fill(t('bookmarkPage'), { n: item.page })).toLowerCase();
        return matchAllTerms(haystack, terms);
      });
      const withThoughts = notes.filter(function thought(note) { return Boolean(note.note); }).length;
      const tagCounts = new Map();
      notes.forEach(function collect(note) {
        (Array.isArray(note.tags) ? note.tags : []).forEach(function add(tag) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });
      const sortedTags = Array.from(tagCounts.keys()).sort(function order(a, b) {
        const diff = tagCounts.get(b) - tagCounts.get(a);
        return diff || a.localeCompare(b, 'zh-Hans');
      });
      const noteTagList = sortedTags.slice(0, 10);
      const editorKey = editor ? editor.id : null;

      useEffect(function focusEditor() {
        if (!editorKey) return undefined;
        const frame = window.requestAnimationFrame(function focus() {
          if (editorRef.current) editorRef.current.focus();
        });
        return function cleanup() { window.cancelAnimationFrame(frame); };
      }, [editorKey]);

      useEffect(function escapeEditor() {
        if (!editorKey) return undefined;
        function onKey(event) {
          if (event.key === 'Escape') {
            event.preventDefault();
            setEditor(null);
          }
        }
        document.addEventListener('keydown', onKey, true);
        return function cleanup() { document.removeEventListener('keydown', onKey, true); };
      }, [editorKey]);

      const bookmarkEditorKey = bookmarkEditor ? bookmarkEditor.id : null;
      useEffect(function focusBookmarkEditor() {
        if (!bookmarkEditorKey) return undefined;
        const frame = window.requestAnimationFrame(function focus() {
          if (bookmarkEditorRef.current) bookmarkEditorRef.current.focus();
        });
        return function cleanup() { window.cancelAnimationFrame(frame); };
      }, [bookmarkEditorKey]);

      useEffect(function escapeBookmarkEditor() {
        if (!bookmarkEditorKey) return undefined;
        function onKey(event) {
          if (event.key === 'Escape') {
            event.preventDefault();
            setBookmarkEditor(null);
          }
        }
        document.addEventListener('keydown', onKey, true);
        return function cleanup() { document.removeEventListener('keydown', onKey, true); };
      }, [bookmarkEditorKey]);

      useEffect(function escapeTagManager() {
        if (!tagManagerOpen) return undefined;
        function onKey(event) {
          if (event.key !== 'Escape') return;
          setTagManagerOpen(false);
        }
        document.addEventListener('keydown', onKey, true);
        return function cleanup() { document.removeEventListener('keydown', onKey, true); };
      }, [tagManagerOpen]);

      useEffect(function escapeSelectMode() {
        if (!selectMode) return undefined;
        function onKey(event) {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          if (deleteConfirm) { setDeleteConfirm(false); return; }
          if (bulkColorOpen) { setBulkColorOpen(false); return; }
          if (bulkTagOpen) { setBulkTagOpen(false); return; }
          exitSelect();
        }
        window.addEventListener('keydown', onKey);
        return function cleanup() { window.removeEventListener('keydown', onKey); };
      }, [selectMode, deleteConfirm, bulkColorOpen, bulkTagOpen]);

      function handleTagRename(oldTag, nextTag) {
        props.onRenameTag(oldTag, nextTag);
        setTagFilters(function swap(previous) {
          return Array.from(new Set(previous.map(function pick(item) { return item === oldTag ? nextTag : item; })));
        });
      }

      function handleTagDelete(tag) {
        props.onDeleteTag(tag);
        setTagFilters(function drop(previous) { return previous.filter(function keep(item) { return item !== tag; }); });
      }

      function openEditor(note) {
        setTagDraft('');
        const noteBook = bookMap.get(note.bookId);
        const noteChapter = noteBook && Array.isArray(noteBook.chapters) ? noteBook.chapters[note.chapterIndex] : null;
        setEditor({
          id: note.id,
          text: note.text,
          note: note.note || '',
          initialNote: note.note || '',
          color: note.color || 'amber',
          tags: cleanNoteTags(note.tags),
          chapterTitle: noteChapter ? noteChapter.title : '',
        });
      }

      function addEditorTag(rawTag) {
        if (!editor) return;
        const tag = String(rawTag || '').trim().replace(/\s+/g, ' ').slice(0, MAX_NOTE_TAG_LENGTH);
        if (!tag) return;
        const tags = cleanNoteTags(editor.tags);
        if (tags.length >= MAX_NOTE_TAGS) {
          props.showToast(fill(t('noteTagLimit'), { n: MAX_NOTE_TAGS }));
          return;
        }
        if (tags.some(function same(item) { return item.toLowerCase() === tag.toLowerCase(); })) {
          setTagDraft('');
          return;
        }
        setEditor(Object.assign({}, editor, { tags: tags.concat(tag) }));
        setTagDraft('');
      }

      function removeEditorTag(tag) {
        if (!editor) return;
        setEditor(Object.assign({}, editor, { tags: cleanNoteTags(editor.tags).filter(function keep(item) { return item !== tag; }) }));
      }

      function saveEditor() {
        if (!editor) return;
        if (!editor.note.trim() && !editor.initialNote && !editor.tags.length) return;
        props.onUpdateHighlight(editor.id, { note: editor.note.trim(), color: editor.color, tags: editor.tags });
        props.showToast(t('thoughtSaved'));
        setEditor(null);
      }

      function copyNotes() {
        const markdown = notebookMarkdown(notes, visibleBookmarks, bookMap, t);
        copyTextToClipboard(markdown).then(function done(ok) {
          props.showToast(ok ? t('notesCopied') : t('copyFailed'));
        });
      }

      function exportNotes() {
        const markdown = notebookMarkdown(notes, visibleBookmarks, bookMap, t);
        const filename = 'shiguang-notes-' + dayKey() + '.md';
        const ok = downloadMarkdownFile(filename, markdown);
        props.showToast(ok ? t('notesExported') : t('exportFailed'));
      }

      function exportByTagNotes() {
        const markdown = notebookByTagMarkdown(notes, bookMap, t);
        const filename = 'shiguang-notes-by-tag-' + dayKey() + '.md';
        const ok = downloadMarkdownFile(filename, markdown);
        props.showToast(ok ? t('notesExported') : t('exportFailed'));
      }

      function copyReviews() {
        const markdown = reviewsMarkdown(filteredReviews, t);
        copyTextToClipboard(markdown).then(function done(ok) {
          props.showToast(ok ? t('reviewsCopied') : t('copyFailed'));
        });
      }

      function exportReviews() {
        const markdown = reviewsMarkdown(filteredReviews, t);
        const filename = 'shiguang-reviews-' + dayKey() + '.md';
        const ok = downloadMarkdownFile(filename, markdown);
        props.showToast(ok ? t('reviewsExported') : t('exportFailed'));
      }

      function renderCard(note) {
        const book = bookMap.get(note.bookId);
        if (!book) return null;
        const chapter = Array.isArray(book.chapters) ? (book.chapters[note.chapterIndex] || null) : null;
        const color = HIGHLIGHT_COLORS.find(function find(item) { return item.id === note.color; }) || HIGHLIGHT_COLORS[0];
        const noteKey = 'h:' + note.id;
        return h('article', {
          key: note.id,
          className: 'sr-note-card' + (selectMode ? ' is-selecting' : ''),
          style: { '--sr-hl': color.value },
          'data-selected': selectedSet.has(noteKey) ? 'true' : 'false',
        },
          h('div', { className: 'sr-note-top' },
            h(Cover, { book: book, t: t, size: 'sm', showBadge: false }),
            h('div', { className: 'sr-note-book' },
              h('strong', null, book.title),
              h('span', null, (chapter ? chapter.title : '') + ' · ' + dateLabel(note.createdAt)),
            ),
          ),
          h('p', { className: 'sr-note-quote' }, renderHits(note.text)),
          Array.isArray(note.tags) && note.tags.length
            ? h('div', { className: 'sr-note-tags' },
              note.tags.map(function tag(value) {
                return h('span', { key: value, className: 'sr-note-tag' }, '#' + value);
              }),
            )
            : null,
          note.note ? h('div', { className: 'sr-note-thought' },
            h('div', { className: 'sr-note-thought-label' },
              h(Icon, { name: 'message', size: 11 }),
              h('span', null, t('thought')),
            ),
            h('div', null, renderHits(note.note)),
          ) : null,
          h('div', { className: 'sr-note-foot' },
            h('div', { className: 'sr-note-actions' },
              h('button', {
                type: 'button',
                className: 'sr-link-btn',
                onClick: function makeCard() {
                  setCardNote({
                    text: note.text,
                    note: note.note || '',
                    bookTitle: book.title,
                    chapterTitle: chapter ? chapter.title : '',
                    createdAt: note.createdAt,
                  });
                },
              }, t('quoteCardShort')),
              h('button', {
                type: 'button',
                className: 'sr-link-btn',
                onClick: function copy() {
                  copyTextToClipboard(buildQuoteText(note.text, book ? book.title : '', chapter ? chapter.title : '')).then(function done(ok) {
                    props.showToast(ok ? t('quoteCopied') : t('copyFailed'));
                  });
                },
              }, t('copyQuote')),
              h('button', {
                type: 'button',
                className: 'sr-link-btn',
                title: t('copyCallout'),
                onClick: function copyCallout() {
                  copyTextToClipboard(buildCalloutText(note.text, note.note, book ? book.title : '', chapter ? chapter.title : '', t('thoughtLabel'))).then(function done(ok) {
                    props.showToast(ok ? t('calloutCopied') : t('copyFailed'));
                  });
                },
              }, 'Callout'),
              h('button', {
                type: 'button',
                className: 'sr-link-btn',
                onClick: function edit() { openEditor(note); },
              }, note.note ? t('editThought') : t('addNote')),
              note.note ? h('button', {
                type: 'button',
                className: 'sr-link-btn',
                onClick: function clearThought() {
                  props.updateHighlight(note.id, { note: '' });
                  props.showToast(t('thoughtCleared'));
                },
              }, t('clearThought')) : null,
              h('button', {
                type: 'button',
                className: 'sr-link-btn',
                onClick: function jump() {
                  const chapterTextValue = chapter ? chapterText(chapter) : '';
                  const percent = chapterTextValue.length ? clamp(note.start / chapterTextValue.length, 0, 1) : 0;
                  props.onJump(note.bookId, note.chapterIndex, percent);
                },
              }, t('jumpToText'), h(Icon, { name: 'arrow-up-right', size: 10, style: { marginLeft: 2, verticalAlign: -1 } })),
              book && props.onOpenBook ? h('button', {
                type: 'button',
                className: 'sr-link-btn',
                onClick: function openDetail() { props.onOpenBook(book); },
                title: t('viewBookDetail'),
              }, t('bookDetailShort')) : null,
              h('button', {
                type: 'button',
                className: 'sr-link-btn',
                'data-danger': 'true',
                onClick: function remove() { props.onDeleteHighlight(note.id); },
              }, t('delete')),
            ),
          ),
          selectMode ? h('button', {
            type: 'button',
            className: 'sr-select-overlay',
            'aria-pressed': selectedSet.has(noteKey),
            'aria-label': t('selectItem') + ': ' + note.text.slice(0, 30),
            onClick: function select() { toggleSelected(noteKey); },
          }, h('span', { className: 'sr-select-check' }, selectedSet.has(noteKey) ? h(Icon, { name: 'check', size: 11 }) : null)) : null,
        );
      }

      const cards = filtered.map(renderCard);
      const monthGroups = sortMode === 'month' ? groupNotesByMonth(filtered) : null;
      const bookGroups = sortMode === 'bookGroup' ? groupNotesByBook(filtered, props.books) : null;

      function toggleBookGroup(bookId) {
        setCollapsedBooks(function apply(previous) {
          return previous.indexOf(bookId) >= 0
            ? previous.filter(function keep(id) { return id !== bookId; })
            : previous.concat(bookId);
        });
      }

      return h('div', null,
        h('div', { className: 'sr-page-head' },
          h('div', null,
            h('h1', null, t('notesTitle')),
            h('p', null, t('notesSubtitle')),
          ),
          h('div', { className: 'sr-notes-head-actions' },
            mode !== 'reviews' ? h('button', {
              type: 'button',
              className: 'sr-btn',
              disabled: notes.length === 0 && visibleBookmarks.length === 0,
              onClick: function toggleSelectMode() {
                if (selectMode) exitSelect();
                else setSelectMode(true);
              },
            }, selectMode ? t('done') : t('selectNotes')) : null,
            h('button', {
              type: 'button',
              className: 'sr-btn',
              disabled: mode === 'reviews' ? reviewItems.length === 0 : (notes.length === 0 && visibleBookmarks.length === 0),
              onClick: mode === 'reviews' ? copyReviews : copyNotes,
              title: mode === 'reviews' ? t('copyReviews') : t('copyNotes'),
              'aria-label': mode === 'reviews' ? t('copyReviews') : t('copyNotes'),
            },
              h(Icon, { name: 'copy', size: 14 }),
              h('span', null, mode === 'reviews' ? t('copyReviews') : t('copyNotes')),
            ),
            h('button', {
              type: 'button',
              className: 'sr-btn',
              disabled: mode === 'reviews' ? reviewItems.length === 0 : (notes.length === 0 && visibleBookmarks.length === 0),
              onClick: mode === 'reviews' ? exportReviews : exportNotes,
              title: mode === 'reviews' ? t('exportReviews') : t('exportNotes'),
              'aria-label': mode === 'reviews' ? t('exportReviews') : t('exportNotes'),
            },
              h(Icon, { name: 'download', size: 14 }),
              h('span', null, mode === 'reviews' ? t('exportReviews') : t('exportNotes')),
            ),
            (mode === 'highlights' && noteTagList.length > 0) ? h('button', {
              type: 'button',
              className: 'sr-btn',
              disabled: notes.length === 0,
              onClick: exportByTagNotes,
              title: t('exportByTag'),
              'aria-label': t('exportByTag'),
            },
              h(Icon, { name: 'tag', size: 13 }),
              h('span', null, t('exportByTag')),
            ) : null,
          ),
        ),
        h('div', { className: 'sr-notebook-tabs', role: 'tablist', 'aria-label': t('navNotes') },
          h('button', {
            type: 'button',
            role: 'tab',
            className: 'sr-notebook-tab',
            'aria-selected': mode === 'highlights',
            onClick: function highlights() { setMode('highlights'); },
          },
            h('span', null, t('notesTitle')),
            h('span', { className: 'sr-notebook-tab-count' }, notes.length),
          ),
          h('button', {
            type: 'button',
            role: 'tab',
            className: 'sr-notebook-tab',
            'aria-selected': mode === 'bookmarks',
            onClick: function bookmarksTab() { setMode('bookmarks'); },
          },
            h('span', null, t('notesBookmarks')),
            h('span', { className: 'sr-notebook-tab-count' }, visibleBookmarks.length),
          ),
          h('button', {
            type: 'button',
            role: 'tab',
            className: 'sr-notebook-tab',
            'aria-selected': mode === 'reviews',
            onClick: function reviewsTab() { setMode('reviews'); setSelectMode(false); setSelected([]); },
          },
            h('span', null, t('reviewsTab')),
            h('span', { className: 'sr-notebook-tab-count' }, reviewItems.length),
          ),
        ),
        notes.length || visibleBookmarks.length || reviewItems.length
          ? h('div', { className: 'sr-notes-tools' },
            h('div', { className: 'sr-notes-search' },
              h(Icon, { name: 'search', size: 14 }),
              h('input', {
                type: 'search',
                value: noteQuery,
                placeholder: t('notesSearchPlaceholder'),
                title: t('notesSearchHint'),
                'aria-label': t('notesSearchPlaceholder'),
                onChange: function change(event) { setNoteQuery(event.target.value); },
              }),
              noteQuery ? h('button', {
                type: 'button',
                className: 'sr-notes-search-clear',
                onClick: function clear() { setNoteQuery(''); },
                title: t('searchClear'),
                'aria-label': t('searchClear'),
              }, h(Icon, { name: 'close', size: 11 })) : null,
            ),
            h('label', { className: 'sr-notes-sort' },
              h(Icon, { name: 'sliders', size: 12 }),
              h('select', {
                value: sortMode,
                'aria-label': t('sortBy'),
                title: t('sortBy'),
                onChange: function change(event) { setSortMode(event.target.value); },
              },
                h('option', { value: 'newest' }, t('sortNewest')),
                h('option', { value: 'oldest' }, t('sortOldest')),
                mode === 'reviews' ? h('option', { value: 'rating' }, t('sortRating')) : null,
                h('option', { value: 'book' }, t('sortByBook')),
                mode !== 'reviews' ? h('option', { value: 'bookGroup' }, t('sortByBookGroup')) : null,
                mode !== 'reviews' ? h('option', { value: 'month' }, t('sortByMonth')) : null,
              ),
            ),
          )
          : null,
        selectMode && mode !== 'reviews' ? h('div', { className: 'sr-shelf-select sr-select-bar sr-batch-dock', role: 'region', 'aria-label': t('bulkActions') },
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
                h('span', null, fill(t('confirmDeleteNotes'), { n: selected.length })),
              ),
              h('div', { className: 'sr-shelf-delete-actions' },
                h('button', { type: 'button', className: 'sr-btn sr-btn-sm', onClick: function cancel() { setDeleteConfirm(false); } }, t('cancel')),
                h('button', {
                  type: 'button',
                  className: 'sr-btn sr-btn-sm sr-btn-danger',
                  disabled: !selected.length,
                  onClick: function confirmDelete() {
                    const selection = splitSelectionKeys(selected);
                    props.onBulkDelete(selection.highlightIds, selection.bookmarkIds);
                    exitSelect();
                  },
                }, t('confirmRemove')),
              ),
            ),
          ) : null,
          bulkColorOpen && mode === 'highlights' ? h(React.Fragment, null,
            h('button', {
              type: 'button',
              className: 'sr-bulk-scrim',
              tabIndex: -1,
              'aria-label': t('close'),
              onClick: function closeColor() { setBulkColorOpen(false); },
            }),
            h('div', { className: 'sr-shelf-bulk-tag sr-bulk-color-dock sr-batch-popover', role: 'dialog' },
              h('div', { className: 'sr-batch-popover-head' },
                h('span', { className: 'sr-batch-popover-title' },
                  h(Icon, { name: 'palette', size: 13 }),
                  h('strong', null, fill(t('bulkColorFor'), { n: selectedHighlightIds.length })),
                ),
                h('button', {
                  type: 'button',
                  className: 'sr-icon-btn sr-batch-popover-close',
                  'aria-label': t('close'),
                  onClick: function closeColor() { setBulkColorOpen(false); },
                }, h(Icon, { name: 'close', size: 12 })),
              ),
              h('div', { className: 'sr-bulk-color-row' },
                HIGHLIGHT_COLORS.map(function dot(color) {
                  return h('button', {
                    key: color.id,
                    type: 'button',
                    className: 'sr-color-filter-dot',
                    style: { background: color.value },
                    'aria-label': t('color' + color.id.charAt(0).toUpperCase() + color.id.slice(1)),
                    title: t('color' + color.id.charAt(0).toUpperCase() + color.id.slice(1)),
                    onClick: function pick() {
                      if (typeof props.onBulkColor !== 'function') return;
                      props.onBulkColor(selectedHighlightIds, color.id);
                      setBulkColorOpen(false);
                    },
                  });
                }),
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
                  h('strong', null, fill(t('bulkTagFor'), { n: selectedHighlightIds.length })),
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
                  maxLength: MAX_NOTE_TAG_LENGTH,
                  autoFocus: true,
                  placeholder: t('bulkTagPlaceholder'),
                  'aria-label': t('bulkTagPlaceholder'),
                  onChange: function change(event) { setBulkTagDraft(event.target.value); },
                  onKeyDown: function keys(event) {
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
                  disabled: !bulkTagDraft.trim(),
                  onClick: function add() { applyBulkTag('add'); },
                }, t('bulkTagAdd')),
                h('button', {
                  type: 'button',
                  className: 'sr-btn sr-btn-sm',
                  disabled: !bulkTagDraft.trim(),
                  onClick: function remove() { applyBulkTag('remove'); },
                }, t('bulkTagRemove')),
              ),
            ),
          ) : null,
          h('div', { className: 'sr-batch-dock-inner' },
            h('div', { className: 'sr-shelf-select-main' },
              h('div', { className: 'sr-shelf-select-summary' },
                h('span', { className: 'sr-shelf-select-dot', 'aria-hidden': 'true' }),
                h('strong', { className: 'sr-shelf-select-count' }, fill(t('selectedCount'), { n: selected.length })),
              ),
              h('div', { className: 'sr-shelf-select-links' },
                h('button', {
                  type: 'button',
                  className: 'sr-link-btn',
                  disabled: mode === 'highlights' ? !filtered.length : !filteredBookmarks.length,
                  onClick: function selectAll() {
                    const keys = mode === 'highlights' ? filtered.map(function key(note) { return 'h:' + note.id; }) : filteredBookmarks.map(function key(item) { return 'b:' + item.id; });
                    setSelected(Array.from(new Set(selected.concat(keys))));
                  },
                }, t('selectAll')),
                h('button', {
                  type: 'button',
                  className: 'sr-link-btn',
                  disabled: mode === 'highlights' ? !filtered.length : !filteredBookmarks.length,
                  onClick: function invert() {
                    const allKeys = mode === 'highlights' ? filtered.map(function key(note) { return 'h:' + note.id; }) : filteredBookmarks.map(function key(item) { return 'b:' + item.id; });
                    setSelected(invertSelectionKeys(allKeys, selected));
                  },
                }, t('invertSelection')),
                h('button', {
                  type: 'button',
                  className: 'sr-link-btn',
                  disabled: !selected.length,
                  onClick: function clear() { setSelected([]); },
                }, t('clearSelection')),
              ),
            ),
            h('div', { className: 'sr-batch-divider', 'aria-hidden': 'true' }),
            h('div', { className: 'sr-shelf-select-actions' },
              h('button', {
                type: 'button',
                className: 'sr-bulk-action',
                'aria-expanded': bulkTagOpen ? 'true' : 'false',
                'data-active': bulkTagOpen ? 'true' : 'false',
                disabled: !selectedHighlightIds.length,
                onClick: function toggleBulkTag() {
                  setBulkTagOpen(!bulkTagOpen);
                  setBulkColorOpen(false);
                  setDeleteConfirm(false);
                  setBulkTagDraft('');
                },
              }, h(Icon, { name: 'tag', size: 13 }), h('span', null, t('bulkTag'))),
              mode === 'highlights' ? h('button', {
                type: 'button',
                className: 'sr-bulk-action',
                'aria-expanded': bulkColorOpen ? 'true' : 'false',
                'data-active': bulkColorOpen ? 'true' : 'false',
                disabled: !selectedHighlightIds.length,
                onClick: function toggleBulkColor() {
                  setBulkColorOpen(!bulkColorOpen);
                  setBulkTagOpen(false);
                  setDeleteConfirm(false);
                },
              }, h(Icon, { name: 'palette', size: 13 }), h('span', null, t('bulkColor'))) : null,
              mode === 'highlights' ? h('button', {
                type: 'button',
                className: 'sr-bulk-action sr-bulk-action-highlight',
                disabled: selectedHighlightIds.length < 2,
                onClick: openCollectionCard,
              }, h(Icon, { name: 'sparkle', size: 13 }), h('span', null, t('cardCollection'))) : null,
              h('button', {
                type: 'button',
                className: 'sr-bulk-action',
                disabled: !selected.length,
                onClick: function copySelectedNotes() {
                  const markdown = selectedAnnotationsMarkdown(selected, props.highlights, props.bookmarks, props.books, t);
                  copyTextToClipboard(markdown).then(function done(ok) {
                    props.showToast(ok ? t('selectedCopied') : t('copyFailed'));
                  });
                },
              }, h(Icon, { name: 'copy', size: 13 }), h('span', null, t('copySelected'))),
              h('button', {
                type: 'button',
                className: 'sr-bulk-action',
                disabled: !selected.length,
                onClick: function exportSelected() {
                  const markdown = selectedAnnotationsMarkdown(selected, props.highlights, props.bookmarks, props.books, t);
                  const ok = downloadMarkdownFile('shiguang-selected-notes-' + dayKey() + '.md', markdown);
                  props.showToast(ok ? t('selectedExported') : t('exportFailed'));
                },
              }, h(Icon, { name: 'download', size: 13 }), h('span', null, t('exportSelected'))),
              h('button', {
                type: 'button',
                className: 'sr-bulk-action sr-bulk-danger',
                'data-danger': 'true',
                disabled: !selected.length,
                onClick: function requestDelete() {
                  setDeleteConfirm(true);
                  setBulkTagOpen(false);
                  setBulkColorOpen(false);
                },
              }, h(Icon, { name: 'trash', size: 13 }), h('span', null, t('deleteSelected'))),
            ),
            h('div', { className: 'sr-batch-divider', 'aria-hidden': 'true' }),
            h('button', {
              type: 'button',
              className: 'sr-bulk-done',
              onClick: exitSelect,
            }, h(Icon, { name: 'check', size: 13 }), h('span', null, t('done'))),
          ),
        ) : null,
        mode === 'highlights'
          ? notes.length
            ? h(React.Fragment, null,
              h('div', { className: 'sr-filter-row' },
                h('button', { type: 'button', className: 'sr-chip', 'aria-pressed': bookFilter === 'all' && !thoughtOnly, onClick: function all() { setBookFilter('all'); setThoughtOnly(false); } },
                  t('notesAll'), h('span', { className: 'sr-chip-count' }, notes.length),
                ),
                h('button', { type: 'button', className: 'sr-chip', 'aria-pressed': thoughtOnly, onClick: function thoughts() { setThoughtOnly(!thoughtOnly); } },
                  t('notesThoughts'), h('span', { className: 'sr-chip-count' }, withThoughts),
                ),
                booksWithNotes.map(function row(book) {
                  return h('button', {
                    key: book.id,
                    type: 'button',
                    className: 'sr-chip',
                    'aria-pressed': bookFilter === book.id,
                    onClick: function pick() { setBookFilter(book.id === bookFilter ? 'all' : book.id); },
                  }, book.title);
                }),
              ),
              h('div', { className: 'sr-color-filter' },
                h('span', { className: 'sr-color-filter-label' }, t('highlightColor')),
                HIGHLIGHT_COLORS.map(function dot(color) {
                  const count = colorCounts[color.id] || 0;
                  const label = t('color' + color.id.charAt(0).toUpperCase() + color.id.slice(1));
                  return h('button', {
                    key: color.id,
                    type: 'button',
                    className: 'sr-color-filter-pill',
                    'aria-pressed': colorFilter === color.id,
                    'aria-label': label + ' (' + count + ')',
                    title: label + ' (' + count + ')',
                    onClick: function pick() { setColorFilter(colorFilter === color.id ? 'all' : color.id); },
                  },
                    h('span', { className: 'sr-color-filter-dot', style: { background: color.value } }),
                    h('span', { className: 'sr-color-filter-name' }, label),
                    h('span', { className: 'sr-color-filter-count' }, count),
                  );
                }),
                colorFilter !== 'all' ? h('button', {
                  type: 'button',
                  className: 'sr-link-btn sr-color-filter-clear',
                  onClick: function clear() { setColorFilter('all'); },
                }, t('searchClear')) : null,
              ),
              noteTagList.length ? h('div', { className: 'sr-tag-filter' },
                h('span', { className: 'sr-tag-filter-label' }, t('noteTags')),
                noteTagList.map(function tagRow(tag) {
                  return h('button', {
                    key: tag,
                    type: 'button',
                    className: 'sr-tag-chip',
                    'aria-pressed': tagFilters.indexOf(tag) >= 0,
                    onClick: function pick() {
                      setTagFilters(function apply(previous) {
                        return previous.indexOf(tag) >= 0
                          ? previous.filter(function keep(item) { return item !== tag; })
                          : previous.concat(tag);
                      });
                    },
                  }, '#' + tag, h('span', { className: 'sr-tag-count' }, tagCounts.get(tag)));
                }),
                tagFilters.length > 1 ? h('button', {
                  type: 'button',
                  className: 'sr-tag-mode',
                  title: t('tagMatchHint'),
                  onClick: function toggleMatch() { setTagMatch(tagMatch === 'all' ? 'any' : 'all'); },
                }, t(tagMatch === 'all' ? 'tagMatchAll' : 'tagMatchAny')) : null,
                tagFilters.length ? h('button', {
                  type: 'button',
                  className: 'sr-link-btn',
                  onClick: function clearTags() { setTagFilters([]); },
                }, t('searchClear')) : null,
                h('button', {
                  type: 'button',
                  className: 'sr-link-btn sr-tag-manage',
                  onClick: function openManager() { setTagManagerOpen(true); },
                }, t('tagManager')),
              ) : null,
              filtered.length
                ? bookGroups
                  ? h('div', { className: 'sr-notes-books' }, bookGroups.map(function book(group) {
                    const closed = collapsedBooks.indexOf(group.bookId) >= 0;
                    return h('section', {
                      key: group.bookId,
                      className: 'sr-notes-book',
                      'data-collapsed': closed ? 'true' : 'false',
                    },
                      h('button', {
                        type: 'button',
                        className: 'sr-notes-book-head',
                        'aria-expanded': closed ? 'false' : 'true',
                        onClick: function toggle() { toggleBookGroup(group.bookId); },
                      },
                        h(Icon, { name: closed ? 'chevron-right' : 'chevron-down', size: 12 }),
                        h('span', { className: 'sr-notes-book-title' }, group.title || '—'),
                        group.author ? h('span', { className: 'sr-notes-book-author' }, group.author) : null,
                        h('span', { className: 'sr-notes-book-count' }, fill(t('notesBookCount'), { n: group.items.length })),
                      ),
                      closed ? null : h('div', { className: 'sr-notes-grid' }, group.items.map(renderCard)),
                    );
                  }))
                  : monthGroups
                  ? h('div', { className: 'sr-notes-months' }, monthGroups.map(function month(group) {
                    return h('section', { key: group.key, className: 'sr-notes-month' },
                      h('div', { className: 'sr-notes-month-head' },
                        h('span', { className: 'sr-notes-month-title' }, fill(t('monthHeading'), { y: group.year, m: group.month })),
                        h('span', { className: 'sr-notes-month-count' }, fill(t('notesMonthCount'), { n: group.items.length })),
                      ),
                      h('div', { className: 'sr-notes-grid' }, group.items.map(renderCard)),
                    );
                  }))
                  : h('div', { className: 'sr-notes-grid' }, cards)
                : query || colorFilter !== 'all' || tagFilters.length
                  ? h(EmptyState, {
                    title: t('notesNoMatch'),
                    text: t('notesNoMatchHint'),
                    action: function clear() { setNoteQuery(''); setColorFilter('all'); setTagFilters([]); },
                    actionLabel: t('searchClear'),
                  })
                  : h(EmptyState, { title: t('notesNoThought'), text: t('notesEmptyText') }),
            )
            : h(EmptyState, { title: t('notesEmptyTitle'), text: t('notesEmptyText') })
          : mode === 'bookmarks'
            ? visibleBookmarks.length
            ? h(React.Fragment, null,
              h('div', { className: 'sr-filter-row' },
                h('button', { type: 'button', className: 'sr-chip', 'aria-pressed': !bookmarkNoteOnly && bookFilter === 'all', onClick: function all() { setBookmarkNoteOnly(false); setBookFilter('all'); } },
                  t('notesBookmarks'), h('span', { className: 'sr-chip-count' }, visibleBookmarks.length),
                ),
                h('button', { type: 'button', className: 'sr-chip', 'aria-pressed': bookmarkNoteOnly, onClick: function noted() { setBookmarkNoteOnly(!bookmarkNoteOnly); } },
                  t('bookmarksWithNotes'), h('span', { className: 'sr-chip-count' }, visibleBookmarks.filter(function noted(item) { return Boolean(item.note); }).length),
                ),
                booksWithBookmarks.map(function row(book) {
                  const bCount = visibleBookmarks.filter(function inBook(bm) { return bm.bookId === book.id; }).length;
                  return h('button', {
                    key: book.id,
                    type: 'button',
                    className: 'sr-chip',
                    'aria-pressed': bookFilter === book.id,
                    onClick: function pick() { setBookFilter(book.id === bookFilter ? 'all' : book.id); },
                  }, book.title, h('span', { className: 'sr-chip-count' }, bCount));
                }),
              ),
              filteredBookmarks.length
              ? h('div', { className: 'sr-bookmarks-grid' },
              filteredBookmarks.map(function bookmark(item) {
                const book = bookMap.get(item.bookId);
                const chapter = book && Array.isArray(book.chapters) ? book.chapters[item.chapterIndex] : null;
                const bookmarkKey = 'b:' + item.id;
                return h('article', {
                  key: item.id,
                  className: 'sr-bookmark-card' + (selectMode ? ' is-selecting' : ''),
                  'data-selected': selectedSet.has(bookmarkKey) ? 'true' : 'false',
                },
                  h('button', {
                    type: 'button',
                    className: 'sr-bookmark-main-btn',
                    onClick: function jump() { props.onJump(item.bookId, item.chapterIndex, item.percent); },
                  },
                    h(Cover, { book: book, t: t, size: 'sm', showBadge: false }),
                    h('div', { className: 'sr-bookmark-card-info' },
                      h('strong', null, book.title),
                      h('span', null, item.chapterTitle || (chapter ? chapter.title : '')),
                      item.excerpt ? h('em', { className: 'sr-bookmark-excerpt' }, renderHits(item.excerpt)) : null,
                      item.note ? h('em', { className: 'sr-bookmark-note' }, renderHits(item.note)) : null,
                      h('small', null, fill(t('bookmarkPage'), { n: item.page }) + ' · ' + dateLabel(item.createdAt)),
                    ),
                    h(Icon, { name: 'chevron-right', size: 14, style: { flex: 'none', opacity: .45 } }),
                  ),
                  h('div', { className: 'sr-bookmark-card-actions' },
                    h('button', {
                      type: 'button',
                      className: 'sr-link-btn',
                      onClick: function editNote() { setBookmarkEditor({ id: item.id, note: item.note || '', bookTitle: book.title, chapterTitle: item.chapterTitle || (chapter ? chapter.title : ''), page: item.page, excerpt: item.excerpt || '' }); },
                    }, t('bookmarkNote')),
                    item.excerpt ? h('button', {
                      type: 'button',
                      className: 'sr-link-btn',
                      onClick: function copy() {
                        copyTextToClipboard(buildQuoteText(item.excerpt, book.title, item.chapterTitle)).then(function done(ok) {
                          props.showToast(ok ? t('quoteCopied') : t('copyFailed'));
                        });
                      },
                    }, t('copyQuote')) : null,
                    h('button', { type: 'button', className: 'sr-link-btn', onClick: function jump() { props.onJump(item.bookId, item.chapterIndex, item.percent); } }, t('jumpToText')),
                    book && props.onOpenBook ? h('button', {
                      type: 'button',
                      className: 'sr-link-btn',
                      onClick: function openDetail() { props.onOpenBook(book); },
                      title: t('viewBookDetail'),
                    }, t('bookDetailShort')) : null,
                    h('button', { type: 'button', className: 'sr-link-btn', 'data-danger': 'true', onClick: function remove() { props.onDeleteBookmark(item.id); } }, t('delete')),
                  ),
                  selectMode ? h('button', {
                    type: 'button',
                    className: 'sr-select-overlay',
                    'aria-pressed': selectedSet.has(bookmarkKey),
                    'aria-label': t('selectItem') + ': ' + book.title,
                    onClick: function select() { toggleSelected(bookmarkKey); },
                  }, h('span', { className: 'sr-select-check' }, selectedSet.has(bookmarkKey) ? h(Icon, { name: 'check', size: 11 }) : null)) : null,
                );
              }),
            )
              : h(EmptyState, { title: t('notesNoMatch'), text: t('notesNoMatchHint'), action: function clear() { setNoteQuery(''); setBookmarkNoteOnly(false); setBookFilter('all'); }, actionLabel: t('searchClear') }),
            )
            : h(EmptyState, { title: t('noBookmarks'), text: t('bookmarksEmptyText') })
          : reviewItems.length
            ? h(React.Fragment, null,
              h('div', { className: 'sr-filter-row' },
                h('button', {
                  type: 'button',
                  className: 'sr-chip',
                  'aria-pressed': reviewRatingFilter === 'all',
                  onClick: function all() { setReviewRatingFilter('all'); },
                }, t('notesAll'), h('span', { className: 'sr-chip-count' }, reviewItems.length)),
                h('button', {
                  type: 'button',
                  className: 'sr-chip',
                  'aria-pressed': reviewRatingFilter === '5',
                  onClick: function stars5() { setReviewRatingFilter(reviewRatingFilter === '5' ? 'all' : '5'); },
                }, t('reviewStars5'), h('span', { className: 'sr-chip-count' }, reviewCounts.stars5)),
                h('button', {
                  type: 'button',
                  className: 'sr-chip',
                  'aria-pressed': reviewRatingFilter === '4',
                  onClick: function stars4() { setReviewRatingFilter(reviewRatingFilter === '4' ? 'all' : '4'); },
                }, t('reviewStars4Plus'), h('span', { className: 'sr-chip-count' }, reviewCounts.stars4Plus)),
                h('button', {
                  type: 'button',
                  className: 'sr-chip',
                  'aria-pressed': reviewRatingFilter === 'hasText',
                  onClick: function withText() { setReviewRatingFilter(reviewRatingFilter === 'hasText' ? 'all' : 'hasText'); },
                }, t('reviewWithText'), h('span', { className: 'sr-chip-count' }, reviewCounts.hasText)),
              ),
              filteredReviews.length
                ? h('div', { className: 'sr-reviews-grid' }, filteredReviews.map(function card(item) {
                  const review = item.review;
                  const stars = '★'.repeat(clamp(Math.round(Number(review.rating) || 0), 0, 5)) + '☆'.repeat(5 - clamp(Math.round(Number(review.rating) || 0), 0, 5));
                  return h('div', { key: item.book.id, className: 'sr-review-card' },
                    h('div', {
                      className: 'sr-review-card-click',
                      role: 'button',
                      tabIndex: 0,
                      onClick: function open() { props.onOpenBook(item.book.id); },
                      onKeyDown: function onKey(e) { if (e.key === 'Enter') props.onOpenBook(item.book.id); },
                    },
                      h(Cover, { book: item.book, t: t, size: 'sm', showBadge: false }),
                      h('div', { className: 'sr-review-card-main' },
                        h('div', { className: 'sr-review-card-head' },
                          h('strong', null, item.book.title),
                          h('span', null, dateLabel(review.updatedAt)),
                        ),
                        review.rating ? h('div', { className: 'sr-review-card-stars' }, stars) : null,
                        review.text ? h('p', null, renderHits(review.text)) : null,
                      ),
                    ),
                    h('div', { className: 'sr-review-card-foot' },
                      h('button', {
                        type: 'button',
                        className: 'sr-review-card-action',
                        title: t('quoteCardShort'),
                        'aria-label': t('quoteCardShort'),
                        onClick: function makeCard(e) {
                          e.stopPropagation();
                          const starsStr = review.rating ? '★'.repeat(clamp(Math.round(Number(review.rating) || 0), 0, 5)) : '';
                          setCardNote({
                            text: review.text || (starsStr ? starsStr + ' (' + t('rating') + ')' : item.book.title),
                            note: review.text && starsStr ? starsStr : '',
                            bookTitle: item.book.title,
                            chapterTitle: t('bookReview'),
                            createdAt: review.updatedAt,
                          });
                        },
                      }, h(Icon, { name: 'image', size: 12 }), h('span', null, t('quoteCardShort'))),
                      h('button', {
                        type: 'button',
                        className: 'sr-review-card-action',
                        title: t('copyReview'),
                        'aria-label': t('copyReview'),
                        onClick: function copy(e) {
                          e.stopPropagation();
                          copyTextToClipboard(buildReviewText(item.book, item.review)).then(function done(ok) {
                            props.showToast(ok ? t('reviewCopied') : t('copyFailed'));
                          });
                        },
                      }, h(Icon, { name: 'copy', size: 12 }), h('span', null, t('copyReview'))),
                    ),
                  );
                }))
                : h(EmptyState, { title: t('notesNoMatch'), text: t('notesNoMatchHint'), action: function clear() { setNoteQuery(''); setReviewRatingFilter('all'); }, actionLabel: t('searchClear') }),
            )
            : h(EmptyState, { title: t('noReviews'), text: t('reviewsEmptyText') }),
        editor ? h('div', {
          className: 'sr-note-editor-backdrop',
          onMouseDown: function backdrop(event) { if (event.target === event.currentTarget) setEditor(null); },
        },
          h('div', { className: 'sr-note-editor', role: 'dialog', 'aria-modal': 'true', 'aria-label': editor.initialNote ? t('editThought') : t('addNote') },
            h('div', { className: 'sr-note-editor-head' },
              h('div', null,
                h('h2', null, editor.initialNote ? t('editThought') : t('addNote')),
                h('p', null, editor.chapterTitle),
              ),
              h('button', { type: 'button', className: 'sr-icon-btn', onClick: function close() { setEditor(null); }, title: t('close'), 'aria-label': t('close') },
                h(Icon, { name: 'close', size: 15 }),
              ),
            ),
            h('p', { className: 'sr-note-editor-quote', style: { '--sr-hl': (HIGHLIGHT_COLORS.find(function find(item) { return item.id === editor.color; }) || HIGHLIGHT_COLORS[0]).value } }, editor.text),
            h('textarea', {
              ref: editorRef,
              className: 'sr-note-editor-textarea',
              value: editor.note,
              placeholder: t('notePlaceholder'),
              'aria-label': t('notePlaceholder'),
              onChange: function change(event) { setEditor(Object.assign({}, editor, { note: event.target.value })); },
              onKeyDown: function keys(event) {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.preventDefault();
                  saveEditor();
                }
              },
            }),
            h('div', { className: 'sr-tag-editor' },
              h('span', { className: 'sr-tag-editor-label' }, t('noteTags')),
              (editor.tags || []).map(function chip(tag) {
                return h('span', { key: tag, className: 'sr-tag-chip' },
                  '#' + tag,
                  h('button', {
                    type: 'button',
                    className: 'sr-tag-remove',
                    'aria-label': t('delete') + ': ' + tag,
                    onClick: function remove() { removeEditorTag(tag); },
                  }, h(Icon, { name: 'close', size: 9 })),
                );
              }),
              (editor.tags || []).length < MAX_NOTE_TAGS ? h('input', {
                className: 'sr-tag-input',
                value: tagDraft,
                maxLength: MAX_NOTE_TAG_LENGTH,
                placeholder: t('noteTagPlaceholder'),
                'aria-label': t('noteTagPlaceholder'),
                onChange: function change(event) { setTagDraft(event.target.value); },
                onKeyDown: function keys(event) {
                  if (event.key === 'Enter' || event.key === '，' || event.key === ',') {
                    event.preventDefault();
                    addEditorTag(tagDraft);
                  } else if (event.key === 'Backspace' && !tagDraft && (editor.tags || []).length) {
                    event.preventDefault();
                    removeEditorTag(editor.tags[editor.tags.length - 1]);
                  }
                },
              }) : h('span', { className: 'sr-tag-editor-hint' }, fill(t('noteTagLimit'), { n: MAX_NOTE_TAGS })),
            ),
            h('div', { className: 'sr-note-editor-tools' },
              h('div', { className: 'sr-note-editor-colors' },
                HIGHLIGHT_COLORS.map(function dot(color) {
                  return h('button', {
                    key: color.id,
                    type: 'button',
                    className: 'sr-note-editor-color',
                    style: { background: color.value },
                    'aria-label': t('color' + color.id.charAt(0).toUpperCase() + color.id.slice(1)),
                    'aria-pressed': editor.color === color.id,
                    onClick: function pick() { setEditor(Object.assign({}, editor, { color: color.id })); },
                  });
                }),
              ),
              h('div', { className: 'sr-note-editor-actions' },
                h('button', { type: 'button', className: 'sr-btn', onClick: function cancel() { setEditor(null); } }, t('cancel')),
                h('button', {
                  type: 'button',
                  className: 'sr-btn sr-btn-primary',
                  disabled: !editor.note.trim() && !editor.initialNote && !(editor.tags || []).length,
                  onClick: saveEditor,
                }, t('save')),
              ),
            ),
          ),
        ) : null,
        bookmarkEditor ? h('div', {
          className: 'sr-note-editor-backdrop',
          onMouseDown: function backdrop(event) { if (event.target === event.currentTarget) setBookmarkEditor(null); },
        },
          h('div', { className: 'sr-note-editor', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('bookmarkNoteTitle') },
            h('div', { className: 'sr-note-editor-head' },
              h('div', null,
                h('h2', null, t('bookmarkNoteTitle')),
                h('p', null, bookmarkEditor.bookTitle + ' · ' + bookmarkEditor.chapterTitle),
              ),
              h('button', { type: 'button', className: 'sr-icon-btn', onClick: function close() { setBookmarkEditor(null); }, title: t('close'), 'aria-label': t('close') },
                h(Icon, { name: 'close', size: 15 }),
              ),
            ),
            bookmarkEditor.excerpt ? h('p', { className: 'sr-note-editor-quote' }, bookmarkEditor.excerpt) : null,
            h('textarea', {
              ref: bookmarkEditorRef,
              className: 'sr-note-editor-textarea',
              value: bookmarkEditor.note,
              maxLength: 500,
              placeholder: t('bookmarkNotePlaceholder'),
              'aria-label': t('bookmarkNotePlaceholder'),
              onChange: function change(event) { setBookmarkEditor(Object.assign({}, bookmarkEditor, { note: event.target.value })); },
              onKeyDown: function keys(event) {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.preventDefault();
                  props.onUpdateBookmark(bookmarkEditor.id, { note: bookmarkEditor.note });
                  setBookmarkEditor(null);
                  props.showToast(t('bookmarkNoteSaved'));
                }
              },
            }),
            h('div', { className: 'sr-note-editor-tools' },
              h('div', null),
              h('div', { className: 'sr-note-editor-actions' },
                h('button', { type: 'button', className: 'sr-btn', onClick: function cancel() { setBookmarkEditor(null); } }, t('cancel')),
                h('button', {
                  type: 'button',
                  className: 'sr-btn sr-btn-primary',
                  onClick: function save() {
                    props.onUpdateBookmark(bookmarkEditor.id, { note: bookmarkEditor.note });
                    setBookmarkEditor(null);
                    props.showToast(t('bookmarkNoteSaved'));
                  },
                }, t('save')),
              ),
            ),
          ),
        ) : null,
        tagManagerOpen ? h(TagManagerDialog, {
          t: t,
          tags: sortedTags,
          counts: tagCounts,
          onRename: handleTagRename,
          onDelete: handleTagDelete,
          onClose: function close() { setTagManagerOpen(false); },
        }) : null,
        collectionCard ? h(QuoteCollectionDialog, {
          t: t,
          items: collectionCard.items,
          title: collectionCard.title,
          caption: collectionCard.caption,
          showToast: props.showToast,
          onClose: function close() { setCollectionCard(null); },
        }) : null,
        cardNote ? h(QuoteCardDialog, {
          t: t,
          text: cardNote.text,
          note: cardNote.note,
          bookTitle: cardNote.bookTitle,
          chapterTitle: cardNote.chapterTitle,
          date: cardNote.createdAt ? dateLabel(cardNote.createdAt) : undefined,
          showToast: props.showToast,
          onClose: function close() { setCardNote(null); },
        }) : null,
      );
    }
