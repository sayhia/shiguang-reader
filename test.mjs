import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('./', import.meta.url);
const read = (name) => readFileSync(new URL(name, root), 'utf8');
const plain = (value) => JSON.parse(JSON.stringify(value));

// Minimal imported book used as a known id now that the built-in books are gone.
const rjcBook = {
  id: 'local-rjc',
  title: '人间词话',
  author: '王国维',
  chapters: [
    { id: 'rjc-1', title: '卷一', paragraphs: ['境界', '造境与写境', '有我与无我'] },
    { id: 'rjc-2', title: '卷二', paragraphs: ['境非独谓景物', '气象'] },
  ],
};

const packageJson = JSON.parse(read('package.json'));
const zhMeta = JSON.parse(read('locale/zh.json'));
const enMeta = JSON.parse(read('locale/en.json'));
assert.equal(packageJson.name, '@local/shiguang-reader');
assert.equal(packageJson.dsh.bundle.patch, './cordis.patch.yml');
assert.equal(packageJson.dsh.client.platform, 'web');
assert.ok(zhMeta.meta.title && zhMeta.meta.description);
assert.ok(enMeta.meta.title && enMeta.meta.description);
assert.ok(statSync(new URL('icon.svg', root)).size < 256 * 1024);
assert.match(read('icon.svg'), /<svg[\s>]/);

let clientSource = read('client.js');
const marker = '    return {\n      inject:';
assert.ok(clientSource.includes(marker), 'plugin export marker is present');
const exposed = '    globalThis.__test = { bytesToBase64, downscaleCoverDataUrl, makeCoverThumbnail, invertSelectionKeys, pickRandomHighlight, peakWeekday, sortReviewItems, formatClock, formatBookInfo, formatWordCount, buildBookTitlesText, parseImportedBook, saveState, unwrittenBookIds, parseEpubBook, normalizeState, defaultState, searchBookChapters, chapterBaseOffsets, weekSeries, weekComparison, weekDeltaLabel, stepIndex, readerKeyAction, stepFontSize, resolveReaderTheme, splitDuplicateImports, importBookSignature, lastReadRelative, stripFsBookBodies, stateForStorage, adoptLibrarySnapshot, orphanBodyIds, deferBodyRemoval, imageParagraph, chapterText, fsRememberSource, fsBase64ToBytes, bookBodyText, parseBookBodyText, chapterIdsOf, markBodiesOnDisk, fsBodyFileName, fsSafeName, fsDeleteBodyFile, fsWriteBookBody, fsWriteNewBookBody, fsReadBookBody, fsDeleteBookBody, fsMigrateBodiesToText, fsLibrarySupported, fsErrorCode, fsChooseDirectory, fsWriteSnapshotNow, mergePins, applyTagToBooks, removeTagFromBooks, removeBooksFromState, toggleId, setBooksFinished, setIdsBulk, recolorHighlights, readingStreak, progressPercent, progressChapter, decodeTextBytes, makeBackupPayload, parseBackupPayload, withBookMetadata, sortShelfBooks, computeAchievements, cleanUserTags, cleanNoteTags, renameBookTagEverywhere, removeBookTagEverywhere, bookTagSummary, matchBookTags, averageDailySeconds, estimateFinish, dayKey, paletteResults, groupNotesByMonth, groupNotesByBook, CommandPalette, sameTagList, renameHighlightTag, removeHighlightTag, applyTagToHighlights, removeTagFromHighlights, highlightSegments, searchTerms, matchAllTerms, translate, fill, normalizeChapterMarks, recordChapterMark, chapterResumePercent, normalizeSessions, normalizeReviews, bookNotesMarkdown, bookFullMarkdown, bookMarkdownFilename, buildReviewText, buildQuoteText, buildCalloutText, selectedAnnotationsMarkdown, notebookMarkdown, notebookByTagMarkdown, booklistMarkdown, reviewsMarkdown, sortNotebookItems, chapterOverview, splitSelectionKeys, ShelfView, StatsView, NotesView, TagManagerDialog, readerLightbox, BookDetail, Reader, PasteImportDialog, QuoteCardDialog, quoteCardText, wrapQuoteText, quoteCardLayout, quoteCardTheme, quoteCardFilename, drawQuoteCard, collectionCardLayout, drawCollectionCard, quoteCollectionFilename, QuoteCollectionDialog, monthlySummary, readingTimeOfDay, monthKeyOf, monthlyCardLayout, drawMonthlyCard, monthlyCardFilename, MonthlyCardDialog, dailyGoalMinutes, todayGoalProgress, remainingReadingMinutes, sessionsForBook, sessionsOnDay, pickDailyQuote, similarBooks, pickRandomBook, resolveContinueBook, groupBooksByStatus, readingReportMarkdown, searchLibraryBooks, bookReadingRanking, tagReadingTotals, nextSleepTimer, readerExcerptAt, recentDays, heatLevel, weekdayTotals, splitSpeechChunks, speechLanguage, speechChunkOffsets, nextSpeechChapter };\n';
const instrumented = clientSource.replace(marker, exposed + marker);

const registrations = [];
const dictionaryRegistrations = [];
const localeService = {
  bind() { return (key) => key; },
  register(ns, localeId) { dictionaryRegistrations.push(ns + ':' + localeId); return () => {}; },
  subscribe() { return () => {}; },
  getSnapshot() { return { active: 'zh-CN', locales: [], revision: 0 }; },
  getLocale() { return { active: 'zh-CN', locales: [], revision: 0 }; },
};
const fakeReact = {
  Component: class Component {},
  // A real element, not an empty object: render smoke tests can then walk the tree
  // and check that a control is wired to the handler it claims to have.
  createElement(type, props) {
    const children = Array.prototype.slice.call(arguments, 2);
    const next = Object.assign({}, props);
    if (children.length) next.children = children.length === 1 ? children[0] : children;
    return { type: type, props: next };
  },
  useCallback(fn) { return fn; },
  useEffect() {},
  useLayoutEffect() {},
  useMemo(fn) { return fn(); },
  useRef(value) { return { current: value }; },
  useState(value) { return [value, () => {}]; },
  useSyncExternalStore() {},
};
const ctx = {
  get(name) { return name === 'locale' ? localeService : undefined; },
  effect(fn) { fn(); return () => {}; },
  slots: {
    inject(key, callback) { callback(); },
    register(options) { registrations.push(options.name + ':' + (options.id || options.key)); return () => {}; },
  },
};
let spec = null;
const sandbox = {
  window: {
    __ModuleLoader__: { load(value) { spec = value; } },
    localStorage: { getItem() { return null; }, setItem() {} },
    addEventListener() {},
    removeEventListener() {},
    setTimeout() { return 1; },
    clearTimeout() {},
    crypto: { randomUUID() { return 'test-id'; } },
    URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} },
  },
  document: { addEventListener() {}, removeEventListener() {}, createElement() { return {}; }, body: { appendChild() {} } },
  navigator: {},
  TextDecoder,
  btoa,
  Blob,
  Response,
  DecompressionStream,
  console,
};
sandbox.globalThis = sandbox;
vm.runInNewContext(instrumented, sandbox);
assert.ok(spec, 'client module registers itself');
const plugin = spec.factory(() => fakeReact);
assert.equal(typeof plugin.apply, 'function');
plugin.apply(ctx);
assert.deepEqual(registrations, ['sidebar.panellist:shiguang-reader', 'main:shiguang-reader']);
assert.ok(dictionaryRegistrations.includes('shiguangReader:zh-CN'));
assert.ok(dictionaryRegistrations.includes('shiguangReader:en'));

const T = sandbox.__test;
assert.ok(T, 'test hooks exposed');

// Import parsing: front matter, chapter headings, paragraph grouping.
const sample = '海边书稿\n\n第一章 起风\n\n第一段。\n\n第二段。\n\n第二章 落雨\n\n雨落下来。\n\n海面很静。';
const imported = T.parseImportedBook('海边.txt', sample);
assert.equal(imported.chapters.length, 2);
assert.equal(imported.chapters[0].title, '第一章 起风');
assert.deepEqual(plain(imported.chapters[0].paragraphs), ['第一段。', '第二段。']);
assert.equal(imported.source, 'local');

// Headingless long text is broken into navigable sections.
const longText = Array.from({ length: 20 }, (_, index) => '第' + (index + 1) + '段。' + '海风把书页吹开，又合上。'.repeat(18)).join('\n\n');
const longBook = T.parseImportedBook('长文.md', longText);
assert.ok(longBook.chapters.length > 1, 'long headingless text should be chapterized');

// Text decoding handles BOM-marked UTF-16 and UTF-8.
const utf8Bytes = new TextEncoder().encode('第一章 海风');
assert.equal(T.decodeTextBytes(utf8Bytes), '第一章 海风');
const utf16 = Buffer.from([0xff, 0xfe, 0x2c, 0x7b, 0x20, 0x00, 0x4e, 0x00]);
assert.equal(T.decodeTextBytes(new Uint8Array(utf16)), '第 N');
assert.equal(T.decodeTextBytes(new Uint8Array([0xba, 0xa3, 0xb7, 0xe7])), '海风');

// Empty input is rejected.
assert.throws(() => T.parseImportedBook('空.txt', ' \n\n '), /empty/);

// No artificial ceilings. The shelf used to stop at 24 books and a body at
// 1.6M characters, so a big library silently lost whatever came after the cut.
const wideShelf = T.normalizeState({
  customBooks: Array.from({ length: 40 }, (_, index) => ({
    id: 'local-wide-' + index,
    title: '书' + index,
    chapters: [{ id: 'w' + index, title: '唯一一章', paragraphs: ['一段文字'] }],
  })),
});
assert.equal(wideShelf.customBooks.length, 40, 'a 40-book shelf survives normalization');
const longChapter = '甲'.repeat(1700000);
const bigBody = T.normalizeState({
  customBooks: [{ id: 'local-huge', title: '巨书', chapters: [{ id: 'h1', title: '唯一一章', paragraphs: [longChapter] }] }],
});
assert.equal(bigBody.customBooks.length, 1);
assert.equal(bigBody.customBooks[0].chapters[0].paragraphs[0].length, 1700000, 'chapter text is not truncated at 1.6M chars');

// The import-time check is only worth having if a failed write is tellable apart
// from a good one: the toast hangs off exactly this boolean.
assert.equal(T.saveState(T.normalizeState({})), true, 'a write inside quota succeeds');
const realSetItem = sandbox.window.localStorage.setItem;
sandbox.window.localStorage.setItem = function full() {
  const error = new Error('quota');
  error.name = 'QuotaExceededError';
  throw error;
};
assert.equal(T.saveState(T.normalizeState({})), false, 'a full quota reports false instead of throwing');
sandbox.window.localStorage.setItem = realSetItem;

// Normalization clamps bad settings and drops dangling records.
const normalized = T.normalizeState({
  settings: { theme: 'unknown', fontSize: 999, lineHeight: 1, fontFamily: 'mono' },
  customBooks: [rjcBook, { id: 'bad', title: 'bad', chapters: [] }],
  progress: { 'local-rjc': { chapterIndex: 2, percent: 0.5, updatedAt: 10 }, missing: { chapterIndex: 0 } },
  highlights: [
    { id: 'h1', bookId: 'local-rjc', chapterId: 'rjc-2', chapterIndex: 1, start: 3, end: 8, text: '测试', color: 'bad' },
    { id: 'h2', bookId: 'missing', chapterId: 'x', start: 0, end: 1 },
  ],
  stats: { days: { '2026-11-04': 120, invalid: 99 } },
});
assert.deepEqual(plain(normalized.settings), {
  theme: 'paper', fontSize: 28, lineHeight: 1.5, fontFamily: 'serif',
  letterSpacing: 0.02, paragraphSpacing: 0.9, pageWidth: 'comfortable', autoHideChrome: false, highlightColor: 'amber', speechRate: 1, speechVoice: '',
  textAlign: 'justify',
});
const customTypography = T.normalizeState({ settings: { letterSpacing: 1, paragraphSpacing: 0, pageWidth: 'massive', textAlign: 'left' } });
assert.equal(customTypography.settings.letterSpacing, 0.12);
assert.equal(customTypography.settings.paragraphSpacing, 0.5);
assert.equal(customTypography.settings.pageWidth, 'comfortable');
assert.equal(customTypography.settings.autoHideChrome, false);
assert.equal(customTypography.settings.textAlign, 'left');
assert.equal(T.normalizeState({ settings: { autoHideChrome: true } }).settings.autoHideChrome, true);
assert.equal(T.normalizeState({ settings: { highlightColor: 'sky' } }).settings.highlightColor, 'sky');
assert.equal(T.normalizeState({ settings: { highlightColor: 'bad' } }).settings.highlightColor, 'amber');
assert.equal(T.normalizeState({ settings: { fontFamily: 'kai' } }).settings.fontFamily, 'kai');
assert.equal(T.normalizeState({ settings: { fontFamily: 'bad' } }).settings.fontFamily, 'serif');
assert.equal(T.normalizeState({ settings: { speechRate: 99 } }).settings.speechRate, 2);
assert.equal(T.normalizeState({ settings: { speechRate: -1 } }).settings.speechRate, 0.5);
assert.equal(T.normalizeState({ settings: { speechVoice: 'voice-one' } }).settings.speechVoice, 'voice-one');
assert.equal(normalized.progress['local-rjc'].percent, 0.5);
assert.equal(normalized.highlights.length, 1);
assert.equal(normalized.highlights[0].color, 'amber');
assert.equal(normalized.stats.days['2026-11-04'], 120);
assert.equal(normalized.stats.goalMinutes, 180);
assert.equal(T.normalizeState({ customBooks: [rjcBook], stats: { byBook: { 'local-rjc': 120, missing: 50 } } }).stats.byBook['local-rjc'], 120);
assert.equal(T.normalizeState({ stats: { byBook: { missing: 50 } } }).stats.byBook.missing, undefined);
const customGoal = T.normalizeState({ stats: { goalMinutes: 9999, days: {} } });
assert.equal(customGoal.stats.goalMinutes, 1440);
assert.equal(normalized.customBooks.length, 1);

// Highlight tags: cleaned, capped, deduplicated, and preserved through backups.
assert.deepEqual(plain(T.cleanNoteTags([' 海风 ', '海风', '意象', 'x'.repeat(20)])), ['海风', '意象', 'xxxxxxxxxxxx']);
assert.equal(T.cleanNoteTags(Array.from({ length: 8 }, (_, index) => 't' + index)).length, 3);
assert.deepEqual(plain(T.cleanNoteTags('nope')), []);
assert.equal(T.sameTagList(['a', 'b'], ['a', 'b']), true);
assert.equal(T.sameTagList(['a'], ['b']), false);
const taggedHighlight = T.normalizeState({ customBooks: [rjcBook],
  highlights: [{ id: 'h-tag', bookId: 'local-rjc', chapterId: 'rjc-1', chapterIndex: 0, start: 0, end: 2, text: '境界', tags: ['美学', '美学', ' 词 '], color: 'sage' }],
});
assert.deepEqual(plain(taggedHighlight.highlights[0].tags), ['美学', '词']);
assert.deepEqual(plain(T.parseBackupPayload(JSON.stringify(T.makeBackupPayload(taggedHighlight))).highlights[0].tags), ['美学', '词']);
assert.deepEqual(plain(T.normalizeState({ customBooks: [rjcBook], highlights: [{ id: 'h', bookId: 'local-rjc', chapterId: 'rjc-1', start: 0, end: 1 }] }).highlights[0].tags), []);

// Tag batch management: rename rewrites every note, delete only drops the tag.
const tagSource = taggedHighlight.highlights;
const tagRenamed = T.renameHighlightTag(tagSource, '词', '意象');
assert.deepEqual(plain(tagRenamed[0].tags), ['美学', '意象']);
assert.equal(T.renameHighlightTag(tagSource, '不存在', 'x'), tagSource);
assert.equal(T.renameHighlightTag(tagSource, '词', '美学').length, 1);
assert.deepEqual(plain(T.renameHighlightTag(tagSource, '词', '美学')[0].tags), ['美学']);
const tagRemoved = T.removeHighlightTag(tagRenamed, '意象');
assert.deepEqual(plain(tagRemoved[0].tags), ['美学']);
assert.deepEqual(plain(T.removeHighlightTag(tagSource, 'zzz')[0].tags), ['美学', '词']);

// Bulk tagging from the notebook selection bar: only selected notes change, the cap is reported.
const bulkTagSource = [
  { id: 'bt1', tags: [] },
  { id: 'bt2', tags: ['旧'] },
  { id: 'bt3', tags: ['a', 'b', 'c'] },
  { id: 'bt4', tags: [] },
];
const bulkTagged = T.applyTagToHighlights(bulkTagSource, ['bt1', 'bt2', 'bt3'], '海');
assert.equal(bulkTagged.tag, '海');
assert.equal(bulkTagged.applied, 2);
assert.equal(bulkTagged.skipped, 1);
assert.deepEqual(plain(bulkTagged.items[0].tags), ['海']);
assert.deepEqual(plain(bulkTagged.items[1].tags), ['旧', '海']);
assert.deepEqual(plain(bulkTagged.items[2].tags), ['a', 'b', 'c']);
assert.deepEqual(plain(bulkTagged.items[3].tags), []);
// Nothing to do returns the original array so React can skip the update.
const bulkNoop = T.applyTagToHighlights(bulkTagged.items, ['bt1'], '海');
assert.equal(bulkNoop.applied, 0);
assert.equal(bulkNoop.skipped, 0);
assert.equal(bulkNoop.items, bulkTagged.items);
assert.equal(T.applyTagToHighlights(bulkTagSource, [], '海').items, bulkTagSource);
assert.equal(T.applyTagToHighlights(bulkTagSource, ['bt1'], '   ').items, bulkTagSource);
const bulkUntagged = T.removeTagFromHighlights(bulkTagged.items, ['bt1', 'bt2'], '海');
assert.equal(bulkUntagged.removed, 2);
assert.deepEqual(plain(bulkUntagged.items[0].tags), []);
assert.deepEqual(plain(bulkUntagged.items[1].tags), ['旧']);
const untagNoop = T.removeTagFromHighlights(bulkTagSource, ['bt1'], '海');
assert.equal(untagNoop.removed, 0);
assert.equal(untagNoop.items, bulkTagSource);

// Search hits are split into marked runs, keeping the original casing.
assert.deepEqual(plain(T.highlightSegments('海风与海浪', '海')), [
  { text: '海', match: true },
  { text: '风与', match: false },
  { text: '海', match: true },
  { text: '浪', match: false },
]);
assert.deepEqual(plain(T.highlightSegments('Hello World', 'WORLD')), [
  { text: 'Hello ', match: false },
  { text: 'World', match: true },
]);
assert.deepEqual(plain(T.highlightSegments('没有任何匹配', 'xyz')), [{ text: '没有任何匹配', match: false }]);
assert.deepEqual(plain(T.highlightSegments('', '海')), [{ text: '', match: false }]);
assert.deepEqual(plain(T.highlightSegments('海', '')), [{ text: '海', match: false }]);

// Multiple keywords: split on whitespace, AND-matched, every keyword marked, longest wins on ties.
assert.deepEqual(plain(T.searchTerms('  海  夜 夜 ')), ['海', '夜']);
assert.deepEqual(plain(T.searchTerms('')), []);
assert.equal(T.searchTerms('a b c d e f g h').length, 6);
assert.equal(T.matchAllTerms('海风与夜浪', ['海', '夜']), true);
assert.equal(T.matchAllTerms('海风与夜浪', ['海', '雪']), false);
assert.equal(T.matchAllTerms('海风', []), true);
assert.equal(T.matchAllTerms('Hello World', 'hello WORLD'), true);
assert.deepEqual(plain(T.highlightSegments('海边与夜景', '海 夜')), [
  { text: '海', match: true },
  { text: '边与', match: false },
  { text: '夜', match: true },
  { text: '景', match: false },
]);
assert.deepEqual(plain(T.highlightSegments('海浪与夜', '海 海浪')), [
  { text: '海浪', match: true },
  { text: '与夜', match: false },
]);

