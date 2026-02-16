# core/layout 模块说明

## 1. 目标与范围

- 目标：提供行为树节点布局与对齐能力。
- 范围：`src/core/layout/auto-layout-utils.ts`、`alignment-utils.ts`

## 2. 依赖与入口

- 自动布局：`autoLayoutTree(nodes, edges, options)`
- 随机散列：`scatterNodes(...)`
- 对齐工具：`alignNodes(...)`
- 吸附与框选：`snapToGrid(...)`、`getNodesInSelectionBox(...)`

## 3. 核心概念

- `LayoutOptions`：控制方向、间距、层级布局参数。
- `AlignmentGuide`：对齐参考线信息。
- `SelectionBounds`：框选包围盒。

## 4. 关键流程

1. 用户触发自动布局或对齐。
2. 读取当前节点与边。
3. 计算目标位置并输出新节点集。
4. Store 更新后驱动画布重渲染。

## 5. 异常与边界

- 无根节点或孤立节点需要兜底策略。
- 大规模节点自动布局要控制时间复杂度。
- 对齐操作必须保持用户当前选择不丢失。

## 6. 与其他模块关系

- 画布调用方：`src/components/layout/composer-canvas.tsx`、`bt-canvas.tsx`
- 结构层：`src/core/store/treeState.ts`

## 7. 变更记录

- 2026-02：新增模块文档，补齐布局与对齐能力说明。
