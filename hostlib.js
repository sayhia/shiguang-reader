/**
 * Host half: reads the reader library out of the folder the browser writes to.
 *
 * The library itself lives in browser storage, so the Host cannot see it. When
 * the reader has a 书库目录 it mirrors every save into `library.json` there, and
 * each imported book into a stem-shared trio:
 *   books/人间词话--local-3f9a.txt       the body as plain text, one `# title` per chapter
 *   books/人间词话--local-3f9a.epub      the original file (an EPUB keeps its pictures here)
 *   books/人间词话--local-3f9a.assets/   the pictures the text refers to
 * A picture shows up in the text as its own paragraph, `![caption](img-1-1.png)`;
 * it is a marker, not prose, so search and chapter text skip it. Libraries written
 * before v1.46 keep `books/<id>.json` and are still read. An exported backup JSON
 * carries the same shape. That is all this file needs — no database, no build step.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
// Built-in books have been removed. All books are now imported by the user.

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function asText(value, limit) {
  if (typeof value !== 'string') return '';
  return limit > 0 ? value.slice(0, limit) : value;
}

function asNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function boolInt(value) {
  return value === true || value === 1 ? 1 : 0;
}

function localDay(ms) {
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return null;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function defaultSettingsPath() {
  const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
  return path.join(home, 'storages', 'shiguang-reader', 'settings.json');
}

const SETTING_KEYS = ['libraryDir'];

/** Remembered host-side settings, so the folder path is typed once instead of every call. */
export function readSettings(settingsPath) {
  const file = settingsPath || defaultSettingsPath();
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    const out = {};
    if (parsed && typeof parsed === 'object') {
      SETTING_KEYS.forEach(function keep(key) {
        if (typeof parsed[key] === 'string' && parsed[key].trim()) out[key] = parsed[key].trim();
      });
    }
    return out;
  } catch (error) {
    return {};
  }
}

export function writeSettings(patch, settingsPath) {
  const file = settingsPath || defaultSettingsPath();
  const next = Object.assign(readSettings(file), patch || {});
  SETTING_KEYS.forEach(function clean(key) {
    if (typeof next[key] !== 'string' || !next[key].trim()) delete next[key];
  });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // Write beside the target then rename: a crash mid-write must not leave half a JSON file.
  const temp = file + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(next, null, 2) + '\n');
  fs.renameSync(temp, file);
  return next;
}

export function defaultBackupDirs() {
  return [path.join(os.homedir(), 'Downloads'), path.join(os.homedir(), 'Desktop')];
}

/** A cheap shape check: a reader backup always carries at least one library table. */
export function looksLikeBackup(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = ['customBooks', 'progress', 'highlights', 'bookmarks', 'stats', 'sessions', 'settings'];
  return keys.some(function present(key) { return key in value; });
}

/**
 * Finds the newest reader backup in the usual download locations. Returns null
 * instead of throwing so a caller can fall back to an explicit path.
 */
export function findLatestBackup(dirs) {
  const roots = asArray(dirs).length ? dirs : defaultBackupDirs();
  let best = null;
  roots.forEach(function scan(root) {
    let names = [];
    try {
      names = fs.readdirSync(root);
    } catch (error) {
      return;
    }
    names.forEach(function check(name) {
      if (!/\.json$/i.test(name)) return;
      if (!/shiguang|拾光|reader|book/i.test(name)) return;
      const full = path.join(root, name);
      let stat = null;
      try {
        stat = fs.statSync(full);
      } catch (error) {
        return;
      }
      if (!stat.isFile()) return;
      if (!best || stat.mtimeMs > best.mtimeMs) best = { path: full, mtimeMs: stat.mtimeMs, size: stat.size };
    });
  });
  return best;
}

export function readBackup(backupPath) {
  const text = fs.readFileSync(backupPath, 'utf8');
  const parsed = JSON.parse(text);
  const state = parsed && typeof parsed === 'object' && parsed.state && typeof parsed.state === 'object' ? parsed.state : parsed;
  if (!looksLikeBackup(state)) throw new Error('not-a-reader-backup');
  return state;
}

// Mirrors the client's file naming so disk-backed bodies can be found again.
// A folder the reader wrote keeps a readable body — `人间词话--local-3f9a.txt`, plain
// text, one `# title` line per chapter — and older libraries keep `books/<id>.json`.
function bookFileName(id) {
  return String(id || '').replace(/[^A-Za-z0-9._-]/g, '_') + '.json';
}

function bodySuffix(id) {
  return '--' + String(id || '').replace(/[^A-Za-z0-9._-]/g, '_') + '.txt';
}

function assetsSuffix(id) {
  return '--' + String(id || '').replace(/[^A-Za-z0-9._-]/g, '_') + '.assets';
}

/**
 * Absolute folder holding one book's pictures — the `.assets/` directory the
 * client writes next to the text. Empty when the folder is unknown or the book
 * has no pictures, so callers never print a path that does not exist.
 */
function assetsDirFor(booksDir, id) {
  if (!booksDir) return '';
  const suffix = assetsSuffix(id);
  try {
    const found = fs.readdirSync(booksDir).find(function match(name) {
      return name.endsWith(suffix);
    });
    if (!found) return '';
    const full = path.join(booksDir, found);
    return fs.statSync(full).isDirectory() ? full : '';
  } catch (error) {
    return '';
  }
}

function bodyFileFor(booksDir, id) {
  let names = [];
  try {
    names = fs.readdirSync(booksDir);
  } catch (error) {
    return '';
  }
  const suffix = bodySuffix(id);
  return names.find(function match(name) {
    return name.endsWith(suffix);
  }) || '';
}

// A picture the reader placed in the text: `![caption](img-1-1.png)` on its own
// paragraph. The client draws it from the book's `.assets/` folder; here it is a
// marker to skip — it is not prose, and printing it would only confuse a reader.
const PICTURE_LINE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

function pictureOf(text) {
  const match = PICTURE_LINE.exec(String(text == null ? '' : text).trim());
  return match ? { alt: match[1], name: match[2] } : null;
}

/** The chapter as prose: picture markers removed, one paragraph per line. */
function proseOf(chapter) {
  return asArray(chapter && chapter.paragraphs).filter(function keep(part) {
    return typeof part === 'string' && !pictureOf(part);
  }).join('\n');
}

