import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose'; // Imports the plugin that:
    // Adds username, hash, salt
    // Adds auth helper methods
    // Used for user authentication, not meetings
const Schema = mongoose.Schema;

const userSchema = new Schema ({ // Creates a new schema definition
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    history: [
        {
            meetingCode: {
                type: String,
                required: true
            },
            about: {
                type: String,
                default: ""
            },
            ownerUsername: {
                type: String,
                default: ""
            },
            joinedAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
})

userSchema.plugin(passportLocalMongoose); // Extends the schema with:
    // username, hash, salt
    // methods like register(), authenticate()
    // This is what makes Passport work with MongoDB

export default mongoose.model('User', userSchema);
