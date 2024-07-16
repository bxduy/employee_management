import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const FormData = sequelize.define('FormData', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        unique: true
    },
    type: {
        type: DataTypes.ENUM('trial', 'annual'),
        allowNull: true
    },
    data: {
        type: DataTypes.JSON,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('new', 'submitted', 'approved', 'rejected'),
        defaultValue: 'new'
    },
    sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    approver_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
    
}, {
    timestamps: false,
    tableName: 'form_data'
});

export default FormData;