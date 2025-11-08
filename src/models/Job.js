import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  command: { type: String, required: true },
  state: {
    type: String,
    enum: ["pending", "processing", "completed", "failed", "dead"],
    default: "pending",
  },
  attempts: { type: Number, default: 0 },
  max_retries: { type: Number, default: 3 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.model("Job", jobSchema);