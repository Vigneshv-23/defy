#!/bin/bash

# Script to start ngrok tunnel for backend API

PORT=${1:-3000}

echo "=========================================="
echo "Starting ngrok tunnel for backend API"
echo "=========================================="
echo ""
echo "Backend port: $PORT"
echo ""

# Check if backend is running
if ! lsof -ti:$PORT > /dev/null 2>&1; then
    echo "⚠️  Warning: Backend doesn't seem to be running on port $PORT"
    echo "   Start the backend first:"
    echo "   cd backend && npm start"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "Starting ngrok tunnel..."
echo ""

# Start ngrok
ngrok http $PORT
