const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth-routes");
const profileRoutes = require("./routes/profile-routes");
require("./config/passport");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");

// Connect to MongoDB
const mongoDB = process.env.MONGODB_URI || "mongodb://localhost:27017/googleDB";

mongoose
  .connect(mongoDB)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((e) => {
    console.log(e);
  });

// Middleware
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

// Routes
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);

app.get("/", (req, res) => {
  return res.render("index", { user: req.user });
});

app.get(/.*/, (req, res) => {
  res.status(404).render("404", { user: req.user });
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});
