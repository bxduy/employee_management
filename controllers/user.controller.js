import db from "../models/index.js";
import cloudinary from "../config/cloudinary.js";
import { securepassword } from "../utils/securePassword.js";
import { generateEmployeeCode } from "../utils/config.js";
import { validation } from "../utils/validation.js";
import { Op } from "sequelize";
import dotenv from 'dotenv';

dotenv.config();

const User = db.User

export const register = async (req, res) => {
    const transaction = await db.sequelize.transaction()
    let file
    try {
        const { firstname, lastname, password, email, phone, identification_number, address, insurance_number, role_id } = req.body
        const employee_code = await generateEmployeeCode()
        const validateObj = { firstname, lastname, password, email }
        file = req.file
        const action = 'register'
        const validateErr = validation(action, validateObj);
    
        if (validateErr) {
            return res.status(400).send({ message: validateErr })
        }
        const password_hash = await securepassword(password)
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
        if (file) {
            const imgPath = await cloudinary.uploader.upload(file.path, {
                folder: 'images',
                public_id: `${employee_code}`,
            });
            newUser.avatar = imgPath.secure_url
            await newUser.save({transaction})
        }
        await transaction.commit()

        return res.status(201).send({ message: 'User created successfully', user: newUser })
    } catch (err) {
        await transaction.rollback()
        return res.status(500).send({ message: err.message })
    }
}

export const editProfile = async (req, res) => {
    let file
    let transaction
    try {
        const userId = req.user.id
        const empId = req.params.id
        const id = empId ? empId : userId
        const user_code = req.user.employee_code
        const { employee_code, firstname, lastname, email, phone, identification_number, address, insurance_number } = req.body
        let code
        console.log(employee_code);
        code = employee_code ? employee_code : user_code
        console.log(code);
        let newAvatar
        file = req.file
        const action = 'editProfile'
        const validateObj = { firstname, lastname, email }
        const validateErr = validation(action, validateObj)
        if (validateErr) {
            return res.status(400).send({ message: validateErr })
        }
        transaction = await db.sequelize.transaction()
        const userUpdateData = {
            firstname,
            lastname,
            email,
            phone,
            identification_number,
            address,
            insurance_number,
        };

        if (role_id) {
            userUpdateData.role_id = role_id
        }

        if (file) {
            newAvatar = await cloudinary.uploader.upload(file.path, {
                folder: 'images',
                public_id: `${code}`,
            })
            userUpdateData.avatar = newAvatar.secure_url
        }

        await User.update(userUpdateData, {
            where: {
                id,
            }, transaction
        })

        await transaction.commit()
        return res.status(200).send({ message: 'Profile updated successfully' })
    } catch (err) {
        if (transaction) {
            await transaction.rollback()
        }
        return res.status(500).send({ message: err.message })
    }
}

export const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const pageSize = parseInt(req.query.pageSize) || 10
        const offset = (page - 1) * pageSize

        const users = await User.findAndCountAll({
            attributes: ['employee_code', 'firstname', 'lastname', 'email', 'phone'
                , 'address', 'role_id', 'identification_number', 'insurance_number'],
            limit: pageSize,
            offset: offset
        })

        const data = {
            totalMembers: users.count,
            totalPages: Math.ceil(users.count / pageSize),
            currentPage: page,
            data: users.rows
        }
        return res.status(200).json(data)
    } catch (err) { 
        return res.status(500).send({ message: err.message })
    }
}

export const getUserById = async (req, res) => {
    try {
        const userId = req.user.id
        const empId = req.params.id
        const id = empId ? empId : userId
        const user = await User.findByPk(id)
        if (!user) {
            return res.status(404).send({ message: 'User not found' })
        }
        return res.status(200).json(user)
    } catch (err) { 
        return res.status(500).send({ message: err.message })
    }
}

export const searchUserByName = async (req, res) => {
    try {
        const keyWord = req.query.name
        const page = parseInt(req.query.page) || 1
        const pageSize = parseInt(req.query.pageSize) || 10
        if (!keyWord) {
            return res.status(400).send({ message: 'Name query parameter is required' })
        }
        const limit = pageSize
        const offset = (page - 1) * pageSize
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
            return res.status(404).send({ message: 'No users found'})
        }
        const data = {
            totalMembers: users.count,
            totalPages: Math.ceil(users.count / pageSize),
            currentPage: page,
            data: users.rows
        }
        return res.status(200).send(data)
    } catch (err) {
        return res.status(500).send({ message: err.message })
    }
}