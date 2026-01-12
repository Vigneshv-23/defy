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

/**
 * POST /inference/submit
 * Approved node only - Submit inference result and distribute payment
 * Body: { requestId: "0", wallet: "0x..." }
 */
router.post("/submit", async (req, res) => {
  try {
    const { requestId, wallet: nodeWallet } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: "Missing required field: requestId" });
    }

    // HARDCODED FOR HACKATHON: Use dev account as node
    // Dev account is already approved as a node
    const DEV_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const nodeWalletInstance = new ethers.Wallet(DEV_PRIVATE_KEY, provider);

    const inferenceManager = new ethers.Contract(
      ADDRESSES.inferenceManager,
      inferenceManagerArtifact,
      nodeWalletInstance
    );

    console.log("📝 Submitting inference result...");
    console.log("  Request ID:", requestId);
    console.log("  Node wallet:", nodeWallet);

    const tx = await inferenceManager.submitResult(requestId);
    console.log("  Transaction hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("  ✅ Result submitted, payment distributed");

    res.json({
      success: true,
      requestId,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      message: "Payment distributed: 75% to model owner, 25% to commission account"
    });
  } catch (err) {
    console.error("❌ Error submitting result:", err);

    if (err.reason) {
      return res.status(400).json({ error: `Blockchain error: ${err.reason}` });
    }

    res.status(500).json({
      error: "Failed to submit result",
      details: err.message
    });
  }
});

/**
 * GET /inference/next-request-id
 * Get the next request ID that will be assigned
 */
router.get("/next-request-id", async (req, res) => {
  try {
    const inferenceManager = new ethers.Contract(
      ADDRESSES.inferenceManager,
      inferenceManagerArtifact,
      provider
    );

    const nextRequestId = await inferenceManager.nextRequestId();

    res.json({
      nextRequestId: nextRequestId.toString()
    });
  } catch (err) {
    console.error("❌ Error fetching next request ID:", err);
    res.status(500).json({
      error: "Failed to fetch next request ID",
      details: err.message
    });
  }
});

/**
 * GET /inference/commission-account
 * Get the commission account address
 */
router.get("/commission-account", async (req, res) => {
  try {
    const inferenceManager = new ethers.Contract(
      ADDRESSES.inferenceManager,
      inferenceManagerArtifact,
      provider
    );

    // Note: commissionAccount is a public variable, so we can read it
    const commissionAccount = await inferenceManager.commissionAccount();

    res.json({
      commissionAccount: commissionAccount
    });
  } catch (err) {
    console.error("❌ Error fetching commission account:", err);
    res.status(500).json({
      error: "Failed to fetch commission account",
      details: err.message
    });
  }
});

export default router;
