import asyncio
import json
import zmq
import zmq.asyncio
import websockets
import struct
import logging
import traceback
import time
import msgpack
import argparse
from datetime import datetime
from uuid import UUID

# Setup detailed logging
logging.basicConfig(
    level=logging.INFO, # Default to INFO, can be overridden
    format='%(asctime)s [%(levelname)s] %(funcName)s:%(lineno)d - %(message)s',
)
logger = logging.getLogger(__name__)

# Global request ID counter
request_id_counter = 1

def get_next_request_id():
    """Generates a unique, sequential request ID."""
    global request_id_counter
    request_id = request_id_counter
    request_id_counter += 1
    return request_id

def serialize_request_header(protocol, type_char, unique_id):
    """Serializes the Groot2 request header into a buffer."""
    logger.debug(f"Serializing header: protocol={protocol}, type='{type_char}', id={unique_id}")
    try:
        result = struct.pack('!BBi', protocol, ord(type_char), unique_id)
        logger.debug(f"Header serialized successfully, length: {len(result)}, hex: {result.hex()}")
        return result
    except Exception as e:
        logger.error(f"Failed to serialize header: {e}")
        logger.error(traceback.format_exc())
        raise

def deserialize_reply_header(buffer):
    """Deserializes the Groot2 reply header from a buffer."""
    logger.debug(f"Deserializing reply header, buffer length: {len(buffer)}, hex: {buffer[:22].hex() if len(buffer) >= 22 else buffer.hex()}")
    
    if len(buffer) < 22:
        error_msg = f"Reply header too short: {len(buffer)} bytes, expected 22"
        logger.error(error_msg)
        raise ValueError(error_msg)
    
    try:
        protocol, type_code, unique_id = struct.unpack('!BBi', buffer[:6])
        tree_id_bytes = buffer[6:22]
        tree_id = UUID(bytes=tree_id_bytes)
        
        result = {
            "protocol": protocol,
            "type": chr(type_code),
            "unique_id": unique_id,
            "tree_id": str(tree_id)
        }
        logger.debug(f"Header deserialized: {result}")
        return result
    except Exception as e:
        logger.error(f"Failed to deserialize header: {e}")
        logger.error(traceback.format_exc())
        raise

async def handle_client_session(websocket, args):
    """
    Manages the entire lifecycle of a single WebSocket client connection.
    """
    logger.info(f"New WebSocket client connected from {websocket.remote_address}")
    
    context = zmq.asyncio.Context()
    req_socket = context.socket(zmq.REQ)
    sub_socket = context.socket(zmq.SUB)

    req_socket.connect(f"tcp://{args.bt_ip}:{args.req_port}")
    sub_socket.connect(f"tcp://{args.bt_ip}:{args.pub_port}")
    
    logger.info(f"ZMQ sockets connected for client {websocket.remote_address}")

    try:
        client_listener_task = asyncio.create_task(listen_to_client(websocket, req_socket, sub_socket))
        pub_listener_task = asyncio.create_task(listen_to_pub_socket(websocket, sub_socket))
        
        done, pending = await asyncio.wait(
            [client_listener_task, pub_listener_task],
            return_when=asyncio.FIRST_COMPLETED,
        )

        for task in pending:
            task.cancel()

    except websockets.exceptions.ConnectionClosed as e:
        logger.info(f"Client {websocket.remote_address} disconnected: {e}")
    except Exception as e:
        logger.error(f"An unexpected error occurred in session for {websocket.remote_address}: {e}")
    finally:
        logger.info(f"Closing ZMQ sockets for client {websocket.remote_address}")
        req_socket.close()
        sub_socket.close()
        context.term()
        logger.info(f"Session ended for {websocket.remote_address}")


