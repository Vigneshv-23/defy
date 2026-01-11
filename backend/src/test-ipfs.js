import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { uploadToIPFS } from "./utils/ipfs.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, "uploads", "model.json");

const cid = await uploadToIPFS(filePath, "model.json");
console.log("✅ Uploaded to IPFS, CID:", cid);
