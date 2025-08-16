# Groot2 协议

## 1. 概述

本指南综合了项目中的所有文档、源代码和测试脚本，提供了一份关于 Groot2 协议的详尽、精确且统一的参考。

Groot2 协议用于 `BehaviorTree.CPP` 应用程序与图形化工具（如 Groot2）之间的实时通信，支持行为树的可视化、监控和交互式调试。

### 1.1. 通信模型

协议基于 **ZeroMQ (ZMQ)**，采用两种主要的通信模式：

1.  **请求-响应 (REQ/REP)**: 用于客户端发起的同步命令，如获取树结构、查询黑板等。
2.  **发布-订阅 (PUB/SUB)**: 用于从 `BT.CPP` 应用到客户端的异步事件通知，主要是断点命中。

### 1.2. 端口配置

当在 `BT.CPP` 中实例化 `Groot2Publisher` 时，会占用两个连续的 TCP 端口：

- **REQ/REP 服务端口**: 默认为 `1667`。客户端通过此端口发送命令。
- **PUB/SUB 发布端口**: 默认为 `1668` (即服务端口 + 1)。客户端订阅此端口以接收异步通知。

## 2. 核心概念

### 2.1. 消息帧结构

所有通信都使用 ZMQ 的**多部分消息 (Multipart Message)**。

- **请求 (Request)**: 通常包含两部分：一个6字节的固定头部和可选的数据体。
- **回复 (Reply)**: 通常包含两部分：一个22字节的固定头部和可选的数据体。
- **通知 (Notification)**: 通常包含两部分：一个6字节的固定头部和描述事件的数据体。

### 2.2. 消息头部格式

#### 请求头 (Request Header) - 6字节

| 字段 | 长度 (字节) | 数据类型 | 描述 |
| :--- | :--- | :--- | :--- |
| `protocol` | 1 | `uint8_t` | 协议版本，固定为 **2**。 |
| `type` | 1 | `char` | 请求类型，由一个单字符表示 (见下文)。 |
| `unique_id` | 4 | `uint32_t` | 客户端生成的随机请求ID，用于匹配回复。 |

**Python 实现示例:**
```python
import struct
import random
# 生成一个 'T' (FULLTREE) 类型的请求头
unique_id = random.randint(0, 2**31 - 1)
header = struct.pack('!BBi', 2, ord('T'), unique_id)
```

#### 回复头 (Reply Header) - 22字节

| 字段 | 长度 (字节) | 数据类型 | 描述 |
| :--- | :--- | :--- | :--- |
| `request_header` | 6 | `struct` | 原样返回对应的6字节请求头。 |
| `tree_id` | 16 | `UUID` | 当前行为树的唯一标识符 (UUID)。 |

### 2.3. 心跳机制

服务器内部维护一个心跳计时器。如果服务器在设定的超时时间（默认为5000毫秒）内没有收到来自客户端的任何请求，它会认为连接已断开，并自动**禁用所有已设置的钩子/断点**。

### 2.4. 错误响应格式 (Error Response Format)

当服务器无法处理一个有效的请求时（例如，请求的节点UID不存在），它会返回一个标准格式的错误信息。这是一个两部分的多部分消息：

- **第一部分**: 包含UTF-8字符串 `error`。
- **第二部分**: 包含描述错误的具体信息的UTF-8字符串。

健壮的客户端在收到回复后，应首先检查第一部分是否为 `error` 字符串。

## 3. 命令参考 (REQ/REP)

---

### 3.1. 获取完整树结构 (FULLTREE) 'T'
- **目的**: 请求行为树的完整定义。
- **请求体**: 无。
- **回复体**: 包含行为树定义的 **XML 字符串**。

---

### 3.2. 获取节点状态 (STATUS) 'S'
- **目的**: 请求所有节点的当前实时状态。这是维持心跳的常用命令。
- **请求体**: 无。
- **回复体**: 二进制缓冲区，每个节点的状态由一个3字节的块表示: `[ (uint16_t node_uid, uint8_t status), ... ]`

#### Python 解析示例
```python
import struct
# status_reply_body 是从回复消息第二部分获取的 bytes
status_data = []
if len(status_reply_body) % 3 == 0:
    for i in range(0, len(status_reply_body), 3):
        chunk = status_reply_body[i:i+3]
        uid = struct.unpack('!H', chunk[0:2])[0]
        status_code = chunk[2]
        status_data.append({'uid': uid, 'status': status_code})
# print(status_data)
```

---

### 3.3. 获取黑板变量 (BLACKBOARD) 'B'
- **目的**: 查询一个或多个黑板上的变量值。
- **请求体**: 用分号 (`;`) 分隔的黑板名称列表字符串。
- **回复体**: 使用 **MessagePack** 编码的 JSON 对象。

---

### 3.4. 插入钩子/断点 (HOOK_INSERT) 'I'
- **目的**: 在一个或多个节点上设置钩子（断点或行为替换）。
- **请求体**: 描述钩子属性的 **JSON 对象**或**JSON数组** (结构见附录B)。
- **回复体**: 无。

---

### 3.5. 移除钩子 (HOOK_REMOVE) 'R'
- **目的**: 移除指定节点上的钩子。
- **请求体**: 包含 `uid` 和 `position` 字段的 **JSON 对象**。
- **回复体**: 无。

---

### 3.6. 解锁断点 (BREAKPOINT_UNLOCK) 'U'
- **目的**: 当执行流因断点而暂停时，客户端使用此命令来恢复执行。
- **请求体**: 指定解锁参数的 **JSON 对象** (结构见附录B)。
- **回复体**: 无。

---

