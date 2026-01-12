#!/bin/bash

# Fresh Deployment Script - Ensures Account 1 is Admin
# This script properly deploys so you can see balance changes in MetaMask

RPC_URL="http://localhost:8545"
ACCOUNT1_PK="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
CUSTOMER_PK="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"

echo "=========================================="
echo "Fresh Deployment - Account 1 as Admin"
echo "=========================================="
echo ""

# Unset PRIVATE_KEY to ensure Account 1 deploys
unset PRIVATE_KEY

# Step 1: Check initial balances
echo "Step 1: Initial Balances (Note in MetaMask)"
echo "-----------------------------------"
COMM_INIT=$(cast balance 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')
MODEL_INIT=$(cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')
echo "Commission Account: $COMM_INIT ETH"
echo "Model Owner: $MODEL_INIT ETH"
echo "📱 Note these in MetaMask!"
echo ""

# Step 2: Deploy
echo "Step 2: Deploying Contracts"
echo "-----------------------------------"
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --private-key "$ACCOUNT1_PK" 2>&1 | tail -8

echo ""

# Step 3: Get addresses and setup
sleep 2
NODE_REG=$(cat broadcast/DeployAll.s.sol/31337/run-latest.json | jq -r '.transactions[0].contractAddress' 2>/dev/null)
MODEL_REG=$(cat broadcast/DeployAll.s.sol/31337/run-latest.json | jq -r '.transactions[1].contractAddress' 2>/dev/null)
INF_MGR=$(cat broadcast/DeployAll.s.sol/31337/run-latest.json | jq -r '.transactions[2].contractAddress' 2>/dev/null)

echo "Step 3: Setup"
echo "-----------------------------------"
echo "Registering model..."
cast send "$MODEL_REG" "registerModel(string,uint256)" "QmTest" 1000000000000000 \
  --private-key "$ACCOUNT1_PK" \
  --rpc-url "$RPC_URL" > /dev/null 2>&1
echo "✅ Model registered"

echo "Adding node..."
cast send "$NODE_REG" "addNode(address)" 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --private-key "$ACCOUNT1_PK" \
  --rpc-url "$RPC_URL" > /dev/null 2>&1
echo "✅ Node added"
echo ""

# Step 4: Customer pays
echo "Step 4: Customer Pays 0.01 ETH"
echo "-----------------------------------"
cast send "$INF_MGR" "requestInference(uint256,uint256)" 0 10 \
  --value 10000000000000000 \
  --private-key "$CUSTOMER_PK" \
  --rpc-url "$RPC_URL" > /dev/null 2>&1
echo "✅ Payment received"
echo "📱 Check MetaMask - Customer balance decreased!"
echo ""

# Step 5: Distribute payment
echo "Step 5: Distribute Payment (75/25)"
echo "-----------------------------------"
cast send "$INF_MGR" "submitResult(uint256)" 0 \
  --private-key "$ACCOUNT1_PK" \
  --rpc-url "$RPC_URL" > /dev/null 2>&1
echo "✅ Payment distributed!"
echo ""

# Step 6: Final balances
sleep 3
echo "Step 6: Final Balances (Check MetaMask!)"
echo "-----------------------------------"
COMM_FINAL=$(cast balance 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')
MODEL_FINAL=$(cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')

COMM_GAIN=$(echo "$COMM_FINAL - $COMM_INIT" | bc -l)
MODEL_GAIN=$(echo "$MODEL_FINAL - $MODEL_INIT" | bc -l)

echo "Commission Account (Account 2):"
echo "  Before: $COMM_INIT ETH"
echo "  After:  $COMM_FINAL ETH"
echo "  ✅ Gained: $COMM_GAIN ETH (25%)"
echo ""
echo "Model Owner (Account 1):"
echo "  Before: $MODEL_INIT ETH"
echo "  After:  $MODEL_FINAL ETH"
echo "  ✅ Gained: $MODEL_GAIN ETH (75%)"
echo ""

echo "=========================================="
echo "📱 CHECK METAMASK NOW!"
echo "=========================================="
echo "Account 2: $COMM_FINAL ETH"
echo "Account 1: $MODEL_FINAL ETH"
echo ""
echo "The difference should be visible!"
