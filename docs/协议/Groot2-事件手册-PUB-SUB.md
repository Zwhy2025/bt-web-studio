# Groot2 事件手册（PUB/SUB）

## 1. 目标与范围

- 目标：说明异步事件主题与前端订阅行为。
- 范围：原生 ZMQ PUB/SUB 与项目 WebSocket 事件桥接。

## 2. 原生主题

| 主题 | 含义 | 数据体 |
|---|---|---|
| `N` | BREAKPOINT_REACHED | 命中节点 UID（字符串） |

备注：不同后端版本可能扩展其他主题；当前项目已验证 `N`。

## 3. WebSocket 桥接

在 `scripts/proxy.py` 中：

- 客户端发送：

```json
{ "type": "subscribe", "payload": { "topic": "N" } }
```

- 代理成功响应：

```json
{ "type": "subscribed", "payload": { "topic": "N" } }
```

- 断点命中转发：

```json
{ "type": "breakpointReached", "payload": { "nodeId": "256" } }
```

## 4. 关键流程

1. 客户端建立 WebSocket 连接。
2. 发送 `subscribe` 订阅主题。
3. 后端 PUB 推送主题消息。
4. 代理转换成 WebSocket JSON 事件。
5. `debuggerState` 更新当前执行态并触发 UI。

## 5. 异常与边界

- 未订阅主题时不会接收对应事件。
- 断开连接后需要重新订阅。
- 事件延迟与丢包由网络与后端发布策略决定，前端需容忍短时不一致。

## 6. 关联文档

- 协议总览：[`Groot2-协议总览.md`](./Groot2-协议总览.md)
- 状态流：[`../架构/状态管理与数据流.md`](../架构/状态管理与数据流.md)

## 7. 变更记录

- 2026-02：从原协议大文档抽出异步事件独立说明。
