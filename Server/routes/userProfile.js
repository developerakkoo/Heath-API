const express = require("express");
const { IsAuthenticatedUser } = require("../middleware/auth");
const {
  registerUser,
  getUserProfile,
  getAllUserProfiles,
  deleteUserProfile,
  updateProfile,
} = require("../controllers/userProfileController");
const router = express.Router();

router.route("/post/register").post(IsAuthenticatedUser, registerUser);
router.route("/get/user-profile/:id").get(IsAuthenticatedUser, getUserProfile);
router.route("/get/users").get(IsAuthenticatedUser, getAllUserProfiles);
router
  .route("/delete/delete-profile/:id")
  .delete(IsAuthenticatedUser, deleteUserProfile);

router.route("/put/update-user/:id").put(IsAuthenticatedUser, updateProfile);
module.exports = router;
