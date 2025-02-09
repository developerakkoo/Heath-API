const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.ObjectId,
    ref: "UserProfile",
    required: true,
  },
  doctor:{
    type:mongoose.Schema.ObjectId,
    ref:"Doctor",
  },
  product:{
    type:mongoose.Schema.ObjectId,
    ref:"Medicine",
  },
  
});
