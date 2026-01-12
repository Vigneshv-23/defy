import express from "express";
import User from "../models/User.js";
import Rental from "../models/Rental.js";
import Model from "../models/Model.js";
import { provider, ADDRESSES } from "../config.js";
import inferenceManagerArtifact from "../contracts/InferenceManager.json" assert { type: "json" };
import { ethers } from "ethers";

const router = express.Router();

/**
 * GET /api/user/:email
 * Get user statistics for dashboard
 */
router.get("/:email", async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user's wallet (could be from user.wallet or use email as identifier)
    const userWallet = user.wallet || user.email.toLowerCase();

    // Get all rentals for this user
    const rentals = await Rental.find({
      customerWallet: userWallet.toLowerCase()
    });

    // Calculate statistics
    let totalSpent = 0;
    let totalInferences = 0;
    const modelIds = new Set();
    let totalSpentWei = 0n;

    // Calculate from blockchain if possible
    try {
      const inferenceManager = new ethers.Contract(
        ADDRESSES.inferenceManager,
        inferenceManagerArtifact.abi || inferenceManagerArtifact,
        provider
      );

      // Get all request IDs from rentals
      const requestIds = rentals
        .filter(r => r.requestId)
        .map(r => r.requestId);

      // Calculate total spent from blockchain
      for (const requestId of requestIds) {
        try {
          const request = await inferenceManager.requests(requestId);
          if (request && request.paidAmount) {
            totalSpentWei += BigInt(request.paidAmount.toString());
          }
        } catch (err) {
          console.log(`Could not fetch request ${requestId}:`, err.message);
        }
      }

      // Convert to ETH
      totalSpent = Number(totalSpentWei) / 1e18;
      
      // Count inferences (each rental with requestId is an inference)
      totalInferences = requestIds.length;
    } catch (err) {
      console.error("Error fetching blockchain stats:", err.message);
      // Fallback: estimate from rentals
      totalInferences = rentals.length;
      // Estimate: assume 0.01 ETH per inference (current price)
      totalSpent = rentals.length * 0.01;
    }

    // Get unique model IDs
    rentals.forEach(rental => {
      if (rental.modelId) {
        modelIds.add(rental.modelId.toString());
      }
    });

    // Get API keys count
    const apiKeysCount = rentals.length;

    // Get user's models if they're a creator
    let userModels = [];
    if (user.roles && (user.roles.includes('creator') || user.roles.includes('modelOwner') || user.roles.includes('admin'))) {
      const ownerWallet = user.wallet || user.email.toLowerCase();
      userModels = await Model.find({
        $or: [
          { ownerWallet: ownerWallet.toLowerCase() },
          { ownerWallet: user.email.toLowerCase() }
        ]
      }).limit(10);
    }

    res.json({
      user: {
        email: user.email,
        username: user.username,
        wallet: user.wallet,
        roles: user.roles || []
      },
      stats: {
        totalSpent: totalSpent,
        totalInferences: totalInferences,
        modelIds: Array.from(modelIds),
        apiKeysCount: apiKeysCount
      },
      models: userModels,
      inferences: rentals.slice(0, 10) // Recent rentals
    });
  } catch (err) {
    console.error("❌ Error fetching user stats:", err);
    res.status(500).json({
      error: "Failed to fetch user statistics",
      details: err.message
    });
  }
});

export default router;
