/**
 * Host half of the Shiguang Reader bundle.
 *
 * The Client module owns the shelf and the reader UI; this half reads what the
 * browser mirrors to disk — `library.json` (metadata) plus `books/<id>.json`
 * (bodies) inside the chosen library folder, or an exported backup JSON — and
 * offers it to the Agent: search, read, notes, bookmarks, stats.
 *
 * There is no database and no build step: the folder is already the source of
 * truth, and a snapshot of it is cheaper to read than to mirror and keep fresh.
 * `@deepseek-ai/dsh-tools` is optional at load time: when it cannot be imported
 * the plugin still loads, it just registers nothing.
 */
import path from 'node:path';
import { indexStatus, pruneIndexes, queryBookmarksIndex, queryNotesIndex, queryShelfIndex, queryStatsIndex, searchLibraryIndex } from './hostindex.js';
import {
  chaptersOf,
  collectBookmarks,
  collectNotes,
  collectShelfBooks,
  extractStats,
  filterBookmarks,
  filterNotes,
  filterShelfBooks,
  findBook,
  findLatestBackup,
  inspectLibraryDir,
  formatBytes,
  readBackup,
  readLibraryDir,
  readSettings,
  renderBookmarks,
  renderChapter,
  renderNotes,
  renderOutline,
  renderReaderStats,
  renderSearchHits,
  renderShelfBooks,
  searchBooks,
  searchLibraryDocs,
  writeSettings,
} from './hostlib.js';

export const name = 'shiguang-reader';

// `tools` is the only service this half needs; a profile without it never
// instantiates the plugin at all.
export const inject = ['tools'];

async function loadDefineTool() {
  try {
    const mod = await import('@deepseek-ai/dsh-tools');
    return typeof mod.defineTool === 'function' ? mod.defineTool : null;
  } catch (error) {
    return null;
  }
}

function textResult() {
  return {
    schema: { type: 'string' },
    render: function render(_args, value) {
      return [{ type: 'text', text: String(value) }];
    },
  };
}

