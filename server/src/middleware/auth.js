const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { ApiError } = require("../utils/apiError");
const { asyncHandler } = require("../utils/asyncHandler");

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new ApiError(401, "Cần đăng nhập");
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    const user = await User.findById(payload.id);
    if (!user || !user.isActive) throw new ApiError(401, "Tài khoản không hợp lệ");
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, "Phiên đăng nhập hết hạn hoặc không hợp lệ");
  }
});

const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    req.user = await User.findById(payload.id);
  } catch {
    req.user = null;
  }
  next();
});

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, "Cần đăng nhập"));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "Không đủ quyền cho thao tác này"));
    }
    next();
  };
}

module.exports = { authenticate, optionalAuth, authorize };
