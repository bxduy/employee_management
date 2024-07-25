import express from 'express';
import { login, refreshToken, changePassword, logout, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { authorize } from '../middlewares/auth.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

router.post('/login', login)
router.post('/refresh-token', refreshToken)
router.post('/change-password', authorize(), changePassword)
router.post('/logout', authorize(), logout)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword)

export default router;
