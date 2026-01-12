import mongoose from "mongoose";

const rentalSchema = new mongoose.Schema(
  {
    modelId: {
      type: String,
      required: true
    },
    customerWallet: {
      type: String,
      required: true,
      lowercase: true
    },
    apiKey: {
      type: String,
      required: true,
      unique: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    durationMinutes: {
      type: Number
    },
    requestId: {
      type: String,
      index: true
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Rental", rentalSchema);
