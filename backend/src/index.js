import express from "express";
import dotenv from "dotenv";

import { startListener } from "./listener.js";
import { connectDB } from "./db.js";

import usersRoute from "./routes/users.js";
import modelsRoute from "./routes/models.js";
import ipfsRoute from "./routes/ipfs.js";
import inferenceRoute from "./routes/inference.js";

/* =========================
   ENV
========================= */
dotenv.config();

/* =========================
   APP
========================= */
const app = express();
const PORT = process.env.PORT || 3000;

console.log("🔥 API server starting");

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

/* =========================
   ROUTES
========================= */
app.use("/users", usersRoute);
app.use("/models", modelsRoute);
app.use("/ipfs", ipfsRoute);
app.use("/inference", inferenceRoute);

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
