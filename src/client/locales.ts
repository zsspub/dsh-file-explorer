import type {} from '@deepseek-ai/dsh-client-ui-slots'
/** File Explorer dictionaries. */
export const NS = 'file-explorer'
export const zh = {
  title: '文件',
  close: '关闭',
  refresh: '刷新',
  filter: '筛选文件名',
  roots: '根目录',
  tree: '目录',
  copy: '复制',
  copied: '已复制',
  source: '源码',
  preview: '预览',
  loading: '正在读取…',
  empty: '此目录为空',
  select: '选择文件查看',
  noRoots: '当前会话没有可读目录',
  native: '用系统应用打开',
  binary: '暂不支持预览此文件类型',
  large: '文件超过预览大小限制',
  truncated: '目录条目已达到上限',
  zoom: '图片缩放',
  copyFailed: '复制失败，请重试',
  imageFailed: '图片无法解码',
  failure: '操作失败',
  compatibility: '文件打开接管不可用',
  path: '文件路径',
}
export const en: typeof zh = {
  title: 'Files',
  close: 'Close',
  refresh: 'Refresh',
  filter: 'Filter file names',
  roots: 'Root directory',
  tree: 'Folders',
  copy: 'Copy',
  copied: 'Copied',
  source: 'Source',
  preview: 'Preview',
  loading: 'Loading…',
  empty: 'Empty directory',
  select: 'Select a file',
  noRoots: 'No readable directories for this session',
  native: 'Open in system application',
  binary: 'Preview unavailable for this file type',
  large: 'File exceeds the preview size limit',
  truncated: 'Directory entry limit reached',
  zoom: 'Image zoom',
  copyFailed: 'Copy failed; try again',
  imageFailed: 'Image could not be decoded',
  failure: 'Operation failed',
  compatibility: 'File-open integration unavailable',
  path: 'File path',
}
export type Translate = (key: keyof typeof zh) => string

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'file-explorer': keyof typeof zh
  }
}
