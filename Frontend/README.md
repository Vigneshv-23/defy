# InferChain Frontend

Complete frontend for interacting with all smart contract functions.

## Features

### 🔗 Web3 Integration
- MetaMask wallet connection
- Automatic network switching to Localhost 8545 (Anvil)
- Real-time account and network monitoring

### 📦 Node Management
- Add/remove approved nodes (Admin only)
- Check node approval status
- View admin address

### 🤖 Model Management
- View all models from blockchain
- Update model prices (Model owner only)
- View model details (owner, IPFS CID, price)

### 💰 Inference Management
- Request inferences with MetaMask
- Check inference request status
- Submit results and distribute payments (75% model owner, 25% commission)
- View commission account

## Setup

1. **Install dependencies:**
   ```bash
   cd Frontend
   npm install
   ```

2. **Configure API URL:**
   Create `.env` file:
   ```
   REACT_APP_API_URL=https://nondisastrously-ungrazed-hang.ngrok-free.dev
   ```
   Or use localhost:
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

3. **Start the frontend:**
   ```bash
   npm start
   ```

## Usage

### Connect Wallet
1. Click "Connect Wallet" button in navbar
2. Approve MetaMask connection
3. Switch to Localhost 8545 network if prompted

### Node Management
- Navigate to `/blockchain/nodes`
- Admin can add/remove nodes
- Anyone can check node status

### Model Management
- Navigate to `/blockchain/models`
- View all models from blockchain
- Model owners can update prices

### Inference Management
- Navigate to `/blockchain/inference`
- Request inference (requires MetaMask)
- Check request status
- Submit results (approved nodes only)

## Routes

- `/` - Home page
- `/marketplace` - Browse models
- `/dashboard` - User dashboard
- `/blockchain/models` - Blockchain models
- `/blockchain/inference` - Inference manager
- `/blockchain/nodes` - Node management

## Contract Addresses

Update these in `src/utils/web3.js` after deployment:

```javascript
export const CONTRACT_ADDRESSES = {
  nodeRegistry: '0x...',
  modelRegistry: '0x...',
  inferenceManager: '0x...'
};
```

## API Integration

All API calls are in `src/utils/api.js`:
- `nodeAPI` - Node registry endpoints
- `modelAPI` - Model registry endpoints
- `inferenceAPI` - Inference manager endpoints
- `ipfsAPI` - IPFS upload endpoints

## Web3 Context

The `Web3Context` provides:
- `account` - Connected wallet address
- `isConnected` - Connection status
- `connect()` - Connect wallet function
- `disconnect()` - Disconnect wallet function
- `signer` - Ethers signer for transactions
- `provider` - Ethers provider

## Payment Split

When submitting inference results:
- **75%** goes to model owner
- **25%** goes to commission account

This is automatically handled by the smart contract.
