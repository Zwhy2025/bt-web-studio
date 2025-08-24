# BT Web Studio 项目文件分析文档指引

本文档旨在通过分析BT Web Studio项目中各个文件的功能和使用状态，帮助开发人员清晰地理解项目结构、核心逻辑及组件功能。你需要根据简短描述对每个文件进行深度概况 请自行拆分todolist

## 1. 根目录文件 (`/src/`)

此目录包含应用的最顶层配置文件和入口文件。

-   **`app.tsx`**
    -   **功能描述**: 应用主入口组件，负责整个应用的整体布局和顶层状态管理，包含顶部栏、模式感知布局、导入导出对话框等核心UI组件。
    -   **使用状态**: 活跃使用中。
-   **`main.tsx`**
    -   **功能描述**: React应用的启动入口文件，负责初始化React根节点、国际化(i18n)库以及全局主题。
    -   **使用状态**: 活跃使用中。
-   **`layout.tsx`**
    -   **功能描述**: 应用的根布局文件，定义了HTML文档的基本结构（如`<html>`和`<body>`），并包裹了主题提供者(Theme Provider)。
    -   **使用状态**: 活跃使用中。
-   **`config.ts`**
    -   **功能描述**: 全局配置文件，用于存储例如调试器WebSocket的URL等需要统一管理的配置项。
    -   **使用状态**: 活跃使用中。
-   **`globals.css`**
    -   **功能描述**: 全局样式入口文件，负责导入项目所有的样式文件并定义基础的全局样式。
    -   **使用状态**: 活跃使用中。

## 2. 核心逻辑 (`/src/core/`)

此目录封装了应用的核心业务逻辑、状态管理和工具函数。

### 2.1 行为树核心 (`/core/bt/`)

处理行为树（Behavior Tree）的解析、布局、状态管理等核心功能。

-   **`unified-behavior-tree-manager.ts`**
    -   **功能描述**: 统一的行为树管理器，是BT核心功能的总调度者，负责管理树的解析、布局、运行时状态、子树管理及缓存机制。
    -   **使用状态**: 活跃使用中。
-   **`xml-parser.ts`**
    -   **功能描述**: XML解析器，负责将行为树的XML数据结构解析成应用内部所需的数据格式。
    -   **使用状态**: 活跃使用中。
-   **`global-xml-processor.ts`**
    -   **功能描述**: 全局XML处理器，采用单例模式提供统一的XML解析和生成接口，管理XML处理的全局状态。
    -   **使用状态**: 活跃使用中。
-   **`behavior-tree-layout.ts`**
    -   **功能描述**: 行为树布局算法，实现分层布局，确保父子节点之间有清晰的层级关系，用于画布的自动布局。
    -   **使用状态**: 活跃使用中。
-   **`node-state-manager.ts`**
    -   **功能描述**: 节点状态管理器，用于跟踪和管理行为树中每个节点的执行状态（如IDLE, RUNNING, SUCCESS），支持历史记录和状态订阅。
    -   **使用状态**: 活跃使用中。
-   **`subtree-mock-generator.ts`**
    -   **功能描述**: 子树模拟事件生成器，当导入一个子树时，为其生成模拟的执行事件，方便调试和预览。
    -   **使用状态**: 活跃使用中。
-   **`xml-utils.ts`**
    -   **功能描述**: XML工具函数集合，提供XML解析和生成的辅助函数，包含节点类型映射和格式化等功能。
    -   **使用状态**: 活跃使用中。

### 2.2 调试器 (`/core/debugger/`)

负责与后端调试器进行通信和断点管理。

-   **`real-websocket-client.ts`**
    -   **功能描述**: WebSocket客户端实现，负责与调试器后端建立和管理实时通信，处理消息的发送、接收和连接状态。
    -   **使用状态**: 活跃使用中。
-   **`breakpoint-manager.ts`**
    -   **功能描述**: 断点管理器，负责管理调试过程中的所有断点，包括断点的添加、移除、触发逻辑，并支持条件断点。
    -   **使用状态**: 活跃使用中。

### 2.3 布局算法 (`/core/layout/`)

提供画布布局相关的计算和工具。

-   **`auto-layout-utils.ts`**
    -   **功能描述**: 自动布局工具函数，提供树形结构和散乱分布的自动布局算法。
    -   **使用状态**: 活跃使用中。
