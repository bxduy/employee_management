import jwt from 'jsonwebtoken'
import db from '../models/index.js'
import redisClient from '../config/redis.js';
import dotenv from 'dotenv'
dotenv.config();
const User = db.User
const Role = db.Role
const Permission = db.Permission

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
            if (existingToken && existingToken !== token) {
                return res.status(403).json({ message: 'Token mismatch or expired' })
            }
        } catch (err) {
            return res.status(403).json({ message: err.message })
        }
        req.user = decoded
        if (requiredPermissions.length === 0) {
            next()
        }
        const permissionKey = `${userId}-permission`
        const permissions = await redisClient.get(permissionKey, (err) => {
            if (err) {
                return res.status(500).send({ message: 'Redis error' }) 
            }
        })
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
        next()
    } catch (err) {
        return res.status(500).send({ message: err.message })
    }
}

export const checkPermission = (requiredPermission) => { 
    return async (req, res, next) => {
        const userId = req.user.id
        try {
            const userWithPermission = await User.findOne({
                where: {
                    id: userId,
                },
                include: [{
                    model: Role,
                    include: [{
                        model: Permission,
                    }]
                }]
            })

            if (!userWithPermission || !userWithPermission.Role) {
                return res.status(404).send({ message: 'User or Role not found' })
            }
            const permissions = userWithPermission.Role.Permissions.map(permission => permission.name)
            const checkPermission = permissions.includes(requiredPermission)
            if (!checkPermission) {
                return res.status(403).send({ message: 'You have not permission to perform this action' })
            }
            next()
        } catch (err) {
            return res.status(500).send({ message: err.message })
        }
    }
}