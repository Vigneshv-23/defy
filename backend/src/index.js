import express from "express";
import dotenv from "dotenv";

import { startListener } from "./listener.js";
import { connectDB } from "./db.js";

import usersRoute from "./routes/users.js";
import authRoute from "./routes/auth.js";
import modelsRoute from "./routes/models.js";
import ipfsRoute from "./routes/ipfs.js";
import inferenceRoute from "./routes/inference.js";
import nodesRoute from "./routes/nodes.js";
import apiKeysRoute from "./routes/apiKeys.js";
import qaRoute from "./routes/qa.js";
import userStatsRoute from "./routes/userStats.js";
import creatorRoute from "./routes/creator.js";

/* =========================
   ENV
========================= */
dotenv.config();

/* =========================
   APP
========================= */
const app = express();
const PORT = process.env.PORT || 5000; // Changed to 5000 to avoid conflict with React frontend

console.log("🔥 API server starting");

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - Allow all origins in development
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Log CORS requests for debugging
  if (req.method === "OPTIONS") {
    console.log("🔍 CORS Preflight:", {
      origin: origin,
      method: req.headers['access-control-request-method'],
      headers: req.headers['access-control-request-headers']
    });
  }
  
  // Allow requests from localhost (any port) in development
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  }
  
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key, ngrok-skip-browser-warning, Accept, Origin, X-Requested-With");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Max-Age", "86400"); // 24 hours
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    console.log("✅ CORS Preflight approved");
    return res.sendStatus(200);
  }
  
  next();
});

/* =========================
   ROUTES
========================= */
app.use("/users", usersRoute);
app.use("/api/auth", authRoute);
app.use("/models", modelsRoute);
app.use("/ipfs", ipfsRoute);
app.use("/inference", inferenceRoute);
app.use("/nodes", nodesRoute);
app.use("/api-keys", apiKeysRoute);
app.use("/qa", qaRoute);
app.use("/api/user", userStatsRoute);
app.use("/api/creator", creatorRoute);

// Health check
app.get("/", (_, res) => {
  res.send("Inference backend running");
});

/* =========================
   START SERVER
========================= */
await connectDB();

app.listen(PORT, () => {
  console.log(`🌐 Backend running on port ${PORT}`);
});

/* =========================
   BLOCKCHAIN LISTENER
========================= */
startListener();
