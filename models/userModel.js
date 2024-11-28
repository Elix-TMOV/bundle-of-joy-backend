import mongoose, { mongo } from "mongoose";
const { ObjectId } = mongoose.Schema

const userModel = mongoose.Schema({
    username: {
        type: String,
        trim: true,
        required: true,
        maxlength: 32,
        unique: true
    },
    
    password: {
        type: String,
        trim: true,
        required: true,
        minlength: 6
    },
    
    image: {
        url: String,
        public_id: String,
    },
    
    gamesPlayed: {
        type: Number,
        default: 0
    },

    gamesWon: {
        type: Number,
        default: 0
    },

    friends: [{
        type: ObjectId,
        ref: 'User'
    }],

    inRoom: {
        type: Boolean,
        default: false
    }
})

const User = mongoose.model("User", userModel);
export default User;