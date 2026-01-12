#!/bin/bash

RPC_URL="http://localhost:8545"
MODEL_REGISTRY="0x2e983a1ba5e8b38aaaec4b440b9ddcfbf72e15d1"
INFERENCE_MANAGER="0x8438ad1c834623cff278ab6829a248e37c2d7e3f"
DEV_ACCOUNT="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

echo "=========================================="
echo "Payment Flow Diagnostic"
echo "=========================================="
echo ""

# Check if Anvil is running
if ! curl -s $RPC_URL > /dev/null 2>&1; then
  echo "❌ Anvil is not running! Start it with: anvil"
  exit 1
fi

echo "✅ Anvil is running"
echo ""

# Check dev account balance
DEV_BALANCE=$(cast balance $DEV_ACCOUNT --rpc-url $RPC_URL)
DEV_BALANCE_ETH=$(printf "%.6f" $(echo "scale=6; $DEV_BALANCE/10^18" | bc))
echo "📊 Dev Account Balance: $DEV_BALANCE_ETH ETH"
echo ""

# Check how many models exist
NEXT_MODEL_ID=$(cast call $MODEL_REGISTRY "nextModelId()" --rpc-url $RPC_URL | cast --to-dec)
echo "📦 Total Models on Blockchain: $NEXT_MODEL_ID"
echo ""

# Check each model's owner
if [ "$NEXT_MODEL_ID" -gt 0 ]; then
  echo "Model Ownership:"
  for i in $(seq 0 $((NEXT_MODEL_ID - 1))); do
    MODEL_DATA=$(cast call $MODEL_REGISTRY "getModel(uint256)" $i --rpc-url $RPC_URL)
    OWNER=$(echo $MODEL_DATA | cut -d' ' -f1)
    PRICE=$(echo $MODEL_DATA | cut -d' ' -f2)
    PRICE_ETH=$(printf "%.6f" $(echo "scale=6; $PRICE/10^18" | bc))
    
    if [ "$OWNER" = "$DEV_ACCOUNT" ]; then
      echo "  Model $i: ✅ Owned by DEV ($OWNER) - Price: $PRICE_ETH ETH/min"
    else
      echo "  Model $i: ❌ Owned by $OWNER (NOT DEV) - Price: $PRICE_ETH ETH/min"
    fi
  done
else
  echo "⚠️  No models registered on blockchain"
fi
echo ""

# Check pending inference requests
NEXT_REQUEST_ID=$(cast call $INFERENCE_MANAGER "nextRequestId()" --rpc-url $RPC_URL | cast --to-dec)
echo "📋 Total Inference Requests: $NEXT_REQUEST_ID"
echo ""

if [ "$NEXT_REQUEST_ID" -gt 0 ]; then
  echo "Pending Requests:"
  for i in $(seq 0 $((NEXT_REQUEST_ID - 1))); do
    REQUEST_DATA=$(cast call $INFERENCE_MANAGER "requests(uint256)" $i --rpc-url $RPC_URL)
    FULFILLED=$(echo $REQUEST_DATA | cut -d' ' -f4)
    MODEL_ID=$(echo $REQUEST_DATA | cut -d' ' -f2)
    PAID_AMOUNT=$(echo $REQUEST_DATA | cut -d' ' -f3)
    PAID_ETH=$(printf "%.6f" $(echo "scale=6; $PAID_AMOUNT/10^18" | bc))
    
    if [ "$FULFILLED" = "true" ]; then
      echo "  Request $i: ✅ FULFILLED - Model: $MODEL_ID - Paid: $PAID_ETH ETH"
    else
      echo "  Request $i: ⏳ PENDING - Model: $MODEL_ID - Paid: $PAID_ETH ETH"
    fi
  done
else
  echo "⚠️  No inference requests found"
fi
echo ""

# Check contract balance
CONTRACT_BALANCE=$(cast balance $INFERENCE_MANAGER --rpc-url $RPC_URL)
CONTRACT_BALANCE_ETH=$(printf "%.6f" $(echo "scale=6; $CONTRACT_BALANCE/10^18" | bc))
echo "💰 InferenceManager Contract Balance: $CONTRACT_BALANCE_ETH ETH"
if [ "$CONTRACT_BALANCE_ETH" != "0.000000" ]; then
  echo "  ⚠️  Contract has pending funds! Call submitResult to distribute."
fi
echo ""

echo "=========================================="
echo "Summary"
echo "=========================================="
echo "1. Models must be owned by DEV account on blockchain"
echo "2. Payments only happen when submitResult() is called"
echo "3. Check if there are pending requests that need fulfillment"
echo ""
