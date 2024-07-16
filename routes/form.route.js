import express from 'express'
import {
    getFormTemplate, makeForm, getAllFormDataByUserId, getAllFormDataOfEmployee, getFormCompletionReport
    , submitForm, getFormDataOfFormId, approveFrom
 } from '../controllers/form.controller.js'
import { authenticateToken, checkPermission } from '../middlewares/auth.js'
import dotenv from 'dotenv'
dotenv.config();

const router = express.Router()

router.get('/templates', authenticateToken, checkPermission(process.env.R_TEMPLATE), getFormTemplate)
router.post('/create', authenticateToken, checkPermission(process.env.M_FORM), makeForm)
// router.get('/:id/view', authenticateToken, checkPermission(process.env.R_FORM), getAllFormDataOfUser)
router.get('/all-forms', authenticateToken, getAllFormDataByUserId)
router.get('/', authenticateToken, checkPermission(process.env.R_FORM), getAllFormDataOfEmployee)
router.post('/approve', authenticateToken, checkPermission(process.env.A_FORM), approveFrom)
router.get('/report', authenticateToken, checkPermission(process.env.R_REPORT), getFormCompletionReport)
router.post('/:id/submit', authenticateToken, submitForm)
router.get('/:id', authenticateToken, getFormDataOfFormId)

export default router