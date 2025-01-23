const Medicine = require("../models/medicineModel");
const ErrorHandler = require("../utils/ErrorHandling");
const tryCatch = require("../middleware/tryCatch");
const UserProfile = require("../models/userProfile");

// Add New Product..
exports.createProduct = tryCatch(async (req, res, next) => {
  const requiredFields = [
    "name",
    "price",
    "discount",
    "description",
    "deliveryOptions",
    "selectedDelivery",
    "category",
    "stock",
    "images",
  ];

  for (const product of req.body) {
    for (const field of requiredFields) {
      if (!product[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`,
        });
      }
    }
  }

  const products = await Medicine.create(req.body);

  res.status(201).json({
    success: true,
    products,
  });
});

// Get All Product..
exports.getAllProduct = tryCatch(async (req, res, next) => {
  const productCount = await Medicine.countDocuments();
  const products = await Medicine.find();

  if (!products || products.length == 0) {
    return next(new ErrorHandler("No Product found", 404));
  }
  res.status(200).json({
    productCount,
    products,
  });
});

// Get Product By Id..
exports.getProduct = tryCatch(async (req, res, next) => {
  const product = await Medicine.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler("Product Not Found", 400));
  }
  res.status(200).json({
    product,
  });
});

// update Product By Id..
exports.updateProduct = tryCatch(async (req, res, next) => {
  let product = await Medicine.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler("Product Not Found", 400));
  }

  // update discount
  if (req.body.discount !== undefined) {
    const price = product.price;
    const discount = req.body.discount;

    const salePrice = price - (price * discount) / 100;

    req.body.salePrice = salePrice;
  }

  product = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    success: true,
    product,
  });
});

// Delete Product By Id..
exports.deleteProduct = tryCatch(async (req, res, next) => {
  const product = await Medicine.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  await Medicine.deleteOne({ _id: req.params.id });
  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

// Create New Review or update the review..
exports.createProductReview = tryCatch(async (req, res, next) => {
  const { rating, comment, productId } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return next(new ErrorHandler("Please provide a valid rating (1-5)", 400));
  }
  if (!comment || comment.trim() === "") {
    return next(new ErrorHandler("Comment cannot be empty", 400));
  }

  const userProfile = await UserProfile.findOne({
    user: req.user._id,
    
  }).populate("user", "phone"); // You can adjust fields as per requirement

  if (!userProfile) {
    return next(new ErrorHandler("User profile not found", 404));
  }
  const review = {
    user: req.user._id,
    name: userProfile.personalInformation.fullName,
    rating: Number(rating),
    comment,
  };
  const product = await Medicine.findById(productId);
  if(!product){
    return next(new ErrorHandler("Product Not Found", 404));
  }
  const isReviewed = product.reviews.find(
    (review) => review.user.toString() === req.user._id.toString()
  );
  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString()) {
        rev.rating = rating;
        rev.comment = comment;
      }
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }

  let avg = 0;
  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });
  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Review submitted successfully",
    name: userProfile.personalInformation.fullName,
    userId: req.user._id,
    phone: userProfile.user.phone,
  });
});
