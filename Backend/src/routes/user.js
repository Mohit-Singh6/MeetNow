import express from 'express';
import wrapAsync from '../utilities/wrapAsync.js';
import {signupForm, signup, loginForm, login, logout, sessionStatus, getUserHistory, addToHistory} from '../controllers/user.js';

// const { validateArt } = require('../middleware.js');
// const { isLoggedIn, isOwner } = require('../middleware.js');

// import { redirectUrlSave } from '../middleware.js';
import passport from 'passport';
import { isLoggedIn } from '../middleware.js';

const router = express.Router();

    // Using router.route

// sign up
router
    .route('/signup')
    .get (signupForm)
    .post(wrapAsync (signup));

// log in
router
    .route('/login')
    .get(loginForm)
    .post((req, res, next) => {
        passport.authenticate("local", (err, user, info) => {
            if (err) {
                return next(err);
            }

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: info?.message || "Invalid username or password"
                });
            }

            req.logIn(user, (loginErr) => {
                if (loginErr) {
                    return next(loginErr);
                }

                return res.status(200).json({
                    success: true,
                    message: "Login successful!",
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email
                    }
                });
            });
        })(req, res, next);
    });

    // passport.authenticate => // used for authentication and if it succeeds, this will automatically login the user and [create a session but only when you are using passport.session() + express-session ]

router.get('/auth/session', sessionStatus);
router.get('/user/history', isLoggedIn, wrapAsync(getUserHistory));
router.post('/user/history', isLoggedIn, wrapAsync(addToHistory));

// router.post("/login", (req, res, next) => {
//   console.log("Login attempt with:", { username: req.body.username });
  
//   passport.authenticate("local", (err, user, info) => {
//     console.log("Passport callback - err:", err, "user:", user, "info:", info);
    
//     if (err) {
//       console.error("Auth error:", err);
//       return next(err);
//     }
    
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: info?.message || "Invalid username or password"
//       });
//     }
    
//     req.logIn(user, (logInErr) => {
//       if (logInErr) {
//         console.error("Login error:", logInErr);
//         return next(logInErr);
//       }
      
//       return res.status(200).json({
//         success: true,
//         message: "Login successful!",
//         user: {
//           id: user._id,
//           username: user.username,
//           email: user.email
//         }
//       });
//     });
//   })(req, res, next);
// });


// log out
router.get('/logout', logout);

export default router;