-   **`alignment-utils.ts`**
    -   **功能描述**: 对齐工具函数，提供节点在画布上的对齐辅助功能，如网格吸附、对齐参考线计算和橡皮框选择。
    -   **使用状态**: 活跃使用中。

### 2.4 状态管理 (`/core/store/`)

使用Zustand进行全局状态管理，按功能模块划分。

-   **`behavior-tree-store.ts`**
    -   **功能描述**: Zustand状态管理的主入口，整合了应用中所有的状态切片(slice)，提供统一的状态访问接口。
    -   **使用状态**: 活跃使用中。
-   **`workflowModeState.ts`**
    -   **功能描述**: 工作流模式状态管理，负责处理编排、调试、回放三种模式之间的状态切换和数据保存。
    -   **使用状态**: 活跃使用中。
-   **`sessionState.ts`**
    -   **功能描述**: 会话状态管理，处理项目会话的创建、切换和管理。
    -   **使用状态**: 活跃使用中。
-   **`treeState.ts`**
    -   **功能描述**: 行为树状态管理，包含画布中的节点、边以及节点的选择状态等。
    -   **使用状态**: 活跃使用中。
-   **`composerModeState.ts`**
    -   **功能描述**: 编排模式状态管理，包含该模式下的工具选择、视图选项等状态。
    -   **使用状态**: 活跃使用中。
-   **`debugModeState.ts`**
    -   **功能描述**: 调试模式状态管理，包含调试会话、执行控制、断点等相关状态。
    -   **使用状态**: 活跃使用中。
-   **`debuggerState.ts`**
    -   **功能描述**: 调试器底层状态管理，负责处理调试器的连接状态、断点数据和执行状态。
    -   **使用状态**: 活跃使用中。
-   **`replayModeState.ts`**
    -   **功能描述**: 回放模式状态管理，包含回放会话、时间轴控制和事件管理等状态。
    -   **使用状态**: 活跃使用中。
-   **`timelineState.ts`**
    -   **功能描述**: 时间轴状态管理，处理执行事件、时间轴当前位置和回放控制状态。
    -   **使用状态**: 活跃使用中。
-   **`blackboardState.ts`**
    -   **功能描述**: 黑板状态管理，处理行为树黑板变量的存储和更新。
    -   **使用状态**: 活跃使用中。
-   **`uiState.ts`**
    -   **功能描述**: UI界面状态管理，处理界面元素的显示设置，如小地图、网格的可见性等。
    -   **使用状态**: 活跃使用中。

### 2.5 工具函数 (`/core/utils/`)

-   **`history-utils.ts`**
    -   **功能描述**: 操作历史管理工具，为应用提供撤销(Undo)和重做(Redo)功能。
    -   **使用状态**: 活跃使用中。
-   **`utils.ts`**
    -   **功能描述**: 通用工具函数集合，包含如`clsx`或`cn`之类的类名合并等常用函数。
    -   **使用状态**: 活跃使用中。

### 2.6 类型定义 (`/core/types/`)

-   **`extended-node-types.ts`**
    -   **功能描述**: 扩展节点类型定义文件，包含了端口配置和节点模型的TypeScript类型定义。
    -   **使用状态**: 活跃使用中。

## 3. 组件 (`/src/components/`)

此目录包含项目中所有的React组件。

### 3.1 顶层组件 (`/components/`)

直接位于`/components`目录下的通用或核心功能组件。

-   **`blackboard-panel.tsx`**: 黑板面板组件，用于管理和显示行为树的黑板变量。
-   **`breakpoint-panel.tsx`**: 断点面板组件，用于管理调试断点，支持多种断点类型和条件断点配置。
-   **`debug-panel.tsx`**: 调试面板组件，显示调试信息和控制选项。
-   **`debug-toolbar.tsx`**: 调试工具栏组件，提供调试连接、执行控制等功能。
-   **`interactive-timeline.tsx`**: 交互式时间轴组件，是回放模式的核心，支持事件可视化、时间控制、缩放平移等交互功能。
-   **`language-switcher.tsx`**：语言切换组件，支持多语言切换。
-   **`mode-selector.tsx`**: 模式选择器组件，实现编排、调试、回放模式的切换功能，支持标签页、按钮等不同样式。
-   **`node-info-panel.tsx`**: 节点信息面板，用于显示当前选中节点的详细信息。
-   **`port-visualization-panel.tsx`**: 端口可视化面板，显示节点的端口信息。
-   **`right-inspector.tsx`**: 右侧检查器面板容器，整合了调试、断点、黑板等多个功能面板。
-   **`tab-bar.tsx`**: 标签栏组件，用于管理多个文件或会话标签页。
-   **`theme-provider.tsx`**: 主题提供者组件，为应用提供主题切换的能力。
-   **`theme-toggle.tsx`**: 主题切换按钮组件，支持明/暗主题切换。
-   **`timeline-controller.tsx`**: 时间轴控制器组件，控制回放时间轴的播放、暂停、跳转等功能。
-   **`xml-dialog.tsx`**: XML导入/导出对话框组件，支持文件操作和内容编辑。

