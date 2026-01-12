# Account Configuration

## Anvil Local Network Accounts

All accounts have 10,000 ETH by default on Anvil local network.

### Developer/Deployer Account (Account 0)
**Address**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`  
**Private Key**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`  
**Balance**: ~10.0 ETH (used for deployments)  
**Role**: 
- Contract deployer
- NodeRegistry admin (can add/remove nodes)
- ModelOwner (can register models)

**Status**: ✅ Used to deploy all contracts

---

### Customer Account 1
**Address**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`  
**Private Key**: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`  
**Balance**: 10.0 ETH  
**Role**: Customer (can request inferences)

**Use Case**: 
- Test customer account
- Request inferences from models
- Pay for inference requests

---

### Customer Account 2
**Address**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`  
**Private Key**: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`  
**Balance**: 10.0 ETH  
**Role**: Customer or ModelOwner (can be configured)

**Use Case**: 
- Alternative test account
- Can be registered as modelOwner to test model registration
- Can be used as customer for inference requests

---

## Account Roles in Database

Accounts need to be registered in the MongoDB database with roles:
- `customer`: Can request inferences
- `modelOwner`: Can register and manage models

### Register Account with Roles

```bash
# Register as customer
curl -X POST http://localhost:5000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "roles": ["customer"]
  }'

# Register as modelOwner
curl -X POST http://localhost:5000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "roles": ["modelOwner"]
  }'

# Register with both roles
curl -X POST http://localhost:5000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "roles": ["customer", "modelOwner"]
  }'
```

---

## Backend Configuration

The backend uses `PRIVATE_KEY` from `.env` file. This should be set to:

### For Development (Node Account)
```env
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RPC_URL=http://localhost:8545
INFERENCE_MANAGER=0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
```

**Note**: This account is used by the backend listener to:
- Listen for InferenceRequested events
- Submit inference results
- Get paid 50% of inference fees (as a node)

---

## Quick Reference

| Account | Address | Balance | Primary Use |
|---------|---------|---------|-------------|
| **Dev/Deployer** | `0xf39Fd6...92266` | ~10 ETH | Deploy contracts, admin, modelOwner |
| **Customer 1** | `0x709979...dc79C8` | 10 ETH | Test customer, request inferences |
| **Customer 2** | `0x3C44Cd...A4293BC` | 10 ETH | Alternative test account |

---

## Additional Anvil Accounts

Anvil provides 10 default accounts (index 0-9). Additional accounts:
- Account 3: `0x90F79bf6EB2c4f870365E785982E1f101E93b906` (PK: `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`)
- Account 4: `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` (PK: `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a`)
- Account 5-9: Available with similar setup

All accounts start with 10,000 ETH on Anvil.
