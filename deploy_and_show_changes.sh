#!/bin/bash

set -e

RPC_URL="http://localhost:8545"
ACCOUNT1_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
CUSTOMER_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"

COMM_ACCOUNT="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
MODEL_OWNER="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
CUSTOMER="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

echo "=========================================="
echo "Deploy + Payment Flow (See Changes in MetaMask)"
echo "=========================================="
echo ""

# Step 1: Get initial balances BEFORE deployment
echo "Step 1: Initial Balances (Note in MetaMask!)"
echo "-----------------------------------"
COMM_BEFORE=$(cast balance $COMM_ACCOUNT --rpc-url $RPC_URL)
MODEL_BEFORE=$(cast balance $MODEL_OWNER --rpc-url $RPC_URL)
CUSTOMER_BEFORE=$(cast balance $CUSTOMER --rpc-url $RPC_URL)
COMM_B_ETH=$(printf "%.6f" $(echo "scale=6; $COMM_BEFORE/10^18" | bc))
MODEL_B_ETH=$(printf "%.6f" $(echo "scale=6; $MODEL_BEFORE/10^18" | bc))
CUSTOMER_B_ETH=$(printf "%.6f" $(echo "scale=6; $CUSTOMER_BEFORE/10^18" | bc))
echo "Commission Account (Account 2): $COMM_B_ETH ETH"
echo "Model Owner (Account 1): $MODEL_B_ETH ETH"
echo "Customer (Account 3): $CUSTOMER_B_ETH ETH"
echo ""
echo "📱 NOTE THESE BALANCES IN METAMASK NOW!"
echo ""

# Step 2: Deploy contracts
echo "Step 2: Deploying Contracts"
echo "-----------------------------------"
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url $RPC_URL \
  --broadcast \
  --private-key $ACCOUNT1_KEY > /tmp/deploy_output.txt 2>&1

# Extract contract addresses
NODE_REG=$(cat broadcast/DeployAll.s.sol/31337/run-latest.json | jq -r '.transactions[0].contractAddress')
MODEL_REG=$(cat broadcast/DeployAll.s.sol/31337/run-latest.json | jq -r '.transactions[1].contractAddress')
INF_MGR=$(cat broadcast/DeployAll.s.sol/31337/run-latest.json | jq -r '.transactions[2].contractAddress')

echo "✅ Contracts deployed:"
echo "  NodeRegistry: $NODE_REG"
echo "  ModelRegistry: $MODEL_REG"
echo "  InferenceManager: $INF_MGR"
echo ""

# Wait a moment
sleep 2

# Step 3: Register model
echo "Step 3: Registering Model"
echo "-----------------------------------"
cast send $MODEL_REG "registerModel(string,uint256)" "QmFinal" 1000000000000000 \
  --private-key $ACCOUNT1_KEY --rpc-url $RPC_URL > /dev/null 2>&1
echo "✅ Model registered"
echo ""

# Step 4: Add node
echo "Step 4: Adding Node"
echo "-----------------------------------"
cast send $NODE_REG "addNode(address)" $MODEL_OWNER \
  --private-key $ACCOUNT1_KEY --rpc-url $RPC_URL > /dev/null 2>&1
echo "✅ Node added"
echo ""

# Step 5: Customer pays
echo "Step 5: Customer Pays 0.01 ETH"
echo "-----------------------------------"
cast send $INF_MGR "requestInference(uint256,uint256)" 0 10 \
  --value 10000000000000000 \
  --private-key $CUSTOMER_KEY --rpc-url $RPC_URL > /dev/null 2>&1
echo "✅ Customer paid 0.01 ETH"
echo ""
echo "📱 CHECK METAMASK - Customer balance should decrease!"
echo ""

# Wait a moment
sleep 2

