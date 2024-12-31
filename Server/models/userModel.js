const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: [false, "Please Enter Email"],
    unique: true,
    validate: [validator.isEmail, "Please valid Email"],
  },
  phone: {
    type: String,
    unique: true,
    validate: {
      validator: function (value) {
        return /^[0-9]{10}$/.test(value);
      },
      message: (props) => `${props.value} is not equal to 10`,
    },
    required: [true, "Number field is required"],
  },
  password: {
    type: String,
    required: [false, "Please Enter password"],
    minLength: [8, "Password should be greater than 8 characters"],
    select: false,
    validate: {
      validator: function (value) {
        return /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9]).{8,}$/.test(value);
      },
      message:
        "Password must contain at least one uppercase letter, one symbol, and one number",
    },
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: false,
  },
  height: {
    type: Number,
    required: false,
  },
  bloodGroup: {
    type: String,
    enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    required: false,
  },
  address: {
    flat: String,
    building: String,
    addressLine: String,
    pincode: String,
  },
  emergencyContactNumber:{
    type:Number,
  },
  profilePicture: {
    type: String,
    default: null,
  },
  walletBalance: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  referenceToken: {
    type: String,
    default: null,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// JWT Token Generate
userSchema.methods.getJWTToken = function () {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Reference Token Generate
userSchema.methods.getReferenceToken =async function () {
  const referenceToken = crypto.randomBytes(32).toString("hex");
  this.referenceToken = referenceToken;
  await this.save();
  return referenceToken;
};

module.exports = mongoose.model("User", userSchema);
