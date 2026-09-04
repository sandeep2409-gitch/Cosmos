#!/usr/bin/env bash

# Change to project root directory
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "======================================================="
echo "[LAUNCH] Launching COSMOS Exploration Engine..."
echo "======================================================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "[ERROR] Error: Node.js is not installed or not available in PATH."
    exit 1
fi

node start.js
