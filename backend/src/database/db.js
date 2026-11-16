const { pool } = require('./mysql');
async function all(sql, params = []) { const [rows] = await pool.query(sql, params); return rows; }
async function get(sql, params = []) { const rows = await all(sql, params); return rows[0]; }
async function run(sql, params = []) { const [result] = await pool.query(sql, params); return result; }
module.exports = { all, get, run, pool };
