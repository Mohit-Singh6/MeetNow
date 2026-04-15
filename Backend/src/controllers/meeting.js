// const index = async (req, res, next) => {
//     res.send("<h2>No one is here yet!</h2>");
// };

// export default index;

import Meeting from "../models/meeting.js";
import httpStatus from 'http-status';

const createMeetingForm = (req,res) => {
    res.status(httpStatus.OK).send('Create meeting Form');
};

const createMeeting = async (req,res, next) => {
    
        const data = req.body.meeting;
        data.owner = req.user._id; // assigning the current logged in user as it's owner
        
        console.log(data);
        const newData = new Meeting(data);
        await newData.save();
        res.status(httpStatus.CREATED).send('Meeting created!');

    // flash message
    // req.flash('success', "New art uploaded successfully.");

    // the general middleware for saving this in locals will be in app.js because if i do it here then after i redirect then the variables/data will be lost, alternative would be to initialize it just before you render the page (should be no redirecting afterwards - ex: in line 30 (where the comment SHOW ARTS is there))

    // res.redirect('/');
};

const getMeeting = async (req,res) => {

        const meetingCode = req.params.meetingCode;
        const meeting = await Meeting.findOne({meetingCode});
    
        if (!meeting) {
            // req.flash('err', "The meeting you are looking for - does not exist or was deleted!");
            // res.redirect('/');
            return res
                .status(httpStatus.NOT_FOUND)
                .send("No meeting found!");
        }
        else if (meeting.status === 'ended') {
            return res
                .status(httpStatus.GONE)
                .send("Meeting was ended!");
        }
        else if (meeting.meetingPasswordHash) {
            return res
                .status(httpStatus.OK)
                .send("Enter password!");
            // password validation will happen in joinMeeting
        }

        // if meeting has no password and is valid, frontend can proceed
        res.status(httpStatus.OK).send("Meeting is available");

};

const joinMeeting = async (req,res) => {
    const meetingCode = req.params.meetingCode?.trim();

    if (!meetingCode) {
        return res
            .status(httpStatus.BAD_REQUEST)
            .send("Meeting code is required!");
    }
    
    if (!req.user || req.user.isActive === false) {
        return res
            .status(httpStatus.FORBIDDEN)
            .send("You are not allowed to join this meeting!");
    }

    res.status(httpStatus.OK).send("Successfully entered!");
};

const deleteMeeting = async (req, res, next) => {
    const meetingCode = req.params.meetingCode;
    const meeting = await Meeting.findOne({meetingCode});
    if (!meeting) {
        // req.flash('err', "The meeting you are looking for - does not exist or was deleted!");
        // res.redirect('/');
        return res
            .status(httpStatus.NOT_FOUND)
            .send("No meeting found!");
    }
    else if (!meeting.owner.equals(req.user._id)) {
        return res
            .status(httpStatus.FORBIDDEN)
            .send("You are not allowed to delete this meeting");
    }
    await Meeting.findByIdAndDelete(meeting._id);
    res.status(httpStatus.OK).send("Meeting deleted!");
};

export {createMeetingForm, createMeeting, getMeeting, joinMeeting, deleteMeeting};
