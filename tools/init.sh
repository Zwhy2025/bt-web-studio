#!/bin/bash

# This script installs dependencies for both the frontend and the Python proxy.

# Exit immediately if a command exits with a non-zero status.
set -e

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# --- Frontend Dependency Installation ---
echo "Installing frontend dependencies..."
cd "$PROJECT_ROOT"
npm install

# --- Python Dependency Installation ---
echo "Installing Python dependencies..."
cd "$PROJECT_ROOT/scripts"
# Create a virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt

echo "
Installation complete."
