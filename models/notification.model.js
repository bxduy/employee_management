import { DataTypes } from 'sequelize'
import sequelize from '../config/sequelize.js';

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        unique: true
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    maker_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    create_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false,
    tableName: 'notifications'
});

export default Notification;