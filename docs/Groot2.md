# Groot 2 Protocol Documentation

## 1. Overview

Groot2 is a graphical editor and monitoring tool for BehaviorTree.CPP applications. It provides real-time visualization, debugging, and monitoring features. The communication between Groot2 and the BehaviorTree.CPP application is handled by the Groot2 protocol, which is based on ZeroMQ (ZMQ).

The protocol uses two main communication patterns:

*   **Request-Reply (REQ/REP):** For synchronous commands, such as requesting the tree structure or the status of nodes.
*   **Publish-Subscribe (PUB/SUB):** For asynchronous notifications, such as breakpoint events.

## 2. Network Configuration

When a `BT::Groot2Publisher` is created in a BehaviorTree.CPP application, it opens two ZMQ sockets:

*   **Request-Reply Socket:** Listens on `tcp://*:<port>` (default port: `1667`).
*   **Publish-Subscribe Socket:** Listens on `tcp://*:<port+1>` (default port: `1668`).

## 3. Message Structure

All messages exchanged between Groot2 and the BehaviorTree.CPP application use a multi-part ZMQ message format. The first part of the message is always a fixed-size header, followed by an optional variable-length data part.

### 3.1. Request Header (6 bytes)

The request header is 6 bytes long and has the following structure:

```cpp
struct RequestHeader
{
  uint8_t protocol = 2;      // Protocol version (always 2)
  uint8_t type;              // Request type (see below)
  uint32_t unique_id;        // Random request ID
};
```

### 3.2. Reply Header (22 bytes)

The reply header is 22 bytes long and includes the original request header, plus a 16-byte UUID of the tree:

```cpp
struct ReplyHeader
{
  RequestHeader request;     // Echo of the request header
  TreeUniqueUUID tree_id;    // 16-byte UUID of the tree
};
```

## 4. Request Types

The `type` field in the request header is a single character that identifies the type of the request. The following table lists all the available request types:

| Type | Value | Description |
|:---|:---|:---|
| `FULLTREE` | 'T' | Request the entire tree definition as XML. |
| `STATUS` | 'S' | Request the status of all nodes. |
| `BLACKBOARD` | 'B' | Retrieve values from blackboards. |
| `HOOK_INSERT` | 'I' | Insert a hook/breakpoint. |
| `HOOK_REMOVE` | 'R' | Remove a hook. |
| `BREAKPOINT_REACHED` | 'N' | Notification that a breakpoint was reached (PUB/SUB). |
| `BREAKPOINT_UNLOCK` | 'U' | Unlock a breakpoint. |
| `HOOKS_DUMP` | 'D' | Get existing hooks in JSON format. |
| `REMOVE_ALL_HOOKS` | 'A' | Remove all hooks. |
| `DISABLE_ALL_HOOKS` | 'X' | Disable all hooks. |
| `TOGGLE_RECORDING` | 'r' | Start/stop recording of node status transitions. |
| `GET_TRANSITIONS` | 't' | Get all transitions when recording is enabled. |

## 5. Communication Patterns

### 5.1. Get Tree Definition (`FULLTREE`)

*   **Request:** Header with `type='T'`.
*   **Reply:** Reply header followed by an XML string containing the full tree definition.

### 5.2. Get Node Status (`STATUS`)

*   **Request:** Header with `type='S'`.
*   **Reply:** Reply header followed by a buffer of node status information. Each node's status is represented by 3 bytes: 2 bytes for the node's UID and 1 byte for the status.

    *   **Status Values:**
        *   `0`: IDLE
        *   `1`: RUNNING
        *   `2`: SUCCESS
        *   `3`: FAILURE
        *   `10+N`: Transitioned from status `N` to IDLE.

### 5.3. Get Blackboard Values (`BLACKBOARD`)

*   **Request:** Header with `type='B'`, followed by a semicolon-separated list of blackboard names.
*   **Reply:** Reply header followed by a MessagePack-encoded JSON object with the blackboard values.

### 5.4. Breakpoint Handling

1.  **Insert Breakpoint:** Use `HOOK_INSERT` (`type='I'`) with a JSON payload describing the breakpoint.
2.  **Breakpoint Notification:** When a breakpoint is reached, the application publishes a `BREAKPOINT_REACHED` (`type='N'`) message on the PUB/SUB socket. The message contains the UID of the node where the breakpoint was reached.
3.  **Unlock Breakpoint:** After handling the breakpoint, the client sends a `BREAKPOINT_UNLOCK` (`type='U'`) message to resume the execution of the tree.

### 5.5. Recording

1.  **Start Recording:** Send a `TOGGLE_RECORDING` (`type='r'`) request with the payload "start".
2.  **Get Transitions:** Send a `GET_TRANSITIONS` (`type='t'`) request to retrieve the recorded transitions. The reply will contain a buffer of transition data, where each transition is represented by 9 bytes: 6 bytes for the timestamp, 2 bytes for the node UID, and 1 byte for the status.
3.  **Stop Recording:** Send a `TOGGLE_RECORDING` (`type='r'`) request with the payload "stop".

## 6. Heartbeat Mechanism

The Groot2 protocol includes a heartbeat mechanism to monitor the connection status. If the BehaviorTree.CPP application does not receive any requests from the client within a certain time (default: 5000ms), it will automatically disable all hooks. This is a safety measure to prevent the application from getting stuck in a breakpoint if the client disconnects.

## 7. Web Frontend Integration

Since web browsers cannot directly communicate using the ZMQ protocol, a WebSocket proxy is needed to bridge the communication between a web-based frontend and the BehaviorTree.CPP application. The proxy would be responsible for:

*   Translating WebSocket messages to ZMQ messages and vice-versa.
*   Handling the binary message format of the Groot2 protocol.
*   Managing the ZMQ sockets.
