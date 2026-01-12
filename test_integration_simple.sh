#!/bin/bash

# Simple Test Script for Blockchain Integration
API_URL="http://localhost:5000"

echo "=========================================="
echo "Testing Blockchain Integration"
echo "=========================================="
echo ""

# Check if backend is running
if ! curl -s "$API_URL" > /dev/null; then
  echo "❌ Backend is not running on $API_URL"
  echo "   Start it with: cd backend && npm start"
  exit 1
fi

echo "✅ Backend is running"
echo ""

# Test 1: Register User
echo "Test 1: Register user as modelOwner..."
RESPONSE=$(curl -s -X POST "$API_URL/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "roles": ["modelOwner"]
  }')

if echo "$RESPONSE" | grep -q "modelOwner"; then
  echo "✅ User registered"
else
  echo "⚠️  User might already exist or error occurred"
fi
echo ""

# Test 2: Register Model on Blockchain
echo "Test 2: Register model on blockchain..."
RESPONSE=$(curl -s -X POST "$API_URL/models" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "name": "Test AI Model",
    "description": "Testing blockchain integration",
    "ipfsCid": "QmTestModelCID456",
    "pricePerMinute": "1000000000000000"
  }')

if echo "$RESPONSE" | grep -q "blockchainModelId"; then
  echo "✅ Model registered on blockchain!"
  BLOCKCHAIN_ID=$(echo "$RESPONSE" | grep -o '"blockchainModelId":"[^"]*"' | cut -d'"' -f4)
  TX_HASH=$(echo "$RESPONSE" | grep -o '"transactionHash":"[^"]*"' | cut -d'"' -f4)
  echo "   Blockchain Model ID: $BLOCKCHAIN_ID"
  echo "   Transaction Hash: $TX_HASH"
else
  echo "❌ Model registration failed"
  echo "Response: $RESPONSE"
  exit 1
fi
echo ""

# Test 3: Request Inference
echo "Test 3: Request inference (get transaction parameters)..."
RESPONSE=$(curl -s -X POST "$API_URL/inference/request" \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "0",
    "wallet": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "durationMinutes": "10"
  }')

if echo "$RESPONSE" | grep -q "transaction"; then
  echo "✅ Inference request parameters generated!"
  TOTAL_COST=$(echo "$RESPONSE" | grep -o '"totalCost":"[^"]*"' | cut -d'"' -f4)
  echo "   Total Cost: $TOTAL_COST wei (0.01 ETH)"
else
  echo "❌ Inference request failed"
  echo "Response: $RESPONSE"
fi
echo ""

echo "=========================================="
echo "✅ Basic tests complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Check backend logs to see if listener is working"
echo "2. Execute inference transaction (see TESTING_GUIDE.md)"
echo "3. Verify event listener captures durationMinutes correctly"
