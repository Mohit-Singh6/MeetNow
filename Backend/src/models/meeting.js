import mongoose from 'mongoose';
import bcrypt from 'bcrypt'; 
// Used to hash and verify meeting passwords securely

const Schema = mongoose.Schema;
// Shortcut reference to mongoose Schema constructor

const meetingSchema = new Schema({

    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
        // References the User who created the meeting (host/owner)
    },

    meetingCode: {
        type: String,
        required: true,
        unique: true
        // NOT the primary DB identifier, the identifier is the key automatically created by mongoDB
    },

    meetingPasswordHash: { // this is optional, Public meeting → no password
        // Private / sensitive meeting → password
        type: String,
        default: null
        // Stores bcrypt-hashed meeting password
    },

    about: {
        type: String,
        default: ""
        // Optional meeting description / agenda
    },

    maxParticipants: {
        type: Number,
        default: 4,
        max: 6
        // P2P-safe participant limit
        // Backend enforces upper bound
    },

    status: {
        type: String,
        enum: ['scheduled', 'live', 'ended'],
        default: 'scheduled'
        // Controls meeting lifecycle
        // Used by guards to allow/deny joins
    },

    createdAt: {
        type: Date,
        default: Date.now
        // Timestamp when meeting was created
    }

});

export default mongoose.model('Meeting', meetingSchema);