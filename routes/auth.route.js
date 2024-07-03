import express from 'express';
import { login, refreshToken, changePassword, logout } from '../controllers/auth.controller.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

router.post('/login', login)
router.post('/refresh-token', refreshToken)
router.post('/change-password', authenticateToken, changePassword)
router.post('/logout', authenticateToken, logout)

export default router;
