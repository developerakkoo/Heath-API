const express = require("express");
const { IsAuthenticatedUser } = require("../middleware/auth");
const { addToCart } = require("../controllers/addToCart");
const router = express.Router();


router.route("/post/add-to-cart").post(IsAuthenticatedUser,addToCart)



module.exports = router;