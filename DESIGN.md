---
name: DSH File Explorer
description: 继承 DeepSeek Harness 的紧凑工具界面设计系统
colors:
  light-bg-layer-1: 'rgb(255, 255, 255)'
  light-bg-layer-2: 'rgb(255, 255, 255)'
  light-bg-mask-1: 'rgba(0, 0, 0, 0.24)'
  light-label-primary: 'rgb(15, 17, 21)'
  light-label-secondary: 'rgb(97, 102, 107)'
  light-label-tertiary: 'rgb(129, 133, 140)'
  light-label-dimmed: 'rgb(225, 229, 238)'
  light-border-l2: 'rgba(0, 0, 0, 0.1)'
  light-border-l3: 'rgba(0, 0, 0, 0.12)'
  light-border-l4: 'rgba(0, 0, 0, 0.16)'
  light-interactive-bg-hover: 'rgba(38, 49, 72, 0.06)'
  light-interactive-bg-active: 'rgba(38, 49, 72, 0.1)'
  light-brand-primary: 'rgb(15, 17, 21)'
  light-button-primary-fill: 'rgb(15, 17, 21)'
  light-button-primary-hover: 'rgb(67, 69, 74)'
  light-label-primary-foreground: 'rgb(255, 255, 255)'
  light-button-info-fill: 'rgb(65, 118, 230)'
  light-state-error-primary: 'rgb(236, 19, 19)'
  dark-bg-layer-1: 'rgb(35, 35, 36)'
  dark-bg-layer-2: 'rgb(44, 44, 46)'
  dark-bg-mask-1: 'rgba(0, 0, 0, 0.5)'
  dark-label-primary: 'rgb(249, 250, 251)'
  dark-label-secondary: 'rgb(207, 211, 214)'
  dark-label-tertiary: 'rgb(173, 178, 184)'
  dark-label-dimmed: 'rgb(67, 69, 74)'
  dark-border-l2: 'rgba(255, 255, 255, 0.12)'
  dark-border-l3: 'rgba(255, 255, 255, 0.16)'
  dark-border-l4: 'rgba(255, 255, 255, 0.2)'
  dark-interactive-bg-hover: 'rgba(255, 255, 255, 0.08)'
  dark-interactive-bg-active: 'rgba(255, 255, 255, 0.14)'
  dark-brand-primary: 'rgb(249, 250, 251)'
  dark-button-primary-fill: 'rgb(249, 250, 251)'
  dark-button-primary-hover: 'rgb(235, 238, 242)'
  dark-label-primary-foreground: 'rgb(15, 17, 21)'
  dark-button-info-fill: 'rgb(103, 158, 254)'
  dark-state-error-primary: 'rgb(242, 90, 90)'
typography:
  title:
    fontSize: 16px
    lineHeight: 24px
    fontWeight: 500
  body:
    fontSize: 14px
    lineHeight: 22px
    fontWeight: 400
  directory-row:
    fontSize: 13px
    lineHeight: 20px
    fontWeight: 500
  compact:
    fontSize: 12px
    lineHeight: 18px
rounded:
  row: 6px
  input: 8px
  button-sm: 14px
  button-md: 18px
  modal: 24px
spacing:
  inline: 4px
  controls: 8px
  section: 16px
  panel: 24px
components:
  button-sm:
    height: 28px
    rounded: '{rounded.button-sm}'
    padding: 0 10px
  button-md:
    height: 36px
    rounded: '{rounded.button-md}'
    padding: 0 14px
  input:
    height: 32px
    rounded: '{rounded.input}'
    padding: 0 8px
  directory-row:
    height: 28px
    rounded: '{rounded.row}'
    padding: 4px
---

# Design System: DSH File Explorer

## Overview

**Creative North Star: "DSH 原生工具界面的延伸"**

文件抽屉服务于浏览工作区和阅读文件，采用紧凑、克制、内容优先的 DSH 设计语言。宿主设计是视觉权威；Impeccable 的通用字体、配色、圆角或装饰建议不得覆盖这套身份。

**Key Characteristics:**

- 使用宿主语义颜色和字体，随宿主浅色、深色主题变化。
- 用文字层级、对齐、轻分隔线与交互状态组织高密度内容。
- 优先使用 DSH primitives；Lucide 图标沿用当前插件约定。

来源：用户指定的 `../deepseek-harness` 本地源码，HEAD `d347e703908d0406b7a7ef80e3a0e594d86b2215`，提取日期 2026-09-08。此为源码提取基线。2026-09-08 已在真实隔离 DSH 中核对深浅主题表面、宿主字体及文件预览，并记录差异；未逐项验证全部 token，不宣称当前插件已全部符合。验证范围与工作流见 docs/design-workflow.md。

来源文件（相对于 deepseek-harness）：

- `packages/client/ui-theme/src/styles/design-platform.css`：浅色/深色语义颜色。
- `packages/client/ui-theme/src/styles/base.css`：字体与动效。
- `packages/client/ui-theme/src/styles/gradient-shadow-text.css`：层级和遮罩。
- `packages/client/ui-primitives/src/Button.module.css`、`Input.module.css`、`Modal.module.css`：原生控件。
- `packages/client/ui-directory-picker-browse/src/client/DirectoryBrowser.module.css`：目录行、路径与布局。

## Colors

