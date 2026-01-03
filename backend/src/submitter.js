import { ethers } from "ethers";
import { wallet, ADDRESSES } from "./config.js";
import { InferenceManagerABI } from "./contracts/InferenceManager.js";

const contract = new ethers.Contract(
  ADDRESSES.inferenceManager,
  InferenceManagerABI,
  wallet
);

export async function submitResult(requestId) {
  const tx = await contract.submitResult(requestId);
  await tx.wait();
}
