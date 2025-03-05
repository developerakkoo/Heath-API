const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhoneUser",
      required: true,
    },
    cartItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Medicine",
          required: true,
        },
        name: String,
        price: Number,
        quantity: {
          type: Number,
          default: 1,
        },
        images:String,
      },
    ],
    totalPrice: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

cartSchema.pre("save", function (next) {
  this.totalPrice = this.cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  next();
});

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;