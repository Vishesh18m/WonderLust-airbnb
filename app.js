if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const methodOverride = require("method-override");      // 1. to convert POST to PUT methode of form in edit.ejs
const path = require("path");                           // 2. to connect with views folder and access templates
const ejsMate = require("ejs-mate");                    // 3. to make same nevbar and footer require ejs mate
const ExpressError = require("./utils/ExpressError.js");

const session = require("express-session");
const MongoStore = require('connect-mongo');

const flash = require("connect-flash");

const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const dbUrl = process.env.ATLASDB_URL ;

app.use(methodOverride("_method"));                     // 1. 
app.set("view engine", "ejs");                           // 2. 
app.set("views", path.join(__dirname, "views"));        // 2. 
app.use(express.urlencoded({ extended: true }));          // 4. to parse data and make it available in req.body
app.engine("ejs", ejsMate);                              // 3.
app.use(express.static(path.join(__dirname, "/public")));  // 5. to access static files like css files from public folder

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 48*3600,
});
store.on("error", (err) => {
    console.log("ERROR in Mongo Session Store",err);
})

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false ,
    saveUninitialized: true,
    cookie: {
        expires: Date.now()+ 1000*60*60*24*7,    // 7days
        maxAge: 1000*60*60*24*7,
        httpOnly: true,
    }
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) =>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});


// connecting DATA BASE
const mongoURL = "mongodb://127.0.0.1:27017/airbnb_DB";
main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(dbUrl);
}

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);

// root route 
app.all(/.*/,(req,res,next) => {
    res.redirect("/listings");
    next(new ExpressError(404,"Page Not Found!"));
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong!";
  res.render("error.ejs", {message});
//   res.status(statusCode).send(message);
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

// http://localhost:8080/listings

// Kunal@@yash1
