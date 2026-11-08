import assert from 'node:assert/strict';
import { readFileSync, statSync, existsSync } from 'node:fs';
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
assert.equal(packageJson.name, 'shiguang-reader');
assert.equal(packageJson.license, 'Apache-2.0');
assert.ok(existsSync(new URL('LICENSE', root)));
assert.equal(packageJson.dsh.bundle.patch, './cordis.patch.yml');
assert.equal(packageJson.dsh.client.platform, 'web');
assert.ok(zhMeta.meta.title && zhMeta.meta.description);
assert.ok(enMeta.meta.title && enMeta.meta.description);
assert.ok(statSync(new URL('icon.svg', root)).size < 256 * 1024);
assert.match(read('icon.svg'), /<svg[\s>]/);

let clientSource = read('client.js');
const marker = '    return {\n      inject:';
assert.ok(clientSource.includes(marker), 'plugin export marker is present');
const exposed = '    globalThis.__test = { isEpubBook, isMarkdownBook, bytesToBase64, downscaleCoverDataUrl, makeCoverThumbnail, invertSelectionKeys, pickRandomHighlight, peakWeekday, sortReviewItems, formatClock, formatBookInfo, formatWordCount, buildBookTitlesText, parseImportedBook, parseMarkdownTable, parseMarkdownList, parseMarkdownCallout, renderInline, parseInline, inlineOffsetMap, inlineRawOffset, inlineRenderedOffset, renderInlineRange, selectionHighlightRange, stripHtmlTags, sanitizeReaderHtml, injectHighlightIntoHtml, applyHtmlHighlights, saveState, unwrittenBookIds, restoredBodiesToPersist, parseEpubBook, extractEpubChapter, parseBookBytes, parseBookBytesSafely, bookFileKind, BOOK_FILE_ACCEPT, palmDocDecompress, mobiTrailingSize, parseXmlTree, splitHtmlDocument, normalizeState, defaultState, searchBookChapters, chapterBaseOffsets, weekSeries, weekComparison, weekDeltaLabel, stepIndex, readerKeyAction, stepFontSize, pageWidthPixels, resolveReaderTheme, splitDuplicateImports, importBookSignature, lastReadRelative, stripFsBookBodies, stateForStorage, adoptLibrarySnapshot, orphanBodyIds, deferBodyRemoval, imageParagraph, chapterText, fsRememberSource, fsBase64ToBytes, bookBodyText, parseBookBodyText, chapterIdsOf, markBodiesOnDisk, fsBodyFileName, fsSafeName, fsDeleteBodyFile, fsWriteBookBody, fsWriteNewBookBody, fsReadBookBody, fsDeleteBookBody, fsMigrateBodiesToText, fsLibrarySupported, fsErrorCode, fsChooseDirectory, fsWriteSnapshotNow, mergePins, applyTagToBooks, removeTagFromBooks, removeBooksFromState, toggleId, setBooksFinished, setIdsBulk, recolorHighlights, readingStreak, progressPercent, progressChapter, decodeTextBytes, makeBackupPayload, parseBackupPayload, withBookMetadata, sortShelfBooks, computeAchievements, cleanUserTags, cleanNoteTags, renameBookTagEverywhere, removeBookTagEverywhere, bookTagSummary, matchBookTags, averageDailySeconds, estimateFinish, dayKey, paletteResults, groupNotesByMonth, groupNotesByBook, CommandPalette, sameTagList, renameHighlightTag, removeHighlightTag, applyTagToHighlights, removeTagFromHighlights, highlightSegments, searchTerms, matchAllTerms, translate, fill, normalizeChapterMarks, recordChapterMark, chapterResumePercent, normalizeSessions, normalizeReviews, bookNotesMarkdown, bookFullMarkdown, bookMarkdownFilename, buildReviewText, buildQuoteText, buildCalloutText, selectedAnnotationsMarkdown, notebookMarkdown, notebookByTagMarkdown, booklistMarkdown, reviewsMarkdown, sortNotebookItems, chapterOverview, splitSelectionKeys, ShelfView, StatsView, NotesView, TagManagerDialog, readerLightbox, BookDetail, Reader, PasteImportDialog, QuoteCardDialog, quoteCardText, wrapQuoteText, quoteCardLayout, quoteCardTheme, quoteCardFilename, drawQuoteCard, collectionCardLayout, drawCollectionCard, quoteCollectionFilename, QuoteCollectionDialog, monthlySummary, readingTimeOfDay, monthKeyOf, monthlyCardLayout, drawMonthlyCard, monthlyCardFilename, MonthlyCardDialog, dailyGoalMinutes, todayGoalProgress, remainingReadingMinutes, sessionsForBook, sessionsOnDay, pickDailyQuote, similarBooks, pickRandomBook, resolveContinueBook, groupBooksByStatus, readingReportMarkdown, searchLibraryBooks, bookReadingRanking, tagReadingTotals, nextSleepTimer, readerExcerptAt, recentDays, heatLevel, weekdayTotals, splitSpeechChunks, speechLanguage, speechChunkOffsets, nextSpeechChapter, emitReaderTelemetry, restoreRemovedBooks, undoFinishedBulk, fsHasBookBody, fsCopyBookFromDirectory, fsWriteLibrarySnapshot, effectiveReaderSettings, readerLayoutSignature, readerAnchorPage, readerPageJumpIndex };\n';
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
const hookOverrides = {};
let stateProbe = null;
let effectProbe = null;
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
  // Effects do not run in the smoke renders. A test can set hookOverrides.useEffect
  // to collect them and drive one (a key handler, a timer) by hand, or set
  // effectProbe / stateProbe to seed or watch one useState by its initial value.
  useEffect(fn, deps) {
    if (hookOverrides.useEffect) hookOverrides.useEffect(fn, deps);
    if (effectProbe) effectProbe(fn);
  },
  useLayoutEffect(fn, deps) { if (hookOverrides.useLayoutEffect) hookOverrides.useLayoutEffect(fn, deps); },
  useMemo(fn) { return fn(); },
  useRef(value) { return { current: value }; },
  useState(value) { return (stateProbe && stateProbe(value)) || [value, () => {}]; },
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

// Markdown import parsing: front matter, headings, code blocks, tables, callouts, lists
const mdSample = `---
title: "Markdown 深度解析"
author: "技术专家"
---

# 第一章 Markdown 进阶

这是包含 **加粗文本** 与 *斜体文本* 以及 \`console.log("hello")\` 的段落。

## 代码与公式

下面是一段带有注释的代码块：

\`\`\`javascript
// # 这不是章节标题，是代码注释
function calculateSum(a, b) {
  return a + b;
}
\`\`\`

$$
E = mc^2
$$

> [!NOTE]
> 这是一个测试提示框！

| 语法 | 说明 | 兼容性 |
| :--- | :---: | ---: |
| 表格 | 响应式表格 | 完整 |
| 代码 | 语法代码块 | 完整 |

- [ ] 待办事项
- [x] 已完成事项
- 普通列表项

---

尾部段落。
`;

const mdBook = T.parseImportedBook('guide.md', mdSample);
assert.equal(mdBook.title, 'Markdown 深度解析');
assert.equal(mdBook.author, '技术专家');
assert.equal(mdBook.format, 'markdown');
assert.equal(mdBook.subtitle, 'Markdown');
assert.ok(mdBook.tags.includes('Markdown'));
assert.equal(T.isMarkdownBook(mdBook), true);
assert.equal(mdBook.chapters.length, 1);
assert.equal(mdBook.chapters[0].title, '第一章 Markdown 进阶');

// Verify that the code block was kept intact and did not split on comments
const codePara = mdBook.chapters[0].paragraphs.find(p => p.startsWith('```javascript'));
assert.ok(codePara, 'code block preserved as single paragraph');
assert.ok(codePara.includes('// # 这不是章节标题'), 'code comments preserved without false chapter split');

// Verify table parser helper
const parsedTable = T.parseMarkdownTable('| 标头A | 标头B |\n|:---|---:|\n| 内容1 | 内容2 |');
assert.ok(parsedTable);
assert.equal(parsedTable.headers.length, 2);
assert.equal(parsedTable.headers[0].text, '标头A');
assert.equal(parsedTable.headers[0].align, 'left');
assert.equal(parsedTable.headers[1].align, 'right');
assert.equal(parsedTable.rows.length, 1);
assert.equal(parsedTable.rows[0][0].text, '内容1');

// Verify list parser helper
const parsedList = T.parseMarkdownList('- [ ] 任务一\n- [x] 任务二\n- 普通三');
assert.ok(parsedList);
assert.equal(parsedList.isOrdered, false);
assert.equal(parsedList.hasTask, true);
assert.equal(parsedList.items.length, 3);
assert.equal(parsedList.items[0].isTask, true);
assert.equal(parsedList.items[0].checked, false);
assert.equal(parsedList.items[1].checked, true);
assert.equal(parsedList.items[2].isTask, false);

// Verify callout parser helper
const parsedCallout = T.parseMarkdownCallout('> [!WARNING]\n> 请注意危险操作\n> 请备份数据');
assert.ok(parsedCallout);
assert.equal(parsedCallout.type, 'warning');
assert.equal(parsedCallout.lines.length, 2);
assert.equal(parsedCallout.lines[0], '请注意危险操作');

// Verify inline markdown renderer
const inlineNodes = T.renderInline('前缀 **加粗** 中间 `代码` 后缀 [链接](https://example.com)');
assert.ok(Array.isArray(inlineNodes));
assert.ok(inlineNodes.some(n => n && n.type === 'strong' && n.props && n.props.children === '加粗'));
assert.ok(inlineNodes.some(n => n && n.type === 'code' && n.props && n.props.children === '代码'));
assert.ok(inlineNodes.some(n => n && n.type === 'a' && n.props && n.props.children === '链接'));

// Verify footnote references and anchor link attributes in renderInline
const footnoteNodes = T.renderInline('文本带有脚注[^note1]和内部链接[第一节](#sec1)与相对链接[下一章](ch2.xhtml)');
const fnNode = footnoteNodes.find(n => n && n.type === 'sup');
assert.ok(fnNode, 'footnote reference renders sup tag');
assert.equal(fnNode.props.className, 'sr-footnote-ref');
assert.equal(fnNode.props.children.type, 'a');
assert.equal(fnNode.props.children.props.href, '#fn-note1');
assert.equal(fnNode.props.children.props['epub:type'], 'noteref');
assert.equal(fnNode.props.children.props.role, 'doc-noteref');

const anchorNodes = footnoteNodes.filter(n => n && n.type === 'a');
const internalAnchor = anchorNodes.find(n => n.props.children === '第一节');
assert.ok(internalAnchor, 'internal link is rendered');
assert.equal(internalAnchor.props.href, '#sec1');
assert.equal(internalAnchor.props.target, undefined, 'internal links do not have target _blank');
assert.equal(internalAnchor.props.onClick, undefined, 'links do not swallow clicks with stopPropagation');

const relativeAnchor = anchorNodes.find(n => n.props.children === '下一章');
assert.ok(relativeAnchor, 'relative chapter link is rendered');
assert.equal(relativeAnchor.props.href, 'ch2.xhtml');
assert.equal(relativeAnchor.props.target, undefined, 'relative intra-book links do not have target _blank');

const externalNodes = T.renderInline('[外链](https://example.com)');
const extAnchor = externalNodes.find(n => n && n.type === 'a');
assert.equal(extAnchor.props.target, '_blank', 'external links open in target _blank');
assert.equal(extAnchor.props.rel, 'noopener noreferrer');

// Verify HTML stripping & ruby text handling
const sampleRichHtml = '<p>有<strong>造境</strong>，有<em>写境</em>，此<ruby>理<rt>lǐ</rt>想<rt>xiǎng</rt></ruby>之别。&amp;&nbsp;&lt;&gt;</p>';
const cleanPlain = T.stripHtmlTags(sampleRichHtml);
assert.equal(cleanPlain, '有造境，有写境，此理想之别。& <>');
assert.ok(!cleanPlain.includes('lǐ'), 'ruby annotations stripped from search text');

// Verify tag-safe highlight injection into rich HTML
const htmlHlResult = T.injectHighlightIntoHtml('<p>词以<strong>境界</strong>为最上。</p>', 2, 4, { id: 'hl-test', colorVal: '#ffd54f' });
assert.ok(htmlHlResult.includes('<strong><mark class="sr-hl" data-hl="hl-test"'), 'highlight correctly nested inside strong tag');
assert.ok(htmlHlResult.includes('境界</mark></strong>'), 'closing mark nested before closing strong tag');

// Verify multiple highlights application descending
const multiHl = T.applyHtmlHighlights('<p>词以<strong>境界</strong>为最上。有境界则自成高格。</p>', 0, [
  { id: 'h1', start: 2, end: 4, color: 'amber' },
  { id: 'h2', start: 14, end: 16, color: 'mint' },
]);
assert.ok(multiHl.includes('data-hl="h1"') && multiHl.includes('data-hl="h2"'));

// Regression (BUGFIXES P0-1): paragraph HTML is rebuilt from the allowlist before it
// reaches dangerouslySetInnerHTML — raw tags in TXT/MD, entity-smuggled EPUB tags,
// handlers and javascript: links never survive; allowed markup and text offsets do.
const dirtyHtml = '<p onclick="x()">a<img src=x onerror=alert(1)><svg/onload=alert(2)>b<script>c</script>'
  + '<a href="javascript:alert(3)">d</a><a href="&#106;avascript:alert(4)">e</a><a data-href="x" href="#n1" class="ref">f</a><strong>g</strong></p>';
