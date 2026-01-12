# MetaMask Setup Guide

## Step 1: Add Local Network (Anvil) to MetaMask

1. Open MetaMask
2. Click the network dropdown (top left)
3. Click "Add Network" → "Add a network manually"
4. Enter these details:

   **Network Name:** `Localhost 8545` (or `Anvil Local`)
   
   **RPC URL:** `http://localhost:8545`
   
   **Chain ID:** `31337`
   
   **Currency Symbol:** `ETH`
   
   **Block Explorer URL:** (leave empty or use `http://localhost:8545`)

5. Click "Save"

## Step 2: Import Accounts to MetaMask

### Account 1: Developer/Model Owner (Recommended for deploying & managing)

**Address:** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`  
**Private Key:** `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`  
**Balance:** ~10,000 ETH  
**Use for:** Deploying contracts, registering models, admin tasks

**Import Steps:**
1. Click account icon (circle top right)
2. Click "Import Account"
3. Select "Private Key"
4. Paste: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
5. Click "Import"

---

### Account 2: Customer Account 1 (Recommended for testing customer features)

**Address:** `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`  
**Private Key:** `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`  
**Balance:** ~10,000 ETH  
**Use for:** Requesting inferences, testing customer flow

**Import Steps:**
1. Click account icon (circle top right)
2. Click "Import Account"
3. Select "Private Key"
4. Paste: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
5. Click "Import"

---

### Account 3: Customer Account 2 (Alternative customer account)

**Address:** `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`  
**Private Key:** `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`  
**Balance:** ~10,000 ETH  
**Use for:** Alternative customer testing

**Import Steps:**
1. Click account icon (circle top right)
2. Click "Import Account"
3. Select "Private Key"
4. Paste: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
5. Click "Import"

---

## Step 3: Verify Setup

After importing:
1. Switch to "Localhost 8545" network in MetaMask
2. Switch between accounts using the account dropdown
3. Verify each account shows ~10,000 ETH balance
4. You're ready to test!

---

## Important Notes

⚠️ **WARNING:**
- These are **test accounts** for local development only
- **NEVER** use these private keys on mainnet or testnets
- **NEVER** share these private keys publicly
- These keys are only safe to use on your local Anvil network

✅ **Safe to use on:**
- Local Anvil network (localhost:8545, Chain ID: 31337)

❌ **Do NOT use on:**
- Ethereum Mainnet
- Sepolia Testnet
- Any other public network

---

## Quick Reference

| Account | Address | Private Key | Balance | Role |
|---------|---------|-------------|---------|------|
| **Dev/Owner** | `0xf39Fd6...92266` | `0xac0974...f2ff80` | ~10K ETH | Deployer, Admin, Model Owner |
| **Customer 1** | `0x709979...dc79C8` | `0x59c699...b78690d` | ~10K ETH | Customer |
| **Customer 2** | `0x3C44Cd...A4293BC` | `0x5de411...ab365a` | ~10K ETH | Customer |

---

## Current Deployed Contract Addresses

If you need to interact with contracts:

- **NodeRegistry:** `0x50F902D9606e61417599079C237D8c8937A5b5d5`
- **ModelRegistry:** `0x7Bbe693fBc107E8b6BaDE04Ac94cacfAdD6E0574`
- **InferenceManager:** `0x27F8F1C7f2ade61C4Ab89E0Dd1d3eFF6591D2Fd4`