### 3.7. 获取钩子列表 (HOOKS_DUMP) 'D'
- **目的**: 获取当前所有已注册的钩子/断点。
- **请求体**: 无。
- **回复体**: 包含所有钩子配置的 **JSON 数组**。

---

### 3.8. 移除所有钩子 (REMOVE_ALL_HOOKS) 'A'
- **目的**: 一次性移除所有已注册的钩子。
- **请求体**: 无。
- **回复体**: 无。

---

### 3.9. 禁用所有钩子 (DISABLE_ALL_HOOKS) 'X'
- **目的**: 临时禁用所有钩子，但保留其配置。
- **请求体**: 无。
- **回复体**: 无。

---

### 3.10. 切换录制状态 (TOGGLE_RECORDING) 'r'
- **目的**: 开始或停止录制节点的状态转换。
- **请求体**: 字符串 `"start"` 或 `"stop"`。
- **回复体**: `start`时返回**时间戳字符串**，`stop`时无。

---

### 3.11. 获取状态转换记录 (GET_TRANSITIONS) 't'
- **目的**: 获取自上次开始录制以来的所有节点状态转换记录。
- **请求体**: 无。
- **回复体**: 二进制缓冲区，每次转换由一个9字节的块表示: `[ (6B timestamp, uint16_t uid, uint8_t status), ... ]`

#### Python 解析示例
```python
import struct
# transitions_body 是从回复消息第二部分获取的 bytes
transitions = []
if len(transitions_body) % 9 == 0:
    for i in range(0, len(transitions_body), 9):
        chunk = transitions_body[i:i+9]
        timestamp_bytes = chunk[0:6]
        uid = struct.unpack('!H', chunk[6:8])[0]
        status_code = chunk[8]
        transitions.append({
            'timestamp_bytes': timestamp_bytes.hex(),
            'uid': uid,
            'status': status_code
        })
# print(transitions)
```

## 4. 异步通知 (PUB/SUB)

### 4.1. 断点命中 (BREAKPOINT_REACHED) 'N'
- **目的**: 当行为树执行到一个设置了断点的节点时，服务器通过 **发布端口 (1668)** 异步发送此通知。
- **消息结构**: 第一部分为6字节头部，第二部分为命中节点的 **UID** (字符串形式)。

## 5. 典型交互流程 (Typical Interaction Flows)

### 5.1. 断点设置与触发流程

这是一个涉及客户端和服务器，以及 REQ/REP 和 PUB/SUB 两个套接字的完整交互过程。

```text
Client               Server (REP:1667)      Server (PUB:1668)
  |                      |                      |
  | --- HOOK_INSERT ('I') request ---> |                      |  (1. 客户端发送设置断点请求)
  |                      |                      |
  | <------ Reply (confirm) -------- |                      |  (2. 服务器确认请求)
  |                      |                      |
  | ... (等待) ...       | (行为树执行)         |
  |                      |                      |
  |                      | --- BREAKPOINT_REACHED ('N') notification --> |  (3. 服务器在PUB端口广播断点命中)
  |                      |                      |
  | <----------------------------------------------------- |  (4. 客户端在SUB端口收到通知)
  |                      |                      |
  | --- BREAKPOINT_UNLOCK ('U') request -> |                      |  (5. 客户端发送解锁断点请求)
  |                      |                      |
  | <------ Reply (confirm) -------- |                      |  (6. 服务器确认解锁，行为树继续执行)
  |                      |                      |
```

## 6. 实现要点与示例

### 6.1. 客户端开发 (Python)
- 使用 `pyzmq` 库，推荐为每次请求创建新的 `REQ` 套接字。
- 使用 `struct` 库处理二进制数据，`json` 库处理JSON，`msgpack` 库解码黑板。

### 6.2. 服务器端集成 (C++)
- 在 `BT.CPP` 应用中，创建 `BT::Groot2Publisher` 实例来启动服务。
- 使用 `BT::RegisterJsonDefinition<YourType>();` 注册自定义类型以供黑板可视化。

### 6.3. 完整 Python 客户端示例

这个脚本演示了如何连接、获取树定义、获取节点状态并解析结果。

```python
import zmq
import struct
import random

SERVER_IP = "192.168.31.235" # 根据实际情况修改
REQ_PORT = 1667

def get_status_map():
    return {
        0: "IDLE", 1: "RUNNING", 2: "SUCCESS", 3: "FAILURE",
        12: "IDLE_FROM_SUCCESS", 13: "IDLE_FROM_FAILURE", 14: "IDLE_FROM_RUNNING"
    }

def main():
    print("--- Groot2 Python Client Example ---")
    context = zmq.Context()
    socket = context.socket(zmq.REQ)
    socket.connect(f"tcp://{SERVER_IP}:{REQ_PORT}")

    try:
        # 1. 获取完整树结构 (FULLTREE 'T')
        print("\n1. Requesting Full Tree...")
        req_id_tree = random.randint(0, 2**31 - 1)
        header_tree = struct.pack('!BBi', 2, ord('T'), req_id_tree)
        socket.send(header_tree)
        reply_parts_tree = socket.recv_multipart()

        if len(reply_parts_tree) > 1:
            xml_tree = reply_parts_tree[1].decode('utf-8')
            print("   Tree received. Preview:")
            print(f"   {xml_tree[:200]}...")
        else:
            print("   No tree data received.")

        # 2. 获取节点状态 (STATUS 'S')
        print("\n2. Requesting Node Status...")
        req_id_status = random.randint(0, 2**31 - 1)
        header_status = struct.pack('!BBi', 2, ord('S'), req_id_status)
        socket.send(header_status)
        reply_parts_status = socket.recv_multipart()

        if len(reply_parts_status) > 1:
            status_body = reply_parts_status[1]
            print(f"   Status buffer received ({len(status_body)} bytes).")
            status_map = get_status_map()
            parsed_nodes = []
            if len(status_body) % 3 == 0:
                for i in range(0, len(status_body), 3):
                    chunk = status_body[i:i+3]
                    uid = struct.unpack('!H', chunk[0:2])[0]
                    code = chunk[2]
                    status = status_map.get(code, f"UNKNOWN({code})")
                    parsed_nodes.append({'uid': uid, 'status': status})
                print("   Parsed status for first 5 nodes:")
                for node in parsed_nodes[:5]:
                    print(f"     - Node UID {node['uid']}: {node['status']}")
            else:
                print("   Error: Status buffer has incorrect length.")
        else:
            print("   No status data received.")

    except zmq.error.ZMQError as e:
        print(f"An error occurred: {e}")
    finally:
        socket.close()
        context.term()

if __name__ == "__main__":
    main()
```

