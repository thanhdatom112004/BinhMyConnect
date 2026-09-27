const express = require("express");
const Conversation = require("../models/Conversation");
const { authenticate } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");

const router = express.Router();

router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const list = await Conversation.find({ participants: req.user._id })
      .populate("participants", "role farmerProfile businessProfile customerProfile phone")
      .sort({ lastMessageAt: -1 });
    res.json({
      success: true,
      data: list.map((c) => ({
        _id: c._id,
        relatedType: c.relatedType,
        relatedId: c.relatedId,
        participants: c.participants,
        lastMessageAt: c.lastMessageAt,
        lastMessage: c.messages[c.messages.length - 1] || null,
      })),
    });
  })
);

router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const conv = await Conversation.findById(req.params.id).populate(
      "participants",
      "role farmerProfile businessProfile customerProfile"
    );
    if (!conv) throw new ApiError(404, "Không tìm thấy hội thoại");
    if (!conv.participants.some((p) => p._id.toString() === req.user._id.toString())) {
      throw new ApiError(403, "Không thuộc hội thoại này");
    }
    res.json({ success: true, data: conv });
  })
);

router.post(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const { toUserId, text, relatedType, relatedId } = req.body;
    if (!toUserId || !text) throw new ApiError(400, "Thiếu người nhận hoặc nội dung");
    if (toUserId === req.user._id.toString()) throw new ApiError(400, "Không thể nhắn chính mình");

    let conv = await Conversation.findOne({
      participants: { $all: [req.user._id, toUserId], $size: 2 },
      relatedType: relatedType || "general",
      relatedId: relatedId || null,
    });
    if (!conv) {
      conv = await Conversation.create({
        participants: [req.user._id, toUserId],
        relatedType: relatedType || "general",
        relatedId: relatedId || undefined,
        messages: [],
      });
    }
    conv.messages.push({ sender: req.user._id, text });
    conv.lastMessageAt = new Date();
    await conv.save();
    res.status(201).json({ success: true, data: conv });
  })
);

module.exports = router;
