import 'dotenv/config';

function positive(name, fallback) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(name + ' deve ser um inteiro positivo.');
  return value;
}

export const config = {
  port: positive('PORT', 3001),
  database: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: positive('DB_PORT', 3306),
    database: process.env.DB_NAME || 'meow_produtos',
    username: process.env.DB_USER || 'meow',
    password: process.env.DB_PASSWORD || 'meow_dev',
  },
  origins: (process.env.CORS_ORIGINS || 'http://localhost:8080,http://localhost:5173,http://127.0.0.1:5173').split(',').map(value => value.trim()).filter(Boolean),
};
