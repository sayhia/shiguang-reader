# 拾光阅读 · Shiguang Reader

> 把世界关小一点，把书页放大一点。

一个装进 DeepSeek Harness 的本地阅读插件：书架、沉浸式阅读、划线想法、书签、搜索、统计，都在同一个安静的面板里。

## 界面

| 书架 | 批量操作 |
|:---:|:---:|
| ![书架](screenshots/shelf.png) | ![批量操作](screenshots/batch-actions.png) |
| **书籍详情** | **阅读统计** |
| ![书籍详情](screenshots/book-detail.png) | ![阅读统计](screenshots/stats.png) |

> 截图由真实 React 组件与生产 CSS 在无头 Chromium 中渲染，使用演示数据，不含 DSH 主界面外壳。

## 功能

- **阅读**：分页阅读、目录、章节进度、四套主题、字号/行距/页宽调节、全屏与语音朗读。
- **笔记**：划线、想法、四种颜色、标签、书签、书评与摘录卡片。
- **搜索**：书内搜索、跨书正文搜索、命中高亮与引用复制。
- **书架**：封面/列表/分组视图，按最近阅读、进度、评分、字数排序；置顶、想读、搁置、已读完。
- **批量操作**：多选后批量标记、搁置、打标签、置顶、复制/导出书单与删除。
- **导入**：TXT / Markdown / EPUB，支持多选和拖拽；批量导入显示进度并逐本落盘。
- **统计**：七日趋势、连续阅读、热力图、阅读节律、时长排行与月度卡片。
- **宿主工具**：Agent 可直接跨书检索、读书、查笔记/书签/书架/统计。

## 安装

### 在线安装（推荐）

GitHub：[sayhia/shiguang-reader](https://github.com/sayhia/shiguang-reader)

在 DeepSeek Harness 的 **设置 → 插件** 中安装 Bundle，二选一：

```text
shiguang-reader
github:sayhia/shiguang-reader
```

`shiguang-reader` 来自 npm；GitHub spec 适合直接跟随仓库最新提交。安装完成后刷新 Web UI，点击左侧栏的书本图标「拾光阅读」；如果插件列表里还没启用，手动打开「拾光阅读」即可。

也可以直接安装 npm 包：

```bash
npm install shiguang-reader
```

### 本地开发

```bash
dsh plugin --profile desktop add link:/path/to/shiguang-reader
```

适合改源码时使用；正式使用建议用上面的 GitHub 在线安装。

## 数据

- 正文只保存在你选择的**书库目录**：`library.json` + `books/*.txt` + 原始 `.epub`。
- 浏览器只保存书架元数据、进度、笔记与设置。
- SQLite 只做宿主侧的**派生检索索引**，可随时删除重建；设置 `index: false` 可完全关闭。
- 不使用 `better-sqlite3`，SQLite 也不是主存储。

## 开发

```bash
npm run dev     # 监听 source/，自动构建
npm run build   # 手动构建
npm test        # 客户端 + 宿主测试
```

客户端源码在 `source/`，构建产物为 `client.js` 与 `parse-worker.js`。

## 已知边界

- 书库目录依赖 Chromium 的 File System Access API；Safari / Firefox 不支持导入。
- EPUB 按纯文字阅读，不还原固定版式；不解析 PDF。
- 截图使用演示数据，真实阅读数据保存在本机。