// t(key, vars) must interpolate its own placeholders instead of leaking "{n}".
assert.equal(T.translate('streakValue', { n: 12 }), '12 天');
assert.equal(T.translate('streakValue', { n: '' }).replace(/\s/g, ''), '天');
assert.equal(T.translate('pageOf', { n: 3, m: 9 }).indexOf('{'), -1);
assert.equal(T.translate('bookCount', { n: 4 }).indexOf('{'), -1);
assert.equal(T.translate('streak'), '连续阅读');
assert.equal(T.translate('missingKeyForTest'), 'missingKeyForTest');
assert.equal(T.fill(T.translate('streakValue'), { n: 5 }), '5 天');
assert.equal(T.fill(T.translate('streakValue'), {}), '{n} 天');

// Book tag management: rename/delete fan out across the whole shelf.
const bookTagSource = { a: ['海', '夜'], b: ['海'], c: ['梦境'] };
const bookTagsRenamed = T.renameBookTagEverywhere(bookTagSource, '海', '潮汐');
assert.deepEqual(plain(bookTagsRenamed), { a: ['潮汐', '夜'], b: ['潮汐'], c: ['梦境'] });
assert.equal(T.renameBookTagEverywhere(bookTagSource, '不存在', 'x'), bookTagSource);
// Renaming onto an existing tag on the same book collapses the duplicate.
assert.deepEqual(plain(T.renameBookTagEverywhere({ a: ['海', '夜'] }, '海', '夜')), { a: ['夜'] });
assert.equal(T.renameBookTagEverywhere(bookTagSource, '海', ''), bookTagSource);
const bookTagsPurged = T.removeBookTagEverywhere(bookTagSource, '海');
assert.deepEqual(plain(bookTagsPurged), { a: ['夜'], c: ['梦境'] });
assert.equal(T.removeBookTagEverywhere(bookTagSource, '不存在'), bookTagSource);
assert.equal(T.removeBookTagEverywhere(bookTagSource, ''), bookTagSource);
assert.deepEqual(plain(T.bookTagSummary(bookTagSource)), [
  { tag: '海', count: 2 },
  { tag: '梦境', count: 1 },
  { tag: '夜', count: 1 },
]);
assert.deepEqual(plain(T.bookTagSummary(null)), []);
// Shelf tag filtering: 'any' matches one of the picks, 'all' requires every pick.
assert.equal(T.matchBookTags(bookTagSource, 'a', [], 'any'), true);
assert.equal(T.matchBookTags(bookTagSource, 'a', ['海'], 'any'), true);
assert.equal(T.matchBookTags(bookTagSource, 'b', ['海', '夜'], 'any'), true);
assert.equal(T.matchBookTags(bookTagSource, 'b', ['海', '夜'], 'all'), false);
assert.equal(T.matchBookTags(bookTagSource, 'a', ['海', '夜'], 'all'), true);
assert.equal(T.matchBookTags(bookTagSource, 'c', ['海'], 'any'), false);
assert.equal(T.matchBookTags(bookTagSource, 'ghost', ['海'], 'any'), false);
assert.equal(T.matchBookTags(bookTagSource, 'a', ['', null], 'all'), true);

// Command palette: one ranked pass over book titles, chapter titles and excerpts.
const paletteBooks = [
  { id: 'pal-b1', title: '海边的卡夫卡', author: '村上春树', tags: [], chapters: [{ id: 'pc1', title: '第一章 海风' }, { id: 'pc2', title: '第二章 灯塔' }] },
  { id: 'pal-b2', title: '人间词话', author: '王国维', tags: [], chapters: [{ id: 'pc3', title: '卷上' }] },
];
const paletteNotes = [
  { id: 'pal-n1', bookId: 'pal-b1', chapterIndex: 0, text: '海风从窗边吹进来。', note: '', createdAt: 200 },
  { id: 'pal-n2', bookId: 'pal-b2', chapterIndex: 0, text: '境界说。', note: '重要', createdAt: 100 },
];
const paletteEmpty = T.paletteResults({ query: '   ', books: paletteBooks, highlights: paletteNotes });
assert.equal(paletteEmpty.total, 0);
assert.deepEqual(plain(paletteEmpty.books), []);
const paletteHit = T.paletteResults({ query: '海', books: paletteBooks, highlights: paletteNotes, userTags: { 'pal-b2': ['海'] }, limit: 3 });
assert.equal(paletteHit.query, '海');
// Title prefix beats a tag-only match.
assert.deepEqual(plain(paletteHit.books.map((book) => book.id)), ['pal-b1', 'pal-b2']);
assert.deepEqual(plain(paletteHit.chapters.map((item) => item.chapter.id)), ['pc1']);
assert.equal(paletteHit.chapters[0].chapterIndex, 0);
assert.deepEqual(plain(paletteHit.notes.map((note) => note.id)), ['pal-n1']);
assert.deepEqual(plain(paletteHit.tags.map((tag) => tag.tag)), ['海'], 'a plain query surfaces matching tags too');
assert.equal(paletteHit.total, 5);
const paletteLimited = T.paletteResults({ query: '海', books: paletteBooks, highlights: paletteNotes, limit: 1 });
assert.equal(paletteLimited.books.length, 1);
assert.equal(paletteLimited.chapters.length, 1);
// Notes come back newest first so the palette surfaces recent excerpts.
const paletteRecentFirst = T.paletteResults({ query: '境界', books: paletteBooks, highlights: paletteNotes });
assert.deepEqual(plain(paletteRecentFirst.notes.map((note) => note.id)), ['pal-n2']);

// Tag prefix search via '#' and 'tag:'
const paletteAllTags = T.paletteResults({ query: '#', books: paletteBooks, userTags: { 'pal-b2': ['海', '散文'] } });
assert.ok(paletteAllTags.tags.some((item) => item.tag === '海'));
assert.ok(paletteAllTags.tags.some((item) => item.tag === '散文'));
assert.equal(paletteAllTags.chapters.length, 0);
assert.equal(paletteAllTags.notes.length, 0);

const paletteHashTag = T.paletteResults({ query: '#海', books: paletteBooks, userTags: { 'pal-b2': ['海'] } });
assert.deepEqual(plain(paletteHashTag.tags.map((item) => item.tag)), ['海']);
assert.deepEqual(plain(paletteHashTag.books.map((b) => b.id)), ['pal-b2']);

const paletteColonTag = T.paletteResults({ query: 'tag:散文', books: paletteBooks, userTags: { 'pal-b2': ['散文'] } });
assert.deepEqual(plain(paletteColonTag.tags.map((item) => item.tag)), ['散文']);
assert.deepEqual(plain(paletteColonTag.books.map((b) => b.id)), ['pal-b2']);

// Notebook timeline buckets by calendar month, newest month first.
const monthBuckets = T.groupNotesByMonth([
  { id: 'm-a', createdAt: new Date(2026, 10, 20).getTime() },
  { id: 'm-b', createdAt: new Date(2026, 10, 2).getTime() },
  { id: 'm-c', createdAt: new Date(2026, 8, 9).getTime() },
]);
assert.equal(monthBuckets.length, 2);
assert.equal(monthBuckets[0].key, '2026-11');
assert.equal(monthBuckets[0].year, 2026);
assert.equal(monthBuckets[0].month, 11);
assert.deepEqual(plain(monthBuckets[0].items.map((note) => note.id)), ['m-a', 'm-b']);
assert.equal(monthBuckets[1].key, '2026-09');
assert.deepEqual(plain(T.groupNotesByMonth([])), []);

// Notebook book groups: one bucket per book, ordered by the newest note inside it.
const groupBooks = [
  { id: 'gb-a', title: '海边的卡夫卡', author: '村上春树' },
  { id: 'gb-b', title: '夜航西飞', author: '柏瑞尔' },
];
const bookBuckets = T.groupNotesByBook([
  { id: 'n1', bookId: 'gb-a', createdAt: 3000 },
  { id: 'n2', bookId: 'gb-b', createdAt: 9000 },
  { id: 'n3', bookId: 'gb-a', createdAt: 5000 },
], groupBooks);
assert.equal(bookBuckets.length, 2);
assert.equal(bookBuckets[0].bookId, 'gb-b');
assert.deepEqual(plain(bookBuckets[0].items.map((note) => note.id)), ['n2']);
assert.equal(bookBuckets[1].bookId, 'gb-a');
assert.equal(bookBuckets[1].title, '海边的卡夫卡');
assert.equal(bookBuckets[1].author, '村上春树');
assert.equal(bookBuckets[1].latestAt, 5000);
assert.deepEqual(plain(bookBuckets[1].items.map((note) => note.id)), ['n1', 'n3']);
// A note whose book is gone still has a bucket, so it never disappears from the list.
const orphanBucket = T.groupNotesByBook([{ id: 'n4', bookId: 'ghost', createdAt: 100 }], groupBooks);
assert.equal(orphanBucket.length, 1);
assert.equal(orphanBucket[0].title, '');
assert.deepEqual(plain(T.groupNotesByBook([], groupBooks)), []);
assert.deepEqual(plain(T.groupNotesByBook(null, null)), []);
assert.equal(T.groupNotesByBook([{ id: 'n5' }], groupBooks).length, 0);

// Finish-time estimation uses the trailing-7-day pace and refuses thin samples.
assert.equal(Math.round(T.averageDailySeconds({ [T.dayKey()]: 600 }, 7)), 86);
assert.equal(T.averageDailySeconds({}, 7), 0);
assert.equal(T.estimateFinish({ chapters: [{}, {}] }, null, 0, 600), null);
const thinProgress = { chapterIndex: 0, percent: 0.01 };
assert.equal(T.estimateFinish({ chapters: Array.from({ length: 10 }, () => ({})) }, thinProgress, 30, 600), null);
const doneEstimate = T.estimateFinish({ chapters: [{}] }, { completed: true }, 900, 600);
assert.equal(doneEstimate.completed, true);
assert.equal(doneEstimate.remainingSeconds, 0);
const halfBook = { chapters: Array.from({ length: 10 }, () => ({})) };
const halfProgress = { chapterIndex: 4, percent: 0.5 };
const halfEstimate = T.estimateFinish(halfBook, halfProgress, 3600, 1800);
assert.equal(halfEstimate.percent, 45);
assert.equal(halfEstimate.totalSeconds, 8000);
assert.equal(halfEstimate.remainingSeconds, 4400);
assert.equal(halfEstimate.daysLeft, 3);
assert.equal(T.estimateFinish(halfBook, halfProgress, 3600, 0).daysLeft, 0);

// Chapter level resume: marks normalized, recorded, and clamped to the readable range.
const chapterIds = [{ id: 'c-1' }, { id: 'c-2' }];
assert.deepEqual(plain(T.normalizeChapterMarks({ 'c-1': 0.42, 'c-2': 'bad', ghost: 0.5, 'c-3': 2 }, chapterIds)), { 'c-1': 0.42 });
assert.deepEqual(plain(T.normalizeChapterMarks(null, chapterIds)), {});
assert.equal(T.normalizeChapterMarks({ 'c-1': 0.123456 }, chapterIds)['c-1'], 0.1235);
const marks = T.recordChapterMark({ 'c-1': 0.2 }, 'c-2', 0.66666);
assert.equal(marks['c-2'], 0.6667);
assert.equal(marks['c-1'], 0.2);
assert.equal(T.recordChapterMark(null, '', 0.5)[''], undefined);
assert.equal(T.chapterResumePercent({ 'c-1': 0.4 }, 'c-1'), 0.4);
assert.equal(T.chapterResumePercent({ 'c-1': 0.999 }, 'c-1'), 0);
assert.equal(T.chapterResumePercent({ 'c-1': 0 }, 'c-1'), 0);
assert.equal(T.chapterResumePercent({}, 'c-1'), 0);
assert.equal(T.chapterResumePercent({ 'c-1': 0.4 }, 'c-9'), 0);
const markedState = T.normalizeState({ customBooks: [rjcBook],
  progress: { 'local-rjc': { chapterIndex: 0, percent: 0.3, chapterMarks: { 'rjc-1': 0.55, ghost: 0.9 } } },
});
assert.deepEqual(plain(markedState.progress['local-rjc'].chapterMarks), { 'rjc-1': 0.55 });
assert.equal(markedState.progress['local-rjc'].percent, 0.3);

// Quote cards: text shaping, line wrapping, and layout stay inside the canvas.
const cardMeasure = (text, size) => Array.from(String(text)).length * size;
assert.deepEqual(plain(T.quoteCardText('  海风  \n\n\n\n月亮  ')), { text: '海风\n\n月亮', truncated: false });
const longQuote = T.quoteCardText('字'.repeat(40), 10);
assert.equal(longQuote.truncated, true);
assert.ok(longQuote.text.endsWith('…'));
assert.deepEqual(plain(T.wrapQuoteText('一二三四五六', 60, (value) => Array.from(value).length * 20)), ['一二三', '四五六']);
assert.deepEqual(plain(T.wrapQuoteText('一二三，四五', 60, (value) => Array.from(value).length * 20)), ['一二三，', '四五']);
const cardLayout = T.quoteCardLayout({ text: '海风从窗边吹进来。', note: '喜欢这句', theme: 'ink' }, cardMeasure);
assert.equal(cardLayout.theme.id, 'ink');
assert.ok(cardLayout.quote.lines.length >= 1);
assert.ok(cardLayout.note.lines.length >= 1);
assert.ok(cardLayout.quoteTop >= 200 && cardLayout.quoteTop <= 700);
assert.ok(cardLayout.dividerY > cardLayout.quoteTop);
assert.ok(cardLayout.noteTop > cardLayout.dividerY);
const denseLayout = T.quoteCardLayout({ text: '字'.repeat(320) }, cardMeasure);
assert.equal(denseLayout.truncated, true);
assert.ok(denseLayout.quote.size >= 32 && denseLayout.quote.size <= 52);
assert.ok(denseLayout.quoteTop >= 200 && denseLayout.quoteTop <= 700);
assert.ok(denseLayout.noteTop + denseLayout.note.lines.length * denseLayout.note.lineHeight <= 1140);
assert.deepEqual(plain(T.quoteCardLayout({ text: '短句' }, cardMeasure).note.lines), []);
assert.equal(T.quoteCardTheme('missing').id, 'paper');
assert.match(T.quoteCardFilename('海边的书'), /^shiguang-quote-海边的书-\d{4}-\d{2}-\d{2}\.png$/);
assert.match(T.quoteCardFilename(''), /^shiguang-quote-quote-\d{4}-\d{2}-\d{2}\.png$/);
assert.equal(T.drawQuoteCard(null, { text: 'x' }), null);

function mockCanvasContext() {
  const calls = [];
  const ctx = {
    font: '', fillStyle: '', strokeStyle: '', lineWidth: 1, textAlign: 'left', textBaseline: 'alphabetic', globalAlpha: 1, letterSpacing: '0px',
    save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
    createLinearGradient() { return { addColorStop() {} }; },
    createRadialGradient() { return { addColorStop() {} }; },
    measureText(text) {
      const match = /(\d+)px/.exec(ctx.font);
      const size = match ? Number(match[1]) : 16;
      return { width: Array.from(String(text)).length * size * 0.62 };
    },
    fillText(text, x, y) { calls.push({ text: String(text), x: x, y: y }); },
  };
  return { ctx: ctx, calls: calls };
}

const painter = mockCanvasContext();
T.drawQuoteCard(painter.ctx, { text: '海风从窗边吹进来。', note: '喜欢这句', bookTitle: '海边的书', chapterTitle: '第一章', date: '11月4日', theme: 'celadon' });
assert.ok(painter.calls.length >= 6, 'quote card paints header, quote, note, and footer');
painter.calls.forEach(function inside(call) {
  assert.ok(call.x >= 0 && call.x <= 1080, 'card text stays inside the canvas width: ' + call.text);
  assert.ok(call.y >= 0 && call.y <= 1350, 'card text stays inside the canvas height: ' + call.text);
});
const densePainter = mockCanvasContext();
T.drawQuoteCard(densePainter.ctx, { text: '字'.repeat(320), note: '想法'.repeat(60), bookTitle: '很长的书名'.repeat(8), theme: 'ink' });
assert.ok(densePainter.calls.length >= 6);
densePainter.calls.forEach(function inside(call) {
  assert.ok(call.y > 0 && call.y < 1350, 'dense card text stays inside the canvas: ' + call.text);
});
assert.ok(densePainter.calls.some(function ellipsis(call) { return call.text.charAt(call.text.length - 1) === '…'; }), 'dense card truncates long text');

// Excerpt collection card: fits up to six quotes inside one 1080x1350 card.
const collectionItems = [
  '海风从窗边吹进来，带着盐的味道。',
  '他想起那年夏天，灯塔下的沉默。',
  '时间在这里慢下来，像潮水退去。',
];
const collectionLayout = T.collectionCardLayout({ items: collectionItems }, cardMeasure);
assert.equal(collectionLayout.count, 3);
assert.equal(collectionLayout.theme.id, 'paper');
assert.ok(collectionLayout.size >= 22 && collectionLayout.size <= 52, 'short collections use larger type');
assert.ok(collectionLayout.top >= 362);
assert.ok(collectionLayout.top + collectionLayout.total <= 1152);
assert.deepEqual(plain(T.collectionCardLayout({ items: collectionItems, theme: 'ink' }, cardMeasure).theme.id), 'ink');
const manyItems = Array.from({ length: 9 }, (_, index) => '第' + (index + 1) + '句摘录，' + '夜色很轻。'.repeat(3));
const manyLayout = T.collectionCardLayout({ items: manyItems }, cardMeasure);
assert.equal(manyLayout.count, 6);
assert.equal(manyLayout.dropped, 3);
assert.ok(manyLayout.top + manyLayout.total <= 1152);
assert.deepEqual(plain(T.collectionCardLayout({ items: [] }, cardMeasure).items), []);
assert.deepEqual(plain(T.collectionCardLayout({ items: ['', '  '] }, cardMeasure).count), 0);
assert.match(T.quoteCollectionFilename('海边的书'), /^shiguang-excerpts-海边的书-\d{4}-\d{2}-\d{2}\.png$/);
assert.match(T.quoteCollectionFilename(''), /^shiguang-excerpts-collection-\d{4}-\d{2}-\d{2}\.png$/);
assert.equal(T.drawCollectionCard(null, { items: collectionItems }), null);
const collectionPainter = mockCanvasContext();
T.drawCollectionCard(collectionPainter.ctx, { items: manyItems, title: '海边的卡夫卡', caption: '4 句摘录', date: '11月4日', theme: 'paper' });
assert.ok(collectionPainter.calls.length >= 8, 'collection card paints header, title, quotes, and footer');
collectionPainter.calls.forEach(function inside(call) {
  assert.ok(call.x >= 0 && call.x <= 1080, 'collection text inside width: ' + call.text);
  assert.ok(call.y > 0 && call.y < 1350, 'collection text inside height: ' + call.text);
});
assert.ok(collectionPainter.calls.some(function title(call) { return call.text === '海边的卡夫卡'; }), 'collection card prints the book title');

