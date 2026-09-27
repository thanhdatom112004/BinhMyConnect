const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = ["customer", "farmer", "business", "admin"];
const SERVICE_TYPES = ["tour", "xe", "an_uong", "luu_tru"];

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ROLES, required: true },
    phone: { type: String, trim: true },
    avatar: { type: String, default: "/img/avatar.jpg" },
    isActive: { type: Boolean, default: true },
    customerProfile: {
      fullName: String,
      area: String,
    },
    farmerProfile: {
      householdName: String,
      hamlet: String,
      gardenDescription: String,
      photos: [String],
      mainProducts: [String],
    },
    businessProfile: {
      companyName: String,
      serviceTypes: [{ type: String, enum: SERVICE_TYPES }],
    },
    cart: [cartItemSchema],
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
module.exports.ROLES = ROLES;
module.exports.SERVICE_TYPES = SERVICE_TYPES;
