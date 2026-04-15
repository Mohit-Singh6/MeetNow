import User from "../models/user.js";
import httpStatus from 'http-status';

const signupForm = (req,res) => {
    res.status(httpStatus.OK).redirect('/signup');
};

// const signup = async (req, res, next) => {
//     try {
//         const { name, username, email, password } = req.body;

//         const user = new User({ name, email, username });
//         const registeredUser = await User.register(user, password);

//         // Auto-login after signup (kept, still useful)
//         req.login(registeredUser, (err) => {
//             if (err) return next(err);

//             // 🔹 CHANGE: send JSON instead of redirect / flash
//             res.status(httpStatus.CREATED).json({
//                 success: true,
//                 message: "Signup successful",
//                 user: {
//                     id: registeredUser._id,
//                     username: registeredUser.username,
//                     email: registeredUser.email
//                 }
//             });
//         });

//     } catch (error) {
//         // 🔹 CHANGE: send JSON error instead of redirect / flash
//         res.status(httpStatus.BAD_REQUEST).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

const signup = async (req, res, next) => {
    try {
        const { name, username, email, password } = req.body;

        const user = new User({ name, email, username });
        const registeredUser = await User.register(user, password);

        // Send success response - user will manually login on frontend
        return res.status(httpStatus.CREATED).json({ // itna data bhejne ki bhi zaroorat nahi hai!
            success: true,
            message: "Signup successful! Please log in.",
            user: {
                id: registeredUser._id,
                username: registeredUser.username,
                email: registeredUser.email
            }
        });
        

    } catch (error) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: error.message || "Signup failed. Please try again."
        });
    }
};


const loginForm = (req,res) => {
    res.status(httpStatus.OK).redirect('/login');
};

const login = async (req,res) => {
    return res.status(httpStatus.OK).json({
        success: true,
        message: "Login successful!."
    });
};

const logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        
        req.session.destroy((sessionErr) => {
            if (sessionErr) {
                return next(sessionErr);
            }

            res.clearCookie("connect.sid", {
                path: '/',
                httpOnly: true
            });
            return res.status(httpStatus.OK).json({
                success: true,
                message: "Successfully logged out!"
            });
        });
    });
};

const sessionStatus = (req, res) => {
    return res.status(httpStatus.OK).json({
        authenticated: req.isAuthenticated(),
        user: req.user ? {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email
        } : null
    });
};

const getUserHistory = async(req, res) => {
    const user = await User.findById(req.user._id).select("history");

    return res.status(httpStatus.OK).json({
        success: true,
        history: user?.history || []
    });
};

const addToHistory = async(req, res) => {
    const meetingCode = req.body?.meetingCode?.trim();

    if (!meetingCode) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: "Meeting code is required."
        });
    }

    const historyEntry = {
        meetingCode,
        joinedAt: new Date()
    };

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $pull: { history: { meetingCode } }
        }
    );

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $push: {
                history: {
                    $each: [historyEntry],
                    $position: 0
                }
            }
        }
    );

    return res.status(httpStatus.OK).json({
        success: true,
        message: "Meeting saved to history."
    });
};

export {signupForm, signup, loginForm, login, logout, sessionStatus, getUserHistory, addToHistory};
