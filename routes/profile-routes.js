const router = require("express").Router();
const Post = require("../models/post-model");

const authCheck = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    return res.redirect("/auth/login");
  }
};

router.get("/", authCheck, async (req, res) => {
  let postFound = await Post.find({ author: req.user._id });
  return res.render("profile", { user: req.user, posts: postFound });
});

// --- 新增貼文 (頁面) ---
router.get("/post", authCheck, (req, res) => {
  return res.render("post", { user: req.user });
});

// --- 新增貼文 (處理) ---
router.post("/post", authCheck, async (req, res) => {
  let { title, content, color } = req.body; // ▼ 多了 color
  let newPost = new Post({
    title,
    content,
    color, // ▼ 存入顏色
    author: req.user._id,
  });
  try {
    await newPost.save();
    return res.redirect("/profile");
  } catch (e) {
    req.flash("error_msg", "標題與內容為必填");
    return res.redirect("/profile/post");
  }
});

// --- 編輯貼文 (頁面) ---
router.get("/post/edit/:_id", authCheck, async (req, res) => {
  let { _id } = req.params;
  try {
    let post = await Post.findOne({ _id });
    if (post) {
      return res.render("edit-post", { user: req.user, post });
    }
    return res.redirect("/profile");
  } catch (e) {
    return res.redirect("/profile");
  }
});

// --- 編輯貼文 (處理) ---
router.post("/post/edit/:_id", authCheck, async (req, res) => {
  let { _id } = req.params;
  let { title, content, color } = req.body;
  try {
    // findOneAndUpdate (條件, 更新內容, 選項)
    await Post.findOneAndUpdate(
      { _id, author: req.user._id }, // 確保是本人才能改
      { title, content, color },
      { new: true, runValidators: true }
    );
    return res.redirect("/profile");
  } catch (e) {
    req.flash("error_msg", "更新失敗");
    return res.redirect("/profile");
  }
});

// --- 刪除貼文 ---
router.get("/post/delete/:_id", authCheck, async (req, res) => {
  let { _id } = req.params;
  try {
    let post = await Post.findOne({ _id });
    if (post && post.author === req.user._id.toString()) {
      // 修正: toString() 確保比對正確
      await Post.deleteOne({ _id });
    }
    return res.redirect("/profile");
  } catch (e) {
    console.log(e);
    return res.redirect("/profile");
  }
});

module.exports = router;
