import db from '../models/index.js'
import emailQueue from '../utils/email.js'

const { FormTemplate, Role, User, FormData, Notification } = db

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

export const makeForm = async (req, res) => {
    const transaction = await db.sequelize.transaction()
    try {
        const creator_id = req.user.id
        const { template_id } = req.body
        const template = await FormTemplate.findByPk(template_id, { transaction })
        if (!template) {
            await transaction.rollback()
            return res.status(404).json({ message: 'Template not found' })
        }
        // console.log(template.criteria);
        const criteria = template.criteria
        // Convert data structure
        const newSections = criteria.sections.map(section => ({
            title: section.title,
            fields: section.fields.map(field => ({ [field.label]: "" }))
        }))

        // Make data
        const data = { sections: newSections };

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
        const formName = type.toUpperCase() + ' FORM'
        const subject = `${formName} has been created`
        const text = `${formName} has been created, please fill out the form`
        emailQueue.add({
            bcc: emailAddresses,
            subject,
            text,
        })
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

export const getAllFormDataByUserId = async (req, res) => {
    try {
        const id = req.user.id
        const { page = 1, pageSize = 10 } = req.query
        const offset = (page - 1) * pageSize
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

export const submitForm = async(req, res) => { 
    try {
        const userId = req.user.id
        const formId = req.params.id
        const { data } = req.body
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

export const getAllFormDataOfEmployee = async (req, res) => { 
    const transaction = await db.sequelize.transaction()
    try {
        const userId = req.user.id
        const { page = 1, pageSize = 10 } = req.query
        const offset = (page - 1) * pageSize
        const roleNames = ['employee', 'hr', 'manager', 'director']
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

        const targetRoles = await Role.findAll({
            where: {
                name: targetRoleNames
            },
            attributes: ['id'],
            transaction
        })
        const targetRoleIds = targetRoles.map(role => role.id)

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

export const getFormDataOfFormId = async (req, res) => { 
    try {
        const userId = req.user.id
        const formId = req.params.id
        const form = await FormData.findByPk(formId)
        if (!form) {
            return res.status(404).json({ message: 'Form not found' })
        }
        const senderId = form.sender_id
        if (senderId === userId) {
            return res.status(200).json(form)
        }
        const user = await User.findByPk(userId, {
            include: [{
                model: Role,
                attributes: ['name']
            }]
        })
        const userRole = user.Role.name
        const sender = await User.findByPk(senderId, {
            include: [{
                model: Role,
                attributes: ['name']
            }]
        })
        const senderRole = sender.Role.name
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

export const approveForm = async(req, res) => { 
    try {
        const userId = req.user.id
        const { formId, status } = req.body
        const validStatuses = ['approved', 'rejected']
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' })
        }
        const form = await FormData.findByPk(formId)
        if (!form) { 
            return res.status(404).json({ message: 'Form not found' })
        }
        let updateStatus = status === 'approved' ? status : 'new'
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

export const getFormCompletionReport = async (req, res) => {
    try {
        const { type } = req.query
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

        const report = {
            new: 0,
            submitted: 0,
            approved: 0
        }
        
        statusCounts.forEach(statusCount => {
            report[statusCount.status] = statusCount.dataValues.count
        })

        return res.status(200).json(report)
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}
