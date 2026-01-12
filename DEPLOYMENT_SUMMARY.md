# Deployment Summary

## Contracts Deployed (Local Anvil - Chain ID: 31337)

Deployed on: Local Anvil (http://localhost:8545)

### Contract Addresses

- **NodeRegistry**: `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`
- **ModelRegistry**: `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9`
- **InferenceManager**: `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707`

### Deployment Order

1. ✅ NodeRegistry (no dependencies)
2. ✅ ModelRegistry (no dependencies)
3. ✅ InferenceManager (depends on NodeRegistry and ModelRegistry)

### Backend Configuration

Update `backend/src/config.js` with these addresses:

```javascript
export const ADDRESSES = {
  inferenceManager: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
  nodeRegistry: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  modelRegistry: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
};
```

Also set `INFERENCE_MANAGER` environment variable in backend `.env`:
```
INFERENCE_MANAGER=0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
NODE_REGISTRY=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
MODEL_REGISTRY=0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
RPC_URL=http://localhost:8545
```

### Next Steps

1. **Add Node to NodeRegistry** (if needed):
   - Connect to NodeRegistry at `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`
   - Call `addNode(yourNodeAddress)` (admin only)

2. **Update Backend Config**:
   - Update `backend/src/config.js` with the new addresses
   - Set environment variables in `.env`

3. **Test the Deployment**:
   - Verify contracts are deployed correctly
   - Test inference flow
   - Register a test model

### Deployment Commands

#### Local Deployment (Anvil)
```bash
# Start Anvil (if not running)
anvil

# Deploy all contracts
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

#### Testnet Deployment (Sepolia)
```bash
# Set your private key and RPC URL
export PRIVATE_KEY=your_private_key
export SEPOLIA_RPC_URL=your_sepolia_rpc_url

# Deploy all contracts
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key YOUR_ETHERSCAN_API_KEY
```

### Deployment Artifacts

- Broadcast artifacts: `broadcast/DeployAll.s.sol/31337/run-latest.json`
- Cache artifacts: `cache/DeployAll.s.sol/31337/run-latest.json`
