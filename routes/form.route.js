import express from 'express'
import {
    getFormTemplate, makeForm, getAllFormDataByUserId, getAllFormDataOfEmployee, getFormCompletionReport
    , submitForm, getFormDataOfFormId, approveForm
 } from '../controllers/form.controller.js'
import { authorize } from '../middlewares/auth.js'
import dotenv from 'dotenv'
dotenv.config();

const router = express.Router()

router.get('/templates', authorize([process.env.R_TEMPLATE]), getFormTemplate)
router.post('/create', authorize([process.env.M_FORM]), makeForm)
// router.get('/:id/view', authenticateToken, checkPermission(process.env.R_FORM), getAllFormDataOfUser)
router.get('/all-forms', authorize(), getAllFormDataByUserId)
router.get('/', authorize([process.env.R_FORM]), getAllFormDataOfEmployee)
router.post('/approve', authorize([process.env.A_FORM]), approveForm)
router.get('/report', authorize([process.env.R_REPORT]), getFormCompletionReport)
router.post('/:id/submit', authorize(), submitForm)
router.get('/:id', authorize(), getFormDataOfFormId)

export default router