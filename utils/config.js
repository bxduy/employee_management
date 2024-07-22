import { v4 as uuidv4 } from 'uuid'
import db from '../models/index.js'
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import redisClient from '../config/redis.js';
dotenv.config()
const User = db.User

export const generateEmployeeCode = async () => {
    let employee_code
    let uniqueId = false
    while (!uniqueId) {
        employee_code = uuidv4().substring(0, 4).toUpperCase();
        const existingUser = await User.findOne({ where: { employee_code: employee_code } })
        if (!existingUser) {
            uniqueId = true
        }
    }
    return employee_code
}

export const generateAccessToken = async(user) => {
    const accessToken = jwt.sign({ id: user.id, employee_code: user.employee_code }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXP })
    const key = `${user.id}-accessToken`
    await redisClient.set(key, accessToken)
    const expires = process.env.REDIS_TOKEN_EXP
    await redisClient.expire(key, expires)
    return accessToken
}

export const generateRefreshToken = async (user) => {
    const refreshToken = jwt.sign({ id: user.id, employee_code: user.employee_code }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXP })
    return refreshToken
}