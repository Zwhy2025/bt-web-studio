# components/layout 模块说明

## 1. 目标与范围

- 目标：说明页面布局组件如何组合三模式 UI。
- 范围：`src/components/layout/*`

## 2. 依赖与入口

- 顶层模式容器：`mode-aware-layout.tsx`
- 模式布局：`composer-layout.tsx`、`debug-layout.tsx`、`replay-layout.tsx`
- 画布：`composer-canvas.tsx`、`debug-canvas.tsx`、`replay-canvas.tsx`
- 顶部与底部：`top-bar.tsx`、`bottom-timeline.tsx`
- 侧栏面板：`properties-panel.tsx`、`debug-logs-panel.tsx`、`breakpoint-panel.tsx`

## 3. 核心概念

- 布局容器：负责区域拆分与响应式行为。
- 功能面板：负责模式特定交互。
- 画布组件：负责节点渲染和交互。

## 4. 关键流程

1. 根据 `currentMode` 选择模式布局。
2. 模式布局装配左右侧栏、画布和时间轴。
3. 面板从 store 读取状态并触发 actions。
4. 画布接收节点/边和运行态渲染。

## 5. 异常与边界

- 布局组件避免直接处理协议细节。
- 同名组件（如 `breakpoint-panel`）需注意目录层级差异。
- 响应式断点变化要保证核心操作可达。

## 6. 与其他模块关系

- Store：`src/core/store/*`
- 调试通信：`src/core/debugger/*`
- 共享节点组件：`src/components/nodes/*`

## 7. 变更记录

- 2026-02：新增 layout 模块文档，明确 UI 组合职责。
