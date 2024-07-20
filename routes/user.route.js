import express from 'express';
import { register, getAllUsers, editProfile, getUserById, searchUserByName } from '../controllers/user.controller.js';
import { authorize } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

router.post('/register',authorize([process.env.W_EMP]), upload.single('avatar'), register)
router.get('/', authorize([process.env.R_USERS]), getAllUsers)
router.get('/:id/profile', authorize([process.env.R_USERS]), getUserById)
router.get('/profile', authorize(), getUserById)
router.post('/:id/edit', authorize([process.env.UA_PROFILE]), upload.single('avatar'), editProfile)
router.post('/edit', authorize(), upload.single('avatar'), editProfile)
router.get('/search', searchUserByName)

export default router;