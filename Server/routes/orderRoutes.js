const express = require("express");
const { IsAuthenticatedUser } = require("../middleware/auth");
const {
  newOrder,
  getSingleOrder,
  myOrders,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
  getIncomeStatistics,
  getOrderHistoryByCategory,
  applyVoucher,
  cancelOrder,
} = require("../controllers/orderController");
const router = express.Router();

router.route("/post/new-order").post(IsAuthenticatedUser, newOrder);
router.route("/delete/cancle-order/:id").delete(IsAuthenticatedUser,cancelOrder)
router.route("/get/order/:id").get(IsAuthenticatedUser, getSingleOrder);
router.route("/get/myorders").get(IsAuthenticatedUser, myOrders);
router.route("/get/orders").get(IsAuthenticatedUser, getAllOrders);

router.route("/put/update/:id").put(IsAuthenticatedUser, updateOrderStatus);

router.route("/delete/order/:id").delete(IsAuthenticatedUser, deleteOrder);

router.route("/get/income").get(IsAuthenticatedUser, getIncomeStatistics);

router
  .route("/get/orders/history/categories")
  .get(IsAuthenticatedUser, getOrderHistoryByCategory);

router.route("/post/voucher/apply").post(IsAuthenticatedUser, applyVoucher);

module.exports = router;
