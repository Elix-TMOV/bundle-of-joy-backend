import Room from "../models/RoomModel.js";
import User from "../models/userModel.js";

export const CreateRoom = async (req, res) => {
    const {hostSocketId, hostUserId, gameBeingPlayed, isPrivate, requiredParticipants, turns} = req.body;
    console.log(requiredParticipants)
    if (!hostUserId) {
        return res.status(400).json({message: "Host id was not provided"});
    }
    // Check if the user is already in a room
    const user = await User.findById(hostUserId);
    if (user.inRoom) {
        return res.status(400).json({message: "Already in a room"});
    }
    try {
        const hostTurn = turns[0]
        const gameState = {'turnsAndPlayers': {[user.id]: {turn: hostTurn, active: true, username: user.username}}}
        const room = await Room.create({ 
            hostSocketId,
            gameBeingPlayed,
            requiredParticipants,
            isPrivate,
            participants: [hostUserId], // Add the hostUserId to the participants list
            turns: turns,
            gameState: JSON.stringify(gameState)
        });

        await room.populate('participants', 'username')

        // Set the user's inRoom attribute to true
        user.inRoom = true;
        await user.save();

        return res.status(201).json('Room created successfully');
    }
    catch (err) {
        console.log('err while creating the room', err)
        return res.status(500).json({ message: err.message });
    }
}

export const getVacantPublicRooms = async (req, res) => {
    try {
        const rooms = await Room.find({
            isPrivate: false,
            $expr: { $lt: [ { $size: "$participants" }, "$requiredParticipants" ] }
        }).populate('participants', 'username'); // Populate the 'participants' field with the 'username' field from the User collection

        return res.status(200).json(rooms);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

export const joinRoom = async (req, res) => {
    const {hostSocketId, userId} = req.body;
    // Check if the user is already in a room
    const user = await User.findById(userId);
    if (user.inRoom) {
        return res.status(400).json({message: "Already in a room"});
    }
    try{
        const room = await Room.findOne({ hostSocketId });
        if (!room) {
            console.log(true)
            return res.status(404).json({message: 'Room does not exist'}); 
        }
        else if (room.participants.length === room.requiredParticipants) {
            return res.status(403).json({message: 'Room is full'}); 
        }
        // check if the user wasn't in the room before
        let gameState = JSON.parse(room.gameState);
        const wasInTheRoom = gameState && gameState.turnsAndPlayers && gameState.turnsAndPlayers[userId]
        // if the room has started then only allow re-joining players 
        if (room.started && !wasInTheRoom) {
            return res.status(403).json({message: 'Room Has Started'})
        }

        room.participants.push(userId)
        if (!wasInTheRoom){
            const turn = room.turns[room.participants.indexOf(userId)]
            gameState['turnsAndPlayers'][user.id] = {turn: turn, active: true, username: user.username}
            room.gameState = JSON.stringify(gameState);
        }
        await room.save();

        // Set the user's inRoom attribute to true
        user.inRoom = true;
        await user.save();

        return res.status(201).json({ message: 'Room joined successfully'});
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

export const deleteRoom = async (req, res) => {
    const {hostSocketId} = req.body;
    try {
        await Room.deleteOne({ hostSocketId });
        return res.status(200).json({ message: 'Room deleted successfully' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

export const leaveRoom = async (req, res) => {
    const {hostSocketId, userId} = req.body;
    console.log(hostSocketId, userId)
    if (userId) {
        // Set the user's inRoom attribute to false
        const user = await User.findById(userId);
        user.inRoom = false;
        console.log('user in room prop was removed', user.inRoom)
        await user.save();
    }
    if (hostSocketId) {
        try {
            // Find the room by hostSocketId
            const room = await Room.findOne({ hostSocketId });
            if (!room) {
                return res.status(404).json({message: 'Room not found'});
            }
    
            // Remove the user from the participants array
            const index = room.participants.indexOf(userId);
            if (index > -1) {
                room.participants.splice(index, 1);
            }
    
            // Check if the participants array is empty
            if (room.participants.length === 0) {
                // Delete the room if no participants are left
                await Room.findByIdAndDelete(room._id);
            } else {
                // Save the room if there are still participants
                await room.save();
            }
    
            return res.status(200).json({ message: 'Left room successfully' });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }
}