## 附录

### 附录A: 节点状态码 (`uint8_t`)

| 值 | 状态名 | 描述 |
| :- | :--- | :--- |
| 0 | `IDLE` | 空闲 |
| 1 | `RUNNING` | 运行中 |
| 2 | `SUCCESS` | 成功 |
| 3 | `FAILURE` | 失败 |
| 12 | `IDLE_FROM_SUCCESS` | 从 `SUCCESS` 转换到 `IDLE` |
| 13 | `IDLE_FROM_FAILURE` | 从 `FAILURE` 转换到 `IDLE` |
| 14 | `IDLE_FROM_RUNNING` | 从 `RUNNING` 转换到 `IDLE` |

*注意：在 `STATUS` 请求的回复中，从其他状态转换到 `IDLE` 的状态码被编码为 `10 + prev_status`。*

### 附录B: Hook / Breakpoint JSON 结构

#### 插入钩子 (`HOOK_INSERT`)
```json
{
  "enabled": true,
  "uid": 256,
  "mode": 0,
  "once": false,
  "desired_status": "SUCCESS",
  "position": 0
}
```
- `uid` (number), `position` (0 for PRE, 1 for POST), `mode` (0 for BREAKPOINT, 1 for REPLACE), `enabled` (boolean), `once` (boolean), `desired_status` (string: `SUCCESS`/`FAILURE`/`SKIPPED`).

#### 解锁断点 (`BREAKPOINT_UNLOCK`)
```json
{
  "uid": 256,
  "position": 0,
  "desired_status": "SUCCESS",
  "remove_when_done": false
}
```
- `uid`, `position`, `desired_status`, `remove_when_done` (boolean).


