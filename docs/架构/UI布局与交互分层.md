# UI 布局与交互分层

## 1. 目标与范围

- 目标：定义布局容器、功能面板、画布组件之间的职责边界。
- 范围：`src/components/layout/*` 与模式相关 UI 交互。

## 2. 依赖与入口

- 顶层入口：`src/components/layout/mode-aware-layout.tsx`
- 公共框架：`resizable-layout.tsx`、`collapsible-layout.tsx`
- 模式布局：`composer-layout.tsx`、`debug-layout.tsx`、`replay-layout.tsx`

## 3. 分层模型

| 层级 | 典型文件 | 职责 |
|---|---|---|
| Shell 层 | `mode-aware-layout.tsx` | 路由/模式切换、整体容器 |
| 模式容器层 | `*-layout.tsx` | 组合左右面板、画布、底栏 |
| 功能面板层 | `*-toolbar.tsx`、`*-panel.tsx` | 面板交互与状态展示 |
| 渲染层 | `*-canvas.tsx`、`nodes/*` | 节点/边渲染与画布交互 |

## 4. 关键交互流程

1. 顶部工具栏触发操作（导入、连接、加载、预览）。
2. 模式容器分发动作到对应 slice。
3. 画布和面板订阅最小状态集合进行更新。
4. 底部时间轴在调试/回放模式下参与联动。

## 5. 异常与边界

- 布局组件不直接处理协议消息。
- 面板之间通过 store 协作，不直接互调组件内部方法。
- 模式独有组件不得反向依赖其他模式组件。

## 6. 与其他模块关系

- Store：[`状态管理与数据流.md`](./状态管理与数据流.md)
- 模式规格：`../模式/*.md`
- 共享组件规范：`../组件/*.md`

## 7. 变更记录

- 2026-02：明确 Shell/容器/面板/渲染四层划分。
