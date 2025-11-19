const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  author: String,
  color: {
    type: String,
    default: "yellow", // 預設：黃色
    enum: ["yellow", "blue", "green", "pink"],
  },
});

module.exports = mongoose.model("Post", postSchema);
