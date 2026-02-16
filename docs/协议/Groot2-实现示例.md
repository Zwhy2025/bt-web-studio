# Groot2 实现示例

## 1. 目标与范围

- 目标：给出最小可运行的联调示例。
- 范围：Python 直连 ZMQ、WebSocket 代理调用。

## 2. Python（ZMQ）示例

```python
import zmq
import struct
import random

ctx = zmq.Context()
sock = ctx.socket(zmq.REQ)
sock.connect("tcp://127.0.0.1:1667")

req_id = random.randint(1, 2**31 - 1)
header = struct.pack('!BBi', 2, ord('T'), req_id)
sock.send(header)
parts = sock.recv_multipart()

if len(parts) >= 2:
    xml = parts[1].decode('utf-8', errors='replace')
    print(xml[:200])
```

## 3. WebSocket 代理示例

```json
{ "type": "getStatus" }
```

```json
{ "type": "setBreakpoint", "params": { "uid": 256, "position": 0, "enabled": true, "mode": 0 } }
```

## 4. 本项目现成测试

- ZMQ 批量测试：`python tests/zmq_batch_test.py`
- WebSocket 代理测试：`python tests/proxy_batch_test.py --ws ws://localhost:8080`

## 5. 常见问题

- 收到 `error`：先检查请求命令与后端版本能力是否匹配。
- `getTree` 返回空：后端可能未加载行为树。
- 无事件推送：确认 `subscribe` 主题是否正确以及后端是否触发事件。

## 6. 关联文档

- 协议总览：[`Groot2-协议总览.md`](./Groot2-协议总览.md)
- 命令手册：[`Groot2-命令手册-REQ-REP.md`](./Groot2-命令手册-REQ-REP.md)

## 7. 变更记录

- 2026-02：新增代理测试脚本入口，作为联调标准路径。
