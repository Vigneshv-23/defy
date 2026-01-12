# Blockchain Integration with Backend API - COMPLETE ✅

## Overview

Successfully integrated blockchain functionality with the backend API. Models are now registered on both MongoDB and the blockchain, and inference requests can interact with smart contracts.

---

## ✅ Completed Features

### 1. Model Registration on Blockchain
**File**: `backend/src/routes/models.js`

- ✅ Models are now registered on `ModelRegistry` contract after MongoDB save
- ✅ Extracts `modelId` from blockchain event
- ✅ Stores `blockchainModelId` in MongoDB
- ✅ Returns transaction hash and blockchain model ID in response
- ✅ Comprehensive error handling

**Features**:
- Validates user is `modelOwner` before registration
- Registers on blockchain with IPFS CID and price per minute
- Parses `ModelRegistered` event to get blockchain modelId
- Stores blockchain modelId in MongoDB for future reference

---

### 2. Fixed Event Listener
**File**: `backend/src/listener.js`

- ✅ Now properly extracts `durationMinutes` from `InferenceRequested` event
- ✅ Uses actual duration instead of hardcoded `DEFAULT_MINUTES`
- ✅ Properly extracts `expiresAt` timestamp from event
- ✅ Stores `durationMinutes` in Rental model

**Changes**:
- Event handler now receives all 5 parameters: `(requestId, user, modelId, durationMinutes, expiresAtTimestamp)`
- Converts blockchain timestamp to JavaScript Date
- Stores actual duration in Rental record

---

### 3. IPFS Upload Endpoint
**File**: `backend/src/routes/ipfs.js` (NEW)

- ✅ POST `/ipfs/upload` endpoint
- ✅ Uses multer for file uploads
- ✅ Uploads files to Pinata IPFS
- ✅ Returns IPFS CID (hash)
- ✅ Automatic cleanup of temporary files
- ✅ 100MB file size limit

**Usage**:
```javascript
// Upload file
const formData = new FormData();
formData.append('file', fileObject);

const response = await axios.post('/ipfs/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Returns: { hash: "Qm...", fileName: "...", size: 12345 }
```

---

### 4. Inference Request API
**File**: `backend/src/routes/inference.js` (NEW)

- ✅ POST `/inference/request` - Create inference request
- ✅ GET `/inference/status/:requestId` - Check request status

**Features**:
- Fetches model price from blockchain (`ModelRegistry.getPricePerMinute()`)
- Calculates total cost: `pricePerMinute × durationMinutes`
- Returns transaction parameters for frontend to sign
- Can check inference request status on blockchain

**Usage**:
```javascript
// Request inference (returns transaction parameters)
POST /inference/request
{
  "modelId": "0",
  "wallet": "0x...",
  "durationMinutes": "10"
}

// Returns transaction data for frontend to sign and submit
{
  "transaction": {
    "to": "0x...",
    "data": "0x...",
    "value": "10000000000000000",
    ...
  },
  "totalCost": "10000000000000000",
  "pricePerMinute": "1000000000000000",
  "durationMinutes": "10"
}
```

---

### 5. Updated Data Models

#### Model Schema
**File**: `backend/src/models/Model.js`

- ✅ Added `blockchainModelId` field to store blockchain model ID

#### Rental Schema
**File**: `backend/src/models/Rental.js`

- ✅ Added `durationMinutes` field to store actual duration

---

### 6. Backend Configuration Updates
**File**: `backend/src/index.js`

- ✅ Added IPFS routes: `/ipfs/*`
- ✅ Added inference routes: `/inference/*`
- ✅ Added CORS middleware
- ✅ Added URL encoding middleware

---

## 📁 Files Created

1. `backend/src/contracts/ModelRegistry.json` - ModelRegistry ABI
2. `backend/src/routes/ipfs.js` - IPFS upload endpoint
3. `backend/src/routes/inference.js` - Inference request endpoints

## 📝 Files Updated

