const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const validator = require("validator");


const phoneUserSchema = new mongoose.Schema({
  phone: {
  type: Number,
  validate: {
    validator: function (value) {
      return value.toString().length === 10;
    },
    message: (props) => `${props.value} is not a valid 10-digit phone number`,
  },
  required: [true, "Phone number field is required"],
},
  otp: {
    type: Number,
    required: false,
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
  loginHistory: [{
    loginTime: Date,
    logoutTime: Date,
    sessionDuration: {
      type: {
        minutes: Number,
        seconds: Number
      },
      required: false
    }
  }],
  lastActive:Date,
  isActive:{
    type:Boolean,
    default:false,
  },
});

// JWT Token Generate
phoneUserSchema.methods.getJWTToken = function () {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Reference Token Generate
phoneUserSchema.methods.getReferenceToken = async function () {
  const referenceToken = crypto.randomBytes(32).toString("hex");
  this.referenceToken = referenceToken;
  await this.save();
  return referenceToken;
};

module.exports = mongoose.model("PhoneUser", phoneUserSchema);
