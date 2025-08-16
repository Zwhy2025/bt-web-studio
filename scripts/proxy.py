
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
from datetime import datetime
from uuid import UUID

# --- Configuration ---
BT_SERVER_IP = '192.168.31.235'
BT_REQ_PORT = 1667
BT_PUB_PORT = 1668
PROXY_WS_PORT = 8080
# --- End Configuration ---

# Setup detailed logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s [%(levelname)s] %(funcName)s:%(lineno)d - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('./proxy_debug.log')
    ]
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
    # Protocol (1 byte), Type (1 byte), Unique ID (4 bytes, Big Endian)
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

async def handle_client_session(websocket):
    """
    Manages the entire lifecycle of a single WebSocket client connection.
    """
    print(f"New WebSocket client connected from {websocket.remote_address}")
    
    # Create a ZeroMQ context and sockets for this session
    context = zmq.asyncio.Context()
    req_socket = context.socket(zmq.REQ)
    sub_socket = context.socket(zmq.SUB)

    req_socket.connect(f"tcp://{BT_SERVER_IP}:{BT_REQ_PORT}")
    sub_socket.connect(f"tcp://{BT_SERVER_IP}:{BT_PUB_PORT}")
    
    # Initially, don't subscribe to anything. Wait for client 'subscribe' command.
    is_subscribed = False
    
    print(f"ZMQ sockets connected for client {websocket.remote_address}")

    try:
        # Concurrently handle incoming messages from the client and the PUB socket
        client_listener_task = asyncio.create_task(listen_to_client(websocket, req_socket, sub_socket))
        pub_listener_task = asyncio.create_task(listen_to_pub_socket(websocket, sub_socket))
        
        done, pending = await asyncio.wait(
            [client_listener_task, pub_listener_task],
            return_when=asyncio.FIRST_COMPLETED,
        )

        for task in pending:
            task.cancel()

    except websockets.exceptions.ConnectionClosed as e:
        print(f"Client {websocket.remote_address} disconnected: {e}")
    except Exception as e:
        print(f"An unexpected error occurred in session for {websocket.remote_address}: {e}")
    finally:
        print(f"Closing ZMQ sockets for client {websocket.remote_address}")
        req_socket.close()
        sub_socket.close()
        context.term()
        print(f"Session ended for {websocket.remote_address}")


