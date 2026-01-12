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
    async (requestId, user, modelId, durationMinutes, expiresAtTimestamp) => {
      try {
        console.log("📥 InferenceRequested event");
        console.log(" requestId:", requestId.toString());
        console.log(" user:", user);
        console.log(" modelId:", modelId.toString());
        console.log(" durationMinutes:", durationMinutes.toString());
        console.log(" expiresAt (timestamp):", expiresAtTimestamp.toString());

        // Extract durationMinutes from event (in seconds, convert to minutes)
        const durationInMinutes = Number(durationMinutes);
        const expiresAtTimestampSeconds = Number(expiresAtTimestamp);

        // Convert blockchain timestamp to JavaScript Date
        const expiresAt = new Date(expiresAtTimestampSeconds * 1000);

        const rental = await Rental.create({
          modelId: modelId.toString(),
          customerWallet: user.toLowerCase(),
          apiKey: generateApiKey(),
          expiresAt,
          durationMinutes: durationInMinutes
        });

        console.log("🔑 API key issued:", rental.apiKey);
        console.log("⏳ Duration:", durationInMinutes, "minutes");
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
