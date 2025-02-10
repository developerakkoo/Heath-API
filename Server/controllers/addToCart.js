const Medicine = require("../models/medicineModel");
const ErrorHandler = require("../utils/ErrorHandling");
const tryCatch = require("../middleware/tryCatch");
const Cart = require("../models/cartModel");

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
  const cartItem = cart.cartItems.find((item) => item.product.equals(productId));
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