async def listen_to_client(websocket, req_socket, sub_socket):
    """Listens for messages from the WebSocket client and forwards them to the REQ socket."""
    async for message in websocket:
        start_time = time.time()
        try:
            data = json.loads(message)
            command_type = data.get("type")
            payload = data.get("payload", {})
            
            logger.info(f"📥 Received command: {command_type} with payload keys: {list(payload.keys()) if payload else 'none'}")

            if command_type == "getTree":
                await handle_get_tree(websocket, req_socket, logger)
            elif command_type == "getStatus":
                await handle_get_status(websocket, req_socket, logger)
            elif command_type == "getBlackboard":
                await handle_get_blackboard(websocket, req_socket, logger, payload)
            elif command_type == "getHooks":
                await handle_get_hooks(websocket, req_socket, logger)
            elif command_type in ["setBreakpoint", "removeBreakpoint", "unlockBreakpoint", "start", "pause", "stop", "step"]:
                 # Simplified handling for commands that are similar
                await handle_generic_command(websocket, req_socket, logger, command_type, data)
            elif command_type == "subscribe":
                topic = payload.get("topic", "")
                sub_socket.subscribe(topic)
                logger.info(f"Subscribed to PUB socket with topic: '{topic}'")
                await websocket.send(json.dumps({"type": "subscribed", "payload": {"topic": topic}}))
            else:
                logger.warning(f"Unknown command type: {command_type}")
                await websocket.send(json.dumps({
                    "type": "error",
                    "replyTo": command_type,
                    "payload": {"message": f"Unknown command: {command_type}"}
                }))

        except json.JSONDecodeError:
            logger.error("Error: Received invalid JSON from client")
            await websocket.send(json.dumps({"type": "error", "payload": {"message": "Invalid JSON format"}}))
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"❌ Error processing {command_type if 'command_type' in locals() else 'unknown'} command in {processing_time:.3f}s: {e}")
            logger.error(traceback.format_exc())
            await websocket.send(json.dumps({
                "type": "error",
                "payload": {"message": str(e)}
            }))
        else:
            processing_time = time.time() - start_time
            logger.info(f"✅ Successfully processed {command_type} in {processing_time:.3f}s")

async def listen_to_pub_socket(websocket, sub_socket):
    """Listens for messages from the ZMQ PUB socket and forwards them to the client."""
    while True:
        try:
            topic, *rest = await sub_socket.recv_multipart()
            topic_str = topic.decode('utf-8')
            
            logger.debug(f"Received PUB message on topic: {topic_str}")

            if topic_str == 'N' and rest: # 'N' for BREAKPOINT_REACHED
                node_uid_str = rest[0].decode('utf-8')
                logger.info(f"Breakpoint reached at node: {node_uid_str}")
                await websocket.send(json.dumps({
                    "type": "breakpointReached",
                    "payload": {"nodeId": node_uid_str}
                }))
            else:
                logger.debug(f"Received other PUB message: Topic={topic_str}")

        except asyncio.CancelledError:
            break # Task was cancelled, exit loop
        except Exception as e:
            logger.error(f"Error in PUB socket listener: {e}")

async def handle_generic_command(websocket, req_socket, logger, command_type, data):
    """Handles various commands that have a similar request/reply structure."""
    COMMAND_MAP = {
        "setBreakpoint": ('I', "breakpointSet"),
        "removeBreakpoint": ('R', "breakpointRemoved"),
        "unlockBreakpoint": ('U', "breakpointUnlocked"),
        "start": ('>', "executionStarted"),
        "pause": ('p', "executionPaused"),
        "stop": ('O', "executionStopped"),
        "step": ('s', "executionStepped"),
    }
    type_char, reply_type = COMMAND_MAP[command_type]
    
    try:
        unique_id = get_next_request_id()
        header = serialize_request_header(2, type_char, unique_id)
        logger.info(f"🚀 Sending {command_type} request with ID: {unique_id}")

        params = data.get("params") or data.get("payload", {}).get("params") or {}
        
        if command_type in ["setBreakpoint", "removeBreakpoint", "unlockBreakpoint"]:
            # These commands send a JSON payload
            json_payload = json.dumps(params).encode('utf-8')
            await req_socket.send_multipart([header, json_payload])
        else:
            # These commands send only the header
            await req_socket.send(header)

        reply_parts = await req_socket.recv_multipart()
        logger.debug(f"Received {len(reply_parts)} parts in {command_type} reply")

        if len(reply_parts) >= 2 and reply_parts[0].decode('utf-8', errors='ignore') == 'error':
            error_message = reply_parts[1].decode('utf-8', errors='replace')
            raise Exception(error_message)

        reply_raw = reply_parts[0]
        if len(reply_raw) < 22:
             raise Exception(f"Short reply: {reply_raw.decode('utf-8', errors='replace')}")

        reply_header = deserialize_reply_header(reply_raw[:22])
        logger.info(f"✅ {command_type} executed successfully")
        await websocket.send(json.dumps({
            "type": reply_type,
            "payload": {"success": True, "header": reply_header}
        }))

    except Exception as e:
        logger.error(f"❌ {command_type} failed: {e}")
        await websocket.send(json.dumps({
            "type": "error",
            "replyTo": command_type,
            "payload": {"message": f"Failed to execute {command_type}: {e}"}
        }))


