import express from "express";
import { startListener } from "./listener.js";

const app = express();
app.use(express.json());

app.get("/", (_, res) => {
  res.send("InferChain backend running");
});

app.listen(3000, () => {
  console.log("🌐 Backend running on port 3000");
  startListener();
});
