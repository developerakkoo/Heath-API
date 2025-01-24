const express = require("express");
const { IsAuthenticatedUser } = require("../middleware/auth");
const {
  createProduct,
  getAllProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getProductsReview,
  deleteProductReview,
  ProductLike,
} = require("../controllers/medicineController");
const router = express.Router();

router.route("/post/add-product").post(createProduct);
router.route("/get/products").get(getAllProduct);
router.route("/get/product/:id").get(getProduct);
router.route("/put/update-product/:id").put(updateProduct);
router.route("/delete/delete-product/:id").delete(deleteProduct);


router.route("/put/review-product").put(IsAuthenticatedUser , createProductReview);
router.route("/get/product-review").get(getProductsReview);
router.route("/delete/product-review").delete(IsAuthenticatedUser, deleteProductReview);
router.route("/post/like-unlike").post(IsAuthenticatedUser, ProductLike);

module.exports = router;
