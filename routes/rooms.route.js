import express from 'express'
import { CreateRoom, getVacantPublicRooms, joinRoom, deleteRoom, leaveRoom } from '../controllers/rooms.controller.js'
const router = express.Router()

router.post('/create-room', CreateRoom)

router.get('/get-rooms', getVacantPublicRooms)

router.post('/join-room', joinRoom)

router.post('/delete-room', deleteRoom)

router.post('/leave-room', leaveRoom)

export default router