/** File names of the pictures this chapter shows, in reading order. */
function picturesOf(chapter) {
  const names = [];
  asArray(chapter && chapter.paragraphs).forEach(function each(part) {
    const picture = typeof part === 'string' ? pictureOf(part) : null;
    if (picture && names.indexOf(picture.name) < 0) names.push(picture.name);
  });
  return names;
}

// The exact inverse of the client's bookBodyText: `# heading` opens a chapter,
// paragraphs are separated by a blank line.
function parseBodyText(text, ids) {
  const raw = String(text || '').replace(/\r\n?/g, '\n').trim();
  if (!raw) return [];
  const known = asArray(ids);
  const collected = [];
  let current = null;
  raw.split('\n').forEach(function each(line) {
    const heading = /^#\s+(.+?)\s*$/.exec(line);
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
  return chapters.map(function identify(chapter, index) {
    const knownId = known[index];
    return {
      id: typeof knownId === 'string' && knownId ? knownId : 'imp-c' + (index + 1),
      title: chapter.title,
      paragraphs: chapter.paragraphs,
    };
  });
}

// One book's chapters, newest format first, then the JSON written by older versions.
function readBookBody(booksDir, book) {
  const readable = bodyFileFor(booksDir, book && book.id);
  if (readable) {
    const text = fs.readFileSync(path.join(booksDir, readable), 'utf8');
    const chapters = parseBodyText(text, book.chapterIds);
    if (chapters.length) return chapters;
  }
  const parsed = JSON.parse(fs.readFileSync(path.join(booksDir, bookFileName(book.id)), 'utf8'));
  return asArray(parsed && parsed.chapters);
}

// Size of one regular file; anything unreadable or not a file weighs nothing.
function fileBytes(file) {
  try {
    const stat = fs.statSync(file);
    return stat.isFile() ? stat.size : 0;
  } catch (error) {
    return 0;
  }
}

/** Human-readable size for tool replies: 0 B, 812 B, 3.4 KB, 12.1 MB, 1.20 GB. */
export function formatBytes(value) {
  const size = Number(value) > 0 ? Number(value) : 0;
  if (size < 1024) return `${Math.round(size)} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let scaled = size / 1024;
  let unit = 0;
  while (scaled >= 1024 && unit < units.length - 1) {
    scaled /= 1024;
    unit += 1;
  }
  return `${scaled >= 100 ? scaled.toFixed(0) : scaled.toFixed(unit >= 2 ? 2 : 1)} ${units[unit]}`;
}

/** Cheap look at a folder before it is remembered: does it look like a reader library? */
export function inspectLibraryDir(dir) {
  const target = String(dir || '');
  const result = {
    dir: target, exists: false, snapshot: false, books: 0, pictures: 0,
    bytes: { snapshot: 0, bodies: 0, sources: 0, pictures: 0, total: 0 },
  };
  try {
    result.exists = fs.statSync(target).isDirectory();
  } catch (error) {
    return result;
  }
  result.snapshot = fs.existsSync(path.join(target, 'library.json'));
  if (result.snapshot) result.bytes.snapshot = fileBytes(path.join(target, 'library.json'));
  let names = [];
  try {
    names = fs.readdirSync(path.join(target, 'books'));
  } catch (error) {
    names = [];
  }
  // One book is a `.txt` body (or the `.json` older versions wrote) plus, if it
  // had pictures, an `.assets` folder beside it. Folders are not books.
  result.books = names.filter(function body(name) {
    return /\.(?:txt|json)$/i.test(name);
  }).length;
  names.forEach(function weigh(name) {
    const full = path.join(target, 'books', name);
    if (/\.assets$/i.test(name)) {
      try {
        const files = fs.readdirSync(full);
        result.pictures += files.length;
        files.forEach(function picture(file) { result.bytes.pictures += fileBytes(path.join(full, file)); });
      } catch (error) {
        /* A folder we cannot list simply contributes nothing. */
      }
    } else if (/\.(?:txt|json)$/i.test(name)) {
      result.bytes.bodies += fileBytes(full);
    } else if (/\.epub$/i.test(name)) {
      result.bytes.sources += fileBytes(full);
    }
  });
  const sizes = result.bytes;
  sizes.total = sizes.snapshot + sizes.bodies + sizes.sources + sizes.pictures;
  return result;
}

/**
 * Reads a library folder the reader wrote: `library.json` holds the metadata
 * snapshot, `books/*.txt` the readable bodies (or `books/<id>.json` in libraries
 * written before v1.46). Bodies are only needed for chapter sizes, so a missing or
 * unreadable file degrades to fewer rows.
 */export function readLibraryDir(dir, options) {
  const mergeBodies = !(options && options.bodies === false);
  const snapshot = path.join(dir, 'library.json');
  if (!fs.existsSync(snapshot)) throw new Error('library-snapshot-missing');
  const state = JSON.parse(fs.readFileSync(snapshot, 'utf8'));
  if (!looksLikeBackup(state)) throw new Error('not-a-reader-backup');

  const booksDir = path.join(dir, 'books');
  let bodies = 0;
  if (mergeBodies) {
    asArray(state.customBooks).forEach(function each(book) {
      if (!book || typeof book.id !== 'string') return;
      if (Array.isArray(book.chapters) && book.chapters.length) return;
      try {
        const chapters = readBookBody(booksDir, book);
        if (!chapters.length) return;
        book.chapters = chapters;
        bodies += 1;
      } catch (error) {
        /* Metadata still builds; this book just contributes no chapter rows. */
      }
    });
  }
  return { state: state, snapshot: snapshot, bodies: bodies };
}

// ---------------------------------------------------------------------------
// Reading a book back out (Agent-facing): imported books live in the library folder.
// ---------------------------------------------------------------------------

function chapterChars(chapter) {
  return asArray(chapter && chapter.paragraphs).reduce(function sum(total, part) {
    // Picture markers are not text the reader reads, so they are not counted.
    if (typeof part !== 'string' || pictureOf(part)) return total;
    return total + part.length;
  }, 0);
}

function matchBy(entries, wanted) {
  const lower = wanted.toLowerCase();
  const byId = entries.filter(function id(entry) { return entry.id === wanted; });
  if (byId.length) return byId;
  const exact = entries.filter(function title(entry) { return String(entry.title || '').toLowerCase() === lower; });
  if (exact.length) return exact;
  return entries.filter(function partial(entry) { return String(entry.title || '').toLowerCase().indexOf(lower) >= 0; });
}

/**
 * Resolves `selector` (id or title, exact first then unique substring) to one
 * book among the imported books in the library folder.
 */
export function findBook(selector, dir) {
  const wanted = String(selector || '').trim();
  if (!wanted) throw new Error('book-required');

  if (!dir) throw new Error('book-not-found');
  const state = readLibraryDir(dir, { bodies: false }).state;
  const customs = asArray(state.customBooks).map(function entry(book) {
    return {
      id: String(book.id),
      title: asText(book.title, 120),
      author: asText(book.author, 80),
      source: 'local',
      chaptersInFs: book.chaptersInFs === true,
      chapters: asArray(book.chapters),
    };
  });
  const customHits = matchBy(customs, wanted);
  if (customHits.length === 1) return customHits[0];
  if (customHits.length > 1) throw ambiguous(customHits);
  throw new Error('book-not-found');
}

function ambiguous(hits) {
  const error = new Error('book-ambiguous');
  error.candidates = hits.map(function title(hit) { return hit.title; });
  return error;
}

/** Loads chapter bodies, from the book itself or from its file in the folder. */
export function chaptersOf(book, dir) {
  if (!book) return [];
  if (Array.isArray(book.chapters) && book.chapters.length) return book.chapters;
  if (!dir || book.chaptersInFs !== true) return [];
  try {
    return asArray(readBookBody(path.join(dir, 'books'), book));
  } catch (error) {
    return [];
  }
}

export function renderOutline(book, chapters) {
  const total = chapters.reduce(function sum(all, chapter) { return all + chapterChars(chapter); }, 0);
  const rows = chapters.map(function row(chapter, index) {
    return [String(index + 1), asText(chapter.title, 120) || '第 ' + (index + 1) + ' 节', String(chapterChars(chapter))];
  });
  const head = `《${book.title}》 ${book.author || ''} · 本地导入`;
  if (!chapters.length) {
    return [head, '这本书的正文没有读到：可能没有指定书库目录，或者磁盘上的正文文件已被删除。'].join('\n');
  }
  return [
    head,
    `共 ${chapters.length} 章 · ${total} 字`,
    renderTable(['章', '标题', '字数'], rows, rows.length, rows.length),
    '要读某一章，再调用一次并传 chapterIndex（从 1 开始）。',
  ].join('\n');
}

export function renderChapter(book, chapters, chapterNumber, maxChars, libraryDir) {
  const index = Math.round(asNumber(chapterNumber, 0)) - 1;
  if (!chapters.length) throw new Error('chapter-missing');
  if (!Number.isFinite(index) || index < 0 || index >= chapters.length) throw new Error('chapter-range');
  const chapter = chapters[index];
  const text = proseOf(chapter);
  // Honour the caller's number instead of clamping it up to a "sensible" floor:
  // shipped chapters here are 195-436 chars, so any floor above that would make
  // maxChars a no-op for exactly the books people read most.
  const requested = Math.round(asNumber(maxChars, 6000));
  const cap = requested > 0 ? Math.min(requested, 20000) : 6000;
  const clipped = text.length > cap;
  const pictures = picturesOf(chapter);
  const head = `《${book.title}》 ${asText(chapter.title, 120) || '第 ' + (index + 1) + ' 节'}（第 ${index + 1}/${chapters.length} 章）`;
  const lines = [head, clipped ? text.slice(0, cap) + `\n…（已截断，本章共 ${text.length} 字）` : text];
  // Say the pictures exist rather than dropping them silently: the files are on
  // disk next to the text, so a reader can open them even from here.
  if (pictures.length) {
    // Give the real path: the files sit on disk next to the text, so a caller can
    // open or quote them instead of being told vaguely "in the .assets folder".
    const assetsDir = assetsDirFor(libraryDir ? path.join(libraryDir, 'books') : '', book && book.id);
    const shown = pictures.slice(0, 8).map(function full(name) {
      return assetsDir ? path.join(assetsDir, name) : name;
    }).join('、') + (pictures.length > 8 ? ' 等' : '');
    lines.push(`（本章还有 ${pictures.length} 张插图：${shown}）`);
  }
  return lines.join('\n');
}

function chapterTitles(state) {
  const byBook = new Map();
  asArray(state.customBooks).forEach(function each(book) {
    if (!book || typeof book.id !== 'string') return;
    const map = new Map();
    asArray(book.chapters).forEach(function chapter(item, index) {
      if (!item || typeof item !== 'object') return;
      const key = typeof item.id === 'string' ? item.id : String(index);
      map.set(key, asText(item.title, 160));
    });
    byBook.set(book.id, map);
  });
  return byBook;
}

/**
 * Rebuilds `dbPath` from a backup state object. Always a full rebuild: a mirror
 * that keeps stale rows is worse than no mirror at all.
 */
function formatCell(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return String(value);
  const text = String(value).replace(/\r?\n/g, ' ');
  return text.length > 120 ? text.slice(0, 117) + '…' : text;
}

/** Runs one read statement and renders an aligned text table. */
function charCells(code) {
  if (code >= 0x1100 && (
    code <= 0x115f
    || (code >= 0x2e80 && code <= 0xa4cf && code !== 0x303f)
    || (code >= 0xac00 && code <= 0xd7a3)
    || (code >= 0xf900 && code <= 0xfaff)
    || (code >= 0xfe30 && code <= 0xfe6f)
    || (code >= 0xff00 && code <= 0xff60)
    || (code >= 0xffe0 && code <= 0xffe6)
  )) return 2;
  return 1;
}

function cellWidth(text) {
  let width = 0;
  for (const char of String(text)) width += charCells(char.codePointAt(0));
  return width;
}

function padCells(text, width) {
  const value = String(text);
  return value + ' '.repeat(Math.max(0, width - cellWidth(value)));
}

export function renderTable(columns, rows, rowCount, shown) {
  if (!columns.length) return `（查询没有返回列，共 ${rowCount} 行）`;
  const widths = columns.map(function width(column, index) {
    return rows.reduce(function widest(size, row) {
      return Math.max(size, cellWidth(row[index]));
    }, cellWidth(column));
  });
  const line = function line(cells) {
    return cells.map(function pad(text, index) { return padCells(text, widths[index]); }).join(' | ');
  };
  const out = [line(columns), widths.map(function dash(w) { return '-'.repeat(w); }).join('-|-')];
  rows.forEach(function each(row) { out.push(line(row)); });
  if (shown < rowCount) out.push(`… 共 ${rowCount} 行，已显示前 ${shown} 行`);
  return out.join('\n');
}

function snippetOf(text, term, radius) {
  const body = String(text || '').replace(/\s+/g, ' ').trim();
  const at = body.toLowerCase().indexOf(String(term).toLowerCase());
  if (at < 0) return body.slice(0, radius * 2);
  const start = Math.max(0, at - radius);
  const end = Math.min(body.length, at + String(term).length + radius);
  return (start > 0 ? '…' : '') + body.slice(start, end) + (end < body.length ? '…' : '');
}

function noteTitleMap(state) {
  const map = new Map();
  asArray(state.customBooks).forEach(function each(book) {
    if (!book || typeof book.id !== 'string') return;
    map.set(book.id, asText(book.title, 200));
  });
  return map;
}

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value.map(function text(tag) { return asText(tag, 40).trim(); }).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map(function text(tag) { return tag.trim(); }).filter(Boolean);
  }
  return [];
}

/** Reads highlights out of `library.json`; no database build required. */
export function notesFromLibrary(dir) {
  const read = readLibraryDir(dir, { bodies: false });
  const notes = collectNotes(read.state);
  return { source: 'snapshot', where: read.snapshot, notes: notes };
}

/** Turns raw highlights into the shape the filters and the renderer expect. */
export function collectNotes(state) {
  const titleMap = noteTitleMap(state);
  const chapterMap = chapterTitles(state);
  return asArray(state && state.highlights).filter(function keep(item) {
    return item && typeof item.id === 'string' && typeof item.bookId === 'string';
  }).map(function convert(item) {
    const perBook = chapterMap.get(item.bookId);
    const fromChapter = perBook && typeof item.chapterId === 'string' ? perBook.get(item.chapterId) : null;
    return {
      id: item.id,
      bookId: item.bookId,
      bookTitle: titleMap.get(item.bookId) || item.bookId,
      chapterIndex: Math.max(0, Math.round(asNumber(item.chapterIndex, 0))),
      chapterTitle: asText(fromChapter, 160) || asText(item.chapterTitle, 160) || null,
      text: asText(item.text, 4000),
      note: asText(item.note, 4000),
      tags: normalizeTags(item.tags),
      color: asText(item.color, 40) || null,
      createdAt: asNumber(item.createdAt, null),
    };
  });
}

export function filterNotes(notes, options) {
  const opts = options && typeof options === 'object' ? options : {};
  const term = asText(opts.query, 200).trim().toLowerCase();
  const book = asText(opts.book, 200).trim().toLowerCase();
  const tag = asText(opts.tag, 60).trim().toLowerCase();
  const limit = Math.min(Math.max(Math.round(asNumber(opts.limit, 20)), 1), 200);

  const ordered = asArray(notes).filter(function keep(note) {
    return note && typeof note === 'object';
  }).slice().sort(function newest(a, b) {
    return (asNumber(b.createdAt, 0) - asNumber(a.createdAt, 0)) || String(a.id).localeCompare(String(b.id));
  });

  const matched = ordered.filter(function keep(note) {
    if (term) {
      const hay = [asText(note.text, 4000), asText(note.note, 4000)].join('\n').toLowerCase();
      if (!hay.includes(term)) return false;
    }
    if (book) {
      const id = asText(note.bookId, 200).toLowerCase();
      const title = asText(note.bookTitle, 200).toLowerCase();
      if (id !== book && !title.includes(book)) return false;
    }
    if (tag) {
      const tags = normalizeTags(note.tags).map(function lower(item) { return item.toLowerCase(); });
      if (tags.indexOf(tag) < 0) return false;
    }
    return true;
  });

  return {
    total: matched.length,
    notes: matched.slice(0, limit),
    limit: limit,
    query: asText(opts.query, 200).trim(),
    book: asText(opts.book, 200).trim(),
    tag: asText(opts.tag, 60).trim(),
  };
}

export function renderNotes(result, meta) {
  const where = meta && meta.source === 'backup' ? `备份文件 ${meta.where}` : `书库目录 ${meta.where}`;
  const filters = [
    result.query ? `关键词「${result.query}」` : '',
    result.book ? `书「${result.book}」` : '',
    result.tag ? `标签「${result.tag}」` : '',
  ].filter(Boolean).join(' · ');
  const head = filters ? `摘录与想法（${filters}）` : '摘录与想法';
  if (!result.total) {
    const stored = asArray(meta && meta.notes).length;
    return stored
      ? `${head}：没有匹配的记录。\n库里一共有 ${stored} 条摘录，换一个关键词、书名或标签再试。来源：${where}。`
      : `${head}：库里还没有摘录。\n来源：${where}。摘录是你在阅读器里划的句子和写的想法，划一条再来。`;
  }
  const shown = result.notes.length < result.total
    ? `共 ${result.total} 条，显示最新 ${result.notes.length} 条`
    : `共 ${result.total} 条`;
  const lines = [`${head}：${shown}`, `来源：${where}。`];
  result.notes.forEach(function each(note, index) {
    const place = `第 ${note.chapterIndex + 1} 章${note.chapterTitle ? ' · ' + note.chapterTitle : ''}`;
    const day = note.createdAt ? localDay(note.createdAt) : '';
    lines.push('');
    lines.push(`${index + 1}. 《${note.bookTitle}》 ${place}${day ? ' · ' + day : ''}`);
    if (note.text) lines.push(`   原文：${note.text}`);
    if (note.note) lines.push(`   想法：${note.note}`);
    if (note.tags.length) lines.push(`   标签：${note.tags.join('、')}`);
  });
  return lines.join('\n');
}

/** Reads bookmarks out of `library.json`; no database build required. */
export function bookmarksFromLibrary(dir) {
  const read = readLibraryDir(dir, { bodies: false });
  const bookmarks = collectBookmarks(read.state);
  return { source: 'snapshot', where: read.snapshot, bookmarks: bookmarks };
}

export function collectBookmarks(state) {
  const titleMap = noteTitleMap(state);
  const chapterMap = chapterTitles(state);
  return asArray(state && state.bookmarks).filter(function keep(item) {
    return item && typeof item.id === 'string' && typeof item.bookId === 'string';
  }).map(function convert(item) {
    const perBook = chapterMap.get(item.bookId);
    const fromChapter = perBook && typeof item.chapterId === 'string' ? perBook.get(item.chapterId) : null;
    return {
      id: item.id,
      bookId: item.bookId,
      bookTitle: titleMap.get(item.bookId) || item.bookId,
      chapterIndex: Math.max(0, Math.round(asNumber(item.chapterIndex, 0))),
      chapterTitle: asText(fromChapter, 160) || asText(item.chapterTitle, 160) || null,
      progress: asNumber(item.percent, 0),
      page: asNumber(item.page, null),
      excerpt: asText(item.excerpt, 1000),
      note: asText(item.note, 2000),
      createdAt: asNumber(item.createdAt, null),
    };
  });
}

export function filterBookmarks(bookmarks, options) {
  const opts = options && typeof options === 'object' ? options : {};
  const term = asText(opts.query, 200).trim().toLowerCase();
  const book = asText(opts.book, 200).trim().toLowerCase();
  const withNoteOnly = opts.withNote === true;
  const limit = Math.min(Math.max(Math.round(asNumber(opts.limit, 20)), 1), 200);

  const ordered = asArray(bookmarks).filter(function keep(item) {
    return item && typeof item === 'object';
  }).slice().sort(function newest(a, b) {
    return (asNumber(b.createdAt, 0) - asNumber(a.createdAt, 0)) || String(a.id).localeCompare(String(b.id));
  });

  const matched = ordered.filter(function keep(item) {
    if (term) {
      const hay = [asText(item.excerpt, 2000), asText(item.note, 2000)].join('\n').toLowerCase();
      if (!hay.includes(term)) return false;
    }
    if (book) {
      const id = asText(item.bookId, 200).toLowerCase();
      const title = asText(item.bookTitle, 200).toLowerCase();
      if (id !== book && !title.includes(book)) return false;
    }
    if (withNoteOnly) {
      if (!item.note || !item.note.trim()) return false;
    }
    return true;
  });

  return {
    total: matched.length,
    bookmarks: matched.slice(0, limit),
    limit: limit,
    query: asText(opts.query, 200).trim(),
    book: asText(opts.book, 200).trim(),
    withNote: withNoteOnly,
  };
}

export function renderBookmarks(result, meta) {
  const where = meta && meta.source === 'backup' ? `备份文件 ${meta.where}` : `书库目录 ${meta.where}`;
  const filters = [
    result.query ? `关键词「${result.query}」` : '',
    result.book ? `书「${result.book}」` : '',
    result.withNote ? '仅含备注' : '',
  ].filter(Boolean).join(' · ');
  const head = filters ? `书签（${filters}）` : '书签';
  if (!result.total) {
    const stored = asArray(meta && meta.bookmarks).length;
    return stored
      ? `${head}：没有匹配的书签。\n库里一共有 ${stored} 个书签，换一个关键词或书名再试。来源：${where}。`
      : `${head}：库里还没有书签。\n来源：${where}。在阅读器里按 B 或点书签按钮保存一个书签再来。`;
  }
  const shown = result.bookmarks.length < result.total
    ? `共 ${result.total} 个，显示最新 ${result.bookmarks.length} 个`
    : `共 ${result.total} 个`;
  const lines = [`${head}：${shown}`, `来源：${where}。`];
  result.bookmarks.forEach(function each(item, index) {
    const place = `第 ${item.chapterIndex + 1} 章${item.chapterTitle ? ' · ' + item.chapterTitle : ''}`;
    const pageStr = item.page !== null && item.page !== undefined ? ` · 第 ${item.page} 页` : '';
    const day = item.createdAt ? localDay(item.createdAt) : '';
    lines.push('');
    lines.push(`${index + 1}. 《${item.bookTitle}》 ${place}${pageStr}${day ? ' · ' + day : ''}`);
    if (item.excerpt) lines.push(`   摘录：${item.excerpt}`);
    if (item.note) lines.push(`   备注：${item.note}`);
  });
  return lines.join('\n');
}

export function formatDuration(seconds) {
  const secs = Math.max(0, Math.round(asNumber(seconds, 0)));
  if (secs === 0) return '0 分钟';
  if (secs < 60) return `${secs} 秒`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} 分钟`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hours} 小时 ${remMins} 分钟` : `${hours} 小时`;
}

function dayKeyFromDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return localDay(d.getTime());
}

/** Computes reading streak in days. */
export function computeReadingStreak(days, referenceDate) {
  const source = days && typeof days === 'object' ? days : {};
  const ref = referenceDate instanceof Date ? new Date(referenceDate) : new Date(referenceDate || Date.now());
  ref.setHours(0, 0, 0, 0);

  const todayKey = dayKeyFromDate(ref);
  const todaySeconds = asNumber(source[todayKey], 0);

  const cursor = new Date(ref);
  if (todaySeconds <= 0) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let count = 0;
  while (count < 3650) {
    const key = dayKeyFromDate(cursor);
    const secs = asNumber(source[key], 0);
    if (secs <= 0) break;
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

/** Computes week-over-week reading comparison. */
export function computeWeekComparison(days, referenceDate) {
  const source = days && typeof days === 'object' ? days : {};
  const ref = referenceDate instanceof Date ? new Date(referenceDate) : new Date(referenceDate || Date.now());
  ref.setHours(0, 0, 0, 0);

  function sumDays(startOffset, endOffset) {
    let sum = 0;
    for (let offset = startOffset; offset <= endOffset; offset += 1) {
      const d = new Date(ref);
      d.setDate(d.getDate() - offset);
      const k = dayKeyFromDate(d);
      sum += Math.max(0, asNumber(source[k], 0));
    }
    return sum;
  }

  const current = sumDays(0, 6);   // last 7 days (including today)
  const previous = sumDays(7, 13); // prior 7 days
  const delta = current - previous;
  const ratio = previous > 0 ? delta / previous : (current > 0 ? 1 : 0);
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

  return { current, previous, delta, ratio, direction };
}

function formatWeekDelta(comparison) {
  if (!comparison.current && !comparison.previous) return '暂无数据';
  if (!comparison.previous) return '上周无记录';
  if (comparison.direction === 'flat') return '与上周持平';
  const percent = Math.max(1, Math.round(Math.abs(comparison.ratio) * 100));
  return comparison.direction === 'up' ? `较上周 +${percent}%` : `较上周 -${percent}%`;
}

/** Extracts normalized statistics from a state-shaped object. */
export function extractStats(state, referenceDate) {
  const rawState = state && typeof state === 'object' ? state : {};
  const allBooks = asArray(rawState.customBooks);

  const progress = (rawState.progress && typeof rawState.progress === 'object') ? rawState.progress : {};
  const shelved = new Set(asArray(rawState.shelved));
  const wishlist = new Set(asArray(rawState.wishlist));

  let readingCount = 0;
  let finishedCount = 0;
  let shelvedCount = 0;
  let wishlistCount = 0;
  let unreadCount = 0;

  allBooks.forEach(function classify(book) {
    const p = progress[book.id];
    const isFinished = Boolean(p && (p.completed === true || asNumber(p.percent, 0) >= 1));
    const isShelved = shelved.has(book.id);
    const isWishlist = wishlist.has(book.id);
    const isReading = Boolean(p && !isFinished && (asNumber(p.percent, 0) > 0 || asNumber(p.chapterIndex, 0) > 0));

    if (isFinished) finishedCount += 1;
    else if (isShelved) shelvedCount += 1;
    else if (isReading) readingCount += 1;
    else if (isWishlist) wishlistCount += 1;
    else unreadCount += 1;
  });

  const byBook = (rawState.stats && rawState.stats.byBook && typeof rawState.stats.byBook === 'object')
    ? rawState.stats.byBook
    : {};

  const rankedBooks = allBooks.map(function wrap(book) {
    const seconds = asNumber(byBook[book.id], 0);
    const p = progress[book.id];
    const isFinished = Boolean(p && (p.completed === true || asNumber(p.percent, 0) >= 1));
    const pct = p ? Math.round(asNumber(p.percent, 0) * 100) : 0;
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      seconds: seconds,
      isFinished: isFinished,
      percent: pct,
    };
  }).filter(function hasTime(b) {
    return b.seconds > 0;
  }).sort(function sortTime(a, b) {
    return b.seconds - a.seconds;
  });

  const days = (rawState.stats && rawState.stats.days && typeof rawState.stats.days === 'object')
    ? rawState.stats.days
    : {};
  const ref = referenceDate instanceof Date ? new Date(referenceDate) : new Date(referenceDate || Date.now());
  const todayKey = dayKeyFromDate(ref);
  const todaySeconds = Math.max(0, asNumber(days[todayKey], 0));

  let totalSeconds = 0;
  let activeDays = 0;
  Object.keys(days).forEach(function count(k) {
    const s = Math.max(0, asNumber(days[k], 0));
    if (s > 0) {
      totalSeconds += s;
      activeDays += 1;
    }
  });

  const streak = computeReadingStreak(days, ref);
  const weekComparison = computeWeekComparison(days, ref);

  const noteCount = asArray(rawState.highlights).length;
  const bookmarkCount = asArray(rawState.bookmarks).length;
  const reviewCount = Array.isArray(rawState.reviews)
    ? rawState.reviews.length
    : Object.keys(rawState.reviews && typeof rawState.reviews === 'object' ? rawState.reviews : {}).length;

  return {
    totalBooks: allBooks.length,
    readingCount: readingCount,
    finishedCount: finishedCount,
    shelvedCount: shelvedCount,
    wishlistCount: wishlistCount,
    unreadCount: unreadCount,
    todaySeconds: todaySeconds,
    totalSeconds: totalSeconds,
    activeDays: activeDays,
    streak: streak,
    weekComparison: weekComparison,
    rankedBooks: rankedBooks,
    noteCount: noteCount,
    bookmarkCount: bookmarkCount,
    reviewCount: reviewCount,
  };
}

/** Formats reading statistics overview. */
export function renderReaderStats(stats, meta) {
  const where = meta && meta.source === 'snapshot'
    ? `书库目录 ${meta.where}`
    : `备份文件 ${meta ? meta.where : ''}`;

  const lines = [
    '阅读统计看板',
    `来源：${where}。`,
    '',
    '【阅读节律】',
    `- 今日阅读：${formatDuration(stats.todaySeconds)}`,
    `- 本周阅读：${formatDuration(stats.weekComparison.current)}（${formatWeekDelta(stats.weekComparison)}）`,
    `- 累计阅读：${formatDuration(stats.totalSeconds)}（打卡 ${stats.activeDays} 天）`,
    `- 连续阅读：${stats.streak} 天`,
    '',
    `【书架概况（共 ${stats.totalBooks} 本）】`,
    `- 在读 ${stats.readingCount} 本 · 已读完 ${stats.finishedCount} 本 · 想读 ${stats.wishlistCount} 本 · 搁置 ${stats.shelvedCount} 本 · 未读 ${stats.unreadCount} 本`,
    '',
    '【读书时长排行】',
  ];

  if (!stats.rankedBooks.length) {
    lines.push('- 暂无单书阅读时长记录');
  } else {
    stats.rankedBooks.slice(0, 5).forEach(function each(b, index) {
      const author = b.author ? ` · ${b.author}` : '';
      const stateLabel = b.isFinished ? '已读完' : (b.percent > 0 ? `进度 ${b.percent}%` : '未开始');
      lines.push(`${index + 1}. 《${b.title}》${author} · ${formatDuration(b.seconds)} · ${stateLabel}`);
    });
  }

  lines.push('');
  lines.push('【笔记与互动】');
  lines.push(`- 划线想法：${stats.noteCount} 条 · 书签：${stats.bookmarkCount} 个 · 书评：${stats.reviewCount} 篇`);

  return lines.join('\n');
}

/**
 * Turns library state into a structured list of books on the shelf,
 * complete with reading status, progress, ratings, reviews, tags, and reading time.
 */
export function collectShelfBooks(state) {
  const rawState = state && typeof state === 'object' ? state : {};
  const allBooks = asArray(rawState.customBooks);

  const progress = (rawState.progress && typeof rawState.progress === 'object') ? rawState.progress : {};
  const shelved = new Set(asArray(rawState.shelved));
  const wishlist = new Set(asArray(rawState.wishlist));
  const pins = new Set(asArray(rawState.pins));
  const reviews = (rawState.reviews && typeof rawState.reviews === 'object') ? rawState.reviews : {};
  const userTags = (rawState.userTags && typeof rawState.userTags === 'object') ? rawState.userTags : {};
  const byBook = (rawState.stats && rawState.stats.byBook && typeof rawState.stats.byBook === 'object') ? rawState.stats.byBook : {};

  const seen = new Set();
  const deduped = [];
  for (let i = allBooks.length - 1; i >= 0; i--) {
    const b = allBooks[i];
    if (b && b.id && !seen.has(b.id)) {
      seen.add(b.id);
      deduped.unshift(b);
    }
  }

  return deduped.map(function mapBook(book) {
    const id = book.id;
    const p = progress[id];
    const isFinished = Boolean(p && (p.completed === true || asNumber(p.percent, 0) >= 1));
    const isShelved = shelved.has(id);
    const isWishlist = wishlist.has(id);
    const isReading = Boolean(p && !isFinished && (asNumber(p.percent, 0) > 0 || asNumber(p.chapterIndex, 0) > 0));

    let status = 'unread';
    if (isFinished) status = 'finished';
    else if (isShelved) status = 'shelved';
    else if (isReading) status = 'reading';
    else if (isWishlist) status = 'wishlist';

    const rev = reviews[id];
    const tags = normalizeTags(userTags[id]);
    const secs = Math.max(0, asNumber(byBook[id], 0));
    const pct = p ? Math.min(100, Math.max(0, Math.round(asNumber(p.percent, 0) * 100))) : 0;
    const chapterIdx = p ? Math.max(0, Math.round(asNumber(p.chapterIndex, 0))) : 0;
    let chapterTitle = null;
    if (p && book.chapters && book.chapters[chapterIdx]) {
      chapterTitle = asText(book.chapters[chapterIdx].title, 160) || null;
    }

    return {
      id: id,
      title: asText(book.title, 200) || id,
      author: asText(book.author, 100) || '',
      subtitle: asText(book.subtitle, 200) || '',
      status: status,
      isFinished: isFinished,
      pinned: pins.has(id),
      progressPercent: pct,
      chapterIndex: chapterIdx,
      chapterTitle: chapterTitle,
      updatedAt: p && p.updatedAt ? asNumber(p.updatedAt, null) : null,
      seconds: secs,
      rating: rev && rev.rating ? Math.min(5, Math.max(1, Math.round(asNumber(rev.rating, 0)))) : null,
      reviewText: rev && rev.text ? asText(rev.text, 2000) : '',
      tags: tags,
      source: book.source || 'local',
    };
  });
}

export function filterShelfBooks(books, options) {
  const opts = options && typeof options === 'object' ? options : {};
  const query = asText(opts.query, 200).trim().toLowerCase();
  const status = asText(opts.status, 20).trim().toLowerCase();
  const tag = asText(opts.tag, 60).trim().toLowerCase();
  const minRating = Math.max(0, Math.min(5, Math.round(asNumber(opts.minRating, 0))));
  const hasReview = opts.hasReview === true;
  const limit = Math.min(Math.max(Math.round(asNumber(opts.limit, 20)), 1), 100);

  const all = asArray(books);

  const statusCounts = { reading: 0, finished: 0, wishlist: 0, shelved: 0, unread: 0 };
  all.forEach(function count(b) {
    if (b && b.status && statusCounts[b.status] !== undefined) {
      statusCounts[b.status] += 1;
    }
  });

  const matched = all.filter(function match(b) {
    if (!b) return false;
    if (status && status !== 'all' && b.status !== status) {
      return false;
    }
    if (tag) {
      const tags = asArray(b.tags).map(function lower(t) { return String(t).toLowerCase(); });
      if (tags.indexOf(tag) < 0) return false;
    }
    if (query) {
      const hay = [b.title, b.author, b.subtitle, b.id].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(query)) return false;
    }
    if (minRating > 0) {
      if (!b.rating || b.rating < minRating) return false;
    }
    if (hasReview) {
      if (!b.reviewText || !b.reviewText.trim()) return false;
    }
    return true;
  });

  const statusPriority = { reading: 0, finished: 1, wishlist: 2, unread: 3, shelved: 4 };
  const sorted = matched.slice().sort(function compare(a, b) {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const pa = statusPriority[a.status] !== undefined ? statusPriority[a.status] : 9;
    const pb = statusPriority[b.status] !== undefined ? statusPriority[b.status] : 9;
    if (pa !== pb) return pa - pb;
    if ((b.seconds || 0) !== (a.seconds || 0)) return (b.seconds || 0) - (a.seconds || 0);
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });

  return {
    total: matched.length,
    books: sorted.slice(0, limit),
    statusCounts: statusCounts,
    limit: limit,
    query: asText(opts.query, 200).trim(),
    status: status || 'all',
    tag: asText(opts.tag, 60).trim(),
    minRating: minRating > 0 ? minRating : null,
    hasReview: hasReview,
  };
}

