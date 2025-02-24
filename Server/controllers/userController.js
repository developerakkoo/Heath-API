const PhoneUser = require("../models/userModel");
const ErrorHandler = require("../utils/ErrorHandling");
const tryCatch = require("../middleware/tryCatch");
const sentToken = require("../utils/sendTokens");
const { sendOTP, verifyOTP } = require("../utils/sendOTP");

// Login user by Mobile Number
// exports.login = tryCatch(async (req, res, next) => {
//   const { phone } = req.body;

//   if (!phone) {
//     return next(new ErrorHandler("Phone number is required", 400));
//   }

//   // Check if the user exists
//   let user = await PhoneUser.findOne({ phone });

//   if (!user) {
//     // New user: Generate and send OTP
//     const generatedOTP = sendOTP(phone);
//     return res.status(200).json({
//       success: true,
//       message: "OTP sent to your phone number",
//       otp: generatedOTP, // Include for testing only; remove in production
//     });
//   }

//   // Existing user: Direct login
//   sentToken(user, 200, res);
// });

exports.login = tryCatch(async (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return next(new ErrorHandler("Phone number is required", 400));
  }

  // Check if user already exists
  let user = await PhoneUser.findOne({ phone });

  if (user) {
    // Existing user: Direct login
    return sentToken(user, 200, res);
  }

  // New user: Generate and send OTP
  const generatedOTP = sendOTP(phone);

  // Store phone number in a session/cookie for verification step
  res.cookie("phoneSession", phone, {
    httpOnly: true,
    expires: new Date(Date.now() + 5 * 60 * 1000), // Expires in 5 minutes
  });

  return res.status(200).json({
    success: true,
    message: "OTP sent to your phone number",
    otp: generatedOTP, // For testing; remove in production
  });
});

// Verify OTP
// exports.verifyOtp = tryCatch(async (req, res, next) => {
//   const { phone, otp } = req.body;

//   if (!phone || !otp) {
//     return next(new ErrorHandler("Phone number and OTP are required", 400));
//   }

//   const isValidOTP = verifyOTP(phone, otp);
//   if (!isValidOTP) {
//     return next(new ErrorHandler("Invalid or expired OTP", 400));
//   }
//   let user = await PhoneUser.findOne({ phone });
//   if (!user) {
//     user = await PhoneUser.create({ phone });
//   }

//   // Send token after successful verification
//   sentToken(user, 200, res);
// });

exports.verifyOtp = tryCatch(async (req, res, next) => {
  const { otp } = req.body;

  // Retrieve phone number from session/cookie
  const phone = req.cookies.phoneSession;

  if (!phone) {
    return next(new ErrorHandler("Session expired, please request OTP again", 400));
  }

  if (!otp) {
    return next(new ErrorHandler("OTP is required", 400));
  }

  // Verify OTP
  const isValidOTP = verifyOTP(phone, otp);
  if (!isValidOTP) {
    return next(new ErrorHandler("Invalid or expired OTP", 400));
  }

  // Check if user exists, otherwise create a new one
  let user = await PhoneUser.findOne({ phone });
  if (!user) {
    user = await PhoneUser.create({ phone });
  }

  // Clear session after successful login
  res.clearCookie("phoneSession");

  // Send token after successful verification
  sentToken(user, 200, res);
});

// Logout..
exports.logout = tryCatch(async (req, res, next) => {
  // Clear the token cookie
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  // Ensure `req.user` contains user details
  const user = req.user;
  if (!user) {
    return next(new ErrorHandler("Phone number is required", 404));
  }

  res.status(200).json({
    success: true,
    message: "Logout Successfully",
    user: {
      id: user._id, // User ID
      phone: user.phone, // Phone number
    },
  });
});
