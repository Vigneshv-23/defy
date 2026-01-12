# Testing Guide for Blockchain Integration

## Prerequisites

1. **Anvil must be running**:
   ```bash
   anvil
   ```

2. **MongoDB must be running** (if using database)

3. **Backend must be running**:
   ```bash
   cd backend
   npm start
   ```

4. **Environment variables** must be set in `backend/.env`:
   ```
   RPC_URL=http://localhost:8545
   PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   INFERENCE_MANAGER=0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
   MODEL_REGISTRY=0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
   NODE_REGISTRY=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
   MONGO_URI=your_mongodb_connection_string
   ```

---

## Test 1: Register User

```bash
curl -X POST http://localhost:5000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "roles": ["modelOwner"]
  }'
```

**Expected**: User registered with modelOwner role

---

## Test 2: Register Model (Blockchain Integration)

```bash
curl -X POST http://localhost:5000/models \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "name": "Test AI Model",
    "description": "Testing blockchain integration",
    "ipfsCid": "QmTestModelCID789",
    "pricePerMinute": "1000000000000000"
  }'
```

**Expected**:
- Model registered on blockchain (ModelRegistry contract)
- Model saved to MongoDB with `blockchainModelId`
- Response includes `blockchainModelId` and `transactionHash`

**Verify on blockchain**:
```bash
cast call 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9 \
  "getModel(uint256)" \
  0 \
  --rpc-url http://localhost:8545
```

---

## Test 3: Get Models

```bash
curl -X GET http://localhost:5000/models
```

**Expected**: Returns all models including the newly registered one with `blockchainModelId`

---

## Test 4: Request Inference (Get Transaction Parameters)

```bash
curl -X POST http://localhost:5000/inference/request \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "0",
    "wallet": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "durationMinutes": "10"
  }'
```

**Expected**:
- Returns transaction parameters
- Includes `totalCost` calculated from `pricePerMinute × durationMinutes`
- Includes `transaction` object with all transaction details

---

## Test 5: Execute Inference Request (Using Transaction Parameters)

After getting transaction parameters from Test 4, you can execute the transaction:

```bash
# Use the transaction data from the API response
cast send 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707 \
  "requestInference(uint256,uint256)" \
  <modelId> \
  <durationMinutes> \
  --value <totalCost> \
  --private-key 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d \
  --rpc-url http://localhost:8545
```

**Expected**:
- Transaction succeeds
- Backend listener catches `InferenceRequested` event
- Rental created with API key
- Inference runs and result submitted

---

## Test 6: Check Inference Status

```bash
curl -X GET http://localhost:5000/inference/status/0
```

**Expected**: Returns request details from blockchain

---

## Test 7: IPFS Upload (Optional - Requires Pinata Credentials)

```bash
curl -X POST http://localhost:5000/ipfs/upload \
  -F "file=@path/to/your/file.json"
```

**Expected**: Returns IPFS CID (hash)

**Note**: Requires `PINATA_API_KEY` and `PINATA_SECRET_API_KEY` in backend `.env`

---

## End-to-End Flow Test

1. **Start services**:
   ```bash
   # Terminal 1: Start Anvil
   anvil
   
   # Terminal 2: Start Backend
   cd backend
   npm start
   ```

2. **Register user**:
   ```bash
   curl -X POST http://localhost:5000/users/register \
     -H "Content-Type: application/json" \
     -d '{"wallet":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","roles":["modelOwner"]}'
   ```

3. **Register model** (with blockchain):
   ```bash
   curl -X POST http://localhost:5000/models \
     -H "Content-Type: application/json" \
     -d '{
       "wallet":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
       "name":"Test Model",
       "description":"Test",
       "ipfsCid":"QmTest123",
       "pricePerMinute":"1000000000000000"
     }'
   ```

4. **Request inference** (get transaction params):
   ```bash
   curl -X POST http://localhost:5000/inference/request \
     -H "Content-Type: application/json" \
     -d '{
       "modelId":"0",
       "wallet":"0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
       "durationMinutes":"10"
     }'
   ```

5. **Execute transaction** (using params from step 4):
   ```bash
   cast send 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707 \
     "requestInference(uint256,uint256)" \
     0 10 \
     --value 10000000000000000 \
     --private-key 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d \
     --rpc-url http://localhost:8545
   ```

6. **Check backend logs** - Should see:
   - `InferenceRequested event` captured
   - `durationMinutes` extracted correctly
   - Rental created
   - API key generated
   - Inference fulfilled

---

## Verification Checklist

- [ ] User can be registered with roles
- [ ] Model registration includes blockchain registration
- [ ] `blockchainModelId` is stored in MongoDB
- [ ] Transaction hash is returned
- [ ] Model can be retrieved from API
- [ ] Inference request API returns correct transaction parameters
- [ ] Transaction parameters are correct (totalCost = pricePerMinute × durationMinutes)
- [ ] Backend listener captures events correctly
- [ ] `durationMinutes` is extracted from event (not hardcoded)
- [ ] Rental is created with correct expiration time
- [ ] API key is generated and stored

---

## Troubleshooting

### Error: "Model not found on blockchain"
- Check that model was registered on blockchain first
- Verify ModelRegistry contract address is correct

### Error: "Failed to get modelId from blockchain event"
- Check ModelRegistry contract is deployed
- Verify transaction was successful
- Check event is being emitted correctly

### Event listener not capturing durationMinutes
- Verify InferenceManager ABI has correct event signature
- Check that event emits all parameters
- Verify listener callback signature matches event

### Backend not starting
- Check MongoDB connection
- Verify all environment variables are set
- Check for port conflicts (port 5000)
