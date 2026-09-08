# 设计规范与 Impeccable

规范：根目录 DESIGN.md；产品背景：PRODUCT.md；Agent 入口：AGENTS.md。

## 安装固定版本

Impeccable 为本地开发工具，不将第三方技能源码提交到本仓库。安装位置为 `.agents/skills/impeccable`，来源为 https://github.com/pbakaus/impeccable ，固定 commit 为 `2bc2879276c1f321a53c4ca99d3371e411329b52`，上游路径为 `.agents/skills/impeccable`。

可使用 skill-installer 按上述仓库、commit 和路径安装到项目目录；也可执行：

```sh
# 在本项目根目录执行；目标已存在时先核对版本，不直接覆盖。
(
  set -eu
  test ! -e .agents/skills/impeccable
  impeccable_tmp=$(mktemp -d)
  trap 'rm -rf "$impeccable_tmp"' EXIT
  git clone --no-checkout https://github.com/pbakaus/impeccable.git "$impeccable_tmp/repo"
  git -C "$impeccable_tmp/repo" checkout 2bc2879276c1f321a53c4ca99d3371e411329b52 -- .agents/skills/impeccable
  mkdir -p .agents/skills
  cp -R "$impeccable_tmp/repo/.agents/skills/impeccable" .agents/skills/impeccable
  chmod +x .agents/skills/impeccable/scripts/impeccable
)
```

未安装自动 hooks。启动器首次运行可能下载上游引擎；引擎行为与静态技能版本应分别核对。

## 使用顺序

1. 先读 PRODUCT.md / DESIGN.md，保持 DSH 的字体、颜色、组件几何及紧凑密度。
2. 使用 Impeccable document 更新规范时，以宿主来源为准，保留主题语义映射及来源版本，不将插件偏差反写为宿主规则。
3. 使用 critique/polish 时明确目标 `src/client/Drawer.tsx`，要求保留 DSH 身份。
4. E2E 和录屏先征得用户同意。正式 critique 的双独立子代理流程按其技能说明取得授权。
5. 交付时记录验证场景与限制；录屏附到获授权的 PR 或其他交付载体，不直接提交视频到 Git。

## 版本管理边界

提交源码、测试、DESIGN.md、PRODUCT.md、AGENTS.md 与本工作流。`.impeccable/design.json` 包含项目专用的宿主组件预览片段，保留在版本管理中，需在宿主主题上下文中使用。

本地技能副本、`.impeccable/critique/` 评审历史、阶段报告、`artifacts/` 截图录屏、构建输出与依赖目录不提交。阶段报告的忽略规则按文件列出，避免误忽略后续正式文档。

## 当前验证范围

已完成深浅主题预览、对比度检查、筛选无匹配及清除、文件不存在后的恢复、390px 目录与预览切换及焦点验证。11 个单元测试及构建通过；真实 DSH 使用前端 bundle 替换方式验证。发布包重新安装、完整读屏、200% 缩放和真实权限拒绝场景尚未验收。

DESIGN.md lint 为 0 errors、37 warnings：缺少通用 primary 键，另有 36 个主题快照颜色未被 frontmatter 组件引用。保留宿主浅色/深色语义命名，组件运行时引用宿主 CSS 变量，不为消除警告添加另一套品牌色。