async def listen_to_client(websocket, req_socket, sub_socket):
    """Listens for messages from the WebSocket client and forwards them to the REQ socket."""
    # Initially, don't subscribe to anything. Wait for client 'subscribe' command.
    is_subscribed = False
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
                await handle_get_blackboard(websocket, req_socket, logger)

            elif command_type == "setBreakpoint":
                # payload should contain the breakpoint definition (nodeId, etc.)
                breakpoint_data = payload.get("params", {})
                # Convert breakpoint data to JSON string for ZMQ
                import json as json_lib
                breakpoint_json = json_lib.dumps(breakpoint_data)
                breakpoint_json_buffer = breakpoint_json.encode('utf-8')
                
                unique_id = get_next_request_id()
                header = serialize_request_header(2, 'I', unique_id) # 'I' for HOOK_INSERT
                await req_socket.send([header, breakpoint_json_buffer])
                reply_raw = await req_socket.recv()
                
                # Check reply
                if len(reply_raw) >= 6:
                    reply_header = deserialize_reply_header(reply_raw[:22])
                    await websocket.send(json.dumps({
                        "type": "breakpointSet",
                        "payload": {"success": True, "header": reply_header}
                    }))
                else:
                    # If it's an error, it might come as ['error', errorMessage]
                    try:
                        error_parts = await req_socket.recv_multipart()
                        if len(error_parts) >= 2 and error_parts[0].decode('utf-8') == 'error':
                            error_message = error_parts[1].decode('utf-8')
                            raise Exception(error_message)
                        else:
                            raise Exception('Unexpected reply format for setBreakpoint')
                    except Exception as e:
                        print(f"Error setting breakpoint: {e}")
                        await websocket.send(json.dumps({
                            "type": "error",
                            "replyTo": command_type,
                            "payload": {"message": f"Failed to set breakpoint: {e}"}
                        }))

            elif command_type == "removeBreakpoint":
                # payload should contain the breakpoint ID or node UID to remove
                remove_data = payload.get("params", {})
                # Convert remove data to JSON string for ZMQ
                import json as json_lib
                remove_json = json_lib.dumps(remove_data)
                remove_json_buffer = remove_json.encode('utf-8')
                
                unique_id = get_next_request_id()
                header = serialize_request_header(2, 'R', unique_id) # 'R' for HOOK_REMOVE
                await req_socket.send([header, remove_json_buffer])
                reply_raw = await req_socket.recv()
                
                # Check reply
                if len(reply_raw) >= 6:
                    reply_header = deserialize_reply_header(reply_raw[:22])
                    await websocket.send(json.dumps({
                        "type": "breakpointRemoved",
                        "payload": {"success": True, "header": reply_header}
                    }))
                else:
                    # If it's an error, it might come as ['error', errorMessage]
                    try:
                        error_parts = await req_socket.recv_multipart()
                        if len(error_parts) >= 2 and error_parts[0].decode('utf-8') == 'error':
                            error_message = error_parts[1].decode('utf-8')
                            raise Exception(error_message)
                        else:
                            raise Exception('Unexpected reply format for removeBreakpoint')
                    except Exception as e:
                        print(f"Error removing breakpoint: {e}")
                        await websocket.send(json.dumps({
                            "type": "error",
                            "replyTo": command_type,
                            "payload": {"message": f"Failed to remove breakpoint: {e}"}
                        }))

            elif command_type == "unlockBreakpoint":
                # payload should contain the unlock parameters (e.g., node UID)
                unlock_data = payload.get("params", {})
                # Convert unlock data to JSON string for ZMQ
                import json as json_lib
                unlock_json = json_lib.dumps(unlock_data)
                unlock_json_buffer = unlock_json.encode('utf-8')
                
                unique_id = get_next_request_id()
                header = serialize_request_header(2, 'U', unique_id) # 'U' for BREAKPOINT_UNLOCK
                await req_socket.send([header, unlock_json_buffer])
                reply_raw = await req_socket.recv()
                
                # Check reply
                if len(reply_raw) >= 6:
                    reply_header = deserialize_reply_header(reply_raw[:22])
                    await websocket.send(json.dumps({
                        "type": "breakpointUnlocked",
                        "payload": {"success": True, "header": reply_header}
                    }))
                else:
                    # If it's an error, it might come as ['error', errorMessage]
                    try:
                        error_parts = await req_socket.recv_multipart()
                        if len(error_parts) >= 2 and error_parts[0].decode('utf-8') == 'error':
                            error_message = error_parts[1].decode('utf-8')
                            raise Exception(error_message)
                        else:
                            raise Exception('Unexpected reply format for unlockBreakpoint')
                    except Exception as e:
                        print(f"Error unlocking breakpoint: {e}")
                        await websocket.send(json.dumps({
                            "type": "error",
                            "replyTo": command_type,
                            "payload": {"message": f"Failed to unlock breakpoint: {e}"}
                        }))

            elif command_type == "start":
                unique_id = get_next_request_id()
                header = serialize_request_header(2, '>', unique_id) # '>' for START
                await req_socket.send(header)
                reply_raw = await req_socket.recv()
                
                # Check reply
                if len(reply_raw) >= 6:
                    reply_header = deserialize_reply_header(reply_raw[:22])
                    await websocket.send(json.dumps({
                        "type": "executionStarted",
                        "payload": {"success": True, "header": reply_header}
                    }))
                else:
                    # If it's an error, it might come as ['error', errorMessage]
                    try:
                        error_parts = await req_socket.recv_multipart()
                        if len(error_parts) >= 2 and error_parts[0].decode('utf-8') == 'error':
                            error_message = error_parts[1].decode('utf-8')
                            raise Exception(error_message)
                        else:
                            raise Exception('Unexpected reply format for start')
                    except Exception as e:
                        print(f"Error starting execution: {e}")
                        await websocket.send(json.dumps({
                            "type": "error",
                            "replyTo": command_type,
                            "payload": {"message": f"Failed to start execution: {e}"}
                        }))

            elif command_type == "pause":
                unique_id = get_next_request_id()
                header = serialize_request_header(2, 'p', unique_id) # 'p' for PAUSE
                await req_socket.send(header)
                reply_raw = await req_socket.recv()
                
                # Check reply
                if len(reply_raw) >= 6:
                    reply_header = deserialize_reply_header(reply_raw[:22])
                    await websocket.send(json.dumps({
                        "type": "executionPaused",
                        "payload": {"success": True, "header": reply_header}
                    }))
                else:
                    # If it's an error, it might come as ['error', errorMessage]
                    try:
                        error_parts = await req_socket.recv_multipart()
                        if len(error_parts) >= 2 and error_parts[0].decode('utf-8') == 'error':
                            error_message = error_parts[1].decode('utf-8')
                            raise Exception(error_message)
                        else:
                            raise Exception('Unexpected reply format for pause')
                    except Exception as e:
                        print(f"Error pausing execution: {e}")
                        await websocket.send(json.dumps({
                            "type": "error",
                            "replyTo": command_type,
                            "payload": {"message": f"Failed to pause execution: {e}"}
                        }))

            elif command_type == "stop":
                unique_id = get_next_request_id()
                header = serialize_request_header(2, 'O', unique_id) # 'O' for STOP
                await req_socket.send(header)
                reply_raw = await req_socket.recv()
                
                # Check reply
                if len(reply_raw) >= 6:
                    reply_header = deserialize_reply_header(reply_raw[:22])
                    await websocket.send(json.dumps({
                        "type": "executionStopped",
                        "payload": {"success": True, "header": reply_header}
                    }))
                else:
                    # If it's an error, it might come as ['error', errorMessage]
                    try:
                        error_parts = await req_socket.recv_multipart()
                        if len(error_parts) >= 2 and error_parts[0].decode('utf-8') == 'error':
                            error_message = error_parts[1].decode('utf-8')
                            raise Exception(error_message)
                        else:
                            raise Exception('Unexpected reply format for stop')
                    except Exception as e:
                        print(f"Error stopping execution: {e}")
                        await websocket.send(json.dumps({
                            "type": "error",
                            "replyTo": command_type,
                            "payload": {"message": f"Failed to stop execution: {e}"}
                        }))

            elif command_type == "step":
                unique_id = get_next_request_id()
                header = serialize_request_header(2, 's', unique_id) # 's' for STEP
                await req_socket.send(header)
                reply_raw = await req_socket.recv()
                
                # Check reply
                if len(reply_raw) >= 6:
                    reply_header = deserialize_reply_header(reply_raw[:22])
                    await websocket.send(json.dumps({
                        "type": "executionStepped",
                        "payload": {"success": True, "header": reply_header}
                    }))
                else:
                    # If it's an error, it might come as ['error', errorMessage]
                    try:
                        error_parts = await req_socket.recv_multipart()
                        if len(error_parts) >= 2 and error_parts[0].decode('utf-8') == 'error':
                            error_message = error_parts[1].decode('utf-8')
                            raise Exception(error_message)
                        else:
                            raise Exception('Unexpected reply format for step')
                    except Exception as e:
                        print(f"Error stepping execution: {e}")
                        await websocket.send(json.dumps({
                            "type": "error",
                            "replyTo": command_type,
                            "payload": {"message": f"Failed to step execution: {e}"}
                        }))

            # Add other command handlers here
            # ...

            elif command_type == "subscribe":
                topic = payload.get("topic", "")
                sub_socket.subscribe(topic)
                is_subscribed = True
                print(f"Subscribed to PUB socket with topic: '{topic}'")
                await websocket.send(json.dumps({"type": "subscribed", "payload": {"topic": topic}}))

            else:
                print(f"Unknown command type: {command_type}")
                await websocket.send(json.dumps({
                    "type": "error",
                    "replyTo": command_type,
                    "payload": {"message": f"Unknown command: {command_type}"}
                }))

        except json.JSONDecodeError:
            print("Error: Received invalid JSON from client")
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
            
            print(f"Received PUB message on topic: {topic_str}")

            if topic_str == 'N' and rest: # 'N' for BREAKPOINT_REACHED
                node_uid_str = rest[0].decode('utf-8')
                print(f"Breakpoint reached at node: {node_uid_str}")
                await websocket.send(json.dumps({
                    "type": "breakpointReached",
                    "payload": {"nodeId": node_uid_str}
                }))
            else:
                print(f"Received other PUB message: Topic={topic_str}")

        except asyncio.CancelledError:
            break # Task was cancelled, exit loop
        except Exception as e:
            # Avoid crashing the whole listener on a single bad message
            print(f"Error in PUB socket listener: {e}")
            # Optional: send an error to the client
            # await websocket.send(json.dumps({"type": "error", "payload": {"message": "Error in PUB socket listener"}}))


