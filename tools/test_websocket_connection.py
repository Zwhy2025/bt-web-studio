#!/usr/bin/env python3

import asyncio
import websockets

async def test_websocket_connection():
    uri = "ws://localhost:8080"
    try:
        async with websockets.connect(uri) as websocket:
            print(f"Successfully connected to {uri}")
            # Send a simple message
            await websocket.send('{"type": "getTree"}')
            print("Sent getTree command")
            
            # Wait for a response
            response = await websocket.recv()
            print(f"Received response: {response}")
            
    except Exception as e:
        print(f"Failed to connect to {uri}: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket_connection())