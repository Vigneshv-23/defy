import express from "express";
import { ethers } from "ethers";
import { generateApiKey } from "../utils/apiKey.js";
import Rental from "../models/Rental.js";
import User from "../models/User.js";
import Model from "../models/Model.js";
import { provider, ADDRESSES } from "../config.js";
import inferenceManagerArtifact from "../contracts/InferenceManager.json" assert { type: "json" };
import modelRegistryArtifact from "../contracts/ModelRegistry.json" assert { type: "json" };

const router = express.Router();

/**
 * POST /api-keys/generate
 * Generate an API key for a user and model
 * Body: { wallet, modelId, durationHours }
 */
router.post("/generate", async (req, res) => {
  try {
    const { wallet, modelId, durationHours = 24, email } = req.body;

    console.log("🔑 API Key Generation Request:", { 
      hasWallet: !!wallet, 
      hasEmail: !!email, 
      hasModelId: modelId !== undefined && modelId !== null && modelId !== '',
      modelId,
      body: req.body
    });

    // Support both wallet and email-based users
    let user;
    if (wallet) {
      user = await User.findOne({ wallet: wallet.toLowerCase() });
      console.log("  Found user by wallet:", !!user);
    } else if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
      console.log("  Found user by email:", !!user);
    }

    if (!wallet && !email) {
      console.error("❌ Missing wallet or email");
      return res.status(400).json({ error: "Missing required fields: wallet or email, modelId" });
    }

    if (modelId === undefined || modelId === null || modelId === '') {
      console.error("❌ Missing modelId");
      return res.status(400).json({ error: "Missing required field: modelId" });
    }

    // If user doesn't exist and we have email, create user automatically
    if (!user && email) {
      user = await User.create({
        email: email.toLowerCase(),
        roles: ["customer"]
      });
    }

    // If still no user, return error
    if (!user) {
      return res.status(404).json({ error: "User not found. Please register first." });
    }
    
    // Use wallet from user or provided wallet, or email as fallback
    const userWallet = user.wallet || wallet || user.email;

    // Verify model exists - support both blockchainModelId and MongoDB _id
    let model = await Model.findOne({ 
      $or: [
        { blockchainModelId: modelId.toString() },
        { _id: modelId }
      ]
    });
    
    // If not found, try with ObjectId conversion
    if (!model && modelId.length === 24) {
      try {
        const mongoose = (await import("mongoose")).default;
        const ObjectId = mongoose.Types.ObjectId;
        if (ObjectId.isValid(modelId)) {
          model = await Model.findById(modelId);
        }
      } catch (e) {
        // Ignore ObjectId conversion errors
      }
    }
    
    if (!model) {
      return res.status(404).json({ error: "Model not found" });
    }
    
    // Use blockchainModelId if available, otherwise use MongoDB _id
    const finalModelId = model.blockchainModelId || model._id.toString();

    // HACKATHON: Process payment on blockchain if model has blockchainModelId
    // If not, try to find model on blockchain by checking all registered models
    let requestId = null;
    let blockchainModelIdToUse = model.blockchainModelId;
    
    // If no blockchainModelId, try to find it on blockchain
    if (!blockchainModelIdToUse) {
      try {
        const modelRegistry = new ethers.Contract(
          ADDRESSES.modelRegistry,
          modelRegistryArtifact.abi || modelRegistryArtifact,
          provider
        );
        const nextModelId = await modelRegistry.nextModelId();
        console.log("  Checking blockchain for model matching MongoDB _id:", model._id);
        // Try to find model by checking if any blockchain model matches
        // For hackathon, we'll use model 0 if it exists
        if (nextModelId > 0n) {
          blockchainModelIdToUse = "0"; // Use first model for hackathon
          console.log("  Using blockchain model 0 for payment");
        }
      } catch (err) {
        console.log("  Could not check blockchain models:", err.message);
        // If contract doesn't exist, try using model 0 anyway
        blockchainModelIdToUse = "0";
        console.log("  Fallback: Using blockchain model 0 for payment");
      }
    }
    
    // Also handle case where blockchainModelId exists but model doesn't on chain
    // Try to validate the model exists before processing payment
    if (blockchainModelIdToUse) {
      try {
        const modelRegistry = new ethers.Contract(
          ADDRESSES.modelRegistry,
          modelRegistryArtifact.abi || modelRegistryArtifact,
          provider
        );
        // Try to get the model to verify it exists
        await modelRegistry.getModel(blockchainModelIdToUse);
        console.log("  ✅ Verified model", blockchainModelIdToUse, "exists on blockchain");
      } catch (err) {
        console.error("  ⚠️  Model", blockchainModelIdToUse, "does not exist on blockchain:", err.message);
        // Try model 0 as fallback
        if (blockchainModelIdToUse !== "0") {
          try {
            await modelRegistry.getModel("0");
            blockchainModelIdToUse = "0";
            console.log("  Using model 0 as fallback");
          } catch (e) {
            console.error("  ❌ Model 0 also doesn't exist. Contracts may need redeployment.");
            blockchainModelIdToUse = null; // Don't process payment
          }
        } else {
          blockchainModelIdToUse = null; // Don't process payment
        }
      }
    }
    
    if (blockchainModelIdToUse) {
      try {
        console.log("💰 Processing blockchain payment for API key...");
        
        // Get model price from blockchain
        const modelRegistry = new ethers.Contract(
          ADDRESSES.modelRegistry,
          modelRegistryArtifact.abi || modelRegistryArtifact,
          provider
        );
        
        const pricePerMinute = await modelRegistry.getPricePerMinute(blockchainModelIdToUse);
        const durationInMinutes = BigInt(parseInt(durationHours) * 60);
        const totalCost = pricePerMinute * durationInMinutes;
        
        // Calculate payment breakdown
        const pricePerMinuteETH = Number(pricePerMinute) / 1e18;
        const totalCostETH = Number(totalCost) / 1e18;
        const devAmountETH = totalCostETH * 0.75;
        const platformAmountETH = totalCostETH * 0.25;
        
        console.log("  Using blockchain model ID:", blockchainModelIdToUse);
        console.log("  Price per minute:", pricePerMinute.toString(), "wei", `(${pricePerMinuteETH.toFixed(6)} ETH)`);
        console.log("  Duration requested:", durationHours, "hours", `(${durationInMinutes.toString()} minutes)`);
        console.log("  Total cost:", totalCost.toString(), "wei", `(${totalCostETH.toFixed(6)} ETH)`);
        console.log("  Payment distribution:");
        console.log("    - Dev account (75%):", devAmountETH.toFixed(6), "ETH");
        console.log("    - Platform account (25%):", platformAmountETH.toFixed(6), "ETH");
        
        // HARDCODED FOR HACKATHON: Use customer account to pay
        // In production, frontend should sign this transaction
        const CUSTOMER_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
        const customerWallet = new ethers.Wallet(CUSTOMER_PRIVATE_KEY, provider);
        
        const inferenceManager = new ethers.Contract(
          ADDRESSES.inferenceManager,
          inferenceManagerArtifact.abi || inferenceManagerArtifact,
          customerWallet
        );
        
        // Call requestInference on blockchain (customer pays)
        console.log("  Calling requestInference on blockchain...");
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
          requestId = parsed.args.requestId.toString();
          console.log("  ✅ Payment received! Request ID:", requestId);
        } else {
          // Fallback: get next request ID - 1
          const nextId = await inferenceManager.nextRequestId();
          requestId = (nextId - 1n).toString();
          console.log("  ✅ Payment received! Request ID (fallback):", requestId);
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
        
        const submitTx = await inferenceManagerNode.submitResult(requestId);
        await submitTx.wait();
        console.log("  ✅ Payment distributed: 75% to dev account, 25% to commission");
        
      } catch (err) {
        console.error("⚠️  Blockchain payment failed:", err);
        console.error("  Error details:", err.message);
        console.error("  Stack:", err.stack);
        // Continue without blockchain payment for hackathon, but log the error
        requestId = null;
      }
    }

    // Generate API key
    const apiKey = generateApiKey();

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + parseInt(durationHours));

    // Create rental record
    const rental = await Rental.create({
      modelId: finalModelId, // Use blockchainModelId if available, else _id
      customerWallet: userWallet.toLowerCase(),
      apiKey,
      expiresAt,
      durationMinutes: parseInt(durationHours) * 60,
      requestId: requestId // Store blockchain request ID
    });

    // Calculate payment details for response
    let paymentDetails = null;
    if (requestId && model) {
      try {
        const modelRegistry = new ethers.Contract(
          ADDRESSES.modelRegistry,
          modelRegistryArtifact.abi || modelRegistryArtifact,
          provider
        );
        const blockchainModelIdToUse = model.blockchainModelId || "0";
        const pricePerMinute = await modelRegistry.getPricePerMinute(blockchainModelIdToUse);
        const durationInMinutes = BigInt(parseInt(durationHours) * 60);
        const totalCost = pricePerMinute * durationInMinutes;
        const totalCostETH = Number(totalCost) / 1e18;
        
        paymentDetails = {
          totalCost: totalCostETH.toFixed(6) + " ETH",
          durationHours: parseInt(durationHours),
          durationMinutes: parseInt(durationHours) * 60,
          pricePerMinute: (Number(pricePerMinute) / 1e18).toFixed(6) + " ETH",
          distribution: {
            devAccount: (totalCostETH * 0.75).toFixed(6) + " ETH (75%)",
            platformAccount: (totalCostETH * 0.25).toFixed(6) + " ETH (25%)"
          }
        };
      } catch (err) {
        console.log("  Could not calculate payment details for response:", err.message);
      }
    }

    res.json({
      apiKey,
      expiresAt: rental.expiresAt,
      modelId: finalModelId,
      durationHours: parseInt(durationHours),
      requestId: requestId,
      paymentProcessed: !!requestId,
      paymentDetails: paymentDetails
    });
  } catch (err) {
    console.error("❌ Error generating API key:", err);
    res.status(500).json({
      error: "Failed to generate API key",
      details: err.message
    });
  }
});

