import express from 'express';
import { getPermission } from '../controllers/permission.controller.js';
import { authorize } from '../middlewares/auth.js';

const router = express.Router();

router.get('/all-permissions', authorize(), getPermission)

export default router;