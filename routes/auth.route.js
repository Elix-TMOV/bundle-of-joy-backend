import express from "express";
import { signUp, logIn, logOut } from "../controllers/auth.controller.js";
import { should_be_logged_in } from "../controllers/should-be-loged-in.js";
import { authMiddleWare } from "../middlwares/auth.middleware.js";
const router = express.Router();

router.post('/sign-up', signUp);

router.post('/log-in', logIn);

router.get('/log-out', logOut);


export default router