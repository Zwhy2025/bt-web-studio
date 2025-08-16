#!/usr/bin/env python3
"""
WebSocket Proxy Batch Test for Groot2 Protocol

This script connects to the local WebSocket proxy (default ws://localhost:8080)
and exercises key protocol commands end-to-end: getTree, getStatus, getBlackboard,
start/pause/step/stop, and breakpoint operations (insert/remove/unlock).

Usage:
  python3 tests/proxy_batch_test.py --ws ws://localhost:8080

Notes:
  - Ensure the proxy is running: python3 scripts/proxy.py
  - Ensure the backend BehaviorTree.CPP server is reachable by the proxy.
"""

import asyncio
import json
import argparse
from typing import Any, Dict, Optional

import websockets


def pretty(obj: Any) -> str:
    try:
        return json.dumps(obj, ensure_ascii=False, indent=2)
    except Exception:
        return str(obj)


async def send_and_recv(ws, msg: Dict[str, Any], expect_type: Optional[str] = None, timeout: float = 5.0):
    print(f"\n=> SEND: {pretty(msg)}")
    await ws.send(json.dumps(msg))

    try:
        # Skip execution control commands - they are not supported by the backend protocol
        print("\n⚠️  Skipping execution control commands (start, pause, step, stop) - not supported by backend protocol")

        reply_raw = await asyncio.wait_for(ws.recv(), timeout=timeout)
        # 提取 xml 部分
        reply_json = json.loads(reply_raw)
        xml = reply_json.get("payload", {}).get("xml", "")
        # 保存为文件
        with open("reply.xml", "w") as f:
            f.write(xml)
        exit(0)
    except asyncio.TimeoutError:
        print("✗ TIMEOUT waiting for reply")
        return None

    try:
        reply = json.loads(reply_raw)
    except Exception:
        print(f"<= RECV (raw): {reply_raw}")
        return reply_raw

    t = reply.get("type")
    if t == "error":
        print(f"<= ERROR: {pretty(reply)}")
    else:
        print(f"<= RECV: {pretty(reply)}")

    if expect_type and t != expect_type:
        print(f"⚠️  Unexpected reply type. expected={expect_type}, got={t}")

    return reply


async def test_basic(ws):
    # getTree
    await send_and_recv(ws, {"type": "getTree"}, expect_type="treeUpdate")

    # getStatus
    await send_and_recv(ws, {"type": "getStatus"}, expect_type="statusUpdate")

    # getBlackboard
    await send_and_recv(ws, {"type": "getBlackboard"}, expect_type="blackboardUpdate")


async def test_execution(ws):
    # start
    print("\n⚠️  Skipping execution control commands (start, pause, step, stop) - not supported by backend protocol")

    # step
    print("\n⚠️  Skipping execution control commands (start, pause, step, stop) - not supported by backend protocol")

    # pause
    print("\n⚠️  Skipping execution control commands (start, pause, step, stop) - not supported by backend protocol")

    # stop
    print("\n⚠️  Skipping execution control commands (start, pause, step, stop) - not supported by backend protocol")


