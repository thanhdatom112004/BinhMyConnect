const mongoose = require("mongoose");

const tourSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    durationType: { type: String, enum: ["nua_ngay", "mot_ngay"], required: true },
    startFrom: { type: String, enum: ["tphcm", "cu_chi"], required: true },
    description: { type: String, default: "" },
    coverImage: { type: String, default: "/img/hero-img-2.jpg" },
    price: { type: Number, required: true, min: 0 },
    seats: { type: Number, required: true, min: 1 },
    departureSchedule: { type: String, default: "" },
    destinations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Farm" }],
    isActive: { type: Boolean, default: true },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

tourSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Tour", tourSchema);
