#!/bin/bash

# Deploy contracts with Commission Account (Account 2) as NodeRegistry admin
# Commission Account: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

set -e

RPC_URL="http://localhost:8545"
COMMISSION_KEY="0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
COMMISSION_ACCOUNT="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"

echo "=========================================="
echo "Deploying with Commission Account as Admin"
echo "=========================================="
echo ""
echo "Commission Account (will be NodeRegistry admin):"
echo "  Address: $COMMISSION_ACCOUNT"
echo ""

# Deploy contracts
echo "Deploying contracts..."
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url $RPC_URL \
  --broadcast \
  --private-key $COMMISSION_KEY

echo ""
echo "Waiting for deployment to complete..."
sleep 3

# Get contract addresses
NODE_REG=$(cat broadcast/DeployAll.s.sol/31337/run-latest.json | jq -r '.transactions[0].contractAddress')
MODEL_REG=$(cat broadcast/DeployAll.s.sol/31337/run-latest.json | jq -r '.transactions[1].contractAddress')
INF_MGR=$(cat broadcast/DeployAll.s.sol/31337/run-latest.json | jq -r '.transactions[2].contractAddress')

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Contract Addresses:"
echo "  NodeRegistry: $NODE_REG"
echo "  ModelRegistry: $MODEL_REG"
echo "  InferenceManager: $INF_MGR"
echo ""

# Verify admin
echo "Verifying NodeRegistry admin..."
ADMIN=$(cast call "$NODE_REG" "admin()" --rpc-url $RPC_URL | cut -c 27-66)
ADMIN_LOWER=$(echo "$ADMIN" | tr '[:upper:]' '[:lower:]')
COMM_LOWER=$(echo "$COMMISSION_ACCOUNT" | tr '[:upper:]' '[:lower:]' | cut -c 3-)

if [ "$ADMIN_LOWER" = "$COMM_LOWER" ]; then
    echo "✅ Commission Account is now the admin!"
else
    echo "⚠️  Admin mismatch:"
    echo "  Expected: $COMMISSION_ACCOUNT"
    echo "  Got: 0x$ADMIN"
fi

echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo "1. Update backend/src/config.js with new addresses"
echo "2. Restart backend server"
echo "3. Update frontend contract addresses if needed"
echo ""