// Monthly review: one month of days, sessions, and highlights rolled into card data.
const monthBooks = [
  { id: 'book-a', title: '海边的卡夫卡', author: '村上春树', chapters: [{ title: '第一章 海风' }, { title: '第二章 灯塔' }] },
  { id: 'book-b', title: '夜航西飞', author: '柏瑞尔', chapters: [{ title: '第一章 夜' }] },
];
const monthDays = { '2026-10-31': 600, '2026-11-01': 1800, '2026-11-02': 0, '2026-11-03': 3600 };
const monthSessions = [
  { id: 's1', bookId: 'book-a', startedAt: new Date(2026, 10, 1, 9, 10).getTime(), seconds: 1800, chapterIndex: 0 },
  { id: 's2', bookId: 'book-b', startedAt: new Date(2026, 10, 3, 21, 40).getTime(), seconds: 3600, chapterIndex: 0 },
  { id: 's3', bookId: 'book-a', startedAt: new Date(2026, 9, 31, 22, 0).getTime(), seconds: 600, chapterIndex: 1 },
];
const monthNotes = [
  { id: 'm1', bookId: 'book-a', chapterIndex: 0, text: '海风从窗边吹进来。', note: '', createdAt: new Date(2026, 10, 2, 20, 0).getTime() },
  { id: 'm2', bookId: 'book-b', chapterIndex: 0, text: '上个月的笔记', note: '', createdAt: new Date(2026, 9, 2, 20, 0).getTime() },
];
const monthly = T.monthlySummary({
  days: monthDays, sessions: monthSessions, highlights: monthNotes, books: monthBooks, month: '2026-11',
});
assert.equal(monthly.month, '2026-11');
assert.equal(monthly.year, 2026);
assert.equal(monthly.monthNumber, 11);
assert.equal(monthly.seconds, 5400);
assert.equal(monthly.activeDays, 2);
assert.equal(monthly.bookCount, 2);
assert.equal(monthly.topBooks.length, 2);
assert.equal(monthly.topBooks[0].bookId, 'book-b');
assert.equal(monthly.topBooks[0].seconds, 3600);
assert.equal(monthly.bestDay.day, 3);
assert.equal(monthly.noteCount, 1);
assert.ok(monthly.quote, 'monthly quote comes from this month only');
assert.equal(monthly.quote.text, '海风从窗边吹进来。');
assert.equal(monthly.quote.bookTitle, '海边的卡夫卡');
assert.equal(monthly.quote.chapterTitle, '第一章 海风');
const emptyMonth = T.monthlySummary({ days: {}, sessions: [], highlights: [], books: [], month: '2026-11' });
assert.equal(emptyMonth.seconds, 0);
assert.equal(emptyMonth.activeDays, 0);
assert.equal(emptyMonth.bestDay, null);
assert.equal(emptyMonth.quote, null);
assert.equal(T.monthKeyOf(new Date(2026, 0, 9).getTime()), '2026-01');
assert.equal(T.monthlySummary({}, undefined).month, T.monthKeyOf(Date.now()));

// Time-of-day buckets always come back in order, with the busiest one flagged.
const tod = T.readingTimeOfDay(monthSessions);
assert.equal(tod.total, 6000);
assert.equal(tod.peak, 'evening');
assert.equal(tod.buckets.length, 4);
assert.equal(tod.buckets[0].id, 'dawn');
assert.equal(tod.buckets[0].seconds, 0);
assert.equal(tod.buckets[1].seconds, 1800);
assert.equal(tod.buckets[2].seconds, 0);
assert.equal(tod.buckets[3].seconds, 4200);
assert.ok(tod.buckets[3].ratio > 0.69 && tod.buckets[3].ratio < 0.71);
assert.equal(T.readingTimeOfDay([]).total, 0);
assert.equal(T.readingTimeOfDay([]).peak, '');
assert.equal(T.readingTimeOfDay(undefined).buckets.length, 4);

// Monthly card layout: caps at three stats / three books, keeps quote inside the frame.
const monthLayout = T.monthlyCardLayout({
  theme: 'ink',
  stats: [
    { value: '1小时30分', label: '阅读时长' },
    { value: '12天', label: '阅读天数' },
    { value: '4本', label: '读过' },
    { value: '第4个', label: '要被截断' },
  ],
  books: [
    { title: '夜航西飞', value: '1小时' },
    { title: '海边的卡夫卡', value: '30分钟' },
    { title: '暴雨将至', value: '20分钟' },
    { title: '第四本', value: '10分钟' },
  ],
  quote: '海风从窗边吹进来，带着盐的味道。他想起那年夏天，灯塔下的沉默。时间在这里慢下来，像潮水退去。',
}, cardMeasure);
assert.equal(monthLayout.theme.id, 'ink');
assert.equal(monthLayout.stats.length, 3);
assert.equal(monthLayout.books.length, 3);
assert.equal(monthLayout.hasQuote, true);
assert.ok(monthLayout.quote.lines.length >= 1 && monthLayout.quote.lines.length <= 3);
assert.ok(monthLayout.quoteBookY > 988 && monthLayout.quoteBookY < 1350);
assert.equal(T.monthlyCardLayout({ quote: '' }, cardMeasure).hasQuote, false);
assert.equal(T.monthlyCardLayout({ theme: 'celadon' }, cardMeasure).theme.id, 'celadon');
assert.match(T.monthlyCardFilename('2026-11'), /^shiguang-month-2026-11\.png$/);

// The painter fills a full frame and keeps every string inside it.
assert.equal(T.drawMonthlyCard(null, {}), null);
const monthPainter = mockCanvasContext();
T.drawMonthlyCard(monthPainter.ctx, {
  theme: 'paper', brand: '拾光阅读', date: '11月4日', kicker: '本月阅读小结',
  monthLabel: '2026 年 11 月',
  stats: [{ value: '1小时30分', label: '阅读时长' }, { value: '12天', label: '阅读天数' }, { value: '4本', label: '读过' }],
  booksLabel: '读得最多的书',
  books: [{ title: '夜航西飞', value: '1小时' }, { title: '海边的卡夫卡', value: '30分钟' }],
  quoteLabel: '本月摘录', quote: '海风从窗边吹进来，带着盐的味道。',
  quoteBook: '海边的卡夫卡 · 第一章 海风', footer: '拾光阅读 · 2026 年 11 月',
});
assert.ok(monthPainter.calls.length >= 12, 'month card paints header, title, stats, books, and quote');
monthPainter.calls.forEach(function inside(call) {
  assert.ok(call.x >= 0 && call.x <= 1080, 'month card text inside width: ' + call.text);
  assert.ok(call.y > 0 && call.y < 1350, 'month card text inside height: ' + call.text);
});
assert.ok(monthPainter.calls.some(function month(call) { return call.text === '2026 年 11 月'; }), 'month card prints the month');
assert.ok(monthPainter.calls.some(function book(call) { return call.text === '夜航西飞'; }), 'month card prints the top book');
const bareMonth = mockCanvasContext();
T.drawMonthlyCard(bareMonth.ctx, { booksEmpty: '这个月还没有读完一整段' });
assert.ok(bareMonth.calls.some(function hint(call) { return call.text === '这个月还没有读完一整段'; }), 'month card shows the empty hint when no book data');

// Whole-book export: review, notes, bookmarks, then every chapter's text.
const exportBook = {
  id: 'export-book', title: '海边的书', author: '某作者',
  chapters: [
    { id: 'e1', title: '第一章', paragraphs: ['海风从窗边吹进来。', '月亮升起来了。'] },
    { id: 'e2', title: '第二章', paragraphs: ['船靠岸的时候，天刚亮。'] },
  ],
};
const exportMd = T.bookFullMarkdown(exportBook, {
  t: (key) => key,
  highlights: [{ id: 'h1', bookId: 'export-book', chapterIndex: 0, text: '海风', note: '喜欢', tags: ['海'], createdAt: 1 }],
  bookmarks: [{ id: 'b1', bookId: 'export-book', chapterIndex: 1, page: 3, excerpt: '船', note: '记', createdAt: 2 }],
  review: { rating: 4, text: '很好看' },
  progress: { chapterIndex: 0, percent: 0.42, completed: false },
});
assert.ok(exportMd.startsWith('# 海边的书'), 'book export starts with the title');
assert.ok(exportMd.includes('## 1. 第一章') && exportMd.includes('## 2. 第二章'), 'book export lists every chapter');
assert.ok(exportMd.includes('船靠岸的时候，天刚亮。'), 'book export includes chapter text');
assert.ok(exportMd.includes('> 海风'), 'book export keeps quoted highlights');
assert.ok(exportMd.includes('#海'), 'book export keeps highlight tags');
assert.ok(exportMd.includes('很好看'), 'book export keeps the review');
assert.ok(exportMd.includes('bookProgress') && !exportMd.includes('finished'), 'book export reports progress but not completion');
assert.ok(T.bookFullMarkdown(exportBook, {}).includes('## 1. 第一章'), 'book export works without notes');
assert.ok(T.bookFullMarkdown(exportBook, { progress: { percent: 1, completed: true } }).includes('finished'), 'book export marks finished books');
assert.match(T.bookMarkdownFilename('海边的书'), /^shiguang-book-海边的书\.md$/);
assert.match(T.bookMarkdownFilename(''), /^shiguang-book-book\.md$/);

// Daily goal is derived from the weekly goal and tracked against today's record.
assert.equal(T.dailyGoalMinutes(180), 26);
assert.equal(T.dailyGoalMinutes(30), 5);
assert.equal(T.dailyGoalMinutes(9999), 206);
const todayProgress = T.todayGoalProgress({ [T.weekSeries({})[6].key]: 600 }, 180);
assert.equal(todayProgress.targetSeconds, 26 * 60);
assert.equal(todayProgress.seconds, 600);
assert.equal(todayProgress.done, false);
assert.ok(todayProgress.ratio > 0 && todayProgress.ratio < 1);
const doneProgress = T.todayGoalProgress({ [T.weekSeries({})[6].key]: 1800 }, 180);
assert.equal(doneProgress.done, true);
assert.equal(doneProgress.ratio, 1);
assert.equal(T.todayGoalProgress({}, 180).seconds, 0);

// In-book search: case-insensitive, bounded, and ordered.
const chapters = [
  { id: 'c1', title: '第一章', paragraphs: ['海风从窗边吹进来。', '月亮升起来了。'] },
  { id: 'c2', title: '第二章', paragraphs: ['她读着书，海风停了。', '月光落在书页上。'] },
];
const found = T.searchBookChapters(chapters, '海风', 80);
assert.equal(found.results.length, 2);
assert.equal(found.results[0].chapterIndex, 0);
assert.equal(found.results[1].chapterIndex, 1);
assert.equal(found.results[1].match, '海风');

// Scoped search by chapterIndex
const foundChap0 = T.searchBookChapters(chapters, '海风', 80, { chapterIndex: 0 });
assert.equal(foundChap0.results.length, 1);
assert.equal(foundChap0.results[0].chapterIndex, 0);
assert.equal(foundChap0.results[0].chapterTitle, '第一章');

const foundChap1 = T.searchBookChapters(chapters, '海风', 80, { chapterIndex: 1 });
assert.equal(foundChap1.results.length, 1);
assert.equal(foundChap1.results[0].chapterIndex, 1);
assert.equal(foundChap1.results[0].chapterTitle, '第二章');

const foundChapInvalid = T.searchBookChapters(chapters, '海风', 80, { chapterIndex: 99 });
assert.equal(foundChapInvalid.results.length, 0);
const hitSnippet = (found.results[0].before + found.results[0].match + found.results[0].after).trim();
const hitQuote = T.buildQuoteText(hitSnippet, '海边书稿', found.results[0].chapterTitle);
assert.ok(hitQuote.includes('海风'));
assert.ok(hitQuote.includes('——《海边书稿》 · 第一章'));
assert.equal(T.searchBookChapters(chapters, '不存在的词', 80).results.length, 0);
const bounded = T.searchBookChapters([{ id: 'c', title: 'x', paragraphs: ['a'.repeat(200)] }], 'a', 30);
assert.equal(bounded.results.length, 30);
assert.equal(bounded.truncated, true);

// Chapter offsets line up with the joined chapter text.
assert.equal(T.nextSpeechChapter(0, 3), 1);
assert.equal(T.nextSpeechChapter(2, 3), null);
assert.equal(T.nextSpeechChapter(0, 1), null);
const offsets = T.chapterBaseOffsets({ paragraphs: ['abc', 'def'] });
assert.deepEqual(plain(offsets.offsets), [0, 4]);
assert.equal(offsets.total, 7);
assert.equal('abc\ndef'.slice(0, 4), 'abc\n');

// Reading math remains stable.
const bookStub = { chapters: [{}, {}, {}, {}] };
assert.equal(T.progressPercent(bookStub, { chapterIndex: 1, percent: 0.5 }), 38);
assert.equal(T.progressPercent(bookStub, { chapterIndex: 3, percent: 1 }), 99);
assert.equal(T.progressPercent(bookStub, { chapterIndex: 3, percent: 1, completed: true }), 100);
const bookWithoutChapters = { id: 'no-chap', title: 'test', chapterCount: 4 };
assert.equal(T.progressPercent(bookWithoutChapters, { chapterIndex: 1, percent: 0.5 }), 38);
assert.equal(T.progressChapter(bookWithoutChapters, { chapterIndex: 1 }), null);
const bookBare = { id: 'bare' };
assert.equal(T.progressPercent(bookBare, { chapterIndex: 0, percent: 0 }), 0);
assert.equal(T.progressChapter(bookBare, { chapterIndex: 0 }), null);
const streakToday = new Date();
const streakYesterday = new Date(streakToday);
streakYesterday.setDate(streakYesterday.getDate() - 1);
const streakBefore = new Date(streakToday);
streakBefore.setDate(streakBefore.getDate() - 2);
assert.equal(T.readingStreak({ [T.dayKey(streakYesterday)]: 60, [T.dayKey(streakBefore)]: 60 }), 2);
const week = T.weekSeries({ [T.dayKey(streakToday)]: 1800 });
assert.equal(week.length, 7);
assert.equal(week[6].seconds, 1800);
const speechChunks = T.splitSpeechChunks('第一句。第二句很长很长！第三句？', 20);
assert.ok(speechChunks.length >= 3);
assert.equal(T.speechLanguage('这是一本中文书'), 'zh-CN');
assert.equal(T.speechLanguage('A quiet English book'), 'en-US');
assert.deepEqual(plain(T.splitSpeechChunks('   ', 100)), []);
const speechOffsets = T.speechChunkOffsets(['第一句。', '第二句。'], 10);
assert.deepEqual(plain(speechOffsets), [10, 15]);
const shiftedRecent = T.recentDays({}, 3, 3);
assert.equal(shiftedRecent.length, 3);
assert.equal(shiftedRecent[2].today, false);

// Search hit stepping wraps both ways and starts from either end.
assert.equal(T.stepIndex(-1, 5, 1), 0);
assert.equal(T.stepIndex(-1, 5, -1), 4);
assert.equal(T.stepIndex(0, 5, 1), 1);
assert.equal(T.stepIndex(4, 5, 1), 0);
assert.equal(T.stepIndex(0, 5, -1), 4);
assert.equal(T.stepIndex(2, 5, 3), 0);
assert.equal(T.stepIndex(2, 5, -3), 4);
assert.equal(T.stepIndex(0, 0, 1), -1);
assert.equal(T.stepIndex(-1, 0, -1), -1);

// Bulk pin / unpin keeps order, skips no-ops and caps the pin list at 100.
const pinCase = (current, ids, pinned) => plain(T.mergePins(current, ids, pinned));
assert.deepEqual(pinCase([], ['a', 'b'], true), { pins: ['a', 'b'], changed: ['a', 'b'] });
assert.deepEqual(pinCase(['x'], ['a'], true), { pins: ['a', 'x'], changed: ['a'] });
assert.deepEqual(pinCase(['a', 'x'], ['a', 'b'], true), { pins: ['b', 'a', 'x'], changed: ['b'] });
assert.deepEqual(pinCase(['a', 'x'], ['a'], true), { pins: ['a', 'x'], changed: [] });
assert.deepEqual(pinCase(['a', 'x', 'b'], ['a', 'b'], false), { pins: ['x'], changed: ['a', 'b'] });
assert.deepEqual(pinCase(['a', 'x'], ['b'], false), { pins: ['a', 'x'], changed: [] });
assert.deepEqual(pinCase(['a'], ['a', 'a'], true), { pins: ['a'], changed: [] });
assert.deepEqual(pinCase(null, ['a'], true), { pins: ['a'], changed: ['a'] });
assert.deepEqual(pinCase(['a'], null, true), { pins: ['a'], changed: [] });
assert.deepEqual(pinCase(['a'], ['', null, 3, 'b'], true), { pins: ['b', 'a'], changed: ['b'] });
assert.equal(pinCase([], Array.from({ length: 120 }, (_, i) => 'p' + i), true).pins.length, 100);

// Reader keyboard navigation decision: Arrow keys, J/K, PageUp/Down, Space/Shift+Space, Home/End
assert.equal(T.readerKeyAction('ArrowRight'), 'nextPage');
assert.equal(T.readerKeyAction('ArrowDown'), 'nextPage');
assert.equal(T.readerKeyAction('PageDown'), 'nextPage');
assert.equal(T.readerKeyAction('j'), 'nextPage');
assert.equal(T.readerKeyAction('J'), 'nextPage');
assert.equal(T.readerKeyAction(' '), 'nextPage');
assert.equal(T.readerKeyAction(' ', { shift: true }), 'prevPage');
assert.equal(T.readerKeyAction('ArrowLeft'), 'prevPage');
assert.equal(T.readerKeyAction('ArrowUp'), 'prevPage');
assert.equal(T.readerKeyAction('PageUp'), 'prevPage');
assert.equal(T.readerKeyAction('k'), 'prevPage');
assert.equal(T.readerKeyAction('K'), 'prevPage');
assert.equal(T.readerKeyAction('Home'), 'firstPage');
assert.equal(T.readerKeyAction('End'), 'lastPage');
assert.equal(T.readerKeyAction('ArrowRight', { meta: true }), null);
assert.equal(T.readerKeyAction('ArrowLeft', { ctrl: true }), null);
assert.equal(T.readerKeyAction('j', { alt: true }), null);
assert.equal(T.readerKeyAction('x'), null);

// Batch recolor only touches highlights that need it.
const rec = (items, ids, color) => plain(T.recolorHighlights(items, ids, color));
const recSeed = [
  { id: 'h1', color: 'amber', note: 'a' },
  { id: 'h2', color: 'sage', note: 'b' },
  { id: 'h3', color: 'sky', note: 'c' },
];
assert.deepEqual(rec(recSeed, ['h1', 'h2'], 'rose'), { items: [{ id: 'h1', color: 'rose', note: 'a' }, { id: 'h2', color: 'rose', note: 'b' }, { id: 'h3', color: 'sky', note: 'c' }], changed: 2 });
assert.deepEqual(rec(recSeed, ['h1'], 'amber'), { items: recSeed, changed: 0 });
assert.deepEqual(rec(recSeed, ['h1'], 'nope'), { items: recSeed, changed: 0 });
assert.deepEqual(rec(recSeed, [], 'rose'), { items: recSeed, changed: 0 });
assert.deepEqual(rec(recSeed, null, 'rose'), { items: recSeed, changed: 0 });
assert.deepEqual(rec(null, ['h1'], 'rose').changed, 0);
assert.equal(rec(recSeed, ['h9'], 'rose').changed, 0);
assert.equal(rec(recSeed, ['h1', 'h1'], 'rose').changed, 1);

// Bulk book tags: map-shaped, cap-aware, and honest about what actually changed.
const tagAdd = (map, ids, tag) => plain(T.applyTagToBooks(map, ids, tag));
assert.deepEqual(tagAdd({}, ['a', 'b'], '海'), { userTags: { a: ['海'], b: ['海'] }, tag: '海', applied: 2, skipped: 0 });
assert.deepEqual(tagAdd({ a: ['海'] }, ['a', 'b'], ' 海 '), { userTags: { a: ['海'], b: ['海'] }, tag: '海', applied: 1, skipped: 0 });
assert.deepEqual(tagAdd({ a: ['海'], b: ['海'] }, ['a', 'b'], '海'), { userTags: { a: ['海'], b: ['海'] }, tag: '海', applied: 0, skipped: 0 });
assert.equal(tagAdd({ a: Array.from({ length: 8 }, (_, i) => 't' + i) }, ['a', 'b'], '新').skipped, 1);
assert.equal(tagAdd({ a: Array.from({ length: 8 }, (_, i) => 't' + i) }, ['a', 'b'], '新').applied, 1);
assert.equal(tagAdd({}, ['a'], '').applied, 0);
assert.equal(tagAdd({}, [], '海').applied, 0);
assert.equal(tagAdd(null, ['a'], '海').applied, 1);
assert.equal(tagAdd({}, ['a', 'a'], '海').applied, 1);
const tagRemove = (map, ids, tag) => plain(T.removeTagFromBooks(map, ids, tag));
assert.deepEqual(tagRemove({ a: ['海', '山'], b: ['海'] }, ['a', 'b'], '海'), { userTags: { a: ['山'] }, tag: '海', removed: 2 });
assert.deepEqual(tagRemove({ a: ['山'] }, ['a'], '海'), { userTags: { a: ['山'] }, tag: '海', removed: 0 });
assert.deepEqual(tagRemove({ a: ['海'] }, ['a', 'b'], '海'), { userTags: {}, tag: '海', removed: 1 });
assert.equal(tagRemove({ a: ['海'] }, ['a'], '').removed, 0);

