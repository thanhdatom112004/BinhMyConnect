const mongoose = require("mongoose");

const experienceBookingSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, required: true },
    packageName: String,
    date: { type: Date, required: true },
    guests: { type: Number, required: true, min: 1 },
    phone: { type: String, required: true },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["cho_xac_nhan", "da_xac_nhan", "hoan_tat", "huy"],
      default: "cho_xac_nhan",
    },
  },
  { timestamps: true }
);

const tourBookingSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tour: { type: mongoose.Schema.Types.ObjectId, ref: "Tour", required: true },
    business: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    guests: { type: Number, required: true, min: 1 },
    phone: { type: String, required: true },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["cho_xac_nhan", "da_xac_nhan", "hoan_tat", "huy"],
      default: "cho_xac_nhan",
    },
  },
  { timestamps: true }
);

const vehicleBookingSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    business: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pickupPoint: { type: String, required: true },
    dropoffPoint: { type: String, required: true },
    pickupTime: { type: Date, required: true },
    guests: { type: Number, required: true, min: 1 },
    phone: { type: String, required: true },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["cho_xac_nhan", "da_xac_nhan", "hoan_tat", "huy"],
      default: "cho_xac_nhan",
    },
  },
  { timestamps: true }
);

module.exports = {
  ExperienceBooking: mongoose.model("ExperienceBooking", experienceBookingSchema),
  TourBooking: mongoose.model("TourBooking", tourBookingSchema),
  VehicleBooking: mongoose.model("VehicleBooking", vehicleBookingSchema),
};
