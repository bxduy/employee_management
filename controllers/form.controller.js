import db from '../models/index.js'
import emailQueue from '../utils/email.js'

const { FormTemplate, Role, User, FormData, Notification } = db

// Fetch all form templates
export const getFormTemplate = async (req, res) => { 
    try {
        const templates = await FormTemplate.findAll()
        if (!templates.length) {
            return res.status(404).json({ message: 'No templates found' })
        }
        return res.status(200).json(templates)
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

// Create a new form based on a template
export const makeForm = async (req, res) => {
    const transaction = await db.sequelize.transaction()
    try {
        const creator_id = req.user.id
        const { template_id } = req.body
        // Fetch the template by ID
        const template = await FormTemplate.findByPk(template_id, { transaction })
        if (!template) {
            await transaction.rollback()
            return res.status(404).json({ message: 'Template not found' })
        }
        // Convert data structure based on template criteria
        const criteria = template.criteria
        const newSections = criteria.sections.map(section => ({
            title: section.title,
            fields: section.fields.map(field => ({ [field.label]: "" }))
        }))
        const data = { sections: newSections };
        // Get roles and users associated with the form
        const roleNames = ['manager', 'hr', 'employee']
        const roles = await Role.findAll({
            where: {
                name: roleNames
            },
            attributes: ['id'],
            transaction
        })
        const roleIds = roles.map(role => role.id)
        const users = await User.findAll({
            where: {
                role_id: roleIds
            },
            attributes: ['id', 'email'],
            transaction
        });
        // Prepare form data entries for bulk creation
        const userIds = users.map(user => user.id)
        const emailAddresses = users.map(user => user.email).join(',')
        const type = template.name
        const formDataEntries = userIds.map(userId => ({
            type,
            data,
            sender_id: userId,
            approver_id: null
        }))
        await FormData.bulkCreate(formDataEntries, { transaction })
        // Notify users via email
        const formName = type.toUpperCase() + ' FORM'
        const subject = `${formName} has been created`
        const text = `${formName} has been created, please fill out the form`
        emailQueue.add({
            bcc: emailAddresses,
            subject,
            text,
        })
        // Create a notification record
        await Notification.create({
            message: subject,
            maker_id: creator_id
        }, { transaction })

        await transaction.commit()
        return res.status(201).json({ message: 'Forms created successfully' })
    } catch (err) {
        await transaction.rollback()
        return res.status(500).json({ message: err.message })
    }
}

// Get all form data submitted by a user
export const getAllFormDataByUserId = async (req, res) => {
    try {
        const id = req.user.id
        const { page = 1, pageSize = 10 } = req.query
        const offset = (page - 1) * pageSize
        // Fetch form data with pagination
        const forms = await FormData.findAndCountAll({
            where: {
                sender_id: id,
            },
            order: [['id', 'desc']],
            limit: parseInt(pageSize),
            offset: parseInt(offset)
        })
        if (!forms || forms.count === 0) {
            return res.status(404).json({ message: 'No form found' })
        }
        return res.status(200).json({
            totalForms: forms.count,
            totalPages: Math.ceil(forms.count / pageSize),
            currentPage: page,
            data: forms.rows
        })
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

// Submit a form
export const submitForm = async(req, res) => { 
    try {
        const userId = req.user.id
        const formId = req.params.id
        const { data } = req.body
        // Fetch the form by ID and user ID
        const form = await FormData.findOne({
            where: {
                id: formId,
                sender_id: userId
            }
        })
        if (!form) {
            return res.status(404).json({ message: 'Form Not Found' })
        }
        if (form.status === 'approved') { 
            return res.status(400).json({ message: 'Form approved' })
        }
        // Update form data and status
        await FormData.update({
            data: data,
            status: 'submitted'
        }, {
            where: {
                id: formId
            }
        })
        return res.status(200).json({ message: 'Submit successful'})
    } catch (err) { 
        return res.status(500).json({ message: err.message })
    }
}

// Get all form data submitted by employees that a manager or director oversees
export const getAllFormDataOfEmployee = async (req, res) => { 
    const transaction = await db.sequelize.transaction()
    try {
        const userId = req.user.id
        const { page = 1, pageSize = 10 } = req.query
        const offset = (page - 1) * pageSize
        const roleNames = ['employee', 'hr', 'manager', 'director']
        // Fetch the user and their role
        const user = await User.findByPk(userId, {
            include: [{
                model: Role,
                attributes: ['name']
            }],
            transaction
        })
        if (!user) {
            await transaction.rollback()
            return res.status(404).json({ message: 'User not found'})
        }
        // Determine target roles based on user's role
        const userRole = user.Role.name
        let targetRoleNames = []

        if (userRole === roleNames[2]) { // Manager
            targetRoleNames = [roleNames[0], roleNames[1]] // Employee, HR
        } else if (userRole === roleNames[3]) { // Director
            targetRoleNames = [roleNames[2]] // Manager
        } else {
            await transaction.rollback()
            return res.status(403).json({ message: 'Access denied' })
        }
        // Fetch target roles and their IDs
        const targetRoles = await Role.findAll({
            where: {
                name: targetRoleNames
            },
            attributes: ['id'],
            transaction
        })
        const targetRoleIds = targetRoles.map(role => role.id)
        // Fetch form data of target roles with pagination
        const formData = await FormData.findAndCountAll({
            where: {
                status: 'submitted',
            },
            include: [{
                model: User,
                as: 'Sender',
                where: {
                    role_id: targetRoleIds
                },
                attributes: ['firstname', 'lastname'],
                include: [{
                    model: Role,
                    attributes: ['name']
                }]
            }],
            limit: parseInt(pageSize),
            offset: parseInt(offset),
            transaction
        })

        await transaction.commit()
        if (!formData || formData.count === 0) {
            return res.status(404).json({ message: 'Form not found' })
        }
        return res.status(200).json({
            totalForms: formData.count,
            totalPages: Math.ceil(formData.count / pageSize),
            currentPage: page,
            data: formData.rows
        })
    } catch (err) {
        await transaction.rollback()
        return res.status(500).json({ message: err.message })
    }
}

// Get specific form data by form ID
export const getFormDataOfFormId = async (req, res) => { 
    try {
        const userId = req.user.id
        const formId = req.params.id
        // Fetch the form by ID
        const form = await FormData.findByPk(formId)
        if (!form) {
            return res.status(404).json({ message: 'Form not found' })
        }
        // Check if the user is the sender
        const senderId = form.sender_id
        if (senderId === userId) {
            return res.status(200).json(form)
        }
        // Fetch the user and their role
        const user = await User.findByPk(userId, {
            include: [{
                model: Role,
                attributes: ['name']
            }]
        })
        const userRole = user.Role.name
        // Fetch the sender and their role
        const sender = await User.findByPk(senderId, {
            include: [{
                model: Role,
                attributes: ['name']
            }]
        })
        const senderRole = sender.Role.name
        // Check if the user has permission to view the form
        if (userRole === 'director' && senderRole === 'manager') { 
            return res.status(200).json(form)
        }
        if (userRole === 'manager' && (senderRole === 'hr' || senderRole === 'employee')) { 
            return res.status(200).json(form)
        }
        return res.status(403).json({ message: 'Access denied' })
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

// Approve or reject a form
export const approveForm = async(req, res) => { 
    try {
        const userId = req.user.id
        const { formId, status } = req.body
        // Validate the status
        const validStatuses = ['approved', 'rejected']
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' })
        }
        // Fetch the form by ID
        const form = await FormData.findByPk(formId)
        if (!form) { 
            return res.status(404).json({ message: 'Form not found' })
        }
        let updateStatus = status === 'approved' ? status : 'new'
        // Update the form status and approver ID
        await FormData.update({
            status: updateStatus,
            approver_id: userId
        }, {
            where: { 
                id: formId,
            }
        })
        return res.status(200).json({ message: 'Status updated' })
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

// Get report of form completion status
export const getFormCompletionReport = async (req, res) => {
    try {
        const { type } = req.query
        // Fetch counts of form statuses by type
        const statusCounts = await FormData.findAll({
            attributes: [
                'status',
                [db.sequelize.fn('COUNT', db.sequelize.col('status')), 'count']
            ],
            where: {
                status: ['new', 'submitted', 'approved'],
                type
            },
            group: ['status']
        })
        // Initialize report with zero counts
        const report = {
            new: 0,
            submitted: 0,
            approved: 0
        }
        // Populate report with actual counts
        statusCounts.forEach(statusCount => {
            report[statusCount.status] = statusCount.dataValues.count
        })

        return res.status(200).json(report)
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}
