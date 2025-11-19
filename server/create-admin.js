// create-admin.js
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const name = process.argv[2] || 'admin';
    const email = process.argv[3] || 'admin@example.com';
    const password = process.argv[4] || 'changeme123';
    const hash = await bcrypt.hash(password, 10);

    const res = await pool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id`,
      [name, email, hash, 'admin']
    );
    console.log('Created user id:', res.rows[0].id);
  } catch (e) {
    console.error('err', e);
  } finally {
    await pool.end();
  }
})();
