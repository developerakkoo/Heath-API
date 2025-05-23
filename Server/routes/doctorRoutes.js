const express = require("express");
const upload = require("../utils/multer");
const { IsAuthenticatedUser } = require("../middleware/auth");
const {
  doctorRegister,
  updateDoctor,
  getDoctor,
  getDoctors,
  deleteDoctor,
  reviewOnDoctors,
  getAllReviews,
  deleteReview,
  getAvailableDoctors,
  createAvailableSlots,
} = require("../controllers/doctorController");
const router = express.Router();

// router.route("/post/doctor-register").post(upload.single('image'),doctorRegister);
router.route("/post/doctor-register").post(doctorRegister);
router.route("/post/create-availability").post(createAvailableSlots)

router.route("/put/update-doctor/:id").put(updateDoctor);
router.route("/get/doctor/:id").get(getDoctor);
router.route("/get/doctors").get(getDoctors);
router.route("/delete/doctor/:id").delete(deleteDoctor);

router.route("/put/reviews").put(IsAuthenticatedUser, reviewOnDoctors);
router.route("/get/reviews/:id").get(getAllReviews);
router.route("/delete/review").delete(IsAuthenticatedUser, deleteReview);

module.exports = router;
