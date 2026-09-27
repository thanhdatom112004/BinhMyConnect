const mongoose = require("mongoose");

const TARGET_TYPES = ["product", "farm", "tour", "vehicle"];

const reviewSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: TARGET_TYPES, required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    verifiedPurchase: { type: Boolean, default: true },
  },
  { timestamps: true }
);

reviewSchema.index({ author: 1, targetType: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
module.exports.TARGET_TYPES = TARGET_TYPES;