### 3.2 动画组件 (`/components/animations/`)

-   **`mode-transitions.tsx`**
    -   **功能描述**: 模式切换动画组件，提供淡入、滑动、缩放等多种动画效果，包含模式过渡包装器、加载过渡、面板过渡等组件，提升模式切换时的用户体验。
    -   **使用状态**: 活跃使用中。

### 3.3 画布组件 (`/components/canvas/`)

与画布（Canvas）内部元素相关的组件。

-   **`custom-nodes.tsx`**
    -   **功能描述**: 自定义节点组件的核心实现，通过统一的`UnifiedNode`组件，支持动作、条件、控制、装饰器、子树等不同类型的行为树节点渲染。
    -   **使用状态**: 活跃使用中。
-   **`alignment-guides.tsx`**
    -   **功能描述**: 对齐辅助线组件，在画布上提供节点对齐的参考线、网格吸附指示器、橡皮框选择器等可视化辅助功能。
    -   **使用状态**: 活跃使用中。

### 3.4 节点组件 (`/components/nodes/`)

定义了不同模式下节点的具体表现。

-   **`behavior-tree-node.tsx`**: 编排模式下的基础行为树节点组件，支持`IDLE`, `RUNNING`, `SUCCESS`, `FAILURE`, `ERROR`等多种状态的可视化。
-   **`debug-behavior-tree-node.tsx`**: 调试模式下的行为树节点组件，额外包含了断点、执行状态等调试相关的可视化功能。
-   **`replay-behavior-tree-node.tsx`**: 回放模式下的行为树节点组件，用于显示节点的历史执行状态和相关事件。
-   **`control-sequence-node.tsx`**: 控制序列节点组件，专用于控制类型（如Sequence, Selector）节点的特定实现和显示。

### 3.5 布局组件 (`/components/layout/`)

负责应用整体及各功能区域的布局结构。

-   **`behavior-tree-editor.tsx`**: 行为树编辑器的主布局组件，整合了画布、节点库、属性面板等各个功能区域。
-   **`mode-aware-layout.tsx`**: 模式感知布局组件，是模式切换的核心，能根据当前激活的模式（编排、调试、回放）动态加载并显示对应的布局。
-   **`composer-layout.tsx`**: 编排模式的完整布局，包含节点库、属性面板和编排画布。
-   **`debug-layout.tsx`**: 调试模式的布局结构。
-   **`replay-layout.tsx`**: 回放模式的布局结构。
-   **`bt-canvas.tsx`**: 通用的行为树画布组件，是编辑功能的核心，支持节点拖拽、连接、对齐和自动布局。
-   **`composer-canvas.tsx`**: 专为编排模式设计的画布。
-   **`debug-canvas.tsx`**: 专为调试模式设计的画布，支持断点和执行状态的可视化。
-   **`replay-canvas.tsx`**: 专为回放模式设计的画布，支持事件回放和历史状态的可视化。
-   **`top-bar.tsx`**: 应用顶部栏组件，包含模式切换、文件操作（导入/导出）、预览设置等全局功能。
-   **`top-toolbar.tsx`**: 应用顶部工具栏，提供执行控制、视图控制（缩放、适应屏幕）、连接状态等常用工具。
-   **`composer-toolbar.tsx`**: 编排模式专属的工具栏。
-   **`debug-toolbar.tsx`**: 调试模式专属的工具栏（layout版本）。
-   **`replay-toolbar.tsx`**: 回放模式专属的工具栏。
-   **`resizable-layout.tsx`**: 可调整大小的布局组件，支持左右或上下拖动调整面板尺寸。
-   **`collapsible-layout.tsx`**: 可折叠的布局组件，支持面板的展开和收起，并适配响应式布局。
-   **`auto-sizing-panel.tsx`**: 自动调整大小的面板组件，能根据内容自动调整面板尺寸。
-   **`left-palette.tsx`**: 左侧面板组件，包含节点库的轻量级实现。
-   **`node-library-panel.tsx`**: 功能完整的节点库面板组件，提供可拖拽的节点类型列表。
-   **`properties-panel.tsx`**: 属性面板组件，用于显示和编辑选中节点的属性。
-   **`model-driven-config-panel.tsx`**: 模型驱动的配置面板，提供基于预定义模型的配置功能。
-   **`ports-config-panel.tsx`**: 端口配置面板，用于配置节点的输入输出端口。
-   **`debug-logs-panel.tsx`**: 调试日志面板，用于显示调试过程中产生的日志信息。
-   **`timeline-panel.tsx`**: 时间轴面板，用于展示时间轴信息。
-   **`timeline-controller.tsx`**: 时间轴控制器（layout版本），集成在布局中控制回放。
-   **`function-tabs.tsx`**: 功能标签页组件，提供帮助等辅助功能。

