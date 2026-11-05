/**
 * Host-side SQLite index for the reader library.
 *
 * The folder is still the source of truth: `library.json` and `books/*.txt`
 * remain readable, editable and portable. This module only derives a disposable
 * full-text cache from that folder, under the host's own storage directory.
 * Every row can be recreated; deleting the database is always safe.
 *
 * `node:sqlite` is loaded lazily. A host without it (or without FTS5 support)
 * simply gets `null`, and the caller falls back to the existing snapshot scan.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { collectShelfBooks, computeReadingStreak, computeWeekComparison, filterShelfBooks, readLibraryDir, renderReaderStats, renderShelfBooks } from './hostlib.js';

const SCHEMA_VERSION = 4;
const MAX_HITS = 200;
let sqliteModule;

function loadSqlite() {
  if (!sqliteModule) {
    sqliteModule = import('node:sqlite').catch(function unavailable() {
      return null;
    });
  }
  return sqliteModule;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value, limit) {
  if (typeof value !== 'string') return '';
  return limit > 0 ? value.slice(0, limit) : value;
}

function asNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function indexRoot() {
  const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
  return path.join(home, 'storages', 'shiguang-reader', 'index');
}

/** Stable, path-addressed cache name. Moving a library gives it a fresh index. */
export function indexPathFor(dir) {
  const abs = path.resolve(String(dir || ''));
  const hash = crypto.createHash('sha1').update(abs).digest('hex').slice(0, 20);
  return path.join(indexRoot(), hash + '.sqlite');
}

function chapterText(chapter) {
  return asArray(chapter && chapter.paragraphs)
    .filter(function prose(part) {
      if (typeof part !== 'string') return false;
      return !/^!\[[^\]]*\]\([^)]*\)\s*$/.test(part.trim());
    })
    .join('\n');
}

function chapterChars(chapter) {
  return chapterText(chapter).length;
}

function snippetOf(text, term, radius) {
  const source = String(text || '');
  const needle = String(term || '');
  const index = source.toLowerCase().indexOf(needle.toLowerCase());
  if (index < 0) return source.slice(0, 80).replace(/\s+/g, ' ').trim();
  const span = Math.max(30, Number(radius) || 55);
  const start = Math.max(0, index - span);
  const end = Math.min(source.length, index + needle.length + span);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < source.length ? '…' : '';
  return (prefix + source.slice(start, end) + suffix).replace(/\s+/g, ' ').trim();
}

function statusOf(state, book) {
  const progress = state.progress && state.progress[book.id];
  if (progress && progress.completed) return 'finished';
  if (asArray(state.wishlist).indexOf(book.id) >= 0) return 'wishlist';
  if (progress) return 'reading';
  if (asArray(state.shelved).indexOf(book.id) >= 0) return 'shelved';
  return 'unread';
}

function ensureSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT,
      subtitle TEXT,
      tags TEXT,
      added_at INTEGER,
      status TEXT,
      pinned INTEGER,
      progress_percent INTEGER,
      chapter_index INTEGER,
      chapter_title TEXT,
      updated_at INTEGER,
      seconds INTEGER,
      is_finished INTEGER,
      rating INTEGER,
      review TEXT,
      source TEXT
    );
    CREATE TABLE IF NOT EXISTS chapters (
      book_id TEXT NOT NULL,
      chapter_index INTEGER NOT NULL,
      chapter_id TEXT,
      chapter_title TEXT,
      text TEXT,
      char_count INTEGER,
      PRIMARY KEY (book_id, chapter_index)
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS chapter_fts USING fts5(
      book_id UNINDEXED,
      chapter_index UNINDEXED,
      chapter_title,
      text,
      tokenize = 'trigram'
    );
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      chapter_id TEXT,
      chapter_index INTEGER,
      text TEXT,
      note TEXT,
      tags TEXT,
      color TEXT,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      chapter_id TEXT,
      chapter_index INTEGER,
      page INTEGER,
      progress REAL,
      chapter_title TEXT,
      excerpt TEXT,
      note TEXT,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS days (
      day TEXT PRIMARY KEY,
      seconds INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS notes_book_idx ON notes(book_id, created_at);
    CREATE INDEX IF NOT EXISTS bookmarks_book_idx ON bookmarks(book_id, created_at);
  `);
}

function readMeta(db) {
  const out = {};
  try {
    db.prepare('SELECT key, value FROM meta').all().forEach(function row(item) {
      out[item.key] = item.value;
    });
  } catch (error) {
    /* no meta table yet */
  }
  return out;
}

function writeMeta(db, stat, snapshot) {
  const put = db.prepare('INSERT INTO meta(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  put.run('schema', String(SCHEMA_VERSION));
  put.run('snapshotMtime', String(stat.mtimeMs));
  put.run('snapshotSize', String(stat.size));
  put.run('builtAt', String(Date.now()));
  put.run('source', 'snapshot');
  put.run('sourcePath', path.resolve(path.dirname(snapshot)));
}

function rebuild(db, state, stat, snapshot) {
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec('DELETE FROM chapter_fts; DELETE FROM chapters; DELETE FROM notes; DELETE FROM bookmarks; DELETE FROM days; DELETE FROM books;');
    const bookStmt = db.prepare('INSERT INTO books(id, title, author, subtitle, tags, added_at, status, pinned, progress_percent, chapter_index, chapter_title, updated_at, seconds, is_finished, rating, review, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const chapterStmt = db.prepare('INSERT INTO chapters(book_id, chapter_index, chapter_id, chapter_title, text, char_count) VALUES (?, ?, ?, ?, ?, ?)');
    const ftsStmt = db.prepare('INSERT INTO chapter_fts(book_id, chapter_index, chapter_title, text) VALUES (?, ?, ?, ?)');
    const noteStmt = db.prepare('INSERT OR REPLACE INTO notes(id, book_id, chapter_id, chapter_index, text, note, tags, color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const bookmarkStmt = db.prepare('INSERT OR REPLACE INTO bookmarks(id, book_id, chapter_id, chapter_index, page, progress, chapter_title, excerpt, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

    const sourceBooks = new Map(asArray(state.customBooks).map(function pair(book) { return [book.id, book]; }));
    asArray(collectShelfBooks(state)).forEach(function eachBook(book) {
      if (!book || typeof book.id !== 'string') return;
      const sourceBook = sourceBooks.get(book.id) || book;
      bookStmt.run(
        book.id,
        asText(book.title, 200) || book.id,
        asText(book.author, 160),
        asText(book.subtitle, 200),
        JSON.stringify(asArray(book.tags)),
        asNumber(book.addedAt, 0),
        asText(book.status, 20) || 'unread',
        book.pinned ? 1 : 0,
        Math.max(0, Math.min(100, asNumber(book.progressPercent, 0))),
        Math.max(0, Math.round(asNumber(book.chapterIndex, 0))),
        asText(book.chapterTitle, 240),
        asNumber(book.updatedAt, 0),
        Math.max(0, asNumber(book.seconds, 0)),
        book.isFinished ? 1 : 0,
        Math.max(0, Math.min(5, Math.round(asNumber(book.rating, 0)))),
        asText(book.reviewText, 4000),
        asText(book.source, 40) || 'local',
      );
      asArray(sourceBook.chapters).forEach(function eachChapter(chapter, index) {
        if (!chapter || typeof chapter !== 'object') return;
        const title = asText(chapter.title, 240);
        const text = chapterText(chapter);
        chapterStmt.run(book.id, index, asText(chapter.id, 160), title, text, chapterChars(chapter));
        ftsStmt.run(book.id, index, title, text);
      });
    });

    const dayStmt = db.prepare('INSERT OR REPLACE INTO days(day, seconds) VALUES (?, ?)');
    const storedDays = state.stats && state.stats.days && typeof state.stats.days === 'object' ? state.stats.days : {};
    Object.keys(storedDays).forEach(function eachDay(key) {
      const seconds = Math.max(0, asNumber(storedDays[key], 0));
      if (seconds > 0) dayStmt.run(key, seconds);
    });

    asArray(state.highlights).forEach(function eachNote(note) {
      if (!note || typeof note.id !== 'string' || typeof note.bookId !== 'string') return;
      noteStmt.run(
        note.id,
        note.bookId,
        asText(note.chapterId, 160),
        Math.max(0, Math.round(asNumber(note.chapterIndex, 0))),
        asText(note.text, 20000),
        asText(note.note, 20000),
        JSON.stringify(asArray(note.tags).map(function tag(value) { return asText(value, 80); }).filter(Boolean)),
        asText(note.color, 40),
        asNumber(note.createdAt, 0),
      );
    });

    asArray(state.bookmarks).forEach(function eachBookmark(item) {
      if (!item || typeof item.id !== 'string' || typeof item.bookId !== 'string') return;
      bookmarkStmt.run(
        item.id,
        item.bookId,
        asText(item.chapterId, 160),
        Math.max(0, Math.round(asNumber(item.chapterIndex, 0))),
        item.page === undefined || item.page === null ? null : Math.max(0, Math.round(asNumber(item.page, 0))),
        Math.max(0, Math.min(1, asNumber(item.percent, 0))),
        asText(item.chapterTitle, 240),
        asText(item.excerpt, 4000),
        asText(item.note, 4000),
        asNumber(item.createdAt, 0),
      );
    });

    writeMeta(db, stat, snapshot);
    db.exec('COMMIT');
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch (rollbackError) { /* preserve original error */ }
    throw error;
  }
}

function openDatabase(mod, file) {
  const db = new mod.DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 2000;');
  return db;
}

async function ensureIndex(dir) {
  const mod = await loadSqlite();
  if (!mod || typeof mod.DatabaseSync !== 'function') return null;
  const snapshot = path.join(dir, 'library.json');
  let stat;
  try { stat = fs.statSync(snapshot); } catch (error) { return null; }
  const file = indexPathFor(dir);
  try { fs.mkdirSync(path.dirname(file), { recursive: true }); } catch (error) { return null; }

  let db = null;
  try {
    db = openDatabase(mod, file);
    ensureSchema(db);
    const meta = readMeta(db);
    if (meta.schema === String(SCHEMA_VERSION) && meta.snapshotMtime === String(stat.mtimeMs) && meta.snapshotSize === String(stat.size)) {
      return { db: db, file: file, snapshot: snapshot };
    }
    if (meta.schema && meta.schema !== String(SCHEMA_VERSION)) {
      db.close();
      fs.rmSync(file, { force: true });
      db = openDatabase(mod, file);
      ensureSchema(db);
    }
    const read = readLibraryDir(dir);
    rebuild(db, read.state, stat, snapshot);
    return { db: db, file: file, snapshot: snapshot };
  } catch (error) {
    if (db) {
      try { db.close(); } catch (closeError) { /* ignore */ }
    }
    // A corrupt or half-written cache must never block reading: drop it and let
    // the caller scan the snapshot instead.
    try { fs.rmSync(file, { force: true }); } catch (removeError) { /* ignore */ }
    return null;
  }
}

function ftsPhrase(term) {
  return '"' + String(term).replace(/"/g, '') + '"';
}

function likePattern(term) {
  return '%' + String(term).replace(/[\\%_]/g, '\\$&') + '%';
}

function queryRows(db, term, limit) {
  if (term.length >= 3) {
    try {
      const phrase = ftsPhrase(term);
      const total = db.prepare('SELECT COUNT(*) AS n FROM chapter_fts WHERE chapter_fts MATCH ?').get(phrase).n;
      const rows = db.prepare(`
        SELECT chapter_fts.book_id AS bookId,
               books.title AS bookTitle,
               chapter_fts.chapter_index AS chapterIndex,
               chapter_fts.chapter_title AS chapterTitle,
               chapter_fts.text AS text
        FROM chapter_fts
        JOIN books ON books.id = chapter_fts.book_id
        WHERE chapter_fts MATCH ?
        ORDER BY bm25(chapter_fts)
        LIMIT ?
      `).all(phrase, limit);
      return { total: Number(total) || 0, rows: rows };
    } catch (error) {
      // Fall through to LIKE: a query FTS cannot parse must still find text.
    }
  }
  const pattern = likePattern(term);
  const total = db.prepare(`
    SELECT COUNT(*) AS n
    FROM chapters
    WHERE chapters.text LIKE ? ESCAPE '\\' OR chapters.chapter_title LIKE ? ESCAPE '\\'
  `).get(pattern, pattern).n;
  const rows = db.prepare(`
    SELECT chapters.book_id AS bookId,
           books.title AS bookTitle,
           chapters.chapter_index AS chapterIndex,
           chapters.chapter_title AS chapterTitle,
           chapters.text AS text
    FROM chapters
    JOIN books ON books.id = chapters.book_id
    WHERE chapters.text LIKE ? ESCAPE '\\' OR chapters.chapter_title LIKE ? ESCAPE '\\'
    ORDER BY chapters.book_id, chapters.chapter_index
    LIMIT ?
  `).all(pattern, pattern, limit);
  return { total: Number(total) || 0, rows: rows };
}

function indexWhere(conditions) {
  return conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
}

function parseTags(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

/**
 * Notes from the index, in the shape renderNotes expects. `meta.notes` is a
 * zero-filled array only because the renderer uses its length for the "库里有
 * N 条摘录" hint; the query itself never loads every note.
 */
export async function queryNotesIndex(dir, options) {
  const prepared = await ensureIndex(String(dir || ''));
  if (!prepared) return null;
  const opts = options && typeof options === 'object' ? options : {};
  const term = String(opts.query || '').trim();
  const book = String(opts.book || '').trim();
  const tag = String(opts.tag || '').trim();
  const limit = Math.min(Math.max(Math.round(asNumber(opts.limit, 20)), 1), 200);
  const conditions = [];
  const params = [];
  if (term) {
    const pattern = likePattern(term);
    conditions.push("(LOWER(n.text) LIKE LOWER(?) ESCAPE '\\' OR LOWER(n.note) LIKE LOWER(?) ESCAPE '\\')");
    params.push(pattern, pattern);
  }
  if (book) {
    const pattern = likePattern(book);
    conditions.push("(n.book_id = ? OR LOWER(b.title) LIKE LOWER(?) ESCAPE '\\')");
    params.push(book, pattern);
  }
  if (tag) {
    conditions.push('EXISTS (SELECT 1 FROM json_each(n.tags) WHERE LOWER(json_each.value) = LOWER(?))');
    params.push(tag);
  }
  const where = indexWhere(conditions);
  try {
    const stored = prepared.db.prepare('SELECT COUNT(*) AS n FROM notes').get().n;
    const total = prepared.db.prepare('SELECT COUNT(*) AS n FROM notes n JOIN books b ON b.id = n.book_id' + where).get(...params).n;
    const rows = prepared.db.prepare(`
      SELECT n.id AS id,
             n.book_id AS bookId,
             b.title AS bookTitle,
             n.chapter_index AS chapterIndex,
             COALESCE(
               (SELECT c.chapter_title FROM chapters c WHERE c.book_id = n.book_id AND c.chapter_id = n.chapter_id LIMIT 1),
               (SELECT c.chapter_title FROM chapters c WHERE c.book_id = n.book_id AND c.chapter_index = n.chapter_index LIMIT 1),
               ''
             ) AS chapterTitle,
             n.text AS text,
             n.note AS note,
             n.tags AS tags,
             n.color AS color,
             n.created_at AS createdAt
      FROM notes n
      JOIN books b ON b.id = n.book_id
      ${where}
      ORDER BY n.created_at DESC, n.id ASC
      LIMIT ?
    `).all(...params, limit);
    return {
      result: {
        total: Number(total) || 0,
        notes: rows.map(function note(row) {
          return {
            id: row.id,
            bookId: row.bookId,
            bookTitle: row.bookTitle,
            chapterIndex: Number(row.chapterIndex) || 0,
            chapterTitle: row.chapterTitle || null,
            text: row.text || '',
            note: row.note || '',
            tags: parseTags(row.tags),
            color: row.color || null,
            createdAt: Number(row.createdAt) || null,
          };
        }),
        limit: limit,
        query: term,
        book: book,
        tag: tag,
      },
      meta: {
        source: 'snapshot',
        where: prepared.snapshot,
        notes: new Array(Number(stored) || 0).fill(null),
      },
    };
  } finally {
    try { prepared.db.close(); } catch (error) { /* ignore */ }
  }
}

/** Bookmarks from the index, in the shape renderBookmarks expects. */
export async function queryBookmarksIndex(dir, options) {
  const prepared = await ensureIndex(String(dir || ''));
  if (!prepared) return null;
  const opts = options && typeof options === 'object' ? options : {};
  const term = String(opts.query || '').trim();
  const book = String(opts.book || '').trim();
  const withNote = opts.withNote === true;
  const limit = Math.min(Math.max(Math.round(asNumber(opts.limit, 20)), 1), 200);
  const conditions = [];
  const params = [];
  if (term) {
    const pattern = likePattern(term);
    conditions.push("(LOWER(n.excerpt) LIKE LOWER(?) ESCAPE '\\' OR LOWER(n.note) LIKE LOWER(?) ESCAPE '\\')");
    params.push(pattern, pattern);
  }
  if (book) {
    const pattern = likePattern(book);
    conditions.push("(n.book_id = ? OR LOWER(b.title) LIKE LOWER(?) ESCAPE '\\')");
    params.push(book, pattern);
  }
  if (withNote) conditions.push("TRIM(n.note) <> ''");
  const where = indexWhere(conditions);
  try {
    const stored = prepared.db.prepare('SELECT COUNT(*) AS n FROM bookmarks').get().n;
    const total = prepared.db.prepare('SELECT COUNT(*) AS n FROM bookmarks n JOIN books b ON b.id = n.book_id' + where).get(...params).n;
    const rows = prepared.db.prepare(`
      SELECT n.id AS id,
             n.book_id AS bookId,
             b.title AS bookTitle,
             n.chapter_index AS chapterIndex,
             COALESCE(
               (SELECT c.chapter_title FROM chapters c WHERE c.book_id = n.book_id AND c.chapter_id = n.chapter_id LIMIT 1),
               (SELECT c.chapter_title FROM chapters c WHERE c.book_id = n.book_id AND c.chapter_index = n.chapter_index LIMIT 1),
               n.chapter_title,
               ''
             ) AS chapterTitle,
             n.page AS page,
             n.progress AS progress,
             n.excerpt AS excerpt,
             n.note AS note,
             n.created_at AS createdAt
      FROM bookmarks n
      JOIN books b ON b.id = n.book_id
      ${where}
      ORDER BY n.created_at DESC, n.id ASC
      LIMIT ?
    `).all(...params, limit);
    return {
      result: {
        total: Number(total) || 0,
        bookmarks: rows.map(function bookmark(row) {
          return {
            id: row.id,
            bookId: row.bookId,
            bookTitle: row.bookTitle,
            chapterIndex: Number(row.chapterIndex) || 0,
            chapterTitle: row.chapterTitle || null,
            progress: Number(row.progress) || 0,
            page: row.page === null || row.page === undefined ? null : Number(row.page),
            excerpt: row.excerpt || '',
            note: row.note || '',
            createdAt: Number(row.createdAt) || null,
          };
        }),
        limit: limit,
        query: term,
        book: book,
        withNote: withNote,
      },
      meta: {
        source: 'snapshot',
        where: prepared.snapshot,
        bookmarks: new Array(Number(stored) || 0).fill(null),
      },
    };
  } finally {
    try { prepared.db.close(); } catch (error) { /* ignore */ }
  }
}

/** Shelf rows from the index, rendered through the same filters/formatter. */
export async function queryShelfIndex(dir, options) {
  const prepared = await ensureIndex(String(dir || ''));
  if (!prepared) return null;
  try {
    const rows = prepared.db.prepare(`
      SELECT id, title, author, subtitle, tags, added_at AS addedAt, status, pinned,
             progress_percent AS progressPercent, chapter_index AS chapterIndex,
             chapter_title AS chapterTitle, updated_at AS updatedAt, seconds,
             is_finished AS isFinished, rating, review AS reviewText, source
      FROM books
    `).all();
    const books = rows.map(function book(row) {
      return {
        id: row.id,
        title: row.title,
        author: row.author || '',
        subtitle: row.subtitle || '',
        status: row.status || 'unread',
        isFinished: Boolean(row.isFinished),
        pinned: Boolean(row.pinned),
        progressPercent: Number(row.progressPercent) || 0,
        chapterIndex: Number(row.chapterIndex) || 0,
        chapterTitle: row.chapterTitle || null,
        updatedAt: Number(row.updatedAt) || null,
        seconds: Number(row.seconds) || 0,
        rating: Number(row.rating) || null,
        reviewText: row.reviewText || '',
        tags: parseTags(row.tags),
        source: row.source || 'local',
      };
    });
    return renderShelfBooks(filterShelfBooks(books, options), {
      source: 'snapshot',
      where: prepared.snapshot,
    });
  } finally {
    try { prepared.db.close(); } catch (error) { /* ignore */ }
  }
}

function todayKey() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Statistics assembled from the same cache; the snapshot remains the fallback. */
export async function queryStatsIndex(dir) {
  const prepared = await ensureIndex(String(dir || ''));
  if (!prepared) return null;
  try {
    const counts = { reading: 0, finished: 0, wishlist: 0, shelved: 0, unread: 0 };
    prepared.db.prepare('SELECT status, COUNT(*) AS n FROM books GROUP BY status').all().forEach(function row(item) {
      if (counts[item.status] !== undefined) counts[item.status] = Number(item.n) || 0;
    });
    const totalBooks = prepared.db.prepare('SELECT COUNT(*) AS n FROM books').get().n;
    const dayRows = prepared.db.prepare('SELECT day, seconds FROM days ORDER BY day').all();
    const days = {};
    let totalSeconds = 0;
    let activeDays = 0;
    dayRows.forEach(function row(item) {
      const seconds = Math.max(0, asNumber(item.seconds, 0));
      days[item.day] = seconds;
      if (seconds > 0) { totalSeconds += seconds; activeDays += 1; }
    });
    const rankedBooks = prepared.db.prepare(`
      SELECT id, title, author, seconds, is_finished AS isFinished, progress_percent AS progressPercent
      FROM books WHERE seconds > 0 ORDER BY seconds DESC
    `).all().map(function row(item) {
      return {
        id: item.id,
        title: item.title,
        author: item.author,
        seconds: Number(item.seconds) || 0,
        isFinished: Boolean(item.isFinished),
        percent: Number(item.progressPercent) || 0,
      };
    });
    const noteCount = prepared.db.prepare('SELECT COUNT(*) AS n FROM notes').get().n;
    const bookmarkCount = prepared.db.prepare('SELECT COUNT(*) AS n FROM bookmarks').get().n;
    const reviewCount = prepared.db.prepare("SELECT COUNT(*) AS n FROM books WHERE rating > 0 OR TRIM(review) <> ''").get().n;
    const stats = {
      totalBooks: Number(totalBooks) || 0,
      readingCount: counts.reading,
      finishedCount: counts.finished,
      shelvedCount: counts.shelved,
      wishlistCount: counts.wishlist,
      unreadCount: counts.unread,
      todaySeconds: Math.max(0, asNumber(days[todayKey()], 0)),
      totalSeconds: totalSeconds,
      activeDays: activeDays,
      streak: computeReadingStreak(days),
      weekComparison: computeWeekComparison(days),
      rankedBooks: rankedBooks,
      noteCount: Number(noteCount) || 0,
      bookmarkCount: Number(bookmarkCount) || 0,
      reviewCount: Number(reviewCount) || 0,
    };
    return renderReaderStats(stats, { source: 'snapshot', where: prepared.snapshot });
  } finally {
    try { prepared.db.close(); } catch (error) { /* ignore */ }
  }
}

/**
 * Remove cache files whose source library is gone. Caches without a recorded
 * source path are left alone: they may belong to an older version and still be
 * useful, and guessing would delete the wrong file.
 */
export async function pruneIndexes() {
  const mod = await loadSqlite();
  if (!mod || typeof mod.DatabaseSync !== 'function') return { available: false, removed: 0 };
  let names = [];
  try { names = fs.readdirSync(indexRoot()); } catch (error) { return { available: true, removed: 0 }; }
  let removed = 0;
  names.filter(function sqlite(name) { return /\.sqlite$/i.test(name); }).forEach(function each(name) {
    const file = path.join(indexRoot(), name);
    let db = null;
    try {
      db = new mod.DatabaseSync(file);
      db.exec('PRAGMA query_only = ON;');
      const meta = readMeta(db);
      if (!meta.sourcePath) return;
      if (fs.existsSync(path.join(meta.sourcePath, 'library.json'))) return;
      db.close();
      db = null;
      fs.rmSync(file, { force: true });
      ['-wal', '-shm'].forEach(function sidecar(ext) {
        try { fs.rmSync(file + ext, { force: true }); } catch (error) { /* ignore */ }
      });
      removed += 1;
    } catch (error) {
      /* A cache that cannot be inspected is not proof that it is abandoned. */
    } finally {
      if (db) { try { db.close(); } catch (error) { /* ignore */ } }
    }
  });
  return { available: true, removed: removed };
}

/** Read-only status for the library-config reply; never builds the index. */
export async function indexStatus(dir) {
  const mod = await loadSqlite();
  const snapshot = path.join(String(dir || ''), 'library.json');
  let stat;
  try { stat = fs.statSync(snapshot); } catch (error) { return { available: Boolean(mod), built: false }; }
  if (!mod || typeof mod.DatabaseSync !== 'function') return { available: false, built: false };
  const file = indexPathFor(dir);
  if (!fs.existsSync(file)) return { available: true, built: false, file: file };
  let db = null;
  try {
    db = openDatabase(mod, file);
    db.exec('PRAGMA query_only = ON;');
    const meta = readMeta(db);
    const books = db.prepare('SELECT COUNT(*) AS n FROM books').get().n;
    const notes = db.prepare('SELECT COUNT(*) AS n FROM notes').get().n;
    const bookmarks = db.prepare('SELECT COUNT(*) AS n FROM bookmarks').get().n;
    return {
      available: true,
      built: true,
      file: file,
      bytes: fs.statSync(file).size,
      books: Number(books) || 0,
      notes: Number(notes) || 0,
      bookmarks: Number(bookmarks) || 0,
      schema: Number(meta.schema) || 0,
      builtAt: Number(meta.builtAt) || 0,
      stale: !(meta.schema === String(SCHEMA_VERSION) && meta.snapshotMtime === String(stat.mtimeMs) && meta.snapshotSize === String(stat.size)),
    };
  } catch (error) {
    return { available: true, built: false, file: file, error: String(error && error.message || error) };
  } finally {
    if (db) { try { db.close(); } catch (error) { /* ignore */ } }
  }
}

/**
 * Search the derived index. Returns null when SQLite/FTS5 is unavailable so the
 * caller can fall back to the snapshot scanner without changing tool output.
 */
export async function searchLibraryIndex(dir, query, limit) {
  const term = String(query || '').trim();
  if (!term) return null;
  const prepared = await ensureIndex(String(dir || ''));
  if (!prepared) return null;
  const max = Math.min(Math.max(Math.round(asNumber(limit, 20)), 1), MAX_HITS);
  try {
    const result = queryRows(prepared.db, term, max);
    return {
      query: term,
      total: result.total,
      hits: result.rows.map(function hit(row) {
        return {
          bookId: row.bookId,
          bookTitle: row.bookTitle,
          chapterIndex: row.chapterIndex,
          chapterTitle: row.chapterTitle || null,
          snippet: snippetOf(row.text, term),
        };
      }),
      limit: max,
      source: 'snapshot',
      where: prepared.snapshot,
      indexed: true,
    };
  } finally {
    try { prepared.db.close(); } catch (error) { /* ignore */ }
  }
}
