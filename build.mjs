import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const order = ['head.js', 'locale.js', 'books.js', 'styles.js', 'fsstore.js', 'core.js', 'quotecard.js', 'monthlycard.js', 'epub.js', 'formats.js', 'shelf.js', 'notesview.js', 'reader.js', 'palette.js', 'app.js', 'tail.js'];
const source = order.map((name) => readFileSync(join(root, 'source', name), 'utf8')).join('\n');

// Standalone parser bundle for the import worker pool. It includes only books,
// parsing helpers, EPUB and the other book formats: no React components, no UI, no file-system writes.
const workerParts = ['books.js', 'core.js', 'epub.js', 'formats.js']
  .map((name) => readFileSync(join(root, 'source', name), 'utf8'));
const workerSource = [
  'const window = self;',
  'const React = { createElement: function () { return null; } };',
  'const h = function () { return null; };',
  "const UNTITLED = '未命名书稿';",
  ...workerParts,
  `self.onerror = function (event) {
  if (event && typeof event.preventDefault === 'function') event.preventDefault();
};
self.onmessage = async function (event) {
  const job = event.data || {};
  try {
    let book;
    if (job.kind === 'epub') {
      book = await parseEpubBook(job.name, job.file, { skipImageBytes: true });
    } else {
      const bytes = new Uint8Array(await job.file.arrayBuffer());
      book = await parseBookBytesSafely(job.kind, job.name, bytes);
    }
    self.postMessage({ id: job.id, ok: true, book: book });
  } catch (error) {
    self.postMessage({ id: job.id, ok: false, message: String(error && error.message || error) });
  }
};`,
].join('\n');
const withWorker = source.replace(
  'const PARSE_WORKER_SOURCE = null;',
  'const PARSE_WORKER_SOURCE = ' + JSON.stringify(workerSource) + ';',
);
writeFileSync(join(root, 'parse-worker.js'), workerSource);
writeFileSync(join(root, 'client.js'), withWorker);
console.log('Built parse worker (' + workerSource.length.toLocaleString() + ' chars)');
console.log(`Built client.js (${withWorker.length.toLocaleString()} chars) from ${order.length} source files.`);

// Built-in books were removed. builtin-books.json is no longer generated.
