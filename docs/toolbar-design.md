# BT Web Studio 顶部工具栏设计规范 v1.0

本规范基于三模式（编辑/调试/回放）工作流，明确顶部工具栏的布局、模式适配、交互与实现要点，作为实现与验收的依据。

## 概述
- 目标：提供围绕行为树工作流的高效、简洁、模式感知的顶部工具栏。
- 范围：顶部栏的布局与功能显隐策略；“预览”栏目（树方向、显示密度）的交互与对接；移除顶部语言切换。

## 设计原则
- 模式驱动：左侧固定模式切换；右侧“功能特化区域”随模式变化显示。
- 聚焦核心：仅保留文件/连接/加载/预览/设置/帮助；移除顶部语言切换。
- 简洁一致：按钮风格统一；逻辑与交互跨模式一致。
- 可扩展：预留后续子项扩展，避免破坏现有布局。

## 整体布局
```
[三模式切换区]                          [功能特化区域]
[Logo][编辑][调试][回放]   ...   {[文件][连接][加载]}[预览][设置][帮助]
```
- 左侧：Logo + 三模式切换（编辑/调试/回放），使用 TabModeSelector。
- 右侧：功能特化区域，随模式显隐（见“模式适配规则”）。

## 模式适配规则
- 编辑模式（Composer）
  - 显示：文件、预览、设置、帮助
  - 隐藏：连接、加载
- 调试模式（Debug）
  - 显示：连接、预览、设置、帮助
  - 隐藏：文件、加载
- 回放模式（Replay）
  - 显示：加载、预览、设置、帮助
  - 隐藏：文件、连接
- 始终显示：预览、设置、帮助

注：隐藏=不渲染按钮；切换模式时立即更新右侧可见项。

## 功能特化区域规范

### 1) 文件（File）📁（仅编辑模式）
- 功能：项目/XML 管理入口
- 子项：
  - 导入 XML（BehaviorTree.CPP 标准，含校验与错误提示）
  - 导出 XML（标准格式、格式化输出）

### 2) 连接（Connection）🔗（仅调试模式）
- 功能：连接后端调试器（WebSocket）
- 子项：
  - 连接/断开
  - 连接状态显示（指示灯：红/黄/绿）
  - 连接配置（IP、端口、超时、协议版本）
- 说明：当前提供 UI 入口与状态占位；后端联动按调试计划接入。

### 3) 加载（Load）📋（仅回放模式）
- 功能：日志与 Groot 数据导入
- 子项：
  - 加载本地日志文件（大小/格式检查）
  - 导入 Groot 执行记录（格式校验与兼容性检查）
- 说明：当前提供入口；回放数据流与时间轴联动后续接入。

### 4) 预览（Preview）👁️（所有模式）
- 功能：视图显示与布局控制
- 子项：
  - 树方向切换：垂直布局 / 水平布局（即时切换，保持节点状态）
  - 显示密度：紧凑模式 / 宽松模式（节点间距与画布适配）
  - 视图选项（可选扩展）：网格、连接线、节点标签等开关
- 对接参数/事件：
  - treeDirection: 'vertical' | 'horizontal'
  - isCompactMode: boolean
  - onToggleTreeDirection(): void
  - onToggleCompactMode(): void

### 5) 设置（Settings）⚙️（所有模式）
- 功能：通用偏好设置入口（主题、快捷键、行为偏好等，后续扩展）

### 6) 帮助（Help）❓（所有模式）
- 功能：文档与信息入口
- 子项：
  - 用户手册（/docs/user-guide.md）
  - 仓库/协作指南（/AGENTS.md 或未来地址）
  - 快捷键说明
  - 关于/版本信息

## 交互规范
- 模式切换：
  - 点击编辑/调试/回放即切换模式；右侧功能按钮按规则显隐。
  - 切换时保持简单过渡，不阻塞主操作。
- 下拉菜单：
  - 功能按钮采用 Dropdown 菜单展开子项；点击项触发对应回调或弹窗。
- 文案与图标：
  - 使用简短中文标签；图标统一使用 lucide-react。
- 响应式：
  - 小屏优先显示关键功能；溢出项进入“更多”或折叠（可后续实现）。

## 技术实现

### 组件结构（当前）
- TopBar
  - 左侧：Logo + <TabModeSelector />
  - 右侧：按模式渲染 [File | Connection | Load] + [Preview] + [Settings] + [Help]
- 预览菜单：Button + DropdownMenu（两个切换项）

### 状态来源与依赖
- 当前模式：useCurrentMode()（来自 core/store/behavior-tree-store）
- 国际化：useI18n（仅文案，不在顶部提供语言切换）
- 预览状态：由上层（App）管理并以 props 传入 TopBar：
  - treeDirection, isCompactMode
  - onToggleTreeDirection, onToggleCompactMode

### 关键代码约定（示例）
- 模式可见性：
  - shouldShowFile = currentMode === 'composer'
  - shouldShowConnection = currentMode === 'debug'
  - shouldShowLoad = currentMode === 'replay'
- 预览菜单行为：
  - onToggleTreeDirection: vertical ↔ horizontal
  - onToggleCompactMode: true ↔ false

### 移除项
- 顶部语言切换器（LanguageSwitcher / TopBarLanguageSwitcher）不再出现在 TopBar 中。

## 与实现对齐（当前仓库）
- 文件：src/components/layout/top-bar.tsx 已按模式渲染功能按钮，并新增“预览”菜单。
- 预览对接：App 维护 treeDirection/isCompactMode，并把回调传给 TopBar。
- 构建与运行：npm run build 通过；npm run dev 可预览。

## 验收标准
- 构建通过，无 TypeScript 编译错误。
- 切换模式时，右侧功能显隐严格符合“模式适配规则”：
  - 编辑：显示“文件”，隐藏“连接/加载”
  - 调试：显示“连接”，隐藏“文件/加载”
  - 回放：显示“加载”，隐藏“文件/连接”
  - “预览/设置/帮助”全时可见
- 预览菜单可正常切换树方向与显示密度（触发对应回调）。
- 顶部不出现语言切换器。
- 文案为中文，图标清晰一致。

## 后续扩展（非本迭代）
- 连接与后端调试器的实际联动（状态灯、自动重连、配置持久化）。
- 文件/加载与具体弹窗或工作流联动。
- 预览项扩展（网格/连线/标签等）与画布联动。
- 小屏/溢出项的自适应折叠策略。