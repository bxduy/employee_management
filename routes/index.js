import express from 'express';
import userRoutes from './user.route.js';
import permissionRoutes from './permission.route.js';
import authRoutes from './auth.route.js';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/permissions', permissionRoutes);
router.use('/auth', authRoutes);

export default router;