export function renderShelfBooks(result, meta) {
  const where = meta && meta.source === 'snapshot'
    ? `书库目录 ${meta.where}`
    : `备份文件 ${meta ? meta.where : ''}`;
  const metaLabel = where ? `来源：${where}\n\n` : '';
  const lines = [];
  lines.push(`${metaLabel}【书架藏书（共 ${result.total} 本）】`);

  const breakdown = [];
  if (result.statusCounts) {
    breakdown.push(`在读 ${result.statusCounts.reading || 0} 本`);
    breakdown.push(`已读完 ${result.statusCounts.finished || 0} 本`);
    breakdown.push(`想读 ${result.statusCounts.wishlist || 0} 本`);
    breakdown.push(`搁置 ${result.statusCounts.shelved || 0} 本`);
    breakdown.push(`未读 ${result.statusCounts.unread || 0} 本`);
    lines.push(breakdown.join(' · '));
  }
  lines.push('');

  if (!result.books.length) {
    let emptyMsg = '书架上没有匹配的书籍。';
    const filters = [];
    if (result.query) filters.push(`关键词：${result.query}`);
    if (result.status && result.status !== 'all') filters.push(`状态：${result.status}`);
    if (result.tag) filters.push(`标签：${result.tag}`);
    if (result.minRating) filters.push(`评分 ≥ ${result.minRating}★`);
    if (result.hasReview) filters.push('仅看有书评');
    if (filters.length) emptyMsg += `（${filters.join('，')}）`;
    lines.push(emptyMsg);
    return lines.join('\n');
  }

  result.books.forEach(function render(b, i) {
    const statusLabels = {
      finished: '已读完',
      reading: '在读',
      wishlist: '想读',
      shelved: '已搁置',
      unread: '未读',
    };
    const statusName = statusLabels[b.status] || b.status;
    let head = `${i + 1}. ${b.pinned ? '📌 ' : ''}《${b.title}》${b.author ? ' · ' + b.author : ''} [${statusName}]`;
    const details = [];
    if (b.status === 'reading' && b.progressPercent > 0) {
      details.push(`进度 ${b.progressPercent}%`);
      if (b.chapterTitle) details.push(b.chapterTitle);
    }
    if (b.seconds > 0) {
      details.push(`阅读 ${formatDuration(b.seconds)}`);
    }
    if (b.rating) {
      details.push('★'.repeat(b.rating));
    }
    if (details.length) head += ` (${details.join(' · ')})`;
    lines.push(head);

    if (b.tags && b.tags.length) {
      lines.push(`   标签：${b.tags.map(function tag(t) { return '#' + t; }).join(' ')}`);
    }
    if (b.reviewText) {
      lines.push(`   书评：“${b.reviewText}”`);
    }
  });

  if (result.total > result.books.length) {
    lines.push('');
    lines.push(`（共匹配 ${result.total} 本，已显示前 ${result.books.length} 本）`);
  }

  return lines.join('\n');
}

