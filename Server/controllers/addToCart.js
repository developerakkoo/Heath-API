const Medicine = require("../models/medicineModel");
const ErrorHandler = require("../utils/ErrorHandling");
const tryCatch = require("../middleware/tryCatch");
const Cart = require("../models/cartModel");
const mongoose = require("mongoose");

// Add Product into cart..
exports.addToCart = tryCatch(async (req, res, next) => {
  const { productId } = req.body;

  if (!req.user || !req.user._id) {
    return next(new ErrorHandler("User is not authenticated", 401));
  }
  const userId = req.user._id;

  const product = await Medicine.findById(productId);
  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }
  if (product.stock < 1) {
    return next(new ErrorHandler(`Only ${product.stock} units available`, 400));
  }

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({ user: userId, cartItems: [] });
  }

  const existingItem = cart.cartItems.find((item) =>
    item.product.equals(productId)
  );
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.cartItems.push({
      product: productId,
      name: product.name,
      price: product.price,
      quantity: 1,
      images: product.images,
    });
  }

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

// increase or decrease product quantity into the cart..
exports.updateProductQuantity = tryCatch(async (req, res, next) => {
  const { productId, action } = req.body;

  if (!req.user || !req.user._id) {
    return next(new ErrorHandler("User is not authenticated", 401));
  }
  const userId = req.user._id;

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return next(new ErrorHandler("cart not dound", 404));
  }
  const cartItem = cart.cartItems.find((item) =>
    item.product.equals(productId)
  );
  if (!cartItem) {
    return next(new ErrorHandler("Product not found in cart", 404));
  }

  const product = await Medicine.findById(productId);
  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }
  if (action === "increase") {
    if (product.stock <= cartItem.quantity) {
      return next(
        new ErrorHandler(`Only ${product.stock} units available`, 400)
      );
    }
    cartItem.quantity += 1;
  } else if (action === "decrese") {
    if (cartItem.quantity > 1) {
      cartItem.quantity -= 1;
    } else {
      // if quantity is 1 and user trying to decrease item from cart the product remove from cart automatically..
      cart.cartItems = cart.cartItems.filter(
        (item) => !item.product.equals(productId)
      );
    }
  } else {
    return next(
      new ErrorHandler("Invalid action. Use 'increase' or 'decrease'", 400)
    );
  }
  await cart.save();

  const updatedCart = await Cart.findById(cart.id).populate(
    "cartItems.product",
    "name price stock"
  );
  res.status(200).json({
    success: true,
    message: `product quentity ${action} successfully..`,
    cart: updatedCart,
  });
});

// GetMy Cart..
exports.getMyCart = tryCatch(async (req, res, next) => {
  if (!req.user || !req.user._id) {
    return next(new ErrorHandler("User is not authenticated", 401));
  }
  const userID = req.user._id;
  const cart = await Cart.findOne({ user: userID }).populate(
    "cartItems.product",
    "name price stock images"
  );
  if (!cart || cart.cartItems.length === 0) {
    return res.status(200).json({
      success: true,
      message: "Your cart is empty",
      cart: [],
    });
  }
  res.status(200).json({
    success: true,
    cart,
  });
});

// Remove Product From Cart..
exports.deleteProductPromcart = tryCatch(async (req, res, next) => {
  const { id: productId } = req.params;

  if (!req.user || !req.user._id) {
    return next(new ErrorHandler("User is not authenticated", 401));
  }

  const userID = req.user._id;
  let cart = await Cart.findOne({ user: userID });

  if (!cart) {
    return next(new ErrorHandler("Cart not found", 404));
  }

  console.log(
    "Product IDs in cart:",
    cart.cartItems.map((item) => item.product.toString())
  );
  console.log("Product to remove:", productId);

  // Check if the product exists in the cart
  const initialLength = cart.cartItems.length;
  cart.cartItems = cart.cartItems.filter(
    (item) => !item.product.equals(productId)
  );

  if (cart.cartItems.length === initialLength) {
    return next(new ErrorHandler("Product not found in the cart", 404));
  }

  if (cart.cartItems.length === 0) {
    await Cart.findByIdAndDelete(cart._id);
    return res.status(200).json({
      success: true,
      message: "Cart has been removed",
    });
  }

  // Recalculate total price after removing the product
  cart.totalPrice = cart.cartItems.reduce((acc, item) => {
    return acc + item.price * item.quantity;
  }, 0);

  await cart.save();

  // Populate product details
  const updatedCart = await Cart.findById(cart._id).populate(
    "cartItems.product",
    "name price stock"
  );

  res.status(200).json({
    success: true,
    message: "Product removed from cart successfully",
    cart: updatedCart,
  });
});

// clear Cart..
exports.clearCart = tryCatch(async (req, res, next) => {
  if (!req.user || !req.user._id) {
    return next(new ErrorHandler("User is not authenticated", 401));
  }
  const userID = req.user._id;
  const cart = await Cart.findOneAndDelete({ user: userID });
  if (!cart) {
    return next(new ErrorHandler("Cart not found", 404));
  }
  res.status(200).json({
    success:true,
    message:"cart cleared Successfully..."
  })
});


// 