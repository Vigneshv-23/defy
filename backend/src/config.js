import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

export const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

export const wallet = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  provider
);

export const ADDRESSES = {
  inferenceManager: "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0",
  nodeRegistry: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
  modelRegistry: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512"
};