// Deleting books purges every trace and leaves the rest untouched.
const delState = {
  customBooks: [{ id: 'local-a', title: 'A' }, { id: 'local-b', title: 'B' }],
  progress: { 'local-a': { percent: 0.4 }, 'local-b': { percent: 0.9 }, builtin: { percent: 1 } },
  highlights: [{ id: 'h1', bookId: 'local-a' }, { id: 'h2', bookId: 'local-b' }],
  bookmarks: [{ id: 'b1', bookId: 'local-a' }, { id: 'b2', bookId: 'builtin' }],
  sessions: [{ bookId: 'local-a', seconds: 60 }, { bookId: 'local-b', seconds: 30 }],
  reviews: { 'local-a': { rating: 4 }, 'local-b': { rating: 5 } },
  userTags: { 'local-a': ['海'], 'local-b': ['山'] },
  pins: ['local-a', 'builtin'],
  wishlist: ['local-b'],
  stats: { goalMinutes: 180, byBook: { 'local-a': 600, 'local-b': 300, builtin: 120 } },
  lastBookId: 'local-a',
  shelfSort: 'recent',
};
const delOne = T.removeBooksFromState(delState, ['local-a']);
assert.deepEqual(plain(delOne.removed), ['local-a']);
assert.deepEqual(plain(delOne.state.customBooks), [{ id: 'local-b', title: 'B' }]);
assert.deepEqual(Object.keys(plain(delOne.state.progress)).sort(), ['builtin', 'local-b']);
assert.deepEqual(plain(delOne.state.highlights), [{ id: 'h2', bookId: 'local-b' }]);
assert.deepEqual(plain(delOne.state.bookmarks), [{ id: 'b2', bookId: 'builtin' }]);
assert.deepEqual(plain(delOne.state.sessions), [{ bookId: 'local-b', seconds: 30 }]);
assert.deepEqual(Object.keys(plain(delOne.state.reviews)), ['local-b']);
assert.deepEqual(Object.keys(plain(delOne.state.userTags)), ['local-b']);
assert.deepEqual(plain(delOne.state.pins), ['builtin']);
assert.deepEqual(plain(delOne.state.wishlist), ['local-b']);
assert.deepEqual(plain(delOne.state.stats.byBook), { 'local-b': 300, builtin: 120 });
assert.equal(delOne.state.stats.goalMinutes, 180);
assert.equal(delOne.state.lastBookId, null);
assert.equal(delOne.state.shelfSort, 'recent');
// Built-ins are never touched, and a no-op returns the same object.
assert.deepEqual(plain(T.removeBooksFromState(delState, ['builtin']).removed), []);
assert.equal(T.removeBooksFromState(delState, ['builtin']).state, delState);
assert.equal(T.removeBooksFromState(delState, []).state, delState);
assert.equal(T.removeBooksFromState(delState, null).state, delState);
assert.deepEqual(plain(T.removeBooksFromState(delState, ['local-a', 'local-b']).removed), ['local-a', 'local-b']);
assert.equal(T.removeBooksFromState(delState, ['local-a', 'local-b']).state.customBooks.length, 0);

// Shelving reuses toggleId: prepend on add, drop on remove, capped, junk-tolerant.
assert.deepEqual(plain(T.toggleId([], 'a', 200)), ['a']);
assert.deepEqual(plain(T.toggleId(['b'], 'a', 200)), ['a', 'b']);
assert.deepEqual(plain(T.toggleId(['a', 'b'], 'a', 200)), ['b']);
assert.deepEqual(plain(T.toggleId(null, 'a')), ['a']);
assert.deepEqual(plain(T.toggleId(['a'], '')), ['a']);
assert.deepEqual(plain(T.toggleId(['a'], null)), ['a']);
assert.deepEqual(plain(T.toggleId(['a', null, 3, ''], 'b')), ['b', 'a']);
assert.equal(T.toggleId([], 'x', 0).length, 1);
assert.equal(T.toggleId(Array.from({ length: 5 }, (_, i) => 'p' + i), 'new', 3).length, 3);
// Normalizing keeps only known ids and dedupes the shelved list.
const shelvedState = T.normalizeState({ customBooks: [rjcBook], shelved: ['local-rjc', 'local-rjc', 'nope', 7] });
assert.deepEqual(plain(shelvedState.shelved), ['local-rjc']);

// Batch finish mirrors the single-book toggle: percent 1 on finish, 0 on undo.
const fin = (map, ids, flag, now) => plain(T.setBooksFinished(map, ids, flag, now));
assert.deepEqual(fin({ a: { chapterIndex: 2, percent: 0.4, updatedAt: 9 } }, ['a'], true, 50),
  { progress: { a: { chapterIndex: 2, percent: 1, updatedAt: 50, completed: true } }, changed: 1 });
assert.deepEqual(fin({ a: { chapterIndex: 2, percent: 1, updatedAt: 9, completed: true } }, ['a'], false, 50),
  { progress: { a: { chapterIndex: 2, percent: 0, updatedAt: 50, completed: false } }, changed: 1 });
assert.deepEqual(fin({}, ['a'], true, 50), { progress: { a: { chapterIndex: 0, percent: 1, updatedAt: 50, completed: true } }, changed: 1 });
assert.deepEqual(fin({ a: { completed: true } }, ['a', 'b'], true, 50), { progress: { a: { completed: true }, b: { chapterIndex: 0, percent: 1, updatedAt: 50, completed: true } }, changed: 1 });
assert.deepEqual(fin({ a: { completed: true } }, ['a'], true, 50), { progress: { a: { completed: true } }, changed: 0 });
assert.deepEqual(fin({ a: { percent: 0.5 } }, ['a'], true, 0), { progress: { a: { percent: 1, completed: true, updatedAt: 0 } }, changed: 1 });
assert.deepEqual(fin({ a: { percent: 0.5 } }, [], true, 50), { progress: { a: { percent: 0.5 } }, changed: 0 });
assert.deepEqual(fin(null, ['a'], true, 50).changed, 1);
assert.deepEqual(fin({ a: { percent: 0.5 } }, [3, null, 'a'], true, 50).changed, 1);

// setIdsBulk generalizes mergePins: order, dedupe, custom caps, no-op passthrough.
assert.deepEqual(plain(T.setIdsBulk([], ['a', 'b'], true, 200)), { list: ['a', 'b'], changed: ['a', 'b'] });
assert.deepEqual(plain(T.setIdsBulk(['x'], ['a'], true, 200)), { list: ['a', 'x'], changed: ['a'] });
assert.deepEqual(plain(T.setIdsBulk(['a', 'x'], ['a'], true, 200)), { list: ['a', 'x'], changed: [] });
assert.deepEqual(plain(T.setIdsBulk(['a', 'x'], ['x'], false, 200)), { list: ['a'], changed: ['x'] });
assert.deepEqual(plain(T.setIdsBulk(['a', 'x'], ['b'], false, 200)), { list: ['a', 'x'], changed: [] });
assert.equal(T.setIdsBulk([], Array.from({ length: 250 }, (_, i) => 's' + i), true, 200).list.length, 200);
assert.equal(T.setIdsBulk(null, ['a'], true, undefined).list.length, 1);
assert.equal(T.setIdsBulk(['a'], null, true, 200).list.length, 1);

// Font-size stepping stays inside [15, 28] and survives junk input.
assert.equal(T.stepFontSize(19, 1), 20);
assert.equal(T.stepFontSize(19, -1), 18);
assert.equal(T.stepFontSize(28, 1), 28);
assert.equal(T.stepFontSize(15, -1), 15);
assert.equal(T.stepFontSize(28, 4), 28);
assert.equal(T.stepFontSize(15, -4), 15);
assert.equal(T.stepFontSize(19.6, 0), 20);
assert.equal(T.stepFontSize('21', -1), 20);
assert.equal(T.stepFontSize(undefined, 0), 19);
assert.equal(T.stepFontSize(0, 0), 19);
assert.equal(T.stepFontSize(19, 'x'), 19);
assert.equal(T.stepFontSize(19, 3.4), 22);

// Disk-backed bodies: only flagged books get their chapters stripped before localStorage.
const fsState = { customBooks: [
  { id: 'local-a', title: 'A', chapters: [{ id: 'c1', paragraphs: ['x'] }], chaptersInFs: true },
  { id: 'local-b', title: 'B', chapters: [{ id: 'c1', paragraphs: ['y'] }] },
] };
const stripped = T.stripFsBookBodies(fsState);
assert.equal(stripped.customBooks[0].chapters, undefined);
assert.equal(stripped.customBooks[1].chapters.length, 1);
assert.equal(fsState.customBooks[0].chapters.length, 1);
assert.equal(T.stripFsBookBodies(null), null);
assert.equal(T.stripFsBookBodies({}).customBooks, undefined);
const noFlagState = { customBooks: [{ id: 'local-c', title: 'C', chapters: [{ paragraphs: ['z'] }] }] };
assert.equal(T.stripFsBookBodies(noFlagState), noFlagState);
const noBodyState = { customBooks: [{ id: 'local-d', title: 'D', chaptersInFs: true }] };
assert.equal(T.stripFsBookBodies(noBodyState), noBodyState);

// Without a granted folder the storage payload is the state itself; the snapshot
// written into a folder goes through the same helper, so this stays the one contract.
assert.equal(T.stateForStorage(fsState), fsState);
assert.equal(T.stateForStorage(null), null);

// The folder snapshot only wins over an empty browser state.
const folderSnapshot = { v: 1, customBooks: [{ id: 'local-z', title: 'Z', chaptersInFs: true }], progress: {}, highlights: [], bookmarks: [] };
const emptyLive = T.defaultState();
const adopted = T.adoptLibrarySnapshot(emptyLive, folderSnapshot);
assert.equal(adopted.customBooks.length, 1);
assert.equal(adopted.customBooks[0].chaptersInFs, true);
assert.equal(adopted.customBooks[0].title, 'Z');
assert.equal(T.adoptLibrarySnapshot(emptyLive, null), null);
assert.equal(T.adoptLibrarySnapshot(emptyLive, { v: 1, customBooks: [] }), null);
assert.equal(T.adoptLibrarySnapshot(emptyLive, 'nope'), null);
// A live library, progress or a single note all block adoption.
assert.equal(T.adoptLibrarySnapshot({ customBooks: [{ id: 'local-y' }] }, folderSnapshot), null);
assert.equal(T.adoptLibrarySnapshot({ customBooks: [], progress: { 'local-rjc': { percent: 0.1 } } }, folderSnapshot), null);
assert.equal(T.adoptLibrarySnapshot({ customBooks: [], highlights: [{ id: 'h' }] }, folderSnapshot), null);
assert.equal(T.adoptLibrarySnapshot({ customBooks: [], bookmarks: [{ id: 'b' }] }, folderSnapshot), null);
// An empty live state with an empty snapshot stays empty rather than resetting.
assert.equal(T.adoptLibrarySnapshot(emptyLive, T.stateForStorage(T.defaultState())), null);

// Orphan bodies: a listed file with no book behind it. Two names both count as
// "kept": the readable one written today and the id-only JSON of older libraries.
const bodyName = (book) => T.fsBodyFileName(book);
const cihua = { id: 'local-a', title: '人间词话' };
assert.deepEqual(plain(T.orphanBodyIds([bodyName(cihua), '古词--local-gone.txt'], [cihua])), ['古词--local-gone.txt']);
assert.deepEqual(plain(T.orphanBodyIds([bodyName(cihua)], [cihua])), []);
assert.deepEqual(plain(T.orphanBodyIds(['local-a.json'], [cihua])), []);
assert.deepEqual(plain(T.orphanBodyIds(['local_gone.json'], [cihua])), ['local_gone.json']);
assert.deepEqual(plain(T.orphanBodyIds(['local_a_b.json'], [{ id: 'local/a:b' }])), []);
assert.deepEqual(plain(T.orphanBodyIds([], [{ id: 'local-a' }])), []);
assert.deepEqual(plain(T.orphanBodyIds(['local-a.txt'], [])), ['local-a.txt']);
assert.deepEqual(plain(T.orphanBodyIds(null, null)), []);

// A book is up to three names in the folder. Cleaning up a deleted book must take
// all three; a live book's three must all survive — including the `.assets` folder,
// which is a whole directory of pictures.
const trio = { id: 'local-tri', title: '三件套' };
const trioFiles = ['三件套--local-tri.txt', '三件套--local-tri.epub', '三件套--local-tri.assets'];
assert.deepEqual(plain(T.orphanBodyIds(trioFiles, [trio])), [], 'a live book keeps all three parts');
const deadFiles = ['旧书--local-tll.txt', '旧书--local-tll.epub', '旧书--local-tll.assets'];
assert.deepEqual(plain(T.orphanBodyIds(deadFiles, [trio])), deadFiles, 'a deleted book leaves all three behind');
// A rename that did not finish leaves the files under the old title. The id is
// what makes them that book's files — deleting them would delete its only text.
const renamedFiles = ['旧书名--local-tri.txt', '旧书名--local-tri.epub', '旧书名--local-tri.assets'];
assert.deepEqual(plain(T.orphanBodyIds(renamedFiles, [trio])), [], 'an old title with a live id is not an orphan');
assert.deepEqual(plain(T.orphanBodyIds(['旧书名--local-tri.txt'], [])), ['旧书名--local-tri.txt'], 'with no books at all, everything is an orphan');
// Titles that themselves look like ids do not confuse the match.
assert.deepEqual(plain(T.orphanBodyIds(['书.bak--local-tri.txt'], [trio])), [], 'a title containing dots stays with its book');
assert.deepEqual(plain(T.orphanBodyIds(['notes.md', 'cover.png', '.DS_Store'], [trio])), ['notes.md', 'cover.png', '.DS_Store']);

// The body file a person opens in Finder: the title, then the id, then .txt —
// characters that no file system accepts are replaced rather than dropped.
assert.equal(bodyName(cihua), '人间词话--local-a.txt');
assert.equal(bodyName({ id: 'local-x', title: 'A/B: C?' }), 'A_B_ C_--local-x.txt');
assert.equal(bodyName({ id: 'local-x', title: '   ' }), '未命名--local-x.txt');
assert.equal(bodyName({ id: 'local/x', title: '书名' }), '书名--local_x.txt');
assert.ok(bodyName({ id: 'local-x', title: '题'.repeat(200) }).length < 100, 'long titles are cut');
assert.equal(T.fsSafeName('a\tb\nc', 60), 'a_b_c');

// Bodies are written as text, not JSON: `# 标题` per chapter, a blank line between
// paragraphs. It has to read back into the very same chapters.
const sampleBook = {
  id: 'local-a',
  title: '人间词话',
  chapters: [
    { id: 'epub-c1', title: '卷一', paragraphs: ['词以境界为最上。', '有境界，则自成高格。'] },
    { id: 'epub-c2', title: '卷二', paragraphs: ['古今之成大事业者。'] },
  ],
};
const bodyText = T.bookBodyText(sampleBook);
assert.equal(bodyText, '# 卷一\n\n词以境界为最上。\n\n有境界，则自成高格。\n\n# 卷二\n\n古今之成大事业者。');
assert.ok(!bodyText.includes('{'), 'the body is plain text, not JSON');
const reread = plain(T.parseBookBodyText(bodyText, ['epub-c1', 'epub-c2']));
assert.deepEqual(reread, [
  { id: 'epub-c1', title: '卷一', paragraphs: ['词以境界为最上。', '有境界，则自成高格。'] },
  { id: 'epub-c2', title: '卷二', paragraphs: ['古今之成大事业者。'] },
]);
// Without the saved ids the parser still produces stable ones, but they are the
// text-import shape — which is exactly why the ids are saved next to the metadata.
assert.deepEqual(plain(T.parseBookBodyText(bodyText)).map((c) => c.id), ['imp-c1', 'imp-c2']);
assert.deepEqual(plain(T.parseBookBodyText(bodyText, ['only-one'])).map((c) => c.id), ['only-one', 'imp-c2']);
// Text before the first heading, CRLF line endings, and empty input.
assert.deepEqual(plain(T.parseBookBodyText('开头一段\r\n\r\n# 一\r\n\r\n正文' )).map((c) => [c.title, c.paragraphs.length]), [['正文', 1], ['一', 1]]);
assert.deepEqual(plain(T.parseBookBodyText('')), []);
assert.deepEqual(plain(T.parseBookBodyText(null)), []);

// Chapter ids survive the body leaving state; without this, every highlight and
// chapter progress mark would point at an id the reread book no longer has.
const withBody = { customBooks: [sampleBook] };
assert.deepEqual(plain(T.chapterIdsOf(sampleBook)), ['epub-c1', 'epub-c2']);
assert.deepEqual(plain(T.chapterIdsOf({ chapters: [{ title: '无 id' }] })), ['imp-c1']);
assert.deepEqual(plain(T.chapterIdsOf(null)), []);
const saved = plain(T.markBodiesOnDisk(withBody, ['local-a']));
assert.equal(saved.customBooks[0].chaptersInFs, true);
assert.deepEqual(saved.customBooks[0].chapterIds, ['epub-c1', 'epub-c2']);
assert.deepEqual(saved.customBooks[0].chapters.length, 2, 'the body stays until the caller strips it');
// A book that was not written is left exactly as it was.
assert.deepEqual(plain(T.markBodiesOnDisk(withBody, ['other'])).customBooks[0], plain(sampleBook));
assert.deepEqual(plain(T.markBodiesOnDisk(withBody, [])), withBody);

// Folder support needs writes, not just the picker: Safari ships showDirectoryPicker
// without createWritable, and that combination used to fail on every single write.
assert.equal(T.fsLibrarySupported(), false, 'no picker in the vm sandbox');
sandbox.window.showDirectoryPicker = () => {};
assert.equal(T.fsLibrarySupported(), false, 'picker alone is not enough');
sandbox.FileSystemFileHandle = function FileSystemFileHandle() {};
sandbox.FileSystemFileHandle.prototype.createWritable = function createWritable() {};
assert.equal(T.fsLibrarySupported(), true, 'picker plus writable handles');

// Disk failures keep their cause so the toast can name it.
const named = (name) => Object.assign(new Error('boom'), { name });
assert.equal(T.fsErrorCode(named('NotAllowedError')), 'fs-denied');
assert.equal(T.fsErrorCode(named('SecurityError')), 'fs-denied');
assert.equal(T.fsErrorCode(named('QuotaExceededError')), 'fs-quota');
assert.equal(T.fsErrorCode(named('TypeMismatchError')), 'fs-conflict');
assert.equal(T.fsErrorCode(named('NotFoundError')), 'fs-conflict');
assert.equal(T.fsErrorCode(named('NoModificationAllowedError')), 'fs-locked');
assert.equal(T.fsErrorCode(new Error('fs-no-handle')), 'fs-no-handle');
assert.equal(T.fsErrorCode(new Error('fs-unsupported')), 'fs-unsupported');
assert.equal(T.fsErrorCode(new Error('something else')), 'fs-io');
assert.equal(T.fsErrorCode(null), 'fs-io');

// Drive the real write path against a fake directory: a refused createWritable is
// retried once after re-asking permission, then reported as fs-denied rather than
// as the vague "could not write to that folder".
function fakeDirectory(createWritable) {
  const file = { createWritable };
  const dir = {
    name: '测试书库',
    getFileHandle: async () => file,
    getDirectoryHandle: async () => dir,
    queryPermission: async () => 'granted',
    requestPermission: async () => 'granted',
  };
  return dir;
}

sandbox.window.showDirectoryPicker = async () => fakeDirectory(async () => {
  throw named('NotAllowedError');
});
await T.fsChooseDirectory();
await assert.rejects(() => T.fsWriteSnapshotNow({ v: 1 }), /fs-denied/);

// A writable file takes the snapshot and reports success.
let writtenSnapshot = '';
const writableDir = fakeDirectory(async () => ({
  write: async (chunk) => { writtenSnapshot = chunk; },
  close: async () => {},
}));
sandbox.window.showDirectoryPicker = async () => writableDir;
await T.fsChooseDirectory();
assert.equal(await T.fsWriteSnapshotNow({ v: 1, customBooks: [] }), true);
assert.match(writtenSnapshot, /customBooks/);

