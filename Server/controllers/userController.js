const User = require("../models/userModel");
const ErrorHandler = require("../utils/ErrorHandling");
const tryCatch = require("../middleware/tryCatch");
const sentToken = require("../utils/sendTokens");

// User Register..
exports.register = tryCatch(async (req, res, next) => {
  const {
    name,
    email,
    phone,
    password,
    gender,
    height,
    bloodGroup,
    address,
    profilePicture,
    walletBalance,
  } = req.body;

  // Create User
  const user = await User.create({
    name,
    email,
    phone,
    password,
    gender,
    height,
    bloodGroup,
    address,
    profilePicture,
    walletBalance,
  });

  // Generate JWT and Reference Tokens
  const jwtToken = user.getJWTToken();
  // const referenceToken = user.getReferenceToken();

  await user.save();

  sentToken(user, 200, res);
 });

// Login user by Mobile Number
exports.login = tryCatch(async (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({
      success: false,
      message: "Phone number is required.",
    });
  }

  // Find user or create a new one if not found
  let user = await User.findOne({ phone });

  if (!user) {
    user = await User.create({ phone });
  }

  // if (!user) {
  //   return next(new ErrorHandler("Phone Not found", 401));
  // }

  // Save the user to ensure the reference token is stored
  await user.save();

  sentToken(user, 200, res);
});

// Logout..
exports.logout = tryCatch(async (req, res, next) => {
  res.cookie("token",null,{
    expires:new Date(Date.now()),
    httpOnly:true
  })

  res.status(200).json({
    success:true,
    message:"LogOut"
  })
});

// Get User Details By ID..
exports.getUserDetails = tryCatch(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorHandler("No User Found", 400));
  }
  res.status(200).json({
    success: true,
    user,
  });
});

// get All Users..
exports.getAllUser = tryCatch(async (req, res, next) => {
  const allUsers = await User.find();
  if (!allUsers) {
    return next(new ErrorHandler("No Users Found", 400));
  }
  res.status(200).json({
    success: true,
    allUsers,
  });
});

// update User By ID..
exports.updateUser = tryCatch(async (req, res, next) => {
  let updateUserProfile = await User.findById(req.params.id);
  if (!updateUserProfile) {
    return next(new ErrorHandler("User Not Found"));
  }
  updateUserProfile = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    user: updateUserProfile,
  });
});

// delete User By ID..
exports.deleteUser = tryCatch(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return next(
      new ErrorHandler(`User does not exits with Id: ${req.params.id}`)
    );
  }
  await User.deleteOne({ _id: id });
  res.status(200).json({
    success: true,
    message: "User deleted Succesfuly",
  });
});
