import { ethers } from "ethers";
import inferenceManagerArtifact from "./contracts/InferenceManager.json" assert { type: "json" };

import Rental from "./models/Rental.js";
import { generateApiKey } from "./utils/apiKey.js";

export async function startListener() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("🧾 Backend node address:", await wallet.getAddress());

  const inferenceManager = new ethers.Contract(
    process.env.INFERENCE_MANAGER,
    inferenceManagerArtifact.abi,
    wallet
  );

  console.log("🚀 Listening for contract events...");

  // Clean listeners on restart
  inferenceManager.removeAllListeners();

  inferenceManager.on(
    "InferenceRequested",
    async (requestId, user, modelId) => {
      try {
        console.log("📥 InferenceRequested event");
        console.log(" requestId:", requestId.toString());
        console.log(" user:", user);
        console.log(" modelId:", modelId.toString());

        /* =========================
           TEMP RENTAL LOGIC (MVP)
           Since ABI doesn't include minutes yet
        ========================= */
        const DEFAULT_MINUTES = 10;

        const expiresAt = new Date(
          Date.now() + DEFAULT_MINUTES * 60 * 1000
        );

        const rental = await Rental.create({
          modelId: modelId.toString(),
          customerWallet: user.toLowerCase(),
          apiKey: generateApiKey(),
          expiresAt
        });

        console.log("🔑 API key issued:", rental.apiKey);
        console.log("⏳ Expires at:", expiresAt.toISOString());

        /* =========================
           Simulate inference
        ========================= */
        console.log("🧠 Running inference...");
        await new Promise((r) => setTimeout(r, 2000));

        const tx = await inferenceManager.submitResult(requestId);
        await tx.wait();

        console.log("✅ Inference fulfilled:", requestId.toString());
      } catch (err) {
        console.error("❌ Listener error:", err);
      }
    }
  );
}
