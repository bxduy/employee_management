import express from 'express';
import { getPermission } from '../controllers/permission.controller.js';

const router = express.Router();

router.get('/all-permissions', getPermission)

export default router;