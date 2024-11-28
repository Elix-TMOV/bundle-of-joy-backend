import Room from "../models/RoomModel.js"

export default function shobuSocket(socket, io) {
    return {
        init: () => {
            socket.on("setup-shobu", async(roomSocketId) => {
                try {
                    const room = await Room.findOne({ hostSocketId: roomSocketId })
                    if (room) {
                        room.gameState = JSON.stringify({...JSON.parse(room.gameState), turn: 'w'})
                        room.started = true
                        await room.save()
                        io.to(roomSocketId).emit('start-game');
                    }
                }
                catch(err) {
                    console.log(err)
                }
            });

            socket.on("pieceDropped", async (frmR, frmF, toR, toF, roomSocketId) => {
                const room = await Room.exists({ hostSocketId: roomSocketId })
                if (!room) {
                    io.to(roomSocketId).emit('roomTimeRanOut')
                    return
                }
                socket.to(roomSocketId).emit("opponentDropped", frmR, frmF, toR, toF, roomSocketId)
            });
        },
        cleanup: () => {
            socket.removeAllListeners('setup-shobu');
            socket.removeAllListeners('pieceDropped');
        }
    };
}