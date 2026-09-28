import { Sequelize } from "sequelize";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = process.env;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "mysql",
  logging: false,
});

// Cria o banco (schema) se ele ainda não existir. 
export async function garantirBanco() {
  try {
    const conexao = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
    });
    await conexao.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await conexao.end();
  } catch (erro) {
    console.warn("⚠️  Não foi possível verificar/criar o banco:", erro.message);
  }
}

export default sequelize;
