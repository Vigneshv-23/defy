import { ethers } from "ethers";
import inferenceManagerArtifact from "./contracts/InferenceManager.json" assert { type: "json" };

export function startListener() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const abi = inferenceManagerArtifact.abi;

  const inferenceManager = new ethers.Contract(
    process.env.INFERENCE_MANAGER,
    abi,
    wallet
  );

  console.log("🚀 Listening for inference requests...");

  inferenceManager.removeAllListeners("InferenceRequested");

  inferenceManager.on(
    "InferenceRequested",
    async (requestId, user, modelId) => {
      try {
        console.log("📥 New request:", requestId.toString());

        console.log("🧠 Running inference...");
        await new Promise((r) => setTimeout(r, 2000));

        const tx = await inferenceManager.submitResult(requestId);
        await tx.wait();

        console.log("✅ Inference fulfilled:", requestId.toString());
      } catch (err) {
        console.error("❌ Inference failed:", err);
      }
    }
  );
}
