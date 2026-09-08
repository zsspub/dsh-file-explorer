# dsh-file-explorer

DeepSeek Harness 的第三方只读文件查看插件。点击聊天中的文件，在 `shell.overlay` 右侧抽屉内浏览，无需修改 DSH 源码。

[下载安装包与演示](https://github.com/zsspub/dsh-file-explorer/releases/tag/v0.1.0) · [验证报告](docs/verification.md)

![文件抽屉演示](https://github.com/zsspub/dsh-file-explorer/releases/download/v0.1.0/file-explorer-demo.gif)

## 功能

- 使用 Lucide 图标，保留中文/英文按钮标签和键盘可访问名称。
- 会话标题“文件”入口，目录树、根目录切换、当前已加载目录文件名筛选和刷新。
- 接管产物、正文文件引用及工具卡片经 `session.openWorkspacePath` 发起的打开操作。
- 代码高亮与行号、Markdown 预览/源码切换、位图缩放；HTML 和 SVG 仅显示源码。
- 会话工作区及 Host 明确配置的额外根目录；只读，不提供写入操作。
- Esc、遮罩和关闭按钮关闭抽屉，恢复焦点；切换会话取消旧请求。
- 显式“用系统应用打开”调用原打开器；读取错误不会自动打开外部应用。

## 兼容性

集成目标为官方 DSH master `d347e703908d0406b7a7ef80e3a0e594d86b2215`。使用已发布 `0.1.2-rc.1` 类型编译，但该版本缺少 master 的 `sessionPersistence.stat` 声明，Host 通过局部结构类型描述已验证的接口；**不能据此推断所有 rc/alpha 版本兼容**。实际验证范围见 [验证报告](docs/verification.md)。

文件接管是针对生成的 Remote 方法的运行时兼容适配，不是 DSH 正式文件打开扩展协议。依赖 `remote.session.openWorkspacePath` 可配置的方法属性；不匹配时保留原方法并报告错误。卸载恢复原属性，且不会覆盖后来安装的其他适配器。DSH 升级后应重新验证接管和卸载。

首版读取 Host 本地文件系统，不支持 E2B 等远端执行环境。只有经过该 Remote 方法的入口被接管，普通网页链接不受影响。Markdown 禁用原始 HTML、图片加载和链接导航；不加载文件引用的网络资源。

## 安装

需要 Node 24、pnpm 11 和兼容的 DSH。

```sh
git clone https://github.com/zsspub/dsh-file-explorer.git
cd dsh-file-explorer
pnpm install --frozen-lockfile
pnpm build
pnpm pack
dsh plugin --profile web add /absolute/path/dsh-file-explorer-0.1.0.tgz
dsh --profile web
```

`dsh plugin add` 会把 bundle 加入 profile，无需手动重复添加。插件没有独立应用启动器，也未发布 npm。

在 `$DSH_HOME/profiles/web/cordis.patch.yml` 配置额外目录；该覆盖替换整份配置，因此保留所有字段：

```yaml
- id: file-explorer
  config:
    extraRoots:
      - /absolute/path/shared-documents
    maxTextBytes: 2097152
    maxImageBytes: 20971520
    maxDirectoryEntries: 2000
```

默认没有额外目录。根目录必须是存在的绝对目录；Host 从会话元数据读取 cwd，客户端不能指定授权根。每次读取校验真实路径，拒绝目录穿越和越界符号链接。大文件返回超限信息，不返回内容。目录列表有条目上限，不递归扫描整棵树。

配置随 Host profile 保存；浏览状态不持久化，刷新页面后抽屉关闭。文件刷新为手动操作。

## 卸载

```sh
dsh plugin --profile web remove dsh-file-explorer
```

同时移除 profile 中针对 `file-explorer` 的自定义配置覆盖。刷新客户端后，DSH 恢复原生打开方式。

## 设计规范

界面风格固定遵循 [DSH 设计规范](DESIGN.md)。开发前读取 [项目约定](AGENTS.md)，Impeccable 的安装方法和使用顺序见 [设计工作流](docs/design-workflow.md)。

## 开发与检查

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm pack
```

测试覆盖路径授权、文件类型与读取上限、真实生成 Remote 方法装卸以及异步会话隔离。Host 和浏览器分别编译，浏览器包通过 DSH ModuleLoader 加载，只把 DSH 共享平台模块留为外部依赖。

MIT License.