// A body file is the book itself in plain text: `书名--id.txt`, opened in any
// editor. Writing one replaces the JSON an older version left behind and any copy
// still sitting under a previous title, so a rename never doubles the text.
function memoryLibrary() {
  // A one-level-deep tree: enough for `books/` and a book's `.assets/`, keyed by path.
  const files = new Map();
  function makeDir(prefix) {
    return {
      name: prefix || '内存书库',
      getFileHandle: async (name, options) => {
        const key = prefix + name;
        if (!(options && options.create) && !files.has(key)) throw named('NotFoundError');
        if (!files.has(key)) files.set(key, '');
        return {
          getFile: async () => {
            const value = files.get(key);
            if (typeof value === 'string') {
              return {
                text: async () => value,
                arrayBuffer: async () => new TextEncoder().encode(value).buffer,
              };
            }
            return {
              text: async () => '',
              arrayBuffer: async () => value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength),
            };
          },
          createWritable: async () => {
            const chunks = [];
            return {
              write: async (chunk) => { chunks.push(chunk); },
              close: async () => {
                if (typeof chunks[0] === 'string') {
                  files.set(key, chunks.join(''));
                  return;
                }
                const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
                const merged = new Uint8Array(total);
                let at = 0;
                chunks.forEach((chunk) => { merged.set(chunk, at); at += chunk.length; });
                files.set(key, merged);
              },
            };
          },
        };
      },
      getDirectoryHandle: async (name, options) => {
        const key = prefix + name;
        const exists = [...files.keys()].some((path) => path.startsWith(key + '/'));
        if (!exists && !(options && options.create)) throw named('NotFoundError');
        return makeDir(key + '/');
      },
      removeEntry: async (name) => {
        const key = prefix + name;
        if (files.has(key)) {
          files.delete(key);
          return;
        }
        const doomed = [...files.keys()].filter((path) => path.startsWith(key + '/'));
        if (!doomed.length) throw named('NotFoundError');
        doomed.forEach((path) => files.delete(path));
      },
      values: async function* list() {
        const seen = new Set();
        for (const path of [...files.keys()]) {
          if (!path.startsWith(prefix)) continue;
          const rest = path.slice(prefix.length);
          const slash = rest.indexOf('/');
          const name = slash < 0 ? rest : rest.slice(0, slash);
          if (seen.has(name)) continue;
          seen.add(name);
          yield { kind: slash < 0 ? 'file' : 'directory', name };
        }
      },
      queryPermission: async () => 'granted',
      requestPermission: async () => 'granted',
    };
  }
  return { dir: makeDir(''), files };
}

const memory = memoryLibrary();
sandbox.window.showDirectoryPicker = async () => memory.dir;
await T.fsChooseDirectory();

const savedBook = {
  id: 'local-t',
  title: '可读的书',
  chapters: [
    { id: 't-1', title: '第一章', paragraphs: ['西风凋碧树，', '独上高楼。'] },
    { id: 't-2', title: '第二章', paragraphs: ['衣带渐宽终不悔。'] },
  ],
};
memory.files.set('books/local-t.json', JSON.stringify({ v: 1, chapters: [{ id: 'stale', title: '旧', paragraphs: ['旧'] }] }));
assert.equal(await T.fsWriteBookBody(savedBook), true);
assert.equal(memory.files.has('books/local-t.json'), false, 'the legacy JSON is cleaned up');
const storedText = memory.files.get('books/可读的书--local-t.txt');
assert.ok(storedText.startsWith('# 第一章\n\n西风凋碧树，'), 'the body is readable text, not JSON');
assert.ok(!storedText.includes('"id"'), 'no ids leak into the text');

// Renaming the book moves the file instead of leaving a second copy.
await T.fsWriteBookBody(Object.assign({}, savedBook, { title: '改了名' }));
assert.equal(memory.files.has('books/可读的书--local-t.txt'), false);
assert.ok(memory.files.has('books/改了名--local-t.txt'));
assert.deepEqual([...memory.files.keys()], ['books/改了名--local-t.txt']);

// A fresh import has a random id, so the slow rename/adopt scans are unnecessary.
const freshBook = { id: 'local-fresh', title: '新入库', chapters: [{ id: 'f-1', title: '第一章', paragraphs: ['新书正文。'] }] };
assert.equal(await T.fsWriteNewBookBody(freshBook), true);
assert.ok(memory.files.has('books/新入库--local-fresh.txt'));
assert.match(memory.files.get('books/新入库--local-fresh.txt'), /# 第一章/);
assert.equal(await T.fsDeleteBookBody({ id: 'local-fresh' }), true, 'fresh test book is cleaned up');

// Import can keep raw picture bytes until they hit disk, avoiding a base64 pass
// for every image in a batch.
const rawPictureBook = {
  id: 'local-raw',
  title: '原图书',
  chapters: [{ id: 'raw-1', title: '第一章', paragraphs: ['![图](img-1-1.png)'], images: { 'img-1-1.png': { mime: 'image/png', bytes: Uint8Array.from([137, 80, 78, 71]) } } }],
};
assert.equal(await T.fsWriteNewBookBody(rawPictureBook), true);
assert.ok(memory.files.has('books/原图书--local-raw.assets/img-1-1.png'));
assert.equal(await T.fsDeleteBookBody({ id: 'local-raw' }), true, 'raw picture test book is cleaned up');

// Batch import defers picture files: the original EPUB is the source of truth and
// the reader can rebuild missing assets on demand.
const deferredPictureBook = {
  id: 'local-deferred',
  title: '延迟图',
  chapters: [{ id: 'd-1', title: '第一章', paragraphs: ['![图](img-1-1.png)'], images: { 'img-1-1.png': { mime: 'image/png', bytes: Uint8Array.from([137, 80, 78, 71]) } } }],
};
assert.equal(await T.fsWriteNewBookBody(deferredPictureBook, { skipImages: true }), true);
assert.ok(memory.files.has('books/延迟图--local-deferred.txt'));
assert.equal(memory.files.has('books/延迟图--local-deferred.assets/img-1-1.png'), false, 'batch import does not write picture caches');
assert.equal(await T.fsDeleteBookBody({ id: 'local-deferred' }), true, 'deferred picture test book is cleaned up');

// Reading it back restores the chapter ids saved in the metadata, so highlights and
// chapter progress keep landing on the chapter they were written on.
const rereadBody = plain(await T.fsReadBookBody({ id: 'local-t', chapterIds: ['t-1', 't-2'] }));
assert.deepEqual(rereadBody.map((c) => c.id), ['t-1', 't-2']);
assert.deepEqual(rereadBody[0].paragraphs, ['西风凋碧树，', '独上高楼。']);
assert.equal(rereadBody[1].title, '第二章');

// A library written by an older version already on disk is rewritten as text on the
// next launch, so the folder stops being a pile of blobs. Books no longer on the
// shelf are left alone — those are the orphan cleaner's business, not this one's.
memory.files.set('books/local-old.json', JSON.stringify({ v: 1, chapters: [{ id: 'o-1', title: '旧章', paragraphs: ['旧内容'] }] }));
memory.files.set('books/local-ghost.json', JSON.stringify({ v: 1, chapters: [{ id: 'g-1', title: '没了', paragraphs: ['x'] }] }));
// Still readable before it is migrated: id-only JSON, no text file.
assert.deepEqual(plain(await T.fsReadBookBody('local-old')).map((c) => c.id), ['o-1']);
const migrated = plain(await T.fsMigrateBodiesToText([{ id: 'local-old', title: '旧书', chaptersInFs: true }]));
assert.equal(migrated.length, 1);
// The chapters come back with the migration, so the caller can keep their real ids —
// a text file has nowhere to put them, and highlights are keyed by them.
assert.deepEqual(migrated[0].chapters.map((c) => c.id), ['o-1']);
assert.equal(memory.files.has('books/local-old.json'), false, 'the JSON is replaced, not duplicated');
assert.ok(memory.files.get('books/旧书--local-old.txt').includes('# 旧章'));
assert.ok(memory.files.has('books/local-ghost.json'), 'a book that is gone is not touched');
assert.deepEqual(plain(await T.fsMigrateBodiesToText([{ id: 'local-old', title: '旧书', chaptersInFs: true }])), [], 'already migrated');
assert.deepEqual(plain(await T.fsMigrateBodiesToText([])), []);
assert.deepEqual(plain(await T.fsMigrateBodiesToText(null)), []);
memory.files.delete('books/local-ghost.json');

// Pictures: the text keeps a place for each one, and the bytes go next to the text
// so the reader can draw them without unpacking the original EPUB.
const pictureBytes = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]);
const pictureUrl = 'data:image/png;base64,' + Buffer.from(pictureBytes).toString('base64');
const pictured = {
  id: 'local-pic',
  title: '带图的书',
  chapters: [
    { id: 'pic-1', title: '第一章', paragraphs: ['潮水漫过礁石。', '![潮水](img-1-1.png)', '灯塔亮了一夜。'], images: { 'img-1-1.png': pictureUrl } },
  ],
};
assert.equal(await T.fsWriteBookBody(pictured), true);
assert.ok(memory.files.has('books/带图的书--local-pic.assets/img-1-1.png'), 'the picture lands beside the text');
const rereadPictured = plain(await T.fsReadBookBody({ id: 'local-pic' }));
assert.deepEqual(rereadPictured[0].paragraphs, ['潮水漫过礁石。', '![潮水](img-1-1.png)', '灯塔亮了一夜。']);
assert.equal(rereadPictured[0].images['img-1-1.png'], pictureUrl, 'the bytes come back as a data URL');
// The marker is not prose: chapter text, search and read-aloud all skip it.
assert.equal(T.chapterText({ paragraphs: rereadPictured[0].paragraphs }), '潮水漫过礁石。\n灯塔亮了一夜。');
// The original file is kept too: the text is a view, the EPUB is the book. Its
// bytes are queued at import time and written on the same save as the text.
assert.equal(T.fsRememberSource('local-pic', '潮水与灯塔.epub', Uint8Array.from([80, 75, 3, 4])), true);
assert.equal(T.fsRememberSource('local-pic', '随手记.txt', Uint8Array.from([1])), false, 'only an epub counts as the original');
assert.equal(T.fsRememberSource('', 'a.epub', Uint8Array.from([1])), false);
assert.equal(T.fsRememberSource('local-pic', 'a.epub', new Uint8Array(0)), false);
assert.equal(await T.fsWriteBookBody(pictured), true);
assert.ok(memory.files.has('books/带图的书--local-pic.epub'), 'the original is saved next to the text');
assert.equal(memory.files.get('books/带图的书--local-pic.epub').length, 4);
// A later rename has no queued bytes, so the original must be moved rather than
// deleted — otherwise renaming a book throws its only copy away.
const renamedPicture = { id: 'local-pic', title: '改了名的图册', chapters: pictured.chapters };
assert.equal(await T.fsWriteBookBody(renamedPicture), true);
assert.ok(memory.files.has('books/改了名的图册--local-pic.epub'), 'the original follows the new name');
assert.equal(memory.files.has('books/带图的书--local-pic.epub'), false, 'no second copy is left behind');
const rereadRenamed = plain(await T.fsReadBookBody({ id: 'local-pic' }));
assert.equal(rereadRenamed[0].images['img-1-1.png'], pictureUrl, 'the pictures follow the rename too');
// A book that lost its pictures drops the directory rather than leaving stale files.
const plainAgain = { id: 'local-pic', title: '带图的书', chapters: [{ id: 'pic-1', title: '第一章', paragraphs: ['只剩文字。'] }] };
assert.equal(await T.fsWriteBookBody(plainAgain), true);
assert.equal([...memory.files.keys()].filter((key) => key.indexOf('.assets') >= 0).length, 0, 'stale pictures are cleared');
assert.ok(memory.files.has('books/带图的书--local-pic.epub'), 'the original stays even when the text changed');
// Deleting the book takes the picture directory with it.
assert.equal(await T.fsDeleteBookBody({ id: 'local-pic' }), true);
assert.equal([...memory.files.keys()].filter((key) => key.indexOf('local-pic') >= 0).length, 0);

// `.assets/` is a cache, not the only copy: if it goes missing the pictures are
// rebuilt from the original EPUB that sits beside the text, instead of every one
// of them turning into "this picture could not be read".
const illustratedFileBytes = new Uint8Array(readFileSync(new URL('tests/illustrated.epub', root)));
const sourceBook = {
  id: 'local-src',
  title: '潮水与灯塔',
  chapters: [{
    id: 'src-1',
    title: '第一章 灯塔',
    paragraphs: ['潮水漫过礁石。', '![潮水](img-1-1.png)', '灯塔亮了一夜。', '![灯塔](img-1-2.png)'],
    images: { 'img-1-1.png': pictureUrl, 'img-1-2.png': pictureUrl },
  }],
};
assert.equal(T.fsRememberSource('local-src', '潮水与灯塔.epub', illustratedFileBytes), true);
assert.equal(await T.fsWriteBookBody(sourceBook), true);
assert.ok(memory.files.has('books/潮水与灯塔--local-src.assets/img-1-1.png'));
// Throw the cache folder away and read again: both pictures still arrive.
[...memory.files.keys()].filter((key) => key.indexOf('--local-src.assets/') >= 0).forEach((key) => memory.files.delete(key));
assert.equal([...memory.files.keys()].filter((key) => key.indexOf('.assets') >= 0).length, 0);
const rebuiltBody = plain(await T.fsReadBookBody({ id: 'local-src' }));
assert.ok(rebuiltBody[0].images['img-1-1.png'].startsWith('data:image/png;base64,'), 'the picture is rebuilt from the original');
assert.ok(rebuiltBody[0].images['img-1-2.png'].startsWith('data:image/png;base64,'), 'and so is the second one');
// Not just "some data URL": the bytes are the ones inside the EPUB.
const parsedDirect = await T.parseEpubBook('潮水与灯塔.epub', illustratedFileBytes);
assert.equal(rebuiltBody[0].images['img-1-1.png'], parsedDirect.chapters[0].images['img-1-1.png']);
assert.equal(rebuiltBody[0].images['img-1-2.png'], parsedDirect.chapters[0].images['img-1-2.png']);
assert.equal(T.chapterText(rebuiltBody[0]), '潮水漫过礁石。\n灯塔亮了一夜。');

// With neither a cache nor an original, the text still reads and the marker stays
// visible — a book is not unopenable because a picture went missing.
const orphanPictureBook = {
  id: 'local-nosrc',
  title: '丢了原件的书',
  chapters: [{ id: 'ns-1', title: '第一章', paragraphs: ['只有文字。', '![潮水](img-1-1.png)'] }],
};
assert.equal(await T.fsWriteBookBody(orphanPictureBook), true);
const orphanRead = plain(await T.fsReadBookBody({ id: 'local-nosrc' }));
assert.deepEqual(orphanRead[0].paragraphs, ['只有文字。', '![潮水](img-1-1.png)']);
assert.equal(orphanRead[0].images, undefined, 'no picture, no fake data URL');
assert.equal(await T.fsDeleteBookBody({ id: 'local-nosrc' }), true);
assert.equal(await T.fsDeleteBookBody({ id: 'local-src' }), true);

// Deleting a book clears both shapes of its body; orphan cleanup works on names.
assert.equal(await T.fsDeleteBookBody({ id: 'local-t' }), true);
assert.equal(memory.files.has('books/改了名--local-t.txt'), false);
assert.equal(await T.fsDeleteBookBody('local-t'), false, 'nothing left to delete');
assert.equal(await T.fsDeleteBodyFile('旧书--local-old.txt'), true);
assert.equal(await T.fsDeleteBodyFile('not-there.txt'), false);
assert.equal(memory.files.size, 0);


delete sandbox.FileSystemFileHandle;
assert.equal(T.fsLibrarySupported(), false);
delete sandbox.window.showDirectoryPicker;

// A book an older version parked in OPFS is still a book: the shelf entry survives,
// and any chapters that were in browser storage stay there — deleting a fallback is
// never allowed to delete somebody's text.
const legacyOpfs = T.normalizeState({ customBooks: [
  { id: 'local-p1', title: '甲', chaptersInOpfs: true, chapters: [{ id: 'c1', title: '一', paragraphs: ['正文'] }] },
  { id: 'local-p2', title: '乙', chapters: [{ id: 'c2', title: '一', paragraphs: ['正文'] }] },
] });
assert.equal(legacyOpfs.customBooks.length, 2);
const legacyForStorage = T.stateForStorage(legacyOpfs);
assert.equal(legacyForStorage.customBooks[0].chapters.length, 1, 'a legacy OPFS book keeps its inline text');
assert.equal(legacyForStorage.customBooks[0].chaptersInOpfs, undefined, 'the flag is not written forward');

// A book that never reached the folder is still in browser storage. That is the one
// state the plugin must never describe as "saved", so the count has to be countable.
const diskBooks = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, null, { title: '没有 id' }];
assert.deepEqual(plain(T.unwrittenBookIds(diskBooks, ['a', 'c'])), ['b'], 'only books that need a body count');
assert.deepEqual(plain(T.unwrittenBookIds(diskBooks, ['a', 'b', 'c'])), [], 'all written means nothing left behind');
assert.deepEqual(plain(T.unwrittenBookIds(diskBooks, [])), ['a', 'b', 'c'], 'no writes means all of them');
assert.deepEqual(plain(T.unwrittenBookIds(null, ['a'])), []);
assert.deepEqual(plain(T.unwrittenBookIds(diskBooks, null)), ['a', 'b', 'c']);

// The undo on a delete restores metadata only, so the body file must outlive the
// undo window: it is removed when the window closes, and not at all when the user
// takes the undo. Driven here with a fake clock.
const removedBodies = [];
let pendingTimers = new Map();
let nextTimerId = 1;
const fakeClock = {
  set(fn, ms) { const id = nextTimerId++; pendingTimers.set(id, { fn, ms }); return id; },
  clear(id) { pendingTimers.delete(id); },
  run(id) { const entry = pendingTimers.get(id); if (!entry) return; pendingTimers.delete(id); entry.fn(); },
};
// Nothing fires before the window closes.
const fireLater = T.deferBodyRemoval(['local-a', 'local-b', null, 42], removedBodies.push.bind(removedBodies), 6000, fakeClock.set, fakeClock.clear);
assert.deepEqual(pendingTimers.size, 1);
fakeClock.run(1);
assert.deepEqual(plain(removedBodies), ['local-a', 'local-b'], 'junk ids never reach the disk call');
fireLater(); // after firing, cancel is a no-op
assert.deepEqual(pendingTimers.size, 0);
// Taking the undo cancels the removal: the file stays and the book opens again.
const fireNever = T.deferBodyRemoval(['local-c'], removedBodies.push.bind(removedBodies), 6000, fakeClock.set, fakeClock.clear);
fireNever();
assert.equal(pendingTimers.size, 0, 'the timer is cleared, not left dangling');
assert.deepEqual(plain(removedBodies), ['local-a', 'local-b'], 'the cancelled removal never runs');
// An empty list schedules nothing at all.
assert.equal(T.deferBodyRemoval([], removedBodies.push.bind(removedBodies), 6000, fakeClock.set, fakeClock.clear).name, 'noop');
assert.equal(pendingTimers.size, 0);
// A remove that throws mid-list does not stop the rest.
const throwy = [];
const boom = T.deferBodyRemoval(['x', 'y'], function remove(id) { if (id === 'x') throw new Error('stuck'); throwy.push(id); }, 10, fakeClock.set, fakeClock.clear);
fakeClock.run(pendingTimers.size ? [...pendingTimers.keys()][0] : 3);
assert.deepEqual(plain(throwy), ['y'], 'one stuck file must not block the rest');

// A stripped book must survive normalization, otherwise it vanishes on reload.
const fsRoundTrip = T.normalizeState(JSON.parse(JSON.stringify(stripped)));
assert.equal(fsRoundTrip.customBooks.length, 2);
assert.equal(fsRoundTrip.customBooks[0].id, 'local-a');
assert.equal(fsRoundTrip.customBooks[0].chaptersInFs, true);
assert.equal(fsRoundTrip.customBooks[0].chapters.length, 0);
assert.equal(fsRoundTrip.customBooks[1].chapters.length, 1);
assert.equal(fsRoundTrip.customBooks[1].chaptersInFs, undefined);

// The library pointer itself round-trips, and junk is dropped.
assert.equal(T.normalizeState({ fsLibrary: { name: '拾光书架' } }).fsLibrary.name, '拾光书架');
assert.equal(T.normalizeState({ fsLibrary: {} }).fsLibrary, null);
assert.equal(T.normalizeState({}).fsLibrary, null);