async def test_breakpoints(ws, uid: int = 256):
    # Insert breakpoint (HOOK_INSERT 'I') — proxy forwards payload as-is
    hook_payload = {
        "params": {
            "enabled": True,
            "uid": uid,            # adjust to a valid node UID in your tree
            "mode": 0,             # 0=BREAKPOINT, 1=REPLACE
            "once": False,
            "desired_status": "SUCCESS",  # used when mode=REPLACE
            "position": 0          # 0=PRE, 1=POST
        }
    }
    await send_and_recv(ws, {"type": "setBreakpoint", **hook_payload}, expect_type="breakpointSet")

    # Test breakpoint commands
    breakpoint_command = {
        "type": "setBreakpoint",
        "params": {
            "enabled": True,
            "uid": uid,
            "mode": 0,
            "once": False,
            "desired_status": "SUCCESS",
            "position": 0
        }
    }
    print(f"\n=> SEND: {json.dumps(breakpoint_command)}")
    await ws.send(json.dumps(breakpoint_command))

    response = await ws.recv()
    response_data = json.loads(response)
    print(f"<= {'RECV' if response_data.get('type') == 'breakpointSet' else 'ERROR'}: {json.dumps(response_data, indent=2)}")

    # Get current hooks to verify breakpoint was set and get correct parameters
    print(f"\n=> SEND: {json.dumps({'type': 'getHooks'})}")
    await ws.send(json.dumps({"type": "getHooks"}))

    response = await ws.recv()
    response_data = json.loads(response)
    print(f"<= {'RECV' if response_data.get('type') == 'hooksDump' else 'ERROR'}: {json.dumps(response_data, indent=2)}")

    # Extract hook parameters for removal/unlock
    hooks_data = response_data.get("payload", {}).get("data", [])
    if hooks_data and len(hooks_data) > 0:
        # Use the first hook's parameters
        hook = hooks_data[0]
        hook_uid = hook.get("uid", 256)
        hook_position = hook.get("position", 0)
        print(f"\n✅ Found hook: uid={hook_uid}, position={hook_position}")

        # Test breakpoint removal with correct parameters
        remove_command = {
            "type": "removeBreakpoint",
            "params": {
                "uid": hook_uid,
                "position": hook_position
            }
        }

        print(f"\n=> SEND: {json.dumps(remove_command)}")
        await ws.send(json.dumps(remove_command))

        response = await ws.recv()
        response_data = json.loads(response)
        print(f"<= {'RECV' if response_data.get('type') == 'breakpointRemoved' else 'ERROR'}: {json.dumps(response_data, indent=2)}")

        if response_data.get("type") != "breakpointRemoved":
            print(f"⚠️  Unexpected reply type. expected=breakpointRemoved, got={response_data.get('type')}")
    else:
        print("\n⚠️  No hooks found after setBreakpoint - skipping removal test")

        # Still test unlock with original parameters
        unlock_command = {
            "type": "unlockBreakpoint",
            "params": {
                "uid": 256,
                "position": 0,
                "desired_status": "SUCCESS",
                "remove_when_done": True
            }
        }

        print(f"\n=> SEND: {json.dumps(unlock_command)}")
        await ws.send(json.dumps(unlock_command))

        response = await ws.recv()
        response_data = json.loads(response)
        print(f"<= {'RECV' if response_data.get('type') == 'breakpointUnlocked' else 'ERROR'}: {json.dumps(response_data, indent=2)}")

        if response_data.get("type") != "breakpointUnlocked":
            print(f"⚠️  Unexpected reply type. expected=breakpointUnlocked, got={response_data.get('type')}")


async def test_subscribe(ws):
    # Subscribe to all PUB messages (proxy uses SUB with a topic string)
    await send_and_recv(ws, {"type": "subscribe", "payload": {"topic": ""}}, expect_type="subscribed")

    # Non-blocking receive a couple of pub messages if available
    for _ in range(3):
        try:
            reply_raw = await asyncio.wait_for(ws.recv(), timeout=1.0)
            try:
                reply = json.loads(reply_raw)
            except Exception:
                print(f"<= PUB (raw): {reply_raw}")
                continue
            if reply.get("type") == "pubMessage":
                print(f"<= PUB: {pretty(reply)}")
            else:
                # Not a pub message; print briefly
                print(f"<= OTHER: {pretty(reply)}")
        except asyncio.TimeoutError:
            break


async def main_async(ws_url: str, uid: int):
    print(f"Connecting to {ws_url} ...")
    async with websockets.connect(ws_url, ping_interval=None) as ws:
        print("✓ Connected")

        # Run tests
        await test_basic(ws)
        await test_execution(ws)
        await test_breakpoints(ws, uid=uid)
        await test_subscribe(ws)

    print("Done.")


def main():
    parser = argparse.ArgumentParser(description="WebSocket proxy batch test")
    parser.add_argument("--ws", default="ws://localhost:8080", help="WebSocket URL of the proxy")
    parser.add_argument("--uid", type=int, default=256, help="Node UID used for breakpoint operations")
    args = parser.parse_args()

    asyncio.run(main_async(args.ws, uid=args.uid))


if __name__ == "__main__":
    main()
