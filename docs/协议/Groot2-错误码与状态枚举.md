# Groot2 错误码与状态枚举

## 1. 目标与范围

- 目标：统一调试状态、节点状态、错误响应格式定义。
- 范围：协议层状态值、前端映射、异常处理建议。

## 2. 错误响应格式

当命令失败时，后端常返回两帧：

1. 第一帧：`error`
2. 第二帧：UTF-8 错误消息

代理层会转发为：

```json
{ "type": "error", "replyTo": "getStatus", "payload": { "message": "..." } }
```

## 3. 节点状态码（协议侧）

| 数值 | 语义 |
|---|---|
| `0` | IDLE |
| `1` | RUNNING |
| `2` | SUCCESS |
| `3` | FAILURE |
| `10` | IDLE_FROM_SUCCESS（兼容值） |
| `11` | IDLE_FROM_FAILURE（兼容值） |
| `12` | IDLE_FROM_RUNNING（兼容值） |

备注：前端 `debuggerState.ts` 当前核心映射使用 `0/1/2/3`，其余值默认回退为 `IDLE`。

## 4. 前端状态枚举（项目内）

- 节点状态：`src/core/bt/node-state-manager.ts`
  - `idle`、`running`、`success`、`failure`、`skipped`
- 调试会话：`src/core/store/debugModeState.ts`
  - `disconnected`、`connecting`、`connected`、`error`
- 执行状态：`src/core/store/debugModeState.ts`
  - `idle`、`running`、`paused`、`stepping`、`stopped`

## 5. 异常处理建议

- 命令失败：UI 弹出简要错误，日志面板保留详细 `replyTo` 信息。
- 未识别状态码：记录 warning，渲染为中性状态。
- 连续错误：触发重连建议并保留最近一次可用快照。

## 6. 关联文档

- 命令：[`Groot2-命令手册-REQ-REP.md`](./Groot2-命令手册-REQ-REP.md)
- 事件：[`Groot2-事件手册-PUB-SUB.md`](./Groot2-事件手册-PUB-SUB.md)

## 7. 变更记录

- 2026-02：独立错误与状态枚举文档，减少命令文档冗余。
