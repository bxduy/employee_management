import express from 'express';
import { register, getAllUsers, editProfile, getUserById } from '../controllers/user.controller.js';
import { checkPermission, authenticateToken } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

router.post('/register', authenticateToken, checkPermission(process.env.W_EMP), upload.single('avatar'), register)
router.get('/', authenticateToken, checkPermission(process.env.R_USERS), getAllUsers)
router.get('/:id/profile', authenticateToken, checkPermission(process.env.R_USERS), getUserById)
router.get('/profile', authenticateToken, getUserById)
router.post('/:id/edit', authenticateToken, checkPermission(process.env.UA_PROFILE), upload.single('avatar'), editProfile)
router.post('/edit', authenticateToken, upload.single('avatar'), editProfile)

export default router;