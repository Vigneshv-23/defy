#!/bin/bash

# Test Script for Blockchain Integration
# Run this after starting the backend server

API_URL="http://localhost:5000"

echo "=========================================="
echo "Testing Blockchain Integration"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Register User as ModelOwner
echo "Test 1: Register user as modelOwner"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "roles": ["modelOwner"]
  }')

if echo "$RESPONSE" | grep -q "modelOwner"; then
  echo -e "${GREEN}✅ User registered successfully${NC}"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
else
  echo -e "${RED}❌ User registration failed${NC}"
  echo "$RESPONSE"
fi
echo ""

# Test 2: Register Model on Blockchain
echo "Test 2: Register model on blockchain"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL/models" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "name": "Test AI Model",
    "description": "A test model for blockchain integration",
    "ipfsCid": "QmTestModelCID456",
    "pricePerMinute": "1000000000000000"
  }')

if echo "$RESPONSE" | grep -q "blockchainModelId"; then
  echo -e "${GREEN}✅ Model registered on blockchain successfully${NC}"
  BLOCKCHAIN_MODEL_ID=$(echo "$RESPONSE" | jq -r '.blockchainModelId' 2>/dev/null || echo "")
  TRANSACTION_HASH=$(echo "$RESPONSE" | jq -r '.transactionHash' 2>/dev/null || echo "")
  echo "Blockchain Model ID: $BLOCKCHAIN_MODEL_ID"
  echo "Transaction Hash: $TRANSACTION_HASH"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
else
  echo -e "${RED}❌ Model registration failed${NC}"
  echo "$RESPONSE"
  exit 1
fi
echo ""

# Test 3: Get Models
echo "Test 3: Get all models"
echo "-----------------------------------"
RESPONSE=$(curl -s -X GET "$API_URL/models")

if echo "$RESPONSE" | grep -q "Test AI Model"; then
  echo -e "${GREEN}✅ Models retrieved successfully${NC}"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
else
  echo -e "${YELLOW}⚠️  Models retrieved but may not include test model${NC}"
  echo "$RESPONSE"
fi
echo ""

# Test 4: Request Inference (get transaction params)
echo "Test 4: Request inference (get transaction parameters)"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL/inference/request" \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "0",
    "wallet": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "durationMinutes": "10"
  }')

if echo "$RESPONSE" | grep -q "transaction"; then
  echo -e "${GREEN}✅ Inference request parameters generated successfully${NC}"
  TOTAL_COST=$(echo "$RESPONSE" | jq -r '.totalCost' 2>/dev/null || echo "")
  echo "Total Cost: $TOTAL_COST wei"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
else
  echo -e "${RED}❌ Inference request failed${NC}"
  echo "$RESPONSE"
fi
echo ""

# Test 5: Check Inference Status
echo "Test 5: Check inference request status"
echo "-----------------------------------"
RESPONSE=$(curl -s -X GET "$API_URL/inference/status/0")

if echo "$RESPONSE" | grep -q "requestId"; then
  echo -e "${GREEN}✅ Inference status retrieved successfully${NC}"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
else
  echo -e "${YELLOW}⚠️  Request may not exist yet (expected if no inference was made)${NC}"
  echo "$RESPONSE"
fi
echo ""

echo "=========================================="
echo -e "${GREEN}Testing Complete!${NC}"
echo "=========================================="
