import mongoose from "mongoose";

const modelSchema = new mongoose.Schema(
  {
    ownerWallet: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    description: String,
    ipfsCid: {
      type: String,
      required: true
    },
    pricePerMinute: {
      type: Number,
      required: true
    },
    active: {
      type: Boolean,
      default: true
    },
    blockchainModelId: {
      type: String,
      index: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Model", modelSchema);
