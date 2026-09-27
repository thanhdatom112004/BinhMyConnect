const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    vehicleType: {
      type: String,
      enum: ["xe_4_cho", "xe_7_cho", "dua_don_nhom"],
      required: true,
    },
    description: { type: String, default: "" },
    image: { type: String, default: "/img/featur-1.jpg" },
    price: { type: Number, required: true, min: 0 },
    priceUnit: { type: String, default: "chuyến" },
    isActive: { type: Boolean, default: true },
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
