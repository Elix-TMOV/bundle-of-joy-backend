import Room from "../models/RoomModel.js"
export default function chessSocket (socket, io){
    return {
        init: () => {
            socket.on('setup-chess', async (roomSocketId) => {
                let turn;
                try {
                    const room = await Room.findOne({ hostSocketId: roomSocketId })
                    if (room && !room.started) {
                        turn = room.participants[0]
                        room.gameState = JSON.stringify({...JSON.parse(room.gameState), turn: 'w'})
                        room.started = true
                        await room.save()
                        io.to(roomSocketId).emit('turn-changed', turn);
                        io.to(roomSocketId).emit('start-game');
                    }
                }
                catch(err){
                    console.log(err)
                }
            })
        
            socket.on('pieceDropped', async (userId, piece, tileFile, tileRank, roomSocketId) => {
         
                const room = await Room.exists({ hostSocketId: roomSocketId })
                if (!room) {
                    io.to(roomSocketId).emit('roomTimeRanOut')
                    return
                }
                // Emit with a specific event name to avoid confusion
                socket.to(roomSocketId).emit("piece-moved", {
                    piece,
                    tileFile,
                    tileRank
                })
            })
        
            socket.on('promotingPawn', async (userId, promotingTo, roomSocketId) => {
                socket.to(roomSocketId).emit('opponentPromotingPawn', promotingTo)   
            })
        },
        cleanup: () => {
            socket.removeAllListeners('pieceDropped');
            socket.removeAllListeners('setup-chess');
            socket.removeAllListeners('promotingPawn');
        }
    }
}