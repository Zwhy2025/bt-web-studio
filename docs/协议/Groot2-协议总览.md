# Groot2 协议总览

## 1. 目标与范围

- 目标：统一说明 BT Web Studio 与 BehaviorTree.CPP/Groot2 的通信边界。
- 范围：传输层、消息头、命令族、事件族、项目代理层。
- 非目标：替代后端源码与第三方官方文档。

## 2. 依赖与入口

- 官方参考：
  - https://github.com/BehaviorTree/BehaviorTree.CPP
  - https://www.behaviortree.dev/docs/intro
  - https://www.behaviortree.dev/groot/
- 本项目代理：`scripts/proxy.py`
- 前端客户端：`src/core/debugger/real-websocket-client.ts`
- 联调脚本：`tests/zmq_batch_test.py`、`tests/proxy_batch_test.py`

## 3. 核心概念

### 3.1 传输模型

- 原生协议：ZeroMQ
  - REQ/REP：同步命令（查询、设置、控制）
  - PUB/SUB：异步通知（如断点命中）
- 项目内适配：WebSocket 代理将浏览器消息转成 ZMQ 帧。

### 3.2 默认端口

- REQ/REP：`1667`
- PUB/SUB：`1668`
- WebSocket 代理：`8080`（默认）

### 3.3 消息头

- 请求头：6 字节（`protocol` + `type` + `unique_id`）
- 回复头：22 字节（请求头回显 + `tree_id` UUID）

## 4. 协议分册

- 命令手册（REQ/REP）：[`Groot2-命令手册-REQ-REP.md`](./Groot2-命令手册-REQ-REP.md)
- 事件手册（PUB/SUB）：[`Groot2-事件手册-PUB-SUB.md`](./Groot2-事件手册-PUB-SUB.md)
- 错误与状态枚举：[`Groot2-错误码与状态枚举.md`](./Groot2-错误码与状态枚举.md)
- 实现示例：[`Groot2-实现示例.md`](./Groot2-实现示例.md)

## 5. 项目代理层约定（WebSocket）

WebSocket 命令类型与代理行为（`scripts/proxy.py`）：

| WebSocket `type` | 转发协议命令 | 典型响应 `type` |
|---|---|---|
| `getTree` | `T` | `treeData` |
| `getStatus` | `S` | `statusUpdate` |
| `getBlackboard` | `B` | `blackboardUpdate` |
| `getHooks` | `D` | `hooksDump` |
| `setBreakpoint` | `I` | `breakpointSet` |
| `removeBreakpoint` | `R` | `breakpointRemoved` |
| `unlockBreakpoint` | `U` | `breakpointUnlocked` |
| `start`/`pause`/`stop`/`step` | `>` / `p` / `O` / `s` | `execution*` |
| `subscribe` | SUB 订阅 | `subscribed` / `breakpointReached` |

## 6. 异常与边界

- 后端返回 `error` 多帧时，代理会转为 WebSocket `error`。
- 部分执行控制命令在某些后端版本可能不支持（见测试脚本提示）。
- 状态包可能是 MessagePack 或原始二进制，代理会尝试兼容解析。

## 7. 变更记录

- 2026-02：从单文件协议文档拆分为多文档结构，并补充代理层映射。
