import sequelize from '../config/sequelize.js';
import User from './user.model.js';
import Role from './role.model.js';
import Permission from './permission.model.js';
import Notification from './notification.model.js';
import RolePermission from './rolePermission.model.js';
import FormTemplate from './formTemplate.model.js';
import FormData from './formData.model.js';

User.belongsTo(Role, { foreignKey: 'role_id' });
Role.hasMany(User, { foreignKey: 'role_id' });

Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id' });

Notification.belongsTo(User, { foreignKey: 'maker_id' });
User.hasMany(Notification, { foreignKey: 'maker_id' });

FormData.belongsTo(User, { as: 'Sender', foreignKey: 'sender_id' });
User.hasMany(FormData, { as: 'SentForms', foreignKey: 'sender_id' });

FormData.belongsTo(User, { as: 'Approver', foreignKey: 'approver_id' });
User.hasMany(FormData, { as: 'ApprovedForms', foreignKey: 'approver_id' });

const db = {
    sequelize,
    User,
    Role,
    Permission,
    Notification,
    RolePermission,
    FormTemplate,
    FormData
};

export default db;