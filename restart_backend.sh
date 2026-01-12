#!/bin/bash

echo "=========================================="
echo "Restarting Backend with New Contract Addresses"
echo "=========================================="
echo ""

# Check if backend is running
if lsof -ti:5000 > /dev/null 2>&1 || lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  Backend is running. Please stop it first (Ctrl+C in the terminal where it's running)"
    echo ""
    echo "Or kill it with:"
    echo "  pkill -f 'node.*backend'"
    echo ""
    read -p "Kill existing backend process? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pkill -f 'node.*backend' 2>/dev/null
        pkill -f 'npm.*start' 2>/dev/null
        sleep 2
        echo "✅ Backend processes killed"
    else
        echo "Please stop the backend manually and run this script again"
        exit 1
    fi
fi

echo "Starting backend..."
cd backend
npm start
