#!/bin/bash

# Register a simple Q&A model on the blockchain

RPC_URL="http://localhost:8545"
MODEL_OWNER_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
MODEL_OWNER="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

MODEL_REG="0x2E983A1Ba5e8b38AAAeC4B440B9dDcFBf72E15d1"
IPFS_CID="QmQAModelBasicQuestions"
PRICE_PER_MINUTE="1000000000000000" # 0.001 ETH per minute

echo "Registering Q&A Model..."
cast send "$MODEL_REG" "registerModel(string,uint256)" "$IPFS_CID" "$PRICE_PER_MINUTE" \
  --private-key "$MODEL_OWNER_KEY" \
  --rpc-url "$RPC_URL"

echo ""
echo "✅ Q&A Model registered!"
echo "You can now use this model for basic questions"