### 附录C: 协议相关源码
* groot2_protocol.h
```
#pragma once

#include <cstdint>
#include <array>
#include <cstring>
#include <stdexcept>
#include <random>
#include <memory>
#include <condition_variable>
#include <mutex>
#include "behaviortree_cpp/basic_types.h"
#include "behaviortree_cpp/contrib/json.hpp"

namespace BT::Monitor
{

/*
 * All the messages exchange with the BT executor are multipart ZMQ request-replies.
 *
 * The first part of the request and the reply have fixed size and are described below.
 * The request and reply must have the same value of the fields:
 *
 *  - request_id
 *  - request_type
 *  - protocol_id
 */

enum RequestType : uint8_t
{
  // Request the entire tree definition as XML
  FULLTREE = 'T',
  // Request the status of all the nodes
  STATUS = 'S',
  // retrieve the values in a set of blackboards
  BLACKBOARD = 'B',

  // Groot requests the insertion of a hook
  HOOK_INSERT = 'I',
  // Groot requests to remove a hook
  HOOK_REMOVE = 'R',
  // Notify Groot that we reached a breakpoint
  BREAKPOINT_REACHED = 'N',
  // Groot will unlock a breakpoint
  BREAKPOINT_UNLOCK = 'U',
  // receive the existing hooks in JSON format
  HOOKS_DUMP = 'D',

  // Remove all hooks. To be done before disconnecting Groot
  REMOVE_ALL_HOOKS = 'A',

  DISABLE_ALL_HOOKS = 'X',

  // start/stop recordong
  TOGGLE_RECORDING = 'r',
  // get all transitions when recording
  GET_TRANSITIONS = 't',

  UNDEFINED = 0,
};

inline const char* ToString(const RequestType& type)
{
  switch(type)
  {
    case RequestType::FULLTREE:
      return "full_tree";
    case RequestType::STATUS:
      return "status";
    case RequestType::BLACKBOARD:
      return "blackboard";

    case RequestType::HOOK_INSERT:
      return "hook_insert";
    case RequestType::HOOK_REMOVE:
      return "hook_remove";
    case RequestType::BREAKPOINT_REACHED:
      return "breakpoint_reached";
    case RequestType::BREAKPOINT_UNLOCK:
      return "breakpoint_unlock";
    case RequestType::REMOVE_ALL_HOOKS:
      return "hooks_remove_all";
    case RequestType::HOOKS_DUMP:
      return "hooks_dump";
    case RequestType::DISABLE_ALL_HOOKS:
      return "disable_hooks";
    case RequestType::TOGGLE_RECORDING:
      return "toggle_recording";
    case RequestType::GET_TRANSITIONS:
      return "get_transitions";

    case RequestType::UNDEFINED:
      return "undefined";
  }
  return "undefined";
}

constexpr uint8_t kProtocolID = 2;
using TreeUniqueUUID = std::array<char, 16>;

struct RequestHeader
{
  uint32_t unique_id = 0;
  uint8_t protocol = kProtocolID;
  RequestType type = RequestType::UNDEFINED;

  static size_t size()
  {
    return sizeof(uint32_t) + sizeof(uint8_t) + sizeof(uint8_t);
  }

  RequestHeader() = default;

  RequestHeader(RequestType type) : type(type)
  {
    // a random number for request_id will do
    static std::random_device rd;
    std::mt19937 mt(rd());
    std::uniform_int_distribution<uint32_t> dist;
    unique_id = dist(mt);
  }

  bool operator==(const RequestHeader& other) const
  {
    return type == other.type && unique_id == other.unique_id;
  }
  bool operator!=(const RequestHeader& other) const
  {
    return !(*this == other);
  }
};

struct ReplyHeader
{
  RequestHeader request;
  TreeUniqueUUID tree_id;

  static size_t size()
  {
    return RequestHeader::size() + 16;
  }

  ReplyHeader()
  {
    tree_id.fill(0);
  }
};

template <typename T>
inline unsigned Serialize(char* buffer, unsigned offset, T value)
{
  memcpy(buffer + offset, &value, sizeof(T));
  return sizeof(T);
}

template <typename T>
inline unsigned Deserialize(const char* buffer, unsigned offset, T& value)
{
  memcpy(reinterpret_cast<char*>(&value), buffer + offset, sizeof(T));
  return sizeof(T);
}

inline std::string SerializeHeader(const RequestHeader& header)
{
  std::string buffer;
  buffer.resize(6);
  unsigned offset = 0;
  offset += Serialize(buffer.data(), offset, header.protocol);
  offset += Serialize(buffer.data(), offset, uint8_t(header.type));
  offset += Serialize(buffer.data(), offset, header.unique_id);
  return buffer;
}

inline std::string SerializeHeader(const ReplyHeader& header)
{
  // copy the first part directly (6 bytes)
  std::string buffer = SerializeHeader(header.request);
  // add the following 16 bytes
  unsigned const offset = 6;
  buffer.resize(offset + 16);
  Serialize(buffer.data(), offset, header.tree_id);
  return buffer;
}

inline RequestHeader DeserializeRequestHeader(const std::string& buffer)
{
  RequestHeader header;
  unsigned offset = 0;
  offset += Deserialize(buffer.data(), offset, header.protocol);
  uint8_t type;
  offset += Deserialize(buffer.data(), offset, type);
  header.type = static_cast<Monitor::RequestType>(type);
  offset += Deserialize(buffer.data(), offset, header.unique_id);
  return header;
}

inline ReplyHeader DeserializeReplyHeader(const std::string& buffer)
{
  ReplyHeader header;
  header.request = DeserializeRequestHeader(buffer);
  unsigned const offset = 6;
  Deserialize(buffer.data(), offset, header.tree_id);
  return header;
}

struct Hook
{
  using Ptr = std::shared_ptr<Hook>;

  // used to enable/disable the breakpoint
  bool enabled = true;

  enum class Position
  {
    PRE = 0,
    POST = 1
  };

  Position position = Position::PRE;

  uint16_t node_uid = 0;

  enum class Mode
  {
    BREAKPOINT = 0,
    REPLACE = 1
  };

  // interactive breakpoints are unblocked using unlockBreakpoint()
  Mode mode = Mode::BREAKPOINT;

  // used by interactive breakpoints to wait for unlocking
  std::condition_variable wakeup;

  std::mutex mutex;

  // set to true to unlock an interactive breakpoint
  bool ready = false;

  // once finished self-destroy
  bool remove_when_done = false;

  // result to be returned
  NodeStatus desired_status = NodeStatus::SKIPPED;
};

inline void to_json(nlohmann::json& js, const Hook& bp)
{
  js = nlohmann::json{ { "enabled", bp.enabled },
                       { "uid", bp.node_uid },
                       { "mode", int(bp.mode) },
                       { "once", bp.remove_when_done },
                       { "desired_status", toStr(bp.desired_status) },
                       { "position", int(bp.position) } };
}

inline void from_json(const nlohmann::json& js, Hook& bp)
{
  js.at("enabled").get_to(bp.enabled);
  js.at("uid").get_to(bp.node_uid);
  js.at("once").get_to(bp.remove_when_done);
  bp.mode = static_cast<Hook::Mode>(js.at("mode").get<int>());
  bp.position = static_cast<Hook::Position>(js.at("position").get<int>());

  const std::string desired_value = js.at("desired_status").get<std::string>();
  bp.desired_status = convertFromString<NodeStatus>(desired_value);
}

}  // namespace BT::Monitor

```

* groot2_publisher.h
```
#pragma once

#include <array>
#include <future>
#include "behaviortree_cpp/loggers/abstract_logger.h"
#include "behaviortree_cpp/loggers/groot2_protocol.h"

namespace BT
{

/**
 * @brief The Groot2Publisher is used to create an interface between
 * your BT.CPP executor and Groot2.
 *
 * An inter-process communication mechanism allows the two processes
 * to communicate through a TCP port. The user should provide the
 * port to be used in the constructor.
 */
class Groot2Publisher : public StatusChangeLogger
{
  static std::mutex used_ports_mutex;
  static std::set<unsigned> used_ports;

  using Position = Monitor::Hook::Position;

public:
  Groot2Publisher(const BT::Tree& tree, unsigned server_port = 1667);

  ~Groot2Publisher() override;

  Groot2Publisher(const Groot2Publisher& other) = delete;
  Groot2Publisher& operator=(const Groot2Publisher& other) = delete;

  Groot2Publisher(Groot2Publisher&& other) = default;
  Groot2Publisher& operator=(Groot2Publisher&& other) = default;

  /**
   * @brief setMaxHeartbeatDelay is used to tell the publisher
   * when a connection with Groot2 should be cancelled, if no
   * heartbeat is received.
   *
   * Default is 5000 ms
   */
  void setMaxHeartbeatDelay(std::chrono::milliseconds delay);

  std::chrono::milliseconds maxHeartbeatDelay() const;

private:
  void callback(Duration timestamp, const TreeNode& node, NodeStatus prev_status,
                NodeStatus status) override;

  void flush() override;

  void serverLoop();

  void heartbeatLoop();

  void updateStatusBuffer();

  std::vector<uint8_t> generateBlackboardsDump(const std::string& bb_list);

  bool insertHook(Monitor::Hook::Ptr breakpoint);

  bool unlockBreakpoint(Position pos, uint16_t node_uid, NodeStatus result, bool remove);

  bool removeHook(Position pos, uint16_t node_uid);

  void removeAllHooks();

  Monitor::Hook::Ptr getHook(Position pos, uint16_t node_uid);

  struct PImpl;
  std::unique_ptr<PImpl> _p;

  void enableAllHooks(bool enable);
};
}  // namespace BT

```
* groot2_publisher.cpp


