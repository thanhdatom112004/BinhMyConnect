const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    category: { type: String, enum: ["nong_nghiep", "du_lich", "su_kien"], required: true },
    coverImage: { type: String, default: "/img/banner-fruits.jpg" },
    content: { type: String, required: true },
    publishedAt: { type: Date },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("News", newsSchema);
