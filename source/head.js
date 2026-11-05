window.__ModuleLoader__.load({
  id: '@local/shiguang-reader',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } = React;

    const NS = 'shiguangReader';
    const PANEL_ID = 'shiguang-reader';
    const STORAGE_KEY = 'dsh.shiguang-reader.library.v1';
    const DEFAULT_WEEKLY_GOAL_MINUTES = 180;
    // No import ceilings and no shelf cap: the only real limit is the browser's
    // storage quota, which reports itself when a save fails. Artificial maxima
    // just told people "no" for reasons they could not see or act on.
    const MAX_BOOK_TAGS = 8;
    const MAX_TAG_LENGTH = 24;
    const MAX_NOTE_TAGS = 3;
    const MAX_NOTE_TAG_LENGTH = 12;
    const MAX_HIGHLIGHTS = 2400;
    const MAX_SEARCH_TERMS = 6;
    const FONT_SIZE_MIN = 15;
    const FONT_SIZE_MAX = 28;
    const FONT_SIZE_DEFAULT = 19;
    const UNTITLED = '未命名书稿';
    // Replaced by build.mjs with the standalone parser bundle for Web Workers.
    const PARSE_WORKER_SOURCE = null;
    const UI_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
    const SERIF_FONT = '"Songti SC", "STSong", "Noto Serif SC", "Source Han Serif SC", "SimSun", serif';
