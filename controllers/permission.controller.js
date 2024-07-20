import db from '../models/index.js';
import dotenv from 'dotenv';
import redisClient from '../config/redis.js';

dotenv.config(); 
const User = db.User;
const Role = db.Role;
const Permission = db.Permission;

export const getPermission = async (req, res) => {
    try {
        const id = req.user.id
        const userWithPermission = await User.findOne({
            where: {
                id: id
            },
            include: [{
                model: Role,
                include: [{
                    model: Permission
                }]
            }]
        })
        if (!userWithPermission) { 
            return res.status(404).send({ message: 'User not found' });
        }
        let permissionList = [];
        userWithPermission.Role.Permissions.forEach(permission => {
            permissionList.push(permission.name);
        });
        const key = `${id}-permission`
        await redisClient.set(key, JSON.stringify(permissionList))
        return res.status(200).send({ permissionList: permissionList });
    } catch (err) {
        return res.status(500).send({ message: err.message });
    }
}