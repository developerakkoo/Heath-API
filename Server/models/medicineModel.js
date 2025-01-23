const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Enter Product Name"],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "Please Enter Product Price"],
    max: [99999999, "Price cannot exceed 8 digits"],
  },
  salePrice: {
    type: Number,
    // required: [true, "Please Enter Sale Price"],
    max: [99999999, "Sale Price cannot exceed 8 digits"],
  },
  discount: {
    type: Number,
    default: 0, 
  },
  description: {
    type: String,
    required: [true, "Please Enter Product Description"],
  },
  deliveryOptions: {
    standard: {
      time: { type: String, required: true }, // e.g., "5-7 days"
      price: { type: Number, required: true }, // e.g., 00
    },
    express: {
      time: { type: String, required: true }, // e.g., "1-2 days"
      price: { type: Number, required: true }, // e.g., 12.00
    },
  },
  selectedDelivery: {
    type: String,
    enum: ["standard", "express"],
    required: true,
  },
  ratings: {
    type: Number,
    default: 0,
  },
  numOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "UserProfile",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],

  images: {
    type: String,
    required: true,
  },
  category: {
    main: {
      type: String,
      required: [true, "Please specify the main category"], // e.g., "Medicine"
    },
    sub: {
      type: String,
      required: [true, "Please specify the subcategory"], // e.g., "Heart", "Headache"
    },
  },
  stock: {
    type: Number,
    required: [true, "Please Enter Product Stock"],
    default: 1,
  },
  likes: [{ type: mongoose.Schema.ObjectId, ref: "PhoneUser" }],
  likeCount: { type: Number, default: 0 },
  // user: {
  //   type: mongoose.Schema.ObjectId,
  //   ref: "PhoneUser",
  //   required: true,
  // },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

productSchema.pre("save", function(next){
  if(this.discount > 0)
  {
    this.salePrice = this.price - (this.price * this.discount)/100;
  }else{
    this.salePrice = this.price;
  }
  next();
})

const Product = mongoose.model("Medicine", productSchema);

module.exports = Product;