async def handle_get_tree(websocket, req_socket, logger):
    """Handle getTree request with enhanced error checking."""
    try:
        unique_id = get_next_request_id()
        header = serialize_request_header(2, 'T', unique_id)
        logger.info(f"🌳 Sending getTree request with ID: {unique_id}")
        
        await req_socket.send(header)
        reply_parts = await req_socket.recv_multipart()
        
        if len(reply_parts) >= 2 and reply_parts[0].decode('utf-8', errors='replace') == 'error':
            raise ValueError(f"Backend error: {reply_parts[1].decode('utf-8', errors='replace')}")
        
        reply_raw = reply_parts[0]
        if len(reply_raw) < 22:
            raise ValueError(f"Invalid reply length: {len(reply_raw)}")
            
        header_data = deserialize_reply_header(reply_raw[:22])
        xml_data = reply_raw[22:].decode('utf-8', errors='replace')
        
        logger.info(f"✅ Tree data received successfully ({len(xml_data)} chars)")
        
        await websocket.send(json.dumps({
            "type": "treeData",
            "payload": {"xml": xml_data, "header": header_data}
        }))
        
    except Exception as e:
        logger.error(f"❌ getTree failed: {e}")
        await websocket.send(json.dumps({
            "type": "error",
            "replyTo": "getTree",
            "payload": {"message": f"Failed to get tree: {e}"}
        }))

async def handle_get_status(websocket, req_socket, logger):
    """Handle getStatus request with enhanced error checking."""
    try:
        unique_id = get_next_request_id()
        header = serialize_request_header(2, 'S', unique_id)
        logger.info(f"📊 Sending getStatus request with ID: {unique_id}")
        
        await req_socket.send(header)
        reply_parts = await req_socket.recv_multipart()

        if len(reply_parts) >= 2 and reply_parts[0].decode('utf-8', errors='replace') == 'error':
            raise ValueError(f"Backend error: {reply_parts[1].decode('utf-8', errors='replace')}")

        reply_raw = reply_parts[0]
        if len(reply_raw) < 22:
            raise ValueError(f"Backend error: {reply_raw.decode('utf-8', errors='replace')}")
            
        header_data = deserialize_reply_header(reply_raw[:22])
        status_payload = reply_raw[22:]
        
        if not status_payload:
            logger.warning("⚠️  Empty status payload - tree may not be running")
            status_data = {}
        else:
            try:
                status_data = msgpack.unpackb(status_payload, raw=False)
            except Exception as msgpack_error:
                logger.warning(f"⚠️  Failed to parse as msgpack: {msgpack_error}, trying raw parse.")
                status_data = parse_raw_status_data(status_payload)
        
        logger.info(f"✅ Status data parsed successfully")
        await websocket.send(json.dumps({
            "type": "statusUpdate",
            "payload": {"data": status_data, "header": header_data}
        }))
        
    except Exception as e:
        logger.error(f"❌ getStatus failed: {e}")
        await websocket.send(json.dumps({
            "type": "error",
            "replyTo": "getStatus",
            "payload": {"message": f"Operation cannot be accomplished in current state: {e}"}
        }))

async def handle_get_hooks(websocket, req_socket, logger):
    """Handle getHooks request to retrieve current breakpoint hooks."""
    try:
        unique_id = get_next_request_id()
        header = serialize_request_header(2, 'D', unique_id)
        logger.info(f"🔗 Sending getHooks request with ID: {unique_id}")
        
        await req_socket.send(header)
        reply_parts = await req_socket.recv_multipart()

        if len(reply_parts) >= 2 and reply_parts[0].decode('utf-8', errors='replace') == 'error':
            raise ValueError(f"Backend error: {reply_parts[1].decode('utf-8', errors='replace')}")

        reply_raw = reply_parts[0]
        if len(reply_raw) < 22:
            raise ValueError(f"Invalid reply length: {len(reply_raw)}")
            
        header_data = deserialize_reply_header(reply_raw[:22])
        hooks_payload = reply_raw[22:]
        
        hooks_data = []
        if not hooks_payload:
            logger.info("✅ No hooks currently set")
        else:
            try:
                hooks_data = json.loads(hooks_payload.decode('utf-8'))
                logger.info(f"✅ Hooks data parsed successfully: {len(hooks_data)} hooks")
            except Exception as json_error:
                logger.error(f"❌ Failed to parse hooks data as JSON: {json_error}")

        await websocket.send(json.dumps({
            "type": "hooksDump",
            "payload": {"data": hooks_data, "header": header_data}
        }))
        
    except Exception as e:
        logger.error(f"❌ getHooks failed: {e}")
        await websocket.send(json.dumps({
            "type": "error",
            "replyTo": "getHooks",
            "payload": {"message": f"Failed to get hooks: {e}"}
        }))

