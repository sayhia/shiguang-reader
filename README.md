# 拾光阅读 · Shiguang Reader

[![npm](https://img.shields.io/npm/v/shiguang-reader.svg)](https://www.npmjs.com/package/shiguang-reader)
[![Publish npm package](https://github.com/sayhia/shiguang-reader/actions/workflows/publish.yml/badge.svg)](https://github.com/sayhia/shiguang-reader/actions/workflows/publish.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> 把世界关小一点，把书页放大一点。

装进 DeepSeek Harness 的本地阅读器：书架、沉浸式阅读、划线想法、书签、搜索和统计，都在同一个安静的面板里。

## 界面

| 书架 | 批量操作 |
|:---:|:---:|
| ![书架](screenshots/shelf.png) | ![批量操作](screenshots/batch-actions.png) |
| **书籍详情** | **阅读统计** |
| ![书籍详情](screenshots/book-detail.png) | ![阅读统计](screenshots/stats.png) |

<sub>截图由真实 React 组件与生产 CSS 在无头 Chromium 中渲染，使用演示数据。</sub>

## 安装

### 在 Harness 中安装

打开 **设置 → 插件**，安装 Bundle：

```text
shiguang-reader
```

也可以跟随 GitHub 最新提交：

```text
github:sayhia/shiguang-reader
```

安装后刷新 Web UI，点击左侧栏的书本图标「拾光阅读」。

### 直接安装 npm 包

```bash
npm install shiguang-reader
```

- npm：<https://www.npmjs.com/package/shiguang-reader>
- GitHub：<https://github.com/sayhia/shiguang-reader>

### 第一次使用

1. 点击「导入本地书」，选择 TXT / Markdown / EPUB。
2. 首次导入会被要求选择一个**书库目录**；正文和原始 EPUB 都会保存在那里。
3. 开始阅读、划线、写想法，数据自动保存。

## 功能

### 阅读
分页阅读、目录与章节进度、纸张/月白/青瓷/夜间主题、字号/行距/页宽调节、全屏与语音朗读。

### 笔记
划线、想法、四种颜色、标签、书签、书评、摘录卡片；支持导出 Markdown、Obsidian Callout 与整本笔记。

### 书架
封面/列表/分组视图，按最近阅读、进度、评分、字数排序；置顶、想读、搁置、已读完；多选批量操作。

### 搜索与统计
书内搜索、跨书正文搜索、命中高亮、引用复制；七日趋势、连续阅读、热力图、阅读节律、时长排行与月度卡片。

## 数据

- 正文只保存在你选择的**书库目录**：`library.json` + `books/*.txt` + 原始 `.epub`。
- 浏览器只保存书架元数据、进度、笔记与设置。
- SQLite 只做宿主侧的**派生检索索引**，可随时删除重建；设置 `index: false` 可完全关闭。
- 不使用 `better-sqlite3`，SQLite 也不是主存储。

## 宿主工具

| 工具 | 用途 |
|---|---|
| `reading_search` | 跨书全文检索 |
| `reading_book_read` | 读取目录和章节正文 |
| `reading_notes` | 查询划线、想法与标签 |
| `reading_bookmarks` | 查询书签与备注 |
| `reading_shelf` | 查询书架、状态、评分与进度 |
| `reading_stats` | 阅读统计、时长排行与目标 |
| `reading_library_config` | 记住书库目录、查看索引状态 |

## 开发

```bash
npm run dev     # 监听 source/，自动构建
npm run build   # 手动构建
npm test        # 客户端 + 宿主测试
```

客户端源码在 `source/`，构建产物为 `client.js` 与 `parse-worker.js`。

本地开发也可以直接链接源码目录：

```bash
dsh plugin --profile desktop add link:/path/to/shiguang-reader
```

推送 `main` 时，GitHub Actions 只会构建和跑测试，不会发布 npm。需要发布时，先更新版本并推送，再在 Actions 中手动运行 **Publish npm package**。

```bash
npm version patch
git push origin main
```

## 已知边界

- 书库目录依赖 Chromium 的 File System Access API；Safari / Firefox 不支持导入。
- EPUB 按纯文字阅读，不还原固定版式；不解析 PDF。
- 截图使用演示数据，真实阅读数据保存在本机。

## 许可证 · License

本项目基于 [MIT License](LICENSE) 许可协议开源。
