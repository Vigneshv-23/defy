#!/bin/bash

# Complete Q&A Model Registration
# Registers on blockchain AND MongoDB

set -e

RPC_URL="http://localhost:8545"
API_URL="${API_URL:-http://localhost:5000}"
MODEL_OWNER_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
MODEL_OWNER="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

MODEL_REG="0x2E983A1Ba5e8b38AAAeC4B440B9dDcFBf72E15d1"
IPFS_CID="QmQAModelBasicQuestions"
PRICE_PER_MINUTE="1000000000000000" # 0.001 ETH per minute

echo "=========================================="
echo "Registering Q&A Model (Complete)"
echo "=========================================="
echo ""

# Step 1: Register on blockchain
echo "Step 1: Registering on blockchain..."
TX_HASH=$(cast send "$MODEL_REG" "registerModel(string,uint256)" "$IPFS_CID" "$PRICE_PER_MINUTE" \
  --private-key "$MODEL_OWNER_KEY" \
  --rpc-url "$RPC_URL" 2>&1 | grep -oP 'transactionHash\s+\K0x[a-fA-F0-9]+' || echo "")

if [ -z "$TX_HASH" ]; then
    echo "⚠️  Could not extract transaction hash, but continuing..."
else
    echo "✅ Transaction hash: $TX_HASH"
fi

echo ""
echo "Waiting for confirmation..."
sleep 3

# Get the model ID
NEXT_ID=$(cast call "$MODEL_REG" "nextModelId()" --rpc-url "$RPC_URL")
MODEL_ID=$((NEXT_ID - 1))
echo "✅ Model registered on blockchain with ID: $MODEL_ID"
echo ""

# Step 2: Register in MongoDB
echo "Step 2: Registering in MongoDB..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/models" \
  -H "Content-Type: application/json" \
  -d "{
    \"wallet\": \"$MODEL_OWNER\",
    \"name\": \"Basic Q&A Model\",
    \"description\": \"A simple Q&A model that answers basic questions about AI, blockchain, and how this platform works. Perfect for testing and demonstrations.\",
    \"ipfsCid\": \"$IPFS_CID\",
    \"pricePerMinute\": \"$PRICE_PER_MINUTE\"
  }")

if echo "$REGISTER_RESPONSE" | grep -q "error"; then
    echo "⚠️  MongoDB registration may have failed:"
    echo "$REGISTER_RESPONSE" | jq . 2>/dev/null || echo "$REGISTER_RESPONSE"
    echo ""
    echo "You can register manually via frontend at /upload"
else
    echo "✅ Model registered in MongoDB!"
    echo "$REGISTER_RESPONSE" | jq . 2>/dev/null || echo "$REGISTER_RESPONSE"
fi

echo ""
echo "=========================================="
echo "✅ Q&A Model Registration Complete!"
echo "=========================================="
echo ""
echo "Model Details:"
echo "  Blockchain Model ID: $MODEL_ID"
echo "  Name: Basic Q&A Model"
echo "  IPFS CID: $IPFS_CID"
echo "  Price: 0.001 ETH per minute"
echo ""
echo "Next Steps:"
echo "  1. Refresh the marketplace page"
echo "  2. You should see 'Basic Q&A Model'"
echo "  3. Go to /api-keys to generate an API key"
echo "  4. Use the API key to ask questions!"
echo ""
