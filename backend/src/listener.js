import { ethers } from "ethers";
import { provider, wallet, ADDRESSES } from "./config.js";
import { InferenceManagerABI } from "./contracts/InferenceManager.js";
import { runInference } from "./worker.js";
import { submitResult } from "./submitter.js";

const contract = new ethers.Contract(
  ADDRESSES.inferenceManager,
  InferenceManagerABI,
  wallet
);

export function startListener() {
  console.log("🚀 Listening for inference requests...");

  contract.on("InferenceRequested", async (requestId, user, modelId) => {
    console.log("📥 New request:", requestId.toString());

    // 1️⃣ Run inference (mock for now)
    const result = await runInference(modelId);

    // 2️⃣ Submit result on-chain
    await submitResult(requestId);

    console.log("✅ Request fulfilled:", requestId.toString());
  });
}
