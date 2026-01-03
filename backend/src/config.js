import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

export const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

export const wallet = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  provider
);

export const ADDRESSES = {
  inferenceManager: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
};
