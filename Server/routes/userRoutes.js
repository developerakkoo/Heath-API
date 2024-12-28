const express = require("express");
const {
  register,
  getUserDetails,
  getAllUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

const router = express.Router();

router.route("/post/register").post(register);
router.route("/get/user-details/:id").get(getUserDetails);
router.route("/get/all-users").get(getAllUser);
router.route("/put/update-user/:id").put(updateUser);
router.route("/delete/delete-user/:id").delete(deleteUser);

module.exports = router;
