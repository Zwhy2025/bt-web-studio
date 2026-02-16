# Groot2 命令手册（REQ/REP）

## 1. 目标与范围

- 目标：提供可直接用于联调的命令级参考。
- 范围：请求类型、请求体、响应体、代理层映射。

## 2. 消息格式

### 2.1 请求头（6 字节）

| 字段 | 类型 | 说明 |
|---|---|---|
| `protocol` | `uint8` | 固定为 `2` |
| `type` | `char` | 命令码 |
| `unique_id` | `uint32` | 请求 ID |

### 2.2 响应头（22 字节）

| 字段 | 类型 | 说明 |
|---|---|---|
| `request_header` | 6 字节 | 原请求头回显 |
| `tree_id` | UUID(16) | 行为树标识 |

## 3. 命令清单

| 命令码 | 名称 | 请求体 | 响应体 |
|---|---|---|---|
| `T` | FULLTREE | 无 | XML 字符串 |
| `S` | STATUS | 无 | 节点状态（msgpack 或原始二进制） |
| `B` | BLACKBOARD | 黑板名列表（`;` 分隔） | MessagePack 对象 |
| `I` | HOOK_INSERT | JSON（断点/钩子定义） | 头部确认 |
| `R` | HOOK_REMOVE | JSON（`uid` + `position`） | 头部确认 |
| `U` | BREAKPOINT_UNLOCK | JSON（解锁参数） | 头部确认 |
| `D` | HOOKS_DUMP | 无 | JSON hooks 列表 |
| `A` | REMOVE_ALL_HOOKS | 无 | 头部确认 |
| `X` | DISABLE_ALL_HOOKS | 无 | 头部确认 |
| `r` | TOGGLE_RECORDING | `"start"` / `"stop"` | 开始时可能返回时间戳 |
| `t` | GET_TRANSITIONS | 无 | 状态转换二进制 |
| `>` | START | 无 | 头部确认 |
| `p` | PAUSE | 无 | 头部确认 |
| `O` | STOP | 无 | 头部确认 |
| `s` | STEP | 无 | 头部确认 |

## 4. 代理层请求示例（WebSocket）

```json
{ "type": "getTree" }
```

```json
{ "type": "setBreakpoint", "params": { "uid": 256, "position": 0, "enabled": true, "mode": 0 } }
```

## 5. 异常与边界

- 若响应首帧为 `error`，第二帧为错误信息文本。
- 某些后端实现对 `start/pause/step/stop` 支持不完整，需按实际能力降级。
- `S` 命令可能返回二进制数组 `[uid(2B), status(1B)]*`，也可能返回 MessagePack 结构。

## 6. 关联文档

- 总览：[`Groot2-协议总览.md`](./Groot2-协议总览.md)
- 事件：[`Groot2-事件手册-PUB-SUB.md`](./Groot2-事件手册-PUB-SUB.md)
- 示例：[`Groot2-实现示例.md`](./Groot2-实现示例.md)

## 7. 变更记录

- 2026-02：新增 START/PAUSE/STOP/STEP 在代理层的映射说明。
