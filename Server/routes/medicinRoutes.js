const express = require("express");
const { IsAuthenticatedUser } = require("../middleware/auth");
const {
  createProduct,
  getAllProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
} = require("../controllers/medicineController");
const router = express.Router();

router.route("/post/add-product").post(createProduct);
router.route("/get/products").get(getAllProduct);
router.route("/get/product/:id").get(getProduct);
router.route("/put/update-product/:id").put(updateProduct);
router.route("/delete/delete-product/:id").delete(deleteProduct);


router.route("/put/review-product").put(IsAuthenticatedUser , createProductReview);


module.exports = router;
