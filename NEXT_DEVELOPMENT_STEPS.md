# Next Development Steps

Based on the analysis, here are the critical features that need to be developed to complete the system.

## 🔴 High Priority - Core Functionality

### 1. **Blockchain Integration in Backend API**

#### A. Model Registration on Blockchain
**File**: `backend/src/routes/models.js`

**Current Issue**: Models are saved to MongoDB but NOT registered on-chain.

**What to develop**:
- After saving to MongoDB, register model on `ModelRegistry` contract
- Get the blockchain modelId and store it in MongoDB
- Connect to ModelRegistry contract using ethers.js
- Call `registerModel(ipfsCid, pricePerMinute)`

**Example implementation needed**:
```javascript
// After MongoDB save:
const modelRegistry = new ethers.Contract(
  process.env.MODEL_REGISTRY,
  modelRegistryABI,
  wallet
);

const tx = await modelRegistry.registerModel(ipfsCid, pricePerMinute);
const receipt = await tx.wait();
// Parse blockchain modelId from event
// Update MongoDB model with blockchain modelId
```

---

#### B. IPFS Upload Endpoint
**File**: Create `backend/src/routes/ipfs.js`

**What to develop**:
- POST `/api/ipfs/upload` endpoint
- Accept file uploads (multipart/form-data)
- Upload to Pinata IPFS using existing `utils/ipfs.js`
- Return IPFS CID (hash)

**Routes needed**:
```javascript
router.post("/upload", upload.single('file'), async (req, res) => {
  // Upload to IPFS using uploadToIPFS()
  // Return { hash: ipfsCid }
});
```

---

#### C. Inference Request API
**File**: Create `backend/src/routes/inference.js`

**What to develop**:
- POST `/api/inference/request` endpoint
- Accept: `{ modelId, wallet, durationMinutes, inputData }`
- Calculate total cost: `pricePerMinute × durationMinutes`
- Return transaction parameters for frontend to sign
- OR: Execute transaction directly if wallet is connected

**Two approaches**:
1. **Backend signs** (simpler for MVP):
   - User sends wallet address
   - Backend uses that wallet's private key
   - Backend calls `requestInference()` on behalf of user

2. **Frontend signs** (more decentralized):
   - Backend returns transaction parameters
   - Frontend signs and submits transaction
   - Requires wallet connection (MetaMask, etc.)

---

### 2. **Fix Event Listener to Extract Duration**

**File**: `backend/src/listener.js`

**Current Issue**: Using `DEFAULT_MINUTES = 10` because durationMinutes not extracted from event.

**What to fix**:
- The `InferenceRequested` event emits `durationMinutes` but listener doesn't capture it
- Update event handler to extract all parameters:
  ```javascript
  inferenceManager.on(
    "InferenceRequested",
    async (requestId, user, modelId, durationMinutes, expiresAt) => {
      // Use actual durationMinutes from event
    }
  );
  ```

---

### 3. **Frontend Wallet Integration**

**What to develop**:
- Add wallet connection (MetaMask/Web3Modal)
- Enable users to sign transactions
- Update ModelUpload to register on-chain
- Update ModelMarketplace to call smart contracts for inference requests
- Change `durationHours` to `durationMinutes` throughout frontend

**Files to update**:
- `Frontend/src/components/ModelUpload.js` - Connect wallet, register on-chain
- `Frontend/src/components/ModelMarketplace.js` - Connect wallet, pay for inference
- `Frontend/src/components/ChatInterface.js` - Fix durationHours → durationMinutes
- Create `Frontend/src/utils/web3.js` - Wallet connection utilities

---

## 🟡 Medium Priority - API Completion

### 4. **Missing API Endpoints**

**Files to create/update**:

#### `backend/src/routes/inference.js`:
- `POST /inference/request` - Request inference (blockchain transaction)
- `GET /inference/status/:requestId` - Check inference status
- `GET /inference/rentals/:wallet` - Get user's active rentals

#### `backend/src/routes/ipfs.js`:
- `POST /ipfs/upload` - Upload file to IPFS
- `GET /ipfs/:cid` - Get IPFS file info

#### `backend/src/routes/chat.js`:
- `POST /chat/message` - Send chat message (uses API key)
- `GET /chat/:chatId` - Get chat history

#### Update `backend/src/index.js`:
- Add all new routes
- Add CORS middleware
- Add error handling middleware

---

### 5. **API Key Validation Middleware**

