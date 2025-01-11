const mongoose = require("mongoose");
const validator = require("validator");

const UserProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "PhoneUser",
    required: true,
  },
  personalInformation: {
    fullName: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      validate: [validator.isEmail, "Please valid Email"],
    },
    emergencyContactNumber: {
      type: Number,
      // required: [true, "Emergency Contact Number is required"],
    },
    address: {
      flat: {
        type: String,
      },
      buildingName: {
        type: String,
      },
      addressLine: {
        type: String,
      },
      pincode: {
        type: String,
        validate: {
          validator: function (value) {
            return /^[0-9]{6}$/.test(value); // Ensures pincode is 6 digits
          },
          message: (props) => `${props.value} is not a valid 6-digit pincode`,
        },
      },
    },
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
  },
  height: {
    feet: {
      type: Number,
    },
    inches: {
      type: Number,
    },
  },
  bloodGroup: {
    type: String,
  },
  birthday: {
    date: { type: Number },
    month: { type: Number },
    year: { type: Number },
  },
  medicalHistory: {
    allergies: {
      type: Boolean, // True if the user has allergies
      default: false,
    },
    recentOperations: {
      type: Boolean, // True if the user had recent operations
      default: false,
    },
    exercise: {
      type: Boolean, // True if the user exercises
      default: false,
    },
    diet: {
      type: String,
      enum: ["Loose diet", "Strict diet", "No diet plan"],
      default: "No diet plan",
    },
    drinkingHabit: {
      type: String,
      enum: [
        "1-2 glasses a day",
        "2-4 glasses a day",
        "More than 5 glasses a day",
        "I don't drink",
      ],
      default: "I don't drink",
    },
    smokingHabit: {
      type: String,
      enum: ["Yes, very often", "No, I don't smoke", "Sometimes, I smoke"],
      default: "No, I don't smoke",
    },
  },
});

module.exports = mongoose.model("UserProfile", UserProfileSchema);
