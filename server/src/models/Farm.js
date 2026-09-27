const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    maxGuests: { type: Number, required: true, min: 1 },
    durationMinutes: { type: Number, required: true, min: 15 },
    description: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const farmSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    coverImage: { type: String, default: "/img/hero-img-2.jpg" },
    hamlet: { type: String, required: true },
    address: { type: String, required: true },
    intro: { type: String, default: "" },
    openHours: { type: String, default: "07:00 - 17:00" },
    mapDirections: { type: String, default: "" },
    gallery: [String],
    tags: [String],
    onSiteServices: [String],
    isOpenForVisitors: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    packages: [packageSchema],
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

farmSchema.index({ name: "text", hamlet: "text", intro: "text", tags: "text" });

module.exports = mongoose.model("Farm", farmSchema);
