// server/db.js
require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Missing DATABASE_URL environment variable.');
}

const sslMode = (process.env.DB_SSL || 'require').toLowerCase();
const useSsl = sslMode !== 'disable';

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.PG_POOL_MAX || '10', 10)
});

pool.on('error', (err) => {
  console.error('Unexpected PG pool error:', err);
});

async function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
