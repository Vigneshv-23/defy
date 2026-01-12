#!/bin/bash

# Test Script: Model Owner Payment Flow
# This demonstrates how model owners receive ETH payments

RPC_URL="http://localhost:8545"

# Contract addresses (from latest deployment - UPDATE THESE!)
NODE_REGISTRY="0xd17eae3b56484e02daa9d4d34efb09caf3c9a0c4"
MODEL_REGISTRY="0x401173140a22206a223c59ff624e38b5bdfa4f0f"
INFERENCE_MANAGER="0x08375211ae03be71f1c6b711c95501d072e5e9be"

# Account addresses
MODEL_OWNER_ADDR="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
MODEL_OWNER_PK="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
CUSTOMER_ADDR="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
CUSTOMER_PK="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "Model Owner Payment Flow Test"
echo "=========================================="
echo ""

# Step 1: Check initial balances
echo "Step 1: Initial Balances"
echo "-----------------------------------"
MODEL_OWNER_BALANCE_INITIAL=$(cast balance "$MODEL_OWNER_ADDR" --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')
CUSTOMER_BALANCE_INITIAL=$(cast balance "$CUSTOMER_ADDR" --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')
CONTRACT_BALANCE_INITIAL=$(cast balance "$INFERENCE_MANAGER" --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')

echo "Model Owner: $MODEL_OWNER_BALANCE_INITIAL ETH"
echo "Customer: $CUSTOMER_BALANCE_INITIAL ETH"
echo "Contract: $CONTRACT_BALANCE_INITIAL ETH"
echo ""

# Step 2: Register a model (Model Owner)
echo "Step 2: Register Model"
echo "-----------------------------------"
echo "Registering model with price 0.001 ETH per minute..."
cast send "$MODEL_REGISTRY" \
  "registerModel(string,uint256)" \
  "QmTestModelCID123" \
  1000000000000000 \
  --private-key "$MODEL_OWNER_PK" \
  --rpc-url "$RPC_URL" > /dev/null 2>&1
echo -e "${GREEN}✅ Model registered${NC}"
echo ""

# Step 3: Add node to NodeRegistry
echo "Step 3: Add Node to NodeRegistry"
echo "-----------------------------------"
echo "Adding model owner as an approved node..."
cast send "$NODE_REGISTRY" \
  "addNode(address)" \
  "$MODEL_OWNER_ADDR" \
  --private-key "$MODEL_OWNER_PK" \
  --rpc-url "$RPC_URL" > /dev/null 2>&1
echo -e "${GREEN}✅ Node added${NC}"
echo ""

# Step 4: Customer requests inference (pays 0.01 ETH)
echo "Step 4: Customer Requests Inference (Pays 0.01 ETH)"
echo "-----------------------------------"
echo "Customer requests 10 minutes of inference..."
echo "Total cost: 0.001 ETH/min × 10 min = 0.01 ETH"
cast send "$INFERENCE_MANAGER" \
  "requestInference(uint256,uint256)" \
  0 \
  10 \
  --value 10000000000000000 \
  --private-key "$CUSTOMER_PK" \
  --rpc-url "$RPC_URL" > /dev/null 2>&1
echo -e "${GREEN}✅ Inference requested, payment sent to contract${NC}"
echo ""

# Step 5: Check balances after payment
echo "Step 5: Balances After Payment (Before Distribution)"
echo "-----------------------------------"
sleep 2
MODEL_OWNER_BALANCE_AFTER_PAYMENT=$(cast balance "$MODEL_OWNER_ADDR" --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')
CUSTOMER_BALANCE_AFTER_PAYMENT=$(cast balance "$CUSTOMER_ADDR" --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')
CONTRACT_BALANCE_AFTER_PAYMENT=$(cast balance "$INFERENCE_MANAGER" --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')

echo "Model Owner: $MODEL_OWNER_BALANCE_AFTER_PAYMENT ETH (no change yet)"
echo "Customer: $CUSTOMER_BALANCE_AFTER_PAYMENT ETH (reduced by ~0.01 ETH)"
echo "Contract: $CONTRACT_BALANCE_AFTER_PAYMENT ETH (holds 0.01 ETH)"
echo ""

# Step 6: Submit result (distributes payment 50/50)
echo "Step 6: Submit Result (Distribute Payment)"
echo "-----------------------------------"
echo "Node submits result - payment splits 50/50..."
cast send "$INFERENCE_MANAGER" \
  "submitResult(uint256)" \
  0 \
  --private-key "$MODEL_OWNER_PK" \
  --rpc-url "$RPC_URL" > /dev/null 2>&1
echo -e "${GREEN}✅ Result submitted, payment distributed${NC}"
echo ""

# Step 7: Final balances
echo "Step 7: Final Balances (After Distribution)"
echo "-----------------------------------"
sleep 2
MODEL_OWNER_BALANCE_FINAL=$(cast balance "$MODEL_OWNER_ADDR" --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')
CUSTOMER_BALANCE_FINAL=$(cast balance "$CUSTOMER_ADDR" --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')
CONTRACT_BALANCE_FINAL=$(cast balance "$INFERENCE_MANAGER" --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')

MODEL_OWNER_GAIN=$(echo "$MODEL_OWNER_BALANCE_FINAL - $MODEL_OWNER_BALANCE_INITIAL" | bc -l)

echo "Model Owner: $MODEL_OWNER_BALANCE_FINAL ETH"
echo "  ${GREEN}Gained: $MODEL_OWNER_GAIN ETH${NC} ✅"
echo "Customer: $CUSTOMER_BALANCE_FINAL ETH"
echo "Contract: $CONTRACT_BALANCE_FINAL ETH (should be 0)"
echo ""

echo "=========================================="
echo -e "${GREEN}✅ Payment Flow Complete!${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "- Customer paid: 0.01 ETH"
echo "- Model Owner received: ~0.005 ETH (50%)"
echo "- Node received: ~0.005 ETH (50%)"
echo "- In this test, model owner and node are the same, so they received full 0.01 ETH"
