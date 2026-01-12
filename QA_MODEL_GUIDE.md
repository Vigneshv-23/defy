# Q&A Model with API Key System

Complete guide for using the Q&A model with API keys.

## 🚀 Quick Start

### 1. Register a Q&A Model on Blockchain

```bash
./register_qa_model.sh
```

This will register a model with:
- IPFS CID: `QmQAModelBasicQuestions`
- Price: 0.001 ETH per minute
- Model ID: (will be returned after registration)

### 2. Register Model in MongoDB (via Frontend or API)

Go to `/upload` in the frontend and register the model with:
- Name: "Basic Q&A Model"
- Description: "Answers basic questions about AI, blockchain, and the platform"
- IPFS CID: `QmQAModelBasicQuestions`
- Price: 0.001 ETH per minute

Or use API:
```bash
curl -X POST http://localhost:5000/models \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "name": "Basic Q&A Model",
    "description": "Answers basic questions",
    "ipfsCid": "QmQAModelBasicQuestions",
    "pricePerMinute": "1000000000000000"
  }'
```

### 3. Generate API Key

**Via Frontend:**
1. Go to `/api-keys`
2. Select the Q&A model
3. Set duration (hours)
4. Click "Generate API Key"
5. Copy the API key

**Via API:**
```bash
curl -X POST http://localhost:5000/api-keys/generate \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "modelId": "0",
    "durationHours": 24
  }'
```

Response:
```json
{
  "apiKey": "abc123...",
  "expiresAt": "2024-01-02T12:00:00.000Z",
  "modelId": "0",
  "durationHours": 24
}
```

### 4. Use API Key to Ask Questions

```bash
curl -X POST https://nondisastrously-ungrazed-hang.ngrok-free.dev/qa/ask \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is AI?"}'
```

Response:
```json
{
  "question": "What is AI?",
  "answer": "AI (Artificial Intelligence) is the simulation of human intelligence by machines...",
  "modelId": "0",
  "modelName": "Basic Q&A Model",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## 📋 API Endpoints

### Generate API Key
**POST** `/api-keys/generate`

**Body:**
```json
{
  "wallet": "0x...",
  "modelId": "0",
  "durationHours": 24
}
```

**Response:**
```json
{
  "apiKey": "abc123...",
  "expiresAt": "2024-01-02T12:00:00.000Z",
  "modelId": "0",
  "durationHours": 24
}
```

---

### Get My API Keys
**GET** `/api-keys?wallet=0x...`

**Response:**
```json
[
  {
    "apiKey": "abc123...",
    "modelId": "0",
    "expiresAt": "2024-01-02T12:00:00.000Z",
    "isExpired": false,
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
]
```

---

### Validate API Key
**POST** `/api-keys/validate`

**Body:**
```json
{
  "apiKey": "abc123..."
}
```

**Response:**
```json
{
  "valid": true,
  "modelId": "0",
  "expiresAt": "2024-01-02T12:00:00.000Z"
}
```

---

### Ask Question
**POST** `/qa/ask`

**Headers:**
```
x-api-key: YOUR_API_KEY
```

**Body:**
```json
{
  "question": "What is blockchain?"
}
```

**Response:**
```json
{
  "question": "What is blockchain?",
  "answer": "Blockchain is a distributed ledger technology...",
  "modelId": "0",
  "modelName": "Basic Q&A Model",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

### Get Available Models
**GET** `/qa/models`

**Response:**
```json
[
  {
    "modelId": "0",
    "name": "Basic Q&A Model",
    "description": "Answers basic questions",
    "pricePerMinute": "1000000000000000"
  }
]
```

---

## 💡 Supported Questions

The Q&A model can answer:
- "Hello" / "Hi"
- "What is AI?"
- "What is blockchain?"
- "How does this work?"
- Other basic questions (default response)

---

## 🔐 API Key Security

- API keys are unique and randomly generated
- Keys expire after the specified duration
- Each key is tied to a specific model
- Keys are validated on every request

---

## 📱 Frontend Usage

1. **Generate API Key:**
   - Navigate to `/api-keys`
   - Select model
   - Set duration
   - Generate and copy key

2. **Use in Your Application:**
   ```javascript
   const response = await fetch('https://your-api-url.com/qa/ask', {
     method: 'POST',
     headers: {
       'x-api-key': 'YOUR_API_KEY',
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       question: 'What is AI?'
     })
   });
   
   const data = await response.json();
   console.log(data.answer);
   ```

---

## 🧪 Testing

```bash
# 1. Generate API key
API_KEY=$(curl -s -X POST http://localhost:5000/api-keys/generate \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "modelId": "0",
    "durationHours": 24
  }' | jq -r '.apiKey')

# 2. Ask a question
curl -X POST http://localhost:5000/qa/ask \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is AI?"}'
```

---

## 🎯 Next Steps

1. Register the Q&A model on blockchain
2. Register it in MongoDB
3. Generate API keys via frontend
4. Use the API key to ask questions
5. Integrate into your applications!
