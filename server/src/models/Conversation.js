const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    relatedType: {
      type: String,
      enum: ["farm", "product", "tour", "general"],
      default: "general",
    },
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    lastMessageAt: { type: Date, default: Date.now },
    messages: [messageSchema],
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