# --- Enhanced Protocol Handlers ---

async def handle_get_tree(websocket, req_socket, logger):
    """Handle getTree request with enhanced error checking."""
    try:
        unique_id = get_next_request_id()
        header = serialize_request_header(2, 'T', unique_id)
        logger.info(f"🌳 Sending getTree request with ID: {unique_id}")
        
        await req_socket.send(header)
        
        # Handle potential multipart error responses
        try:
            reply_parts = await req_socket.recv_multipart()
            logger.debug(f"Received {len(reply_parts)} parts in getTree reply")
            
            # Check if this is an error response (multipart with 'error' as first part)
            if len(reply_parts) >= 2 and reply_parts[0].decode('utf-8', errors='replace') == 'error':
                error_msg = reply_parts[1].decode('utf-8', errors='replace')
                logger.error(f"❌ getTree multipart error: {error_msg}")
                raise ValueError(f"Backend error: {error_msg}")
            
            # Normal response should be single part
            reply_raw = reply_parts[0] if len(reply_parts) == 1 else b''.join(reply_parts)
            logger.debug(f"Received getTree reply, length: {len(reply_raw)}")
            
            if len(reply_raw) < 22:
                raise ValueError(f"Invalid reply length: {len(reply_raw)}, expected at least 22 bytes")
                
        except zmq.Again:
            logger.error("❌ getTree request timeout")
            raise ValueError("Request timeout")
        
        header_data = deserialize_reply_header(reply_raw[:22])
        xml_data = reply_raw[22:].decode('utf-8', errors='replace')
        
        logger.info(f"getTree reply - Tree ID: {header_data['tree_id']}, XML length: {len(xml_data)}")
        
        if len(xml_data) == 0:
            logger.warning("⚠️  Empty XML received - backend may not have a tree loaded")
        else:
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
        
        # Handle potential multipart error responses
        try:
            reply_parts = await req_socket.recv_multipart()
            logger.debug(f"Received {len(reply_parts)} parts in getStatus reply")
            
            # Check if this is an error response (multipart with 'error' as first part)
            if len(reply_parts) >= 2 and reply_parts[0].decode('utf-8', errors='replace') == 'error':
                error_msg = reply_parts[1].decode('utf-8', errors='replace')
                logger.error(f"❌ getStatus multipart error: {error_msg}")
                raise ValueError(f"Backend error: {error_msg}")
            
            # Normal response should be single part
            reply_raw = reply_parts[0] if len(reply_parts) == 1 else b''.join(reply_parts)
            logger.debug(f"Received getStatus reply, length: {len(reply_raw)}")
            
            # Check if this is a short error response
            if len(reply_raw) < 22:
                error_msg = reply_raw.decode('utf-8', errors='replace')
                logger.error(f"❌ getStatus short error response: {error_msg}")
                raise ValueError(f"Backend error: {error_msg}")
                
        except zmq.Again:
            logger.error("❌ getStatus request timeout")
            raise ValueError("Request timeout")
        
        header_data = deserialize_reply_header(reply_raw[:22])
        status_payload = reply_raw[22:]
        
        logger.debug(f"Status payload length: {len(status_payload)}")
        
        if len(status_payload) == 0:
            logger.warning("⚠️  Empty status payload - tree may not be running")
            await websocket.send(json.dumps({
                "type": "statusUpdate",
                "payload": {"data": {}, "header": header_data, "warning": "No status data available"}
            }))
            return
        
        # Try to parse as msgpack first, then as raw bytes
        try:
            status_data = msgpack.unpackb(status_payload, raw=False)
            logger.info(f"✅ Status data parsed successfully: {type(status_data)}")
            if isinstance(status_data, dict):
                logger.debug(f"Status keys: {list(status_data.keys())}")
        except Exception as msgpack_error:
            logger.warning(f"⚠️  Failed to parse as msgpack: {msgpack_error}")
            # Try parsing as raw node status data
            status_data = parse_raw_status_data(status_payload)
            logger.info(f"✅ Parsed as raw status data: {len(status_data) if isinstance(status_data, list) else 'unknown'} nodes")
        
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

