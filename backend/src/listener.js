import { ethers } from "ethers";
import inferenceManagerArtifact from "./contracts/InferenceManager.json" assert { type: "json" };

export async function startListener() {
  // 1️⃣ Provider
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

  // 2️⃣ Wallet MUST come from PRIVATE_KEY (approved node)
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("🧾 Backend node address:", await wallet.getAddress());

  // 3️⃣ Contract instance with WALLET (not provider signer)
  const inferenceManager = new ethers.Contract(
    process.env.INFERENCE_MANAGER,
    inferenceManagerArtifact.abi,
    wallet
  );

  console.log("🚀 Listening for inference requests...");

  // Clean old listeners (important on restart)
  inferenceManager.removeAllListeners("InferenceRequested");

  // 4️⃣ Listen for events
  inferenceManager.on(
    "InferenceRequested",
    async (requestId, user, modelId, minutes, expiresAt) => {
      try {
        console.log("📥 New inference request");
        console.log(" requestId:", requestId.toString());
        console.log(" user:", user);
        console.log(" modelId:", modelId.toString());
        console.log(" minutes:", minutes.toString());
        console.log(" expiresAt:", expiresAt.toString());

        console.log("🧠 Running inference...");
        await new Promise((r) => setTimeout(r, 2000));

        // 5️⃣ Submit result (ONLY approved node can do this)
        const tx = await inferenceManager.submitResult(requestId);
        await tx.wait();

        console.log("✅ Inference fulfilled:", requestId.toString());
      } catch (err) {
        console.error("❌ Inference failed:", err);
      }
    }
  );
}
