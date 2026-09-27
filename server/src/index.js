const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { connectDb } = require("./config/db");
const { errorHandler } = require("./middleware/errorHandler");
const { ensureSchedules } = require("./utils/ensureSchedules");

const authRoutes = require("./routes/auth");
const homeRoutes = require("./routes/home");
const productRoutes = require("./routes/products");
const farmRoutes = require("./routes/farms");
const tourRoutes = require("./routes/tours");
const vehicleRoutes = require("./routes/vehicles");
const newsRoutes = require("./routes/news");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const reviewRoutes = require("./routes/reviews");
const messageRoutes = require("./routes/messages");
const partnershipRoutes = require("./routes/partnerships");
const adminRoutes = require("./routes/admin");

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

const publicDir = path.join(__dirname, "../../fruitables-1.0.0");
app.use(express.static(publicDir));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    name: "Bình Mỹ Connect",
    location: "Xã Bình Mỹ, Củ Chi, TP.HCM",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/home", homeRoutes);
app.get("/api/search", homeRoutes.searchHandler);
app.use("/api/products", productRoutes);
app.use("/api/farms", farmRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/partnerships", partnershipRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "Không tìm thấy API" });
});

app.use(errorHandler);

const port = Number(process.env.PORT || 5000);

connectDb()
  .then(() => ensureSchedules())
  .then(() => {
    const server = app.listen(port, () => {
      console.log(`Bình Mỹ Connect chạy tại http://localhost:${port}`);
    });
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`Cổng ${port} đang được dùng. Tắt cửa sổ server cũ rồi chạy lại một lần.`);
        process.exit(1);
      }
      console.error(err);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error("Không kết nối được MongoDB:", err.message);
    process.exit(1);
  });