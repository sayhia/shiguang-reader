# BUGFIXES — 第 1 轮（2026-11-08）

范围：源码（source/ → client.js）、宿主（index.js / hostlib.js / hostindex.js）、测试与构建脚本。
只修 P0/P1；P2 仅记录。验证：`node build.mjs && npm test` 全绿。

## P0 / P1（已修，每条都有回归断言）

### P0-1 阅读器 XSS：段落 HTML 原样注入 `dangerouslySetInnerHTML`
- 位置：`source/reader.js` 段落渲染（`applyHtmlHighlights(safeText…)`），`source/epub.js` `sanitizeAttrsAndTags` 之后才 `decodeEpubEntities`。
- 复现：导入含 `<img src=x onerror=alert(1)>` 的 .txt/.md；或 EPUB 正文写成 `&lt;img src=x onerror=…&gt;`（清洗后才解码）；或 `<a href="javascript:…">`。打开即在 Harness Web UI 里执行脚本。
- 修复：`source/core.js` 新增 `sanitizeReaderHtml`，渲染时按 EPUB 同一白名单重建每个标签和属性（href 仅允许无协议/http(s)/mailto，先解实体再判断），其余标签删除；高亮 `<mark>` 的属性值转义。删除的标签同样会被 `stripHtmlTags` 去掉，所以高亮偏移不变；对磁盘上已有的书也生效，不改存储格式。
- 回归：`test.mjs`「Regression (BUGFIXES P0-1)」。

### P1-1 宿主读 EPUB 的章节编号与阅读器不一致
- 位置：`hostlib.js` `readEpubSync`。
- 复现：spine 含 `properties="nav"` 目录页、`linear="no"` 附录或单章 >7600 字时，宿主章数/序号与阅读器不同；`reading_book_read chapterIndex=N`、大纲、搜索的「第 N 章」都指错章（SQLite 索引同样受影响）。
- 修复：与客户端 `parseEpubBook` 相同的阅读顺序（跳过 nav、`linear="no"`、非 HTML），章 id 用 `epub-cN`，复制客户端 `splitLongChapter`（>7600 字按 3400 拆分）；`hostindex.js` `SCHEMA_VERSION` 5→6，让旧索引自动重建。
- 回归：`test-host.mjs`「Regression (BUGFIXES P1-1)」。

### P1-2 TXT/MD 正文从磁盘读回时段落/章节被合并
- 位置：`source/core.js` `parseBookBodyText`（HTML 容器规则），`source/fsstore.js` `fsReadBookBody`；宿主镜像 `hostlib.js` `parseBodyText`。
- 复现：`# 第一章\n\n<figure>\n\n![图](a.png)\n\n</figure>\n\n后面的正文。` 导入是 4 段，重载后变 2 段，之后的高亮全部错位；段首未闭合的 `<ul>` 会吞掉后续 `# 第二章`，章数变化导致 `chapterIds` 失效，高亮/书签/进度脱钩。
- 修复：`parseBookBodyText` / `parseBodyText` 新增可选参数 `{ plainParagraphs }`；`format` 为 `txt`/`markdown` 的书关闭容器规则（导入本来就在空行处分段），EPUB 及未知格式保持原行为。
- 回归：`test.mjs`「Regression (BUGFIXES P1-2)」（客户端写入→读回逐段一致，宿主解析一致）。

### P1-3 恢复备份后正文从不写入书库文件夹
- 位置：`source/app.js` `restoreBackup`。
- 复现：已挂载书库文件夹时恢复一份较大的备份 → 正文只留在 state，`saveState` 超出 localStorage 配额，重载后恢复的书丢失。
- 修复：`setState(next)` 后调用已有的 `persistBodies(restoredBodiesToPersist(next))`（新增的纯函数在 `core.js`）；写不了的书（如本文件夹里没有原始 .epub 的 EPUB）照旧留在 state，不会更糟。
- 回归：`test.mjs`「Regression (BUGFIXES P1-3)」（筛选函数 + restoreBackup 调用链断言）。

## P2（记录，未修）
- `hostlib.js` `findLatestBackup`：只取最新的 `*book*.json`，下载目录里有 `bookmarks-*.json` 时备份模式全部失败；应逐个尝试直到 `readBackup` 成功。
- `reading_library_config` 原样保存 `libraryDir`（不 `path.resolve`、不展开 `~`）。
- 宿主 EPUB 章标题优先取 `<title>`（很多书每章都是书名），且不输出图片行；段落抽取与客户端 `extractEpubChapter` 不同，拆分点仍可能有小偏差（见已知边界）。
- 记住文件夹后会忽略显式 `backupPath`（工具描述已说明）。
- 快照搜索不对 `customBooks` 重复 id 去重；SQLite `LIKE` 回退（<3 字）只对 ASCII 大小写不敏感。
- `app.js` `updateHighlight` 忽略 `patch.style`，`normalizeHighlight` 丢 `style`，下划线/波浪线/删除线样式不生效。
- `cleanOrphanBodies` 不看 `importingRef` 和 6 秒撤销删除窗口，可能删掉待入架或待撤销书的正文。
- `chooseLibraryDir` 在长 await 后用快照 `setState(next)`，可能覆盖期间的进度/高亮；`fsWriteSnapshotNow` 与合并写快照可能竞争。
- `normalizeStoredBook` 丢 `charCount`/`chapterCount`；书 id 不是随机的（`Date.now` + 种子），并行解析理论上可能撞 id。
- 7016d0f 之前保存在含格式段落上的高亮没有迁移，位置仍偏。

## 已知边界
- P0-1 只是渲染时清洗；磁盘上的正文不改写。白名单外的标签（如 TXT 里的 `<img>`）不再显示，与浏览器原本把它们当作不可见元素基本一致。
- P1-1 宿主仍用自己的 EPUB 段落抽取；章数与阅读器一致，但个别书拆分点可能有几段偏差。根治办法是宿主读客户端解析好的正文，需要改磁盘布局，本轮不做。
- P1-3 恢复到另一个文件夹时，没有原始 .epub 的 EPUB 书仍留在 localStorage（与修复前相同）。在恢复后、写入完成前撤销，已写入的正文文件保留备份版本。
- 验证只用了 test.mjs / test-host.mjs，没有做浏览器和真实语料测试。
