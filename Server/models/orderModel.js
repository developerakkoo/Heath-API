const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  address: {
    type: mongoose.Schema.ObjectId,
    ref: "UserProfile",
    required: true,
  },
  orderItems: [
    {
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
      product: {
        type: mongoose.Schema.ObjectId,
        ref: "Medicine",
        required: true,
      },
      category: {
        main: {
          type: String,
          required: [true, "Please specify the main category"],
        },
        sub: {
          type: String,
          required: [true, "Please specify the subcategory"],
        },
      },
    },
  ],
  user: {
  type: mongoose.Schema.ObjectId,
  ref: "UserProfile",
  required: true,
},
  paymentInfo: {
    id: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
  },
  paidAt: {
    type: Date,
    required: true,
  },
  itemPrice: {
    type: Number,
    required: true,
  },
  shippingPrice: {
    type: Number,
    required: true,
  },
  deliveryOption: {
    time: { type: String }, // Delivery time from Product
    price: { type: Number }, // Delivery price from Product
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  orderStatus: {
    type: String,
    required: true,
    default: "Processing",
  },
  deliveredAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  voucher: {
    type: mongoose.Schema.ObjectId,
    ref: "Voucher",
    default: null,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;