async def handle_get_blackboard(websocket, req_socket, logger, payload=None):
    """Handle getBlackboard request with enhanced error checking."""
    try:
        unique_id = get_next_request_id()
        header = serialize_request_header(2, 'B', unique_id)
        logger.info(f"📋 Sending getBlackboard request with ID: {unique_id}")
        
        bb_names = (payload.get("names") or "MainTree").strip() or "MainTree"
        await req_socket.send_multipart([header, bb_names.encode('utf-8')])
        reply_parts = await req_socket.recv_multipart()

        if len(reply_parts) >= 2 and reply_parts[0].decode('utf-8', errors='ignore') == 'error':
            raise ValueError(f"Backend error: {reply_parts[1].decode('utf-8', errors='replace')}")

        reply_raw = reply_parts[0]
        if len(reply_raw) < 22:
            raise ValueError(f"Backend error: {reply_raw.decode('utf-8', errors='replace')}")

        header_data = deserialize_reply_header(reply_raw[:22])
        blackboard_payload = b''.join(reply_parts[1:])
        
        blackboard_data = {}
        if not blackboard_payload:
            logger.info("✅ Empty blackboard data - no entries")
        else:
            try:
                blackboard_data = msgpack.unpackb(blackboard_payload, raw=False)
                logger.info(f"✅ Blackboard data parsed successfully")
            except Exception as msgpack_error:
                logger.error(f"❌ Failed to parse blackboard data as msgpack: {msgpack_error}")

        await websocket.send(json.dumps({
            "type": "blackboardUpdate",
            "payload": {"data": blackboard_data, "header": header_data}
        }))
        
    except Exception as e:
        logger.error(f"❌ getBlackboard failed: {e}")
        await websocket.send(json.dumps({
            "type": "error",
            "replyTo": "getBlackboard",
            "payload": {"message": f"Operation cannot be accomplished in current state: {e}"}
        }))

def parse_raw_status_data(payload):
    """Parse raw status data as node UID + status pairs."""
    try:
        nodes = []
        offset = 0
        while offset + 3 <= len(payload):
            uid = struct.unpack('!H', payload[offset:offset+2])[0]  # 2 bytes UID
            status = payload[offset+2]  # 1 byte status
            nodes.append({"uid": uid, "status": status})
            offset += 3
        return nodes
    except Exception as e:
        logger.error(f"Failed to parse raw status data: {e}")
        return []

async def main_async(args):
    """Main async function to start the WebSocket proxy server."""
    logger.info("🚀 Starting Groot2 WebSocket Proxy (Enhanced)")
    logger.info(f"📡 WebSocket server will listen on ws://{args.host}:{args.ws_port}")
    logger.info(f"🔗 Backend ZMQ server: {args.bt_ip}:{args.req_port}/{args.pub_port}")
    
    # Curry the handler to pass args
    session_handler = lambda ws: handle_client_session(ws, args)
    
    async with websockets.serve(session_handler, args.host, args.ws_port):
        await asyncio.Future()  # Run forever

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="WebSocket proxy for Groot2 BehaviorTree.CPP")
    parser.add_argument("--bt-ip", default='localhost', help="IP address of the BehaviorTree.CPP ZMQ server")
    parser.add_argument("--req-port", type=int, default=1667, help="Request port of the ZMQ server")
    parser.add_argument("--pub-port", type=int, default=1668, help="Publisher port of the ZMQ server")
    parser.add_argument("--host", default="localhost", help="Host for the WebSocket proxy to listen on")
    parser.add_argument("--ws-port", type=int, default=8080, help="Port for the WebSocket proxy to listen on")
    parser.add_argument("-v", "--verbose", action="store_true", help="Enable verbose DEBUG logging")
    args = parser.parse_args()

    if args.verbose:
        logger.setLevel(logging.DEBUG)

    try:
        asyncio.run(main_async(args))
    except KeyboardInterrupt:
        logger.info("Server stopped manually.")

if __name__ == "__main__":
    main()