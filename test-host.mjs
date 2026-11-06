/**
 * Host-half tests: the reading tools read a library folder (or a backup JSON)
 * through the same tool definitions the plugin registers, using a fake registry
 * so no dsh process is needed. The host may cache a disposable SQLite index,
 * but the folder and backup stay the only sources of truth.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { apply, defineReaderTools } from './index.js';
import { indexPathFor, indexStatus, pruneIndexes, queryBookmarksIndex, queryNotesIndex, queryShelfIndex, queryStatsIndex, searchLibraryIndex } from './hostindex.js';
import {
  chaptersOf,
  collectShelfBooks,
  computeReadingStreak,
  computeWeekComparison,
  filterBookmarks,
  filterNotes,
  filterShelfBooks,
  findLatestBackup,
  formatDuration,
  getReaderShelf,
  inspectLibraryDir,
  formatBytes,
  looksLikeBackup,
  readEpubSync,
  readLibraryDir,
  searchBooks,
} from './hostlib.js';

const workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'shiguang-host-'));
// Keep remembered settings inside the temp tree instead of the real ~/.dsh.
process.env.DSH_HOME = path.join(workdir, 'dshhome');

const chapter = (id, title, paragraphs) => ({ id, title, paragraphs });

// A backup shaped like the one the shelf exports.
const backupState = {
  v: 1,
  settings: { theme: 'auto', fontSize: 21 },
  customBooks: [
    {
      id: 'local-rjc',
      title: '人间词话',
      author: '王国维',
      tags: ['随笔'],
      addedAt: 1699000000000,
      format: 'txt',
      chapters: [
        chapter('rjc-1', '卷一', ['境界说：诗词以境界为最上。有境界则自成高格，自有名句。', '造境与写境：有造境，有写境，此理想与写实二派之所由分。然二者颇难分别。', '有我与无我：有有我之境，有无我之境。泪眼问花花不语，乱红飞过秋千去，可谓有我之境；采菊东篱下，悠然见南山，可谓无我之境。']),
        chapter('rjc-2', '卷二', ['境非独谓景物也，喜怒哀乐亦人心中之一境界。故能写真景物真感情者，谓之有境界；否则谓之无境界。', '气象须有，而不可有我。有我之境，人惟于静中得之；无我之境，于由动之静时得之。']),
        chapter('rjc-3', '卷三', ['古今之成大事业大学问者，必经过三种之境界：昨夜西风凋碧树，独上高楼，望尽天涯路。此第一境也。', '衣带渐宽终不悔，为伊消得人憔悴。此第二境也。', '众里寻他千百度，蓦然回首，那人却在灯火阑珊处。此第三境也。']),
      ],
    },
    {
      id: 'local-a',
      title: '大书',
      author: '某人',
      tags: ['随笔', '长文'],
      addedAt: 1700000000000,
      format: 'epub',
      chapters: [
        chapter('a-1', '第一章', ['一', '二', '三']),
        chapter('a-2', '第二章', ['众里寻他千百度，蓦然回首']),
      ],
    },
    { id: 'local-b', title: '小册子', author: '另一位', addedAt: 1700500000000, chapters: [chapter('b-1', '唯一一章', ['短'])] },
  ],
  progress: {
    'local-rjc': { chapterIndex: 1, percent: 0.25, completed: false, updatedAt: 1700900000000 },
    'local-a': { chapterIndex: 0, percent: 1, completed: true, updatedAt: 1700800000000 },
    'local-b': { chapterIndex: 0, percent: 0.5, updatedAt: 1700700000000 },
  },
  highlights: [
    { id: 'h1', bookId: 'local-a', chapterIndex: 0, chapterId: 'a-1', text: '一', note: '想法', tags: ['好句'], color: 'amber', createdAt: 1700910000000 },
    { id: 'h2', bookId: 'local-a', chapterIndex: 1, chapterId: 'a-2', text: '蓦然回首', note: '', tags: [], color: 'mint', createdAt: 1700911000000 },
    { id: 'h3', bookId: 'local-rjc', chapterIndex: 0, chapterId: 'rjc-1', text: '境界', note: '', tags: [], color: 'amber', createdAt: 1700912000000 },
  ],
  bookmarks: [
    { id: 'b1', bookId: 'local-a', chapterIndex: 1, chapterId: 'a-2', percent: 0.5, page: 3, chapterTitle: '第二章', excerpt: '蓦然回首', note: '回看这一句', createdAt: 1700920000000 },
    { id: 'b2', bookId: 'local-b', chapterIndex: 0, chapterId: 'b-1', percent: 0.2, excerpt: '短', note: '', createdAt: 1700921000000 },
  ],
  stats: {
    goalMinutes: 180,
    days: { '2026-11-01': 600, '2026-11-02': 1200, 'bad-key': 30 },
    byBook: { 'local-a': 3600, 'local-rjc': 600 },
  },
  sessions: [{ id: 's1', bookId: 'local-a', startedAt: 1730000000000, endedAt: 1730000600000, seconds: 600, chapterIndex: 0 }],
  reviews: { 'local-a': { rating: 5, text: '很好', updatedAt: 1700950000000 } },
  userTags: { 'local-b': ['待读'] },
  pins: ['local-a'],
  wishlist: ['local-b'],
  shelved: ['local-rjc'],
};

const backupPath = path.join(workdir, 'shiguang-backup.json');
fs.writeFileSync(backupPath, JSON.stringify(backupState));

// --- registry -------------------------------------------------------------

// The real registry is not importable outside dsh, so the specs are built with
// an identity `defineTool`; `apply` itself must stay quiet without the package.
const declared = defineReaderTools((spec) => spec, {});
const registered = [];
const warnings = [];
const ctx = {
  tools: { register(spec) { registered.push(spec); } },
  logger: { info() {}, warn(message) { warnings.push(message); } },
};
await apply(ctx, {});
assert.deepEqual(registered, [], 'no tools registered without @deepseek-ai/dsh-tools');
assert.match(warnings.join(' '), /dsh-tools unavailable/);
declared.forEach((spec) => registered.push(spec));
assert.deepEqual(registered.map((spec) => spec.name).sort(), [
  'reading_book_read',
  'reading_bookmarks',
  'reading_library_config',
  'reading_notes',
  'reading_search',
  'reading_shelf',
  'reading_stats',
]);
const byName = new Map(registered.map((spec) => [spec.name, spec]));
// No user-facing database tools: the index is an internal cache, not a mirror.
assert.equal(byName.has('reading_db_build'), false);
assert.equal(byName.has('reading_db_query'), false);
assert.equal(byName.has('reading_db_info'), false);
for (const spec of registered) {
  assert.equal(typeof spec.description, 'string');
  assert.ok(spec.description.length > 40, spec.name + ' has a model-facing description');
  assert.equal(typeof spec.execute, 'function');
  assert.equal(spec.output.schema.type, 'string');
  assert.equal(typeof spec.output.render({}, 'x')[0].text, 'string');
  assert.doesNotMatch(spec.description, /database|SQLite|mirror/i, spec.name + ' no longer mentions a database');
}

// --- library folder -------------------------------------------------------

// What the client writes into a chosen folder: library.json with disk-backed
// bodies stripped, plus one books/<id>.json per body.
const libraryDir = path.join(workdir, '阅读');
fs.mkdirSync(path.join(libraryDir, 'books'), { recursive: true });
const snapshot = {
  v: 1,
  settings: { theme: 'paper' },
  customBooks: [
    backupState.customBooks[0],
    { id: 'local-a', title: '大书', author: '某人', addedAt: 1700000000000, chaptersInFs: true, tags: ['随笔'] },
    { id: 'local-b', title: '小册子', author: '另一位', addedAt: 1700500000000, chapters: [chapter('b-1', '唯一一章', ['短', '句'])] },
  ],
  progress: { 'local-a': { chapterIndex: 0, percent: 0.25, updatedAt: 1700900000000 } },
  highlights: [
    { id: 'n1', bookId: 'local-a', chapterIndex: 0, chapterId: 'a-1', text: '昨夜西风凋碧树', note: '第一重境界', tags: ['秋天', '名句'], createdAt: 1700000000000 },
    { id: 'n2', bookId: 'local-a', chapterIndex: 1, chapterId: 'a-2', text: '独上高楼', note: '', tags: ['秋天'], createdAt: 1700000100000 },
    { id: 'n3', bookId: 'local-rjc', chapterIndex: 2, text: '蓦然回首', note: '第三重', tags: [], createdAt: 1700000200000 },
  ],
  bookmarks: [
    { id: 'm1', bookId: 'local-a', chapterIndex: 1, chapterId: 'a-2', percent: 0.5, page: 12, excerpt: '灯火阑珊', note: '这里要回看', createdAt: 1700000300000 },
    { id: 'm2', bookId: 'local-a', chapterIndex: 0, chapterId: 'a-1', percent: 0.1, excerpt: '西风', note: '', createdAt: 1700000400000 },
  ],
  stats: { days: { '2026-11-03': 300 }, byBook: { 'local-a': 300 } },
  sessions: [{ id: 's1', bookId: 'local-a', startedAt: 1730000000000, seconds: 300, chapterIndex: 0 }],
};
fs.writeFileSync(path.join(libraryDir, 'library.json'), JSON.stringify(snapshot));
fs.writeFileSync(path.join(libraryDir, 'books', 'local-a.json'), JSON.stringify({
  v: 1,
  id: 'local-a',
  title: '大书',
  chapters: [
    chapter('a-1', '第一章', ['昨夜西风凋碧树，独上高楼。', '望尽天涯路。']),
    chapter('a-2', '第二章', ['众里寻他千百度，蓦然回首，那人却在灯火阑珊处。']),
  ],
}));

// --- search ---------------------------------------------------------------

const search = byName.get('reading_search');

// Bodies come from books/*.json, so a stripped snapshot still searches.
const found = await search.execute({ libraryDir, query: '灯火阑珊' });
assert.match(found, /命中 \d+ 章/);
assert.match(found, /来源：书库目录/);
assert.match(found, /大书/);
assert.match(found, /第二章/);
assert.match(found, /灯火阑珊/);

// A term only the imported book has, and a miss reported as a miss.
const bodyOnly = await search.execute({ libraryDir, query: '望尽天涯路' });
assert.match(bodyOnly, /大书/);
assert.match(await search.execute({ libraryDir, query: '这句话哪本书都没有' }), /没有命中/);
assert.equal(await search.execute({ libraryDir, query: '' }), '请给出要搜索的内容。');

// No folder: the backup carries bodies inline and works the same way.
const backupHit = await search.execute({ backupPath, query: '望尽天涯路' });
assert.match(backupHit, /来源：备份文件/);
assert.match(backupHit, /人间词话/);

// The host-side FTS index is derived from the same folder. It must answer both
// long (trigram) and short (LIKE fallback) Chinese queries without changing shape.
const indexed = await searchLibraryIndex(libraryDir, '灯火阑珊', 20);
assert.ok(indexed, 'node:sqlite FTS index is available in the host test runtime');
assert.equal(indexed.indexed, true);
assert.equal(indexed.source, 'snapshot');
assert.equal(indexed.hits[0].bookTitle, '大书');
assert.equal(indexed.hits[0].chapterIndex, 1);
assert.match(indexed.hits[0].snippet, /灯火阑珊/);
assert.ok(fs.existsSync(indexPathFor(libraryDir)), 'index cache lives outside the library folder');
assert.ok(!fs.existsSync(path.join(libraryDir, 'index.sqlite')), 'library folder is not polluted by the cache');
const shortIndexed = await searchLibraryIndex(libraryDir, '西风', 20);
assert.ok(shortIndexed && shortIndexed.hits.length >= 1, 'two-character query falls back to LIKE');
assert.equal((await searchLibraryIndex(libraryDir, '这句话哪本书都没有', 20)).total, 0);
assert.equal(await searchLibraryIndex(path.join(workdir, 'missing-library'), '西风', 20), null);

// The index is keyed by snapshot mtime/size, so a changed snapshot must rebuild
// rather than serving a stale hit.
snapshot.customBooks[2].chapters[0].paragraphs.push('刚刚写下的新句子');
fs.writeFileSync(path.join(libraryDir, 'library.json'), JSON.stringify(snapshot));
const rebuilt = await searchLibraryIndex(libraryDir, '刚刚写下的新句子', 20);
assert.ok(rebuilt && rebuilt.total === 1, 'snapshot change invalidates the cache');
assert.match(rebuilt.hits[0].snippet, /刚刚写下的新句子/);

const indexedNotes = await queryNotesIndex(libraryDir, { limit: 20 });
assert.ok(indexedNotes);
assert.equal(indexedNotes.result.total, 3);
assert.equal(indexedNotes.meta.notes.length, 3);
assert.equal(indexedNotes.result.notes[0].bookTitle, '人间词话');
assert.equal(indexedNotes.result.notes[0].chapterTitle, '卷三');
assert.deepEqual(indexedNotes.result.notes.find((note) => note.id === 'n1').tags, ['秋天', '名句']);
assert.equal((await queryNotesIndex(libraryDir, { query: '西风' })).result.total, 1);
assert.equal((await queryNotesIndex(libraryDir, { tag: '秋天' })).result.total, 2);
assert.equal((await queryNotesIndex(libraryDir, { book: '大书', tag: '秋天' })).result.total, 2);
assert.equal((await queryNotesIndex(libraryDir, { query: '秋天' })).result.total, 0, 'query only matches text and thought');
const indexedMarks = await queryBookmarksIndex(libraryDir, { limit: 20 });
assert.ok(indexedMarks);
assert.equal(indexedMarks.result.total, 2);
const indexedMark = indexedMarks.result.bookmarks.find((item) => item.id === 'm1');
assert.equal(indexedMark.page, 12);
assert.equal(indexedMark.progress, 0.5);
assert.equal((await queryBookmarksIndex(libraryDir, { withNote: true })).result.total, 1);
assert.equal((await queryBookmarksIndex(libraryDir, { query: '灯火' })).result.total, 1);

const indexedShelf = await queryShelfIndex(libraryDir, { limit: 20 });
assert.ok(indexedShelf);
assert.match(indexedShelf, /书架藏书（共 3 本）/);
assert.match(indexedShelf, /大书/);
const finishedShelf = await queryShelfIndex(libraryDir, { status: 'finished', limit: 20 });
assert.match(finishedShelf, /书架藏书（共 0 本）/);
const readingShelf = await queryShelfIndex(libraryDir, { status: 'reading', limit: 20 });
assert.match(readingShelf, /书架藏书（共 1 本）/);

const indexedStats = await queryStatsIndex(libraryDir);
assert.ok(indexedStats);
assert.match(indexedStats, /阅读统计看板/);
assert.match(indexedStats, /【书架概况（共 3 本）】/);
assert.match(indexedStats, /在读 1 本/);
assert.match(indexedStats, /划线想法：3 条 · 书签：2 个/);

const status = await indexStatus(libraryDir);
assert.equal(status.built, true);
assert.equal(status.books, 3);
assert.equal(status.notes, 3);
assert.equal(status.bookmarks, 2);
assert.equal(status.stale, false);
assert.ok(status.bytes > 0);

// Pure search: no filesystem, ordering follows book then chapter order.
const pure = searchBooks([
  { id: 'x', title: '书一', chapters: [chapter('x1', '甲', ['同一句话']), chapter('x2', '乙', ['另一句', '同一句话'])] },
  { id: 'y', title: '书二', chapters: [chapter('y1', '丙', ['无关'])] },
], '同一句话', 10);
assert.equal(pure.total, 2);
assert.deepEqual(pure.hits.map((hit) => hit.chapterIndex), [0, 1]);
assert.match(pure.hits[0].snippet, /同一句话/);
assert.equal(searchBooks([{ id: 'x', title: '书', chapters: [] }], '词', 5).total, 0);
assert.throws(() => searchBooks([], '  ', 5), /empty-query/);
assert.equal(searchBooks([], '词', 5).limit, 5);
assert.equal(searchBooks([], '词', 0).limit, 1, 'limit floors at 1');
assert.equal(searchBooks([], '词', 9999).limit, 200, 'limit caps at 200');

// --- reading a book -------------------------------------------------------

const read = byName.get('reading_book_read');

const outline = await read.execute({ libraryDir, title: 'local-rjc' });
assert.match(outline, /人间词话|local-rjc/);
assert.ok(outline.indexOf('章') > 0, 'outline is returned');

const chapterOne = await read.execute({ libraryDir, title: 'local-rjc', chapterIndex: 1 });
assert.match(chapterOne, /第 1\/\d+ 章/);
assert.ok(chapterOne.length > 60, 'chapter text is returned');

// Imported books read their body from the folder.
const imported = await read.execute({ libraryDir, title: '大书' });
assert.match(imported, /本地导入/);
assert.match(imported, /共 2 章/);
const importedChapter = await read.execute({ libraryDir, title: '大书', chapterIndex: 2 });
assert.match(importedChapter, /第 2\/2 章/);
assert.match(importedChapter, /灯火阑珊/);

// A partial title is enough when it is unambiguous.
assert.match(await read.execute({ libraryDir, title: '册子' }), /小册子/);

// Truncation is honoured literally, and says how much was cut.
const short = await read.execute({ libraryDir, title: 'local-rjc', chapterIndex: 1, maxChars: 10 });
assert.match(short, /已截断/);
assert.ok(short.indexOf('本章') > 0, 'truncation is reported');
assert.ok(short.split('\n').slice(1, -1).join('\n').length <= 12, 'chapter text is truncated');

// Failures answer in words, never as raw exception text.
assert.match(await read.execute({ title: '根本不存在的书' }), /没找到/);
assert.match(await read.execute({ libraryDir, title: 'local-rjc', chapterIndex: 99 }), /超出范围/);
assert.match(await read.execute({ title: '' }), /请给出书名或 id/);

// Ambiguity: two books share a substring that is not either exact title.
const dupDir = path.join(workdir, 'dup');
fs.mkdirSync(dupDir);
fs.writeFileSync(path.join(dupDir, 'library.json'), JSON.stringify({
  v: 1,
  customBooks: [{ id: 'local-d1', title: '同名书甲', chaptersInFs: true }, { id: 'local-d2', title: '同名书乙', chaptersInFs: true }],
  progress: {},
  highlights: [],
  bookmarks: [],
}));
const ambiguousText = await read.execute({ libraryDir: dupDir, title: '同名' });
assert.match(ambiguousText, /书名不唯一/);
assert.match(ambiguousText, /同名书甲/);
assert.match(ambiguousText, /同名书乙/);
assert.match(await read.execute({ libraryDir: dupDir, title: '同名书甲' }), /同名书甲/);

// --- notes ----------------------------------------------------------------

assert.equal(filterNotes([], {}).total, 0);
const noteSample = [
  { id: 'x1', bookId: 'b', bookTitle: '书', chapterIndex: 0, text: '西风', note: '', tags: ['秋'], createdAt: 100 },
  { id: 'x2', bookId: 'b', bookTitle: '书', chapterIndex: 0, text: '落叶', note: '想到西风', tags: '秋,夜', createdAt: 300 },
];
assert.deepEqual(filterNotes(noteSample, {}).notes.map((note) => note.id), ['x2', 'x1'], 'newest first');
assert.equal(filterNotes(noteSample, { query: '西风' }).total, 2, 'keyword matches text and note');
assert.equal(filterNotes(noteSample, { tag: '秋' }).total, 2, 'tags work as array or comma string');
assert.equal(filterNotes(noteSample, { limit: 1 }).total, 2, 'total counts before the limit');

const notesTool = byName.get('reading_notes');
const allNotes = await notesTool.execute({ libraryDir });
assert.match(allNotes, /共 3 条/);
assert.match(allNotes, /来源：书库目录/);
assert.ok(allNotes.indexOf('蓦然回首') < allNotes.indexOf('昨夜西风凋碧树'), 'newest first');
assert.match(allNotes, /《人间词话》/, 'local-rjc resolves to its title');
assert.match(allNotes, /第 3 章/);
assert.match(allNotes, /想法：第一重境界/);
assert.match(allNotes, /标签：秋天、名句/);

assert.match(await notesTool.execute({ libraryDir, query: '西风' }), /共 1 条/);
assert.match(await notesTool.execute({ libraryDir, query: '秋天' }), /没有匹配的记录/);
assert.match(await notesTool.execute({ libraryDir, query: '秋天' }), /一共有 3 条摘录/);
assert.match(await notesTool.execute({ libraryDir, tag: '秋天' }), /共 2 条/);
assert.match(await notesTool.execute({ libraryDir, book: '大书', tag: '秋天' }), /共 2 条/);
assert.match(await notesTool.execute({ libraryDir, book: '不存在的书' }), /没有匹配的记录/);
const oneNote = await notesTool.execute({ libraryDir, limit: 1 });
assert.match(oneNote, /共 3 条，显示最新 1 条/);
assert.equal(oneNote.match(/^\d+\. /gm).length, 1);

// The backup carries the same highlights, so the tool works without a folder.
const notesFromBackup = await notesTool.execute({ backupPath });
assert.match(notesFromBackup, /来源：备份文件/);
assert.match(notesFromBackup, /共 3 条/);

// --- bookmarks ------------------------------------------------------------

const marks = [
  { id: 'm1', bookId: 'b', bookTitle: '书', chapterIndex: 0, excerpt: '灯火', note: '回看', createdAt: 200 },
  { id: 'm2', bookId: 'b', bookTitle: '书', chapterIndex: 1, excerpt: '西风', note: '', createdAt: 100 },
];
assert.equal(filterBookmarks([], {}).total, 0);
assert.deepEqual(filterBookmarks(marks, {}).bookmarks.map((item) => item.id), ['m1', 'm2'], 'newest first');
assert.equal(filterBookmarks(marks, { query: '灯火' }).total, 1);
assert.equal(filterBookmarks(marks, { query: '回看' }).total, 1, 'keyword also matches the note');
assert.equal(filterBookmarks(marks, { withNote: true }).total, 1);
assert.equal(filterBookmarks(marks, { book: '书' }).total, 2);
assert.equal(filterBookmarks(marks, { book: '别的' }).total, 0);

const bookmarksTool = byName.get('reading_bookmarks');
const allMarks = await bookmarksTool.execute({ libraryDir });
assert.match(allMarks, /共 2 个/);
assert.match(allMarks, /来源：书库目录/);
assert.match(allMarks, /第 12 页/);
assert.match(await bookmarksTool.execute({ libraryDir, withNote: true }), /仅含备注/);
assert.match(await bookmarksTool.execute({ libraryDir, query: '灯火' }), /共 1 个/);
assert.match(await bookmarksTool.execute({ backupPath }), /来源：备份文件/);

// --- stats ----------------------------------------------------------------

assert.equal(formatDuration(0), '0 分钟');
assert.equal(formatDuration(45), '45 秒');
assert.equal(formatDuration(3600), '1 小时');

const testRef = new Date('2026-11-04T12:00:00Z');
assert.equal(computeReadingStreak({}, testRef), 0);
assert.equal(computeReadingStreak({ '2026-11-04': 100, '2026-11-03': 200 }, testRef), 2);
assert.equal(computeReadingStreak({ '2026-11-03': 200 }, testRef), 1, 'today empty, yesterday keeps it');
assert.equal(computeReadingStreak({ '2026-11-04': 100, '2026-11-02': 50 }, testRef), 1, 'a gap breaks it');

const weekComp = computeWeekComparison({ '2026-11-04': 600, '2026-10-27': 300 }, testRef);
assert.equal(weekComp.current, 600);
assert.equal(weekComp.previous, 300);
assert.equal(weekComp.direction, 'up');

const statsTool = byName.get('reading_stats');
const statsFromFolder = await statsTool.execute({ libraryDir });
assert.match(statsFromFolder, /阅读统计看板/);
assert.match(statsFromFolder, /来源：书库目录/);
assert.match(statsFromFolder, /【阅读节律】/);
assert.match(statsFromFolder, /连续阅读：/);
assert.match(statsFromFolder, /【书架概况（共 3 本）】/);

// Shelf precedence matches the shelf's own grouping: finished > shelved > reading.
const statsFromBackup = await statsTool.execute({ backupPath });
assert.match(statsFromBackup, /来源：备份文件/);
assert.match(statsFromBackup, /【书架概况（共 3 本）】/);
assert.match(statsFromBackup, /在读 1 本 · 已读完 1 本 · 想读 0 本 · 搁置 1 本/);
assert.match(statsFromBackup, /《大书》/);

// --- reading_shelf --------------------------------------------------------

const shelfTool = byName.get('reading_shelf');
assert.ok(shelfTool, 'reading_shelf is registered');
const shelfAll = await shelfTool.execute({ libraryDir });
assert.match(shelfAll, /来源：书库目录/);
assert.match(shelfAll, /【书架藏书（共 3 本）】/);
assert.match(shelfAll, /《大书》 · 某人 \[在读\]/);
assert.match(shelfAll, /进度 25%/);

// Filter by status on libraryDir
const shelfReading = await shelfTool.execute({ libraryDir, status: 'reading' });
assert.match(shelfReading, /《大书》/);

// Filter on backupPath (which has pins, reviews, ratings, wishlist, shelved)
const shelfBackup = await shelfTool.execute({ backupPath });
assert.match(shelfBackup, /来源：备份文件/);
assert.match(shelfBackup, /📌 《大书》 · 某人 \[已读完\]/);
assert.match(shelfBackup, /★★★★★/);
assert.match(shelfBackup, /书评：“很好”/);

// Filter by tag on backupPath
const shelfTagged = await shelfTool.execute({ backupPath, tag: '待读' });
assert.match(shelfTagged, /《小册子》/);
assert.match(shelfTagged, /标签：#待读/);

// Filter by query
const shelfQuery = await shelfTool.execute({ backupPath, query: '大书' });
assert.match(shelfQuery, /来源：备份文件/);
assert.match(shelfQuery, /《大书》/);

// Filter by minRating
const shelfRated = await shelfTool.execute({ backupPath, minRating: 5 });
assert.match(shelfRated, /《大书》/);
const shelfHighRatedNone = await shelfTool.execute({ libraryDir, minRating: 5 });
assert.match(shelfHighRatedNone, /没有匹配的书籍/);
assert.match(shelfHighRatedNone, /评分 ≥ 5★/);

// Filter by hasReview
const shelfWithReview = await shelfTool.execute({ backupPath, hasReview: true });
assert.match(shelfWithReview, /《大书》/);
assert.match(shelfWithReview, /书评：“很好”/);
const shelfNoReview = await shelfTool.execute({ libraryDir, hasReview: true });
assert.match(shelfNoReview, /没有匹配的书籍/);
assert.match(shelfNoReview, /仅看有书评/);

// Direct functions
const collectedBooks = collectShelfBooks(backupState);
assert.equal(collectedBooks.length, 3);
const finishedOnly = filterShelfBooks(collectedBooks, { status: 'finished' });
assert.equal(finishedOnly.total, 1);
assert.equal(finishedOnly.books[0].title, '大书');
const ratedDirect = filterShelfBooks(collectedBooks, { minRating: 5, hasReview: true });
assert.equal(ratedDirect.total, 1);
assert.equal(ratedDirect.books[0].title, '大书');

const directShelf = getReaderShelf({ libraryDir });
assert.match(directShelf, /【书架藏书（共 3 本）】/);

// Empty match
const shelfEmpty = await shelfTool.execute({ libraryDir, query: '不存在的书籍' });
assert.match(shelfEmpty, /没有匹配的书籍/);

// --- settings & failures --------------------------------------------------

const configTool = byName.get('reading_library_config');
assert.match(await configTool.execute({}), /未设置/);
const remembered = await configTool.execute({ libraryDir });
assert.match(remembered, /已记住书库目录/);
assert.match(remembered, /1 份正文/);
const settingsFile = path.join(process.env.DSH_HOME, 'storages', 'shiguang-reader', 'settings.json');
assert.equal(JSON.parse(fs.readFileSync(settingsFile, 'utf8')).libraryDir, libraryDir);
// dbPath is gone from the settings file shape.
assert.equal('dbPath' in JSON.parse(fs.readFileSync(settingsFile, 'utf8')), false);

// Once remembered, the tools need no path argument.
assert.match(await search.execute({ query: '灯火阑珊' }), /来源：书库目录/);
assert.match(await statsTool.execute({}), /来源：书库目录/);

assert.match(await configTool.execute({ libraryDir: path.join(workdir, 'missing') }), /目录不存在/);
assert.match(await configTool.execute({ forget: true }), /已清空记住的路径/);
assert.deepEqual(JSON.parse(fs.readFileSync(settingsFile, 'utf8')), {});

// A folder without the snapshot explains itself; junk is not a backup.
const bareDir = path.join(workdir, 'bare');
fs.mkdirSync(bareDir);
assert.match(await search.execute({ query: '词', libraryDir: bareDir }), /没有 library\.json/);
assert.match(await notesTool.execute({ libraryDir: bareDir }), /没有 library\.json/);
const junk = path.join(workdir, 'junk.json');
fs.writeFileSync(junk, JSON.stringify({ hello: 'world' }));
assert.match(await statsTool.execute({ backupPath: junk }), /不是拾光阅读的备份/);
assert.equal(looksLikeBackup(backupState), true);
assert.equal(looksLikeBackup({ hello: 1 }), false);
assert.equal(findLatestBackup([path.join(workdir, 'empty-dir')]), null);

// --- readable bodies ------------------------------------------------------

// A folder written today keeps `books/书名--id.txt`: plain text, one `# 标题` line
// per chapter. Chapter ids live in the snapshot, so highlights and chapter
// progress still point at the same chapter after the body is reread.
const textDir = path.join(workdir, '可读书库');
fs.mkdirSync(path.join(textDir, 'books'), { recursive: true });
fs.writeFileSync(path.join(textDir, 'library.json'), JSON.stringify({
  v: 1,
  customBooks: [
    { id: 'local-t', title: '可读的书', author: '某人', addedAt: 1700000000000, chaptersInFs: true, chapterIds: ['t-1', 't-2'] },
  ],
  progress: {},
}));
fs.writeFileSync(
  path.join(textDir, 'books', '可读的书--local-t.txt'),
  '# 第一章\n\n西风凋碧树，\n\n独上高楼。\n\n# 第二章\n\n衣带渐宽终不悔。\n',
);

const textLook = inspectLibraryDir(textDir);
const textBytes = {
  snapshot: fs.statSync(path.join(textDir, 'library.json')).size,
  bodies: fs.statSync(path.join(textDir, 'books', '可读的书--local-t.txt')).size,
  sources: 0,
  pictures: 0,
};
textBytes.total = textBytes.snapshot + textBytes.bodies;
assert.deepEqual(textLook, { dir: textDir, exists: true, snapshot: true, books: 1, pictures: 0, bytes: textBytes });
assert.deepEqual(inspectLibraryDir(path.join(workdir, 'nowhere')).bytes, { snapshot: 0, bodies: 0, sources: 0, pictures: 0, total: 0 });

// Sizes read the way people say them; nothing negative or NaN reaches a reply.
assert.equal(formatBytes(0), '0 B');
assert.equal(formatBytes(-5), '0 B');
assert.equal(formatBytes('x'), '0 B');
assert.equal(formatBytes(812), '812 B');
assert.equal(formatBytes(1536), '1.5 KB');
assert.equal(formatBytes(200 * 1024), '200 KB');
assert.equal(formatBytes(12.1 * 1024 * 1024), '12.1 MB');
assert.equal(formatBytes(1.2 * 1024 ** 3), '1.20 GB');
const txtRead = readLibraryDir(textDir);
assert.equal(txtRead.bodies, 1, 'the readable body is found');
assert.deepEqual(txtRead.state.customBooks[0].chapters.map((c) => c.id), ['t-1', 't-2'], 'ids come from the snapshot');
assert.deepEqual(txtRead.state.customBooks[0].chapters[0].paragraphs, ['西风凋碧树，', '独上高楼。']);

const bookTool = byName.get('reading_book_read');
const txtOutline = await bookTool.execute({ libraryDir: textDir, title: '可读的书' });
assert.match(txtOutline, /共 2 章/);
assert.match(txtOutline, /第一章/);
const chapterText = await bookTool.execute({ libraryDir: textDir, title: '可读的书', chapterIndex: 2 });
assert.match(chapterText, /第二章/);
assert.match(chapterText, /衣带渐宽终不悔/);
assert.match(await search.execute({ libraryDir: textDir, query: '独上高楼' }), /可读的书/);
assert.match(await search.execute({ libraryDir: textDir, query: '独上高楼' }), /第一章/);

// A book with pictures is a trio on disk: the text, the original file, and an
// `.assets/` folder. The text carries one marker paragraph per picture; a reader
// here should see the prose and hear that the pictures exist, not the markers.
const pictureDir = path.join(workdir, '带图书库');
const pictureAssets = path.join(pictureDir, 'books', '潮水与灯塔--local-pic.assets');
fs.mkdirSync(pictureAssets, { recursive: true });
fs.writeFileSync(path.join(pictureDir, 'library.json'), JSON.stringify({
  v: 1,
  customBooks: [{ id: 'local-pic', title: '潮水与灯塔', author: '某人', chaptersInFs: true, chapterIds: ['pic-1'] }],
}));
fs.writeFileSync(
  path.join(pictureDir, 'books', '潮水与灯塔--local-pic.txt'),
  '# 第一章 灯塔\n\n潮水漫过礁石。\n\n![潮水](img-1-1.png)\n\n灯塔亮了一夜。\n\n![灯塔](img-1-2.png)\n',
);
fs.writeFileSync(path.join(pictureAssets, 'img-1-1.png'), Buffer.from([137, 80, 78, 71, 1]));
fs.writeFileSync(path.join(pictureAssets, 'img-1-2.png'), Buffer.from([137, 80, 78, 71, 2]));
fs.writeFileSync(path.join(pictureDir, 'books', '潮水与灯塔--local-pic.epub'), Buffer.from([80, 75, 3, 4]));
const pictureLook = inspectLibraryDir(pictureDir);
assert.equal(pictureLook.books, 1, 'the .assets folder and the .epub are not extra books');
assert.equal(pictureLook.pictures, 2);
// Each part of the trio is weighed in its own bucket.
assert.equal(pictureLook.bytes.pictures, 10, 'two 5-byte pictures');
assert.equal(pictureLook.bytes.sources, 4, 'the original file is a source, not a body');
assert.equal(pictureLook.bytes.bodies, fs.statSync(path.join(pictureDir, 'books', '潮水与灯塔--local-pic.txt')).size);
assert.equal(pictureLook.bytes.total, pictureLook.bytes.snapshot + pictureLook.bytes.bodies + 4 + 10);
const pictureConfig = await configTool.execute({ libraryDir: pictureDir });
assert.match(pictureConfig, /占用空间：共 \d+ B（正文 \d+ B、原始文件 4 B、图片 10 B、快照 \d+ B）/);
assert.match(pictureConfig, /检索索引：/);
await configTool.execute({ forget: true });
const pictureChapters = readLibraryDir(pictureDir).state.customBooks[0].chapters;
assert.deepEqual(
  pictureChapters[0].paragraphs,
  ['潮水漫过礁石。', '![潮水](img-1-1.png)', '灯塔亮了一夜。', '![灯塔](img-1-2.png)'],
  'the marker survives the text round-trip',
);
const pictureChapterText = await bookTool.execute({ libraryDir: pictureDir, title: '潮水与灯塔', chapterIndex: 1 });
assert.ok(pictureChapterText.includes('潮水漫过礁石。\n灯塔亮了一夜。'), 'the pictures do not break the paragraph flow');
assert.equal(pictureChapterText.indexOf('!['), -1, 'no marker leaks into what a reader reads');
assert.match(pictureChapterText, /2 张插图/);
// Not just "there are pictures": the real path, so a caller can open the file.
assert.ok(pictureChapterText.includes(path.join(pictureAssets, 'img-1-1.png')), 'the first picture path is real');
assert.ok(pictureChapterText.includes(path.join(pictureAssets, 'img-1-2.png')), 'the second picture path is real');
// No folder on disk means no path — pointing at a directory that is not there would
// be worse than saying nothing.
fs.rmSync(pictureAssets, { recursive: true, force: true });
const pictureNoCache = await bookTool.execute({ libraryDir: pictureDir, title: '潮水与灯塔', chapterIndex: 1 });
assert.match(pictureNoCache, /2 张插图/);
assert.equal(pictureNoCache.includes('.assets'), false, 'no path is invented when the folder is gone');
assert.ok(pictureNoCache.includes('img-1-1.png'), 'the names are still listed');
assert.match(await bookTool.execute({ libraryDir: pictureDir, title: '潮水与灯塔' }), /共 1 章/);
assert.match(await search.execute({ libraryDir: pictureDir, query: '灯塔亮' }), /潮水与灯塔/);
assert.match(await search.execute({ libraryDir: pictureDir, query: 'img-1-1' }), /没有命中/, 'a picture name is not readable text');

// A book with no saved ids still reads: the parser falls back to positional ids,
// which is why the client saves them — this is the last-resort path, not the plan.
fs.writeFileSync(path.join(textDir, 'library.json'), JSON.stringify({
  v: 1,
  customBooks: [{ id: 'local-t', title: '可读的书', chaptersInFs: true }],
}));
assert.deepEqual(readLibraryDir(textDir).state.customBooks[0].chapters.map((c) => c.id), ['imp-c1', 'imp-c2']);

// The index is optional: index:false must use the snapshot path and say so.
const snapshotOnly = defineReaderTools((spec) => spec, { index: false });
const snapshotByName = new Map(snapshotOnly.map((spec) => [spec.name, spec]));
assert.match(await snapshotByName.get('reading_search').execute({ libraryDir, query: '灯火阑珊' }), /大书/);
assert.match(await snapshotByName.get('reading_library_config').execute({ libraryDir }), /检索索引：已禁用/);

// Both formats in one folder: the readable body wins over the older JSON, whose
// stale text would otherwise show up as duplicated or outdated content.
fs.writeFileSync(path.join(textDir, 'books', 'local-t.json'), JSON.stringify({
  v: 1, id: 'local-t', title: '可读的书', chapters: [chapter('old-1', '旧章', ['旧内容'])]
}));
const both = readLibraryDir(textDir).state.customBooks[0].chapters;
assert.deepEqual(both.map((c) => c.title), ['第一章', '第二章'], 'txt wins over json');

// A folder whose body file is gone degrades to metadata instead of throwing.
fs.rmSync(path.join(textDir, 'books'), { recursive: true, force: true });
fs.mkdirSync(path.join(textDir, 'books'));
assert.equal(readLibraryDir(textDir).bodies, 0);
assert.deepEqual(chaptersOf({ id: 'local-t', chaptersInFs: true }, textDir), []);
assert.match(await bookTool.execute({ libraryDir: textDir, title: '可读的书' }), /正文没有读到/);

// A cache whose source library is gone can be pruned on demand; caches are
// external to the library, so this never touches book data.
const pruneDir = path.join(workdir, 'prune-source');
fs.mkdirSync(path.join(pruneDir, 'books'), { recursive: true });
fs.writeFileSync(path.join(pruneDir, 'library.json'), JSON.stringify({
  v: 1,
  customBooks: [{ id: 'local-prune', title: '待清理', chapters: [chapter('p1', '唯一章', ['可以清理的缓存'])] }],
}));
const pruneIndexPath = indexPathFor(pruneDir);
assert.ok(await searchLibraryIndex(pruneDir, '可以清理', 20));
assert.ok(fs.existsSync(pruneIndexPath));
fs.rmSync(pruneDir, { recursive: true, force: true });
const pruned = await pruneIndexes();
assert.ok(pruned.removed >= 1);
assert.equal(fs.existsSync(pruneIndexPath), false, 'abandoned cache is removed');
assert.ok(fs.existsSync(indexPathFor(libraryDir)), 'live library cache is kept');

// Direct EPUB sync reading: reads native chapters without writing or needing TXT
const directEpubChapters = readEpubSync('tests/sample.epub');
assert.equal(directEpubChapters.length, 2);
assert.equal(directEpubChapters[0].title, 'Chapter One');
assert.equal(directEpubChapters[0].paragraphs[0], '海风从窗边吹进来。');
assert.equal(directEpubChapters[1].title, '第二章 归航');
assert.equal(directEpubChapters[1].paragraphs[1], '她把书合上，听见远处的汽笛。');

// EPUB stored directly on disk without .txt file in library folder
const epubDiskDir = path.join(workdir, '纯EPUB书库');
fs.mkdirSync(path.join(epubDiskDir, 'books'), { recursive: true });
fs.writeFileSync(path.join(epubDiskDir, 'library.json'), JSON.stringify({
  v: 1,
  customBooks: [{ id: 'local-epub-pure', title: '海边的书', author: '测试作者', chaptersInFs: true, format: 'epub' }],
}));
fs.copyFileSync('tests/sample.epub', path.join(epubDiskDir, 'books', '海边的书--local-epub-pure.epub'));
const epubDiskInspect = inspectLibraryDir(epubDiskDir);
assert.equal(epubDiskInspect.books, 1, 'inspectLibraryDir identifies native epub as a book');
assert.equal(epubDiskInspect.bytes.sources > 0, true);

const epubDiskRead = readLibraryDir(epubDiskDir);
assert.equal(epubDiskRead.state.customBooks[0].chapters.length, 2, 'reads chapters directly from disk .epub');
assert.equal(epubDiskRead.state.customBooks[0].chapters[0].paragraphs[0], '海风从窗边吹进来。');

const epubSearchResult = searchBooks(epubDiskRead.state.customBooks, '远处的汽笛');
assert.equal(epubSearchResult.hits.length, 1);
assert.equal(epubSearchResult.hits[0].bookId, 'local-epub-pure');
assert.equal(epubSearchResult.hits[0].chapterTitle, '第二章 归航');

fs.rmSync(workdir, { recursive: true, force: true });

console.log('PASS  host reading tools: registry, search, book, notes, bookmarks, shelf, stats, settings');
