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
    user.isActive = true;
    user.lastActive = new Date();
    user.loginHistory.push({ 
      loginTime: new Date(),
      // Initialize sessionDuration as null or with default values
      sessionDuration: null
    });

    await user.save();
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
    return next(
      new ErrorHandler("Session expired, please request OTP again", 400)
    );
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
    user = await PhoneUser.create({
      phone,
      isActive: true,
      lastActive: new Date(),
      loginHistory: [{ loginTime: new Date() }],
    });
  } else {
    user.isActive = true;
    user.lastActive = new Date();
    user.loginHistory.push({ loginTime: new Date() });
    await user.save();
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
  const user = await PhoneUser.findById(req.user.id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Update last login session
  if (user.loginHistory && user.loginHistory.length > 0) {
    const lastSession = user.loginHistory[user.loginHistory.length - 1];
    if (lastSession && !lastSession.logoutTime) {
      const logoutTime = new Date();
      const diffMs = logoutTime - lastSession.loginTime;
      
      const minutes = Math.floor(diffMs / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      
      lastSession.logoutTime = logoutTime;
      lastSession.sessionDuration = {
        minutes: minutes,
        seconds: seconds
      };
    }
  }
  user.isActive = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Logout Successfully",
    user: {
      id: user._id,
      phone: user.phone,
    },
  });
});

exports.getUserAnalytics = tryCatch(async (req, res, next) => {
  const totalUser = await PhoneUser.countDocuments();
  const activeUser = await PhoneUser.countDocuments({ isActive: true });

  const userStats = await PhoneUser.aggregate([
    { $unwind: "$loginHistory" },
    { 
      $match: { 
        "loginHistory.sessionDuration": { $exists: true, $ne: null } 
      } 
    },
    {
      $group: {
        _id: "$_id",
        totalSessions: { $sum: 1 },
        totalMinutes: { $sum: "$loginHistory.sessionDuration.minutes" },
        totalSeconds: { $sum: "$loginHistory.sessionDuration.seconds" },
      },
    },
    {
      $project: {
        _id: 1,
        totalSessions: 1,
        totalUsageTime: {
          minutes: {
            $add: [
              "$totalMinutes",
              { $floor: { $divide: ["$totalSeconds", 60] } },
            ],
          },
          seconds: { $mod: ["$totalSeconds", 60] },
        },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    totalUser,
    activeUser,
    userStats,
  });
});
