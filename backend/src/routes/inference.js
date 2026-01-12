import express from "express";
import { ethers } from "ethers";
import inferenceManagerArtifact from "../contracts/InferenceManager.json" assert { type: "json" };
import modelRegistryArtifact from "../contracts/ModelRegistry.json" assert { type: "json" };
import { provider, wallet, ADDRESSES } from "../config.js";
import Model from "../models/Model.js";

const router = express.Router();

/**
 * POST /inference/request
 * Request inference by calling InferenceManager.requestInference()
 * Returns transaction parameters or executes transaction
 */
router.post("/request", async (req, res) => {
  try {
    const { modelId, wallet: customerWallet, durationMinutes } = req.body;

    // Validate input
    if (!modelId || !customerWallet || !durationMinutes) {
      return res.status(400).json({
        error: "Missing required fields: modelId, wallet, durationMinutes"
      });
    }

    const durationInMinutes = BigInt(durationMinutes);
    if (durationInMinutes <= 0) {
      return res.status(400).json({ error: "durationMinutes must be greater than 0" });
    }

    // Get model price from blockchain
    const modelRegistry = new ethers.Contract(
      ADDRESSES.modelRegistry,
      modelRegistryArtifact,
      provider
    );

    console.log("📊 Fetching model price from blockchain...");
    console.log("  Model ID:", modelId);

    let pricePerMinute;
    try {
      pricePerMinute = await modelRegistry.getPricePerMinute(modelId);
      console.log("  Price per minute:", pricePerMinute.toString(), "wei");
    } catch (err) {
      return res.status(404).json({ error: "Model not found on blockchain" });
    }

    // Calculate total cost
    const totalCost = pricePerMinute * durationInMinutes;
    console.log("  Duration:", durationInMinutes.toString(), "minutes");
    console.log("  Total cost:", totalCost.toString(), "wei");

    // Create InferenceManager contract instance
    const inferenceManager = new ethers.Contract(
      ADDRESSES.inferenceManager,
      inferenceManagerArtifact,
      wallet
    );

    // For now, we'll return transaction parameters
    // In production, you might want to:
    // 1. Return unsigned transaction for user to sign (more decentralized)
    // 2. Use user's wallet private key if they provide it (simpler but less secure)

    // Option 1: Return transaction parameters (for frontend to sign)
    const tx = await inferenceManager.requestInference.populateTransaction(
      modelId,
      durationInMinutes.toString(),
      { value: totalCost.toString() }
    );

    res.json({
      transaction: {
        to: tx.to,
        data: tx.data,
        value: tx.value.toString(),
        gasLimit: tx.gasLimit?.toString(),
        gasPrice: tx.gasPrice?.toString(),
        nonce: tx.nonce
      },
      modelId: modelId.toString(),
      durationMinutes: durationInMinutes.toString(),
      pricePerMinute: pricePerMinute.toString(),
      totalCost: totalCost.toString()
    });

    // Alternative: Execute transaction directly (requires customer's private key)
    // This is less secure but simpler for MVP
    /*
    const customerWalletInstance = new ethers.Wallet(customerPrivateKey, provider);
    const inferenceManagerWithCustomer = inferenceManager.connect(customerWalletInstance);
    
    const tx = await inferenceManagerWithCustomer.requestInference(
      modelId,
      durationInMinutes.toString(),
      { value: totalCost.toString() }
    );
    
    const receipt = await tx.wait();
    
    // Extract requestId from event
    const requestId = receipt.logs[0].topics[1]; // Simplified - should parse event properly
    
    res.json({
      requestId,
      transactionHash: tx.hash
    });
    */
  } catch (err) {
    console.error("❌ Inference request error:", err);

    if (err.reason) {
      return res.status(400).json({ error: `Blockchain error: ${err.reason}` });
    }

    res.status(500).json({
      error: "Failed to create inference request",
      details: err.message
    });
  }
});

/**
 * GET /inference/status/:requestId
 * Check inference request status
 */
router.get("/status/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;

    const inferenceManager = new ethers.Contract(
      ADDRESSES.inferenceManager,
      inferenceManagerArtifact,
      provider
    );

    const request = await inferenceManager.requests(requestId);

    res.json({
      requestId,
      user: request.user,
      modelId: request.modelId.toString(),
      paidAmount: request.paidAmount.toString(),
      expiresAt: new Date(Number(request.expiresAt) * 1000).toISOString(),
      fulfilled: request.fulfilled
    });
  } catch (err) {
    console.error("❌ Error fetching request status:", err);
    res.status(500).json({
      error: "Failed to fetch request status",
      details: err.message
    });
  }
});

export default router;
