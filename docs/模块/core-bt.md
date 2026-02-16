# core/bt 模块说明

## 1. 目标与范围

- 目标：承载行为树结构解析、运行态管理、子树处理与布局输入输出。
- 范围：`src/core/bt/*`

## 2. 依赖与入口

- `xml-parser.ts`：XML -> `BehaviorTreeNode/Edge`
- `xml-utils.ts`：XML 解析、生成、格式化
- `global-xml-processor.ts`：全局 XML 处理器与缓存
- `unified-behavior-tree-manager.ts`：统一管理器（解析、布局、子树导入）
- `node-state-manager.ts`：节点运行状态与执行历史
- `subtree-expansion.ts` / `subtree-mock-generator.ts`：子树展开与模拟
- `behavior-tree-layout.ts`：行为树布局计算

## 3. 核心概念与数据结构

- `BehaviorTreeData`：结构化树定义。
- `BehaviorTreeRuntimeData`：运行时状态与历史。
- `NodeStatus`：`idle/running/success/failure/skipped`。
- `NodeExecutionEvent`：节点状态变更事件。

## 4. 关键流程

1. 导入 XML：`parseXML` 或 `parseXMLUnified`。
2. 标准化节点：`import-normalizer.ts`。
3. 应用布局：`applyBehaviorTreeLayout` / `applyLayoutUnified`。
4. 运行时更新：`nodeStateManager.updateNodeStatus`。

## 5. 异常与边界

- 非法 XML 或缺失根节点时返回错误，不直接覆盖现有树。
- 子树导入需要避免 ID 冲突。
- 执行历史体量大时需要清理策略。

## 6. 与其他模块关系

- Store：`src/core/store/treeState.ts`
- 布局算法：`src/core/layout/*`
- UI 消费：`src/components/layout/*-canvas.tsx`

## 7. 变更记录

- 2026-02：新增模块级文档并明确解析/运行态边界。
