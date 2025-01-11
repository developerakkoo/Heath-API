const PhoneUser = require("../models/userModel");
const ErrorHandler = require("../utils/ErrorHandling");
const tryCatchError = require("./tryCatch");
const jwt = require("jsonwebtoken");

exports.IsAuthenticatedUser = tryCatchError(async (req, resizeBy, next) => {
  const { token } = req.cookies;
  if (!token) {
    return next(new ErrorHandler("please Login To access this resource", 401));
  }
  const decodedData = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await PhoneUser.findById(decodedData.id);
  next();
});