// Last-read relative labels bucket by calendar day, then coarse months/years.
const NOON = new Date(2026, 10, 4, 12, 0, 0).getTime();
assert.equal(T.lastReadRelative(new Date(2026, 10, 4, 8, 30).getTime(), NOON).key, 'lastReadToday');
assert.equal(T.lastReadRelative(new Date(2026, 10, 3, 23, 59).getTime(), NOON).key, 'lastReadYesterday');
assert.equal(T.lastReadRelative(new Date(2026, 10, 1, 10, 0).getTime(), NOON).key, 'lastReadDaysAgo');
assert.equal(T.lastReadRelative(new Date(2026, 10, 1, 10, 0).getTime(), NOON).n, 3);
assert.equal(T.lastReadRelative(new Date(2026, 8, 20, 10, 0).getTime(), NOON).key, 'lastReadMonthsAgo');
assert.equal(T.lastReadRelative(new Date(2024, 10, 4, 10, 0).getTime(), NOON).key, 'lastReadYearsAgo');
assert.equal(T.lastReadRelative(new Date(2024, 10, 4, 10, 0).getTime(), NOON).n, 2);
assert.equal(T.lastReadRelative(new Date(2027, 0, 1).getTime(), NOON).key, 'lastReadToday');
assert.equal(T.lastReadRelative(0, NOON), null);
assert.equal(T.lastReadRelative(undefined, NOON), null);
assert.equal(T.lastReadRelative(new Date(2026, 10, 4, 9, 0).getTime(), NOON).key, 'lastReadToday');

// Duplicate import detection: same title + same content size means "already on the shelf".
const mkBook = (title, sizes) => ({ id: 'x', title: title, source: 'local', chapters: sizes.map((n) => ({ paragraphs: ['a'.repeat(n)] })) });
assert.equal(T.splitDuplicateImports([mkBook('Same', [10])], [mkBook('Same', [10])]).accepted.length, 0);
assert.equal(T.splitDuplicateImports([mkBook('Same', [10])], [mkBook('Same', [10])]).skipped.length, 1);
assert.equal(T.splitDuplicateImports([mkBook('Same', [10])], [mkBook('Same', [11])]).accepted.length, 1);
assert.equal(T.splitDuplicateImports([mkBook('Same', [10])], [mkBook('Other', [10])]).accepted.length, 1);
assert.equal(T.splitDuplicateImports([mkBook('SAME', [10])], [mkBook(' same ', [10])]).skipped.length, 1);
assert.equal(T.splitDuplicateImports([mkBook('A', [5]), mkBook('A', [5])], []).accepted.length, 1);

// Disk-backed books keep their duplicate fingerprint in metadata, so a restart
// cannot turn their content size into zero and let the same file in again.
const signedState = T.normalizeState({
  customBooks: [{
    id: 'local-signed',
    title: '重复检测',
    chaptersInFs: true,
    chapterIds: ['s-1'],
    importSignature: '重复检测:3',
    cover: { from: '#000', to: '#111', ink: '#fff', accent: '#aaa', glyph: '重' },
  }],
});
assert.equal(signedState.customBooks[0].importSignature, '重复检测:3');
assert.equal(T.importBookSignature(signedState.customBooks[0]), '重复检测:3');
assert.equal(T.splitDuplicateImports([mkBook('A', [5]), mkBook('A', [5])], []).skipped.length, 1);
assert.equal(T.splitDuplicateImports([mkBook('A', [5])], [{ title: 'A', source: 'builtin', chapters: [{ paragraphs: ['aaaaa'] }] }]).accepted.length, 1);
assert.equal(T.splitDuplicateImports(null, null).accepted.length, 0);
assert.equal(T.importBookSignature(mkBook('T', [3, 4])), 't:7');
assert.equal(T.importBookSignature(null), ':0');

// Reader theme resolution: 'auto' follows the OS scheme, unknown values fall back to paper.
assert.equal(T.resolveReaderTheme('auto', true), 'night');
assert.equal(T.resolveReaderTheme('auto', false), 'paper');
assert.equal(T.resolveReaderTheme('auto'), 'paper');
assert.equal(T.resolveReaderTheme('night', false), 'night');
assert.equal(T.resolveReaderTheme('snow', true), 'snow');
assert.equal(T.resolveReaderTheme('mint', false), 'mint');
assert.equal(T.resolveReaderTheme('unknown', true), 'paper');
assert.equal(T.resolveReaderTheme(undefined, true), 'paper');
assert.equal(T.normalizeState({ settings: { theme: 'auto' } }).settings.theme, 'auto');
assert.equal(T.normalizeState({ settings: { theme: 'night' } }).settings.theme, 'night');
assert.equal(T.normalizeState({ settings: { theme: 'junk' } }).settings.theme, 'paper');
assert.equal(T.normalizeState({}).settings.theme, 'paper');

// Week-over-week comparison: trailing 7 days against the 7 before, with honest empty weeks.
const dayOffsetKey = (offset) => T.dayKey(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - offset));
const upDays = {};
upDays[dayOffsetKey(0)] = 600;
upDays[dayOffsetKey(6)] = 600;
upDays[dayOffsetKey(7)] = 300;
upDays[dayOffsetKey(13)] = 300;
const upWeek = T.weekComparison(upDays);
assert.equal(upWeek.current, 1200);
assert.equal(upWeek.previous, 600);
assert.equal(upWeek.delta, 600);
assert.equal(upWeek.ratio, 1);
assert.equal(upWeek.direction, 'up');
assert.equal(T.weekDeltaLabel(upWeek, T.translate), '较上周 +100%');
const downDays = {};
downDays[dayOffsetKey(0)] = 300;
downDays[dayOffsetKey(7)] = 600;
const downWeek = T.weekComparison(downDays);
assert.equal(downWeek.direction, 'down');
assert.equal(T.weekDeltaLabel(downWeek, T.translate), '较上周 -50%');
const flatWeek = T.weekComparison({ [dayOffsetKey(0)]: 600, [dayOffsetKey(7)]: 600 });
assert.equal(flatWeek.direction, 'flat');
assert.equal(T.weekDeltaLabel(flatWeek, T.translate), '与上周持平');
const emptyWeek = T.weekComparison({});
assert.equal(emptyWeek.direction, 'flat');
assert.equal(emptyWeek.ratio, 0);
assert.equal(T.weekDeltaLabel(emptyWeek, T.translate), '还没有数据');
const firstWeek = T.weekComparison({ [dayOffsetKey(0)]: 600 });
assert.equal(firstWeek.previous, 0);
assert.equal(firstWeek.direction, 'up');
assert.equal(T.weekDeltaLabel(firstWeek, T.translate), '上周没有记录');
// A backwards change of less than 1% still reports at least 1% instead of a bare 0.
const tinyDown = T.weekComparison({ [dayOffsetKey(0)]: 99, [dayOffsetKey(7)]: 100 });
assert.equal(T.weekDeltaLabel(tinyDown, T.translate), '较上周 -1%');
const recent = T.recentDays({ [T.weekSeries({})[6].key]: 3600 }, 30);
assert.equal(recent.length, 30);
assert.equal(recent[29].today, true);
assert.equal(recent[29].seconds, 3600);
const rhythm = T.weekdayTotals({ '2026-11-02': 600, '2026-11-03': 300 });
assert.equal(rhythm[0], 600);
assert.equal(rhythm[1], 300);
assert.equal(T.weekdayTotals({}).length, 7);
assert.equal(T.heatLevel(0), 0);
assert.equal(T.heatLevel(600), 1);
assert.equal(T.heatLevel(1200), 2);
assert.equal(T.heatLevel(2400), 3);
assert.equal(T.heatLevel(3600), 4);

// EPUB import: ZIP parsing, OPF metadata, XHTML extraction, entities.
const epubBytes = new Uint8Array(readFileSync(new URL('tests/sample.epub', root)));
const epubBook = await T.parseEpubBook('海边的书.epub', epubBytes);
assert.equal(epubBook.title, '海边的书');
assert.equal(epubBook.author, '测试作者');
assert.equal(epubBook.format, 'epub');
assert.ok(epubBook.coverImage.startsWith('data:image/png;base64,'));
assert.equal(epubBook.chapters.length, 2);
assert.equal(epubBook.chapters[0].title, '第一章 潮声');
assert.deepEqual(plain(epubBook.chapters[0].paragraphs), ['海风从窗边吹进来。', '月亮升起来了 & 星星也亮了。']);
assert.deepEqual(plain(epubBook.chapters[1].paragraphs), ['船靠岸的时候，天刚亮。', '她把书合上，听见远处的汽笛。']);
const epubBlob = new Blob([epubBytes]);
const epubBlobBook = await T.parseEpubBook('海边的书.epub', epubBlob);
assert.equal(epubBlobBook.title, '海边的书');
assert.equal(epubBlobBook.chapters.length, 2);
const normalizedEpub = T.normalizeState({ customBooks: [epubBook] });
const smokeNoop = () => {};
const smokeT = (key) => key;
const smokeState = T.normalizeState({
  customBooks: [epubBook],
  progress: { [epubBook.id]: { chapterIndex: 0, percent: 0.25, updatedAt: 1 } },
  highlights: [{ id: 'hl-smoke', bookId: epubBook.id, chapterIndex: 0, chapterId: epubBook.chapters[0].id, start: 0, end: 2, text: '海风', note: '', color: 'amber', tags: ['海风'], createdAt: 2 }],
  bookmarks: [{ id: 'bm-smoke', bookId: epubBook.id, chapterIndex: 0, chapterId: epubBook.chapters[0].id, percent: 0.2, page: 1, chapterTitle: '第一章', excerpt: '海风', note: '备注', createdAt: 2 }],
  reviews: { [epubBook.id]: { rating: 4, text: '好看', updatedAt: 3 } },
  userTags: { [epubBook.id]: ['测试'] },
  wishlist: [epubBook.id],
  pins: [epubBook.id],
  sessions: [{ id: 's-smoke', bookId: epubBook.id, startedAt: 1, endedAt: 2, seconds: 120, chapterIndex: 0 }],
});
const smokeBooks = [epubBook];
const smokeShelfProps = {
  state: smokeState, books: smokeBooks, highlights: smokeState.highlights, t: smokeT, query: '',
  onOpenBook: smokeNoop, onContinueBook: smokeNoop, onClearSearch: smokeNoop, onImport: smokeNoop,
  onExportBackup: smokeNoop, onRestoreBackup: smokeNoop, onSortChange: smokeNoop, onViewChange: smokeNoop,
  onJumpContent: smokeNoop, userTags: smokeState.userTags, showToast: smokeNoop,
};
const smokeStatsProps = {
  state: smokeState, books: smokeBooks, highlights: smokeState.highlights, t: smokeT,
  onOpen: smokeNoop, onUpdateGoal: smokeNoop, onClearStats: smokeNoop, onClearAnnotations: smokeNoop,
  onResetAll: smokeNoop, onExportBackup: smokeNoop, showToast: smokeNoop,
};
const smokeNotesProps = {
  books: smokeBooks, highlights: smokeState.highlights, bookmarks: smokeState.bookmarks, reviews: smokeState.reviews,
  t: smokeT, onJump: smokeNoop, onDeleteHighlight: smokeNoop, onUpdateHighlight: smokeNoop,
  onDeleteBookmark: smokeNoop, onBulkDelete: smokeNoop, onUpdateBookmark: smokeNoop, onOpenBook: smokeNoop, showToast: smokeNoop,
  onRenameTag: smokeNoop, onDeleteTag: smokeNoop, onBulkTag: smokeNoop,
};
const smokeDetailProps = {
  book: epubBook, progress: smokeState.progress[epubBook.id], t: smokeT, onClose: smokeNoop, onRead: smokeNoop,
  onRemove: smokeNoop, onUpdateBook: smokeNoop, onUpdateCover: smokeNoop, showToast: smokeNoop,
  userTags: smokeState.userTags[epubBook.id], onAddTag: smokeNoop, onRemoveTag: smokeNoop,
  pinned: true, onTogglePin: smokeNoop, wishlisted: true, onToggleWishlist: smokeNoop, onToggleFinished: smokeNoop,
  review: smokeState.reviews[epubBook.id], onSaveReview: smokeNoop,
  similar: [Object.assign({}, epubBook, { id: 'similar-book', title: '相似书' })],
  bookSessions: smokeState.sessions, notes: smokeState.highlights, bookNotes: smokeState.bookmarks,
  readingSeconds: 120, noteCount: 1, bookmarkCount: 1,
};
const smokeReaderProps = {
  book: epubBook, initialChapterIndex: 0, initialPercent: 0.1, settings: smokeState.settings,
  highlights: smokeState.highlights, bookmarks: smokeState.bookmarks, t: smokeT,
  onUpdateSettings: smokeNoop, onProgress: smokeNoop, onFinish: smokeNoop, onExit: smokeNoop,
  addHighlight: smokeNoop, deleteHighlight: smokeNoop, updateHighlight: smokeNoop,
  addBookmark: smokeNoop, removeBookmark: smokeNoop, onUpdateBookmark: smokeNoop,
  onAddSeconds: smokeNoop, onSessionEnd: smokeNoop, showToast: smokeNoop,
  chapterMarks: { [epubBook.chapters[0].id]: 0.45 },
};
for (const entry of [
  ['ShelfView', T.ShelfView, smokeShelfProps],
  ['StatsView', T.StatsView, smokeStatsProps],
  ['NotesView', T.NotesView, smokeNotesProps],
  ['BookDetail', T.BookDetail, smokeDetailProps],
  ['Reader', T.Reader, smokeReaderProps],
  ['PasteImportDialog', T.PasteImportDialog, { t: smokeT, onClose: smokeNoop, onImport: () => true }],
  ['MonthlyCardDialog', T.MonthlyCardDialog, { t: smokeT, summary: monthly, onClose: smokeNoop, showToast: smokeNoop }],
]) {
  assert.doesNotThrow(() => entry[1](entry[2]), entry[0] + ' renders without throwing');
}
assert.doesNotThrow(() => T.ShelfView(Object.assign({}, smokeShelfProps, { state: Object.assign({}, smokeState, { shelfView: 'list' }) })), 'ShelfView list renders');
assert.doesNotThrow(() => T.ShelfView(Object.assign({}, smokeShelfProps, { state: Object.assign({}, smokeState, { shelfView: 'group' }) })), 'ShelfView group renders');
assert.doesNotThrow(() => T.ShelfView(Object.assign({}, smokeShelfProps, { initialSelectMode: true, initialSelected: [epubBook.id] })), 'ShelfView batch toolbar renders with a selection');
assert.doesNotThrow(() => T.NotesView(Object.assign({}, smokeNotesProps, { highlights: [], bookmarks: [], reviews: smokeState.reviews })), 'NotesView reviews renders');
assert.doesNotThrow(() => T.NotesView(Object.assign({}, smokeNotesProps, { highlights: [], bookmarks: smokeState.bookmarks, reviews: {} })), 'NotesView bookmarks renders');
const longTitleBook = Object.assign({}, epubBook, { title: '极长书名测试'.repeat(40) });
assert.doesNotThrow(() => T.BookDetail(Object.assign({}, smokeDetailProps, { book: longTitleBook, review: null })), 'BookDetail long title renders');
assert.match(read('source/styles.js'), /^\.sr-detail-meta strong\{.*overflow-wrap:anywhere/m, 'left title wraps long unbroken words');
assert.doesNotThrow(() => T.NotesView(Object.assign({}, smokeNotesProps, { highlights: [], bookmarks: [{ id: 'bm1', bookId: 'book-a', chapterIndex: 0, percent: 0.1, page: 1, createdAt: 1, note: '笔记' }, { id: 'bm2', bookId: 'book-b', chapterIndex: 0, percent: 0.2, page: 2, createdAt: 2 }], reviews: {} })), 'NotesView bookmarks with multiple books renders');
assert.doesNotThrow(() => T.QuoteCardDialog({ t: smokeT, text: '海风从窗边吹进来。', note: '喜欢这句', bookTitle: '海边的书', chapterTitle: '第一章', showToast: smokeNoop, onClose: smokeNoop }), 'QuoteCardDialog renders');
assert.doesNotThrow(() => T.ShelfView(Object.assign({}, smokeShelfProps, {
  userTags: { 'book-a': ['海', '夜'], 'book-b': ['海'] },
  shelfTagFilter: '海',
})), 'ShelfView multi-tag filter row renders');
const manyBooks = [];
for (let i = 0; i < 500; i++) {
  manyBooks.push({
    id: 'book-' + i,
    title: '测试书籍 ' + i,
    author: '测试作者',
    source: 'local',
    tags: ['测试'],
  });
}
assert.doesNotThrow(() => T.ShelfView(Object.assign({}, smokeShelfProps, { books: manyBooks })), 'ShelfView with 500 books renders cleanly with virtual windowing');
assert.doesNotThrow(() => T.CommandPalette({
  t: smokeT, books: smokeBooks, highlights: smokeState.highlights, userTags: { 'book-a': ['海'] },
  progress: {}, bookMarks: {}, recent: [], actions: [
    { id: 'today', label: '今日阅读小结', icon: 'clock', run: smokeNoop },
    { id: 'titles', label: '复制书名', icon: 'copy', run: smokeNoop },
    { id: 'x', label: '导入', icon: 'upload', run: smokeNoop },
  ],
  onOpenBook: smokeNoop, onOpenChapter: smokeNoop, onOpenNote: smokeNoop, onSelectTag: smokeNoop, onClose: smokeNoop,
}), 'CommandPalette renders');
assert.doesNotThrow(() => T.TagManagerDialog({
  t: smokeT, tags: ['海', '夜'], counts: new Map([['海', 2], ['夜', 1]]),
  title: '管理书籍标签', hint: '重命名会同步更新所有书', empty: '还没有书籍标签',
  onRename: smokeNoop, onDelete: smokeNoop, onClose: smokeNoop,
}), 'TagManagerDialog renders with custom copy');
const estimateBook = {
  id: 'est-book', title: '估值之书', author: '测试', subtitle: '', source: 'builtin', tags: [],
  chapters: Array.from({ length: 10 }, (_, index) => ({ id: 'ec-' + index, title: '第' + (index + 1) + '章', paragraphs: ['正文'] })),
};
assert.doesNotThrow(() => T.BookDetail(Object.assign({}, smokeDetailProps, {
  book: estimateBook,
  progress: { chapterIndex: 4, percent: 0.5, completed: false, chapterMarks: { 'ec-0': 0.99, 'ec-4': 0.5, 'ec-6': 0.3 } },
  readingSeconds: 3600,
  dailyPaceSeconds: 1800,
  userTags: [],
  review: null,
  bookSessions: [],
  similar: [],
  notes: [{ id: 'h1', bookId: 'est-book', chapterIndex: 0, text: '重要段落' }],
  bookNotes: [{ id: 'b1', bookId: 'est-book', chapterIndex: 4, page: 3 }],
})), 'BookDetail renders the finish-time estimate and chapter overview with marks');
assert.doesNotThrow(() => T.BookDetail(Object.assign({}, smokeDetailProps, {
  book: estimateBook,
  progress: { chapterIndex: 9, percent: 1.0, completed: true },
  readingSeconds: 7200,
  dailyPaceSeconds: 1800,
  userTags: [],
  review: null,
  bookSessions: [],
  similar: [],
  notes: [],
  bookNotes: [],
})), 'BookDetail renders completed book with full chapter overview');
const diskBook = {
  id: 'disk-book-1',
  title: '磁盘书籍',
  author: '作者',
  subtitle: '',
  chaptersInFs: true,
  chapterCount: 5,
  charCount: 12000,
  tags: [],
};
assert.doesNotThrow(() => T.BookDetail(Object.assign({}, smokeDetailProps, {
  book: diskBook,
  progress: { chapterIndex: 1, percent: 0.2 },
  readingSeconds: 600,
  dailyPaceSeconds: 600,
  notes: [{ id: 'n1', bookId: 'disk-book-1', chapterIndex: 0, text: '无章节划线' }],
  bookNotes: [{ id: 'b1', bookId: 'disk-book-1', chapterIndex: 0, page: 1 }],
  bookSessions: [{ id: 's1', bookId: 'disk-book-1', chapterIndex: 0, seconds: 120, endedAt: Date.now() }],
})), 'BookDetail renders disk-backed book without memory chapters');
assert.doesNotThrow(() => T.Reader(Object.assign({}, smokeReaderProps, {
  book: diskBook,
})), 'Reader renders disk-backed book without memory chapters in safe loading state');
assert.doesNotThrow(() => T.bookNotesMarkdown(diskBook, [
  { id: 'n1', bookId: 'disk-book-1', chapterIndex: 0, text: '划线', createdAt: Date.now() }
], [
  { id: 'b1', bookId: 'disk-book-1', chapterIndex: 0, page: 1, createdAt: Date.now() }
], smokeT, null), 'bookNotesMarkdown works without memory chapters');
assert.doesNotThrow(() => T.QuoteCardDialog({ t: smokeT, text: '海风', note: '', bookTitle: '书', chapterTitle: '', showToast: smokeNoop, onClose: smokeNoop }), 'QuoteCardDialog without thought renders');
assert.doesNotThrow(() => T.QuoteCollectionDialog({
  t: smokeT,
  items: ['海风从窗边吹进来。', '月亮升起来了。', '船靠岸的时候，天刚亮。'],
  title: '海边的书',
  caption: '3 句摘录',
  showToast: smokeNoop,
  onClose: smokeNoop,
}), 'QuoteCollectionDialog renders');
assert.doesNotThrow(() => T.TagManagerDialog({
  t: smokeT,
  tags: ['海风', '意象', '旅行'],
  counts: new Map([['海风', 3], ['意象', 1], ['旅行', 2]]),
  onRename: smokeNoop,
  onDelete: smokeNoop,
  onClose: smokeNoop,
}), 'TagManagerDialog renders');
assert.doesNotThrow(() => T.TagManagerDialog({ t: smokeT, tags: [], counts: new Map(), onRename: smokeNoop, onDelete: smokeNoop, onClose: smokeNoop }), 'TagManagerDialog empty renders');
console.log('PASS  component render smoke (Shelf/Stats/Notes/Detail/Reader/Paste)');
assert.equal(normalizedEpub.customBooks.length, 1);
assert.equal(normalizedEpub.customBooks[0].format, 'epub');
assert.equal(normalizedEpub.customBooks[0].coverImage, epubBook.coverImage);
const ncxBytes = new Uint8Array(readFileSync(new URL('tests/sample-ncx.epub', root)));
const ncxBook = await T.parseEpubBook('NCX 测试.epub', ncxBytes);
assert.equal(ncxBook.title, 'NCX 测试');
assert.equal(ncxBook.author, '作者二');
assert.equal(ncxBook.chapters[0].title, '第一章 NCX 标题');
assert.equal(ncxBook.chapters[1].title, '第二章 NCX 标题');
assert.ok(ncxBook.coverImage.startsWith('data:image/png;base64,'));

// Pictures survive the import: each <img> becomes its own paragraph holding a
// markdown image line, and the bytes ride along on the chapter so the reader can
// draw them without going back to the original file.
const illustratedBytes = new Uint8Array(readFileSync(new URL('tests/illustrated.epub', root)));
const illustrated = await T.parseEpubBook('潮水与灯塔.epub', illustratedBytes);
assert.equal(illustrated.chapters.length, 1);
assert.equal(illustrated.chapters[0].title, '第一章 灯塔');
assert.deepEqual(plain(illustrated.chapters[0].paragraphs), [
  '潮水漫过礁石。',
  '![潮水](img-1-1.png)',
  '灯塔亮了一夜。',
  '![灯塔](img-1-2.png)',
  '天亮时雾散了。',
]);
assert.deepEqual(Object.keys(plain(illustrated.chapters[0].images)), ['img-1-1.png', 'img-1-2.png']);
assert.ok(illustrated.chapters[0].images['img-1-1.png'].startsWith('data:image/png;base64,'));
const illustratedLight = await T.parseEpubBook('潮水与灯塔.epub', illustratedBytes, { skipImageBytes: true });
assert.equal(illustratedLight.chapters.length, 1);
assert.deepEqual(plain(illustratedLight.chapters[0].paragraphs), [
  '潮水漫过礁石。',
  '![潮水](img-1-1.png)',
  '灯塔亮了一夜。',
  '![灯塔](img-1-2.png)',
  '天亮时雾散了。',
]);
assert.equal(illustratedLight.chapters[0].images, undefined, 'skipImageBytes keeps markdown placeholders but allocates zero image bytes');
assert.equal(typeof T.bytesToBase64, 'function');
assert.equal(T.bytesToBase64(new Uint8Array([72, 101, 108, 108, 111])), 'SGVsbG8=');
assert.equal(await T.downscaleCoverDataUrl('not-an-image'), 'not-an-image');
assert.equal(await T.downscaleCoverDataUrl('data:image/jpeg;base64,1234'), 'data:image/jpeg;base64,1234');
const tinyCover = await T.makeCoverThumbnail(new Uint8Array([1, 2, 3, 4]), 'image/png');
assert.ok(tinyCover.startsWith('data:image/png;base64,'));
// The picture line is a marker, not prose: search, word counts and read-aloud skip it.
assert.equal(T.chapterText(illustrated.chapters[0]), '潮水漫过礁石。\n灯塔亮了一夜。\n天亮时雾散了。');
const plainChapter = T.parseBookBodyText('# 第一章 灯塔\n\n潮水漫过礁石。\n\n![潮水](img-1-1.png)\n\n天亮时雾散了。', ['c-1']);
assert.deepEqual(plain(plainChapter[0].paragraphs), ['潮水漫过礁石。', '![潮水](img-1-1.png)', '天亮时雾散了。'], 'the marker round-trips through the text file');

// A picture too small to read opens full-screen when clicked. The dark area and the
// close button put the page back; clicking the picture itself does not, or dragging
// to look at a detail would close it.
assert.equal(T.readerLightbox(null, T.translate, smokeNoop), null);
assert.equal(T.readerLightbox({ alt: '潮水' }, T.translate, smokeNoop), null, 'no source, no lightbox');
let lightboxClosed = 0;
const lightbox = T.readerLightbox({ src: 'data:image/png;base64,AAA', alt: '潮水' }, T.translate, () => { lightboxClosed += 1; });
const lightboxParts = lightbox.props.children.filter(Boolean);
assert.equal(lightbox.props.className, 'sr-lightbox');
assert.equal(lightbox.props.role, 'dialog');
assert.equal(lightbox.props['aria-modal'], 'true');
assert.equal(lightbox.props['aria-label'], '潮水');
assert.equal(lightboxParts[0].props.src, 'data:image/png;base64,AAA');
assert.equal(lightboxParts[1].props.children, '潮水');
lightbox.props.onClick();
assert.equal(lightboxClosed, 1, 'the dark area closes it');
lightboxParts[2].props.onClick({ stopPropagation: smokeNoop });
assert.equal(lightboxClosed, 2, 'the close button closes it');
lightboxParts[0].props.onClick({ stopPropagation: smokeNoop });
assert.equal(lightboxClosed, 2, 'a click on the picture keeps it open');
assert.equal(T.readerLightbox({ src: 'x' }, smokeT, smokeNoop).props.children.filter(Boolean).length, 2, 'no caption when the picture has none');
// And the figure in the page really is wired to it.
function collectNodes(node, out) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    node.forEach((child) => collectNodes(child, out));
    return out;
  }
  if (node.props) {
    out.push(node);
    collectNodes(node.props.children, out);
  }
  return out;
}
const illustratedReader = T.Reader(Object.assign({}, smokeReaderProps, { book: illustrated }));
const figureNodes = collectNodes(illustratedReader, []).filter((node) => typeof node.props.className === 'string' && node.props.className.indexOf('sr-figure') >= 0);
assert.ok(figureNodes.length >= 2, 'both pictures are drawn as figures');
const zoomFigure = figureNodes.find((node) => node.props.className.indexOf('sr-figure-zoom') >= 0);
assert.equal(typeof zoomFigure.props.onClick, 'function', 'the picture is clickable');
assert.equal(zoomFigure.props.role, 'button');
assert.equal(typeof zoomFigure.props.onKeyDown, 'function', 'keyboard users can open it too');
assert.equal(T.imageParagraph('![潮水](img-1-1.png)').name, 'img-1-1.png');
assert.equal(T.imageParagraph('潮水'), null);
assert.equal(T.imageParagraph(''), null);
// Highlight offsets are measured in chapterText coordinates. A picture paragraph
// takes no room there, so a highlight after one still quotes what was selected.
const offsetChapter = { title: '章', paragraphs: ['甲乙', '![潮水](img-1-1.png)', '丙丁'] };
const offsetInfo = T.chapterBaseOffsets(offsetChapter);
assert.equal(offsetInfo.offsets[0], 0);
assert.equal(offsetInfo.offsets[1], 3, 'the picture line answers to the previous paragraph end');
assert.equal(offsetInfo.offsets[2], 3, 'the picture takes no offset room of its own');
assert.equal(offsetInfo.total, T.chapterText(offsetChapter).length);
assert.equal(T.chapterText(offsetChapter).slice(offsetInfo.offsets[2]), '丙丁');

