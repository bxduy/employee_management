import jwt from 'jsonwebtoken'
import db from '../models/index.js'
import redisClient from '../config/redis.js';
import dotenv from 'dotenv'
dotenv.config();

export const authorize = (requiredPermissions = []) => async (req, res, next) => {
    try {
        const token = req.headers['authorization']
        if (!token) {
            return res.status(401).json({ message: 'Access token is missing' })
        }
        let decoded
        let existingToken
        let userId
        try {
            decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
            userId = decoded.id
            const tokenKey = `${userId}-accessToken`
            existingToken = await redisClient.get(tokenKey)
            if (!existingToken) {
                return res.status(403).json({ message: 'Token not found in Redis' })
            }
            if (existingToken && existingToken !== token) {
                return res.status(403).json({ message: 'Token mismatch or expired' })
            }
        } catch (err) {
            return res.status(403).json({ message: err.message })
        }
        console.log(decoded);
        req.user = decoded
        if (requiredPermissions.length === 0) {
            return next()
        }
        let permissions
        const permissionKey = `${userId}-permission`
        try {
            permissions = await redisClient.get(permissionKey)
            if (!permissions) {
                return res.status(403).send({ message: 'No permissions found in Redis' })
            }
        } catch (err) {
            return res.status(500).send({ message: 'Redis error' })
        }
        if (!permissions) {
            return res.status(403).send({ message: 'No permissions found' })
        }
        const userPermissions = JSON.parse(permissions)
        const hasRequiredPermissions = requiredPermissions.every(permission =>
            userPermissions.includes(permission)
        )
        console.log(hasRequiredPermissions);
        if (!hasRequiredPermissions) {
            return res.status(403).send({ message: 'Insufficient permissions' })
        }
        return next()
    } catch (err) {
        return res.status(500).send({ message: err.message })
    }
}