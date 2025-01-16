const Doctors = require("../models/doctorModel");
const ErrorHandler = require("../utils/ErrorHandling");
const tryCatch = require("../middleware/tryCatch");
const UserProfile = require("../models/userProfile");
const ApiFeatures = require("../utils/ApiFeatures");

// Doctor Register..
exports.doctorRegister = tryCatch(async (req, res, next) => {
  const {
    name,
    image,
    speciality,
    education,
    experience,
    about,
    available,
    fees,
    durations,
    slots_booked = [],
  } = req.body;

  // let imagePath = '';
  // if (req.file) {
  //   imagePath = `/uploads/${req.file.filename}`; // Construct the path to the uploaded file
  // } else {
  //   return res.status(400).json({
  //     success: false,
  //     message: 'Profile picture is required.',
  //   });
  // }

  const doctor = await Doctors.create({
    name,
    // image:imagePath,
    image,
    speciality,
    education,
    experience,
    about,
    available,
    fees,
    durations,
    slots_booked
  });
  res.status(201).json({
    success: true,
    message: "Doctor Register Successfully",
    doctor,
  });
});

// update Doctor Profile..
exports.updateDoctor = tryCatch(async (req, res, next) => {
  let doctor = await Doctors.findById(req.params.id);
  if (!doctor) {
    return next(new ErrorHandler("Doctor Not Found", 404));
  }
  doctor = await Doctors.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    success: true,
    doctor,
  });
});

// Get Doctor by ID..
exports.getDoctor = tryCatch(async (req, res, next) => {
  const doctor = await Doctors.findById(req.params.id);
  if (!doctor) {
    return next(new ErrorHandler("Doctor Not Found", 404));
  }
  res.status(200).json({
    success: true,
    doctor,
  });
});

// Get All Doctors..
exports.getDoctors = tryCatch(async (req, res, next) => {
  const resultPerPage = 5;
  const apiFeatures = new ApiFeatures(Doctors.find(), req.query)
    .search()
    .filter()
    .pagination(resultPerPage);

  const doctors = await apiFeatures.query;

  if (!doctors) {
    return next(new ErrorHandler("Doctors Not Found", 404));
  }
  res.status(200).json({
    success: true,
    total: doctors.length,
    doctors,
  });
});

// Delete Doctor by ID..
exports.deleteDoctor = tryCatch(async (req, res, next) => {
  const doctor = await Doctors.findById(req.params.id);
  if (!doctor) {
    return next(new ErrorHandler("Doctor Not Found", 404));
  }
  await Doctors.deleteOne({ _id: req.params.id });
  res.status(200).json({
    success: true,
    message: "Doctor deleted successfully",
  });
});

// Create New Review or Update the review..
exports.reviewOnDoctors = tryCatch(async (req, res, next) => {
  const { rating, comment, doctorId } = req.body;

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
  const doctor = await Doctors.findById(doctorId);
  if (!doctor) {
    return next(new ErrorHandler("Doctor Not Found", 404));
  }
  const isReviewed = doctor.reviews.find(
    (review) => review.user.toString() === req.user._id.toString()
  );
  if (isReviewed) {
    doctor.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString()) {
        rev.rating = rating;
        rev.comment = comment;
      }
    });
  } else {
    doctor.reviews.push(review);
    doctor.numOfReviews = doctor.reviews.length;
  }
  let avg = 0;
  doctor.reviews.forEach((rev) => {
    avg += rev.rating;
  });
  doctor.ratings = avg / doctor.reviews.length;

  await doctor.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Review submitted successfully",
    name: userProfile.personalInformation.fullName,
    userId: req.user._id,
    phone: userProfile.user.phone,
  });
});

// get All review..
exports.getAllReviews = tryCatch(async (req, res, next) => {
  const reviews = await Doctors.findById(req.params.id);
  if (!reviews) {
    return next(new ErrorHandler("Doctore Review Not Fount", 404));
  }
  res.status(200).json({
    success: true,
    reviews: reviews.reviews,
  });
});

// delete Review..
exports.deleteReview = tryCatch(async (req, res, next) => {
  const { doctorID, id } = req.query;

  if (!doctorID || !id) {
    return next(new ErrorHandler("doctorID and review id are required", 400));
  }

  // Ensure the user is logged in
  if (!req.user) {
    return next(
      new ErrorHandler("You must be logged in to perform this action", 401)
    );
  }

  const doctor = await Doctors.findById(doctorID);
  if (!doctor) {
    return next(new ErrorHandler("doctor not found", 404));
  }

  // Find the review to delete
  const review = doctor.reviews.find(
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

  // Filter out the review and update the doctor
  const reviews = doctor.reviews.filter(
    (rev) => rev._id.toString() !== id.toString()
  );
  const numOfReviews = reviews.length;
  const avg = reviews.reduce((acc, rev) => acc + rev.rating, 0);
  const ratings = numOfReviews > 0 ? avg / numOfReviews : 0;

  await Doctors.findByIdAndUpdate(
    doctorID,
    { reviews, ratings, numOfReviews },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: "Review Deleted Successfully",
  });
});
