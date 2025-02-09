const Medicine = require("../models/medicineModel");
const ErrorHandler = require("../utils/ErrorHandling");
const tryCatch = require("../middleware/tryCatch");
const Cart = require("../models/cartModel");

exports.addToCart = tryCatch(async (req, res, next) => {
    const { productId, quantity } = req.body;
  
    if (!req.user || !req.user._id) {
      return next(new ErrorHandler("User is not authenticated", 401));
    }
    const userId = req.user._id;
     
    const product = await Medicine.findById(productId);
    if (!product) {
      return next(new ErrorHandler("Product Not Found", 404));
    }
    if (product.stock < quantity) {
      return next(new ErrorHandler(`Only ${product.stock} units available`, 400));
    }
  
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, cartItems: [] });
    }
  
    const existingItem = cart.cartItems.find((item) => item.product.equals(productId));
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.cartItems.push({
        product: productId,
        name: product.name,
        price: product.price,
        quantity,
        images: product.images,
      });
    }
  
    // Reduce product stock
    product.stock -= quantity;
    await product.save();
  
    await cart.save();
  
    const updatedCart = await Cart.findById(cart._id).populate(
      "cartItems.product",
      "name price stock"
    );
  
    res.status(200).json({
      success: true,
      message: "Item added to cart successfully",
      cart: updatedCart,
    });
});


  

  