import type {} from '@deepseek-ai/dsh-client-ui-slots'
/** File Explorer dictionaries. */
export const NS = 'file-explorer'
export const zh = {
  title: '文件',
  close: '关闭',
  refresh: '刷新',
  filter: '筛选文件名',
  filterHint: '仅筛选已展开目录中的文件；不会搜索未展开的目录',
  noMatches: '没有匹配的文件，可清除筛选或展开其他目录',
  clearFilter: '清除筛选',
  recover: '请刷新重试，或打开目录选择其他文件；若仍失败，请检查文件是否存在及访问权限。',
  previewHelp: '请选择其他文件预览。',
  nativeHelp: '也可以使用上方“用系统应用打开”查看文件。',
  roots: '根目录',
  tree: '目录',
  copy: '复制',
  copied: '已复制',
  source: '源码',
  preview: '预览',
  loading: '正在读取…',
  empty: '此目录为空',
  select: '选择文件查看',
  noRoots: '当前会话没有可读目录。请切换到有工作区的会话，或在 Host 中配置可读目录。',
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
  filterHint: 'Filters files in expanded folders only; unopened folders are not searched',
  noMatches: 'No matching files. Clear the filter or expand another folder.',
  clearFilter: 'Clear filter',
  recover:
    'Refresh to retry, or open Folders to choose another file. If it still fails, check that the file exists and that you have access.',
  previewHelp: 'Choose another file to preview.',
  nativeHelp: 'You can also use “Open in system application” above to view the file.',
  roots: 'Root directory',
  tree: 'Folders',
  copy: 'Copy',
  copied: 'Copied',
  source: 'Source',
  preview: 'Preview',
  loading: 'Loading…',
  empty: 'Empty directory',
  select: 'Select a file',
  noRoots:
    'No readable directories for this session. Switch to a session with a workspace, or configure a readable directory in the Host.',
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
