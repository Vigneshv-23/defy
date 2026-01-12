# REST API Documentation

Complete REST API endpoints for all smart contract functions.

Base URL: `http://localhost:5000` (or your backend URL)

---

## 📋 Table of Contents

1. [Node Registry APIs](#node-registry-apis)
2. [Model Registry APIs](#model-registry-apis)
3. [Inference Manager APIs](#inference-manager-apis)
4. [IPFS APIs](#ipfs-apis)
5. [User APIs](#user-apis)

---

## 🔧 Node Registry APIs

### POST `/nodes/add`
Add an approved node (Admin only)

**Request Body:**
```json
{
  "nodeAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

**Response:**
```json
{
  "success": true,
  "nodeAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "transactionHash": "0x...",
  "blockNumber": 123
}
```

---

### POST `/nodes/remove`
Remove an approved node (Admin only)

**Request Body:**
```json
{
  "nodeAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

**Response:**
```json
{
  "success": true,
  "nodeAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "transactionHash": "0x...",
  "blockNumber": 123
}
```

---

### GET `/nodes/check/:address`
Check if a node is approved

**Example:** `GET /nodes/check/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

**Response:**
```json
{
  "nodeAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "isApproved": true
}
```

---

### GET `/nodes/admin`
Get the admin address of NodeRegistry

**Response:**
```json
{
  "admin": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

---

## 📦 Model Registry APIs

### POST `/models`
Register a new model (Model Owner only)

**Request Body:**
```json
{
  "wallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "name": "My AI Model",
  "description": "A great model",
  "ipfsCid": "QmTest123",
  "pricePerMinute": "1000000000000000"
}
```

**Response:**
```json
{
  "_id": "...",
  "ownerWallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "name": "My AI Model",
  "description": "A great model",
  "ipfsCid": "QmTest123",
  "pricePerMinute": "1000000000000000",
  "blockchainModelId": "0",
  "transactionHash": "0x..."
}
```

---

### GET `/models`
Get all active models from MongoDB

**Response:**
```json
[
  {
    "_id": "...",
    "ownerWallet": "0x...",
    "name": "My AI Model",
    "ipfsCid": "QmTest123",
    "pricePerMinute": "1000000000000000",
    "blockchainModelId": "0"
  }
]
```

---

### PUT `/models/:modelId/price`
Update model price (Model Owner only)

**Request Body:**
```json
{
  "newPricePerMinute": "2000000000000000",
  "wallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

**Response:**
```json
{
  "success": true,
  "modelId": "0",
  "newPricePerMinute": "2000000000000000",
  "transactionHash": "0x...",
  "blockNumber": 123
}
```

---

### GET `/models/blockchain/:modelId`
Get model details from blockchain

**Example:** `GET /models/blockchain/0`

**Response:**
```json
{
  "modelId": "0",
  "owner": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "ipfsCid": "QmTest123",
  "pricePerMinute": "1000000000000000"
}
```

---

### GET `/models/blockchain/next-id`
Get the next model ID that will be assigned

**Response:**
```json
{
  "nextModelId": "1"
}
```

---

## 🤖 Inference Manager APIs

### POST `/inference/request`
Request inference (returns transaction parameters for frontend to sign)

**Request Body:**
```json
{
  "modelId": "0",
  "wallet": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "durationMinutes": "10"
}
```

**Response:**
```json
{
  "transaction": {
    "to": "0xe6e340d132b5f46d1e472debcd681b2abc16e57e",
    "data": "0x...",
    "value": "10000000000000000",
    "gasLimit": "...",
    "gasPrice": "...",
    "nonce": 5
  },
  "modelId": "0",
  "durationMinutes": "10",
  "pricePerMinute": "1000000000000000",
  "totalCost": "10000000000000000"
}
```

**Note:** Frontend should use these transaction parameters to sign and send the transaction using MetaMask or Web3.

---

### GET `/inference/status/:requestId`
Check inference request status

**Example:** `GET /inference/status/0`

**Response:**
```json
{
  "requestId": "0",
  "user": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "modelId": "0",
  "paidAmount": "10000000000000000",
  "expiresAt": "2024-01-01T12:00:00.000Z",
  "fulfilled": false
}
```

---

### POST `/inference/submit`
Submit inference result and distribute payment (Approved Node only)

**Request Body:**
```json
{
  "requestId": "0",
  "wallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "0",
  "transactionHash": "0x...",
  "blockNumber": 123,
  "message": "Payment distributed: 75% to model owner, 25% to commission account"
}
```

**Note:** Payment split:
- 75% goes to model owner
- 25% goes to commission account

---

### GET `/inference/next-request-id`
Get the next request ID that will be assigned

**Response:**
```json
{
  "nextRequestId": "1"
}
```

---

### GET `/inference/commission-account`
Get the commission account address

**Response:**
```json
{
  "commissionAccount": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
}
```

---

## 📁 IPFS APIs

### POST `/ipfs/upload`
Upload file to IPFS

**Request:** `multipart/form-data` with `file` field

**Response:**
```json
{
  "hash": "QmYourIPFSCID",
  "fileName": "model.json",
  "size": 12345
}
```

---

## 👤 User APIs

### POST `/users`
Create a new user

**Request Body:**
```json
{
  "wallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "roles": ["modelOwner"]
}
```

---

### GET `/users/:wallet`
Get user by wallet address

**Response:**
```json
{
  "_id": "...",
  "wallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "roles": ["modelOwner"]
}
```

---

## 🔐 Authentication Notes

Currently, the API uses the backend's private key (`PRIVATE_KEY` in `.env`) to sign transactions. For production:

1. **For write operations:** Frontend should sign transactions using MetaMask/Web3
2. **For read operations:** No authentication needed (view functions)
3. **For admin operations:** Should verify the caller is the admin

---

## 📝 Example Frontend Integration

### Request Inference (with MetaMask)

```javascript
// 1. Get transaction parameters from backend
const response = await fetch('http://localhost:5000/inference/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    modelId: '0',
    wallet: userAddress,
    durationMinutes: '10'
  })
});

const { transaction } = await response.json();

// 2. Sign and send transaction using MetaMask
const tx = await ethereum.request({
  method: 'eth_sendTransaction',
  params: [{
    to: transaction.to,
    data: transaction.data,
    value: transaction.value,
    from: userAddress
  }]
});

console.log('Transaction hash:', tx);
```

---

## 🚀 Quick Start

1. **Start backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Test endpoints:**
   ```bash
   # Check if node is approved
   curl http://localhost:5000/nodes/check/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

   # Get all models
   curl http://localhost:5000/models

   # Get inference request status
   curl http://localhost:5000/inference/status/0
   ```

---

## ⚠️ Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "details": "Additional details (optional)"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid input)
- `403` - Forbidden (not authorized)
- `404` - Not Found
- `500` - Internal Server Error
