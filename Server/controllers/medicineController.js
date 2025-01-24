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
  if (!product) {
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

// Get All Reviews of a product..
exports.getProductsReview = tryCatch(async (req, res, next) => {
  const product = await Medicine.findById(req.query.id);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  res.status(200).json({
    reviews: product.reviews,
  });
});

// Delete product review..
exports.deleteProductReview = tryCatch(async (req, res, next) => {
  const { productID, id } = req.query;

  // Ensure the user is logged in
  if (!req.user) {
    return next(
      new ErrorHandler("You must be logged in to to delete review", 401)
    );
  }

  const product = await Medicine.findById(productID);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  // Find the review to delete
  const review = product.reviews.find(
    (rev) => rev._id.toString() === id.toString()
  );
  if (!review) {
    return next(new ErrorHandler("Review not found", 404));
  }

  // Check if the logged-in user is the owner of the review
  if (review.user.toString() !== req.user.id) {
    return next(
      new ErrorHandler("You are not authorized to delete this review", 403)
    );
  }

  // Filter out the review and update the product
  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== id.toString()
  );
  const numOfReviews = reviews.length;
  const avg = reviews.reduce((acc, rev) => acc + rev.rating, 0);
  const ratings = numOfReviews > 0 ? avg / numOfReviews : 0;

  await Medicine.findByIdAndUpdate(
    productID,
    { reviews, ratings, numOfReviews },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: "Review Deleted Successfully",
  });
});

// Product Like and Unlike..
exports.ProductLike = tryCatch(async (req, res, next) => {
  const { productId } = req.body;

  const product = await Medicine.findById(productId);
  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  // Check if the user has already liked the product
  const isLiked = product.likes.some(
    (like) => like.toString() === req.user._id.toString()
  );

  if (isLiked) {
    // If already liked, unlike the product
    product.likes = product.likes.filter(
      (like) => like.toString() !== req.user._id.toString()
    );
    product.likeCount = product.likes.length;
  } else {
    // Otherwise, like the product
    product.likes.push(req.user._id);
    product.likeCount = product.likes.length;
  }

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: isLiked
      ? "Product unliked successfully"
      : "Product liked successfully",
    likeCount: product.likeCount,
  });
});