assert.equal(T.readerExcerptAt('海风从窗边吹进来，书本翻到下一页。', 0, 8), '海风从窗边吹进来');
assert.equal(T.readerExcerptAt('', 0.5, 10), '');
const normalizedBookmark = T.normalizeState({ customBooks: [rjcBook], bookmarks: [{ id: 'bm', bookId: 'local-rjc', chapterId: 'rjc-1', chapterIndex: 0, percent: 0.2, page: 2, chapterTitle: '卷一', excerpt: '测试摘录', createdAt: 1 }] });
assert.equal(normalizedBookmark.bookmarks[0].excerpt, '测试摘录');
assert.equal(normalizedBookmark.bookmarks[0].note, '');
assert.deepEqual(plain(T.cleanUserTags([' 待读 ', '待读', '文学', '', 'x'.repeat(30)])).slice(0, 2), ['待读', '文学']);
assert.equal(T.cleanUserTags(Array.from({ length: 12 }, (_, i) => 'tag' + i)).length, 8);
const statusGroups = T.groupBooksByStatus([{ id: 'x' }, { id: 'y' }, { id: 'z' }, { id: 'w' }], { x: { completed: false }, y: { completed: true } }, ['z']);
assert.deepEqual(plain(statusGroups.map((group) => group.id)), ['reading', 'wishlist', 'unread', 'finished']);
assert.deepEqual(plain(statusGroups[0].books.map((book) => book.id)), ['x']);
// Shelved gets its own group; finished books stay finished even when parked.
const shelvedGroups = T.groupBooksByStatus(
  [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }],
  { a: { completed: false }, b: { completed: true }, d: { completed: false } },
  [], ['a', 'd'],
);
assert.deepEqual(plain(shelvedGroups.map((group) => group.id)), ['shelved', 'unread', 'finished']);
assert.deepEqual(plain(shelvedGroups.find((group) => group.id === 'shelved').books.map((book) => book.id)), ['a', 'd']);
assert.deepEqual(plain(shelvedGroups.find((group) => group.id === 'finished').books.map((book) => book.id)), ['b']);
const randomBooks = [{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }];
assert.equal(T.pickRandomBook(randomBooks, { r1: { completed: true } }, 0).id, 'r2');
assert.equal(T.pickRandomBook([], {}, 0.5), null);
assert.equal(T.pickRandomBook(randomBooks, {}, 0.9).id, 'r3');
const contBooks = [{ id: 'b1', title: '书一' }, { id: 'b2', title: '书二' }, { id: 'b3', title: '书三' }];
assert.equal(T.resolveContinueBook([], {}), null);
assert.equal(T.resolveContinueBook(contBooks, {}).id, 'b1');
assert.equal(T.resolveContinueBook(contBooks, {}, ['b1']).id, 'b2');
const progStub = { b1: { updatedAt: 100 }, b2: { updatedAt: 500 }, b3: { updatedAt: 300 } };
assert.equal(T.resolveContinueBook(contBooks, progStub).id, 'b2');
assert.equal(T.resolveContinueBook(contBooks, progStub, ['b2']).id, 'b3');
const similarStub = [
  { id: 'b1', title: '主书', tags: ['文学', '海'] },
  { id: 'b2', title: '同海', tags: ['海'] },
  { id: 'b3', title: '同文学', tags: ['文学'] },
  { id: 'b4', title: '无关', tags: ['科技'] },
];
assert.deepEqual(plain(T.similarBooks(similarStub[0], similarStub, 4).map((book) => book.id)), ['b2', 'b3']);
assert.deepEqual(plain(T.similarBooks({ id: 'x', tags: [] }, similarStub, 4)), []);
const dailyBooks = [{ id: 'b1', title: '海边的书', chapters: [{ title: '第一章', paragraphs: ['海风'] }] }];
const dailyNotes = [{ id: 'n1', bookId: 'b1', chapterIndex: 0, start: 0, text: '海风', note: '', createdAt: 1 }];
assert.equal(T.pickDailyQuote(dailyNotes, dailyBooks, '2026-11-04').text, '海风');
assert.equal(T.pickDailyQuote([], dailyBooks, '2026-11-04'), null);
assert.equal(T.pickDailyQuote(dailyNotes, dailyBooks, '2026-11-05').bookTitle, '海边的书');
assert.equal(T.pickDailyQuote(dailyNotes.concat([{ id: 'n2', bookId: 'b1', chapterIndex: 0, start: 0, text: '第二', note: '', createdAt: 2 }]), dailyBooks, '2026-11-04', 1).text, '第二');
const dayStamp = new Date(2026, 10, 4, 12, 0, 0).getTime();
const daySessions = T.sessionsOnDay([{ id: 's1', bookId: 'b1', startedAt: dayStamp, endedAt: dayStamp + 60000, seconds: 60 }, { id: 's2', bookId: 'b1', startedAt: dayStamp - 86400000, endedAt: dayStamp - 86400000, seconds: 60 }], '2026-11-04');
assert.equal(daySessions.length, 1);
const bookSessionList = T.sessionsForBook([{ id: 's1', bookId: 'b1', endedAt: 10, seconds: 60 }, { id: 's2', bookId: 'b2', endedAt: 20, seconds: 60 }, { id: 's3', bookId: 'b1', endedAt: 30, seconds: 90 }], 'b1', 3);
assert.deepEqual(plain(bookSessionList.map((item) => item.id)), ['s3', 's1']);
assert.equal(T.remainingReadingMinutes('字'.repeat(800), 0), 2);
assert.equal(T.remainingReadingMinutes('字'.repeat(800), 0.5), 1);
assert.equal(T.remainingReadingMinutes('字'.repeat(800), 1), 0);
assert.deepEqual(plain(T.splitSelectionKeys(['h:1', 'b:2', 'h:3', 'x'])), { highlightIds: ['1', '3'], bookmarkIds: ['2'] });
const overviewBook = { id: 'b1', chapters: [{ id: 'c1', title: '一', paragraphs: ['字'.repeat(800)] }, { id: 'c2', title: '二', paragraphs: ['字'.repeat(400)] }] };
const overview = T.chapterOverview(overviewBook, 1, [{ bookId: 'b1', chapterIndex: 0 }], [{ bookId: 'b1', chapterIndex: 1 }]);
assert.equal(overview[0].read, true);
assert.equal(overview[0].notes, 1);
assert.equal(overview[1].current, true);
assert.equal(overview[1].bookmarks, 1);
assert.equal(overview[0].minutes, 2);
const notebook = [
  { id: 'n1', bookId: 'b', chapterIndex: 1, start: 20, createdAt: 10 },
  { id: 'n2', bookId: 'a', chapterIndex: 0, start: 5, createdAt: 30 },
  { id: 'n3', bookId: 'b', chapterIndex: 0, start: 9, createdAt: 20 },
];
const titles = { a: 'A 书', b: 'B 书' };
assert.deepEqual(plain(T.sortNotebookItems(notebook, 'newest', (id) => titles[id]).map((item) => item.id)), ['n2', 'n3', 'n1']);
assert.deepEqual(plain(T.sortNotebookItems(notebook, 'oldest', (id) => titles[id]).map((item) => item.id)), ['n1', 'n3', 'n2']);
assert.deepEqual(plain(T.sortNotebookItems(notebook, 'book', (id) => titles[id]).map((item) => item.id)), ['n2', 'n3', 'n1']);
assert.equal(T.buildReviewText({ title: '书', author: '作者' }, { rating: 4, text: '很好' }), '《书》 · 作者\n★★★★☆\n\n很好');
assert.equal(T.buildReviewText({ title: '书' }, null), '');
const revA = { book: { title: '书A' }, review: { rating: 3, updatedAt: 100 } };
const revB = { book: { title: '书B' }, review: { rating: 5, updatedAt: 50 } };
assert.deepEqual(T.sortReviewItems([revA, revB], 'rating').map((i) => i.book.title), ['书B', '书A']);
assert.deepEqual(T.sortReviewItems([revA, revB], 'newest').map((i) => i.book.title), ['书A', '书B']);
assert.deepEqual(T.sortReviewItems([revA, revB], 'oldest').map((i) => i.book.title), ['书B', '书A']);
assert.match(T.formatClock(), /^\d{2}:\d{2}$/);
assert.equal(T.formatClock(new Date('2026-11-04T09:05:00Z')), (function fixed() {
  const d = new Date('2026-11-04T09:05:00Z');
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
})());
assert.equal(T.formatBookInfo({ title: '朝花夕拾', author: '鲁迅' }), '《朝花夕拾》 鲁迅');
assert.equal(T.formatBookInfo({ title: '无名之书' }), '《无名之书》');
assert.equal(T.formatBookInfo(null), '');
assert.equal(T.formatWordCount(0, (k) => ({ wordCountUnits: '{n} 字' })[k]), '0 字');
assert.equal(T.formatWordCount(3500, (k) => ({ wordCountUnits: '{n} 字' })[k]), '3,500 字');
assert.equal(T.formatWordCount(12000, (k) => ({ wordCountTenThousand: '{n} 万字' })[k]), '1.2 万字');
assert.equal(T.buildBookTitlesText([{ title: '呐喊', author: '鲁迅' }, { title: '边城', author: '沈从文' }]), '《呐喊》 鲁迅\n《边城》 沈从文');
assert.equal(T.buildBookTitlesText([{ title: '无作者' }]), '《无作者》');
assert.equal(T.buildBookTitlesText([]), '');
assert.equal(T.buildBookTitlesText(null), '');
assert.equal(T.invertSelectionKeys(null, null).length, 0);
assert.equal(T.invertSelectionKeys(['a', 'b', 'c'], ['a']).join(','), 'b,c');
assert.equal(T.invertSelectionKeys(['a', 'b', 'c'], ['a', 'b', 'c']).length, 0);
assert.equal(T.invertSelectionKeys(['a', 'b', 'c'], []).join(','), 'a,b,c');
assert.equal(T.peakWeekday(null), null);
assert.equal(T.pickRandomHighlight(null), null);
assert.equal(T.pickRandomHighlight([]), null);
assert.equal(T.pickRandomHighlight([{}]), null);
const sampleHighlights = [
  { id: 'h1', bookId: 'b1', text: '第一句' },
  { id: 'h2', bookId: 'b2', text: '第二句' }
];
assert.equal(T.pickRandomHighlight(sampleHighlights, 0).id, 'h1');
assert.equal(T.pickRandomHighlight(sampleHighlights, 0.9).id, 'h2');
assert.equal(T.peakWeekday([]), null);
assert.equal(T.peakWeekday([0, 0, 0, 0, 0, 0, 0]), null);
const peakSample = T.peakWeekday([100, 300, 0, 600, 0, 0, 0]);
assert.equal(peakSample.index, 3);
assert.equal(peakSample.seconds, 600);
assert.equal(peakSample.totalSeconds, 1000);
assert.equal(peakSample.ratio, 0.6);
assert.equal(T.buildQuoteText(' 海风 ', '海边的书', '第一章'), '海风\n——《海边的书》 · 第一章');
assert.equal(T.buildQuoteText('', '书', '章'), '');
assert.equal(T.buildCalloutText('', '', '书', '章'), '');
assert.equal(T.buildCalloutText('海风吹拂。', '', '海边的书', '第一章'), '> [!quote] 《海边的书》 · 第一章\n> 海风吹拂。');
assert.equal(T.buildCalloutText('第一行\n第二行', '很有共鸣', '海边的书', '第二章', '想法'), '> [!quote] 《海边的书》 · 第二章\n> 第一行\n> 第二行\n>\n> **想法**：很有共鸣');
const reportState = {
  stats: { days: { [T.weekSeries({})[6].key]: 1800 }, byBook: { b1: 1800 }, goalMinutes: 180 },
  progress: { b1: { chapterIndex: 0, percent: 1, completed: true } },
  reviews: { b1: { rating: 5, text: '值得重读', updatedAt: 3 } },
  highlights: [{ bookId: 'b1', chapterIndex: 0, start: 0, text: '海风', note: '', createdAt: 1 }],
  bookmarks: [],
  sessions: [{ id: 's1', bookId: 'b1', startedAt: 1, endedAt: 2, seconds: 120, chapterIndex: 0 }],
};
const report = T.readingReportMarkdown(reportState, [{ id: 'b1', title: '海边的书', author: '作者', tags: ['文学'], chapters: [{}] }], (key) => key);
assert.ok(report.includes('# readingReport'));
assert.ok(report.includes('海边的书'));
assert.ok(report.includes('weekdayRhythm'));
assert.ok(report.includes('readingTastes'));
assert.ok(report.includes('值得重读'));
assert.ok(report.includes('★★★★★'));
const markdownBook = { id: 'b1', title: '海边的书', author: '测试作者', chapters: [{ title: '第一章' }, { title: '第二章' }] };
const selectedMarkdown = T.selectedAnnotationsMarkdown(
  ['h:hl1', 'b:bm1'],
  [{ id: 'hl1', bookId: 'b1', chapterIndex: 0, start: 0, text: '海风', note: '喜欢', tags: ['海风'], createdAt: 1 }],
  [{ id: 'bm1', bookId: 'b1', chapterIndex: 1, page: 4, excerpt: '岸边', note: '停一停', createdAt: 2 }],
  [{ id: 'b1', title: '海边的书', author: '作者', chapters: [{ title: '一' }, { title: '二' }] }],
  (key) => key,
);
assert.ok(selectedMarkdown.includes('海边的书'));
assert.ok(selectedMarkdown.includes('> 海风'));
assert.ok(selectedMarkdown.includes('#海风'));
assert.ok(selectedMarkdown.includes('停一停'));
assert.ok(selectedMarkdown.includes('> 岸边'));
const fullNotebookMd = T.notebookMarkdown(
  [{ id: 'hl1', bookId: 'b1', chapterIndex: 0, start: 0, text: '海风吹拂', note: '心旷神怡', tags: ['风景'], createdAt: 1 }],
  [{ id: 'bm1', bookId: 'b1', chapterIndex: 1, page: 4, excerpt: '海岸线', note: '下次继续', createdAt: 2 }],
  new Map([['b1', { id: 'b1', title: '海边的书', author: '测试作者', chapters: [{ title: '第一章' }, { title: '第二章' }] }]]),
  (key) => key,
);
assert.ok(fullNotebookMd.includes('# brand · notesTitle'));
assert.ok(fullNotebookMd.includes('notebookSummaryMeta'));
assert.ok(fullNotebookMd.includes('## 海边的书'));
assert.ok(fullNotebookMd.includes('*测试作者*'));
assert.ok(fullNotebookMd.includes('> 海风吹拂'));
assert.ok(fullNotebookMd.includes('**thought**'));

