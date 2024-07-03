import jwt from 'jsonwebtoken'
import db from '../models/index.js'
import dotenv from 'dotenv'
dotenv.config();
const User = db.User
const Role = db.Role
const Permission = db.Permission

export const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']
    if (!token) {
        return res.status(401).json({ message: 'Access token is missing' })
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: err.message })
        }
        
        req.user = user
        next()
    })
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