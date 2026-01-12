import express from "express";
import multer from "multer";
import { uploadToIPFS } from "../utils/ipfs.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, "../uploads/temp"),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

/**
 * POST /ipfs/upload
 * Upload file to IPFS via Pinata
 */
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    console.log("📤 Uploading file to IPFS:", fileName);
    console.log("  Size:", req.file.size, "bytes");

    // Upload to IPFS
    const ipfsCid = await uploadToIPFS(filePath, fileName);

    // Clean up temporary file
    fs.unlinkSync(filePath);

    console.log("✅ File uploaded to IPFS");
    console.log("  CID:", ipfsCid);

    res.json({
      hash: ipfsCid,
      fileName,
      size: req.file.size
    });
  } catch (err) {
    console.error("❌ IPFS upload error:", err);

    // Clean up temp file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error("Failed to delete temp file:", unlinkErr);
      }
    }

    if (err.response?.data) {
      return res.status(500).json({
        error: "IPFS upload failed",
        details: err.response.data
      });
    }

    res.status(500).json({
      error: "Failed to upload file to IPFS",
      details: err.message
    });
  }
});

export default router;
