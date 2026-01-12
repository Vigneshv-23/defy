import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

export const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

export const wallet = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  provider
);

export const ADDRESSES = {
  inferenceManager: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
  nodeRegistry: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  modelRegistry: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
};