**File**: Create `backend/src/middleware/apiKey.js`

**What to develop**:
- Middleware to validate API keys from requests
- Check if API key exists in Rental collection
- Check if rental is active and not expired
- Attach rental info to request object

**Usage**:
```javascript
router.post("/chat/message", validateApiKey, async (req, res) => {
  // req.rental contains the rental info
});
```

---

## 🟢 Lower Priority - Enhancements

### 6. **Error Handling & Validation**

- Add input validation (Joi or express-validator)
- Add try-catch to all routes
- Standardized error responses
- Input sanitization

### 7. **CORS Configuration**

**File**: `backend/src/index.js`
```javascript
import cors from 'cors';
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

### 8. **Refund Mechanism for Expired Requests**

**Smart Contract**: Update `InferenceManager.sol`
- Add `cancelRequest(uint256 requestId)` function
- Allow customer to claim refund if request expires
- Only if request not fulfilled

---

## 📋 Implementation Order

1. **Week 1: Core Blockchain Integration**
   - ✅ Fix listener to extract durationMinutes
   - ✅ Add IPFS upload endpoint
   - ✅ Update model registration to include blockchain registration
   - ✅ Create inference request API

2. **Week 2: Frontend Integration**
   - ✅ Add wallet connection to frontend
   - ✅ Update ModelUpload for on-chain registration
   - ✅ Update ModelMarketplace for on-chain payment
   - ✅ Fix durationHours → durationMinutes

3. **Week 3: API Completion**
   - ✅ Add API key validation middleware
   - ✅ Complete chat API endpoints
   - ✅ Add CORS and error handling
   - ✅ Input validation

4. **Week 4: Polish & Testing**
   - ✅ Test end-to-end flow
   - ✅ Add error handling
   - ✅ Documentation
   - ✅ Refund mechanism (optional)

---

## 🛠️ Quick Start Development

### Priority 1: Model Registration on Blockchain

```bash
# 1. Add ethers and contract ABI to backend
cd backend
npm install ethers

# 2. Create ModelRegistry contract interface
# Save ModelRegistry.json ABI in backend/src/contracts/

# 3. Update models.js route to register on-chain
# After MongoDB save, call ModelRegistry.registerModel()
```

### Priority 2: IPFS Upload Endpoint

```bash
# 1. Install multer for file uploads
cd backend
npm install multer

# 2. Create routes/ipfs.js
# 3. Add route to index.js: app.use("/ipfs", ipfsRoute)
```

### Priority 3: Inference Request API

```bash
# 1. Create routes/inference.js
# 2. Calculate cost: getPricePerMinute(modelId) × durationMinutes
# 3. Call InferenceManager.requestInference() with payment
# 4. Return transaction receipt or request ID
```

---

## 📝 Files to Create

1. `backend/src/routes/ipfs.js` - IPFS upload endpoints
2. `backend/src/routes/inference.js` - Inference request endpoints
3. `backend/src/routes/chat.js` - Chat message endpoints
4. `backend/src/middleware/apiKey.js` - API key validation
5. `backend/src/contracts/ModelRegistry.json` - Contract ABI
6. `Frontend/src/utils/web3.js` - Wallet connection utilities

## 📝 Files to Update

1. `backend/src/routes/models.js` - Add blockchain registration
2. `backend/src/listener.js` - Extract durationMinutes from event
3. `backend/src/index.js` - Add new routes and middleware
4. `Frontend/src/components/ModelUpload.js` - Wallet integration
5. `Frontend/src/components/ModelMarketplace.js` - Blockchain payments
6. `Frontend/src/components/ChatInterface.js` - Fix durationHours

---

## 🎯 Success Criteria

The system will be complete when:

1. ✅ Users can upload models to IPFS
2. ✅ Models are registered on both MongoDB and blockchain
3. ✅ Customers can request inference and pay via blockchain
4. ✅ Backend listener properly handles all event parameters
5. ✅ Frontend can connect wallets and interact with contracts
6. ✅ API keys are generated and validated correctly
7. ✅ End-to-end flow works: Upload → Register → Request → Pay → Infer → Distribute

---

## 📚 References

- Contract ABIs: `out/ModelRegistry.sol/ModelRegistry.json`
- Existing utilities: `backend/src/utils/ipfs.js`, `backend/src/utils/eth.js`
- Account info: `ACCOUNTS.md`
- Payment flow: `PAYMENT_FLOW.md`