**The Host Token Rule.** YAML 中 `light-*` / `dark-*` 是来源主题的解析快照，用于核对；运行时必须引用对应的 `--dsw-alias-*` CSS 变量。例如 `light-label-primary` 对应 `var(--dsw-alias-label-primary)`。不得将快照复制成插件固定配色，也不得覆盖宿主 body 上的主题变量。

宿主通过 `body[data-ds-dark-theme]` 切换深色主题。主内容使用 label-primary，次级信息使用 label-secondary，辅助图标/路径使用 label-tertiary。分隔线使用 border-l3，输入框边框使用 border-l4。hover 和 selected 分别使用 interactive-bg-hover / interactive-bg-active，不共用同一个状态色。

错误使用 state-error-primary；品牌焦点使用 brand-primary；信息强调使用 button-info-fill。插件不得继续新增 `--text-danger`、`--accent`、`--dsw-alias-border-default` 等未在该宿主基线确认的变量。

## Typography

界面字体继承 `var(--dsw-font-family)`；源码使用 `var(--ds-font-family-code)`。完整字体栈以宿主 base.css 为准，不加载网络字体，不用独立 system-ui 简写覆盖中文 fallback。

标题、正文、目录行和紧凑辅助文字使用 frontmatter 的对应角色。宿主将设计稿的 510 字重统一按 500 渲染。代码区当前 13px/1.7 是插件现状，不提升为宿主全局标准。

## Layout

**The Task Density Rule.** 保持标题、工具栏、目录树、路径与预览内容的清晰顺序。目录行参考宿主 28px 高度，图标不收缩，文件名允许省略并提供完整路径。长路径可换行或在所属区域滚动，不能挤掉关闭和主要操作。

宿主目录选择器使用 4px 行内间距、8px 控件间距、16px 区域间距和 24px 面板内边距。按组件来源应用，不机械要求每个局部值相同。

当前插件布局约束：右侧抽屉宽 `min(70vw,1120px)`，目录树 230px；760px 以下抽屉占满视口，目录与预览采用单栏切换：打开时显示全宽目录，选中文件后显示全宽预览并转移焦点，顶部“目录”可返回。这些是插件断点，不是 DSH 全局断点。已在真实 DSH 的 390px 视口验证，无页面横向溢出；200% 缩放尚未单独验证。

## Elevation & Depth

宿主使用轻描边、柔和阴影和表面色表达层级。浮层引用 `--dsw-elevation-prominent`，普通面板引用 `--dsw-elevation-panel`；遮罩使用 `--dsw-alias-bg-mask-1` 和 `--dsw-mask-blur`。不复制固定黑色遮罩和单主题阴影。

**The Surface Rule.** 根据宿主同类控件选择表面层级：基础面板 layer-1，Modal 浮层 layer-2。抽屉具体采用何种层级应结合真实宿主视觉确认。滚动表面的 scrollbar token 应与该层级匹配。

## Shapes

目录行、输入框、紧凑按钮、普通按钮、Modal 使用 frontmatter 中分别提取的圆角，不统一改为同一个圆角。Modal 的 24px 不直接推广为贴边抽屉的四角圆角。

## Components

### Buttons

优先复用 `@deepseek-ai/dsh-client-ui-primitives` 的 Button。默认 ghost，主要动作按语义使用 primary，描边使用 outline，工具栏可用 toolbar。图标通常 16px，折叠箭头在当前插件为 14px。按钮保留中文/英文标签或可访问名称，禁用态由原生组件处理。

### Inputs

宿主 Input 为 32px 高，8px 圆角，0.5px border-l4，focus-within 使用 brand-primary。占位符使用 label-dimmed。原生 input/select 的文字也需要继承宿主字体；优先复用现有组件，避免引入另一套组件库。

### Navigation

目录行使用透明底色、hover/active 独立状态；选中目录可结合展开图标和信息强调色表达。默认目录图标使用 label-secondary，箭头使用 label-tertiary。文件层级缩进、折叠和选中语义保持可识别。

### Syntax highlighting

复用宿主 `ui-theme/src/styles/shiki.css` 的 `--shiki-token-*` 颜色，以 `color-mix(in srgb, var(--shiki-token-*) 75%, var(--dsw-alias-label-primary))` 提高普通预览表面上的对比度。保持宿主色相和主题切换；这是一项插件可读性适配，不改写宿主 token。高亮选择器必须限定 `.dfe-drawer`。2026-09-08 实测浅色关键词、字符串、函数名对比度分别为 6.87、5.30、8.66。

### Overlay and preview

保持 Esc 关闭、焦点限制、关闭后恢复焦点及按钮操作。文件预览中的样式应限定在 `.dfe-*` 容器内，尤其语法高亮不得污染宿主。浅色/深色代码高亮都需验证。保留加载、空目录、读取错误、长文件名与超限状态。

## Do's and Don'ts

### Do

- Do 优先服从宿主设计与已确认的用户要求。
- Do 使用宿主变量、原生控件和可追踪的来源值。
- Do 在真实 DSH 中核对浅色、深色、窄屏、键盘及真实文件内容。

### Don't

- Don't 为符合通用审美建议换字体、发明品牌色或加入装饰性渐变。
- Don't 将单个组件的尺寸误称为整个宿主的统一标准。
- Don't 将源码扫描或文档 lint 通过描述为视觉/E2E 验证通过。
