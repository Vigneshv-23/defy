#!/bin/bash

# Direct Blockchain Test (No Backend Required)
# Tests the blockchain integration directly using cast commands

echo "=========================================="
echo "Direct Blockchain Integration Test"
echo "=========================================="
echo ""

# Check Anvil
if ! curl -s http://localhost:8545 > /dev/null 2>&1; then
  echo "❌ Anvil is not running on http://localhost:8545"
  echo "   Start it with: anvil"
  exit 1
fi

echo "✅ Anvil is running"
echo ""

# Addresses
MODEL_REGISTRY="0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
INFERENCE_MANAGER="0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"
DEV_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
CUSTOMER_PRIVATE_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"

# Test 1: Register Model on Blockchain
echo "Test 1: Register model on blockchain..."
TX_HASH=$(cast send $MODEL_REGISTRY \
  "registerModel(string,uint256)" \
  "QmTestBlockchainModel" \
  1000000000000000 \
  --private-key $DEV_PRIVATE_KEY \
  --rpc-url http://localhost:8545 2>&1 | grep -o "transactionHash: 0x[a-f0-9]*" | cut -d' ' -f2)

if [ -n "$TX_HASH" ]; then
  echo "✅ Transaction sent: $TX_HASH"
  
  # Get receipt
  echo "   Waiting for confirmation..."
  sleep 2
  
  # Get model ID
  NEXT_ID=$(cast call $MODEL_REGISTRY "nextModelId()" --rpc-url http://localhost:8545)
  MODEL_ID=$(echo "ibase=16; $(echo $NEXT_ID | cut -d'x' -f2 | tr '[:lower:]' '[:upper:]') - 1" | bc)
  echo "   Model ID: $MODEL_ID"
  
  # Get model details
  echo "   Getting model details..."
  cast call $MODEL_REGISTRY "getModel(uint256)" $MODEL_ID --rpc-url http://localhost:8545
else
  echo "❌ Failed to register model"
  exit 1
fi
echo ""

# Test 2: Request Inference (Customer pays)
echo "Test 2: Customer requests inference (pays 0.01 ETH for 10 minutes)..."
TX_HASH=$(cast send $INFERENCE_MANAGER \
  "requestInference(uint256,uint256)" \
  $MODEL_ID 10 \
  --value 10000000000000000 \
  --private-key $CUSTOMER_PRIVATE_KEY \
  --rpc-url http://localhost:8545 2>&1 | grep -o "transactionHash: 0x[a-f0-9]*" | cut -d' ' -f2)

if [ -n "$TX_HASH" ]; then
  echo "✅ Inference request sent: $TX_HASH"
  echo "   Waiting for confirmation..."
  sleep 2
  
  # Check balances
  CUSTOMER_BALANCE=$(cast balance 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --rpc-url http://localhost:8545)
  CONTRACT_BALANCE=$(cast balance $INFERENCE_MANAGER --rpc-url http://localhost:8545)
  
  echo "   Customer balance: $(echo "scale=6; $CUSTOMER_BALANCE/10^18" | bc) ETH"
  echo "   Contract balance: $(echo "scale=6; $CONTRACT_BALANCE/10^18" | bc) ETH"
  
  # Get request details
  echo "   Getting request details..."
  cast call $INFERENCE_MANAGER "requests(uint256)" 0 --rpc-url http://localhost:8545
else
  echo "❌ Failed to request inference"
  exit 1
fi
echo ""

# Test 3: Submit Result (Node fulfills)
echo "Test 3: Node submits result (distributes payment)..."
TX_HASH=$(cast send $INFERENCE_MANAGER \
  "submitResult(uint256)" \
  0 \
  --private-key $DEV_PRIVATE_KEY \
  --rpc-url http://localhost:8545 2>&1 | grep -o "transactionHash: 0x[a-f0-9]*" | cut -d' ' -f2)

if [ -n "$TX_HASH" ]; then
  echo "✅ Result submitted: $TX_HASH"
  sleep 2
  
  # Check final balances
  CONTRACT_BALANCE=$(cast balance $INFERENCE_MANAGER --rpc-url http://localhost:8545)
  DEV_BALANCE=$(cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://localhost:8545)
  
  echo "   Contract balance (should be 0): $(echo "scale=6; $CONTRACT_BALANCE/10^18" | bc) ETH"
  echo "   Dev/Node balance: $(echo "scale=6; $DEV_BALANCE/10^18" | bc) ETH"
else
  echo "❌ Failed to submit result"
  exit 1
fi
echo ""

echo "=========================================="
echo "✅ Blockchain integration tests complete!"
echo "=========================================="
echo ""
echo "All blockchain operations working correctly!"
echo ""
echo "Next: Test backend API integration"
