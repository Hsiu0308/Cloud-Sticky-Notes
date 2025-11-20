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
  authorName: String,
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
  },
  color: {
    type: String,
    default: "yellow",
    enum: ["yellow", "blue", "green", "pink"],
  },
});

module.exports = mongoose.model("Post", postSchema);
