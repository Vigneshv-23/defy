import express from "express";
import User from "../models/User.js";
import { isValidEthAddress } from "../utils/eth.js";

const router = express.Router();

/**
 * Register or update user roles
 */
router.post("/register", async (req, res) => {
  try {
    const { wallet, roles } = req.body;

    if (!wallet || !Array.isArray(roles)) {
      return res.status(400).json({ error: "wallet and roles required" });
    }

    if (!isValidEthAddress(wallet)) {
      return res.status(400).json({ error: "invalid wallet address" });
    }

    const validRoles = ["customer", "modelOwner"];
    const filteredRoles = roles.filter(r => validRoles.includes(r));

    if (filteredRoles.length === 0) {
      return res.status(400).json({ error: "invalid roles" });
    }

    const normalizedWallet = wallet.toLowerCase();

    let user = await User.findOne({ wallet: normalizedWallet });

    if (!user) {
      user = await User.create({
        wallet: normalizedWallet,
        roles: filteredRoles
      });
    } else {
      user.roles = [...new Set([...user.roles, ...filteredRoles])];
      await user.save();
    }

    res.json({
      wallet: user.wallet,
      roles: user.roles
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * Fetch user by wallet
 */
router.get("/:wallet", async (req, res) => {
  const wallet = req.params.wallet.toLowerCase();

  if (!isValidEthAddress(wallet)) {
    return res.status(400).json({ error: "invalid wallet address" });
  }

  const user = await User.findOne({ wallet });

  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }

  res.json({
    wallet: user.wallet,
    roles: user.roles
  });
});

export default router;
