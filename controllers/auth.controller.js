import jwt from 'jsonwebtoken'
import db from '../models/index.js'
import dotenv from 'dotenv'
dotenv.config();
import { generateAccessToken, generateRefreshToken } from "../utils/config.js"
import { validation } from "../utils/validation.js"
import bcrypt from 'bcryptjs'
import { securepassword } from '../utils/securePassword.js'
import redisClient from '../config/redis.js'

const User = db.User


// check login use employee_code and password
export const login = async (req, res) => {
    try {
        const { employee_code, password } = req.body
        const validateObj = { employee_code, password }
        const action = 'login'
        // validate employee_code and password
        const validateErr = validation(action, validateObj)
        if (validateErr) {
            return res.status(400).send({ message: validateErr })
        }
        // Check if this employee is in the system
        const existingUser = await User.findOne({ where: { employee_code: employee_code } })
        // If employee is not found
        if (!existingUser) {
            return res.status(404).send({ message: 'User not found' })
        }
        // compare password
        const checkPassword = await bcrypt.compare(password, existingUser.password_hash)
        // If password is incorrect
        if (!checkPassword) { 
            return res.status(403).send({ message: "Invalid password!" })
        }
        // generate token
        const [ accessToken, refreshToken ] = await Promise.all([generateAccessToken(existingUser), generateRefreshToken(existingUser)])
        await User.update({
            refresh_token: refreshToken,
        }, {
            where: {
                id: existingUser.id
            }
        })

        const user = {
            id: existingUser.id,
            employee_code: existingUser.employee_code,
            firstname: existingUser.firstname,
            lastname: existingUser.lastname,
            email: existingUser.email,
            phone: existingUser.phone,
            identification_number: existingUser.identification_number,
            address: existingUser.address,
            insurance_number: existingUser.insurance_number,
            avatar: existingUser.avatar,
            role_id: existingUser.role_id,
        }
        return res.status(200).send({ accessToken, refreshToken, user})
    } catch (err) {
        return res.status(500).send({ message: err.message })
    }
}

export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body
        if (!refreshToken) {
            return res.status(401).send({ message: 'Refresh token is required' })
        }
        const user = await User.findOne({
            where: {
                refresh_token: refreshToken
            },
            attributes: ['employee_code']
        });
        if (!user) {
            return res.status(401).send({ message: 'Refresh token is not found' });
        }
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async(err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    await User.update({
                        refresh_token: null,
                        where: {
                            id: user.id
                        }
                    })
                    return res.status(401).send({ message: 'Please login again' })
                }
                return res.status(401).send({ message: 'Unauthorized' })
            }
            const newAccessToken = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXP })
            const key = `${user.id}-accessToken`
            await redisClient.set(key, newAccessToken)
            const expires = process.env.ACCESS_TOKEN_EXP
            await redisClient.pExpire(key, expires)
            res.status(201).send({ newAccessToken: newAccessToken });
        })
    } catch (err) {
        return res.status(500).send({ message: err.message })
    }
}

export const changePassword = async(req, res) => {
    try {
        const userId = req.user.id
        const { oldPassword, newPassword, confirmPassword } = req.body
        if (newPassword !== confirmPassword) {
            return res.status(400).send({ message: 'New password and confirm password do not match' })
        }
        const user = await User.findOne({
            where: { id: userId },
            attributes: ['password_hash']
        })
        
        if (!user) {
            return res.status(404).send({ message: 'User not found' })
        }
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash)
        if (!isMatch) {
            return res.status(400).send({ message: 'Old password is incorrect' })
        }
        const action = 'changePassword'
        const validateObj = { newPassword, confirmPassword }
        const validateErr = validation(action, validateObj)
        if (validateErr) {
            return res.status(400).send({ message: validateErr})
        }
        const newPasswordHash = await securepassword(newPassword)
        await User.update({
            password_hash: newPasswordHash,
        }, {
            where: {
                id: userId
            }
        })
        return res.status(200).send({ message: 'Password changed successfully' })
    } catch (err) { 
        return res.status(500).send({ message: err.message })
    }
}

export const logout = async (req, res) => { 
    try {
        const userId = req.user.id
        await User.update({
            refresh_token: null,
        }, {
            where: {
                id: userId
            }
        })
        const key = `${userId}-accessToken`
        await redisClient.del(key)
        return res.status(200).send({ message: 'Logout successfully' })
    } catch (err) { 
        return res.status(500).send({ message: err.message })
    }
}