export function getReaderShelf(options) {
  const opts = options && typeof options === 'object' ? options : {};
  let source = null;

  const dir = asText(opts.libraryDir, 400).trim();
  if (dir) {
    try {
      const read = readLibraryDir(dir, { bodies: false });
      source = { source: 'snapshot', where: read.snapshot, state: read.state, dir: dir };
    } catch (err) {
      if (err && err.message !== 'library-snapshot-missing') throw err;
    }
  }

  if (!source) {
    const wanted = asText(opts.backupPath, 400).trim();
    const found = wanted ? { path: wanted } : findLatestBackup();
    if (found && fs.existsSync(found.path)) {
      const state = readBackup(found.path);
      source = { source: 'backup', where: found.path, state: state, dir: '' };
    }
  }

  if (!source) {
    throw new Error('no-data-source');
  }

  const allBooks = collectShelfBooks(source.state);
  const filtered = filterShelfBooks(allBooks, opts);
  return renderShelfBooks(filtered, source);
}

/**
 * Cross-book text search with no index and no build step: a reader library is a
 * handful of books, so scanning them costs less than the machinery an index
 * needs — and it can never go stale.
 */
export function searchBooks(books, query, limit) {
  const term = asText(query, 200).trim();
  if (!term) throw new Error('empty-query');
  const max = Math.min(Math.max(Math.round(asNumber(limit, 20)), 1), 200);
  const needle = term.toLowerCase();
  const hits = [];

  asArray(books).forEach(function eachBook(book) {
    if (!book || typeof book !== 'object') return;
    const title = asText(book.title, 120) || asText(book.id, 120);
    asArray(book.chapters).forEach(function eachChapter(chapter, index) {
      if (!chapter || typeof chapter !== 'object') return;
      const text = proseOf(chapter);
      if (!text || text.toLowerCase().indexOf(needle) < 0) return;
      hits.push({
        bookId: asText(book.id, 120),
        bookTitle: title,
        chapterIndex: index,
        chapterTitle: asText(chapter.title, 120) || null,
        snippet: snippetOf(text, term, 30),
      });
    });
  });

  return {
    query: term,
    total: hits.length,
    hits: hits.slice(0, max),
    limit: max,
  };
}

