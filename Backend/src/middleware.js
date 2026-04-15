import myError from './utilities/myError.js';
// import {listing} from './models/listing.js';
// import {review} from './models/review.js';

// const {reviewSchema, artSchema} = require("./schema.js");

// module.exports.validateArt = (req,res,next) => {
//     const {error} = artSchema.validate(req.body);
//     if (error) {
//         let errMsg = error.details.map((el) => el.message).join(", ");
//         console.log(error.details);
//         throw new myError (400, errMsg);
//     }
//     else next();
// }

// module.exports.validateReview = (req,res,next) => {
//     const {error} = reviewSchema.validate(req.body);
//     if (error) {
//         let errMsg = error.details.map((el) => el.message).join(", ");
//         console.log(error.details);
//         throw new myError (400, errMsg);
//     }
//     else next();
// }



export const isLoggedIn = (req, res, next) => {
    console.log(req.originalUrl, req.path);
    req.session.redirectUrl = req.originalUrl; // yahan par res.locals nahi kaam karega because redirect karte hi res.locals will get reseted. 
    if (!req.isAuthenticated()) {
        req.flash('err',"Login to proceed with the operation");
        return res.redirect('/login');
    }
    next();
};

export const redirectUrlSave = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

// export const isOwner = async (req, res, next) => {
//     const data = await listing.findById(req.params.id);
//     if (res.locals.currUser && !data.owner._id.equals(res.locals.currUser._id)) {
//         req.flash('err',"You don't have the permission to make the following changes!");
//         return res.redirect('/arts/' + req.params.id);
//     }
//     next();
// }

// module.exports.isRevOwner = async (req, res, next) => {
//     const {reviewId} = req.params;
//     const data = await review.findById(reviewId);
//     if (res.locals.currUser && !data.owner._id.equals(res.locals.currUser._id)) {
//         req.flash('err',"You don't have the permission to make the following changes!");
//         return res.redirect('/arts/' + req.params.id);
//     }
//     next();
// }