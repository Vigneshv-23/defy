import express from "express";
import dotenv from "dotenv";

import { startListener } from "./listener.js";
import { connectDB } from "./db.js";

import usersRoute from "./routes/users.js";
import modelsRoute from "./routes/models.js";

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

/* =========================
   ROUTES
========================= */
app.use("/users", usersRoute);
app.use("/models", modelsRoute);

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
