const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  skillsHave: {
    type: [String],
    default: []
  },

  skillsWant: {
    type: [String],
    default: []
  },

  rating: {
    type: Number,
    default: 0
  },

  isBanned: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);