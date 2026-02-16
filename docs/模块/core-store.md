# core/store 模块说明

## 1. 目标与范围

- 目标：统一管理 BT Web Studio 的会话、树结构、模式与调试状态。
- 范围：`src/core/store/*`

## 2. 依赖与入口

- 主 store：`behavior-tree-store.ts`
- 类型：`behavior-tree-types.ts`
- 关键 slices：
  - `sessionState.ts`
  - `treeState.ts`
  - `workflowModeState.ts`
  - `composerModeState.ts`
  - `debugModeState.ts` / `debuggerState.ts`
  - `replayModeState.ts` / `timelineState.ts`
  - `blackboardState.ts` / `uiState.ts`

## 3. 核心概念与接口

- `BehaviorTreeState`：所有 slice 的组合状态。
- Selector Hooks：`useCurrentMode`、`useNodes`、`useDebugActions` 等。
- Action 约束：模式切换与树编辑行为分层，避免跨域写入。

## 4. 关键流程

1. 组件通过 selector 订阅最小状态。
2. 组件通过 actions 触发状态变更。
3. 调试消息经 `debuggerState` 落到树状态和执行事件。
4. 回放驱动经 `timelineState` 投影当前时间片。

## 5. 异常与边界

- 同一状态不在多个 slice 重复持有。
- 高频事件更新使用批处理或节流。
- reset 操作需区分“模式内重置”与“全局会话重置”。

## 6. 与其他模块关系

- 调试通信：`src/core/debugger/*`
- 结构处理：`src/core/bt/*`
- UI 层：`src/components/layout/*`

## 7. 变更记录

- 2026-02：文档化各 slice 职责，替代旧版“工作流重构”中的分散描述。
