import db from '../models/index.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config(); 
const User = db.User;
const Role = db.Role;
const Permission = db.Permission;

export const getPermission = async (req, res) => {
    try {
        const id = rep.user.id
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
        return res.status(200).send({ permissionList: permissionList });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
}