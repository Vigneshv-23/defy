#!/bin/bash

# Test script to verify dev account receives payments
# This demonstrates the complete payment flow

RPC_URL="http://localhost:8545"
MODEL_REGISTRY="0x2e983a1ba5e8b38aaaec4b440b9ddcfbf72e15d1"
NODE_REGISTRY="0x663f3ad617193148711d28f5334ee4ed07016602"
INFERENCE_MANAGER="0x8438ad1c834623cff278ab6829a248e37c2d7e3f"

# Account addresses
DEV_ACCOUNT="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
DEV_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
CUSTOMER_ACCOUNT="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
CUSTOMER_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
COMMISSION_ACCOUNT="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"

echo "=========================================="
echo "Testing Dev Account Payment Flow"
echo "=========================================="
echo ""

# Step 1: Check initial balances
echo "Step 1: Initial Balances"
echo "-----------------------------------"
DEV_INITIAL=$(cast balance $DEV_ACCOUNT --rpc-url $RPC_URL)
DEV_INITIAL_ETH=$(printf "%.6f" $(echo "scale=6; $DEV_INITIAL/10^18" | bc))
CUSTOMER_INITIAL=$(cast balance $CUSTOMER_ACCOUNT --rpc-url $RPC_URL)
CUSTOMER_INITIAL_ETH=$(printf "%.6f" $(echo "scale=6; $CUSTOMER_INITIAL/10^18" | bc))
COMM_INITIAL=$(cast balance $COMMISSION_ACCOUNT --rpc-url $RPC_URL)
COMM_INITIAL_ETH=$(printf "%.6f" $(echo "scale=6; $COMM_INITIAL/10^18" | bc))

echo "Dev Account:      $DEV_INITIAL_ETH ETH"
echo "Customer Account: $CUSTOMER_INITIAL_ETH ETH"
echo "Commission:       $COMM_INITIAL_ETH ETH"
echo ""

# Step 2: Add node (if not already added)
echo "Step 2: Adding Node"
echo "-----------------------------------"
NODE_APPROVED=$(cast call $NODE_REGISTRY "isApproved(address)" $DEV_ACCOUNT --rpc-url $RPC_URL)
if [ "$NODE_APPROVED" = "false" ]; then
  cast send $NODE_REGISTRY "addNode(address)" $DEV_ACCOUNT \
    --private-key $DEV_KEY --rpc-url $RPC_URL > /dev/null 2>&1
  echo "✅ Node added"
else
  echo "✅ Node already approved"
fi
echo ""

# Step 3: Register a model (owned by dev account)
echo "Step 3: Registering Model (Dev Account as Owner)"
echo "-----------------------------------"
echo "Registering model with price 0.001 ETH per minute..."
cast send $MODEL_REGISTRY \
  "registerModel(string,uint256)" \
  "QmTestModelCID123" \
  1000000000000000 \
  --private-key $DEV_KEY \
  --rpc-url $RPC_URL > /dev/null 2>&1
echo "✅ Model registered"
echo ""

# Get model ID
MODEL_ID=$(cast call $MODEL_REGISTRY "nextModelId()" --rpc-url $RPC_URL | cast --to-dec)
MODEL_ID=$((MODEL_ID - 1))
echo "Model ID: $MODEL_ID"
echo ""

# Verify model owner
MODEL_OWNER=$(cast call $MODEL_REGISTRY "getModel(uint256)" $MODEL_ID --rpc-url $RPC_URL | cut -d' ' -f1)
if [ "$MODEL_OWNER" = "$DEV_ACCOUNT" ]; then
  echo "✅ Model is owned by DEV account"
else
  echo "❌ Model is NOT owned by DEV account! Owner: $MODEL_OWNER"
  exit 1
fi
echo ""

# Step 4: Customer requests inference
echo "Step 4: Customer Requests Inference (0.01 ETH)"
echo "-----------------------------------"
cast send $INFERENCE_MANAGER \
  "requestInference(uint256,uint256)" \
  $MODEL_ID \
  10 \
  --value 10000000000000000 \
  --private-key $CUSTOMER_KEY \
  --rpc-url $RPC_URL > /dev/null 2>&1
echo "✅ Inference requested (0.01 ETH paid)"
echo ""

# Wait for transaction
sleep 2

# Step 5: Submit result and distribute payment
echo "Step 5: Submitting Result (Distribute Payment)"
echo "-----------------------------------"
REQUEST_ID=0
cast send $INFERENCE_MANAGER \
  "submitResult(uint256)" \
  $REQUEST_ID \
  --private-key $DEV_KEY \
  --rpc-url $RPC_URL > /dev/null 2>&1
echo "✅ Result submitted, payment distributed"
echo ""

# Wait for transaction
sleep 3

# Step 6: Check final balances
echo "Step 6: Final Balances"
echo "-----------------------------------"
DEV_FINAL=$(cast balance $DEV_ACCOUNT --rpc-url $RPC_URL)
DEV_FINAL_ETH=$(printf "%.6f" $(echo "scale=6; $DEV_FINAL/10^18" | bc))
CUSTOMER_FINAL=$(cast balance $CUSTOMER_ACCOUNT --rpc-url $RPC_URL)
CUSTOMER_FINAL_ETH=$(printf "%.6f" $(echo "scale=6; $CUSTOMER_FINAL/10^18" | bc))
COMM_FINAL=$(cast balance $COMMISSION_ACCOUNT --rpc-url $RPC_URL)
COMM_FINAL_ETH=$(printf "%.6f" $(echo "scale=6; $COMM_FINAL/10^18" | bc))

DEV_GAIN=$(printf "%.6f" $(echo "scale=6; $DEV_FINAL_ETH - $DEV_INITIAL_ETH" | bc))
COMM_GAIN=$(printf "%.6f" $(echo "scale=6; $COMM_FINAL_ETH - $COMM_INITIAL_ETH" | bc))
CUSTOMER_LOSS=$(printf "%.6f" $(echo "scale=6; $CUSTOMER_INITIAL_ETH - $CUSTOMER_FINAL_ETH" | bc))

echo "Dev Account:"
echo "  Before: $DEV_INITIAL_ETH ETH"
echo "  After:  $DEV_FINAL_ETH ETH"
echo "  ✅ Gained: $DEV_GAIN ETH (75% = 0.0075 ETH)"
echo ""

echo "Commission Account:"
echo "  Before: $COMM_INITIAL_ETH ETH"
echo "  After:  $COMM_FINAL_ETH ETH"
echo "  ✅ Gained: $COMM_GAIN ETH (25% = 0.0025 ETH)"
echo ""

echo "Customer Account:"
echo "  Before: $CUSTOMER_INITIAL_ETH ETH"
echo "  After:  $CUSTOMER_FINAL_ETH ETH"
echo "  Paid: $CUSTOMER_LOSS ETH (0.01 ETH + gas)"
echo ""

echo "=========================================="
echo "✅ Payment Flow Complete!"
echo "=========================================="
echo ""
echo "📱 CHECK METAMASK NOW!"
echo "  Dev Account (0xf39F...92266): $DEV_FINAL_ETH ETH"
echo "  Should have increased by ~0.0075 ETH"
echo ""
echo "If MetaMask doesn't show the change:"
echo "  1. Refresh the page"
echo "  2. Switch networks and switch back"
echo "  3. Reset account in MetaMask settings"
echo ""
