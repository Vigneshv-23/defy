#!/bin/bash

set -e

RPC_URL="http://localhost:8545"
ACCOUNT1_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
CUSTOMER_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"

# Get contract addresses from latest deployment
NODE_REG=$(cat broadcast/DeployAll.s.sol/31337/run-latest.json | jq -r '.transactions[0].contractAddress')
MODEL_REG=$(cat broadcast/DeployAll.s.sol/31337/run-latest.json | jq -r '.transactions[1].contractAddress')
INF_MGR=$(cat broadcast/DeployAll.s.sol/31337/run-latest.json | jq -r '.transactions[2].contractAddress')

COMM_ACCOUNT="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
MODEL_OWNER="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

echo "=========================================="
echo "Complete Payment Flow Test"
echo "=========================================="
echo ""
echo "Contracts:"
echo "  NodeRegistry: $NODE_REG"
echo "  ModelRegistry: $MODEL_REG"
echo "  InferenceManager: $INF_MGR"
echo ""

# Get initial balances
echo "Step 1: Initial Balances"
echo "-----------------------------------"
COMM_BEFORE=$(cast balance $COMM_ACCOUNT --rpc-url $RPC_URL)
MODEL_BEFORE=$(cast balance $MODEL_OWNER --rpc-url $RPC_URL)
COMM_B_ETH=$(printf "%.6f" $(echo "scale=6; $COMM_BEFORE/10^18" | bc))
MODEL_B_ETH=$(printf "%.6f" $(echo "scale=6; $MODEL_BEFORE/10^18" | bc))
echo "Commission Account (Account 2): $COMM_B_ETH ETH"
echo "Model Owner (Account 1): $MODEL_B_ETH ETH"
echo ""
echo "📱 Note these balances in MetaMask!"
echo ""

# Register model
echo "Step 2: Register Model"
echo "-----------------------------------"
cast send $MODEL_REG "registerModel(string,uint256)" "QmFinal" 1000000000000000 \
  --private-key $ACCOUNT1_KEY --rpc-url $RPC_URL > /dev/null 2>&1
echo "✅ Model registered"
echo ""

# Add node
echo "Step 3: Add Node"
echo "-----------------------------------"
cast send $NODE_REG "addNode(address)" $MODEL_OWNER \
  --private-key $ACCOUNT1_KEY --rpc-url $RPC_URL > /dev/null 2>&1
echo "✅ Node added"
echo ""

# Customer pays
echo "Step 4: Customer Pays 0.01 ETH"
echo "-----------------------------------"
cast send $INF_MGR "requestInference(uint256,uint256)" 0 10 \
  --value 10000000000000000 \
  --private-key $CUSTOMER_KEY --rpc-url $RPC_URL > /dev/null 2>&1
echo "✅ Payment received (0.01 ETH)"
echo ""

# Wait a moment
sleep 2

# Submit result and distribute
echo "Step 5: Distribute Payment (75% Model Owner / 25% Commission)"
echo "-----------------------------------"
cast send $INF_MGR "submitResult(uint256)" 0 \
  --private-key $ACCOUNT1_KEY --rpc-url $RPC_URL > /dev/null 2>&1
echo "✅ Payment distributed!"
echo ""

# Wait for transaction
sleep 3

# Get final balances
echo "Step 6: Final Balances"
echo "-----------------------------------"
COMM_AFTER=$(cast balance $COMM_ACCOUNT --rpc-url $RPC_URL)
MODEL_AFTER=$(cast balance $MODEL_OWNER --rpc-url $RPC_URL)
COMM_A_ETH=$(printf "%.6f" $(echo "scale=6; $COMM_AFTER/10^18" | bc))
MODEL_A_ETH=$(printf "%.6f" $(echo "scale=6; $MODEL_AFTER/10^18" | bc))
COMM_DIFF=$(printf "%.6f" $(echo "scale=6; $COMM_A_ETH - $COMM_B_ETH" | bc))
MODEL_DIFF=$(printf "%.6f" $(echo "scale=6; $MODEL_A_ETH - $MODEL_B_ETH" | bc))

echo "Commission Account (Account 2):"
echo "  Before: $COMM_B_ETH ETH"
echo "  After:  $COMM_A_ETH ETH"
echo "  ✅ Gained: $COMM_DIFF ETH (25% = 0.0025 ETH)"
echo ""
echo "Model Owner (Account 1):"
echo "  Before: $MODEL_B_ETH ETH"
echo "  After:  $MODEL_A_ETH ETH"
echo "  ✅ Gained: $MODEL_DIFF ETH (75% = 0.0075 ETH)"
echo ""
echo "=========================================="
echo "📱 CHECK METAMASK NOW!"
echo "=========================================="
echo "Account 2: $COMM_A_ETH ETH"
echo "Account 1: $MODEL_A_ETH ETH"
echo ""
echo "The balance changes should be visible!"
