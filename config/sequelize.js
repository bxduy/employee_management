import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config()

// Initialize Sequelize with database information
const sequelize = new Sequelize(process.env.DB_NAME,process.env.DB_USER , process.env.DB_PASS, {
  host: process.env.HOST,
  dialect: process.env.DIALECT
});
export default sequelize