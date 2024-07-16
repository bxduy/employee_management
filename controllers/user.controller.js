import db from "../models/index.js";
import { securepassword } from "../utils/securePassword.js";
import { generateEmployeeCode } from "../utils/config.js";
import { validation } from "../utils/validation.js";
import { removeImg } from "../utils/removeImage.js";
import fs from 'fs';
import path from "path";
import dotenv from 'dotenv';

dotenv.config();

const User = db.User

export const register = async (req, res) => {
    const transaction = await db.sequelize.transaction()
    let newPath
    let originalname
    let file
    try {
        const { firstname, lastname, password, email, phone, identification_number, address, insurance_number, role_id } = req.body
        const employee_code = await generateEmployeeCode()
        const validateObj = { firstname, lastname, password, email }
        let avatar = null
        file = req.file
        if (file) {
            originalname = file.filename
            const ext = path.extname(originalname)
            avatar = `${employee_code}${ext}`
            newPath = path.join('public/images', avatar)
            fs.renameSync(file.path, newPath)
        }
        const action = 'register'
        const validateErr = validation(action, validateObj);
    
        if (validateErr) {
            if (file) {
                removeImg(newPath)
            }
            return res.status(400).send({ message: validateErr })
        }
        const password_hash = await securepassword(password)
        // Create new user
        const newUser = await User.create({
            employee_code: employee_code,
            firstname: firstname,
            lastname: lastname,
            password_hash: password_hash,
            email: email,
            phone: phone,
            avatar: avatar,
            identification_number: identification_number,
            address: address,
            insurance_number: insurance_number,
            role_id: role_id
        }, { transaction })

        await transaction.commit()

        return res.status(201).send({ user: newUser })
    } catch (err) {
        if (file) {
            removeImg(newPath)
        } 
        await transaction.rollback()
        return res.status(500).send({ message: err.message })
    }
}

export const editProfile = async (req, res) => {
    let newPath
    let imgPath
    let file
    let transaction
    try {
        const userId = req.user.id
        const empId = req.params.id
        const id = empId ? empId : userId
        console.log(id);
        const employee_code = req.user.employee_code
        const { firstname, lastname, email, phone, identification_number, address, insurance_number, role_id, old_avatar } = req.body
        let ext
        let newAvatar
        file = req.file
        if (file) {
            imgPath = file.path
            ext = path.extname(file.filename)
            newAvatar = `${employee_code}${ext}`
            console.log(newAvatar);
        }
        const action = 'editProfile'
        const validateObj = { firstname, lastname, email }
        const validateErr = validation(action, validateObj)
        if (validateErr) {
            if (file) {
                removeImg(imgPath)
            }
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
            userUpdateData.avatar = newAvatar
        }

        await User.update(userUpdateData, {
            where: {
                id,
            }, transaction
        });
        if (file) {
            newPath = path.join('public/images', newAvatar)
            console.log(newPath)
            const oldPath = path.join('public/images', old_avatar)
            removeImg(oldPath)
            fs.renameSync(imgPath, newPath)
        }
        await transaction.commit()
        return res.status(200).send({ message: 'Profile updated successfully' })
    } catch (err) {
        if (transaction) {
            await transaction.rollback()
        }
        if (file) {
            removeImg(imgPath)
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