import express from "express";
import { ethers } from "ethers";
import nodeRegistryArtifact from "../contracts/NodeRegistry.json" assert { type: "json" };
import { provider, wallet, ADDRESSES } from "../config.js";

const router = express.Router();

/**
 * POST /nodes/add
 * Admin only - Add an approved node
 * Body: { nodeAddress: "0x..." }
 */
router.post("/add", async (req, res) => {
  try {
    const { nodeAddress } = req.body;

    if (!nodeAddress) {
      return res.status(400).json({ error: "Missing required field: nodeAddress" });
    }

    if (!ethers.isAddress(nodeAddress)) {
      return res.status(400).json({ error: "Invalid address format" });
    }

    // HARDCODED FOR HACKATHON: Use admin account (Account 2)
    const ADMIN_PRIVATE_KEY = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";
    const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);

    const nodeRegistry = new ethers.Contract(
      ADDRESSES.nodeRegistry,
      nodeRegistryArtifact,
      adminWallet
    );

    console.log("📝 Adding node to NodeRegistry...");
    console.log("  Node address:", nodeAddress);

    const tx = await nodeRegistry.addNode(nodeAddress);
    console.log("  Transaction hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("  ✅ Node added");

    res.json({
      success: true,
      nodeAddress,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber
    });
  } catch (err) {
    console.error("❌ Error adding node:", err);

    if (err.reason) {
      return res.status(400).json({ error: `Blockchain error: ${err.reason}` });
    }

    res.status(500).json({
      error: "Failed to add node",
      details: err.message
    });
  }
});

/**
 * POST /nodes/remove
 * Admin only - Remove an approved node
 * Body: { nodeAddress: "0x..." }
 */
router.post("/remove", async (req, res) => {
  try {
    const { nodeAddress } = req.body;

    if (!nodeAddress) {
      return res.status(400).json({ error: "Missing required field: nodeAddress" });
    }

    if (!ethers.isAddress(nodeAddress)) {
      return res.status(400).json({ error: "Invalid address format" });
    }

    // HARDCODED FOR HACKATHON: Use admin account (Account 2)
    const ADMIN_PRIVATE_KEY = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";
    const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);

    const nodeRegistry = new ethers.Contract(
      ADDRESSES.nodeRegistry,
      nodeRegistryArtifact,
      adminWallet
    );

    console.log("📝 Removing node from NodeRegistry...");
    console.log("  Node address:", nodeAddress);

    const tx = await nodeRegistry.removeNode(nodeAddress);
    console.log("  Transaction hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("  ✅ Node removed");

    res.json({
      success: true,
      nodeAddress,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber
    });
  } catch (err) {
    console.error("❌ Error removing node:", err);

    if (err.reason) {
      return res.status(400).json({ error: `Blockchain error: ${err.reason}` });
    }

    res.status(500).json({
      error: "Failed to remove node",
      details: err.message
    });
  }
});

/**
 * GET /nodes/check/:address
 * Check if a node is approved
 */
router.get("/check/:address", async (req, res) => {
  try {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: "Invalid address format" });
    }

    const nodeRegistry = new ethers.Contract(
      ADDRESSES.nodeRegistry,
      nodeRegistryArtifact,
      provider
    );

    const isApproved = await nodeRegistry.isApproved(address);

    res.json({
      nodeAddress: address,
      isApproved: isApproved
    });
  } catch (err) {
    console.error("❌ Error checking node:", err);
    res.status(500).json({
      error: "Failed to check node status",
      details: err.message
    });
  }
});

/**
 * GET /nodes/admin
 * Get the admin address of NodeRegistry
 */
router.get("/admin", async (req, res) => {
  try {
    const nodeRegistry = new ethers.Contract(
      ADDRESSES.nodeRegistry,
      nodeRegistryArtifact,
      provider
    );

    const admin = await nodeRegistry.admin();

    res.json({
      admin: admin
    });
  } catch (err) {
    console.error("❌ Error fetching admin:", err);
    res.status(500).json({
      error: "Failed to fetch admin address",
      details: err.message
    });
  }
});

export default router;
