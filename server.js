
// import { Server } from "socket.io";

// const io = new Server('3000', {
//     cors: {
//         origin: ["http://localhost:5173", "https://379fcf80d00c76a469014e85cc792090.serveo.net"]
//     } 
// })

// io.on('connection', socket => {
//     socket.on('join-room', roomName => {
//         socket.join(roomName)
//         room = roomName
//         let clientsIds = Array.from(io.sockets.adapter.rooms.get(roomName))
//         io.to(roomName).emit('room-joined', clientsIds)
//     })

//     socket.on('pieceDropped', (piece, tileFile, tileRank) => {
//         // reay the move info the opponent 
//         socket.to(room).emit('opponentDropped', piece, tileFile, tileRank)
//     })

//     socket.on('promotingPawn', promotingTo => {
//         // tell the opponent what is the user promoting to
//         socket.to(room).emit('opponentPromtingPawn', promotingTo)
//     })
// })