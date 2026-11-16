
const mysql = require('mysql2/promise');

for (const key of ['DB_HOST','DB_USER','DB_PASSWORD','DB_NAME']) {
  if (!process.env[key]) throw new Error(`Variável MySQL ausente: ${key}`);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  timezone: 'Z',
  decimalNumbers: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT 1 AS connected');
    console.log('[MySQL] Conexão estabelecida:', rows[0].connected);
  } finally {
    connection.release();
  }
}

module.exports = { pool, testConnection };
