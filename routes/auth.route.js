import express from 'express';
import { login, refreshToken, changePassword, logout } from '../controllers/auth.controller.js';
import { authorize } from '../middlewares/auth.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

router.post('/login', login)
router.post('/refresh-token', refreshToken)
router.post('/change-password', authorize(), changePassword)
router.post('/logout', authorize(), logout)

export default router;
