# DSH File Explorer

为 DeepSeek Harness 用户提供会话内只读工作区文件浏览与预览。入口是会话文件按钮及宿主文件引用；核心路径为打开抽屉、选择目录或文件、阅读内容、返回对话。

插件运行于宿主 shell.overlay，保留宿主主题、原生交互习惯与中英文语言支持。文件范围由 Host 授权根目录决定；不提供编辑、上传或文件管理写操作。支持代码、Markdown、位图；HTML/SVG 仅源码。浏览状态不持久化，刷新后关闭抽屉。

视觉身份固定为 deepseek-harness，具体规范见 DESIGN.md。此文档依据项目 README 与已实现能力整理，不扩展功能范围。