const tagNotebookMd = T.notebookByTagMarkdown(
  [
    { id: 'hl1', bookId: 'b1', chapterIndex: 0, text: '海风吹拂', note: '心旷神怡', tags: ['风景'], createdAt: 1 },
    { id: 'hl2', bookId: 'b1', chapterIndex: 1, text: '灯塔微光', note: '', tags: [], createdAt: 2 },
  ],
  new Map([['b1', { id: 'b1', title: '海边的书', chapters: [{ title: '第一章' }, { title: '第二章' }] }]]),
  (key) => key,
);
assert.ok(tagNotebookMd.includes('# brand · notesByTagTitle'));
assert.ok(tagNotebookMd.includes('notebookTagSummaryMeta'));
assert.ok(tagNotebookMd.includes('## #风景 (1)'));
assert.ok(tagNotebookMd.includes('> 海风吹拂'));
assert.ok(tagNotebookMd.includes('## untaggedNotes (1)'));
assert.ok(tagNotebookMd.includes('> 灯塔微光'));
assert.ok(fullNotebookMd.includes('心旷神怡'));
assert.ok(fullNotebookMd.includes('#风景'));
assert.ok(fullNotebookMd.includes('## notesBookmarks'));
assert.ok(fullNotebookMd.includes('> 海岸线'));
assert.ok(fullNotebookMd.includes('下次继续'));

const sampleBooklist = [
  { id: 'b1', title: '海边的卡夫卡', author: '村上春树', chapters: [{ title: '第一章' }, { title: '第二章' }] },
  { id: 'b2', title: '人间词话', author: '王国维', chapters: [{ title: '卷上' }] },
  { id: 'b3', title: '瓦尔登湖', author: '梭罗', chapters: [{ title: '经济篇' }] },
];
const sampleState = {
  progress: {
    b1: { percent: 0.45, chapterIndex: 1, completed: false },
    b2: { percent: 1, chapterIndex: 0, completed: true },
  },
  wishlist: ['b3'],
  shelved: [],
  pins: ['b1'],
  reviews: {
    b1: { rating: 5, text: '很深刻的现代小说' },
  },
  userTags: {
    b1: ['文学', '村上'],
  },
  stats: {
    byBook: {
      b1: 3600,
    },
  },
};
const booklistMd = T.booklistMarkdown(sampleBooklist, sampleState, (k) => k);
assert.ok(booklistMd.includes('# brand · booklistTitle'));
assert.ok(booklistMd.includes('📌 **《海边的卡夫卡》** · 村上春树'));
assert.ok(booklistMd.includes('#文学 #村上'));
assert.ok(booklistMd.includes('> 很深刻的现代小说'));
assert.ok(booklistMd.includes('★★★★★'));
assert.ok(booklistMd.includes('finished'));
assert.ok(booklistMd.includes('**《人间词话》** · 王国维'));
assert.ok(booklistMd.includes('**《瓦尔登湖》** · 梭罗'));
assert.ok(booklistMd.includes('— brand'));

const sampleReviewItems = [
  {
    book: { id: 'b1', title: '人间词话', author: '王国维' },
    review: { rating: 5, text: '经典之作，境界说尤为精辟。', updatedAt: 1700000000000 },
  },
  {
    book: { id: 'b2', title: '瓦尔登湖', author: '梭罗' },
    review: { rating: 4, text: '宁静深邃。', updatedAt: 1700500000000 },
  },
];
const reviewsMd = T.reviewsMarkdown(sampleReviewItems, (k) => k);
assert.ok(reviewsMd.includes('# brand · reviewsTab'));
assert.ok(reviewsMd.includes('## 《人间词话》 · 王国维'));
assert.ok(reviewsMd.includes('★★★★★'));
assert.ok(reviewsMd.includes('> 经典之作，境界说尤为精辟。'));
assert.ok(reviewsMd.includes('## 《瓦尔登湖》 · 梭罗'));
assert.ok(reviewsMd.includes('★★★★☆'));
assert.ok(reviewsMd.includes('> 宁静深邃。'));
assert.ok(reviewsMd.includes('— brand'));
const markdown = T.bookNotesMarkdown(
  markdownBook,
  [{ bookId: 'b1', chapterIndex: 0, start: 0, text: '海风', note: '喜欢这句', tags: ['意象'], createdAt: 1 }],
  [{ bookId: 'b1', chapterIndex: 1, page: 3, excerpt: '岸边', note: '在此处停一停', createdAt: 2 }],
  (key) => key,
  { rating: 5, text: '值得重读' },
);
assert.ok(markdown.indexOf('# 海边的书') === 0);
assert.ok(markdown.includes('★★★★★'));
assert.ok(markdown.includes('值得重读'));
assert.ok(markdown.includes('> 海风'));
assert.ok(markdown.includes('**thought**'));
assert.ok(markdown.includes('#意象'));
assert.ok(markdown.includes('## bookmark'));
assert.ok(markdown.includes('> 岸边'));
assert.ok(markdown.includes('在此处停一停'));
const sessions = T.normalizeSessions([
  { id: 's1', bookId: 'local-rjc', startedAt: 1000, endedAt: 3000, seconds: 120, chapterIndex: 1 },
  { id: 's2', bookId: 'missing', startedAt: 1000, endedAt: 2000, seconds: 60, chapterIndex: 0 },
  { id: 's3', bookId: 'local-rjc', startedAt: 5000, endedAt: 4000, seconds: 0, chapterIndex: 0 },
], ['local-rjc']);
assert.equal(sessions.length, 1);
assert.equal(sessions[0].seconds, 120);
assert.equal(sessions[0].chapterIndex, 1);
const reviews = T.normalizeReviews({ b1: { rating: 9, text: ' 很好 ', updatedAt: 10 }, missing: { rating: 4 } }, ['b1']);
assert.equal(reviews.b1.rating, 5);
assert.equal(reviews.b1.text, '很好');
assert.equal(reviews.missing, undefined);
const wishState = T.normalizeState({ customBooks: [rjcBook], wishlist: ['local-rjc', 'local-rjc', 'missing'] });
assert.deepEqual(plain(wishState.wishlist), ['local-rjc']);
const taggedState = T.normalizeState({ customBooks: [rjcBook], userTags: { 'local-rjc': ['待读', '待读', '文学'], missing: ['x'] } });
assert.deepEqual(plain(taggedState.userTags['local-rjc']), ['待读', '文学']);
assert.equal(taggedState.userTags.missing, undefined);
const shelfBooks = [
  { id: 'a', title: 'B 书', author: '甲', addedAt: 1, chapters: [{}, {}] },
  { id: 'b', title: 'A 书', author: '乙', addedAt: 3, chapters: [{}, {}] },
  { id: 'c', title: 'C 书', author: '丙', addedAt: 2, chapters: [{}, {}] },
];
const shelfProgress = { a: { updatedAt: 10, chapterIndex: 0, percent: 0 }, b: { updatedAt: 30, chapterIndex: 0, percent: 0.5 } };
assert.deepEqual(plain(T.sortShelfBooks(shelfBooks, shelfProgress, ['c'], 'recent').map((book) => book.id)), ['c', 'b', 'a']);
assert.deepEqual(plain(T.sortShelfBooks(shelfBooks, shelfProgress, [], 'title').map((book) => book.id)), ['b', 'a', 'c']);
assert.deepEqual(plain(T.sortShelfBooks(shelfBooks, shelfProgress, [], 'progress').map((book) => book.id)), ['b', 'a', 'c']);
assert.deepEqual(plain(T.sortShelfBooks(shelfBooks, shelfProgress, [], 'rating', { a: { rating: 5 }, c: { rating: 3 } }).map((book) => book.id)), ['a', 'c', 'b']);
assert.deepEqual(plain(T.sortShelfBooks([{ id: 'x', chapters: [{ paragraphs: ['短'] }] }, { id: 'y', chapters: [{ paragraphs: ['这篇很长很长很长'] }] }], {}, [], 'words').map((book) => book.id)), ['y', 'x']);
const shelfState = T.normalizeState({ customBooks: [rjcBook], shelfSort: 'title', pins: ['local-rjc', 'local-rjc', 'missing'] });
assert.equal(shelfState.shelfSort, 'title');
assert.equal(T.normalizeState({ shelfView: 'list' }).shelfView, 'list');
assert.equal(T.normalizeState({ shelfView: 'group' }).shelfView, 'group');
assert.equal(T.normalizeState({ shelfView: 'bad' }).shelfView, 'grid');
assert.deepEqual(plain(shelfState.pins), ['local-rjc']);
const librarySearchStub = [
  { id: 'b1', title: '书一', author: '甲', chapters: [{ id: 'c1', title: '第一章', paragraphs: ['海风吹进窗来。'] }] },
  { id: 'b2', title: '书二', author: '乙', chapters: [{ id: 'c2', title: '第二章', paragraphs: ['船靠岸了，海风停了。'] }] },
];
const libraryResults = T.searchLibraryBooks(librarySearchStub, '海风', 6);
assert.equal(libraryResults.length, 2);
assert.equal(libraryResults[0].bookId, 'b1');
assert.equal(libraryResults[1].chapterTitle, '第二章');
assert.equal(T.searchLibraryBooks(librarySearchStub, '不存在', 6).length, 0);
assert.equal(T.nextSleepTimer(0), 15);
assert.equal(T.nextSleepTimer(15), 30);
assert.equal(T.nextSleepTimer(30), 60);
assert.equal(T.nextSleepTimer(60), 0);
const rankingStub = [
  { id: 'a', title: 'A 书', chapters: [{}] },
  { id: 'b', title: 'B 书', chapters: [{}] },
  { id: 'c', title: 'C 书', chapters: [{}] },
];
const tasteBooks = [
  { id: 'a', tags: ['文学', '海'] },
  { id: 'b', tags: ['文学'] },
  { id: 'c', tags: ['科技'] },
];
const tastes = T.tagReadingTotals(tasteBooks, { a: 100, b: 200 }, { b: ['私人'] }, 6);
assert.equal(tastes[0].tag, '文学');
assert.equal(tastes[0].seconds, 300);
assert.equal(tastes.find((item) => item.tag === '私人').seconds, 200);
assert.equal(T.tagReadingTotals(tasteBooks, {}, {}, 6).length, 0);
const ranking = T.bookReadingRanking(rankingStub, { a: 100, b: 300, c: 0 }, 5);
assert.deepEqual(plain(ranking.map((item) => item.book.id)), ['b', 'a']);
assert.equal(ranking[0].seconds, 300);
const lockedAchievements = T.computeAchievements({ totalSeconds: 0, streak: 0, finished: 0, highlightCount: 0 });
assert.equal(lockedAchievements.every((item) => item.unlocked === false), true);
const unlockedAchievements = T.computeAchievements({ totalSeconds: 180000, streak: 7, finished: 5, highlightCount: 10 });
assert.equal(unlockedAchievements.filter((item) => item.unlocked).length, 8);
assert.equal(unlockedAchievements.find((item) => item.id === 'hours10').progress, 1);
const renamed = T.withBookMetadata(epubBook, { title: ' 新书名 ', author: '新作者' });
assert.equal(renamed.title, '新书名');
assert.equal(renamed.author, '新作者');
assert.equal(renamed.cover.glyph, '海');
const generatedCoverBook = Object.assign({}, epubBook, { coverImage: undefined, cover: Object.assign({}, epubBook.cover, { glyph: '海' }) });
const renamedGenerated = T.withBookMetadata(generatedCoverBook, { title: '新书名' });
assert.equal(renamedGenerated.cover.glyph, '新');
assert.equal(T.withBookMetadata(epubBook, { title: '   ' }), epubBook);
const backup = T.makeBackupPayload(normalizedEpub);
assert.equal(backup.__format, 'shiguang-reader-backup');
const restoredBackup = T.parseBackupPayload(JSON.stringify(backup));
assert.equal(restoredBackup.customBooks.length, 1);
assert.equal(restoredBackup.customBooks[0].title, epubBook.title);
assert.throws(() => T.parseBackupPayload('{}'), /backup-invalid/);

await assert.rejects(() => T.parseEpubBook('bad.epub', new Uint8Array([1, 2, 3, 4, 5])), /epub-invalid/);

// Locale coverage for every literal translation key in the UI.
const localeSource = read('source/locale.js');
const zhStart = localeSource.indexOf('const ZH = ');
const enStart = localeSource.indexOf('const EN = ');
const end = localeSource.indexOf('const EMPTY_LOCALE_SNAPSHOT');
const dictSandbox = {};
vm.runInNewContext(localeSource.slice(zhStart, end) + '\n;globalThis.__dicts = { ZH, EN };', dictSandbox);
const { ZH, EN } = dictSandbox.__dicts;
for (const base of ['FirstRead', 'Streak3', 'Streak7', 'Finish1', 'Finish5', 'Notes10', 'Hours10', 'Hours50']) {
  assert.ok('ach' + base + 'Name' in ZH);
  assert.ok('ach' + base + 'Desc' in ZH);
  assert.ok('ach' + base + 'Name' in EN);
  assert.ok('ach' + base + 'Desc' in EN);
}
const used = new Set();
for (const file of ['core.js', 'shelf.js', 'notesview.js', 'reader.js', 'app.js', 'monthlycard.js']) {
  for (const match of read('source/' + file).matchAll(/\bt\('([^']+)'/g)) used.add(match[1]);
}
// Keys picked through a ternary (`t(cond ? 'a' : 'b')`) are invisible to the scan above.
for (const file of ['core.js', 'shelf.js', 'notesview.js', 'reader.js', 'app.js', 'monthlycard.js']) {
  for (const match of read('source/' + file).matchAll(/\bt\([^()]*\?\s*'([^']+)'\s*:\s*'([^']+)'/g)) {
    used.add(match[1]);
    used.add(match[2]);
  }
}
assert.deepEqual([...used].filter((key) => !(key in ZH)), []);
assert.deepEqual([...used].filter((key) => !(key in EN)), []);
assert.ok(zhStart >= 0 && enStart > zhStart && end > enStart);

// CSS structural sanity.
const cssStart = clientSource.indexOf('    const CSS = `');
const cssEnd = clientSource.indexOf('    const ICON_SHAPES', cssStart);
assert.ok(cssStart >= 0 && cssEnd > cssStart);
const css = clientSource.slice(cssStart + '    const CSS = `'.length, clientSource.lastIndexOf('`;', cssEnd));
let depth = 0;
for (const char of css) {
  if (char === '{') depth += 1;
  else if (char === '}') depth -= 1;
  assert.ok(depth >= 0, 'CSS braces do not underflow');
}
assert.equal(depth, 0, 'CSS braces are balanced');
for (const selector of ['.sr-reader', '.sr-columns', '.sr-search-field', '.sr-note-editor', '.sr-drop-overlay', '.sr-page-jump-popover', '.sr-page-jump-input', '.sr-review-card-action', '.sr-color-filter-pill', '.sr-shelf-select', '.sr-bulk-action', '.sr-bulk-done', '.sr-shelf-delete-bar', '.sr-bulk-menu', '.sr-shelf-bulk-tag', '.sr-select-check']) {
  assert.ok(css.includes(selector), 'CSS has ' + selector);
}

console.log('PASS  manifest + icon + locale metadata');
console.log('PASS  client module, slot registration, dictionary registration');
console.log('PASS  import parsing (TXT/MD/EPUB), encoding, state normalization, search, reading math');
console.log('PASS  backup round-trip, translation coverage (' + used.size + ' keys), CSS structure');
// Hundreds of imports must stay incremental: one body written before the next
// file is parsed, with a persistent progress panel instead of a disappearing toast.
assert.match(read('source/app.js'), /function createParsePool/);
assert.match(read('source/head.js'), /PARSE_WORKER_SOURCE/);
assert.match(read('build.mjs'), /self\.onmessage/);
assert.match(read('source/app.js'), /fsRememberSource\(book\.id, file\.name/);
assert.match(read('source/app.js'), /async function importMany/);
assert.match(read('source/app.js'), /fsWriteNewBookBody\(book, \{ skipImages: true \}\)/);
assert.match(read('source/app.js'), /setImportProgress\(null\)/);
assert.match(read('source/fsstore.js'), /function fsForgetSource/);
assert.match(read('source/styles.js'), /\.sr-import-progress\{/);
assert.match(read('source/styles.js'), /\.sr-brand-import-pill\{/);
assert.match(read('source/styles.js'), /\.sr-brand-import-wrap\{/);
assert.match(read('source/app.js'), /sr-brand-import-pill/);
assert.match(read('source/app.js'), /setImportDetailsOpen/);
assert.match(read('source/app.js'), /bookChaptersCache/);
assert.match(read('source/fsstore.js'), /getFileHandle\(fsBodyFileName\(book\)/);

console.log('PASS  readable body files: naming, plain-text round-trip, rename cleanup, legacy JSON');
console.log('PASS  ' + dictionaryRegistrations.length + ' dictionaries registered');
