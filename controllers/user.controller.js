import db from "../models/index.js";
import { securepassword } from "../utils/securePassword.js";
import { generateEmployeeCode } from "../utils/config.js";
import { validation } from "../utils/validation.js";
import fs from 'fs';
import path from "path";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const User = db.User



export const register = async (req, res) => {
    let newPath;
    try {
        // Process password and employee code
        const password_hash = await securepassword(req.body.password);
        const employee_code = await generateEmployeeCode();
        req.body.employee_code = employee_code;

        // Handle file upload
        let avatar = null;
        if (req.file) {
            const ext = path.extname(req.file.originalname);
            avatar = `${employee_code}${ext}`;
            newPath = path.join('public/images', avatar);
            fs.renameSync(req.file.path, newPath);
        }

        // Create new user
        const newUser = await User.create({
            employee_code: employee_code,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            password_hash: password_hash,
            email: req.body.email,
            phone: req.body.phone,
            avatar: avatar,
            identification_number: req.body.identification_number,
            address: req.body.address,
            insurance_number: req.body.insurance_number,
            role_id: req.body.role_id
        });

        return res.status(201).send({ user: newUser });
    } catch (err) {
        if (newPath) {
            fs.unlink(newPath, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }
        return res.status(500).send({ message: err.message });
    }
};

export const editProfile = async (req, res) => {
    let newPath;
    try {
        const token = req.header["authorization"]
        if (!token) {
            return res.status(403).send({ message: 'Access token is required' })
        }
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err) => {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).send({ message: 'Access token is expried' })
            }
        })

        const userId = decoded.id

        const { firstname, lastname, email, phone, identification_number, address, insurance_number, role_id } = req.body
        const action = 'editProfile'
        const validateObj = { firstname, lastname, email }
        const validateErr = validation(action, validateObj)
        if (validateErr) {
            return res.status(400).send({ message: validateErr})
        }
        const avatar = null
        if (req.file) {
            
        }
    } catch (err) {
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