# Step 6: Get balances after payment (before distribution)
echo "Step 6: Balances After Payment (Before Distribution)"
echo "-----------------------------------"
COMM_AFTER_PAY=$(cast balance $COMM_ACCOUNT --rpc-url $RPC_URL)
MODEL_AFTER_PAY=$(cast balance $MODEL_OWNER --rpc-url $RPC_URL)
CUSTOMER_AFTER_PAY=$(cast balance $CUSTOMER --rpc-url $RPC_URL)
COMM_AP_ETH=$(printf "%.6f" $(echo "scale=6; $COMM_AFTER_PAY/10^18" | bc))
MODEL_AP_ETH=$(printf "%.6f" $(echo "scale=6; $MODEL_AFTER_PAY/10^18" | bc))
CUSTOMER_AP_ETH=$(printf "%.6f" $(echo "scale=6; $CUSTOMER_AFTER_PAY/10^18" | bc))
echo "Commission: $COMM_AP_ETH ETH (no change yet)"
echo "Model Owner: $MODEL_AP_ETH ETH (no change yet)"
echo "Customer: $CUSTOMER_AP_ETH ETH (decreased by ~0.01 ETH)"
echo ""

# Step 7: Distribute payment
echo "Step 7: Distributing Payment (75% Model Owner / 25% Commission)"
echo "-----------------------------------"
cast send $INF_MGR "submitResult(uint256)" 0 \
  --private-key $ACCOUNT1_KEY --rpc-url $RPC_URL > /dev/null 2>&1
echo "✅ Payment distributed!"
echo ""

# Wait for transaction
sleep 3

# Step 8: Final balances
echo "Step 8: Final Balances (CHECK METAMASK!)"
echo "-----------------------------------"
COMM_AFTER=$(cast balance $COMM_ACCOUNT --rpc-url $RPC_URL)
MODEL_AFTER=$(cast balance $MODEL_OWNER --rpc-url $RPC_URL)
CUSTOMER_AFTER=$(cast balance $CUSTOMER --rpc-url $RPC_URL)
COMM_A_ETH=$(printf "%.6f" $(echo "scale=6; $COMM_AFTER/10^18" | bc))
MODEL_A_ETH=$(printf "%.6f" $(echo "scale=6; $MODEL_AFTER/10^18" | bc))
CUSTOMER_A_ETH=$(printf "%.6f" $(echo "scale=6; $CUSTOMER_AFTER/10^18" | bc))
COMM_DIFF=$(printf "%.6f" $(echo "scale=6; $COMM_A_ETH - $COMM_B_ETH" | bc))
MODEL_DIFF=$(printf "%.6f" $(echo "scale=6; $MODEL_A_ETH - $MODEL_B_ETH" | bc))
CUSTOMER_DIFF=$(printf "%.6f" $(echo "scale=6; $CUSTOMER_A_ETH - $CUSTOMER_B_ETH" | bc))

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
echo "Customer (Account 3):"
echo "  Before: $CUSTOMER_B_ETH ETH"
echo "  After:  $CUSTOMER_A_ETH ETH"
echo "  ✅ Paid: $CUSTOMER_DIFF ETH (0.01 ETH + gas)"
echo ""
echo "=========================================="
echo "📱 CHECK METAMASK NOW!"
echo "=========================================="
echo ""
echo "Expected balances in MetaMask:"
echo "  Account 2 (Commission): $COMM_A_ETH ETH"
echo "  Account 1 (Model Owner): $MODEL_A_ETH ETH"
echo "  Account 3 (Customer): $CUSTOMER_A_ETH ETH"
echo ""
echo "If balances don't match:"
echo "  1. Click network dropdown → Select 'Localhost 8545' again"
echo "  2. Check Activity tab - you should see transactions"
echo "  3. Click account icon → Refresh icon"
echo ""
echo "The balance changes are:"
echo "  Commission: +$COMM_DIFF ETH"
echo "  Model Owner: +$MODEL_DIFF ETH"
echo "  Customer: $CUSTOMER_DIFF ETH"
echo ""
