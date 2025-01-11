const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  speciality: {
    type: String,
    required: true,
  },
  education: {
    type: String,
    required: true,
  },
  experience: {
    type: String,
    required: true,
  },
  about: {
    type: String,
    required: true,
  },
  available: {
    type: Boolean,
    default: true,
  },
  fees: {
    audio: {
      type: Number,
      required: true,
    },
    video: {
      type: Number,
      required: true,
    },
  },
  durations: {
    audio: {
      type: Number, // Duration in minutes for audio session
      required: true,
    },
    video: {
      type: Number, // Duration in minutes for video session
      required: true,
    },
  },
  slots_booked: [
    {
      date: { type: Date, required: true },
      timeSlots: [{ type: String, required: true }],
    },
  ],
  patientsAttended: {
    type: Number,
    default:0
  },
  totalLikes: {
    type: Number,
    default:0
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
  likes: [{ type: mongoose.Schema.ObjectId, ref: "PhoneUser" }], // Reference to PhoneUser model
  likeCount: { type: Number, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Doctor", doctorSchema);
