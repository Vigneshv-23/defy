import express from "express";
import { ethers } from "ethers";
import Model from "../models/Model.js";
import User from "../models/User.js";
import { provider, wallet, ADDRESSES } from "../config.js";
import modelRegistryArtifact from "../contracts/ModelRegistry.json" assert { type: "json" };

const router = express.Router();

/**
 * POST /models
 * modelOwner only
 * Registers model on both MongoDB and blockchain
 */
router.post("/", async (req, res) => {
  try {
    const { wallet: ownerWallet, name, description, ipfsCid, pricePerMinute } = req.body;

    // Validate input
    if (!ownerWallet || !name || !ipfsCid || !pricePerMinute) {
      return res.status(400).json({ error: "Missing required fields: wallet, name, ipfsCid, pricePerMinute" });
    }

    // Check if user is modelOwner
    const user = await User.findOne({ wallet: ownerWallet.toLowerCase() });
    if (!user || !user.roles.includes("modelOwner")) {
      return res.status(403).json({ error: "Not a model owner" });
    }

    // Validate pricePerMinute is a number and positive
    const priceInWei = BigInt(pricePerMinute);
    if (priceInWei <= 0) {
      return res.status(400).json({ error: "pricePerMinute must be greater than 0" });
    }

    // Create ModelRegistry contract instance
    const modelRegistry = new ethers.Contract(
      ADDRESSES.modelRegistry,
      modelRegistryArtifact,
      wallet
    );

    console.log("📝 Registering model on blockchain...");
    console.log("  IPFS CID:", ipfsCid);
    console.log("  Price per minute:", priceInWei.toString(), "wei");

    // Register model on blockchain
    const tx = await modelRegistry.registerModel(ipfsCid, priceInWei.toString());
    console.log("  Transaction hash:", tx.hash);

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log("  ✅ Model registered on blockchain");

    // Extract modelId from event
    const modelRegisteredEvent = receipt.logs
      .map((log) => {
        try {
          return modelRegistry.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed) => parsed && parsed.name === "ModelRegistered");

    if (!modelRegisteredEvent) {
      return res.status(500).json({ error: "Failed to get modelId from blockchain event" });
    }

    const blockchainModelId = modelRegisteredEvent.args.modelId.toString();
    console.log("  Blockchain Model ID:", blockchainModelId);

    // Save to MongoDB with blockchain modelId
    const model = await Model.create({
      ownerWallet: ownerWallet.toLowerCase(),
      name,
      description,
      ipfsCid,
      pricePerMinute: pricePerMinute,
      blockchainModelId: blockchainModelId // Store blockchain ID
    });

    console.log("  ✅ Model saved to MongoDB");

    res.json({
      ...model.toObject(),
      blockchainModelId,
      transactionHash: tx.hash
    });
  } catch (err) {
    console.error("❌ Error registering model:", err);
    
    // Provide helpful error messages
    if (err.reason) {
      return res.status(400).json({ error: `Blockchain error: ${err.reason}` });
    }
    
    if (err.code === "ACTION_REJECTED" || err.code === 4001) {
      return res.status(400).json({ error: "Transaction rejected by user" });
    }

    res.status(500).json({ 
      error: "Failed to register model",
      details: err.message 
    });
  }
});

/**
 * GET /models
 * public
 */
router.get("/", async (_, res) => {
  const models = await Model.find({ active: true });
  res.json(models);
});

export default router;