const cleanHtml = T.sanitizeReaderHtml(dirtyHtml);
assert.doesNotMatch(cleanHtml, /onclick|onerror|onload|<img|<svg|<script|javascript|&#106;/i);
assert.ok(cleanHtml.includes('<a href="#n1" class="ref">f</a>') && cleanHtml.includes('<strong>g</strong>'), cleanHtml);
assert.equal(T.stripHtmlTags(cleanHtml), T.stripHtmlTags(dirtyHtml), 'sanitizing must not shift highlight offsets');
assert.equal(T.sanitizeReaderHtml('<a href="https://x.org/a:b">x</a><a href="mailto:a@b">y</a>'), '<a href="https://x.org/a:b">x</a><a href="mailto:a@b">y</a>');
const hlEscaped = T.injectHighlightIntoHtml('<p>ab</p>', 0, 1, { id: 'x" onmouseover="alert(1)', style: '"><img src=x onerror=1>' });
assert.doesNotMatch(hlEscaped, /" onmouseover=|<img/, 'highlight attributes are escaped');

// Verify footnote and aside HTML stripping
const footnoteText = T.stripHtmlTags('<aside id="fn1" epub:type="footnote"><p><a href="#ref1">1</a> 注释内容。</p></aside>');
assert.equal(footnoteText, '1 注释内容。');

// Verify format preservation in fsBodyFileName
assert.equal(T.fsBodyFileName({ id: 'md1', title: '文档', format: 'markdown' }), '文档--md1.md');
assert.equal(T.fsBodyFileName({ id: 'txt1', title: '小说', format: 'txt' }), '小说--txt1.txt');
assert.equal(T.fsBodyFileName({ id: 'ep1', title: '名著', format: 'epub' }), '名著--ep1.epub');

// Verify isEpubBook and isMarkdownBook format detection
assert.equal(T.isEpubBook({ format: 'epub' }), true);
assert.equal(T.isEpubBook({ tags: ['EPUB'] }), true);
assert.equal(T.isEpubBook({ subtitle: 'EPUB' }), true);
assert.equal(T.isEpubBook({ title: 'novel.epub' }), true);
assert.equal(T.isEpubBook({ format: 'txt' }), false);
assert.equal(T.isEpubBook({ format: 'markdown' }), false);

assert.equal(T.isMarkdownBook({ format: 'markdown' }), true);
assert.equal(T.isMarkdownBook({ tags: ['Markdown'] }), true);
assert.equal(T.isMarkdownBook({ subtitle: 'Markdown' }), true);
assert.equal(T.isMarkdownBook({ title: 'notes.md' }), true);
assert.equal(T.isMarkdownBook({ format: 'epub' }), false);
assert.equal(T.isMarkdownBook({ format: 'txt' }), false);

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
  letterSpacing: 0.02, paragraphSpacing: 0.9, pageWidth: 'comfortable', pageWidthPx: 860,
  immersive: false, layout: 'page', spreadGutter: 'comfortable', spreadRule: true, dockMode: 'auto', readingGuide: 'none',
  marginNotes: false, marginFootnotes: false, chapterRail: false,
  imageLayout: 'inline', imageLayouts: {}, bookSettings: {}, writingMode: 'horizontal', preset: 'classic',
  highlightColor: 'amber', speechRate: 1,
});
const defaultSnapshot = T.defaultState();
const normalizedDefault = T.normalizeState({});
assert.deepEqual(plain(normalizedDefault.settings), plain(defaultSnapshot.settings), 'defaultState and normalizeState defaults agree');
assert.equal(defaultSnapshot.settings.dockMode, 'auto');
assert.equal(defaultSnapshot.settings.spreadGutter, 'comfortable');
assert.equal(defaultSnapshot.settings.spreadRule, true);

const customTypography = T.normalizeState({ settings: { letterSpacing: 1, paragraphSpacing: 0, pageWidth: 'massive', readingRuler: true } });
assert.equal(customTypography.settings.letterSpacing, 0.12);
assert.equal(customTypography.settings.paragraphSpacing, 0.5);
assert.equal(customTypography.settings.readingGuide, 'ruler');
assert.equal(customTypography.settings.pageWidth, 'comfortable');
const customLayout = T.normalizeState({ settings: { layout: 'scroll', immersive: true, chapterOpener: false, focusMode: true, minimalDock: false } });
assert.equal(customLayout.settings.layout, 'scroll');
assert.equal(customLayout.settings.immersive, true);
assert.equal(customLayout.settings.readingGuide, 'focus');
assert.equal(customLayout.settings.dockMode, 'standard');
const customLayout2 = T.normalizeState({ settings: { marginNotes: true, marginFootnotes: true, chapterRail: true, bookCover: false, imageLayout: 'margin', writingMode: 'vertical', preset: 'magazine' } });
assert.equal(customLayout2.settings.marginNotes, true);
assert.equal(customLayout2.settings.marginFootnotes, true);
assert.equal(customLayout2.settings.chapterRail, true);
assert.equal(customLayout2.settings.imageLayout, 'margin');
assert.deepEqual(plain(customLayout2.settings.imageLayouts), {});
const customBookImage = T.normalizeState({ settings: { imageLayouts: { 'local-rjc': 'wide', bad: 'nope' } } });
assert.deepEqual(plain(customBookImage.settings.imageLayouts), { 'local-rjc': 'wide' });
const customBookSettings = T.normalizeState({ settings: { bookSettings: { 'local-rjc': { theme: 'night', fontSize: 22, layout: 'scroll', bogus: 1 } } } });
assert.deepEqual(plain(customBookSettings.settings.bookSettings["local-rjc"]), { theme: 'night', fontSize: 22, layout: 'scroll' });
assert.equal(customLayout2.settings.writingMode, 'vertical');
assert.equal(customLayout2.settings.preset, 'magazine');
assert.equal(T.normalizeState({ settings: { layout: 'bad' } }).settings.layout, 'page');
assert.equal(T.normalizeState({ settings: { focusMode: true } }).settings.readingGuide, 'focus');
assert.equal(T.normalizeState({ settings: { minimalDock: false } }).settings.dockMode, 'standard');

assert.equal(T.normalizeState({ settings: { layout: 'essay' } }).settings.layout, 'spread');
assert.equal(T.normalizeState({ settings: { autoHideChrome: true } }).settings.immersive, true);
assert.equal(T.normalizeState({ settings: { highlightColor: 'sky' } }).settings.highlightColor, 'sky');
assert.equal(T.normalizeState({ settings: { highlightColor: 'bad' } }).settings.highlightColor, 'amber');
assert.equal(T.normalizeState({ settings: { fontFamily: 'kai' } }).settings.fontFamily, 'kai');
assert.equal(T.normalizeState({ settings: { fontFamily: 'bad' } }).settings.fontFamily, 'serif');
assert.equal(T.normalizeState({ settings: { speechRate: 99 } }).settings.speechRate, 2);
assert.equal(T.normalizeState({ settings: { speechRate: -1 } }).settings.speechRate, 0.5);
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
// Latin text breaks at spaces, wrapped lines never start with a space, and a word wider
// than the line still breaks per character instead of looping.
const charWidth = (value) => Array.from(value).length * 10;
assert.deepEqual(plain(T.wrapQuoteText('hello world foo', 60, charWidth)), ['hello', 'world', 'foo']);
assert.deepEqual(plain(T.wrapQuoteText('a bb  cc', 40, charWidth)), ['a bb', 'cc']);
assert.deepEqual(plain(T.wrapQuoteText('abcdefghij', 30, charWidth)), ['abc', 'def', 'ghi', 'j']);
assert.deepEqual(plain(T.wrapQuoteText('ok abcdefghij', 30, charWidth)), ['ok', 'abc', 'def', 'ghi', 'j']);
assert.deepEqual(plain(T.wrapQuoteText('我读JavaScript', 60, charWidth)), ['我读', 'JavaSc', 'ript']);
assert.deepEqual(plain(T.wrapQuoteText('上\n\n下', 60, charWidth)), ['上', '', '下']);
T.wrapQuoteText('word '.repeat(50) + 'x'.repeat(200), 50, charWidth).forEach((line) => {
  assert.ok(charWidth(line) <= 50 && line === line.trim(), 'wrapped line fits and is trimmed: ' + JSON.stringify(line));
});
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
// A quote cut to three lines says so with an ellipsis that still fits the line.
const longMonth = T.monthlyCardLayout({ quote: '海风从窗边吹进来，带着盐的味道。'.repeat(12) }, cardMeasure);
assert.equal(longMonth.quote.lines.length, 3);
assert.ok(longMonth.quote.lines[2].endsWith('…'), 'truncated monthly quote ends with an ellipsis');
assert.ok(cardMeasure(longMonth.quote.lines[2], longMonth.quote.size) <= 1080 - 2 * 96, 'the ellipsis line still fits');
assert.ok(!monthLayout.quote.lines.join('').includes('…'), 'a quote that fits is not marked as cut');
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
assert.equal(typeof found.results[0].wideBefore, 'string');
assert.equal(typeof found.results[0].wideAfter, 'string');

