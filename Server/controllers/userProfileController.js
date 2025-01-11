const UserProfile = require("../models/userProfile");
const ErrorHandler = require("../utils/ErrorHandling");
const tryCatch = require("../middleware/tryCatch");
const PhoneUser = require("../models/userModel");

// Register User..
exports.registerUser = tryCatch(async (req, res, next) => {
  const {
    personalInformation: {
      fullName,
      email,
      emergencyContactNumber,
      address: { flat, buildingName, addressLine, pincode } = {},
    } = {},
    gender,
    height: { feet, inches } = {},
    bloodGroup,
    birthday: { date, month, year } = {},
    medicalHistory: {
      allergies,
      recentOperations,
      exercise,
      diet,
      drinkingHabit,
      smokingHabit,
    } = {},
  } = req.body;

  // Check if the email already exists
  const existingUser = await UserProfile.findOne({
    "personalInformation.email": email,
  });
  if (existingUser) {
    return next(new ErrorHandler("Email already exists.", 400));
  }

  // Create the new user profile
  const userProfile = await UserProfile.create({
    user: req.user._id,
    personalInformation: {
      fullName,
      email,
      emergencyContactNumber,
      address: {
        flat,
        buildingName,
        addressLine,
        pincode,
      },
    },
    gender,
    height: { feet, inches },
    bloodGroup,
    birthday: { date, month, year },
    medicalHistory: {
      allergies,
      recentOperations,
      exercise,
      diet,
      drinkingHabit,
      smokingHabit,
    },
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    userProfile,
  });
});

// get user Information based on ID..
exports.getUserProfile = tryCatch(async (req, res, next) => {
  const { id } = req.params;
  const getProfile = await UserProfile.findOne({ user: id }).populate("user");
  if (!getProfile) {
    return next(new ErrorHandler("User Profile not Found", 404));
  }
  res.status(201).json({
    success: true,
    getProfile,
  });
});

// get all user Information..
exports.getAllUserProfiles = tryCatch(async (req, res, next) => {
  const userProfiles = await UserProfile.find().populate("user");

  if (!userProfiles || userProfiles.length === 0) {
    return next(new ErrorHandler("No Users found", 404));
  }
  res.status(201).json({
    success: true,
    count: userProfiles.length,
    userProfiles,
  });
});

// delete user based on ID..
exports.deleteUserProfile = tryCatch(async (req, res, next) => {
  const { id } = req.params;

  const deleteProfile = await UserProfile.findOneAndDelete({
    user: id,
  }).populate("user");

  if (!deleteProfile) {
    return next(new ErrorHandler("User Profile not Found", 404));
  }

  const deleteUser = await PhoneUser.findByIdAndDelete(id);
  if (!deleteUser) {
    return next(new ErrorHandler("User not found in PhoneUser database", 404));
  }

  res.status(201).json({
    success: true,
    message: "User Delete Successfuly",
  });
});

// update user Profile..
exports.updateProfile = tryCatch(async (req, res, next) => {
  const { id } = req.params;
  const updateUserProfile = req.body;
  const profile = await UserProfile.findOneAndUpdate(
    { user: id },
    updateUserProfile,
    {
      new: true,
      runValidators: true,
    }
  );
  if (!profile) {
    return next(new ErrorHandler("User Profile Not Fount", 404));
  }
  res.status(200).json({
    success: true,
    message: "User profile updated successfully",
    profile,
  });
});
