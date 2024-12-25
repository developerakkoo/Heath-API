const User = require("../models/userModel");
const ErrorHandler = require("../utils/ErrorHandling");
const tryCatch = require("../middleware/tryCatch");

// User Register..
exports.register = tryCatch(async (req, res, next) => {
  const { name, email, password, mobile } = req.body;
  const user = await User.create({
    name,
    email,
    password,
    mobile,
    avatar: {
      public_id: "This is avatar",
      url: "fjdsfo",
    },
  });
  res.status(201).json({
    success: true,
    message: "User registered successfully.",
    user,
  });
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
  const { name, email, mobile, avatar } = req.body;
  const userId = req.params.id;
  const updateData = { name, email, mobile };
  if (avatar) {
    if (!avatar.public_id || !avatar.url) {
      return next(
        new ErrorHandler("Both public_id and url are required for avatar.", 400)
      );
    }
    updateData.avatar = avatar;
  }
  const updateUser = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });
  if (!updateUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    user: updateUser,
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

