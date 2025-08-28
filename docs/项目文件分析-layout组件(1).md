# BT Web Studio 项目文件分析 - Layout组件 (1)

本文档分析了项目中`src/components/layout/`目录下的前10个组件文件，包括它们的功能描述和使用状态。

## 1. auto-sizing-panel.tsx

- **功能描述**: 自动调整大小的面板组件，能根据内容自动调整面板尺寸。
  - 提供AutoSizingPanel组件，支持左右侧边栏的自动宽度调整
  - 支持手动调整大小和自动调整大小的切换
  - 可以根据内容宽度计算最优面板大小
- **使用状态**: 活跃使用中
- **依赖关系**: 
  - 依赖UI组件([resizable.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/resizable.tsx))
  - 依赖工具函数([utils.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/utils/utils.ts))

## 2. behavior-tree-editor.tsx

- **功能描述**: 行为树编辑器的主布局组件，整合了画布、节点库、属性面板等各个功能区域。
  - 提供完整的编辑器界面布局
  - 集成工具栏、节点库、属性面板、时间轴面板等组件
  - 实现执行控制、视图控制、节点拖拽等核心功能
- **使用状态**: 活跃使用中（作为编辑器主界面）
- **依赖关系**: 
  - 依赖布局组件([resizable-layout.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/layout/resizable-layout.tsx), [top-toolbar.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/layout/top-toolbar.tsx), [node-library-panel.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/layout/node-library-panel.tsx), [properties-panel.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/layout/properties-panel.tsx), [timeline-panel.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/layout/timeline-panel.tsx))
  - 依赖ReactFlow库
  - 依赖工具函数([utils.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/utils/utils.ts))

## 3. blackboard-key-selector.tsx

- **功能描述**: 黑板键选择器组件，用于选择和创建黑板变量。
  - 提供下拉选择黑板键的功能
  - 支持搜索黑板键
  - 支持创建新的黑板键
  - 显示黑板键的数据类型
- **使用状态**: 活跃使用中
- **依赖关系**: 
  - 依赖UI组件([select.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/select.tsx), [popover.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/popover.tsx), [command.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/command.tsx), [button.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/button.tsx), [input.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/input.tsx), [dialog.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/dialog.tsx))
  - 依赖状态管理([behavior-tree-store.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/store/behavior-tree-store.ts))
  - 依赖Lucide React图标库

## 4. bottom-timeline.tsx

- **功能描述**: 底部时间轴组件，用于显示和控制行为树执行的时间轴。
  - 提供时间轴面板的底部展示组件
  - 显示执行事件和时间轴控制按钮
  - 支持播放、暂停、停止、跳转等时间轴控制操作