```
#include "behaviortree_cpp/loggers/groot2_publisher.h"
#include "behaviortree_cpp/loggers/groot2_protocol.h"
#include "behaviortree_cpp/xml_parsing.h"
#include "cppzmq/zmq.hpp"
#include "cppzmq/zmq_addon.hpp"

namespace BT
{
//------------------------------------------------------
std::mutex Groot2Publisher::used_ports_mutex;
std::set<unsigned> Groot2Publisher::used_ports;

enum
{
  IDLE_FROM_SUCCESS = 10 + static_cast<int>(NodeStatus::SUCCESS),
  IDLE_FROM_FAILURE = 10 + static_cast<int>(NodeStatus::FAILURE),
  IDLE_FROM_RUNNING = 10 + static_cast<int>(NodeStatus::RUNNING)
};

struct Transition
{
  // when serializing, we will remove the initial time and serialize only
  // 6 bytes, instead of 8
  uint64_t timestamp_usec;
  // if you have more than 64.000 nodes, you are doing something wrong :)
  uint16_t node_uid;
  // enough bits to contain NodeStatus
  uint8_t status;

  uint8_t padding[5];
};

std::array<char, 16> CreateRandomUUID()
{
  std::mt19937 gen;
  std::uniform_int_distribution<uint32_t> dist;
  std::array<char, 16> out;
  char* bytes = out.data();
  for(int i = 0; i < 16; i += 4)
  {
    *reinterpret_cast<uint32_t*>(bytes + i) = dist(gen);
  }
  // variant must be 10xxxxxx
  bytes[8] &= 0xBF;
  bytes[8] |= 0x80;

  // version must be 0100xxxx
  bytes[6] &= 0x4F;
  bytes[6] |= 0x40;

  return out;
}

struct Groot2Publisher::PImpl
{
  PImpl() : context(), server(context, ZMQ_REP), publisher(context, ZMQ_PUB)
  {
    server.set(zmq::sockopt::linger, 0);
    publisher.set(zmq::sockopt::linger, 0);

    int timeout_rcv = 100;
    server.set(zmq::sockopt::rcvtimeo, timeout_rcv);
    publisher.set(zmq::sockopt::rcvtimeo, timeout_rcv);

    int timeout_ms = 1000;
    server.set(zmq::sockopt::sndtimeo, timeout_ms);
    publisher.set(zmq::sockopt::sndtimeo, timeout_ms);
  }

  unsigned server_port = 0;
  std::string server_address;
  std::string publisher_address;

  std::string tree_xml;

  std::atomic_bool active_server = false;
  std::thread server_thread;

  std::mutex status_mutex;

  std::string status_buffer;
  // each element of this map points to a character in _p->status_buffer
  std::unordered_map<uint16_t, char*> status_buffermap;

  // weak reference to the tree.
  std::unordered_map<std::string, std::weak_ptr<BT::Tree::Subtree>> subtrees;
  std::unordered_map<uint16_t, std::weak_ptr<BT::TreeNode>> nodes_by_uid;

  std::mutex hooks_map_mutex;
  std::unordered_map<uint16_t, Monitor::Hook::Ptr> pre_hooks;
  std::unordered_map<uint16_t, Monitor::Hook::Ptr> post_hooks;

  std::chrono::system_clock::time_point last_heartbeat;
  std::chrono::milliseconds max_heartbeat_delay = std::chrono::milliseconds(5000);

  std::atomic_bool recording = false;
  std::deque<Transition> transitions_buffer;
  std::chrono::microseconds recording_fist_time;

  std::thread heartbeat_thread;

  zmq::context_t context;
  zmq::socket_t server;
  zmq::socket_t publisher;
};

Groot2Publisher::Groot2Publisher(const BT::Tree& tree, unsigned server_port)
  : StatusChangeLogger(tree.rootNode()), _p(new PImpl())
{
  _p->server_port = server_port;

  {
    std::unique_lock<std::mutex> lk(Groot2Publisher::used_ports_mutex);
    if(Groot2Publisher::used_ports.count(server_port) != 0 ||
       Groot2Publisher::used_ports.count(server_port + 1) != 0)
    {
      auto msg = StrCat("Another instance of Groot2Publisher is using port ",
                        std::to_string(server_port));
      throw LogicError(msg);
    }
    Groot2Publisher::used_ports.insert(server_port);
    Groot2Publisher::used_ports.insert(server_port + 1);
  }

  _p->tree_xml = WriteTreeToXML(tree, true, true);

  //-------------------------------
  // Prepare the status buffer
  size_t node_count = 0;
  for(const auto& subtree : tree.subtrees)
  {
    node_count += subtree->nodes.size();
  }
  _p->status_buffer.resize(3 * node_count);

  unsigned ptr_offset = 0;
  char* buffer_ptr = _p->status_buffer.data();

  for(const auto& subtree : tree.subtrees)
  {
    auto name =
        subtree->instance_name.empty() ? subtree->tree_ID : subtree->instance_name;
    _p->subtrees.insert({ name, subtree });

    for(const auto& node : subtree->nodes)
    {
      _p->nodes_by_uid.insert({ node->UID(), node });

      ptr_offset += Monitor::Serialize(buffer_ptr, ptr_offset, node->UID());
      _p->status_buffermap.insert({ node->UID(), buffer_ptr + ptr_offset });
      ptr_offset += Monitor::Serialize(buffer_ptr, ptr_offset, uint8_t(NodeStatus::IDLE));
    }
  }
  //-------------------------------
  _p->server_address = StrCat("tcp://*:", std::to_string(server_port));
  _p->publisher_address = StrCat("tcp://*:", std::to_string(server_port + 1));

  _p->server.bind(_p->server_address.c_str());
  _p->publisher.bind(_p->publisher_address.c_str());

  _p->server_thread = std::thread(&Groot2Publisher::serverLoop, this);
  _p->heartbeat_thread = std::thread(&Groot2Publisher::heartbeatLoop, this);
}

void Groot2Publisher::setMaxHeartbeatDelay(std::chrono::milliseconds delay)
{
  _p->max_heartbeat_delay = delay;
}

std::chrono::milliseconds Groot2Publisher::maxHeartbeatDelay() const
{
  return _p->max_heartbeat_delay;
}

Groot2Publisher::~Groot2Publisher()
{
  removeAllHooks();

  _p->active_server = false;
  if(_p->server_thread.joinable())
  {
    _p->server_thread.join();
  }

  if(_p->heartbeat_thread.joinable())
  {
    _p->heartbeat_thread.join();
  }

  flush();

  {
    std::unique_lock<std::mutex> lk(Groot2Publisher::used_ports_mutex);
    Groot2Publisher::used_ports.erase(_p->server_port);
    Groot2Publisher::used_ports.erase(_p->server_port + 1);
  }
}

void Groot2Publisher::callback(Duration ts, const TreeNode& node, NodeStatus prev_status,
                               NodeStatus new_status)
{
  std::unique_lock<std::mutex> lk(_p->status_mutex);
  auto status = static_cast<char>(new_status);

  if(new_status == NodeStatus::IDLE)
  {
    status = 10 + static_cast<char>(prev_status);
  }
  *(_p->status_buffermap.at(node.UID())) = status;

  if(_p->recording)
  {
    Transition trans;
    trans.node_uid = node.UID();
    trans.status = static_cast<uint8_t>(new_status);
    auto timestamp = ts - _p->recording_fist_time;
    trans.timestamp_usec =
        std::chrono::duration_cast<std::chrono::microseconds>(timestamp).count();
    _p->transitions_buffer.push_back(trans);
    while(_p->transitions_buffer.size() > 1000)
    {
      _p->transitions_buffer.pop_front();
    }
  }
}

void Groot2Publisher::flush()
{
  // nothing to do here...
}

void Groot2Publisher::serverLoop()
{
  auto const serialized_uuid = CreateRandomUUID();

  _p->active_server = true;
  auto& socket = _p->server;

  auto sendErrorReply = [&socket](const std::string& msg) {
    zmq::multipart_t error_msg;
    error_msg.addstr("error");
    error_msg.addstr(msg);
    error_msg.send(socket);
  };

  // initialize _p->last_heartbeat
  _p->last_heartbeat = std::chrono::system_clock::now();

  while(_p->active_server)
  {
    zmq::multipart_t requestMsg;
    if(!requestMsg.recv(socket) || requestMsg.size() == 0)
    {
      continue;
    }
    // this heartbeat will help establishing if Groot is connected or not
    _p->last_heartbeat = std::chrono::system_clock::now();

    std::string const request_str = requestMsg[0].to_string();
    if(request_str.size() != Monitor::RequestHeader::size())
    {
      sendErrorReply("wrong request header");
      continue;
    }

    auto request_header = Monitor::DeserializeRequestHeader(request_str);

    Monitor::ReplyHeader reply_header;
    reply_header.request = request_header;
    reply_header.request.protocol = Monitor::kProtocolID;
    reply_header.tree_id = serialized_uuid;

    zmq::multipart_t reply_msg;
    reply_msg.addstr(Monitor::SerializeHeader(reply_header));

    switch(request_header.type)
    {
      case Monitor::RequestType::FULLTREE: {
        reply_msg.addstr(_p->tree_xml);
      }
      break;

      case Monitor::RequestType::STATUS: {
        std::unique_lock<std::mutex> lk(_p->status_mutex);
        reply_msg.addstr(_p->status_buffer);
      }
      break;

      case Monitor::RequestType::BLACKBOARD: {
        if(requestMsg.size() != 2)
        {
          sendErrorReply("must be 2 parts message");
          continue;
        }
        std::string const bb_names_str = requestMsg[1].to_string();
        auto msg = generateBlackboardsDump(bb_names_str);
        reply_msg.addmem(msg.data(), msg.size());
      }
      break;

      case Monitor::RequestType::HOOK_INSERT: {
        if(requestMsg.size() != 2)
        {
          sendErrorReply("must be 2 parts message");
          continue;
        }

        auto InsertHook = [this](nlohmann::json const& json) {
          uint16_t const node_uid = json["uid"].get<uint16_t>();
          Position const pos = static_cast<Position>(json["position"].get<int>());

          if(auto hook = getHook(pos, node_uid))
          {
            std::unique_lock<std::mutex> lk(hook->mutex);
            bool was_interactive = (hook->mode == Monitor::Hook::Mode::BREAKPOINT);
            BT::Monitor::from_json(json, *hook);

            // if it WAS interactive and it is not anymore, unlock it
            if(was_interactive && (hook->mode == Monitor::Hook::Mode::REPLACE))
            {
              hook->ready = true;
              lk.unlock();
              hook->wakeup.notify_all();
            }
          }
          else  // if not found, create a new one
          {
            auto new_hook = std::make_shared<Monitor::Hook>();
            BT::Monitor::from_json(json, *new_hook);
            insertHook(new_hook);
          }
        };

        auto const received_json = nlohmann::json::parse(requestMsg[1].to_string());

        // the json may contain a Hook or an array of Hooks
        if(received_json.is_array())
        {
          for(auto const& json : received_json)
          {
            InsertHook(json);
          }
        }
        else
        {
          InsertHook(received_json);
        }
      }
      break;

      case Monitor::RequestType::BREAKPOINT_UNLOCK: {
        if(requestMsg.size() != 2)
        {
          sendErrorReply("must be 2 parts message");
          continue;
        }

        auto json = nlohmann::json::parse(requestMsg[1].to_string());
        uint16_t node_uid = json.at("uid").get<uint16_t>();
        std::string status_str = json.at("desired_status").get<std::string>();
        auto position = static_cast<Position>(json.at("position").get<int>());
        bool remove = json.at("remove_when_done").get<bool>();

        NodeStatus desired_status = NodeStatus::SKIPPED;
        if(status_str == "SUCCESS")
        {
          desired_status = NodeStatus::SUCCESS;
        }
        else if(status_str == "FAILURE")
        {
          desired_status = NodeStatus::FAILURE;
        }

        if(!unlockBreakpoint(position, uint16_t(node_uid), desired_status, remove))
        {
          sendErrorReply("Node ID not found");
          continue;
        }
      }
      break;

      case Monitor::RequestType::REMOVE_ALL_HOOKS: {
        removeAllHooks();
      }
      break;

      case Monitor::RequestType::DISABLE_ALL_HOOKS: {
        enableAllHooks(false);
      }
      break;

      case Monitor::RequestType::HOOK_REMOVE: {
        if(requestMsg.size() != 2)
        {
          sendErrorReply("must be 2 parts message");
          continue;
        }

        auto json = nlohmann::json::parse(requestMsg[1].to_string());
        uint16_t node_uid = json.at("uid").get<uint16_t>();
        auto position = static_cast<Position>(json.at("position").get<int>());

        if(!removeHook(position, uint16_t(node_uid)))
        {
          sendErrorReply("Node ID not found");
          continue;
        }
      }
      break;

      case Monitor::RequestType::HOOKS_DUMP: {
        std::unique_lock<std::mutex> lk(_p->hooks_map_mutex);
        auto json_out = nlohmann::json::array();
        for(auto [node_uid, breakpoint] : _p->pre_hooks)
        {
          json_out.push_back(*breakpoint);
        }
        reply_msg.addstr(json_out.dump());
      }
      break;

      case Monitor::RequestType::TOGGLE_RECORDING: {
        if(requestMsg.size() != 2)
        {
          sendErrorReply("must be 2 parts message");
          continue;
        }

        auto const cmd = (requestMsg[1].to_string());
        if(cmd == "start")
        {
          _p->recording = true;
          // to keep the first time for callback
          _p->recording_fist_time = std::chrono::duration_cast<std::chrono::microseconds>(
              std::chrono::high_resolution_clock::now().time_since_epoch());
          // to send consistent time for client
          auto now = std::chrono::duration_cast<std::chrono::microseconds>(
              std::chrono::system_clock::now().time_since_epoch());
          reply_msg.addstr(std::to_string(now.count()));
          std::unique_lock<std::mutex> lk(_p->status_mutex);
          _p->transitions_buffer.clear();
        }
        else if(cmd == "stop")
        {
          _p->recording = false;
        }
      }
      break;

      case Monitor::RequestType::GET_TRANSITIONS: {
        thread_local std::string trans_buffer;
        trans_buffer.resize(9 * _p->transitions_buffer.size());

        std::unique_lock<std::mutex> lk(_p->status_mutex);
        size_t offset = 0;
        for(const auto& trans : _p->transitions_buffer)
        {
          std::memcpy(&trans_buffer[offset], &trans.timestamp_usec, 6);
          offset += 6;
          std::memcpy(&trans_buffer[offset], &trans.node_uid, 2);
          offset += 2;
          std::memcpy(&trans_buffer[offset], &trans.status, 1);
          offset += 1;
        }
        _p->transitions_buffer.clear();
        trans_buffer.resize(offset);
        reply_msg.addstr(trans_buffer);
      }
      break;

      default: {
        sendErrorReply("Request not recognized");
        continue;
      }
    }
    // send the reply
    reply_msg.send(socket);
  }
}

void BT::Groot2Publisher::enableAllHooks(bool enable)
{
  std::unique_lock<std::mutex> lk(_p->hooks_map_mutex);
  for(auto& [node_uid, hook] : _p->pre_hooks)
  {
    std::unique_lock<std::mutex> lk(hook->mutex);
    hook->enabled = enable;
    // when disabling, remember to wake up blocked ones
    if(!hook->enabled && hook->mode == Monitor::Hook::Mode::BREAKPOINT)
    {
      lk.unlock();
      hook->wakeup.notify_all();
    }
  }
}

void Groot2Publisher::heartbeatLoop()
{
  bool has_heartbeat = true;

  while(_p->active_server)
  {
    std::this_thread::sleep_for(std::chrono::milliseconds(10));

    auto now = std::chrono::system_clock::now();
    bool prev_heartbeat = has_heartbeat;

    has_heartbeat = (now - _p->last_heartbeat < _p->max_heartbeat_delay);

    // if we loose or gain heartbeat, disable/enable all breakpoints
    if(has_heartbeat != prev_heartbeat)
    {
      enableAllHooks(has_heartbeat);
    }
  }
}

std::vector<uint8_t> Groot2Publisher::generateBlackboardsDump(const std::string& bb_list)
{
  auto json = nlohmann::json();
  auto const bb_names = BT::splitString(bb_list, ';');
  for(auto name : bb_names)
  {
    std::string const bb_name(name);
    auto it = _p->subtrees.find(bb_name);

    if(it != _p->subtrees.end())
    {
      // lock the weak pointer
      if(auto subtree = it->second.lock())
      {
        json[bb_name] = ExportBlackboardToJSON(*subtree->blackboard);
      }
    }
  }
  return nlohmann::json::to_msgpack(json);
}

bool Groot2Publisher::insertHook(std::shared_ptr<Monitor::Hook> hook)
{
  auto const node_uid = hook->node_uid;
  auto it = _p->nodes_by_uid.find(node_uid);
  if(it == _p->nodes_by_uid.end())
  {
    return false;
  }
  TreeNode::Ptr node = it->second.lock();
  if(!node)
  {
    return false;
  }

  auto injectedCallback = [hook, this](TreeNode& node) -> NodeStatus {
    std::unique_lock<std::mutex> lk(hook->mutex);
    if(!hook->enabled)
    {
      return NodeStatus::SKIPPED;
    }

    // Notify that a breakpoint was reached, using the _p->publisher
    Monitor::RequestHeader breakpoint_request(Monitor::BREAKPOINT_REACHED);
    zmq::multipart_t request_msg;
    request_msg.addstr(Monitor::SerializeHeader(breakpoint_request));
    request_msg.addstr(std::to_string(hook->node_uid));
    request_msg.send(_p->publisher);

    // wait until someone wake us up
    if(hook->mode == Monitor::Hook::Mode::BREAKPOINT)
    {
      hook->wakeup.wait(lk, [hook]() { return hook->ready || !hook->enabled; });

      hook->ready = false;
      // wait was unblocked but it could be the breakpoint becoming disabled.
      // in this case, just skip
      if(!hook->enabled)
      {
        return NodeStatus::SKIPPED;
      }
    }

    if(hook->remove_when_done)
    {
      // self-destruction at the end of this lambda function
      std::unique_lock<std::mutex> lk(_p->hooks_map_mutex);
      _p->pre_hooks.erase(hook->node_uid);
      node.setPreTickFunction({});
    }
    return hook->desired_status;
  };

  std::unique_lock<std::mutex> lk(_p->hooks_map_mutex);
  _p->pre_hooks[node_uid] = hook;
  node->setPreTickFunction(injectedCallback);

  return true;
}

bool Groot2Publisher::unlockBreakpoint(Position pos, uint16_t node_uid, NodeStatus result,
                                       bool remove)
{
  auto it = _p->nodes_by_uid.find(node_uid);
  if(it == _p->nodes_by_uid.end())
  {
    return false;
  }
  TreeNode::Ptr node = it->second.lock();
  if(!node)
  {
    return false;
  }

  auto hook = getHook(pos, node_uid);
  if(!hook)
  {
    return false;
  }

  {
    std::unique_lock<std::mutex> lk(hook->mutex);
    hook->desired_status = result;
    hook->remove_when_done |= remove;
    if(hook->mode == Monitor::Hook::Mode::BREAKPOINT)
    {
      hook->ready = true;
      lk.unlock();
      hook->wakeup.notify_all();
    }
  }
  return true;
}

bool Groot2Publisher::removeHook(Position pos, uint16_t node_uid)
{
  auto it = _p->nodes_by_uid.find(node_uid);
  if(it == _p->nodes_by_uid.end())
  {
    return false;
  }
  TreeNode::Ptr node = it->second.lock();
  if(!node)
  {
    return false;
  }

  auto hook = getHook(pos, node_uid);
  if(!hook)
  {
    return false;
  }

  {
    std::unique_lock<std::mutex> lk(_p->hooks_map_mutex);
    _p->pre_hooks.erase(node_uid);
  }
  node->setPreTickFunction({});

  // Disable breakpoint, if it was interactive and blocked
  {
    std::unique_lock<std::mutex> lk(hook->mutex);
    if(hook->mode == Monitor::Hook::Mode::BREAKPOINT)
    {
      hook->enabled = false;
      lk.unlock();
      hook->wakeup.notify_all();
    }
  }
  return true;
}

void Groot2Publisher::removeAllHooks()
{
  std::vector<uint16_t> uids;

  for(auto pos : { Position::PRE, Position::POST })
  {
    uids.clear();
    auto hooks = pos == Position::PRE ? &_p->pre_hooks : &_p->post_hooks;
    std::unique_lock<std::mutex> lk(_p->hooks_map_mutex);
    if(!hooks->empty())
    {
      uids.reserve(hooks->size());
      for(auto [node_uid, _] : *hooks)
      {
        uids.push_back(node_uid);
      }

      lk.unlock();
      for(auto node_uid : uids)
      {
        removeHook(pos, node_uid);
      }
    }
  }
}

Monitor::Hook::Ptr Groot2Publisher::getHook(Position pos, uint16_t node_uid)
{
  auto hooks = pos == Position::PRE ? &_p->pre_hooks : &_p->post_hooks;
  std::unique_lock<std::mutex> lk(_p->hooks_map_mutex);
  auto bk_it = hooks->find(node_uid);
  if(bk_it == hooks->end())
  {
    return {};
  }
  return bk_it->second;
}

}  // namespace BT

```