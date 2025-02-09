const express = require("express");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/Autho");
const {
  createVoucher,
  updateVoucher,
  deleteVoucher,
  getVoucher,
} = require("../controllers/voucherController");

const router = express.Router();

router
  .route("/post/create-voucher")
  .post(isAuthenticatedUser, authorizeRoles("admin"), createVoucher);

router
  .route("/put/update-voucher")
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateVoucher);

router
  .route("/delete/delete-voucher")
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteVoucher);

router
  .route("/get/all-voucher")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getVoucher);

module.exports = router;