- **使用状态**: 活跃使用中
- **依赖关系**: 
  - 依赖状态管理([behavior-tree-store.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/store/behavior-tree-store.ts))
  - 依赖国际化Hook([use-i18n.ts](file:///home/zwhy/workspace/bt-web-studio/src/hooks/use-i18n.ts))
  - 依赖布局组件([timeline-panel.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/layout/timeline-panel.tsx))

## 5. breakpoint-panel.tsx

- **功能描述**: 断点面板组件，用于管理调试断点，支持多种断点类型和条件断点配置。
  - 提供断点列表展示功能
  - 支持断点的启用/禁用、删除操作
  - 支持搜索和过滤断点
  - 显示断点统计信息
- **使用状态**: 活跃使用中
- **依赖关系**: 
  - 依赖UI组件([button.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/button.tsx), [input.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/input.tsx), [badge.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/badge.tsx), [scroll-area.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/scroll-area.tsx), [checkbox.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/checkbox.tsx))
  - 依赖状态管理([behavior-tree-store.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/store/behavior-tree-store.ts))
  - 依赖国际化Hook([use-i18n.ts](file:///home/zwhy/workspace/bt-web-studio/src/hooks/use-i18n.ts))
  - 依赖工具函数([utils.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/utils/utils.ts))
  - 依赖Lucide React图标库

## 6. bt-canvas.tsx

- **功能描述**: 通用的行为树画布组件，是编辑功能的核心，支持节点拖拽、连接、对齐和自动布局。
  - 提供ReactFlow画布实现
  - 支持节点拖拽、连接、删除、克隆等操作
  - 实现对齐辅助线、网格吸附、橡皮框选择等功能
  - 支持自动布局和散乱分布
  - 集成历史记录管理
- **使用状态**: 活跃使用中
- **依赖关系**: 
  - 依赖自定义节点组件([custom-nodes.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/canvas/custom-nodes.tsx))
  - 依赖状态管理([behavior-tree-store.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/store/behavior-tree-store.ts))
  - 依赖工具函数([history-utils.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/utils/history-utils.ts), [utils.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/utils/utils.ts))
  - 依赖布局工具([auto-layout-utils.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/layout/auto-layout-utils.ts), [alignment-utils.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/layout/alignment-utils.ts))
  - 依赖画布组件([alignment-guides.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/canvas/alignment-guides.tsx))
  - 依赖UI组件([context-menu.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/context-menu.tsx), [tooltip.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/tooltip.tsx), [button.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/button.tsx))
  - 依赖ReactFlow库
  - 依赖Toast通知Hook([use-toast.ts](file:///home/zwhy/workspace/bt-web-studio/src/hooks/use-toast.ts))
  - 依赖Lucide React图标库

## 7. collapsible-layout.tsx

- **功能描述**: 可折叠的布局组件，支持面板的展开和收起，并适配响应式布局。
  - 提供可折叠的三栏布局（左、中、右）
  - 支持移动端抽屉模式
  - 实现响应式布局调整
  - 支持键盘快捷键切换面板
- **使用状态**: 活跃使用中
- **依赖关系**: 
  - 依赖UI组件([button.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/button.tsx), [separator.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/separator.tsx), [resizable.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/resizable.tsx))
  - 依赖Hooks([use-mobile.tsx](file:///home/zwhy/workspace/bt-web-studio/src/hooks/use-mobile.tsx), [use-media-query.tsx](file:///home/zwhy/workspace/bt-web-studio/src/hooks/use-media-query.tsx), [use-i18n.ts](file:///home/zwhy/workspace/bt-web-studio/src/hooks/use-i18n.ts))
  - 依赖工具函数([utils.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/utils/utils.ts))
  - 依赖Lucide React图标库

## 8. composer-canvas-new.tsx

- **功能描述**: 专为编排模式设计的画布组件（新版本）。
  - 提供ReactFlow画布实现
  - 支持节点拖拽、连接等基本操作
  - 集成画布控制面板和信息面板
  - 支持撤销/重做功能
- **使用状态**: 活跃使用中
- **依赖关系**: 
  - 依赖节点组件([behavior-tree-node.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/nodes/behavior-tree-node.tsx), [control-sequence-node.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/nodes/control-sequence-node.tsx))
  - 依赖状态管理([behavior-tree-store.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/store/behavior-tree-store.ts))
  - 依赖工具函数([utils.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/utils/utils.ts))
  - 依赖国际化Hook([use-i18n.ts](file:///home/zwhy/workspace/bt-web-studio/src/hooks/use-i18n.ts))
  - 依赖UI组件([button.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/button.tsx))
  - 依赖ReactFlow库
  - 依赖Lucide React图标库

## 9. composer-canvas.tsx

- **功能描述**: 专为编排模式设计的画布组件。
  - 提供ReactFlow画布实现
  - 支持节点拖拽、连接等基本操作
  - 集成画布控制面板和信息面板
  - 支持撤销/重做功能
  - 特殊处理Root节点连接限制
- **使用状态**: 活跃使用中
- **依赖关系**: 
  - 依赖节点组件([behavior-tree-node.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/nodes/behavior-tree-node.tsx), [control-sequence-node.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/nodes/control-sequence-node.tsx))
  - 依赖状态管理([behavior-tree-store.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/store/behavior-tree-store.ts))
  - 依赖工具函数([utils.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/utils/utils.ts))
  - 依赖国际化Hook([use-i18n.ts](file:///home/zwhy/workspace/bt-web-studio/src/hooks/use-i18n.ts))
  - 依赖UI组件([button.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/button.tsx))
  - 依赖ReactFlow库
  - 依赖Lucide React图标库

## 10. composer-layout.tsx

- **功能描述**: 编排模式的完整布局，包含节点库、属性面板和编排画布。
  - 提供编排模式的三栏布局
  - 集成节点库面板和属性面板
  - 使用自动调整大小面板组件
  - 支持面板折叠和展开
- **使用状态**: 活跃使用中
- **依赖关系**: 
  - 依赖布局组件([node-library-panel.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/layout/node-library-panel.tsx), [auto-sizing-panel.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/layout/auto-sizing-panel.tsx), [composer-property-panel.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/layout/composer-property-panel.tsx), [composer-canvas.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/layout/composer-canvas.tsx))
  - 依赖状态管理([behavior-tree-store.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/store/behavior-tree-store.ts))
  - 依赖国际化Hook([use-i18n.ts](file:///home/zwhy/workspace/bt-web-studio/src/hooks/use-i18n.ts))
  - 依赖UI组件([resizable.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/resizable.tsx), [button.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/button.tsx))
  - 依赖工具函数([utils.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/utils/utils.ts))
  - 依赖Lucide React图标库