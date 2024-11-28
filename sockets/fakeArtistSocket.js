import Room from "../models/RoomModel.js"
import { words } from "../games-server-resources/fake-artist-words-list.js"

export default function fakeArtistSocket(socket, io) {
    // Helper functions stay outside init/cleanup
    function updateVotes(gameState, color) {
        if (!gameState.votes) {
            gameState.votes = {};
        }
        gameState.votes[color] = gameState.votes[color] ? gameState.votes[color] + 1 : 1;
        gameState.voteCount = gameState.voteCount + 1;
        return gameState;
    }
    
    function checkAndHandleVotingCompletion(gameState, roomSocketId) {
        let highestVote = 0;
        let votedOutColor = null;
        let playerColors = Object.keys(gameState.votes);
        let finalMessage = 'Artists Won';
        
        for (var i = 0; i < playerColors.length; i++) {
            if (gameState.votes[playerColors[i]] > highestVote) {
                highestVote = gameState.votes[playerColors[i]];
                votedOutColor = playerColors[i];
            }
        }
        
        if (votedOutColor && votedOutColor != gameState.turnsAndPlayers[gameState.fake].turn) {
            finalMessage = 'The Fake Artist Won';
        }
        io.to(roomSocketId).emit('results', {votedOutColor, finalMessage});
    }

    return {
        init: () => {
            socket.on('setup-fake-artist', async (roomSocketId) => {
                const room = await Room.findOne({ hostSocketId: roomSocketId })
                let turn;
                if (room) {
                    if (!room.started) {
                        const participants = room.participants;
                        const randomIndex = Math.floor(Math.random() * participants.length);
                        const fakeId = participants[randomIndex];
                        const categories = Object.keys(words);
                        const category = categories[Math.floor(Math.random()*categories.length)];
                        const wordsList = words[category];
                        const word = wordsList[Math.floor(Math.random()*wordsList.length)];
                        turn = room.participants[0];
                        room.gameState = JSON.stringify({
                            ...JSON.parse(room.gameState), 
                            fake: fakeId, 
                            category: category, 
                            word: word, 
                            turn: turn, 
                            picture: null, 
                            votes: {}, 
                            voteCount: 0, 
                            turnsLeft: 2*room.participants.length
                        });
                        room.started = true;
                        await room.save();
                    }
                    io.to(roomSocketId).emit('turn-changed', turn);
                    io.to(roomSocketId).emit('start-game');
                }
            });

            socket.on('draw', async (data, roomSocketId) => {
                const room = await Room.exists({ hostSocketId: roomSocketId })
                if (!room) {
                    io.to(roomSocketId).emit('roomTimeRanOut')
                    return
                }
                socket.to(roomSocketId).emit('draw', data);
            });

            socket.on('change-turn', async (userId, roomSocketId, picture) => {
                const room = await Room.findOne({ hostSocketId: roomSocketId });
                if (!room) {
                    io.to(roomSocketId).emit('roomTimeRanOut')
                    return
                }
                let participants = room.participants;
                let index = participants.indexOf(userId);
                let nextTurn = participants[(index+1) % participants.length];
                let gameState = JSON.parse(room.gameState);
                let turnsLeft = 0;
                
                if (gameState.turnsLeft > 0) {
                    gameState.turnsLeft -= 1;
                    gameState.turn = nextTurn;
                    turnsLeft = gameState.turnsLeft;
                }
                
                gameState.picture = picture;
                room.gameState = JSON.stringify(gameState);
                await room.save();
                
                io.to(roomSocketId).emit('next-turn', nextTurn, turnsLeft);
            });

            socket.on('fake-artist-vote', async(roomSocketId, color) => {
                const room = await Room.findOne({hostSocketId: roomSocketId});
                if (!room) {
                    io.to(roomSocketId).emit('roomTimeRanOut')
                    return
                }
                let gameState = JSON.parse(room.gameState);
                gameState = updateVotes(gameState, color);
                if (gameState.voteCount == room.participants.length) {
                    checkAndHandleVotingCompletion(gameState, roomSocketId);
                }
                room.gameState = JSON.stringify(gameState);
                await room.save();
            });
        },
        cleanup: () => {
            socket.removeAllListeners('setup-fake-artist');
            socket.removeAllListeners('draw');
            socket.removeAllListeners('change-turn');
            socket.removeAllListeners('fake-artist-vote');
        }
    };
}