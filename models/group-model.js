const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  // 群組專屬的通行碼，知道這個碼的人才能加入
  passcode: {
    type: String,
    required: true,
    unique: true, // 代碼不能重複
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // 紀錄群組裡有哪些成員
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
  theme: {
    type: String,
    default: "family",
    enum: ["family", "work"],
  },
});

module.exports = mongoose.model("Group", groupSchema);
