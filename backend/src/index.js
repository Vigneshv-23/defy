import express from "express";
import dotenv from "dotenv";
import { startListener } from "./listener.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.get("/", (_, res) => {
  res.send("Inference backend running");
});

app.listen(PORT, () => {
  console.log(`🌐 Backend running on port ${PORT}`);
});

startListener();
