import mongoose from "mongoose";
import crypto from "crypto";

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    index: true,
    required: false
  },
  password: {
    type: String,
    select: false, // Don't return password by default
    required: false,
    set: function(password) {
      if (!password) return password;
      // Hash password when setting
      return crypto.createHash("sha256").update(password).digest("hex");
    }
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    required: false
  },
  wallet: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    index: true,
    required: false
  },
  roles: {
    type: [String],
    enum: ["customer", "modelOwner", "admin", "user"],
    default: ["user"]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Allow documents without required fields (for backward compatibility)
  strict: false
});

// Password is hashed automatically via setter above
// No need for pre-save hook

// Method to compare password
UserSchema.methods.comparePassword = function(candidatePassword) {
  if (!this.password || !candidatePassword) {
    return false;
  }
  const hash = crypto
    .createHash("sha256")
    .update(candidatePassword)
    .digest("hex");
  return this.password === hash;
};

export default mongoose.model("User", UserSchema);
