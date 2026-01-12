import express from "express";
import { ethers } from "ethers";
import Rental from "../models/Rental.js";
import Model from "../models/Model.js";
import { provider, ADDRESSES } from "../config.js";
import inferenceManagerArtifact from "../contracts/InferenceManager.json" assert { type: "json" };
import modelRegistryArtifact from "../contracts/ModelRegistry.json" assert { type: "json" };

const router = express.Router();

// Simple Q&A responses (can be replaced with actual AI model)
const qaResponses = {
  "hello": "Hello! How can I help you today?",
  "hi": "Hi there! What would you like to know?",
  "what is ai": "AI (Artificial Intelligence) is the simulation of human intelligence by machines, enabling them to learn, reason, and make decisions.",
  "what is blockchain": "Blockchain is a distributed ledger technology that maintains a continuously growing list of records (blocks) that are linked and secured using cryptography.",
  "how does this work": "This platform allows you to use AI models on the blockchain. You pay per inference and get verifiable results.",
  "default": "I'm a simple Q&A model. I can answer basic questions. Try asking about AI, blockchain, or how this platform works!"
};

/**
 * POST /qa/ask
 * Ask a question using API key
 * Headers: x-api-key: <api-key>
 * Body: { question: "..." }
 */
router.post("/ask", async (req, res) => {
  try {
    // Get API key from header
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      return res.status(401).json({ error: "API key required. Include 'x-api-key' header." });
    }

    // Validate API key
    const rental = await Rental.findOne({ apiKey });

    if (!rental) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    if (new Date() > rental.expiresAt) {
      return res.status(401).json({ error: "API key expired" });
    }

    // Get question from body
    const { question } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: "Missing or invalid question" });
    }

    // Simple Q&A logic (can be replaced with actual AI model)
    const questionLower = question.toLowerCase().trim();
    
    // Find matching response
    let answer = qaResponses["default"];
    for (const [key, value] of Object.entries(qaResponses)) {
      if (questionLower.includes(key)) {
        answer = value;
        break;
      }
    }

    // Get model info
    const model = await Model.findOne({
      $or: [
        { blockchainModelId: rental.modelId },
        { _id: rental.modelId }
      ]
    });

    // HACKATHON: Process payment for EACH inference/chat message
    // This ensures funds are deducted and distributed every time user asks a question
    let inferenceRequestId = null;
    if (model) {
      try {
        console.log("💰 Processing payment for inference request...");
        
        // Determine which blockchain model ID to use
        let blockchainModelIdToUse = model.blockchainModelId;
        
        // If no blockchainModelId or model doesn't exist, try model 0
        if (!blockchainModelIdToUse || blockchainModelIdToUse !== "0") {
          try {
            const modelRegistry = new ethers.Contract(
              ADDRESSES.modelRegistry,
              modelRegistryArtifact.abi || modelRegistryArtifact,
              provider
            );
            
            if (blockchainModelIdToUse) {
              // Verify model exists
              const modelData = await modelRegistry.getModel(blockchainModelIdToUse);
              if (!modelData || !modelData.owner || modelData.owner === "0x0000000000000000000000000000000000000000") {
                blockchainModelIdToUse = null; // Reset to try model 0
              }
            }
            
            // If no valid model, try model 0
            if (!blockchainModelIdToUse) {
              const model0Data = await modelRegistry.getModel("0");
              if (model0Data && model0Data.owner && model0Data.owner !== "0x0000000000000000000000000000000000000000") {
                blockchainModelIdToUse = "0";
                console.log("  Using model 0 for payment");
              }
            }
          } catch (err) {
            console.log("  Could not verify model, trying model 0:", err.message);
            blockchainModelIdToUse = "0"; // Fallback to model 0
          }
        }
        
        if (blockchainModelIdToUse) {
          // Get model price from blockchain
          const modelRegistry = new ethers.Contract(
            ADDRESSES.modelRegistry,
            modelRegistryArtifact,
            provider
          );
          
          const pricePerMinute = await modelRegistry.getPricePerMinute(blockchainModelIdToUse);
          const durationInMinutes = BigInt(1); // 1 minute per inference
          const totalCost = pricePerMinute * durationInMinutes;
          
          console.log("  Model ID:", blockchainModelIdToUse);
          console.log("  Price per minute:", pricePerMinute.toString(), "wei");
          console.log("  Total cost:", totalCost.toString(), "wei");
          
          // HARDCODED FOR HACKATHON: Use customer account to pay
          const CUSTOMER_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
          const customerWallet = new ethers.Wallet(CUSTOMER_PRIVATE_KEY, provider);
          
          const inferenceManager = new ethers.Contract(
            ADDRESSES.inferenceManager,
            inferenceManagerArtifact.abi || inferenceManagerArtifact,
            customerWallet
          );
          
          // Call requestInference on blockchain (customer pays)
          console.log("  Calling requestInference...");
          const tx = await inferenceManager.requestInference(
            blockchainModelIdToUse,
            durationInMinutes.toString(),
            { value: totalCost.toString() }
          );
          const receipt = await tx.wait();
          
          // Extract requestId from event
          const event = receipt.logs.find(log => {
            try {
              const parsed = inferenceManager.interface.parseLog(log);
              return parsed && parsed.name === "InferenceRequested";
            } catch {
              return false;
            }
          });
          
          if (event) {
            const parsed = inferenceManager.interface.parseLog(event);
            inferenceRequestId = parsed.args.requestId.toString();
            console.log("  ✅ Payment received! Request ID:", inferenceRequestId);
          } else {
            // Fallback: get next request ID - 1
            const nextId = await inferenceManager.nextRequestId();
            inferenceRequestId = (nextId - 1n).toString();
            console.log("  ✅ Payment received! Request ID (fallback):", inferenceRequestId);
          }
          
          // Immediately submit result to distribute payment
          console.log("  Submitting result to distribute payment...");
          const DEV_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
          const devWallet = new ethers.Wallet(DEV_PRIVATE_KEY, provider);
          const inferenceManagerNode = new ethers.Contract(
            ADDRESSES.inferenceManager,
            inferenceManagerArtifact.abi || inferenceManagerArtifact,
            devWallet
          );
          
          const submitTx = await inferenceManagerNode.submitResult(inferenceRequestId);
          await submitTx.wait();
          console.log("  ✅ Payment distributed: 75% to dev account, 25% to commission");
        } else {
          console.log("  ⚠️  No valid blockchain model found, skipping payment");
        }
      } catch (err) {
        console.error("⚠️  Blockchain payment failed for inference:", err);
        console.error("  Error details:", err.message);
        // Continue with Q&A even if payment fails
      }
    }

    res.json({
      question,
      answer,
      modelId: rental.modelId,
      modelName: model?.name || "Q&A Model",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("❌ Error processing Q&A:", err);
    res.status(500).json({
      error: "Failed to process question",
      details: err.message
    });
  }
});

/**
 * GET /qa/models
 * Get available Q&A models
 */
router.get("/models", async (req, res) => {
  try {
    // Find models that are Q&A models (you can add a category or tag)
    const models = await Model.find({ active: true });

    res.json(models.map(model => ({
      modelId: model.blockchainModelId || model._id,
      name: model.name,
      description: model.description,
      pricePerMinute: model.pricePerMinute
    })));
  } catch (err) {
    console.error("❌ Error fetching models:", err);
    res.status(500).json({
      error: "Failed to fetch models",
      details: err.message
    });
  }
});

export default router;
