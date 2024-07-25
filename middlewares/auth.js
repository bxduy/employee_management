import jwt from 'jsonwebtoken'
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
        let userId
        try {
            decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
            userId = decoded.id
        } catch (err) {
            return res.status(403).json({ message: err.message })
        }
        const tokenKey = `${userId}-accessToken`
        const permissionKey = `${userId}-permission`
        const [existingToken, permissions] = await Promise.all([
            redisClient.get(tokenKey),
            redisClient.get(permissionKey)
        ])
        if (!existingToken && existingToken !== token) {
            return res.status(403).json({ message: 'Token mismatch or expired' })
        }
        req.user = decoded
        if (requiredPermissions.length === 0) {
            return next()
        }
        if (!permissions) {
            return res.status(403).send({ message: 'No permissions found' })
        }
        const userPermissions = JSON.parse(permissions)
        const hasRequiredPermissions = requiredPermissions.every(permission =>
            userPermissions.includes(permission)
        )
        if (!hasRequiredPermissions) {
            return res.status(403).send({ message: 'Insufficient permissions' })
        }
        return next()
    } catch (err) {
        return res.status(500).send({ message: err.message })
    }
}