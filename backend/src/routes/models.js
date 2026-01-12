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

    // HARDCODED FOR HACKATHON: Always use dev account
    const DEV_ACCOUNT = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const DEV_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

    // Validate input (wallet is optional now, we use dev account)
    if (!name || !ipfsCid || !pricePerMinute) {
      return res.status(400).json({ error: "Missing required fields: name, ipfsCid, pricePerMinute" });
    }

    // Ensure dev account is registered as modelOwner
    let devUser = await User.findOne({ wallet: DEV_ACCOUNT.toLowerCase() });
    if (!devUser) {
      devUser = await User.create({
        wallet: DEV_ACCOUNT.toLowerCase(),
        roles: ["modelOwner", "admin"]
      });
      console.log("✅ Created dev account user:", DEV_ACCOUNT);
    } else if (!devUser.roles.includes("modelOwner")) {
      devUser.roles = [...new Set([...devUser.roles, "modelOwner"])];
      await devUser.save();
      console.log("✅ Added modelOwner role to dev account");
    }

    // Validate pricePerMinute is a number and positive
    const priceInWei = BigInt(pricePerMinute);
    if (priceInWei <= 0) {
      return res.status(400).json({ error: "pricePerMinute must be greater than 0" });
    }

    // HARDCODED: Always use dev account wallet for registration
    const devWallet = new ethers.Wallet(DEV_PRIVATE_KEY, provider);

    // Create ModelRegistry contract instance with dev wallet
    const modelRegistry = new ethers.Contract(
      ADDRESSES.modelRegistry,
      modelRegistryArtifact.abi || modelRegistryArtifact,
      devWallet
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
    let blockchainModelId;
    const modelRegisteredEvent = receipt.logs
      .map((log) => {
        try {
          return modelRegistry.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed) => parsed && parsed.name === "ModelRegistered");

    if (modelRegisteredEvent) {
      blockchainModelId = modelRegisteredEvent.args.modelId.toString();
    } else {
      // Fallback: Get the next model ID (the one just registered will be nextId - 1)
      const nextModelId = await modelRegistry.nextModelId();
      blockchainModelId = (nextModelId - 1n).toString();
      console.log("⚠️  Could not parse event, using nextModelId - 1:", blockchainModelId);
    }
    console.log("  Blockchain Model ID:", blockchainModelId);

    // Save to MongoDB with blockchain modelId
    // Use dev account as owner (models are registered by dev account on blockchain)
    const model = await Model.create({
      ownerWallet: DEV_ACCOUNT.toLowerCase(), // Always use dev account as owner
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

/**
 * PUT /models/:modelId/price
 * Model owner only - Update model price
 * Body: { newPricePerMinute: "1000000000000000", wallet: "0x..." }
 */
router.put("/:modelId/price", async (req, res) => {
  try {
    const { modelId } = req.params;
    const { newPricePerMinute, wallet: ownerWallet } = req.body;

    if (!newPricePerMinute || !ownerWallet) {
      return res.status(400).json({ error: "Missing required fields: newPricePerMinute, wallet" });
    }

    const priceInWei = BigInt(newPricePerMinute);
    if (priceInWei <= 0) {
      return res.status(400).json({ error: "newPricePerMinute must be greater than 0" });
    }

    const modelRegistry = new ethers.Contract(
      ADDRESSES.modelRegistry,
      modelRegistryArtifact,
      wallet
    );

    // Verify model owner
    const model = await modelRegistry.getModel(modelId);
    if (model.owner.toLowerCase() !== ownerWallet.toLowerCase()) {
      return res.status(403).json({ error: "Not the model owner" });
    }

    console.log("📝 Updating model price...");
    console.log("  Model ID:", modelId);
    console.log("  New price:", priceInWei.toString(), "wei");

    const tx = await modelRegistry.updatePrice(modelId, priceInWei.toString());
    console.log("  Transaction hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("  ✅ Price updated");

    // Update MongoDB if model exists
    const mongoModel = await Model.findOne({ blockchainModelId: modelId });
    if (mongoModel) {
      mongoModel.pricePerMinute = newPricePerMinute;
      await mongoModel.save();
    }

    res.json({
      success: true,
      modelId,
      newPricePerMinute: newPricePerMinute,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber
    });
  } catch (err) {
    console.error("❌ Error updating price:", err);

    if (err.reason) {
      return res.status(400).json({ error: `Blockchain error: ${err.reason}` });
    }

    res.status(500).json({
      error: "Failed to update price",
      details: err.message
    });
  }
});

/**
 * GET /models/blockchain/:modelId
 * Get model details from blockchain
 */
router.get("/blockchain/:modelId", async (req, res) => {
  try {
    const { modelId } = req.params;

    const modelRegistry = new ethers.Contract(
      ADDRESSES.modelRegistry,
      modelRegistryArtifact,
      provider
    );

    const model = await modelRegistry.getModel(modelId);
    const pricePerMinute = await modelRegistry.getPricePerMinute(modelId);

    res.json({
      modelId,
      owner: model.owner,
      ipfsCid: model.ipfsCid,
      pricePerMinute: pricePerMinute.toString()
    });
  } catch (err) {
    console.error("❌ Error fetching model from blockchain:", err);
    res.status(500).json({
      error: "Failed to fetch model from blockchain",
      details: err.message
    });
  }
});

/**
 * GET /models/blockchain/next-id
 * Get the next model ID that will be assigned
 */
router.get("/blockchain/next-id", async (req, res) => {
  try {
    const modelRegistry = new ethers.Contract(
      ADDRESSES.modelRegistry,
      modelRegistryArtifact,
      provider
    );

    const nextModelId = await modelRegistry.nextModelId();

    res.json({
      nextModelId: nextModelId.toString()
    });
  } catch (err) {
    console.error("❌ Error fetching next model ID:", err);
    res.status(500).json({
      error: "Failed to fetch next model ID",
      details: err.message
    });
  }
});

export default router;