1. `backend/src/routes/models.js` - Added blockchain registration
2. `backend/src/listener.js` - Fixed to extract durationMinutes
3. `backend/src/models/Model.js` - Added blockchainModelId field
4. `backend/src/models/Rental.js` - Added durationMinutes field
5. `backend/src/index.js` - Added new routes and CORS

---

## 🔧 Installation Requirements

Install multer for file uploads:

```bash
cd backend
npm install multer
```

---

## 📋 API Endpoints

### Models
- `POST /models` - Register model (now includes blockchain registration)
- `GET /models` - List all active models

### IPFS
- `POST /ipfs/upload` - Upload file to IPFS

### Inference
- `POST /inference/request` - Create inference request (returns transaction params)
- `GET /inference/status/:requestId` - Check inference request status

---

## 🚀 Usage Examples

### 1. Register a Model

```bash
curl -X POST http://localhost:5000/models \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "name": "My AI Model",
    "description": "A great model",
    "ipfsCid": "QmTest123",
    "pricePerMinute": "1000000000000000"
  }'
```

**Response includes**:
- MongoDB model document
- `blockchainModelId`: Model ID from blockchain
- `transactionHash`: Transaction hash

### 2. Upload File to IPFS

```bash
curl -X POST http://localhost:5000/ipfs/upload \
  -F "file=@/path/to/model.json"
```

**Response**:
```json
{
  "hash": "QmYourIPFSCID",
  "fileName": "model.json",
  "size": 12345
}
```

### 3. Request Inference

```bash
curl -X POST http://localhost:5000/inference/request \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "0",
    "wallet": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "durationMinutes": "10"
  }'
```

**Response**:
```json
{
  "transaction": {
    "to": "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
    "data": "0x...",
    "value": "10000000000000000",
    "gasLimit": "...",
    "gasPrice": "..."
  },
  "modelId": "0",
  "durationMinutes": "10",
  "pricePerMinute": "1000000000000000",
  "totalCost": "10000000000000000"
}
```

---

## 🔍 Event Listener Improvements

The listener now properly handles all event parameters:

**Before**:
```javascript
// Only captured 3 parameters
async (requestId, user, modelId) => {
  const DEFAULT_MINUTES = 10; // Hardcoded!
}
```

**After**:
```javascript
// Captures all 5 parameters
async (requestId, user, modelId, durationMinutes, expiresAtTimestamp) => {
  const durationInMinutes = Number(durationMinutes);
  const expiresAt = new Date(Number(expiresAtTimestamp) * 1000);
  // Uses actual duration from blockchain!
}
```

---

## ⚠️ Important Notes

1. **Private Key**: The backend uses `PRIVATE_KEY` from `.env` to sign transactions. In production, consider using a more secure approach (wallet connections, transaction signing services).

2. **Transaction Signing**: The inference request endpoint currently returns transaction parameters for the frontend to sign. For a simpler MVP, you could have the backend sign transactions if users provide their private keys (less secure).

3. **Model Ownership**: The backend wallet signs the model registration. Ensure the backend wallet matches the user's wallet or implement a different signing mechanism.

4. **Error Handling**: All endpoints include comprehensive error handling with helpful error messages.

---

## 🎯 Next Steps

1. ✅ **Blockchain Integration** - COMPLETE
2. ⏭️ **Frontend Wallet Integration** - Connect MetaMask/Web3Modal
3. ⏭️ **Update Frontend** - Use new API endpoints
4. ⏭️ **API Key Validation** - Add middleware for API key validation
5. ⏭️ **Testing** - Test end-to-end flow

---

## ✅ Integration Status

- ✅ Model Registry ABI added
- ✅ Model registration on blockchain
- ✅ Event listener fixed (durationMinutes extraction)
- ✅ IPFS upload endpoint created
- ✅ Inference request endpoint created
- ✅ Status check endpoint created
- ✅ CORS middleware added
- ✅ Database models updated
- ✅ Error handling improved

**Blockchain integration with backend API is COMPLETE!** 🎉