/** Same search, but reading the book bodies out of the library folder first. */
export function searchLibraryDocs(dir, query, limit) {
  const read = readLibraryDir(dir);
  const books = asArray(read.state.customBooks);
  return Object.assign(searchBooks(books, query, limit), {
    source: 'snapshot',
    where: read.snapshot,
  });
}

export function renderSearchHits(result) {
  const where = result && result.source === 'snapshot'
    ? `书库目录 ${result.where}`
    : (result && result.where ? `备份文件 ${result.where}` : '');
  if (!result.total) {
    return [`没有命中「${result.query}」的章节。`, where ? `来源：${where}。` : ''].filter(Boolean).join('\n');
  }
  const rows = result.hits.map(function line(hit) {
    return [hit.bookTitle, String(hit.chapterIndex + 1), hit.chapterTitle || '-', hit.snippet];
  });
  const shown = result.hits.length < result.total
    ? `命中 ${result.total} 章，显示前 ${result.hits.length} 章`
    : `命中 ${result.total} 章`;
  return [
    shown + (where ? ` · 来源：${where}` : ''),
    renderTable(['书名', '章', '章节标题', '摘录'], rows, rows.length, rows.length),
  ].join('\n');
}

export function getReaderStats(options) {
  const opts = options && typeof options === 'object' ? options : {};
  let source = null;

  const dir = asText(opts.libraryDir, 400).trim();
  if (dir) {
    try {
      const read = readLibraryDir(dir, { bodies: false });
      source = { source: 'snapshot', where: read.snapshot, state: read.state };
    } catch (err) {
      if (err && err.message !== 'library-snapshot-missing') throw err;
    }
  }

  if (!source) {
    const wanted = asText(opts.backupPath, 400).trim();
    const found = wanted ? { path: wanted } : findLatestBackup();
    if (found && fs.existsSync(found.path)) {
      const state = readBackup(found.path);
      source = { source: 'backup', where: found.path, state: state };
    }
  }

  if (!source) {
    throw new Error('no-data-source');
  }

  const stats = extractStats(source.state, opts.referenceDate);
  return renderReaderStats(stats, source);
}
