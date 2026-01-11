import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  wallet: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  roles: {
    type: [String],
    enum: ["customer", "modelOwner"],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("User", UserSchema);
