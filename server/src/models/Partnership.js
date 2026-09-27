const mongoose = require("mongoose");

const partnershipSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm" },
    type: {
      type: String,
      enum: ["bao_tieu", "dua_khach_vao_vuon"],
      required: true,
    },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["cho_phan_hoi", "chap_nhan", "tu_choi"],
      default: "cho_phan_hoi",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Partnership", partnershipSchema);
