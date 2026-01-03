import { ethers } from "ethers";
import inferenceManagerArtifact from "./contracts/InferenceManager.json" assert { type: "json" };

export async function startListener() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = await provider.getSigner(0);


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
  async (requestId, user, modelId, minutes, expiresAt) => {
    console.log("📥 New inference request");
    console.log(" requestId:", requestId.toString());
    console.log(" user:", user);
    console.log(" modelId:", modelId.toString());
    console.log(" minutes:", minutes.toString());
    console.log(" expiresAt:", expiresAt.toString());

    console.log("🧠 Running inference...");
    await new Promise((r) => setTimeout(r, 2000));

    const tx = await inferenceManager.submitResult(requestId);
    await tx.wait();

    console.log("✅ Inference fulfilled:", requestId.toString());
  }
);
}
