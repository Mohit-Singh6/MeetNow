
import express from 'express';
import wrapAsync from '../utilities/wrapAsync.js';
import {createMeetingForm, createMeeting, getMeeting, joinMeeting, deleteMeeting} from '../controllers/meeting.js';
// const { validateArt } = require('../middleware.js');
import { isLoggedIn } from '../middleware.js';


const router = express.Router();

    // Using router.route

router
    .route('/')
    .get(isLoggedIn, wrapAsync(createMeetingForm))
    .post(isLoggedIn, wrapAsync(createMeeting));

router
    .route ('/:meetingCode')
    .get(wrapAsync(getMeeting))
    // .delete(isLoggedIn, isOwner, wrapAsync(deleteMeeting));
    .delete(isLoggedIn, wrapAsync(deleteMeeting));

router.post('/:meetingCode/join', isLoggedIn, wrapAsync(joinMeeting),
// socket join logic will come later inside controller
);

export default router;