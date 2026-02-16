# core/debugger 模块说明

## 1. 目标与范围

- 目标：封装调试连接、消息收发与断点管理能力。
- 范围：`src/core/debugger/*` 与代理通信相关逻辑。

## 2. 依赖与入口

- WebSocket 客户端：`real-websocket-client.ts`
- 断点管理：`breakpoint-manager.ts`
- 代理服务：`scripts/proxy.py`

## 3. 核心概念与数据结构

- `DebuggerMessage`：`type` + `payload` + `replyTo`。
- `Breakpoint`：节点 ID、触发类型、命中计数、条件。
- `DebugSessionState`：`stopped/running/paused/stepping`。

## 4. 关键流程

1. `RealWebSocketClient.connect()` 建立连接。
2. 建连后请求初始数据：`getTree`、`getStatus`、`getBlackboard`。
3. 订阅 `N` 主题接收断点命中。
4. 通过 `BreakpointManager` 维护本地断点并与后端命令联动。

## 5. 异常与边界

- 消息解析失败需触发 `onError` 回调，不中断主线程。
- 后端不支持的命令由代理返回 `error`，前端应降级。
- 断点条件表达式评估只能作为辅助，不可当作安全沙箱。

## 6. 与其他模块关系

- Store 消费：`src/core/store/debuggerState.ts`
- 协议规范：`../协议/Groot2-协议总览.md`
- 调试 UI：`src/components/layout/debug-*.tsx`

## 7. 变更记录

- 2026-02：新增模块文档并补齐代理层关系说明。