/**
 * GET /api-keys
 * Get all API keys for a user
 * Query: ?wallet=0x...
 */
router.get("/", async (req, res) => {
  try {
    const { wallet } = req.query;

    if (!wallet) {
      return res.status(400).json({ error: "Missing wallet parameter" });
    }

    const rentals = await Rental.find({
      customerWallet: wallet.toLowerCase()
    }).sort({ createdAt: -1 });

    const apiKeys = rentals.map(rental => ({
      apiKey: rental.apiKey,
      modelId: rental.modelId,
      expiresAt: rental.expiresAt,
      isExpired: new Date() > rental.expiresAt,
      createdAt: rental.createdAt
    }));

    res.json(apiKeys);
  } catch (err) {
    console.error("❌ Error fetching API keys:", err);
    res.status(500).json({
      error: "Failed to fetch API keys",
      details: err.message
    });
  }
});

/**
 * POST /api-keys/validate
 * Validate an API key
 * Body: { apiKey }
 */
router.post("/validate", async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: "Missing apiKey" });
    }

    const rental = await Rental.findOne({ apiKey });

    if (!rental) {
      return res.json({ valid: false, reason: "API key not found" });
    }

    if (new Date() > rental.expiresAt) {
      return res.json({ valid: false, reason: "API key expired" });
    }

    res.json({
      valid: true,
      modelId: rental.modelId,
      expiresAt: rental.expiresAt
    });
  } catch (err) {
    console.error("❌ Error validating API key:", err);
    res.status(500).json({
      error: "Failed to validate API key",
      details: err.message
    });
  }
});

export default router;
