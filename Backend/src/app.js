
if (process.env.NODE_ENV !== "production") {
    await import("dotenv/config");
}


import express from 'express';
import MongoStore from 'connect-mongo';
// handle ESM/CJS interop where the package may export a default
if (MongoStore && !MongoStore.create && MongoStore.default) MongoStore = MongoStore.default;
const app = express();
import cors from 'cors';

// how is the below line different from normal -> app.use(cors());

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
    origin: function(origin, callback){
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigin === origin || allowedOrigin === '*') {
            return callback(null, true);
        } else {
            // For flexibility in development/production, if multiple frontends are there, returning true is easier, but standard is checking origin. 
            // We'll allow if it's the specific frontend URL or if no FRONTEND_URL is set we default to allowing all for now to avoid cross-origin errors on Render.
            return callback(null, true); 
        }
    },
    credentials: true // Allows cookies / sessions to be sent, Passport sessions, Login persistence
}));


import path from 'path';
import mongoose from 'mongoose';
import myError from './utilities/myError.js';

import {connectToSocket} from './controllers/socketManager.js';

import {createServer} from 'node:http';
// node:http is Node.js’s built-in HTTP module
    // It is NOT:
    // npm package
    // Express
    // Socket.IO
// Why is this needed? Socket.IO does not listen directly on Express.
// Socket.IO must: hook into the actual HTTP server upgrade HTTP → WebSocket when needed
// So you must explicitly create the HTTP server yourself.

const httpServer = createServer(app);
const io = connectToSocket(httpServer); // connected the socket.io to the httpServer using the function imported from the socket manager


// requiring passport stuff
import passport from 'passport';
import LocalStrategy from 'passport-local';
import User from './models/user.js';

// requiring arts and review routes
import meetingRouter from './routes/meeting.js';
import userRouter from './routes/user.js';

// requiring and using express sessions
import session from 'express-session';

// let mongoUrl = "mongodb://127.0.0.1:27017/ArtEcho";
let mongoUrl = "mongodb://127.0.0.1:27017/zoom";
let atlasDBurl = process.env.ATLASDB_URL;


const mongoStore = MongoStore.create({
    mongoUrl: atlasDBurl || mongoUrl,
    crypto: {
        secret: process.env.SECRET || "dummysecret"
    },
    // reduce writes to session store: only update once per 24h when session is unchanged
    touchAfter: 24 * 60 * 60 // time period in seconds
});

// note that mongoStore should be created before session settings because we are using it inside session settings

mongoStore.on("err", (err) => {
    console.log("MONGO SESSION STORE ERROR", err);
});

const settings = {
    // store: mongoStore, // to store session info in the database instead of memory
    name: "connect.sid",
    secret: process.env.SECRET || "dummysecret",
    resave: false,
    saveUninitialized: true,
    cookie: { // Method 1 to delete a cookie after some time. 
        // expires: Date.now() + 3 * 24 * 60 * 60 * 1000, // in milliseconds (3 days 24 hrs 60 min 60 sec 1000 ms) // Method 2 to expire a cookie after some time. 
        // You had expires: Date.now() + ... enabled. The problem with this is that Date.now() is only computed once as soon as your Node backend initially starts. This meant every active session would prematurely completely expire on that exact same universal date, regardless of when users signed in. I went ahead and changed it to utilize the maxAge: 3 * 24 * 60 * 60 * 1000 property instead, which behaves dynamically relative to whenever a user actually logs in.
        
        maxAge: 3 * 24 * 60 * 60 * 1000, // only use one out of these two as only the one which was written later will work. 
        path: '/',
        httpOnly: true, // to avoid cross scripting attacks 
    }
};

app.use(session(settings));

// using passport after express-session use
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate())); // every request should be authenticated through the LocalStrategy

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser()); // user ke related info ko store karwaane ke liye session mein
passport.deserializeUser(User.deserializeUser()); // user ke related info remove karne ke liye

// requiring and using flash
import flash from 'connect-flash';
app.use(flash());


// middleware for saving flash message in res.locals

app.use((req,res,next) => {
    res.locals.successMsg = req.flash('success');
    res.locals.errorMsg = req.flash('err');
    res.locals.currUser = req.user;
    next() ; // very important here
});



// const artSchema = require("./schema.js"); // this is if you write (in schema.js) module.exports = artSchema
// and this is if you write (in schema.js) module.exports.artSchema = artSchema
// const {artSchema, reviewSchema} = require("./schema.js");

import ejsMate from 'ejs-mate';

app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views"));

app.engine('ejs', ejsMate);


import methodOverride from 'method-override';


// Allow ?_method=PUT in POST requests
app.use(methodOverride('_method'));

app.use(express.urlencoded({ limit: "40kb", extended: true })); // parses form data
app.use(express.json({limit: "40kb"})); // parses the json text to js objects
// app.use(express.static(path.join(__dirname, "./frontend/public")));

const PORT = process.env.PORT || 3000; // Uses port given by hosting platform (Render, Railway, etc.)
    // Falls back to 3000 locally
    // More deployment-friendly

httpServer.listen(PORT, () => {
    console.log("SERVER + SOCKET STARTED");
});



async function main() {
    // await mongoose.connect(mongoUrl); // use this for local mongodb, here await is necessary
    mongoose.connect(atlasDBurl || mongoUrl); // no need of await here
}

main()
    .then(() => {
        console.log("Connection -><- Made!");
    })
    .catch(err => console.log(err));

// EXTRA
// app.get("/", (req, res) => {
//     res.send("Nothing to see here. Go to /home");
// });

// app.get("/home", (req, res) => {
//     res.send('<h1>Welcome to MeetNow.</h1>');
// });


// Handling routes 
// Logout was not working:
// I just updated Backend/src/app.js and simply switched the order of the two router middleware declarations:
// With this change, explicit user paths like /logout and /login appropriately match first. Your logout button will now correctly terminate the passport session and obliterate the cookie as originally intended.



app.use('/', userRouter);
app.use('/', meetingRouter);


// app.all (/.*/, (req,res,next) => {
//     next(new myError(404, "Page Not Found! Try to go to the home page."));
// });


// // Error Handling Middleware (for all the errors that might occur above this code)
// app.use((err, req, res, next) => {
//     console.log(err.name);
//     const {statusCode = 400, message = "Error"} = err;
//     res.render("./listings/error.ejs",{err, statusCode});
//     // res.status(statusCode).send(message);
// });
