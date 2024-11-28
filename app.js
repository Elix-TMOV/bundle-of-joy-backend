import express from "express";
import mongoose from "mongoose";
import cookieParser, { signedCookie } from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/auth.route.js";
import roomRouter from "./routes/rooms.route.js"
import http from "http";
import { Server } from "socket.io";
import Room from "./models/RoomModel.js";
import User from "./models/userModel.js";
import chessSocket from "./sockets/chessSocket.js";
import fakeArtistSocket from "./sockets/fakeArtistSocket.js";
import shobuSocket from "./sockets/shobuSocket.js";
import messageSocket from "./sockets/messageSocket.js";


// Load the .env file
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [process.env.CORS_ORIGIN || 'http://localhost:5173'],
        credentials: true
    }
});

// Use express.json() middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: [process.env.CORS_ORIGIN || 'http://localhost:5173'],
    credentials: true
}));
app.use("/api/auth", authRouter);
app.use("/api/room", roomRouter)

// MongoDB connection string
const db = process.env.DATABASE;

// Connect to MongoDB
mongoose.connect(db, { useNewUrlParser: true })
    .then(() => console.log('Successfully connected to MongoDB'))
    .catch(err => console.error('Connection error', err));

io.on("connection", (socket) => {
    let currentGameSocket = null; // Track the current game socket
    socket.on(`join-room`, async (roomSocketId) => {
        if (currentGameSocket && currentGameSocket.cleanup) {
            currentGameSocket.cleanup();
        }

        try {
            const room = await Room.findOne({hostSocketId: roomSocketId})
            await room.populate('participants', 'username')
            socket.join(roomSocketId)
           
            
            // Initialize the appropriate game socket based on the game being played
          
            switch(room.gameBeingPlayed) {
                case 'Chess':
                  
                    currentGameSocket = chessSocket(socket, io);
                    currentGameSocket.init()
                    break;
                case 'Fake-Artist':
                 
                    currentGameSocket = fakeArtistSocket(socket, io);
                    currentGameSocket.init()
                    break;
                case 'Shobu':
                   
                    currentGameSocket = shobuSocket(socket, io);
                    currentGameSocket.init()
                    break;
                default:
                 
            }

            const hasStarted = room.started
            io.to(roomSocketId).emit('player-joined', room.participants, hasStarted);
        }
        catch (err) {
            socket.emit("error", err)
        }
    })

    socket.on('player-game-setup', async (roomSocketId, userId) => {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const room = await Room.findOne({hostSocketId: roomSocketId}).session(session);
            if (room != null) {
                let gameState = room.gameState
                // Emit turn and game state together
                socket.emit('get-player-setup', gameState)
            }
            await session.commitTransaction();
        } catch (err) {
            await session.abortTransaction();
         
            socket.emit('err', "An error occurred while setting up the game");
        } finally {
            session.endSession();
        }
    });
    
    socket.on('set-game-state', async (gameState, roomSocketId) => {
        const room = await Room.findOne({hostSocketId: roomSocketId})

        if (room != null) {
            const newGameState = JSON.stringify({...JSON.parse(room.gameState), ...JSON.parse(gameState)})
           
            room.gameState = newGameState
            await room.save();
        }
    })

    socket.on(`leave-room`, async (roomSocketId, userId) =>  {
        try {
            // Find the room by hostSocketId
            const room = await Room.findOne({ hostSocketId: roomSocketId });
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

            // Set the user's inRoom attribute to false
            const user = await User.findById(userId);
            user.inRoom = false;
            await user.save();

            await room.populate('participants', 'username')
            // Emit an 'update-players' event to all clients in the room
            io.to(roomSocketId).emit('update-players', room.participants);

            // Clean up the game socket when leaving
            if (currentGameSocket && currentGameSocket.cleanup) {
                currentGameSocket.cleanup();
            }
            currentGameSocket = null;
        } catch (err) {
            console.log(err)
        }
    })

    messageSocket(socket, io)

    socket.on('start-pressed', async (roomSocketId) => {
  
        try {
            const room = await Room.findOne({hostSocketId: roomSocketId})
            if (room){
               
                room.started = true
                await room.save()
            }
        }
        catch(err){
            console.log(err)
        }
        io.to(roomSocketId).emit('start-game');
    })

    socket.on("disconnect", () => {
        console.log(`User Disconnected: ${socket.id}`);
    });

    socket.on('connection', () => {
        console.log('guy got connected, no problem with server link in socket')
    })
});
    
const PORT = process.env.PORT || 8800;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});