function firstText() {
  for (let index = 0; index < arguments.length; index += 1) {
    const value = arguments[index];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

/**
 * Builds the six tool definitions. `tool` is `defineTool` in production and an
 * identity function in tests — `defineTool` is what converts the parameter DSL
 * below into the JSON Schema the registry stores.
 */
export function defineReaderTools(tool, options) {
  const settings = options && typeof options === 'object' ? options : {};
  const indexEnabled = settings.index !== false;

  // Remembered settings are read per call so a change applies without a reload.
  function dirFrom(argDir) {
    const remembered = readSettings();
    return firstText(argDir, remembered.libraryDir, settings.libraryDir);
  }

  // One loader for every tool: the folder when there is one, otherwise a backup
  // JSON. Both produce the same state shape the reader exports.
  function loadLibrary(args) {
    const dir = dirFrom(args.libraryDir);
    if (dir) {
      const read = readLibraryDir(dir, { bodies: false });
      return { source: 'snapshot', where: read.snapshot, state: read.state, dir: dir };
    }
    const wanted = firstText(args.backupPath);
    const found = wanted ? { path: wanted } : findLatestBackup();
    if (!found) throw new Error('no-data-source');
    return { source: 'backup', where: found.path, state: readBackup(found.path), dir: '' };
  }

  function booksOf(library) {
    return Array.isArray(library.state.customBooks) ? library.state.customBooks : [];
  }

  /** Every tool answers "why not" in words instead of throwing raw codes. */
  function explain(error, dir) {
    const code = error && error.message;
    if (code === 'no-data-source') {
      return '没有找到书库目录或备份文件。两种做法：在书架底部指定「书库目录」（之后会自动写 library.json），或者先「导出 JSON 备份」并传入 backupPath。';
    }
    if (code === 'library-snapshot-missing') {
      return `书库目录里没有 library.json：${dir || '（未指定）'}。先在阅读器书架底部选同一个文件夹，快照才会写出来。`;
    }
    if (code === 'not-a-reader-backup') return '这个文件不是拾光阅读的备份或快照。';
    return null;
  }

  const search = tool({
    name: 'reading_search',
    description:
      'Search the text of every book in the library and return the matching chapters with a snippet. '
      + 'Works straight off the library folder (or an exported backup) — no build step. '
      + 'Use it when the user asks which book or chapter mentions something.',
    parameters: {
      query: { type: 'string', required: true, description: 'Text to look for. Case-insensitive substring match.' },
      limit: { type: 'number', description: 'Max chapters to return, default 20, max 200.' },
      libraryDir: { type: 'string', description: 'Library folder to read. Defaults to the remembered folder.' },
      backupPath: { type: 'string', description: 'Backup JSON to search instead, when no folder is set.' },
    },
    output: textResult(),
    async execute(args) {
      const query = firstText(args.query);
      if (!query) return '请给出要搜索的内容。';
      const dir = dirFrom(args.libraryDir);
      try {
        if (dir) {
          let indexed = null;
          try {
            indexed = await searchLibraryIndex(dir, query, args.limit);
          } catch (error) {
            // The index is disposable; any failure belongs to the cache, not the
            // book. Fall through to the snapshot scan without surfacing it.
            indexed = null;
          }
          if (indexed) return renderSearchHits(indexed);
          return renderSearchHits(searchLibraryDocs(dir, query, args.limit));
        }
        const library = loadLibrary(args);
        return renderSearchHits(Object.assign(searchBooks(booksOf(library), query, args.limit), library));
      } catch (error) {
        const words = explain(error, dir);
        if (words) return words;
        throw error;
      }
    },
  });

  const bookTool = tool({
    name: 'reading_book_read',
    description:
      'Read a book from the reader library. Without chapterIndex it returns the outline (chapter list with sizes); '
      + 'with chapterIndex (1-based) it returns that chapter text, truncated to maxChars. A chapter with pictures ends '
      + 'with the picture files\' absolute paths, ready to open. '
      + 'Imported books need the library folder.',
    parameters: {
      title: { type: 'string', required: true, description: 'Book id or (partial) title.' },
      chapterIndex: { type: 'number', description: '1-based chapter number. Omit for the outline.' },
      maxChars: { type: 'number', description: 'Chapter text cap in characters. Default 6000, hard max 20000. Any smaller positive value is honoured as given.' },
      libraryDir: { type: 'string', description: 'Library folder for imported books. Defaults to the remembered folder.' },
    },
    output: textResult(),
    async execute(args) {
      const dir = dirFrom(args.libraryDir);
      try {
        const book = findBook(args.title, dir);
        const chapters = chaptersOf(book, dir);
        if (args.chapterIndex === undefined || args.chapterIndex === null) return renderOutline(book, chapters);
        return renderChapter(book, chapters, args.chapterIndex, args.maxChars, dir || '');
      } catch (error) {
        const code = error && error.message;
        if (code === 'book-required') return '请给出书名或 id。';
        if (code === 'book-not-found') {
          return `没找到《${args.title}》。导入的书需要先指定书库目录（或让 reading_library_config 记住它）。`;
        }
        if (code === 'book-ambiguous') {
          const candidates = Array.isArray(error.candidates) ? error.candidates : [];
          return `书名不唯一，换更完整的标题或 id：${candidates.join(' / ')}`;
        }
        if (code === 'chapter-range') return '章节序号超出范围：先不带 chapterIndex 调一次，看目录里的章号。';
        if (code === 'chapter-missing') return '这本书没有读到正文：磁盘上的正文文件可能已被删除，重新导入一次即可。';
        const words = explain(error, dir);
        if (words) return words;
        throw error;
      }
    },
  });

  const notesTool = tool({
    name: 'reading_notes',
    description:
      'List the highlights and thoughts the reader wrote, newest first. Filter by a keyword (matched against both the '
      + 'highlighted sentence and the note), by book, or by tag. Reads the library folder, or an exported backup.',
    parameters: {
      query: { type: 'string', description: 'Keyword matched against the highlighted text and the note.' },
      book: { type: 'string', description: 'Book id, or part of its title.' },
      tag: { type: 'string', description: 'Only notes carrying this exact tag.' },
      limit: { type: 'number', description: 'How many notes to return, default 20, max 200 (newest first).' },
      libraryDir: { type: 'string', description: 'Library folder to read. Defaults to the remembered folder.' },
      backupPath: { type: 'string', description: 'Backup JSON to read instead, when no folder is set.' },
    },
    output: textResult(),
    async execute(args) {
      const dir = dirFrom(args.libraryDir);
      try {
        if (indexEnabled && dir) {
          let indexed = null;
          try { indexed = await queryNotesIndex(dir, args); } catch (error) { indexed = null; }
          if (indexed) return renderNotes(indexed.result, indexed.meta);
        }
        const library = loadLibrary(args);
        const notes = collectNotes(library.state);
        return renderNotes(filterNotes(notes, args), Object.assign({ notes: notes }, library));
      } catch (error) {
        const words = explain(error, dir);
        if (words) return words;
        throw error;
      }
    },
  });

  const bookmarksTool = tool({
    name: 'reading_bookmarks',
    description:
      'List the bookmarks the reader placed, newest first, with page, chapter and excerpt. '
      + 'Filter by a keyword (the excerpt or the note attached) or by book.',
    parameters: {
      query: { type: 'string', description: 'Keyword matched against the excerpt and its note.' },
      book: { type: 'string', description: 'Book id, or part of its title.' },
      withNote: { type: 'boolean', description: 'Only bookmarks that carry a note.' },
      limit: { type: 'number', description: 'How many bookmarks to return, default 20, max 200.' },
      libraryDir: { type: 'string', description: 'Library folder to read. Defaults to the remembered folder.' },
      backupPath: { type: 'string', description: 'Backup JSON to read instead, when no folder is set.' },
    },
    output: textResult(),
    async execute(args) {
      const dir = dirFrom(args.libraryDir);
      try {
        if (indexEnabled && dir) {
          let indexed = null;
          try { indexed = await queryBookmarksIndex(dir, args); } catch (error) { indexed = null; }
          if (indexed) return renderBookmarks(indexed.result, indexed.meta);
        }
        const library = loadLibrary(args);
        const bookmarks = collectBookmarks(library.state);
        return renderBookmarks(filterBookmarks(bookmarks, args), Object.assign({ bookmarks: bookmarks }, library));
      } catch (error) {
        const words = explain(error, dir);
        if (words) return words;
        throw error;
      }
    },
  });

  const shelfTool = tool({
    name: 'reading_shelf',
    description:
      'List or search books on the user reading shelf: title, author, reading status (reading, finished, wishlist, shelved, unread), '
      + 'progress percentage, rating, review, tags, and reading duration. Reads from the library folder or an exported backup.',
    parameters: {
      query: { type: 'string', description: 'Filter by book title or author.' },
      status: {
        type: 'string',
        enum: ['all', 'reading', 'finished', 'wishlist', 'shelved', 'unread'],
        description: 'Filter by reading status. Defaults to "all".',
      },
      tag: { type: 'string', description: 'Filter by custom tag (e.g. "文学", "哲学").' },
      minRating: { type: 'number', description: 'Filter by minimum star rating (1-5, e.g. 5 for 5-star books).' },
      hasReview: { type: 'boolean', description: 'Filter only books with written reviews/comments.' },
      limit: { type: 'number', description: 'Maximum books to return (1-100, default 20).' },
      libraryDir: { type: 'string', description: 'Library folder to read. Defaults to the remembered folder.' },
      backupPath: { type: 'string', description: 'Backup JSON to read instead, when no folder is set.' },
    },
    output: textResult(),
    async execute(args) {
      const dir = dirFrom(args.libraryDir);
      try {
        if (indexEnabled && dir) {
          let indexed = null;
          try { indexed = await queryShelfIndex(dir, args); } catch (error) { indexed = null; }
          if (indexed) return indexed;
        }
        const library = loadLibrary(args);
        const allBooks = collectShelfBooks(library.state);
        const filtered = filterShelfBooks(allBooks, args);
        return renderShelfBooks(filtered, library);
      } catch (error) {
        const words = explain(error, dir);
        if (words) return words;
        throw error;
      }
    },
  });

  const statsTool = tool({
    name: 'reading_stats',
    description:
      'Show reading statistics: today, last 7 days versus the 7 before, streak, total hours, shelf status breakdown, '
      + 'most-read books, note and bookmark counts. Reads the library folder, or an exported backup.',
    parameters: {
      libraryDir: { type: 'string', description: 'Library folder to read. Defaults to the remembered folder.' },
      backupPath: { type: 'string', description: 'Backup JSON to read instead, when no folder is set.' },
    },
    output: textResult(),
    async execute(args) {
      const dir = dirFrom(args.libraryDir);
      try {
        if (indexEnabled && dir) {
          let indexed = null;
          try { indexed = await queryStatsIndex(dir); } catch (error) { indexed = null; }
          if (indexed) return indexed;
        }
        const library = loadLibrary(args);
        return renderReaderStats(extractStats(library.state), library);
      } catch (error) {
        const words = explain(error, dir);
        if (words) return words;
        throw error;
      }
    },
  });

  const configTool = tool({
    name: 'reading_library_config',
    description:
      'Show or remember where the Shiguang Reader library folder is (the 书库目录 chosen in the reader). '
      + 'Remembering it once means every later call needs no path argument.',
    parameters: {
      libraryDir: { type: 'string', description: 'Absolute path of the reader library folder to remember. Must already exist.' },
      forget: { type: 'boolean', description: 'Clear the remembered folder.' },
      pruneIndexes: { type: 'boolean', description: 'Remove index caches whose source library folder no longer exists.' },
    },
    output: textResult(),
    async execute(args) {
      const patch = {};
      const notes = [];
      if (args.pruneIndexes === true) {
        const pruned = await pruneIndexes();
        if (!pruned.available) notes.push('当前宿主不支持 SQLite，索引缓存无需清理');
        else notes.push(pruned.removed ? `已清理 ${pruned.removed} 个失效索引缓存` : '没有需要清理的失效索引缓存');
      }
      if (args.forget === true) {
        patch.libraryDir = '';
        notes.push('已清空记住的路径');
      }
      const wantedDir = firstText(args.libraryDir);
      if (wantedDir) {
        const looked = inspectLibraryDir(wantedDir);
        if (!looked.exists) return `目录不存在：${wantedDir}`;
        patch.libraryDir = wantedDir;
        notes.push(looked.snapshot
          ? `已记住书库目录：${wantedDir}（含 library.json、${looked.books} 份正文）`
          : `已记住目录：${wantedDir}，但里面没有 library.json —— 先在阅读器书架底部选同一个文件夹，快照才会写出来`);
      }
      if (Object.keys(patch).length) writeSettings(patch);

      const saved = readSettings();
      const folder = saved.libraryDir || firstText(settings.libraryDir);
      const looked = folder ? inspectLibraryDir(folder) : null;
      const lines = notes.slice();
      lines.push(`书库目录：${folder || '（未设置，调用时需要显式传 libraryDir 或 backupPath）'}`);
      if (looked && looked.exists) {
        lines.push(`目录状态：library.json ${looked.snapshot ? '有' : '无'}、正文 ${looked.books} 份${looked.pictures ? `、插图 ${looked.pictures} 张` : ''}`);
        const sizes = looked.bytes;
        if (sizes && sizes.total) {
          const parts = [`正文 ${formatBytes(sizes.bodies)}`];
          if (sizes.sources) parts.push(`原始文件 ${formatBytes(sizes.sources)}`);
          if (sizes.pictures) parts.push(`图片 ${formatBytes(sizes.pictures)}`);
          if (sizes.snapshot) parts.push(`快照 ${formatBytes(sizes.snapshot)}`);
          lines.push(`占用空间：共 ${formatBytes(sizes.total)}（${parts.join('、')}）`);
        }
        if (!indexEnabled) {
          lines.push('检索索引：已禁用（插件配置 index: false），工具直接读快照');
        } else {
          const index = await indexStatus(folder);
          if (!index || index.available === false) lines.push('检索索引：不可用（当前宿主不支持 node:sqlite / FTS5）');
          else if (!index.built) lines.push('检索索引：尚未建立（首次检索时自动建立）');
          else lines.push(`检索索引：${index.stale ? '已过期，将在下次检索时重建' : '已就绪'} · ${index.books} 本书 / ${index.notes} 条笔记 / ${index.bookmarks} 个书签 · ${formatBytes(index.bytes)}`);
        }
      }
      lines.push('设置保存在宿主侧的 settings.json，不写进插件包，升级不会丢。');
      return lines.join('\n');
    },
  });

  return [search, bookTool, notesTool, bookmarksTool, shelfTool, statsTool, configTool];
}

export async function apply(ctx, config) {
  const defineTool = await loadDefineTool();
  if (!defineTool) {
    // Registering a spec without defineTool would install a tool whose
    // parameters are still the DSL instead of JSON Schema — worse than none.
    ctx.logger?.warn?.('[shiguang-reader] @deepseek-ai/dsh-tools unavailable; reading tools not registered');
    return;
  }
  defineReaderTools(defineTool, config).forEach(function register(spec) {
    try {
      ctx.tools.register(spec);
    } catch (error) {
      ctx.logger?.warn?.(`[shiguang-reader] failed to register ${spec.name}: ${error && error.message}`);
    }
  });
}
