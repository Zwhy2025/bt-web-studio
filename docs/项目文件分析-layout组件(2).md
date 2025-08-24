# BT Web Studio 项目文件分析 - Layout组件 (2)

本文档分析了项目中`src/components/layout/`目录下的后10个组件文件，包括它们的功能描述和使用状态。

## 1. composer-property-panel.tsx

- **功能描述**: 编排模式下的属性面板组件，用于显示和编辑选中节点的属性。
  - 提供节点属性编辑功能
  - 支持多种属性类型编辑（字符串、数字、布尔值、选择框、数组等）
  - 集成端口配置面板和黑板键选择器
  - 支持模型驱动的配置面板
  - 显示节点验证错误和警告
  - 提供撤销/重做、复制、删除等操作按钮
- **使用状态**: 活跃使用中
- **依赖关系**: 
  - 依赖UI组件([input.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/input.tsx), [label.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/label.tsx), [button.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/button.tsx), [badge.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/badge.tsx), [card.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/card.tsx), [scroll-area.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/scroll-area.tsx), [tabs.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/tabs.tsx), [textarea.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/textarea.tsx), [switch.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/switch.tsx), [select.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/select.tsx), [separator.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/separator.tsx), [accordion.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/accordion.tsx), [alert.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/alert.tsx))
  - 依赖状态管理([behavior-tree-store.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/store/behavior-tree-store.ts))
  - 依赖国际化Hook([use-i18n.ts](file:///home/zwhy/workspace/bt-web-studio/src/hooks/use-i18n.ts))
  - 依赖自定义Hook([use-node-validation.ts](file:///home/zwhy/workspace/bt-web-studio/src/hooks/use-node-validation.ts), [use-keyboard-shortcuts.ts](file:///home/zwhy/workspace/bt-web-studio/src/hooks/use-keyboard-shortcuts.ts))
  - 依赖布局组件([ports-config-panel.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/layout/ports-config-panel.tsx), [blackboard-key-selector.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/layout/blackboard-key-selector.tsx), [model-driven-config-panel.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/layout/model-driven-config-panel.tsx))
  - 依赖类型定义([extended-node-types.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/types/extended-node-types.ts))
  - 依赖工具函数([utils.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/utils/utils.ts))
  - 依赖Lucide React图标库

## 2. composer-toolbar.tsx

- **功能描述**: 编排模式专属的工具栏组件。
  - 提供编排模式下的工具选择（选择工具、平移工具、连接工具、删除工具）
  - 实现撤销/重做功能
  - 支持复制、剪切、粘贴操作
  - 集成工具提示功能
- **使用状态**: 活跃使用中
- **依赖关系**: 
  - 依赖UI组件([button.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/button.tsx), [separator.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/separator.tsx), [tooltip.tsx](file:///home/zwhy/workspace/bt-web-studio/src/components/ui/tooltip.tsx))
  - 依赖状态管理([behavior-tree-store.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/store/behavior-tree-store.ts))
  - 依赖类型定义([composerModeState.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/store/composerModeState.ts))
  - 依赖国际化Hook([use-i18n.ts](file:///home/zwhy/workspace/bt-web-studio/src/hooks/use-i18n.ts))
  - 依赖工具函数([utils.ts](file:///home/zwhy/workspace/bt-web-studio/src/core/utils/utils.ts))
  - 依赖Lucide React图标库

## 3. debug-canvas.tsx

- **功能描述**: 专为调试模式设计的画