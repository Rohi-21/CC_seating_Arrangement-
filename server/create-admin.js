// create-admin.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./server/db');

(async () => {
  try {
    const name = process.argv[2] || 'admin';
    const email = (process.argv[3] || 'admin@example.com').toLowerCase();
    const password = process.argv[4] || 'changeme123';
    const hash = await bcrypt.hash(password, 10);

    const res = await db.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id`,
      [name, email, hash, 'admin']
    );
    console.log('Created user id:', res.rows[0].id);
    await db.pool.end();
    process.exit(0);
  } catch (e) {
    console.error('err', e);
    try { await db.pool.end(); } catch(e){}
    process.exit(1);
  }
})();
