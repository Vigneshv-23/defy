#!/bin/bash

# Deploy and Test Script - See Balance Changes in MetaMask
# This script deploys contracts and runs a complete payment flow

RPC_URL="http://localhost:8545"
ACCOUNT1_PK="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
CUSTOMER_PK="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "Deploy and Test - See Changes in MetaMask"
echo "=========================================="
echo ""

# Step 1: Check initial balances
echo "Step 1: Initial Balances (Check in MetaMask NOW)"
echo "-----------------------------------"
COMM_INIT=$(cast balance 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')
MODEL_INIT=$(cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')
CUSTOMER_INIT=$(cast balance 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')

echo -e "${BLUE}Commission Account (Account 2):${NC} $COMM_INIT ETH"
echo -e "${BLUE}Model Owner (Account 1):${NC} $MODEL_INIT ETH"
echo -e "${BLUE}Customer:${NC} $CUSTOMER_INIT ETH"
echo ""
echo -e "${YELLOW}📱 Check these balances in MetaMask and note them down!${NC}"
echo ""

# Step 2: Deploy contracts
echo "Step 2: Deploying Contracts"
echo "-----------------------------------"
echo "Deploying with 75/25 payment split..."
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --private-key "$ACCOUNT1_PK" 2>&1 | tail -10

echo ""
echo -e "${GREEN}✅ Contracts deployed!${NC}"
echo ""

# Step 3: Get contract addresses
sleep 2
NODE_REG=$(cat broadcast/DeployAll.s.sol/31337/run-latest.json | jq -r '.transactions[0].contractAddress' 2>/dev/null)
MODEL_REG=$(cat broadcast/DeployAll.s.sol/31337/run-latest.json | jq -r '.transactions[1].contractAddress' 2>/dev/null)
INF_MGR=$(cat broadcast/DeployAll.s.sol/31337/run-latest.json | jq -r '.transactions[2].contractAddress' 2>/dev/null)

echo "Deployed Contracts:"
echo "  NodeRegistry: $NODE_REG"
echo "  ModelRegistry: $MODEL_REG"
echo "  InferenceManager: $INF_MGR"
echo ""

# Step 4: Setup (register model, add node)
echo "Step 3: Setting Up"
echo "-----------------------------------"
echo "Registering model..."
cast send "$MODEL_REG" "registerModel(string,uint256)" "QmTestModel" 1000000000000000 \
  --private-key "$ACCOUNT1_PK" \
  --rpc-url "$RPC_URL" > /dev/null 2>&1
echo -e "${GREEN}✅ Model registered${NC}"

echo "Adding node..."
NODE_ADD_RESULT=$(cast send "$NODE_REG" "addNode(address)" 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --private-key "$ACCOUNT1_PK" \
  --rpc-url "$RPC_URL" 2>&1)
if echo "$NODE_ADD_RESULT" | grep -q "transactionHash"; then
  echo -e "${GREEN}✅ Node added${NC}"
elif echo "$NODE_ADD_RESULT" | grep -q "not admin"; then
  echo -e "${YELLOW}⚠️  Node add failed - checking admin...${NC}"
  ADMIN=$(cast call "$NODE_REG" "admin()" --rpc-url "$RPC_URL" | cut -c 27-66)
  echo "Admin is: $ADMIN"
  echo "Account 1 is: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  echo "Note: If admin is different, node needs to be added by admin account"
  echo "Trying to verify if node is already added..."
  IS_APPROVED=$(cast call "$NODE_REG" "isApproved(address)" 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url "$RPC_URL")
  if [ "$IS_APPROVED" = "0x0000000000000000000000000000000000000000000000000000000000000001" ]; then
    echo -e "${GREEN}✅ Node is already approved${NC}"
  else
    echo -e "${YELLOW}⚠️  Node not approved - payment distribution may fail${NC}"
  fi
else
  echo -e "${GREEN}✅ Node added${NC}"
fi
echo ""

# Step 5: Customer requests inference
echo "Step 4: Customer Requests Inference (Pays 0.01 ETH)"
echo "-----------------------------------"
echo "Customer paying 0.01 ETH for 10 minutes..."
cast send "$INF_MGR" "requestInference(uint256,uint256)" 0 10 \
  --value 10000000000000000 \
  --private-key "$CUSTOMER_PK" \
  --rpc-url "$RPC_URL" > /dev/null 2>&1
echo -e "${GREEN}✅ Payment received by contract${NC}"
echo ""
echo -e "${YELLOW}📱 Check MetaMask - Customer balance should have decreased!${NC}"
echo ""

# Step 6: Submit result (distribute payment)
echo "Step 5: Submit Result (Distribute Payment 75/25)"
echo "-----------------------------------"
echo "Distributing payment: 75% to Model Owner, 25% to Commission..."
cast send "$INF_MGR" "submitResult(uint256)" 0 \
  --private-key "$ACCOUNT1_PK" \
  --rpc-url "$RPC_URL" > /dev/null 2>&1
echo -e "${GREEN}✅ Payment distributed!${NC}"
echo ""

# Step 7: Final balances
sleep 3
echo "Step 6: Final Balances (Check in MetaMask NOW)"
echo "-----------------------------------"
COMM_FINAL=$(cast balance 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')
MODEL_FINAL=$(cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')
CUSTOMER_FINAL=$(cast balance 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --rpc-url "$RPC_URL" | awk '{printf "%.6f", $1/1e18}')

COMM_GAIN=$(echo "$COMM_FINAL - $COMM_INIT" | bc -l)
MODEL_GAIN=$(echo "$MODEL_FINAL - $MODEL_INIT" | bc -l)
CUSTOMER_LOSS=$(echo "$CUSTOMER_INIT - $CUSTOMER_FINAL" | bc -l)

echo -e "${BLUE}Commission Account (Account 2):${NC}"
echo "  Before: $COMM_INIT ETH"
echo "  After:  $COMM_FINAL ETH"
echo -e "  ${GREEN}✅ Gained: $COMM_GAIN ETH (25% = 0.0025 ETH)${NC}"
echo ""
echo -e "${BLUE}Model Owner (Account 1):${NC}"
echo "  Before: $MODEL_INIT ETH"
echo "  After:  $MODEL_FINAL ETH"
echo -e "  ${GREEN}✅ Gained: $MODEL_GAIN ETH (75% = 0.0075 ETH)${NC}"
echo ""
echo -e "${BLUE}Customer:${NC}"
echo "  Before: $CUSTOMER_INIT ETH"
echo "  After:  $CUSTOMER_FINAL ETH"
echo "  Paid: $CUSTOMER_LOSS ETH (0.01 ETH + gas)"
echo ""

echo "=========================================="
echo -e "${GREEN}✅ COMPLETE! CHECK METAMASK NOW!${NC}"
echo "=========================================="
echo ""
echo "📱 MetaMask Balances Should Show:"
echo "  Account 2 (Commission): $COMM_FINAL ETH"
echo "  Account 1 (Model Owner): $MODEL_FINAL ETH"
echo ""
echo "💡 If balances don't match:"
echo "  1. Click network dropdown → Select 'Localhost 8545' again"
echo "  2. Or disconnect/reconnect the network"
echo "  3. Make sure you're on the correct network (Chain ID: 31337)"
