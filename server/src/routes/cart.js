const express = require("express");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { authenticate, authorize } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");

const router = express.Router();

router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate({
      path: "cart.product",
      populate: { path: "farm", select: "name hamlet" },
    });
    res.json({ success: true, data: user.cart });
  })
);

router.post(
  "/",
  authenticate,
  authorize("customer"),
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.body.productId);
    if (!product || product.approvalStatus !== "approved") throw new ApiError(404, "Sản phẩm không khả dụng");
    const qty = Number(req.body.quantity || 1);
    if (qty < 1) throw new ApiError(400, "Số lượng không hợp lệ");
    const user = await User.findById(req.user._id);
    const existing = user.cart.find((i) => i.product.toString() === product._id.toString());
    if (existing) existing.quantity += qty;
    else user.cart.push({ product: product._id, quantity: qty });
    await user.save();
    res.status(201).json({ success: true, data: user.cart });
  })
);

router.put(
  "/:productId",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const item = user.cart.find((i) => i.product.toString() === req.params.productId);
    if (!item) throw new ApiError(404, "Sản phẩm không có trong giỏ");
    item.quantity = Number(req.body.quantity);
    if (item.quantity < 1) {
      user.cart = user.cart.filter((i) => i.product.toString() !== req.params.productId);
    }
    await user.save();
    res.json({ success: true, data: user.cart });
  })
);

router.delete(
  "/:productId",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    user.cart = user.cart.filter((i) => i.product.toString() !== req.params.productId);
    await user.save();
    res.json({ success: true, data: user.cart });
  })
);

router.post(
  "/checkout",
  authenticate,
  authorize("customer"),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate("cart.product");
    if (!user.cart.length) throw new ApiError(400, "Giỏ hàng trống");
    const address = req.body.shippingAddress;
    const phone = req.body.phone || user.phone;
    if (!address || !phone) throw new ApiError(400, "Cần địa chỉ nhận và số điện thoại");

    const byFarmer = new Map();
    for (const line of user.cart) {
      const p = line.product;
      if (!p || p.stock < line.quantity) {
        throw new ApiError(400, `Không đủ hàng: ${p ? p.name : "sản phẩm"}`);
      }
      const key = p.farmer.toString();
      if (!byFarmer.has(key)) byFarmer.set(key, []);
      byFarmer.get(key).push(line);
    }

    const orders = [];
    for (const [farmerId, lines] of byFarmer.entries()) {
      const items = lines.map((line) => ({
        product: line.product._id,
        name: line.product.name,
        price: line.product.price,
        unit: line.product.unit,
        quantity: line.quantity,
      }));
      const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
      const order = await Order.create({
        customer: user._id,
        farmer: farmerId,
        farm: lines[0].product.farm,
        items,
        total,
        shippingAddress: address,
        phone,
        note: req.body.note || "",
      });
      for (const line of lines) {
        await Product.findByIdAndUpdate(line.product._id, { $inc: { stock: -line.quantity } });
      }
      orders.push(order);
    }
    user.cart = [];
    await user.save();
    res.status(201).json({ success: true, data: orders });
  })
);

module.exports = router;
