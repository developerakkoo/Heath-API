const express = require("express");
const { IsAuthenticatedUser } = require("../middleware/auth");
const {
  addToCart,
  updateProductQuantity,
  getMyCart,
  deleteProductPromcart,
} = require("../controllers/addToCart");
const router = express.Router();

// Add to cart route..
router.route("/post/add-to-cart").post(IsAuthenticatedUser, addToCart);

// update product quantity..
router
  .route("/put/update-product-quantity")
  .put(IsAuthenticatedUser, updateProductQuantity);

router.route("/get/my-cart",).get(IsAuthenticatedUser,getMyCart)

router.route("/delete/remove-product/:id").delete(IsAuthenticatedUser,deleteProductPromcart)

module.exports = router;
