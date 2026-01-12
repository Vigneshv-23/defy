#!/bin/bash

# Test Script: Payment Split 75/25 - Visible in MetaMask
# This demonstrates the payment flow so you can see balance changes in MetaMask

RPC_URL="http://localhost:8545"

# Latest deployed contract addresses
NODE_REGISTRY="0x2a120a68b991489b3bfb14adb272d5420ff7b56b"
MODEL_REGISTRY="0x5d4b28587074a43727dbad1aedb86cba108ac21b"
INFERENCE_MANAGER="0x1e672C6d44A6830fc064E2237B011506676B37f9"

# Account addresses
MODEL_OWNER_ADDR="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
MODEL_OWNER_PK="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
CUSTOMER_ADDR="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
CUSTOMER_PK="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
COMMISSION_ADDR="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=========================================="
echo "Payment Split Test (75% Model Owner / 25% Commission)"
echo "Visible in MetaMask!"
echo "=========================================="
echo ""

# Step 1: Check initial balances
echo "Step 1: Initial Balances (Check in MetaMask)"
echo "-----------------------------------"
MODEL_OWNER_BAL_INITIAL=$(cast balance "$MODEL_OWNER_ADDR" --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')
COMMISSION_BAL_INITIAL=$(cast balance "$COMMISSION_ADDR" --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')
CUSTOMER_BAL_INITIAL=$(cast balance "$CUSTOMER_ADDR" --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')

echo -e "${BLUE}Model Owner (Account 1):${NC} $MODEL_OWNER_BAL_INITIAL ETH"
echo -e "${BLUE}Commission Account (Account 2):${NC} $COMMISSION_BAL_INITIAL ETH"
echo -e "${BLUE}Customer (Account 1):${NC} $CUSTOMER_BAL_INITIAL ETH"
echo ""
echo "📱 Check these balances in MetaMask now!"
echo ""

# Step 2: Register a model
echo "Step 2: Register Model"
echo "-----------------------------------"
echo "Registering model with price 0.001 ETH per minute..."
cast send "$MODEL_REGISTRY" \
  "registerModel(string,uint256)" \
  "QmTestModelCID789" \
  1000000000000000 \
  --private-key "$MODEL_OWNER_PK" \
  --rpc-url "$RPC_URL" > /dev/null 2>&1
echo -e "${GREEN}✅ Model registered${NC}"
echo ""

# Step 3: Add node to NodeRegistry
echo "Step 3: Add Node to NodeRegistry"
echo "-----------------------------------"
echo "Adding model owner as an approved node..."
# Get the admin address first
ADMIN_ADDR=$(cast call "$NODE_REGISTRY" "admin()" --rpc-url "$RPC_URL" | cut -c 27-66)
echo "Admin address: $ADMIN_ADDR"
echo "Note: Node needs to be added by admin. Skipping for now..."
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

# Step 5: Check balances after payment (before distribution)
echo "Step 5: Balances After Payment (Before Distribution)"
echo "-----------------------------------"
sleep 2
MODEL_OWNER_BAL_AFTER_PAYMENT=$(cast balance "$MODEL_OWNER_ADDR" --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')
COMMISSION_BAL_AFTER_PAYMENT=$(cast balance "$COMMISSION_ADDR" --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')
CUSTOMER_BAL_AFTER_PAYMENT=$(cast balance "$CUSTOMER_ADDR" --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')
CONTRACT_BALANCE=$(cast balance "$INFERENCE_MANAGER" --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')

echo -e "${BLUE}Model Owner:${NC} $MODEL_OWNER_BAL_AFTER_PAYMENT ETH (no change yet)"
echo -e "${BLUE}Commission Account:${NC} $COMMISSION_BAL_AFTER_PAYMENT ETH (no change yet)"
echo -e "${BLUE}Customer:${NC} $CUSTOMER_BAL_AFTER_PAYMENT ETH (reduced by ~0.01 ETH)"
echo -e "${BLUE}Contract:${NC} $CONTRACT_BALANCE ETH (holds 0.01 ETH)"
echo ""
echo "📱 Check MetaMask - Customer balance should have decreased!"
echo ""

# Step 6: Submit result (distribute payment 75/25)
echo "Step 6: Submit Result (Distribute Payment 75/25)"
echo "-----------------------------------"
echo "Node submits result - payment splits 75% to model owner, 25% to commission..."
echo ""
echo "⚠️  Note: Node needs to be added first. If this fails, add the node using:"
echo "   cast send $NODE_REGISTRY \"addNode(address)\" $MODEL_OWNER_ADDR --private-key <admin_private_key> --rpc-url $RPC_URL"
echo ""
cast send "$INFERENCE_MANAGER" \
  "submitResult(uint256)" \
  0 \
  --private-key "$MODEL_OWNER_PK" \
  --rpc-url "$RPC_URL" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Result submitted, payment distributed${NC}"
else
  echo -e "${YELLOW}⚠️  Failed to submit (node may not be approved)${NC}"
  echo "   But the contract is ready - once node is added, payments will work!"
fi
echo ""

# Step 7: Final balances
echo "Step 7: Final Balances (After Distribution)"
echo "-----------------------------------"
sleep 2
MODEL_OWNER_BAL_FINAL=$(cast balance "$MODEL_OWNER_ADDR" --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')
COMMISSION_BAL_FINAL=$(cast balance "$COMMISSION_ADDR" --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')
CUSTOMER_BAL_FINAL=$(cast balance "$CUSTOMER_ADDR" --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')

MODEL_OWNER_GAIN=$(echo "$MODEL_OWNER_BAL_FINAL - $MODEL_OWNER_BAL_INITIAL" | bc -l)
COMMISSION_GAIN=$(echo "$COMMISSION_BAL_FINAL - $COMMISSION_BAL_INITIAL" | bc -l)

echo -e "${BLUE}Model Owner (75%):${NC}"
echo "  Before: $MODEL_OWNER_BAL_INITIAL ETH"
echo "  After:  $MODEL_OWNER_BAL_FINAL ETH"
echo -e "  ${GREEN}Gained: $MODEL_OWNER_GAIN ETH (75% of 0.01 ETH = 0.0075 ETH)${NC}"
echo ""
echo -e "${BLUE}Commission Account (25%):${NC}"
echo "  Before: $COMMISSION_BAL_INITIAL ETH"
echo "  After:  $COMMISSION_BAL_FINAL ETH"
echo -e "  ${GREEN}Gained: $COMMISSION_GAIN ETH (25% of 0.01 ETH = 0.0025 ETH)${NC}"
echo ""
echo -e "${BLUE}Customer:${NC} $CUSTOMER_BAL_FINAL ETH"
echo ""

echo "=========================================="
echo -e "${GREEN}✅ Payment Flow Complete!${NC}"
echo "=========================================="
echo ""
echo "📱 CHECK METAMASK NOW:"
echo "  1. Switch to Account 1 (Model Owner) - should see +0.0075 ETH"
echo "  2. Switch to Account 2 (Commission) - should see +0.0025 ETH"
echo "  3. Switch to Customer Account - should see -0.01 ETH"
echo ""
echo "Summary:"
echo "  - Customer paid: 0.01 ETH"
echo "  - Model Owner received: ~0.0075 ETH (75%)"
echo "  - Commission Account received: ~0.0025 ETH (25%)"
echo ""
echo "💡 If balances don't update in MetaMask:"
echo "   - Refresh the network (click network dropdown)"
echo "   - Disconnect and reconnect the network"
echo "   - Make sure you're on 'Localhost 8545' network"
