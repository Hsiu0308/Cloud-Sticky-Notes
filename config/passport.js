const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20");
const User = require("../models/user-model");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");

passport.serializeUser((user, done) => {
  console.log("serializeUser...");
  //   console.log(user);
  return done(null, user._id); //將mongoDB的_id存入session
});

passport.deserializeUser(async (_id, done) => {
  //   console.log("Deserialize使用者...");
  let foundUser = await User.findOne({ _id });
  return done(null, foundUser);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/redirect",
    },
    async (accessToken, refreshToken, profile, done) => {
      //   console.log("進入Google Strategy");
      //   console.log("Profile:", profile);
      console.log("==========================");

      let foundUser = await User.findOne({ googleID: profile.id }).exec();
      if (foundUser) {
        console.log("使用者已註冊，無需存入資料庫。");
        return done(null, foundUser);
      } else {
        console.log("偵測到新用戶，須將資料存入資料庫。");
        let newUser = new User({
          name: profile.displayName,
          googleID: profile.id,
          thumbnail: profile.photos[0].value,
          email: profile.emails[0].value,
        });
        let savedUser = await newUser.save();
        console.log("成功創建新用戶。");
        done(null, savedUser);
      }
    }
  )
);

passport.use(
  new LocalStrategy(async (username, password, done) => {
    let foundUser = await User.findOne({ email: username }).exec();

    if (foundUser) {
      let result = await bcrypt.compare(password, foundUser.password);
      if (result) {
        console.log("登入成功");
        return done(null, foundUser);
      } else {
        return done(null, false, { message: "密碼錯誤" });
      }
    } else {
      console.log("找不到使用者");
      return done(null, false, { message: "找不到使用者" });
    }
  })
);
