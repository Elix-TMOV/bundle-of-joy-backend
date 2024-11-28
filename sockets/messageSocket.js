export default function messageSocket(Socket, io){
    Socket.on('send-message', (roomSocketId, data) => {
        console.log('got the message int he bakcned', roomSocketId)
        io.in(roomSocketId).emit('message', data);
    })
}
