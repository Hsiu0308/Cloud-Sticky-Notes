const router = require("express").Router();
const passport = require("passport");
const User = require("../models/user-model");
const bcrypt = require("bcrypt");

router.get("/login", (req, res) => {
  return res.render("login", { user: req.user });
});

router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    return res.redirect("/");
  });
});

router.get("/signup", (req, res) => {
  return res.render("signup", { user: req.user });
});

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

router.post("/signup", async (req, res) => {
  let { name, email, password } = req.body;
  if (password.length < 8) {
    req.flash("error_msg", "密碼長度需至少8個字元");
    return res.redirect("/auth/signup");
  }

  //確認信箱是否已被註冊
  const foundEmail = await User.findOne({ email }).exec();
  if (foundEmail) {
    req.flash("error_msg", "信箱已被註冊");
    return res.redirect("/auth/signup");
  }

  let hashedPassword = await bcrypt.hash(password, 12);
  let newUser = new User({
    name,
    email,
    password: hashedPassword,
  });
  await newUser.save();
  req.flash("success_msg", "註冊成功");
  return res.redirect("/auth/login");
});

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/auth/login",
    failureFlash: "登入失敗，請檢查帳號密碼是否正確",
  }),
  (req, res) => {
    console.log("Local登入成功...");
    return res.redirect("/profile");
  }
);

router.get("/google/redirect", passport.authenticate("google"), (req, res) => {
  console.log("進入redirect...");
  return res.redirect("/profile");
});

module.exports = router;