// Round 49: Reader telemetry contract
const telemetryPayload = T.emitReaderTelemetry('render_latency', { durationMs: 14.6, themeId: 'paper', pageCount: 8, ignoreSecret: 'book-title' });
assert.equal(telemetryPayload.event, 'render_latency');
assert.equal(telemetryPayload.durationMs, 15);
assert.equal(telemetryPayload.themeId, 'paper');
assert.equal(telemetryPayload.pageCount, 8);
assert.equal(telemetryPayload.ignoreSecret, undefined);
assert.equal(T.emitReaderTelemetry('unregistered_event', {}), null);

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
// Saved ids only apply while the chapter count still matches; a shifted id would
// put every highlight on the wrong chapter.
assert.deepEqual(plain(T.parseBookBodyText(bodyText, ['only-one'])).map((c) => c.id), ['imp-c1', 'imp-c2']);
// Text before the first heading, CRLF line endings, and empty input.
assert.deepEqual(plain(T.parseBookBodyText('开头一段\r\n\r\n# 一\r\n\r\n正文' )).map((c) => [c.title, c.paragraphs.length]), [['正文', 1], ['一', 1]]);
// Marking a body that is already on disk keeps its chapter ids.
assert.deepEqual(plain(T.markBodiesOnDisk({ customBooks: [{ id: 'b', chaptersInFs: true, chapterIds: ['x', 'y'] }] }, ['b'])).customBooks[0].chapterIds, ['x', 'y']);
assert.deepEqual(plain(T.markBodiesOnDisk({ customBooks: [{ id: 'b', chapters: [{ id: 'c1' }, {}] }] }, ['b'])).customBooks[0].chapterIds, ['c1', 'imp-c2']);
// The host reads the same files: its parser must split them exactly like the reader.
{
  const { parseBodyText: hostParseBodyText } = await import('./hostlib.js');
  const samples = [
    [bodyText, ['epub-c1', 'epub-c2']],
    ['# Intro\n\nSetup:\n\n```bash\n# install deps\n\nnpm i\n```\n\n# Usage\n\nRun it.', ['a', 'b']],
    ['# 数学\n\n$$a+b$$\n\n$$\nx = 1\n\ny = 2\n$$\n\n# 二\n\n完', null],
    ['# 引\n\n<blockquote>\n<p>一</p>\n\n<p>二</p>\n</blockquote>\n\n<pre># not a heading\n\nstill code</pre>\n\n尾', ['x']],
    ['开头一段\r\n\r\n# 一\r\n\r\n正文', null],
  ];
  samples.forEach(function same([text, ids]) {
    assert.deepEqual(plain(hostParseBodyText(text, ids)), plain(T.parseBookBodyText(text, ids)), 'host and client agree on ' + JSON.stringify(text.slice(0, 30)));
  });
}
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
  // Paths whose next createWritable throws, to drive the failure paths.
  const failing = new Set();
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
              text: async () => new TextDecoder().decode(value),
              arrayBuffer: async () => value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength),
            };
          },
          createWritable: async () => {
            if (failing.has(key)) throw named('QuotaExceededError');
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
  return { dir: makeDir(''), files, failing };
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

// Regression (BUGFIXES P1-2): a TXT/Markdown body reads back with the paragraphs it
// was imported with — a paragraph opening with <figure>/<ul> no longer swallows the
// following paragraphs or chapters, so highlight offsets and chapter ids hold.
{
  const { parseBodyText: hostParseBodyText } = await import('./hostlib.js');
  const mdBook = Object.assign(T.parseImportedBook('容器.md', '# 第一章\n\n<figure>\n\n![图](a.png)\n\n</figure>\n\n后面的正文。\n\n<ul> 是无序列表。\n\n# 第二章\n\n内容。'), { id: 'local-md-container' });
  const imported = plain(mdBook.chapters.map((c) => c.paragraphs));
  assert.equal(imported.length, 2);
  assert.equal(await T.fsWriteNewBookBody(mdBook), true);
  const back = plain(await T.fsReadBookBody({ id: mdBook.id, format: mdBook.format, chapterIds: mdBook.chapters.map((c) => c.id) }));
  assert.deepEqual(back.map((c) => c.paragraphs), imported, 'markdown body round-trips paragraph for paragraph');
  const text = T.bookBodyText(mdBook);
  assert.deepEqual(plain(hostParseBodyText(text, null, undefined, { plainParagraphs: true })).map((c) => c.paragraphs), imported, 'host reads it the same way');
  assert.equal(plain(T.parseBookBodyText(text)).length, 1, 'EPUB-style container rule still applies when the format is not plain text');
  assert.equal(await T.fsDeleteBookBody({ id: mdBook.id }), true);
}

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

// Verify EPUB import stores ONLY .epub and NEVER writes .txt
const sampleEpubBytes = new Uint8Array(readFileSync(new URL('tests/sample.epub', root)));
const epubBookSample = {
  id: 'local-epub-pure',
  title: '海风集',
  format: 'epub',
  tags: ['EPUB', '本地导入'],
  chapters: [{ id: 'ep-c1', title: '海风', paragraphs: ['海风从窗边吹进来。'] }],
};
assert.equal(T.fsRememberSource('local-epub-pure', '海风集.epub', sampleEpubBytes), true);
assert.equal(await T.fsWriteNewBookBody(epubBookSample, { skipImages: true }), true);
assert.ok(memory.files.has('books/海风集--local-epub-pure.epub'), 'only .epub source is stored');
assert.equal(memory.files.has('books/海风集--local-epub-pure.txt'), false, 'no .txt file is written for epub import');

// If a stale .txt file previously existed for this book, writing the body cleans it up
memory.files.set('books/海风集--local-epub-pure.txt', 'stale txt content');
assert.equal(T.fsRememberSource('local-epub-pure', '海风集.epub', sampleEpubBytes), true);
assert.equal(await T.fsWriteBookBody(epubBookSample), true);
assert.equal(memory.files.has('books/海风集--local-epub-pure.txt'), false, 'stale txt file is actively removed');
assert.ok(memory.files.has('books/海风集--local-epub-pure.epub'), 'original .epub is kept');

// Orphan cleanup also identifies leftover .txt files for EPUB books as orphans
const epubOrphans = plain(T.orphanBodyIds(['海风集--local-epub-pure.txt', '海风集--local-epub-pure.epub'], [epubBookSample]));
assert.deepEqual(epubOrphans, ['海风集--local-epub-pure.txt'], 'leftover txt for epub book is marked as orphan');

// Reading back the EPUB parses native chapters directly without reading as text
const rereadSampleEpub = plain(await T.fsReadBookBody(epubBookSample));
assert.ok(Array.isArray(rereadSampleEpub) && rereadSampleEpub.length > 0);
assert.equal(rereadSampleEpub[0].paragraphs[0], '海风从窗边吹进来。');

assert.equal(await T.fsDeleteBookBody({ id: 'local-epub-pure' }), true);
assert.equal(memory.files.has('books/海风集--local-epub-pure.epub'), false);

// Deleting a book clears both shapes of its body; orphan cleanup works on names.
assert.equal(await T.fsDeleteBookBody({ id: 'local-t' }), true);
assert.equal(memory.files.has('books/改了名--local-t.txt'), false);
assert.equal(await T.fsDeleteBookBody('local-t'), false, 'nothing left to delete');
assert.equal(await T.fsDeleteBodyFile('旧书--local-old.txt'), true);
assert.equal(await T.fsDeleteBodyFile('not-there.txt'), false);
assert.equal(memory.files.size, 0);

// A text book whose body only lives on disk is metadata only: writing it must not
// replace the real text with an empty file or wipe its pictures.
const diskOnly = {
  id: 'local-disk',
  title: '只在磁盘',
  chapters: [{ id: 'dk-1', title: '第一章', paragraphs: ['盘上的字。', '![图](img-1-1.png)'], images: { 'img-1-1.png': pictureUrl } }],
};
assert.equal(await T.fsWriteBookBody(diskOnly), true);
const diskText = memory.files.get('books/只在磁盘--local-disk.txt');
await assert.rejects(() => T.fsWriteBookBody({ id: 'local-disk', title: '只在磁盘', chaptersInFs: true, chapterIds: ['dk-1'] }));
assert.equal(memory.files.get('books/只在磁盘--local-disk.txt'), diskText, 'the text on disk is untouched');
assert.ok(memory.files.has('books/只在磁盘--local-disk.assets/img-1-1.png'), 'and so are its pictures');
assert.equal(await T.fsHasBookBody({ id: 'local-disk' }), true);
assert.equal(await T.fsHasBookBody({ id: 'local-nowhere' }), false);

// Re-picking a *different* folder carries disk-only bodies over byte for byte.
const otherLibrary = memoryLibrary();
sandbox.window.showDirectoryPicker = async () => otherLibrary.dir;
await T.fsChooseDirectory();
assert.equal(await T.fsHasBookBody({ id: 'local-disk' }), false, 'the new folder does not have it yet');
assert.equal(await T.fsCopyBookFromDirectory(memory.dir, { id: 'local-disk', title: '只在磁盘' }), true);
assert.equal(otherLibrary.files.has('books/只在磁盘--local-disk.txt'), true);
assert.ok(otherLibrary.files.has('books/只在磁盘--local-disk.assets/img-1-1.png'), 'pictures come along');
const copiedBody = plain(await T.fsReadBookBody({ id: 'local-disk', title: '只在磁盘', chapterIds: ['dk-1'] }));
assert.deepEqual(copiedBody[0].paragraphs, ['盘上的字。', '![图](img-1-1.png)']);
assert.equal(copiedBody[0].images['img-1-1.png'], pictureUrl);
assert.equal(await T.fsCopyBookFromDirectory(memory.dir, { id: 'local-nowhere', title: '无' }), false, 'nothing to copy is not a copy');
sandbox.window.showDirectoryPicker = async () => memory.dir;
await T.fsChooseDirectory();
assert.equal(await T.fsDeleteBookBody({ id: 'local-disk' }), true);

// An EPUB book's whole body is its original. A source write that fails, or a save
// with no original at all, must reject — not report success and let the caller
// drop the only copy in memory. A file recognised only by its MIME type counts.
const epubOnly = { id: 'local-epfail', title: '写不进', format: 'epub', chapters: [{ id: 'e-1', title: '一', paragraphs: ['字'] }] };
assert.equal(T.fsRememberSource('local-epfail', 'download', sampleEpubBytes), false, 'no .epub name, no flag');
assert.equal(T.fsRememberSource('local-epfail', 'download', sampleEpubBytes, true), true, 'the detected EPUB flag is enough');
memory.failing.add('books/写不进--local-epfail.epub');
await assert.rejects(() => T.fsWriteNewBookBody(epubOnly, { skipImages: true }), /fs-io/);
assert.equal(memory.files.has('books/写不进--local-epfail.epub'), false, 'the failed write leaves no empty original behind');
await assert.rejects(() => T.fsWriteBookBody(epubOnly), /fs-io/, 'no original queued and none on disk');
memory.failing.clear();
assert.equal(T.fsRememberSource('local-epfail', '写不进.epub', sampleEpubBytes), true);
assert.equal(await T.fsWriteBookBody(epubOnly), true);
assert.equal(await T.fsWriteBookBody(epubOnly), true, 'an original already on disk is a body');
assert.equal(await T.fsDeleteBookBody({ id: 'local-epfail' }), true);

// Legacy JSON next to an EPUB book is dropped without aborting the migration of
// the books after it (the folder handle used to be out of scope there).
memory.files.set('books/local-ejson.json', JSON.stringify({ v: 1, chapters: [] }));
memory.files.set('books/local-tjson.json', JSON.stringify({ v: 1, chapters: [{ id: 'tj-1', title: '旧', paragraphs: ['旧文'] }] }));
const mixedMigration = plain(await T.fsMigrateBodiesToText([
  { id: 'local-ejson', title: '电子书', format: 'epub', chaptersInFs: true },
  { id: 'local-tjson', title: '文本书', chaptersInFs: true },
]));
assert.equal(memory.files.has('books/local-ejson.json'), false);
assert.deepEqual(mixedMigration.map((item) => item.id), ['local-tjson']);
assert.equal(await T.fsDeleteBookBody({ id: 'local-tjson' }), true);
assert.equal(memory.files.size, 0);

// library.json writes coalesce; a caller arriving mid-write gets the outcome of
// the write that carries its payload, and a failed write does not drop the newer
// payload queued behind it.
{
  let snapshotText = '';
  let failNext = 0;
  let release = null;
  const snapshotDir = {
    name: '快照',
    getFileHandle: async () => ({
      createWritable: async () => {
        if (failNext > 0) { failNext -= 1; throw named('QuotaExceededError'); }
        const chunks = [];
        return {
          write: async (chunk) => { chunks.push(chunk); },
          close: async () => {
            if (release) await new Promise((resolve) => { const go = release; release = null; go(resolve); });
            snapshotText = chunks.join('');
          },
        };
      },
    }),
    getDirectoryHandle: async () => snapshotDir,
    queryPermission: async () => 'granted',
    requestPermission: async () => 'granted',
  };
  sandbox.window.showDirectoryPicker = async () => snapshotDir;
  await T.fsChooseDirectory();
  // First write stalls on close; a second payload arrives meanwhile.
  let unblock = null;
  release = (resolve) => { unblock = resolve; };
  const first = T.fsWriteLibrarySnapshot({ v: 'a' });
  await new Promise((resolve) => setImmediate(resolve));
  const second = T.fsWriteLibrarySnapshot({ v: 'b' });
  unblock();
  assert.deepEqual([await first, await second], [true, true]);
  assert.equal(snapshotText, JSON.stringify({ v: 'b' }), 'the newest payload lands');
  // The in-flight write fails; the payload queued behind it is still written.
  failNext = 1;
  const failing = T.fsWriteLibrarySnapshot({ v: 'c' });
  const queued = T.fsWriteLibrarySnapshot({ v: 'd' });
  assert.deepEqual([await failing, await queued], [true, true]);
  assert.equal(snapshotText, JSON.stringify({ v: 'd' }));
  // A failure with nothing behind it is reported to every caller waiting on it.
  failNext = 2;
  const lost = T.fsWriteLibrarySnapshot({ v: 'e' });
  const lostToo = T.fsWriteLibrarySnapshot({ v: 'f' });
  assert.deepEqual([await lost, await lostToo], [false, false]);
  sandbox.window.showDirectoryPicker = async () => memory.dir;
  await T.fsChooseDirectory();
}

// Undo of a delete puts back the removed books and their traces on top of the
// current state, not a stale snapshot of everything.
{
  const before = T.normalizeState({
    customBooks: [
      { id: 'local-ua', title: '甲', chapters: [{ id: 'ua-1', title: '一', paragraphs: ['甲文'] }] },
      { id: 'local-ub', title: '乙', chapters: [{ id: 'ub-1', title: '一', paragraphs: ['乙文'] }] },
    ],
    progress: { 'local-ua': { chapterIndex: 0, percent: 0.3, updatedAt: 1 }, 'local-ub': { chapterIndex: 0, percent: 0.1, updatedAt: 1 } },
    highlights: [{ id: 'h-a', bookId: 'local-ua', chapterId: 'ua-1', start: 0, end: 1, text: '甲', createdAt: 1 }],
    pins: ['local-ua', 'local-ub'],
    lastBookId: 'local-ua',
  });
  const removal = T.removeBooksFromState(before, ['local-ua']);
  assert.deepEqual(plain(removal.removed), ['local-ua']);
  // During the undo window: reading progress on 乙, a new highlight, a new import.
  const during = Object.assign({}, removal.state, {
    customBooks: [{ id: 'local-uc', title: '丙', chapters: [{ id: 'uc-1', title: '一', paragraphs: ['丙文'] }] }].concat(removal.state.customBooks),
    progress: Object.assign({}, removal.state.progress, { 'local-ub': { chapterIndex: 0, percent: 0.8, updatedAt: 2 } }),
    highlights: removal.state.highlights.concat([{ id: 'h-b', bookId: 'local-ub', chapterId: 'ub-1', text: '乙', createdAt: 2 }]),
  });
  const undone = plain(T.restoreRemovedBooks(during, before, removal.removed));
  assert.deepEqual(undone.customBooks.map((book) => book.id), ['local-uc', 'local-ua', 'local-ub']);
  assert.equal(undone.progress['local-ub'].percent, 0.8, 'progress made during the window is kept');
  assert.equal(undone.progress['local-ua'].percent, 0.3, 'the removed book gets its own progress back');
  assert.deepEqual(undone.highlights.map((item) => item.id).sort(), ['h-a', 'h-b']);
  assert.deepEqual(undone.pins, ['local-ua', 'local-ub']);
  assert.equal(undone.lastBookId, 'local-ua');
}

// Undo of a bulk finish touches only the books it flipped, and leaves one alone
// that was marked back to reading by hand in the meantime.
{
  const progressBefore = { 'local-f1': { chapterIndex: 2, percent: 0.4, completed: false, updatedAt: 1 } };
  const finished = T.setBooksFinished(progressBefore, ['local-f1', 'local-f2'], true, 5).progress;
  const touched = Object.assign({}, finished, { 'local-f3': { chapterIndex: 0, percent: 0.2, updatedAt: 6 } });
  const reverted = plain(T.undoFinishedBulk(touched, progressBefore, ['local-f1', 'local-f2'], true));
  assert.deepEqual(reverted['local-f1'], progressBefore['local-f1']);
  assert.equal(reverted['local-f2'], undefined, 'a book with no progress before goes back to none');
  assert.equal(reverted['local-f3'].percent, 0.2, 'unrelated progress stays');
  const reopened = Object.assign({}, finished, { 'local-f2': { chapterIndex: 0, percent: 0, completed: false, updatedAt: 7 } });
  assert.equal(plain(T.undoFinishedBulk(reopened, progressBefore, ['local-f2'], true))['local-f2'].updatedAt, 7);
}

// App-shell wiring that the VM cannot drive end to end.
{
  const appSource = read('source/app.js');
  assert.doesNotMatch(appSource, /currentBookRef/, 'Cmd/Ctrl+O reads a ref that exists');
  assert.match(appSource, /if \(readerRef\.current\) return;/);
  assert.doesNotMatch(appSource, /setState\(previous\)/, 'undo never swaps in a whole stale state');
  assert.match(appSource, /failHandlers\[slot\.workerIndex\]/, 'a timed-out parse worker is replaced');
  assert.match(appSource, /async function ensureLibraryFolder\(\) \{\n\s+if \(fsDirectory\) \{[\s\S]{0,400}await fsEnsureDirectory\(\);/, 'permission is asked while the click is fresh');
  assert.match(appSource, /importingRef\.current = false;[\s\S]{0,300}setPersistTick/, 'the import result is saved once the import ends');
  assert.match(appSource, /\[state, showToast, t, persistTick\]/);
  assert.match(appSource, /const kept = materializeRawImages\(book\);/, 'a failed import write keeps the chapters');
  assert.doesNotMatch(appSource, /hydrateLibraryBodies/, 'export reads bodies itself');
  assert.match(appSource, /chapters: chapters, chaptersInFs: false/, 'the backup carries the folder bodies');
  assert.match(appSource, /fsCopyBookFromDirectory\(oldRoot, book\)/, 're-picking a folder copies disk-only bodies');
}


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

// Regression (BUGFIXES P1-3): a restored backup's bodies are handed to the folder.
{
  const restored = T.parseBackupPayload(JSON.stringify(T.makeBackupPayload(Object.assign(T.defaultState(), {
    customBooks: [
      { id: 'local-r1', title: '恢复一', chaptersInFs: false, chapters: [{ id: 'r1-c1', title: '一', paragraphs: ['正文'] }] },
      { id: 'local-r2', title: '只有元数据', chaptersInFs: true, chapterIds: ['x'] },
    ],
  }))));
  assert.deepEqual(plain(T.restoredBodiesToPersist(restored)).map((b) => b.id), ['local-r1'], 'only books carrying a body are written');
  assert.deepEqual(plain(T.restoredBodiesToPersist(null)), []);
  const restoreSource = read('source/app.js').slice(read('source/app.js').indexOf('async function restoreBackup'));
  assert.match(restoreSource.slice(0, restoreSource.indexOf('setReader(null)')), /setState\(next\);[\s\S]*persistBodies\(restoredBodiesToPersist\(next\)\)/, 'restoreBackup writes restored bodies to the mounted folder');
}
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
assert.equal(T.resolveReaderTheme('candle', false), 'candle');
assert.equal(T.resolveReaderTheme('forest', true), 'forest');
assert.equal(T.resolveReaderTheme('oled', true), 'oled');
assert.equal(T.resolveReaderTheme('eink', false), 'eink');
assert.equal(T.resolveReaderTheme('unknown', true), 'paper');
assert.equal(T.resolveReaderTheme(undefined, true), 'paper');
assert.equal(T.normalizeState({ settings: { theme: 'auto' } }).settings.theme, 'auto');
assert.equal(T.normalizeState({ settings: { theme: 'forest' } }).settings.theme, 'night');
assert.equal(T.normalizeState({ settings: { theme: 'oled' } }).settings.theme, 'night');
assert.equal(T.normalizeState({ settings: { theme: 'mint' } }).settings.theme, 'eink');
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

// Blockquote extraction keeps blockquote and its inner paragraphs intact without orphaned </blockquote>
const bqHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>引言测试</title></head>
<body>
  <p>引言前段落。</p>
  <blockquote class="poetic">
    <p>生如夏花之绚烂，</p>
    <p>死如秋叶之静美。</p>
  </blockquote>
  <p>引言后段落。</p>
</body>
</html>`;
const extractedBq = T.extractEpubChapter(bqHtml, '引言测试');
assert.equal(extractedBq.paragraphs.length, 3, 'blockquote with paragraphs stays together as a single block');
assert.ok(extractedBq.paragraphs[1].startsWith('<blockquote') && extractedBq.paragraphs[1].endsWith('</blockquote>'), 'blockquote contains opening and closing tags');
assert.ok(extractedBq.paragraphs[1].includes('生如夏花之绚烂'), 'inner paragraphs preserved');
assert.ok(!extractedBq.paragraphs.some(p => p.trim() === '</blockquote>'), 'no orphaned </blockquote> paragraph');
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

// Render with one useState seeded/observed by the identity of its initial value.
function renderProbed(component, props, probe, onEffect) {
  stateProbe = probe;
  effectProbe = onEffect || null;
  try { return component(props); } finally { stateProbe = null; effectProbe = null; }
}
const shelfCards = (tree) => collectNodes(tree, []).filter((node) => typeof node.type === 'function' && node.props.book && node.props.onSelect);
const shelfCardIds = (tree) => shelfCards(tree).map((node) => node.props.book.id);
const shelfButton = (tree, name) => collectNodes(tree, []).find((node) => node.type === 'button' && node.props.onClick && node.props.onClick.name === name);
const probeBook = (id, title) => ({ id: id, title: title, author: '作者', source: 'local', tags: [] });

// "Clear thought" in the notebook goes through the prop app.js actually passes.
{
  const updates = [];
  const tree = T.NotesView(Object.assign({}, smokeNotesProps, {
    highlights: [Object.assign({}, smokeState.highlights[0], { note: '想法' })],
    onUpdateHighlight: (id, patch) => updates.push([id, patch]),
  }));
  const clear = shelfButton(tree, 'clearThought');
  assert.ok(clear, 'clear-thought button renders for a note with a thought');
  assert.doesNotThrow(() => clear.props.onClick());
  assert.deepEqual(plain(updates), [['hl-smoke', { note: '' }]]);
}

// Notebook bulk actions only count what the current tab shows: a bookmark picked on the
// bookmarks tab is not exported/copied/deleted from the highlights tab.
{
  const countT = (key) => key + ':{n}';
  const hiddenOnly = T.NotesView(Object.assign({}, smokeNotesProps, { t: countT, initialSelectMode: true, initialSelected: ['b:bm-smoke'] }));
  assert.ok(collectNodes(hiddenOnly, []).some((node) => node.props.children === 'selectedCount:0'), 'hidden picks are not counted');
  assert.equal(shelfButton(hiddenOnly, 'copySelectedNotes').props.disabled, true, 'copy ignores picks from another tab');
  assert.equal(shelfButton(hiddenOnly, 'exportSelected').props.disabled, true, 'export ignores picks from another tab');
  assert.equal(shelfButton(hiddenOnly, 'requestDelete').props.disabled, true, 'delete ignores picks from another tab');
  const mixed = T.NotesView(Object.assign({}, smokeNotesProps, { t: countT, initialSelectMode: true, initialSelected: ['h:hl-smoke', 'b:bm-smoke'] }));
  assert.ok(collectNodes(mixed, []).some((node) => node.props.children === 'selectedCount:1'), 'only the visible pick is counted');
}

// The tag manager owns its Escape (rename -> pending delete -> close); the notebook must
// not add a second document listener that closes the whole dialog in one keypress.
assert.ok(!/function escapeTagManager/.test(read('source/notesview.js')), 'no duplicate tag-manager Escape listener');

// Spaced tags become valid Obsidian hashtags in notebook exports.
{
  const markdown = T.notebookMarkdown([Object.assign({}, smokeState.highlights[0], { tags: ['海 边  风', '夜'] })], [], new Map([[epubBook.id, epubBook]]), smokeT);
  assert.ok(markdown.includes('#海-边-风 #夜'), 'spaces inside a tag are hyphenated');
  const byTag = T.notebookByTagMarkdown([Object.assign({}, smokeState.highlights[0], { tags: ['海 边'] })], new Map([[epubBook.id, epubBook]]), smokeT);
  assert.ok(byTag.includes('## #海-边 (1)'), 'tag headings use the same hashtag form');
}

// Shelf: a status chip and a tag pick narrow together.
{
  const books = [probeBook('sf-1', '甲'), probeBook('sf-2', '乙'), probeBook('sf-3', '丙')];
  const tree = renderProbed(T.ShelfView, Object.assign({}, smokeShelfProps, {
    books: books,
    state: Object.assign({}, smokeState, { shelfView: 'grid', pins: [], shelfSort: 'title', progress: { 'sf-1': { chapterIndex: 0, percent: 0.3, updatedAt: 2 }, 'sf-2': { chapterIndex: 0, percent: 0.3, updatedAt: 1 } } }),
    userTags: { 'sf-1': ['海'], 'sf-3': ['海'] },
    shelfTagFilter: '海',
  }), (value) => (value === 'all' ? ['reading', () => {}] : null));
  assert.deepEqual(shelfCardIds(tree), ['sf-1'], 'reading + #海 shows only books that are both');
}

// Shelf group view: what is drawn is what select-all, invert and shift-ranges act on.
{
  const books = Array.from({ length: 60 }, (_, index) => probeBook('sg-' + String(index).padStart(2, '0'), '书' + String(index).padStart(2, '0')));
  const seed = [];
  const calls = [];
  const tree = renderProbed(T.ShelfView, Object.assign({}, smokeShelfProps, {
    books: books, initialSelectMode: true, initialSelected: seed, userTags: {},
    state: Object.assign({}, smokeState, { shelfView: 'group', pins: [], shelfSort: 'title', progress: {}, wishlist: [], shelved: [] }),
  }), (value) => (value === seed ? [seed, (next) => calls.push(next)] : null));
  const drawn = shelfCardIds(tree);
  assert.equal(drawn.length, 48, 'a big group starts capped');
  assert.ok(collectNodes(tree, []).some((node) => node.type === 'button' && node.props.className && node.props.className.includes('sr-status-more')), 'a capped group offers to show the rest');
  shelfButton(tree, 'selectAll').props.onClick();
  assert.deepEqual(plain(calls.pop()), drawn, 'select-all takes only the drawn books');
  shelfButton(tree, 'invert').props.onClick();
  assert.deepEqual(plain(calls.pop()), drawn, 'invert stays inside the drawn books');
}

// Shift-click ranges follow the order on screen (group view), anchored by book id.
{
  const books = [probeBook('sr-a', 'A'), probeBook('sr-b', 'B'), probeBook('sr-c', 'C')];
  const seed = [];
  const calls = [];
  const tree = renderProbed(T.ShelfView, Object.assign({}, smokeShelfProps, {
    books: books, initialSelectMode: true, initialSelected: seed, userTags: {},
    state: Object.assign({}, smokeState, { shelfView: 'group', pins: [], shelfSort: 'title', progress: { 'sr-c': { chapterIndex: 0, percent: 0.4, updatedAt: 1 } }, wishlist: [], shelved: [] }),
  }), (value) => (value === seed ? [seed, (next) => calls.push(next)] : null));
  const cards = shelfCards(tree);
  assert.deepEqual(cards.map((node) => node.props.book.id), ['sr-c', 'sr-a', 'sr-b'], 'reading group is drawn before unread');
  cards[0].props.onSelect(cards[0].props.book, {});
  cards[1].props.onSelect(cards[1].props.book, { shiftKey: true });
  const range = calls.pop();
  assert.deepEqual(plain(typeof range === 'function' ? range([]) : range), ['sr-c', 'sr-a'], 'range is C..A as drawn, not A..C by sort order');
}

// Shelf select-mode Escape yields to whatever already handled it (inputs, dialogs).
{
  const seed = ['sf-x'];
  const calls = [];
  const effects = [];
  renderProbed(T.ShelfView, Object.assign({}, smokeShelfProps, { initialSelectMode: true, initialSelected: seed }),
    (value) => (value === seed ? [seed, (next) => calls.push(next)] : null),
    (fn) => effects.push(fn));
  const escapeEffect = effects.find((fn) => fn.name === 'escapeSelectMode');
  assert.ok(escapeEffect, 'select mode installs its Escape listener');
  const added = [];
  const originalAdd = sandbox.window.addEventListener;
  sandbox.window.addEventListener = (type, fn) => added.push([type, fn]);
  try { escapeEffect(); } finally { sandbox.window.addEventListener = originalAdd; }
  const onKey = added.find((entry) => entry[0] === 'keydown')[1];
  onKey({ key: 'Escape', defaultPrevented: true, preventDefault() {} });
  assert.equal(calls.length, 0, 'an Escape consumed by an inner layer keeps select mode');
  onKey({ key: 'Escape', defaultPrevented: false, preventDefault() {} });
  assert.deepEqual(plain(calls), [[]], 'a bare Escape leaves select mode');
}

// Homepage polish: the shelf page has exactly one h1 (the hero headline), and a
// brand-new library leads with an import CTA instead of a dead end.
{
  const shelfTree = T.ShelfView(smokeShelfProps);
  assert.equal(collectNodes(shelfTree, []).filter((node) => node.type === 'h1').length, 1, 'the shelf keeps a single h1');

  const emptyState = Object.assign({}, smokeState, {
    customBooks: [], progress: {}, highlights: [], bookmarks: [], reviews: {}, userTags: {},
    wishlist: [], shelved: [], sessions: [], pins: [], lastBookId: null,
    stats: { days: {}, goalMinutes: 180, byBook: {} },
  });
  const emptyTree = T.ShelfView(Object.assign({}, smokeShelfProps, { books: [], state: emptyState, highlights: [], userTags: {} }));
  const emptyNodes = collectNodes(emptyTree, []);
  const heroImport = emptyNodes.find((node) => typeof node.props.className === 'string' && node.props.className.indexOf('sr-firstrun-card') >= 0);
  assert.ok(heroImport && heroImport.type === 'button', 'the first-run hero offers an import card');
  assert.equal(typeof heroImport.props.onClick, 'function', 'the first-run hero card imports on click');
  const emptyPanel = emptyNodes.find((node) => typeof node.type === 'function' && node.props.title === 'emptyShelfTitle');
  assert.ok(emptyPanel, 'the empty shelf uses the first-run title');
  assert.equal(emptyPanel.props.text, 'emptyShelfText', 'the empty shelf explains how to import');
  assert.equal(emptyPanel.props.action, null, 'the hero card is the only first-run import CTA in the content');

  // Parked (shelved) books count under 已搁置, not 在读, in both chips and the filtered grid.
  const parkedBooks = [probeBook('pk-1', '甲'), probeBook('pk-2', '乙')];
  const parkedTree = T.ShelfView(Object.assign({}, smokeShelfProps, {
    books: parkedBooks,
    state: Object.assign({}, smokeState, {
      shelfView: 'grid', pins: [], shelfSort: 'title', wishlist: [], shelved: ['pk-1'],
      progress: {
        'pk-1': { chapterIndex: 0, percent: 0.2, completed: false, updatedAt: 2 },
        'pk-2': { chapterIndex: 0, percent: 0.4, completed: false, updatedAt: 1 },
      },
    }),
    userTags: {},
  }));
  const parkChip = collectNodes(parkedTree, []).filter((node) => node.props.className === 'sr-chip').find((node) => Array.isArray(node.props.children) && node.props.children[0] === 'shelfReading');
  const shelvedChip = collectNodes(parkedTree, []).filter((node) => node.props.className === 'sr-chip').find((node) => Array.isArray(node.props.children) && node.props.children[0] === 'shelfShelved');
  assert.ok(parkChip && shelvedChip, 'both status chips render');
  assert.equal(parkChip.props.children[1].props.children, 1, '在读 excludes parked books');
  assert.equal(shelvedChip.props.children[1].props.children, 1, '已搁置 counts the parked book');
  assert.ok(!emptyNodes.some((node) => typeof node.props.className === 'string' && node.props.className.indexOf('sr-filter-row') >= 0), 'an empty shelf shows no status filters');
  assert.ok(!emptyNodes.some((node) => typeof node.props.className === 'string' && node.props.className.indexOf('sr-shelf-head-tools') >= 0), 'an empty shelf shows no shelf tools');
  assert.equal(collectNodes(emptyTree, []).filter((node) => node.type === 'h1').length, 1, 'the empty shelf keeps a single h1');
}

// Narrowed shelf: the count chip reports visible / total, and a search with no
// book or text match shows one empty state instead of a second "0 matches" panel.
{
  const books = [probeBook('cp-1', '甲'), probeBook('cp-2', '乙')];
  const counted = renderProbed(T.ShelfView, Object.assign({}, smokeShelfProps, {
    books: books,
    state: Object.assign({}, smokeState, { shelfView: 'grid', pins: [], shelfSort: 'title', progress: { 'cp-1': { chapterIndex: 0, percent: 0.3, updatedAt: 2 } } }),
    userTags: {},
  }), (value) => (value === 'all' ? ['reading', () => {}] : null));
  const chip = collectNodes(counted, []).find((node) => typeof node.props.className === 'string' && node.props.className.indexOf('sr-count-chip') >= 0);
  assert.equal(chip.props.children, '1 / 2', 'a filtered shelf reports visible / total');
  const missing = collectNodes(T.ShelfView(Object.assign({}, smokeShelfProps, { query: 'zzz' })), []);
  assert.ok(!missing.some((node) => typeof node.props.className === 'string' && node.props.className.indexOf('sr-content-results') >= 0), 'no empty match panel before any search result exists');
  assert.ok(missing.some((node) => typeof node.type === 'function' && node.props.title === 'noSearchTitle'), 'the single search empty state remains');
}

// Homepage polish lives in the CSS structure too: shared card baselines and a
// stacked shelf header on narrow screens.
assert.match(read('source/styles.js'), /\.sr-book-progress\{margin-top:auto/, 'book progress rows share one baseline');
assert.match(read('source/styles.js'), /\.sr-book-meta\{flex:1;display:flex;flex-direction:column/, 'book meta fills the stretched card');
assert.match(read('source/styles.js'), /@media \(max-width:600px\)\{/, 'small screens stack the shelf header');
assert.match(read('source/styles.js'), /\.sr-book-fill\{display:block/, 'book progress fills render (inline spans had zero width)');
assert.match(read('source/styles.js'), /\.sr-continue-fill\{display:block/, 'the hero continue bar fills too');
assert.ok(!read('source/styles.js').includes('outline: 2.5px solid #2b7fff'), 'focus ring follows the palette, not hardcoded blue');
assert.match(read('source/app.js'), /h\('div', \{ className: 'sr-brand-title' \}/, 'the brand is not a second page-level h1');
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

// Reader renders Markdown books with code containers, tables, callouts, subheadings, task lists
const mdReader = T.Reader(Object.assign({}, smokeReaderProps, { book: mdBook, initialChapterIndex: 0 }));
const allMdNodes = collectNodes(mdReader, []);
assert.ok(allMdNodes.some(n => typeof n.props.className === 'string' && n.props.className.includes('sr-code-container')), 'code block container rendered');
assert.ok(allMdNodes.some(n => typeof n.props.className === 'string' && n.props.className.includes('sr-table-wrap')), 'table wrap rendered');
assert.ok(allMdNodes.some(n => typeof n.props.className === 'string' && n.props.className.includes('sr-callout')), 'callout rendered');
assert.ok(allMdNodes.some(n => typeof n.props.className === 'string' && n.props.className.includes('sr-task-list')), 'task list rendered');
assert.ok(allMdNodes.some(n => typeof n.props.className === 'string' && n.props.className.includes('sr-subheading')), 'subheading rendered');
assert.ok(allMdNodes.some(n => typeof n.props.className === 'string' && n.props.className.includes('sr-divider-wrap')), 'divider rendered');

// Highlights on paragraphs with Markdown syntax. A selection is measured in the
// rendered text (no `**`, `[^n]` shows as `[n]`), stored in raw offsets, and drawn
// back through the same map: the stored words are the visible words and the mark
// wraps exactly them, with no Markdown token cut in half.
{
  const inlineText = (node) => {
    if (node == null || typeof node === 'boolean') return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(inlineText).join('');
    return node.props ? inlineText(node.props.children) : '';
  };
  const mdHlBook = {
    id: 'local-md-hl',
    title: 'MD Highlights',
    format: 'markdown',
    chapters: [{
      id: 'mdhl-1',
      title: '第一章',
      paragraphs: [
        '前言平常的一句话。',
        '开头**加粗词语**中段[^1]注后词语结尾。',
        '## 小节 **重点**标题',
        '[^1]: 脚注正文',
      ],
    }],
  };
  const chapter = mdHlBook.chapters[0];
  const paragraphs = chapter.paragraphs;
  const bases = T.chapterBaseOffsets(chapter).offsets;
  const chapterString = T.chapterText(chapter);
  const bodyMap = T.inlineOffsetMap(paragraphs[1], 0);
  assert.equal(bodyMap.rendered, '开头加粗词语中段[1]注后词语结尾。', 'rendered text drops ** and shows the footnote as [1]');
  const headingMap = T.inlineOffsetMap('小节 **重点**标题', 3);
  const maps = [undefined, bodyMap, headingMap];
  const select = (paragraph, words, map, occurrence = 0) => {
    let at = -1;
    for (let i = 0; i <= occurrence; i += 1) at = map.rendered.indexOf(words, at + 1);
    assert.ok(at >= 0, 'fixture has ' + words);
    return T.selectionHighlightRange(paragraphs, bases, maps, { paragraph, local: at }, { paragraph, local: at + words.length });
  };
  const renderWith = (picked) => {
    const highlight = { id: 'hl-md', bookId: mdHlBook.id, chapterId: chapter.id, chapterIndex: 0, start: picked.start, end: picked.end, text: picked.text, color: 'amber' };
    const tree = T.Reader(Object.assign({}, smokeReaderProps, { book: mdHlBook, initialChapterIndex: 0, highlights: [highlight], chapterMarks: {} }));
    const all = collectNodes(tree, []);
    const marks = all.filter((n) => n.type === 'mark' && n.props['data-hl'] === 'hl-md');
    return { all, marks, para: (i) => all.find((n) => n.props && n.props['data-p'] === i) };
  };

  // 1. Inside a bold span.
  const inBold = select(1, '粗词', bodyMap);
  assert.equal(inBold.text, '粗词', 'stored text is the visible words inside the bold span');
  assert.equal(chapterString.slice(inBold.start, inBold.end), '粗词', 'stored offsets point at the same words in the raw chapter text');
  let view = renderWith(inBold);
  assert.equal(view.marks.length, 1);
  assert.equal(inlineText(view.marks[0]), '粗词', 'the mark wraps exactly the selected words');
  assert.ok(collectNodes(view.marks[0].props.children, []).some((n) => n.type === 'strong'), 'the words stay bold inside the mark');
  assert.equal(inlineText(view.para(1)), bodyMap.rendered, 'the paragraph shows no stray ** after re-rendering');
  assert.equal(collectNodes(view.para(1), []).filter((n) => n.type === 'strong').map(inlineText).join('|'), '加|粗词|语', 'the bold span is split around the mark, not cut open');

  // 2. After a footnote marker.
  const afterNote = select(1, '注后词语', bodyMap);
  assert.equal(afterNote.text, '注后词语', 'stored text after a footnote marker is the visible words');
  assert.equal(chapterString.slice(afterNote.start, afterNote.end), '注后词语', 'raw offsets skip the four-character [^1] marker correctly');
  view = renderWith(afterNote);
  assert.equal(view.marks.length, 1);
  assert.equal(inlineText(view.marks[0]), '注后词语', 'the mark after the footnote wraps exactly those words');
  assert.equal(inlineText(view.para(1)), bodyMap.rendered);
  const noteRefs = collectNodes(view.para(1), []).filter((n) => n.type === 'sup');
  assert.equal(noteRefs.length, 1, 'the footnote reference is still drawn once');
  assert.equal(inlineText(noteRefs[0]), '[1]');

  // 3. Across a bold edge and a footnote: the visible words, never the markers.
  const across = select(1, '词语中段[1]注后', bodyMap);
  assert.equal(across.text, '词语中段[1]注后');
  view = renderWith(across);
  assert.equal(inlineText(view.marks[0]), '词语中段[1]注后');
  assert.equal(inlineText(view.para(1)), bodyMap.rendered, 'a highlight across tokens leaves the paragraph text intact');

  // 4. A ## heading: the prefix is not part of the rendered text.
  const inHeading = select(2, '重点标', headingMap);
  assert.equal(inHeading.text, '重点标');
  view = renderWith(inHeading);
  assert.equal(inlineText(view.marks[0]), '重点标', 'heading highlights land on the words, not shifted by "## "');
  assert.equal(inlineText(view.para(2)), '小节 重点标题');

  // 5. Plain paragraphs keep their positions: the map is the identity there.
  const plainMap = T.inlineOffsetMap(paragraphs[0], 0);
  for (let i = 0; i <= paragraphs[0].length; i += 1) {
    assert.equal(T.inlineRawOffset(plainMap, i), i);
    assert.equal(T.inlineRenderedOffset(plainMap, i), i);
  }
  const plainPick = T.selectionHighlightRange(paragraphs, bases, [], { paragraph: 0, local: 2 }, { paragraph: 0, local: 4 });
  assert.deepEqual(plain(plainPick), { start: 2, end: 4, text: '平常' }, 'a plain paragraph stores the same offsets as before');
  view = renderWith({ start: 2, end: 4, text: '平常' });
  assert.equal(inlineText(view.marks[0]), '平常', 'an existing plain-paragraph highlight draws where it always did');
  const spanning = T.selectionHighlightRange(paragraphs, bases, maps, { paragraph: 0, local: 5 }, { paragraph: 1, local: 2 });
  assert.equal(spanning.text, '一句话。\n开头', 'a selection across paragraphs joins the visible text');
  assert.equal(spanning.start, 5);
  assert.equal(spanning.end, bases[1] + 2);

  // 6. Stored offsets that fall on Markdown markers (old drifted highlights) are
  // pulled to the nearest words instead of cutting a token.
  view = renderWith({ start: bases[1] + 1, end: bases[1] + 3, text: '' });
  assert.equal(inlineText(view.para(1)), bodyMap.rendered, 'a highlight ending inside ** does not leak the markers');
  assert.equal(inlineText(view.marks[0]), '头', 'the mark covers the visible words in that raw range');
  const fnRaw = paragraphs[1].indexOf('[^1]');
  view = renderWith({ start: bases[1] + fnRaw + 1, end: bases[1] + fnRaw + 6, text: '' });
  assert.equal(inlineText(view.marks[0]), '[1]注后', 'a range starting inside [^1] takes the whole footnote reference');
  assert.equal(collectNodes(view.para(1), []).filter((n) => n.type === 'sup').length, 1, 'the footnote reference is never split');
  assert.equal(T.selectionHighlightRange(paragraphs, bases, maps, { paragraph: 1, local: 0 }, { paragraph: 1, local: 0 }), null, 'an empty selection stores nothing');
}

// Reader renders EPUB rich HTML (<pre><code>, <ul>, <ol>, <figure>) natively without illegal <p> wrapping, and long dividers (~, -) as hr
const epubRichBook = {
  id: 'local-epub-rich',
  title: 'EPUB Rich Test',
  format: 'epub',
  subtitle: 'EPUB',
  chapters: [{
    id: 'er-1',
    title: '第一章 丰富排版',
    paragraphs: [
      '<p>正文段落开头。</p>',
      '<blockquote class=\"classic-quote\"><p>昔者庄周梦为胡蝶，栩栩然胡蝶也。</p><p>俄然觉，则蘧蘧然周也。</p></blockquote>',
      '</blockquote>',
      '<pre><code class=\"language-python\">def hello():\n    print(\"Hello world\")</code></pre>',
      '<ul>\n<li>列表项 1</li>\n<li>列表项 2</li>\n</ul>',
      '~~~~~~~~~~~~~~~~~~~~',
      '--------------------',
      '<p>结尾段落。</p>',
    ]
  }]
};
const epubRichReader = T.Reader(Object.assign({}, smokeReaderProps, { book: epubRichBook, initialChapterIndex: 0 }));
const allEpubRichNodes = collectNodes(epubRichReader, []);
assert.ok(allEpubRichNodes.some(n => typeof n.props.className === 'string' && n.props.className.includes('sr-code-container')), 'epub pre code block rendered as code container');
assert.ok(allEpubRichNodes.some(n => typeof n.props.className === 'string' && n.props.className.includes('sr-code-lang') && n.props.children === 'PYTHON'), 'epub code lang PYTHON detected');
assert.ok(allEpubRichNodes.some(n => n && n.type === 'ul'), 'epub ul list rendered natively as ul');
assert.ok(allEpubRichNodes.some(n => n && n.type === 'blockquote' && typeof n.props.className === 'string' && n.props.className.includes('classic-quote')), 'epub blockquote rendered natively with classic-quote class');
assert.ok(!allEpubRichNodes.some(n => n && n.props && (n.props.children === '</blockquote>' || (typeof n.props.children === 'string' && n.props.children.includes('</blockquote>')))), 'orphaned </blockquote> is never rendered as raw text');
const dividerWraps = allEpubRichNodes.filter(n => typeof n.props.className === 'string' && n.props.className.includes('sr-divider-wrap'));
assert.equal(dividerWraps.length, 2, 'both repeated tildes (~~~~) and dashes (----) rendered as dividers, not code blocks');
// Reader regressions. readerEffects renders once and keeps the effects the render
// asked for, so a key handler or a timer can be driven by hand.
function readerEffects(props) {
  const effects = [];
  hookOverrides.useEffect = (fn) => { effects.push(fn); };
  let tree;
  try { tree = T.Reader(props); } finally { delete hookOverrides.useEffect; }
  return { tree, effect(name) { return effects.find((fn) => fn.name === name); } };
}
function readerKeyboard(props) {
  const rendered = readerEffects(props);
  const listeners = {};
  const originalAdd = sandbox.window.addEventListener;
  sandbox.window.addEventListener = (type, fn) => { listeners[type] = fn; };
  try { rendered.effect('keyboard')(); } finally { sandbox.window.addEventListener = originalAdd; }
  rendered.press = (key) => listeners.keydown({ key, target: { tagName: 'DIV' }, preventDefault() {}, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false });
  return rendered;
}
function fakeScroller() {
  return { scrollHeight: 1000, clientHeight: 200, scrollWidth: 300, clientWidth: 300, scrollTop: 0, scrollLeft: 0, scrollBy() {}, querySelector() { return null; } };
}
const columnsOf = (tree) => collectNodes(tree, []).find((node) => typeof node.props.className === 'string' && node.props.className.split(' ').includes('sr-columns'));

// A book's own settings apply when it is reopened, whatever scope the panel starts in.
const overrideSettings = Object.assign({}, smokeState.settings, { fontSize: 19, bookSettings: { [epubBook.id]: { fontSize: 24 } } });
assert.equal(columnsOf(T.Reader(Object.assign({}, smokeReaderProps, { settings: overrideSettings }))).props.style.fontSize, '24px', 'per-book font size is used on reopen');
assert.equal(columnsOf(T.Reader(Object.assign({}, smokeReaderProps, { settings: Object.assign({}, overrideSettings, { bookSettings: {} }) }))).props.style.fontSize, '19px');
assert.equal(T.effectiveReaderSettings(overrideSettings, epubBook.id).fontSize, 24);
assert.equal(T.effectiveReaderSettings(overrideSettings, 'other-book').fontSize, 19);
// Re-pagination (and the progress-saving pause that comes with it) only happens
// when a setting that reflows the text really changes.
const layoutBase = { fontSize: 19, lineHeight: 1.95, fontFamily: 'serif', letterSpacing: 0.02, paragraphSpacing: 0.9, pageWidth: 'comfortable', layout: 'page', imageLayout: 'inline', imageLayouts: {} };
assert.equal(T.readerLayoutSignature(layoutBase, 'b1'), T.readerLayoutSignature(Object.assign({}, layoutBase, { fontSize: 19, theme: 'night' }), 'b1'), 'picking the selected value or a colour does not reflow');
assert.notEqual(T.readerLayoutSignature(layoutBase, 'b1'), T.readerLayoutSignature(Object.assign({}, layoutBase, { fontSize: 20 }), 'b1'));
assert.notEqual(T.readerLayoutSignature(layoutBase, 'b1'), T.readerLayoutSignature(Object.assign({}, layoutBase, { imageLayouts: { b1: 'wide' } }), 'b1'), 'the per-book picture layout reflows');
assert.equal(T.readerLayoutSignature(layoutBase, 'b1'), T.readerLayoutSignature(Object.assign({}, layoutBase, { imageLayouts: { b2: 'wide' } }), 'b1'));

// Same-chapter anchors: the offset inside the columns is already from the chapter
// start, and a two-column "page" is a spread of two columns.
assert.equal(T.readerAnchorPage(3 * 500 + 10, 500, false, 10), 3);
assert.equal(T.readerAnchorPage(3 * 500 + 10, 500, true, 10), 1, 'column 4 sits on the second spread');
assert.equal(T.readerAnchorPage(99999, 500, false, 4), 3, 'clamped to the last page');
// The jump box counts the physical pages the label shows ("7–8 / 20").
assert.equal(T.readerPageJumpIndex(7, true, 20, 10), 3, 'page 7 is on spread 7–8');
assert.equal(T.readerPageJumpIndex(8, true, 20, 10), 3);
assert.equal(T.readerPageJumpIndex(99, true, 20, 10), 9);
assert.equal(T.readerPageJumpIndex(7, false, 1, 20), 6);
assert.equal(T.readerPageJumpIndex(0, false, 1, 20), 0);

// The L shortcut says what it did, and is a quiet change: no "custom" preset.
{
  const updates = [];
  const toasts = [];
  const quietProps = Object.assign({}, smokeReaderProps, { onUpdateSettings: (patch) => updates.push(patch), showToast: (message) => toasts.push(message) });
  readerKeyboard(Object.assign({}, quietProps, { settings: Object.assign({}, smokeState.settings, { readingGuide: 'none' }) })).press('l');
  readerKeyboard(Object.assign({}, quietProps, { settings: Object.assign({}, smokeState.settings, { readingGuide: 'ruler' }) })).press('l');
  assert.deepEqual(plain(updates), [{ readingGuide: 'ruler' }, { readingGuide: 'none' }], 'ruler toggle does not switch the preset to custom');
  assert.deepEqual(toasts, ['rulerOn', 'rulerOff']);
}

// Scroll layout: Home/End and same-chapter links move the scroll position (setPage
// alone does nothing there).
{
  const scrollProps = Object.assign({}, smokeReaderProps, { settings: Object.assign({}, smokeState.settings, { layout: 'scroll', writingMode: 'horizontal' }) });
  const keys = readerKeyboard(scrollProps);
  const scroller = fakeScroller();
  columnsOf(keys.tree).props.ref.current = scroller;
  keys.press('End');
  assert.equal(scroller.scrollTop, 800, 'End goes to the end of the chapter');
  keys.press('Home');
  assert.equal(scroller.scrollTop, 0, 'Home goes back to its start');

  const linkTree = T.Reader(scrollProps);
  const linkScroller = fakeScroller();
  let scrolledIntoView = 0;
  const heading = { tagName: 'H2', id: 'sec-2', className: '', innerText: '第二节', textContent: '第二节', innerHTML: '第二节', getAttribute() { return ''; }, closest() { return heading; }, scrollIntoView() { scrolledIntoView += 1; } };
  linkScroller.querySelector = (selector) => (selector === '#sec-2' ? heading : null);
  linkScroller.contains = (node) => node === heading;
  columnsOf(linkTree).props.ref.current = linkScroller;
  const stage = collectNodes(linkTree, []).find((node) => node.props.onClick && node.props.onClick.name === 'handleStageClick');
  const link = { className: '', textContent: '第二节', getAttribute(name) { return name === 'href' ? '#sec-2' : ''; }, closest() { return null; } };
  // No window.CSS in the sandbox: the escape fallback is what runs here. (A bare
  // CSS.escape would hit the stylesheet string and the lookup would fail.)
  stage.props.onClick({ target: { closest(selector) { return selector === 'a' ? link : null; } }, preventDefault() {}, stopPropagation() {} });
  assert.equal(scrolledIntoView, 1, 'an in-chapter link scrolls to its target in the scroll layout');
}

// The eye-care reminder keeps its own minute counter: the session still reports
// every second read.
{
  const ContextDate = vm.runInContext('Date', sandbox);
  const realNow = ContextDate.now;
  let fakeNow = 1700000000000;
  const intervals = [];
  const fakeSetInterval = (fn) => { intervals.push(fn); return intervals.length; };
  const sessions = [];
  const toasts = [];
  ContextDate.now = () => fakeNow;
  sandbox.setInterval = fakeSetInterval;
  sandbox.clearInterval = smokeNoop;
  sandbox.window.setInterval = fakeSetInterval;
  sandbox.window.clearInterval = smokeNoop;
  try {
    const rendered = readerEffects(Object.assign({}, smokeReaderProps, { onSessionEnd: (session) => sessions.push(session), showToast: (message) => toasts.push(message) }));
    const stopReading = rendered.effect('trackReadingTime')();
    rendered.effect('eyeCareTimer')();
    const readingTick = intervals[0];
    const eyeCareTick = intervals[1];
    for (let minute = 1; minute <= 30; minute += 1) {
      fakeNow += 60000;
      readingTick();
      eyeCareTick();
    }
    stopReading();
  } finally {
    ContextDate.now = realNow;
    delete sandbox.setInterval;
    delete sandbox.clearInterval;
    delete sandbox.window.setInterval;
    delete sandbox.window.clearInterval;
  }
  assert.deepEqual(toasts, ['eyeCareReminderHint'], 'the 30-minute reminder fires once');
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].seconds, 1800, 'the reminder does not overwrite the session seconds');
}

assert.ok(!/color-mix\(in sr,/.test(read('source/styles.js')), 'color-mix uses a real colour space (srgb), not "sr"');

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
// A key defined twice in one dictionary silently loses its first copy; keep each key unique.
for (const [name, block] of [['ZH', localeSource.slice(zhStart, enStart)], ['EN', localeSource.slice(enStart, end)]]) {
  const seenKeys = new Set();
  const dupes = [];
  for (const match of block.matchAll(/^ {6}([A-Za-z0-9_]+):/gm)) {
    if (seenKeys.has(match[1])) dupes.push(match[1]);
    seenKeys.add(match[1]);
  }
  assert.deepEqual(dupes, [], name + ' has no duplicate keys');
}
for (const key of ['bulkTagAdded', 'bulkTagPartial', 'bulkTagExisting', 'bulkTagRemoved', 'bulkTagNoSuch']) {
  assert.ok(ZH[key].includes('{tag}') && EN[key].includes('{tag}'), key + ' names the tag in both languages');
}

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
for (const selector of ['.sr-reader', '.sr-columns', '.sr-search-field', '.sr-note-editor', '.sr-drop-overlay', '.sr-page-jump-popover', '.sr-page-jump-input', '.sr-review-card-action', '.sr-color-filter-pill', '.sr-shelf-select', '.sr-bulk-action', '.sr-bulk-done', '.sr-shelf-delete-bar', '.sr-bulk-menu', '.sr-shelf-bulk-tag', '.sr-select-check', '.sr-sheet', '.sr-footnote-popover', '.sr-reading-ruler', '.sr-aside-note']) {
  assert.ok(css.includes(selector), 'CSS has ' + selector);
}
assert.ok(css.includes('.sr-sheet{') && css.includes('transform:translateX(-50%)'), 'settings sheet must stay centered horizontally');

// Host and shelf theme isolation: reader themes must never override host frame, centerCol or shelf backgrounds
assert.ok(!css.includes('_centerCol"]:has(.sr-reader[data-theme='), 'host centerCol must not be overridden by reader theme background');
assert.ok(!css.includes('.sr-app:has(.sr-reader[data-theme='), 'sr-app root must not have background forced by reader theme');
assert.ok(!css.includes('_frame"]:has(.sr-reader){\n  background:'), 'host frame must not have background overridden by reader');
assert.ok(!clientSource.includes('centerCol.style.setProperty(\'background\''), 'reader must not set inline background on host centerCol');
assert.ok(!clientSource.includes('app.style.setProperty(\'background\''), 'reader must not set inline background on sr-app');

assert.ok(css.includes('.sr-reader[data-page-width="wide"] .sr-stage{max-width:1120px;}'), 'wide page width rule');
assert.ok(css.includes('.sr-reader[data-page-width="full"] .sr-stage{max-width:none;width:100%;}'), 'full page width rule');
assert.ok(css.includes('.sr-reader[data-layout="spread"] .sr-columns{column-fill:balance;}'), 'spread balances columns');
assert.ok(css.includes('.sr-stage[data-mode="scroll"] .sr-columns{'), 'scroll-only column rule keeps its prefix');
assert.equal(T.normalizeState({ settings: { pageWidth: 'full' } }).settings.pageWidth, 'full');
assert.equal(T.normalizeState({ settings: { pageWidth: 'custom', pageWidthPx: 1234 } }).settings.pageWidth, 'custom');
assert.equal(T.normalizeState({ settings: { pageWidth: 'custom', pageWidthPx: 1234 } }).settings.pageWidthPx, 1234);
assert.equal(T.normalizeState({ settings: { pageWidthPx: 9999 } }).settings.pageWidthPx, 1600);
assert.equal(T.pageWidthPixels('wide'), 1120);
assert.equal(T.pageWidthPixels('full'), 1180);
assert.equal(T.pageWidthPixels('custom', 1234), 1234);
assert.equal(T.pageWidthPixels('custom', 9999), 1600);
assert.match(read('source/reader.js'), /pageWidthPx: 1120/);
assert.match(read('source/reader.js'), /pageWidthPx: 860/);
assert.ok(!css.includes('.sr-font-quick{'), 'dead font quick CSS is removed');
assert.ok(!css.includes('.sr-layout-preview-card{'), 'dead layout preview CSS is removed');
assert.ok(!css.includes('.sr-layout-more{'), 'dead more-layout CSS is removed');
assert.ok(!css.includes('.sr-reader-time{'), 'dead reader time CSS is removed');
assert.ok(!css.includes('.sr-layout-inline-row{'), 'dead layout inline CSS is removed');
assert.ok(!css.includes('.sr-font-anchor'), 'dead font anchor CSS is removed');
assert.ok(css.includes('.sr-reading-ruler{'), 'reading ruler CSS is preserved');
assert.ok(css.includes('.sr-reader[data-page-width="full"][data-has-images="false"] .sr-stage{max-width:min(1180px,100%);}'), 'full text width cap');
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
// Only an EPUB can defer its pictures (its original is kept); other formats write them now.
assert.match(read('source/app.js'), /fsWriteNewBookBody\(book, \{ skipImages: isEpubBook\(book\) \}\)/);
assert.match(read('source/app.js'), /setImportProgress\(null\)/);
assert.match(read('source/fsstore.js'), /function fsForgetSource/);
assert.match(read('source/styles.js'), /\.sr-import-progress\{/);
assert.match(read('source/styles.js'), /\.sr-brand-import-pill\{/);
assert.match(read('source/styles.js'), /\.sr-brand-import-wrap\{/);
assert.match(read('source/app.js'), /sr-brand-import-pill/);
assert.match(read('source/app.js'), /setImportDetailsOpen/);
assert.match(read('source/app.js'), /bookChaptersCache/);
assert.match(read('source/fsstore.js'), /getFileHandle\(fsBodyFileName\(book\)/);

// ---- Regression tests: import / storage / export audit fixes ----

// A stored ZIP (no compression) is enough for EPUB fixtures built right here.
function storedZip(files) {
  const enc = new TextEncoder();
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const [name, content] of files) {
    const nameBytes = enc.encode(name);
    const data = typeof content === 'string' ? enc.encode(content) : content;
    const local = new Uint8Array(30 + nameBytes.length + data.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    local.set(data, 30 + nameBytes.length);
    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const centralSize = centrals.reduce((n, c) => n + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  const out = new Uint8Array(offset + centralSize + 22);
  let at = 0;
  for (const part of [...locals, ...centrals, end]) { out.set(part, at); at += part.length; }
  return out;
}
function makeTestEpub({ chapters, nav, ncx, hrefOf = (i) => 'c' + i + '.xhtml' }) {
  const manifest = [];
  const spine = [];
  const files = [
    ['mimetype', 'application/epub+zip'],
    ['META-INF/container.xml', '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'],
  ];
  chapters.forEach((html, i) => {
    manifest.push('<item id="c' + i + '" href="' + hrefOf(i) + '" media-type="application/xhtml+xml"/>');
    spine.push('<itemref idref="c' + i + '"/>');
    files.push(['OEBPS/c' + i + '.xhtml', html]);
  });
  if (nav) { manifest.push('<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>'); files.push(['OEBPS/nav.xhtml', nav]); }
  if (ncx) { manifest.push('<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>'); files.push(['OEBPS/toc.ncx', ncx]); }
  files.push(['OEBPS/content.opf', '<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>测试</dc:title><dc:creator>作者</dc:creator></metadata><manifest>' + manifest.join('') + '</manifest><spine>' + spine.join('') + '</spine></package>']);
  return storedZip(files);
}
const testPage = (i) => '<html><body><h2>Heading ' + i + '</h2><p>Body ' + i + '.</p></body></html>';

// Per-chapter resume marks of a disk-backed book survive a reload: the stored
// metadata has no chapters, only `chapterIds`.
{
  const reloaded = T.normalizeState({
    customBooks: [{ id: 'local-fsmarks', title: '磁盘书', chaptersInFs: true, chapterIds: ['epub-c1', 'epub-c2'] }],
    progress: { 'local-fsmarks': { chapterIndex: 1, percent: 0.5, chapterMarks: { 'epub-c1': 1, 'epub-c2': 0.42, ghost: 0.3 } } },
  });
  assert.deepEqual(plain(reloaded.progress['local-fsmarks'].chapterMarks), { 'epub-c1': 1, 'epub-c2': 0.42 }, 'disk-backed chapter marks survive reload');
}

// Chapter counts are not capped at import (TXT and EPUB).
{
  const longTxt = Array.from({ length: 400 }, (_, i) => '第' + (i + 1) + '章 标题\n\n这一章的正文。').join('\n\n');
  assert.equal(T.parseImportedBook('长篇.txt', longTxt).chapters.length, 400, 'TXT import keeps every chapter');
  const manyEpub = await T.parseEpubBook('many.epub', makeTestEpub({ chapters: Array.from({ length: 330 }, (_, i) => testPage(i)) }));
  assert.equal(manyEpub.chapters.length, 330, 'EPUB import keeps every chapter');
}

// A lone leading `# Title` and `# comment` lines inside fenced code do not stop
// `##` headings from being the chapter breaks.
{
  const md = T.parseImportedBook('book.md', '# My Book\n\nIntro text here.\n\n## Chapter One\n\nOne.\n\n```sh\n# a shell comment\necho hi\n```\n\n## Chapter Two\n\nTwo.');
  assert.deepEqual(plain(md.chapters.map((c) => c.title)), ['正文', 'Chapter One', 'Chapter Two']);
  assert.ok(md.chapters[1].paragraphs.includes('```sh\n# a shell comment\necho hi\n```'));
  assert.ok(!md.chapters.some((c) => c.paragraphs.includes('# My Book')), 'the title line is not body text');
  const fenced = T.parseImportedBook('notes.md', 'Intro.\n\n## Part A\n\nA.\n\n```\n# not a chapter\n```\n\n## Part B\n\nB.');
  assert.deepEqual(plain(fenced.chapters.map((c) => c.title)), ['正文', 'Part A', 'Part B']);
  // Two real H1 chapters still win over `##`.
  const h1Book = T.parseImportedBook('h1.md', '# 第一章 甲\n\n甲文。\n\n## 小节\n\n小节文。\n\n# 第二章 乙\n\n乙文。');
  assert.deepEqual(plain(h1Book.chapters.map((c) => c.title)), ['第一章 甲', '第二章 乙']);
}

// A self-closed `$$a+b$$` line is one block, not the start of a block that
// swallows the rest of the file.
{
  const md = T.parseImportedBook('math.md', '## 一\n\n$$a+b$$\n\n之后的段落。\n\n## 二\n\n第二章。');
  assert.equal(md.chapters.length, 2);
  assert.deepEqual(plain(md.chapters[0].paragraphs), ['$$a+b$$', '之后的段落。']);
  const multi = T.parseImportedBook('math2.md', '## 一\n\n$$\na+b\n\n= c\n$$\n\n之后。');
  assert.deepEqual(plain(multi.chapters[0].paragraphs), ['$$\na+b\n\n= c\n$$', '之后。']);
  const txt = T.parseImportedBook('math.txt', '第一章 甲\n\n$$x$$\n\n甲文。\n\n第二章 乙\n\n乙文。');
  assert.equal(txt.chapters.length, 2, 'TXT is not swallowed either');
}

// EPUB nav: `#fragment` entries do not rename their file's chapter after the last
// subsection; NCX: nested navPoints keep their first child.
{
  const nav = '<html xmlns:epub="http://www.idpf.org/2007/ops"><body><nav epub:type="toc"><ol><li><a href="c0.xhtml">第一章 正题</a><ol><li><a href="c0.xhtml#s1">一、小节</a></li><li><a href="c0.xhtml#s2">二、小节</a></li></ol></li><li><a href="c1.xhtml">第二章</a></li></ol></nav></body></html>';
  const navBook = await T.parseEpubBook('nav.epub', makeTestEpub({ chapters: [testPage(0), testPage(1)], nav }));
  assert.deepEqual(plain(navBook.chapters.map((c) => c.title)), ['第一章 正题', '第二章']);
  const ncx = '<ncx><navMap><navPoint id="p1"><navLabel><text>第一卷</text></navLabel><content src="c0.xhtml"/><navPoint id="p1a"><navLabel><text>第一章 甲</text></navLabel><content src="c1.xhtml"/></navPoint><navPoint id="p1b"><navLabel><text>第二章 乙</text></navLabel><content src="c2.xhtml"/></navPoint></navPoint><navPoint id="p2"><navLabel><text>第三章</text></navLabel><content src="c3.xhtml"/><navPoint id="p2a"><navLabel><text>第三章 一节</text></navLabel><content src="c3.xhtml#s1"/></navPoint></navPoint></navMap></ncx>';
  const ncxNested = await T.parseEpubBook('ncx.epub', makeTestEpub({ chapters: [testPage(0), testPage(1), testPage(2), testPage(3)], ncx }));
  assert.deepEqual(plain(ncxNested.chapters.map((c) => c.title)), ['第一卷', '第一章 甲', '第二章 乙', '第三章']);
  // An absolute `/OEBPS/…` href is relative to the archive root, not the OPF folder.
  const absBook = await T.parseEpubBook('abs.epub', makeTestEpub({ chapters: [testPage(0), testPage(1)], hrefOf: (i) => '/OEBPS/c' + i + '.xhtml' }));
  assert.deepEqual(plain(absBook.chapters.map((c) => c.title)), ['Heading 0', 'Heading 1']);
  // `</h1 >` closes a heading; a bogus `</h*>` does not.
  assert.equal(T.extractEpubChapter('<html><body><h1>标题</h1 ><p>正文。</p></body></html>', '备用').title, '标题');
}

// Books kept in browser storage keep their pictures and chapter paths on reload.
{
  const pic = 'data:image/png;base64,iVBORw0KGgo=';
  const reloaded = T.normalizeState({
    customBooks: [{
      id: 'local-pics', title: '插图书', format: 'epub',
      chapters: [{ id: 'epub-c1', title: '一', paragraphs: ['![](img-1-1.png)', '正文。'], images: { 'img-1-1.png': pic, bad: 42 }, href: 'Text/c1.xhtml', path: 'OEBPS/Text/c1.xhtml' }],
    }],
  });
  const chapter = reloaded.customBooks[0].chapters[0];
  assert.deepEqual(plain(chapter.images), { 'img-1-1.png': pic });
  assert.equal(chapter.href, 'Text/c1.xhtml');
  assert.equal(chapter.path, 'OEBPS/Text/c1.xhtml');
}

// Paragraphs that hold blank lines (fenced code, display math, EPUB <pre>/<blockquote>)
// round-trip through the body text file as one paragraph each.
{
  const book = {
    id: 'local-code',
    title: '代码书',
    chapters: [
      { id: 'c-a', title: '一', paragraphs: ['开头。', '```sh\n# comment\n\necho hi\n```', '$$\na\n\nb\n$$', '$$x$$', '中间。'] },
      { id: 'c-b', title: '二', paragraphs: ['<pre>x = 1\n\n# not a heading\ny</pre>', '<blockquote><p>q1</p>\n\n<p>q2</p></blockquote>', '<ul><li>a<ul><li>b</li></ul>\n\n</li></ul>', '结尾。'] },
    ],
  };
  const text = T.bookBodyText(book);
  const back = plain(T.parseBookBodyText(text, ['c-a', 'c-b']));
  assert.deepEqual(back, plain(book.chapters), 'paragraph boundaries survive the text file');
  // A plain mention of a tag mid-paragraph does not open a container.
  assert.deepEqual(plain(T.parseBookBodyText('# 一\n\n用 <pre> 标签。\n\n下一段。')[0].paragraphs), ['用 <pre> 标签。', '下一段。']);
}

// Day differences use calendar days: across spring-forward the two midnights are
// 23 hours apart, and yesterday must not read as today.
{
  const savedTz = process.env.TZ;
  process.env.TZ = 'America/New_York';
  try {
    const before = new Date(2026, 2, 7, 12, 0, 0).getTime();
    const after = new Date(2026, 2, 8, 12, 0, 0).getTime();
    assert.deepEqual(plain(T.lastReadRelative(before, after)), { key: 'lastReadYesterday', n: 1 });
    assert.deepEqual(plain(T.lastReadRelative(new Date(2026, 2, 5, 12).getTime(), new Date(2026, 2, 9, 12).getTime())), { key: 'lastReadDaysAgo', n: 4 });
  } finally {
    if (savedTz === undefined) delete process.env.TZ;
    else process.env.TZ = savedTz;
  }
}

// The removed 'night' layout preset reads as a custom combination.
assert.equal(T.normalizeState({ settings: { preset: 'night', theme: 'night' } }).settings.preset, 'custom');
assert.equal(T.normalizeState({ settings: { preset: 'magazine' } }).settings.preset, 'magazine');
assert.equal(T.normalizeState({ settings: { preset: 'bogus' } }).settings.preset, 'classic');

// Markdown export: multi-line reviews stay quoted, tags with spaces stay one hashtag.
{
  const md = T.booklistMarkdown(
    [{ id: 'bx', title: '书', author: '人', chapters: [{ title: '一' }] }],
    { progress: {}, reviews: { bx: { rating: 4, text: '第一行\n第二行' } }, userTags: { bx: ['science fiction', '经典'] } },
    (k) => k,
  );
  assert.ok(md.includes('  > 第一行\n  > 第二行'), 'every review line is quoted');
  assert.ok(md.includes('#science-fiction #经典'), 'spaces in tags become dashes');
  const note = { id: 'h-x', bookId: 'bx', chapterIndex: 0, start: 0, text: '一句', tags: ['science  fiction'], createdAt: Date.now() };
  const notesMd = T.bookNotesMarkdown({ id: 'bx', title: '书', author: '人', chapters: [{ title: '一' }] }, [note], [], (k) => k);
  assert.ok(notesMd.includes('#science-fiction'));
  const selMd = T.selectedAnnotationsMarkdown(['h:h-x'], [note], [], [{ id: 'bx', title: '书', author: '人', chapters: [{ title: '一' }] }], (k) => k);
  assert.ok(selMd.includes('#science-fiction'));
}
console.log('PASS  audit regressions: chapter marks, caps, md headings, math, nav titles, stored images, body round-trip, DST, presets, export');


// ---------------------------------------------------------------------------
// More book formats: MOBI / AZW3 and FB2 / FBZ.
// ---------------------------------------------------------------------------
{
  const enc = (text) => new TextEncoder().encode(text);
  const same = (actual, expected, message) => assert.deepEqual(plain(actual), plain(expected), message);
  const dotPng = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64'));
  const dotB64 = Buffer.from(dotPng).toString('base64');
  const shape = (book) => book.chapters.map((c) => c.title);
  const imagesOf = (book) => book.chapters.flatMap((c) => Object.keys(c.images || {}));

  // Detection by name and type; the picker offers every new extension.
  assert.equal(T.bookFileKind('a.EPUB'), 'epub');
  assert.equal(T.bookFileKind('a.fb2'), 'fb2');
  assert.equal(T.bookFileKind('a.fb2.zip'), 'fbz');
  assert.equal(T.bookFileKind('a.fbz'), 'fbz');
  assert.equal(T.bookFileKind('a.zip'), '', 'a plain zip is not a book');
  assert.equal(T.bookFileKind('a.azw3'), 'mobi');
  assert.equal(T.bookFileKind('a.azw'), 'mobi');
  assert.equal(T.bookFileKind('a.mobi'), 'mobi');
  assert.equal(T.bookFileKind('a.prc'), 'mobi');
  assert.equal(T.bookFileKind('a.md'), 'text');
  assert.equal(T.bookFileKind('download', 'text/plain'), 'text');
  // Not supported: PDF, Word, HTML, RTF — and their text/* types must not import as plain text.
  ['a.pdf', 'a.docx', 'a.doc', 'a.html', 'a.htm', 'a.xhtml', 'a.htmlz', 'a.rtf'].forEach((name) => {
    assert.equal(T.bookFileKind(name, ''), '', name + ' is not supported');
  });
  assert.equal(T.bookFileKind('a.html', 'text/html'), '');
  assert.equal(T.bookFileKind('download', 'text/html'), '', 'text/html is not plain text');
  assert.equal(T.bookFileKind('download', 'text/rtf'), '', 'text/rtf is not plain text');
  ['.fb2', '.fbz', '.mobi', '.azw', '.azw3', '.prc', '.epub', '.txt', '.md'].forEach((ext) => {
    assert.ok(T.BOOK_FILE_ACCEPT.split(',').includes(ext), 'picker accepts ' + ext);
  });
  ['pdf', 'docx', 'html', 'rtf', 'htmlz'].forEach((ext) => {
    assert.ok(!T.BOOK_FILE_ACCEPT.includes(ext), 'picker does not offer ' + ext);
  });
  for (const kind of ['docx', 'html', 'htmlz', 'rtf']) {
    await assert.rejects(() => T.parseBookBytes(kind, 'a.' + kind, new Uint8Array([1])), /wrong-type/, kind + ' has no parser');
  }
  await assert.rejects(() => T.parseBookBytes('', 'a.pdf', new Uint8Array([1])), /wrong-type/);

  // XML reader: prefixes, CDATA, entities, self-closing, stray close tags.
  const tree = T.parseXmlTree('<?xml version="1.0"?><w:doc a="1"><w:p>x &amp; <![CDATA[<y>]]></w:p><br/></bad><w:p>z</w:p></w:doc>');
  const doc = tree.children[0];
  assert.equal(doc.name, 'w:doc');
  assert.equal(doc.local, 'doc');
  assert.equal(doc.attrs.a, '1');
  same(doc.children.map((c) => c.local), ['p', 'br', 'p']);
  assert.equal(doc.children[0].children.map((c) => c.text).join(''), 'x & <y>');

  // ---- FB2: nested sections, notes, inline binary picture, cover, CP1251 ----
  const fb2 = `<?xml version="1.0" encoding="utf-8"?>
<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0" xmlns:l="http://www.w3.org/1999/xlink">
<description><title-info><author><first-name>雾</first-name><last-name>林</last-name></author><book-title>灯塔手记</book-title>
<coverpage><image l:href="#cover.png"/></coverpage></title-info></description>
<body><title><p>灯塔手记</p></title>
<section><title><p>第一部</p></title>
  <section id="ch1"><title><p>第一章 起风</p></title>
    <epigraph><p>风从海上来。</p><text-author>佚名</text-author></epigraph>
    <p>海边的<emphasis>风</emphasis>很大<a l:href="#n1" type="note">[1]</a>。</p>
    <image l:href="#pic.png"/>
    <poem><stanza><v>一行</v><v>二行</v></stanza></poem>
    <p>见 <a l:href="#ch2">第二章</a>。</p>
  </section>
  <section id="ch2"><title><p>第二章 落雨</p></title><p>雨落下来。</p><table><tr><th>潮</th><td>六点</td></tr></table></section>
</section>
</body>
<body name="notes"><section id="n1"><title><p>1</p></title><p>注释的内容。</p></section></body>
<binary id="cover.png" content-type="image/png">${dotB64}</binary>
<binary id="pic.png" content-type="image/png">${dotB64}</binary>
</FictionBook>`;
  const fb2Book = await T.parseBookBytes('fb2', '灯塔.fb2', enc(fb2));
  assert.equal(fb2Book.format, 'fb2');
  assert.equal(fb2Book.subtitle, 'FB2');
  assert.equal(fb2Book.title, '灯塔手记');
  assert.equal(fb2Book.author, '雾 林');
  assert.ok(/^data:image\/png;base64,/.test(fb2Book.coverImage), 'FB2 cover from <coverpage>');
  same(shape(fb2Book), ['第一章 起风', '第二章 落雨', '注释'], 'grouping section passes its title down');
  const fb2c1 = fb2Book.chapters[0].paragraphs;
  assert.equal(fb2c1[0], '<h4>第一部</h4>', 'part title kept as a heading');
  assert.equal(fb2c1[1], '<blockquote><a id="ch1"></a><p>风从海上来。</p><p>—— 佚名</p></blockquote>', 'epigraph is a quote; the section anchor goes inside it, not before');
  assert.ok(fb2c1.some((p) => p.includes('<em>风</em>') && p.includes('<sup><a href="#n1" epub:type="noteref">[1]</a></sup>')), 'note reference');
  assert.ok(fb2c1.some((p) => /^!\[\]\(img-\d+\.png\)$/.test(p)), 'inline binary picture becomes a picture line');
  assert.ok(fb2c1.some((p) => p.includes('一行<br>二行') || p.includes('一行<br/>二行')), 'poem lines kept');
  assert.ok(fb2c1.some((p) => p.includes('<a href="#ch2">第二章</a>')), 'internal link kept');
  assert.ok(fb2Book.chapters[1].paragraphs.some((p) => /^<table>/.test(p) && p.includes('<th>潮</th>')), 'FB2 table');
  assert.ok(fb2Book.chapters[2].paragraphs.some((p) => /<aside id="n1" epub:type="footnote">/.test(p) && p.includes('注释的内容')), 'notes body becomes footnote asides');
  assert.equal(imagesOf(fb2Book).length, 1);
  // The id of a chapter section stays a link target in the text.
  assert.ok(fb2Book.chapters[1].paragraphs.some((p) => p.includes('id="ch2"')), 'section id kept as anchor');

  const cp1251 = Uint8Array.from([...enc('<?xml version="1.0" encoding="windows-1251"?><FictionBook><description><title-info><book-title>'), 207, 240, 232, 226, 229, 242, ...enc('</book-title></title-info></description><body><section><p>'), 207, 240, 232, 226, 229, 242, ...enc('!</p></section></body></FictionBook>')]);
  const cyr = await T.parseBookBytes('fb2', 'x.fb2', cp1251);
  assert.equal(cyr.title, 'Привет', 'declared encoding is honoured');
  assert.equal(cyr.chapters[0].paragraphs[0], 'Привет!');
  await assert.rejects(() => T.parseBookBytes('fb2', 'x.fb2', enc('<html></html>')), /book-invalid/);

  const fbz = await T.parseBookBytes('fbz', '灯塔.fb2.zip', storedZip([['灯塔.fb2', fb2]]));
  same(shape(fbz), shape(fb2Book), 'zipped FB2 reads the same');
  assert.equal(fbz.format, 'fb2');

  // ---- MOBI: PalmDOC, trailing entries, EXTH, filepos links, recindex pictures ----
  same(Array.from(T.palmDocDecompress(Uint8Array.from([0x61, 0x62, 0x63, 0x80, 0x18, 0xe1, 0x02, 0xc3, 0xa9]))), Array.from(enc('abcabc aé')), 'literal, back-reference, space+char, literal run');
  assert.equal(T.mobiTrailingSize(Uint8Array.from([1, 2, 3, 0x00, 0xaa, 0xbb, 0x83]), 0b11), 4, 'TBS entry + multibyte byte');
  assert.equal(T.mobiTrailingSize(Uint8Array.from([1, 2, 0xe4, 0x01, 0x81]), 0b11), 3, 'one-byte TBS entry, then a multibyte overlap of two bytes');

  function palmDocLiteral(bytes) {
    const out = [];
    bytes.forEach((b) => { if (b === 0 || (b >= 9 && b <= 0x7f)) out.push(b); else out.push(1, b); });
    return Uint8Array.from(out);
  }
  function makeMobi({ html, compression = 2, extraFlags = 0, version = 6, exthAuthor = '林雾', fullName = '灯塔手记', images = [], huff = null, fdstEnd = 0 }) {
    const text = enc(html);
    const textRecords = [];
    for (let at = 0; at < text.length; at += 4096) {
      let chunk = text.subarray(at, at + 4096);
      if (compression === 2) chunk = palmDocLiteral(chunk);
      if (extraFlags) chunk = Uint8Array.from([...chunk, 0x00, 0xaa, 0x82]);
      textRecords.push(chunk);
    }
    const nameBytes = enc(fullName);
    const exthData = enc(exthAuthor);
    const exth = new Uint8Array(12 + 8 + exthData.length + 12);
    const ev = new DataView(exth.buffer);
    exth.set(enc('EXTH'), 0);
    ev.setUint32(4, exth.length); ev.setUint32(8, 2);
    ev.setUint32(12, 100); ev.setUint32(16, 8 + exthData.length); exth.set(exthData, 20);
    const coverAt = 20 + exthData.length;
    ev.setUint32(coverAt, 201); ev.setUint32(coverAt + 4, 12); ev.setUint32(coverAt + 8, 0);
    const head = new Uint8Array(16 + 232 + exth.length + nameBytes.length + 4);
    const hv = new DataView(head.buffer);
    const firstImage = 1 + textRecords.length;
    const extraRecords = [];
    hv.setUint16(0, compression); hv.setUint32(4, text.length); hv.setUint16(8, textRecords.length); hv.setUint16(10, 4096);
    head.set(enc('MOBI'), 16); hv.setUint32(20, 232); hv.setUint32(24, 2); hv.setUint32(28, 65001); hv.setUint32(36, version);
    hv.setUint32(84, 16 + 232 + exth.length); hv.setUint32(88, nameBytes.length);
    hv.setUint32(108, images.length ? firstImage : 0xffffffff);
    hv.setUint32(128, 0x40);
    hv.setUint16(0xf2, extraFlags);
    head.set(exth, 16 + 232);
    head.set(nameBytes, 16 + 232 + exth.length);
    if (huff) { hv.setUint32(112, firstImage + images.length); hv.setUint32(116, huff.length); extraRecords.push(...huff); }
    if (fdstEnd) {
      const fdst = new Uint8Array(20); const fv = new DataView(fdst.buffer);
      fdst.set(enc('FDST'), 0); fv.setUint32(4, 12); fv.setUint32(8, 1); fv.setUint32(12, 0); fv.setUint32(16, fdstEnd);
      hv.setUint32(0xc0, firstImage + images.length + extraRecords.length); extraRecords.push(fdst);
    }
    const records = [head, ...textRecords, ...images, ...extraRecords];
    const pdbHead = new Uint8Array(78 + records.length * 8 + 2);
    const pv = new DataView(pdbHead.buffer);
    pdbHead.set(enc('Test_Book'), 0);
    pdbHead.set(enc('BOOKMOBI'), 60);
    pv.setUint16(76, records.length);
    let offset = pdbHead.length;
    records.forEach((record, index) => { pv.setUint32(78 + index * 8, offset); pv.setUint32(82 + index * 8, index * 2); offset += record.length; });
    return Uint8Array.from(Buffer.concat([pdbHead, ...records]));
  }
  const pad = (n) => String(n).padStart(10, '0');
  let mobiHtml = '<html><head><guide><reference type="toc" filepos=@@@@@@@@@@ /></guide></head><body><p><a filepos=@@@@@@@@@@>跳到第二章</a></p><mbp:pagebreak/>'
    + '<h2>第一章 起风</h2><p>海边的风。' + '很长的句子。'.repeat(900) + '</p><p><img recindex="00001" /></p><mbp:pagebreak/>'
    + '<h2>第二章 落雨</h2><p>雨落下来。</p></body></html>';
  const target = enc(mobiHtml.slice(0, mobiHtml.indexOf('<h2>第二章'))).length;
  mobiHtml = mobiHtml.replaceAll('@@@@@@@@@@', pad(target));
  const mobiBook = await T.parseBookBytes('mobi', '灯塔.mobi', makeMobi({ html: mobiHtml, extraFlags: 0b11, images: [dotPng] }));
  assert.equal(mobiBook.format, 'mobi');
  assert.equal(mobiBook.subtitle, 'MOBI');
  assert.equal(mobiBook.title, '灯塔手记', 'full name from the MOBI header');
  assert.equal(mobiBook.author, '林雾', 'EXTH 100 author');
  assert.ok(/^data:image\/png;base64,/.test(mobiBook.coverImage), 'EXTH 201 cover');
  assert.ok(mobiBook.chapters.length >= 3, 'long chapter is split into pieces');
  assert.equal(mobiBook.chapters[0].paragraphs[0], '<a href="#filepos' + target + '">跳到第二章</a>', 'filepos link becomes an in-book link');
  assert.ok(mobiBook.chapters[1].title.startsWith('第一章 起风'));
  assert.ok(!mobiBook.chapters.flatMap((c) => c.paragraphs).join('').includes('\u0000'), 'no stray placeholders');
  same(imagesOf(mobiBook), ['img-1.png'], 'recindex picture');
  const last = mobiBook.chapters[mobiBook.chapters.length - 1];
  assert.equal(last.title, '第二章 落雨');
  same(last.paragraphs, ['<a id="filepos' + target + '"></a>雨落下来。'], 'the link target lands in the chapter it opens');

  const plainMobi = await T.parseBookBytes('mobi', 'p.azw', makeMobi({ html: '<html><body><p>第一章 甲</p><p>甲。</p><p>第二章 乙</p><p>乙。</p></body></html>', compression: 1 }));
  same(shape(plainMobi), ['第一章 甲', '第二章 乙'], 'uncompressed records, chapter lines');
  assert.equal(plainMobi.subtitle, 'AZW');

  // Kindle-style page breaks: a chapter line after a picture caption names the chapter;
  // a caption run into a heading is trimmed, an ordinary heading is not.
  const paged = await T.parseBookBytes('mobi', 'p.mobi', makeMobi({ html: '<html><body><p>前页。</p><mbp:pagebreak/><p><img recindex="00001"/> A caption. <br/>CHAPTER II.</p><p>Two.</p><mbp:pagebreak/><p>Chapter III.</p><p>Three.</p></body></html>', compression: 1, images: [dotPng] }));
  same(shape(paged), ['第 1 节', 'CHAPTER II.', 'Chapter III.']);
  same(paged.chapters[1].paragraphs, ['![](img-1.png)', 'A caption. <br>CHAPTER II.', 'Two.'], 'the mixed paragraph is kept');
  same(paged.chapters[2].paragraphs, ['Three.'], 'a paragraph that is only the chapter line becomes the title');
  const captioned = await T.parseBookBytes('mobi', 'c.mobi', makeMobi({ html: '<html><body><h2>“At the door.” CHAPTER XXVIII.</h2><p>a</p><h2>Notes on Chapter 3</h2><p>b</p></body></html>', compression: 1 }));
  same(shape(captioned), ['CHAPTER XXVIII.', 'Notes on Chapter 3']);

  // HUFF/CDIC: an identity code (every byte is an 8-bit code for itself).
  const huffRec = new Uint8Array(24 + 256 * 4 + 64 * 4);
  const hfv = new DataView(huffRec.buffer);
  huffRec.set(enc('HUFF'), 0); hfv.setUint32(4, 24); hfv.setUint32(8, 24); hfv.setUint32(12, 24 + 1024);
  for (let i = 0; i < 256; i += 1) hfv.setUint32(24 + i * 4, (255 << 8) | 0x80 | 8);
  const cdic = new Uint8Array(16 + 256 * 2 + 256 * 3);
  const cdv = new DataView(cdic.buffer);
  cdic.set(enc('CDIC'), 0); cdv.setUint32(4, 16); cdv.setUint32(8, 256); cdv.setUint32(12, 8);
  for (let k = 0; k < 256; k += 1) {
    const off = 256 * 2 + k * 3;
    cdv.setUint16(16 + k * 2, off);
    cdv.setUint16(16 + off, 0x8000 | 1);
    cdic[18 + off] = 255 - k;
  }
  const huffBook = await T.parseBookBytes('mobi', 'h.mobi', makeMobi({ html: '<html><body><h2>第一章</h2><p>霍夫曼。</p><h2>第二章</h2><p>编码。</p></body></html>', compression: 17480, huff: [huffRec, cdic] }));
  same(shape(huffBook), ['第一章', '第二章']);
  same(huffBook.chapters[1].paragraphs, ['编码。']);

  // KF8 (AZW3): skeleton + fragments flattened, kindle:embed pictures, FDST flow end.
  const kf8 = '<?xml version="1.0"?><html><head><title>t</title></head><body><div></div></body></html>'
    + '<h2>第一章</h2><p>一。</p><img src="kindle:embed:0001?mime=image/png"/><h2>第二章</h2><p>二。<a href="kindle:pos:fid:0001:off:0000000000">回</a></p>';
  const css = 'p { color: red }';
  const kf8Book = await T.parseBookBytes('mobi', 'k.azw3', makeMobi({ html: kf8 + css, version: 8, images: [dotPng], fdstEnd: enc(kf8).length }));
  assert.equal(kf8Book.subtitle, 'AZW3');
  same(shape(kf8Book), ['第一章', '第二章'], 'fragments after </html> are read');
  same(imagesOf(kf8Book), ['img-1.png']);
  assert.ok(!kf8Book.chapters[1].paragraphs.join('').includes('color'), 'CSS flow after FDST end is not text');
  assert.ok(!kf8Book.chapters[1].paragraphs.join('').includes('kindle:'), 'kindle:pos links are dropped');

  const drm = makeMobi({ html: '<p>x</p>' });
  new DataView(drm.buffer).setUint16(new DataView(drm.buffer).getUint32(78) + 12, 2);
  await assert.rejects(() => T.parseBookBytes('mobi', 'd.mobi', drm), /book-drm/);
  await assert.rejects(() => T.parseBookBytes('mobi', 'x.mobi', enc('x'.repeat(200))), /book-invalid/);
  const truncated = makeMobi({ html: '<p>x</p>' }).subarray(0, 120);
  await assert.rejects(() => T.parseBookBytesSafely('mobi', 't.mobi', truncated), /book-invalid|empty/, 'truncated file is reported, not thrown raw');

  // ---- The shelf keeps the format; it is not mistaken for EPUB or Markdown ----
  ['fb2', 'mobi'].forEach((format) => {
    const state = T.normalizeState({ customBooks: [{ id: 'local-f-' + format, title: '书', subtitle: 'EPUB', tags: ['EPUB', 'Markdown'], format, chapters: [{ id: 'c', title: 'c', paragraphs: ['p'] }] }] });
    assert.equal(state.customBooks[0].format, format, format + ' survives normalization');
    assert.equal(T.isEpubBook(state.customBooks[0]), false, format + ' is not EPUB');
    assert.equal(T.isMarkdownBook(state.customBooks[0]), false, format + ' is not Markdown');
    assert.equal(T.fsBodyFileName(state.customBooks[0]), '书--local-f-' + format + '.txt', format + ' body is a readable .txt');
  });

  // ---- Folder round trip: body text + pictures written at import, read back intact ----
  const stored = Object.assign({}, fb2Book, { id: 'local-fb2-rt' });
  assert.equal(await T.fsWriteNewBookBody(stored, { skipImages: T.isEpubBook(stored) }), true);
  assert.ok(memory.files.has('books/灯塔手记--local-fb2-rt.txt'), 'FB2 body is written as text');
  assert.ok(memory.files.has('books/灯塔手记--local-fb2-rt.assets/img-1.png'), 'FB2 picture is written at import');
  const back = await T.fsReadBookBody({ id: 'local-fb2-rt', title: '灯塔手记', format: 'fb2', chaptersInFs: true, chapterIds: T.chapterIdsOf(stored) });
  same(back.map((c) => c.title), shape(fb2Book));
  same(back.map((c) => c.paragraphs), fb2Book.chapters.map((c) => c.paragraphs), 'paragraphs (quotes, tables, asides) survive the text body');
  assert.ok(/^data:image\/png;base64,/.test(back[0].images['img-1.png']), 'picture comes back from .assets');
  assert.equal(await T.fsDeleteBookBody({ id: 'local-fb2-rt' }), true);

  // The parse worker carries every format parser.
  const workerSource = read('parse-worker.js');
  ['parseBookBytesSafely', 'parseFb2Book', 'parseFbzBook', 'parseMobiBook'].forEach((name) => {
    assert.ok(workerSource.includes('function ' + name), 'worker has ' + name);
  });
  assert.match(read('build.mjs'), /parseBookBytesSafely\(job\.kind/);
}
console.log('PASS  more formats: MOBI/AZW3 (PalmDOC, HUFF/CDIC, KF8), FB2/FBZ, folder round-trip');

console.log('PASS  readable body files: naming, plain-text round-trip, rename cleanup, legacy JSON');
console.log('PASS  ' + dictionaryRegistrations.length + ' dictionaries registered');
