from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
import ipfshttpclient
import json
import os
from datetime import datetime
from pydantic import BaseModel
import logging

app = FastAPI(title="InferChain AI Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class InferenceRequest(BaseModel):
    inferenceId: int
    modelId: int
    ipfsHash: str
    inputData: str

class ChatRequest(BaseModel):
    ipfsHash: str
    message: str
    chatHistory: list

# Load models cache
models_cache = {}

@app.on_event("startup")
async def startup_event():
    """Initialize IPFS client"""
    global ipfs_client
    try:
        ipfs_client = ipfshttpclient.connect('/dns/ipfs.infura.io/tcp/5001/https')
        print("Connected to IPFS")
    except:
        print("Could not connect to IPFS")

def load_model_from_ipfs(ipfs_hash: str):
    """Load model from IPFS"""
    if ipfs_hash in models_cache:
        return models_cache[ipfs_hash]
    
    try:
        # Get model files from IPFS
        model_files = ipfs_client.get(ipfs_hash)
        
        # Load model configuration
        with open(f'{ipfs_hash}/model_config.json', 'r') as f:
            config = json.load(f)
        
        model_type = config.get('model_type', 'transformers')
        
        if model_type == 'transformers':
            # Load HuggingFace model
            model = AutoModelForCausalLM.from_pretrained(f'{ipfs_hash}/model')
            tokenizer = AutoTokenizer.from_pretrained(f'{ipfs_hash}/model')
            
            models_cache[ipfs_hash] = {
                'model': model,
                'tokenizer': tokenizer,
                'pipeline': pipeline(
                    'text-generation',
                    model=model,
                    tokenizer=tokenizer,
                    device=0 if torch.cuda.is_available() else -1
                )
            }
        
        return models_cache[ipfs_hash]
    
    except Exception as e:
        print(f"Error loading model: {e}")
        return None

@app.post("/inference")
async def run_inference(request: InferenceRequest):
    """Execute AI inference"""
    try:
        # Load model
        model_data = load_model_from_ipfs(request.ipfs_hash)
        if not model_data:
            raise HTTPException(status_code=404, detail="Model not found")
        
        # Run inference
        if 'pipeline' in model_data:
            result = model_data['pipeline'](
                request.inputData,
                max_length=200,
                num_return_sequences=1,
                temperature=0.7
            )
            output = result[0]['generated_text']
        else:
            # Custom model inference
            output = "Inference completed"
        
        # Generate verification proof
        verification_hash = generate_verification_hash(
            request.inferenceId,
            request.inputData,
            output
        )
        
        return {
            "success": True,
            "inferenceId": request.inferenceId,
            "output": output,
            "verificationHash": verification_hash,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_completion(request: ChatRequest):
    """Handle chat completion"""
    try:
        model_data = load_model_from_ipfs(request.ipfs_hash)
        if not model_data:
            raise HTTPException(status_code=404, detail="Model not found")
        
        # Prepare conversation context
        context = "\n".join([
            f"{'User' if msg['sender'] == 'user' else 'AI'}: {msg['content']}"
            for msg in request.chatHistory[-5:]  # Last 5 messages as context
        ])
        
        prompt = f"{context}\nUser: {request.message}\nAI:"
        
        # Generate response
        if 'pipeline' in model_data:
            result = model_data['pipeline'](
                prompt,
                max_length=300,
                num_return_sequences=1,
                temperature=0.8,
                do_sample=True
            )
            response = result[0]['generated_text'].replace(prompt, "").strip()
        else:
            response = "I received your message."
        
        return {
            "success": True,
            "response": response,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_verification_hash(inference_id: int, input_data: str, output_data: str) -> str:
    """Generate verification hash for inference"""
    import hashlib
    data = f"{inference_id}:{input_data}:{output_data}"
    return hashlib.sha256(data.encode()).hexdigest()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)