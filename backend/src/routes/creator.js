import express from "express";
import User from "../models/User.js";
import Model from "../models/Model.js";

const router = express.Router();

/**
 * GET /api/creator/:email/models
 * Get models created by a user
 */
router.get("/:email/models", async (req, res) => {
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

    // Get user's wallet or use email as identifier
    const ownerWallet = user.wallet || user.email.toLowerCase();

    // Find models owned by this user
    const models = await Model.find({
      $or: [
        { ownerWallet: ownerWallet.toLowerCase() },
        { ownerWallet: user.email.toLowerCase() }
      ]
    }).sort({ createdAt: -1 });

    // Format models for response
    const formattedModels = models.map(model => ({
      modelId: model.blockchainModelId || model._id.toString(),
      _id: model._id.toString(),
      name: model.name,
      description: model.description,
      pricePerMinute: model.pricePerMinute,
      ipfsCid: model.ipfsCid,
      ownerWallet: model.ownerWallet,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    }));

    res.json(formattedModels);
  } catch (err) {
    console.error("❌ Error fetching creator models:", err);
    res.status(500).json({
      error: "Failed to fetch creator models",
      details: err.message
    });
  }
});

export default router;
