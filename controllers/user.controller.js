import db from "../models/index.js";
import cloudinary from "../config/cloudinary.js";
import { securepassword } from "../utils/securePassword.js";
import { generateEmployeeCode, generateResetPasswordToken } from "../utils/config.js";
import { validation } from "../utils/validation.js";
import { Op } from "sequelize";
import dotenv from 'dotenv';

dotenv.config();

const User = db.User

// Register a new user
export const register = async (req, res) => {
    const transaction = await db.sequelize.transaction()
    let file
    try {
        const { firstname, lastname, password, email, phone, identification_number, address, insurance_number, role_id } = req.body
        // Validate input
        const action = 'register'
        const validateErr = validation(action, { firstname, lastname, password, email });
    
        if (validateErr) {
            return res.status(400).json({ message: validateErr })
        }
        // Generate employee code and hash password
        const [employee_code, password_hash] = await Promise.all([
            generateEmployeeCode(),
            securepassword(password)
        ])
        // Create new user
        const newUser = await User.create({
            employee_code,
            firstname,
            lastname,
            password_hash,
            email,
            phone,
            identification_number,
            address,
            insurance_number,
            role_id
        }, { transaction })
        // Upload avatar if file is provided
        file = req.file
        if (file) {
            const imgPath = await cloudinary.uploader.upload(file.path, {
                folder: 'images',
                public_id: `${employee_code}`,
            });
            newUser.avatar = imgPath.secure_url
            await newUser.save({transaction})
        }
        await transaction.commit()

        return res.status(201).json({ message: 'User created successfully', user: newUser })
    } catch (err) {
        await transaction.rollback()
        return res.status(500).json({ message: err.message })
    }
}

// Edit user profile
export const editProfile = async (req, res) => {
    let file
    let transaction
    try {
        // Determine user ID from request params or authenticated user
        const userId = req.user.id
        const empId = req.params.id
        const id = empId ? empId : userId
        const { employee_code, firstname, lastname, email, phone, identification_number, address, insurance_number, role_id } = req.body
        file = req.file
        // Validate input
        const action = 'editProfile'
        const validateErr = validation(action, { firstname, lastname, email })
        if (validateErr) {
            return res.status(400).json({ message: validateErr })
        }
        transaction = await db.sequelize.transaction()
        // Prepare data for update
        const userUpdateData = {
            firstname,
            lastname,
            email,
            phone,
            identification_number,
            address,
            insurance_number,
            ...(role_id && { role_id })
        }

        // Upload avatar if file is provided
        if (file) {
            const newAvatar = await cloudinary.uploader.upload(file.path, {
                folder: 'images',
                public_id: `${employee_code}`,
            })
            userUpdateData.avatar = newAvatar.secure_url
        }
        // Update user
        await User.update(userUpdateData, {
            where: {
                id,
            }, transaction
        })

        await transaction.commit()
        return res.status(200).json({ message: 'Profile updated successfully' })
    } catch (err) {
        if (transaction) {
            await transaction.rollback()
        }
        return res.status(500).json({ message: err.message })
    }
}

// Get all users with pagination
export const getAllUsers = async (req, res) => {
    try {
        // Parse pagination parameters
        const page = parseInt(req.query.page) || 1
        const pageSize = parseInt(req.query.pageSize) || 10
        const offset = (page - 1) * pageSize
        // Retrieve users with pagination
        const users = await User.findAndCountAll({
            attributes: ['employee_code', 'firstname', 'lastname', 'email', 'phone'
                , 'address', 'role_id', 'identification_number', 'insurance_number'],
            limit: pageSize,
            offset: offset
        })
        // Structure response data
        const data = {
            totalMembers: users.count,
            totalPages: Math.ceil(users.count / pageSize),
            currentPage: page,
            data: users.rows
        }
        return res.status(200).json(data)
    } catch (err) { 
        return res.status(500).json({ message: err.message })
    }
}

// Get user by id
export const getUserById = async (req, res) => {
    try {
        const userId = req.user.id
        const empId = req.params.id
        const id = empId ? empId : userId
        const user = await User.findByPk(id)
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }
        return res.status(200).json(user)
    } catch (err) { 
        return res.status(500).json({ message: err.message })
    }
}

// Search users by name
export const searchUserByName = async (req, res) => {
    try {
        const keyWord = req.query.name
        const page = parseInt(req.query.page) || 1
        const pageSize = parseInt(req.query.pageSize) || 10
        if (!keyWord) {
            return res.status(400).json({ message: 'Name query parameter is required' })
        }
        const limit = pageSize
        const offset = (page - 1) * pageSize
        // Search users by name
        const users = await User.findAndCountAll({
            where: {
                [Op.or]: [
                    { firstname: { [Op.like]: `%${keyWord}%` } },
                    { lastname: { [Op.like]: `%${keyWord}%` } }
                ]
            },
            attributes: ['id', 'employee_code', 'firstname', 'lastname', 'email'],
            offset,
            limit
        })
        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'No users found'})
        }
        const data = {
            totalMembers: users.count,
            totalPages: Math.ceil(users.count / pageSize),
            currentPage: page,
            data: users.rows
        }
        return res.status(200).json(data)
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}