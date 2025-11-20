const router = require("express").Router();
const Group = require("../models/group-model");
const Post = require("../models/post-model");

// 檢查登入 middleware
const authCheck = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    return res.redirect("/auth/login");
  }
};

// 群組大廳：列出加入的群組 + 建立/加入表單
router.get("/", authCheck, async (req, res) => {
  // 找出「成員名單」包含目前使用者的所有群組
  let myGroups = await Group.find({ members: req.user._id });
  return res.render("groups", { user: req.user, groups: myGroups });
});

// 建立新群組
router.post("/create", authCheck, async (req, res) => {
  let { title, passcode, theme } = req.body; // ▼ 接收 theme
  try {
    let foundGroup = await Group.findOne({ passcode });
    if (foundGroup) {
      req.flash("error_msg", "此通行碼已被使用，請換一個");
      return res.redirect("/groups");
    }

    let newGroup = new Group({
      title,
      passcode,
      theme, // ▼ 存入資料庫
      creator: req.user._id,
      members: [req.user._id],
    });
    await newGroup.save();
    return res.redirect("/groups");
  } catch (e) {
    req.flash("error_msg", "建立失敗");
    return res.redirect("/groups");
  }
});

// 加入現有群組
router.post("/join", authCheck, async (req, res) => {
  let { passcode } = req.body;
  try {
    let group = await Group.findOne({ passcode });
    if (!group) {
      req.flash("error_msg", "找不到此通行碼的群組");
      return res.redirect("/groups");
    }

    // 檢查是否已經在群組內
    if (group.members.includes(req.user._id)) {
      req.flash("error_msg", "你已經在這個群組了");
      return res.redirect("/groups");
    }

    // 加入成員
    group.members.push(req.user._id);
    await group.save();
    return res.redirect("/groups");
  } catch (e) {
    req.flash("error_msg", "加入失敗");
    return res.redirect("/groups");
  }
});

// 進入群組牆
router.get("/:id", authCheck, async (req, res) => {
  let { id } = req.params;
  try {
    let group = await Group.findById(id);

    // 安全檢查：確認使用者是成員才能看
    if (!group.members.includes(req.user._id)) {
      req.flash("error_msg", "你不是這個群組的成員");
      return res.redirect("/groups");
    }

    // 搜尋屬於這個群組的貼文
    let posts = await Post.find({ group: id }).populate("group");

    return res.render("group-wall", { user: req.user, group, posts });
  } catch (e) {
    return res.redirect("/groups");
  }
});

router.get("/:id/post", authCheck, async (req, res) => {
  let { id } = req.params;
  try {
    return res.render("post", {
      user: req.user,
      action: `/groups/${id}/post`,
    });
  } catch (e) {
    return res.redirect("/groups/" + id);
  }
});

// 在群組貼文
router.post("/:id/post", authCheck, async (req, res) => {
  let { id } = req.params;
  let { title, content, color } = req.body;
  try {
    let newPost = new Post({
      title,
      content,
      color,
      author: req.user._id,
      authorName: req.user.name,
      group: id,
    });
    await newPost.save();
    return res.redirect("/groups/" + id);
  } catch (e) {
    return res.redirect("/groups/" + id);
  }
});

// 退出群組
router.get("/:id/leave", authCheck, async (req, res) => {
  let { id } = req.params;
  try {
    let group = await Group.findById(id);

    // 先移除成員
    group.members.pull(req.user._id);
    await group.save();

    // 自動清理機制：檢查是否還有成員
    if (group.members.length === 0) {
      // 刪除該群組的所有貼文 (Post)
      await Post.deleteMany({ group: id });

      // 刪除群組本身 (Group)
      await Group.findByIdAndDelete(id);

      console.log(`群組 ${group.title} 已清空並自動刪除`);
    }

    return res.redirect("/groups");
  } catch (e) {
    console.log(e);
    return res.redirect("/groups");
  }
});

// 編輯群組貼文 (顯示頁面)
router.get("/:groupId/post/edit/:postId", authCheck, async (req, res) => {
  let { groupId, postId } = req.params;
  try {
    let post = await Post.findOne({ _id: postId });
    // 只有作者本人可以編輯
    if (post && post.author === req.user._id.toString()) {
      return res.render("edit-post", {
        user: req.user,
        post,
        action: `/groups/${groupId}/post/edit/${postId}`, // 告訴表單：改完送回這裡
        backURL: `/groups/${groupId}`,
      });
    }
    return res.redirect(`/groups/${groupId}`);
  } catch (e) {
    return res.redirect(`/groups/${groupId}`);
  }
});

// 編輯群組貼文 (處理更新)
router.post("/:groupId/post/edit/:postId", authCheck, async (req, res) => {
  let { groupId, postId } = req.params;
  let { title, content, color } = req.body;
  try {
    await Post.findOneAndUpdate(
      { _id: postId, author: req.user._id }, // 確保是本人
      { title, content, color },
      { new: true, runValidators: true }
    );
    return res.redirect(`/groups/${groupId}`);
  } catch (e) {
    return res.redirect(`/groups/${groupId}`);
  }
});

// 刪除群組貼文
router.get("/:groupId/post/delete/:postId", authCheck, async (req, res) => {
  let { groupId, postId } = req.params;
  try {
    let post = await Post.findOne({ _id: postId });
    let group = await Group.findById(groupId);

    if (
      post &&
      (post.author === req.user._id.toString() ||
        group.creator.toString() === req.user._id.toString())
    ) {
      await Post.deleteOne({ _id: postId });
    }
    return res.redirect(`/groups/${groupId}`);
  } catch (e) {
    return res.redirect(`/groups/${groupId}`);
  }
});

module.exports = router;
