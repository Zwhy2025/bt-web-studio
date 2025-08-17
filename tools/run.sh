#!/bin/bash

# This script starts the Python proxy and the frontend service.

# Exit immediately if a command exits with a non-zero status.
set -e

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# --- Clear Occupied Ports ---
echo "Clearing occupied ports..."
if lsof -t -i:8080; then fuser -k 8080/tcp; fi
if lsof -t -i:5173; then fuser -k 5173/tcp; fi
echo "Ports cleared." 


# --- Start Python Proxy ---
echo "Starting Python proxy..."
cd "$PROJECT_ROOT/scripts"
source venv/bin/activate
python proxy.py & # Run in the background
PROXY_PID=$!

# --- Start Frontend Service ---
echo "Starting frontend service..."
cd "$PROJECT_ROOT"
npm run dev &
FRONTEND_PID=$!

# Wait for both processes to exit
wait $PROXY_PID
wait $FRONTEND_PID
