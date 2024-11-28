import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema

const RoomModel = mongoose.Schema({
    hostSocketId: {
        type: String,
        ref: 'User',
        required: true
    },
    
    gameBeingPlayed: {
        type: String,
        required: true
    },

    participants: [{
        type: ObjectId,
        ref: "User"
    }],

    started: {
        type: Boolean,
        default: false
    },

    requiredParticipants: {
        type: Number,
        required: true
    },

    isPrivate: {
        type: Boolean,
        default: false
    },

    gameState: {
        type: String,
        default: null
    },

    turns: [{
        type: String 
    }],

    createdAt: {
        type: Date,
        default: Date.now,
        expires: 2400
    }
});


// this line create the document in mongo db using the model we created above
const Room = mongoose.model('Room', RoomModel);

export default Room;