import express from 'express';
import { register, getAllUsers } from '../controllers/user.controller.js';
import { checkPermission, authenticateToken } from '../middlewares/auth.js';
import { validateRegiser } from '../middlewares/validate.js';
import upload from '../middlewares/upload.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Authenticate and check permissions first, then validate user input, then handle file upload, and finally register user
router.post('/register', authenticateToken, checkPermission(process.env.W_EMP), validateRegiser, upload.single('avatar'), register);
router.get('/', authenticateToken, checkPermission(process.env.R_USERS), getAllUsers);

export default router;