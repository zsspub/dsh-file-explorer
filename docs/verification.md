# 验证报告

日期：2026-09-07。DSH：官方 master `d347e703908d0406b7a7ef80e3a0e594d86b2215`。插件从打包产物安装到隔离 profile，经标准 `dsh --profile web` 启动。

## 已验证

- `pnpm typecheck`、`pnpm test`（4 文件、9 测试）、`pnpm build`、`pnpm pack`。
- npm 生成 Remote 及官方 master Gateway 构建：接管、原方法调用、重复装卸、namespace 重新挂载与多适配器条件恢复。
- 文件读取单元测试：文本/Markdown/HTML/SVG、位图、二进制、读取上限、目录上限、缺失路径、目录越界和符号链接。
- 抽屉组件：HTML 只显示源码、Markdown 不加载外部资源、关闭后焦点恢复；异步控制器忽略旧会话和旧文件请求。
- 实际 Host HTTP 接口：工作区读取 200、额外根目录读取 200、越界路径 403、缺失文件 404、未认证请求 401。
- 实际浏览器：插件加载、会话标题入口、overlay 抽屉、Markdown 预览、关闭并恢复入口焦点。

## 尚待验证

模型 API Key 正在由操作者配置。真实模型生成的产物/正文/工具文件入口、完整预览与窄屏操作录屏、实际插件卸载恢复仍待完成。当前报告不代表全部 E2E 场景通过。

测试会话通过正式 `workspace/create` 和 `session/create` API 创建；没有注入伪造的工具结果或产物事件。首次模型请求因缺少密钥失败，不作为真实模型成功证据。