### 3.6 UI 库 (`/components/ui/`)

基于`shadcn/ui`的原子UI组件库，提供统一风格的基础控件。

-   **通用组件**: `accordion.tsx`, `alert.tsx`, `alert-dialog.tsx`, `aspect-ratio.tsx`, `avatar.tsx`, `badge.tsx`, `breadcrumb.tsx`, `button.tsx`, `card.tsx`, `collapsible.tsx`, `dialog.tsx`, `separator.tsx`, `skeleton.tsx`, `sidebar.tsx`, `slider.tsx`, `switch.tsx`, `table.tsx`, `tabs.tsx`, `textarea.tsx`, `toggle.tsx`, `toggle-group.tsx`, `tooltip.tsx`
-   **表单与输入**: `checkbox.tsx`, `form.tsx`, `input.tsx`, `input-otp.tsx`, `label.tsx`, `radio-group.tsx`, `select.tsx`
-   **导航与菜单**: `command.tsx`, `context-menu.tsx`, `dropdown-menu.tsx`, `menubar.tsx`, `navigation-menu.tsx`, `pagination.tsx`
-   **浮层与提示**: `drawer.tsx`, `hover-card.tsx`, `popover.tsx`, `sheet.tsx`, `sonner.tsx` (通知), `toast.tsx`, `toaster.tsx`
-   **特殊组件**: `calendar.tsx`, `carousel.tsx`, `chart.tsx`, `progress.tsx`, `resizable.tsx`, `scroll-area.tsx`
-   **相关 Hooks**: `use-toast.ts`, `use-mobile.tsx`

## 4. Hooks (`/src/hooks/`)

存放自定义的React Hooks，用于封装可复用的逻辑。

-   **`use-i18n.ts`**: 国际化Hook，提供多语言文本获取和格式化功能。
-   **`use-keyboard-shortcuts.ts`**: 键盘快捷键Hook，处理属性面板等相关的快捷键操作。
-   **`use-media-query.tsx`**: 媒体查询Hook，用于实现响应式设计。
-   **`use-node-validation.ts`**: 节点校验Hook，提供节点配置的实时校验逻辑。
-   **`use-root-node-handler.ts`**: Root节点处理器Hook，封装了针对行为树根节点的特殊处理逻辑。
-   **`use-toast.ts`**: Toast通知Hook，提供便捷的消息提示功能（业务逻辑层）。

## 5. 国际化 (`/src/i18n/`)

管理多语言支持。

-   **`index.ts`**: i18n配置文件，负责初始化`i18next`库和配置语言资源。
-   **`/locales/en/*.json`**: 英文语言包，包含各模块的英文翻译文本。
-   **`/locales/zh/*.json`**: 中文语言包，包含各模块的中文翻译文本。

## 6. 样式 (`/src/styles/`)

存放项目的全局和组件级别CSS样式文件。

-   **`dark-theme-enhancements.css`**: 深色主题增强样式，优化各组件在深色模式下的显示效果。
-   **`mode-themes.css`**: 模式特定主题样式，为编排、调试、回放三种模式提供专用样式。
-   **`mode-droplet.css`**: 模式切换时的水滴动画样式。
-   **`mode-wave.css`**: 模式切换时的波纹动画样式。