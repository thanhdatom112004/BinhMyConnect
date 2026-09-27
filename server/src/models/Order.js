const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: String,
    price: Number,
    unit: String,
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm" },
    items: [itemSchema],
    total: { type: Number, required: true, min: 0 },
    shippingAddress: { type: String, required: true },
    phone: { type: String, required: true },
    note: { type: String, default: "" },
    status: {
      type: String,
      enum: ["cho_xac_nhan", "dang_giao", "hoan_tat", "huy"],
      default: "cho_xac_nhan",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
