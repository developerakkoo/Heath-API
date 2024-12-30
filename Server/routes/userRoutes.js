const express = require("express");
const {
  register,
  getUserDetails,
  getAllUser,
  updateUser,
  deleteUser,
  login,
  logout,
} = require("../controllers/userController");
const { IsAuthenticatedUser } = require("../middleware/auth");

const router = express.Router();

router.route("/post/register").post( register);
router.route("/get/user-details/:id").get(getUserDetails);
router.route("/get/all-users").get(IsAuthenticatedUser,getAllUser);
router.route("/put/update-user/:id").put(updateUser);
router.route("/delete/delete-user/:id").delete(deleteUser);
router.route("/post/login").post(login)
router.route("/get/logout").get(logout)
module.exports = router;