async def handle_get_blackboard(websocket, req_socket, logger):
    """Handle getBlackboard request with enhanced error checking."""
    try:
        unique_id = get_next_request_id()
        header = serialize_request_header(2, 'B', unique_id)
        logger.info(f"📋 Sending getBlackboard request with ID: {unique_id}")
        
        await req_socket.send(header)
        
        # Handle potential multipart error responses
        try:
            reply_parts = await req_socket.recv_multipart()
            logger.debug(f"Received {len(reply_parts)} parts in getBlackboard reply")
            
            # For Blackboard responses, we expect binary data in multipart format
            # Blackboard data is always binary, so we should NOT check for text-based errors
            # Only check for errors if we get a very short response that could be a text error
            logger.debug("Processing blackboard multipart response - treating as normal binary data")
            
            # Normal response - join all parts for blackboard data
            reply_raw = b''.join(reply_parts)
            logger.debug(f"Joined {len(reply_parts)} parts into {len(reply_raw)} bytes")
            logger.debug(f"Received getBlackboard reply, length: {len(reply_raw)}")
            
            # Check if this is a short error response
            if len(reply_raw) < 22:
                error_msg = reply_raw.decode('utf-8', errors='replace')
                logger.error(f"❌ getBlackboard short error response: {error_msg}")
                raise ValueError(f"Backend error: {error_msg}")
                
        except zmq.Again:
            logger.error("❌ getBlackboard request timeout")
            raise ValueError("Request timeout")
        
        header_data = deserialize_reply_header(reply_raw[:22])
        blackboard_payload = reply_raw[22:]
        
        logger.debug(f"Blackboard payload length: {len(blackboard_payload)}")
        
        if len(blackboard_payload) == 0:
            logger.warning("⚠️  Empty blackboard payload - no blackboard data available")
            await websocket.send(json.dumps({
                "type": "blackboardUpdate",
                "payload": {"data": {}, "header": header_data, "warning": "No blackboard data available"}
            }))
            return
        
        # Try to parse as msgpack
        try:
            blackboard_data = msgpack.unpackb(blackboard_payload, raw=False)
            logger.info(f"✅ Blackboard data parsed successfully: {type(blackboard_data)}")
            if isinstance(blackboard_data, dict):
                logger.debug(f"Blackboard keys: {list(blackboard_data.keys())}")
        except Exception as msgpack_error:
            logger.error(f"❌ Failed to parse blackboard data as msgpack: {msgpack_error}")
            blackboard_data = {"error": "Failed to parse blackboard data"}
        
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

async def main():
    """Main function to start the WebSocket proxy server."""
    logger.info("🚀 Starting Groot2 WebSocket Proxy (Enhanced)")
    logger.info(f"📡 WebSocket server will listen on ws://localhost:{PROXY_WS_PORT}")
    logger.info(f"🔗 Backend ZMQ server: {BT_SERVER_IP}:{BT_REQ_PORT}/{BT_PUB_PORT}")
    
    async with websockets.serve(handle_client_session, "localhost", PROXY_WS_PORT):
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Server stopped manually.")

