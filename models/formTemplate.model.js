import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const FormTemplate = sequelize.define('FormTemplate', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    criteria: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    timestamps: false,
    tableName: 'form_template'
});

export default FormTemplate;