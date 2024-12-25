const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    required: [true, "Please Enter Email"],
    unique: true,
    validator: [validator.isEmail, "Please Enter valid Email"],
  },
  password: {
    type: String,
    required: [true, "Please Enter password"],
    minLength: [8, "Password should be greater than 8 characters"],
    select: false,
    validate: {
      validator: function (value) {
        return /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9]).{8,}$/.test(value);
      },
      message:
        "Password must contain at least one uppercase letter, one symbol, and one number",
    },
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  mobile: {
    type: Number,
    validate: {
      validator: function (value) {
        return /^[0-9]{10}$/.test(value);
      },
      message: (props) => `${props.value} is not equal to 10`,
    },
    required: [true, "Number field is required"],
  },
});

module.exports = mongoose.model("User", userSchema);
