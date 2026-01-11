import express from "express";
import Model from "../models/Model.js";
import User from "../models/User.js";

const router = express.Router();

/**
 * POST /models
 * modelOwner only
 */
router.post("/", async (req, res) => {
  const { wallet, name, description, ipfsCid, pricePerMinute } = req.body;

  const user = await User.findOne({ wallet: wallet.toLowerCase() });
  if (!user || !user.roles.includes("modelOwner")) {
    return res.status(403).json({ error: "Not a model owner" });
  }

  const model = await Model.create({
    ownerWallet: wallet,
    name,
    description,
    ipfsCid,
    pricePerMinute
  });

  res.json(model);
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
