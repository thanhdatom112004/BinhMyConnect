const mongoose = require("mongoose");

async function connectDb() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Thiếu MONGO_URI trong file .env ở thư mục gốc D:\\BinhMyConnect");
  }

  console.log("Đang kết nối Mongo:", uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@"));

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log("Đã kết nối MongoDB:", mongoose.connection.name);
}

module.exports = { connectDb };