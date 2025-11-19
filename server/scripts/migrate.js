// scripts/migrate.js
const fs = require('fs');
const path = require('path');
const db = require('../server/db');

async function run() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations found.');
    process.exit(0);
  }
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log('Running', file);
    await db.query(sql);
  }
  await db.pool.end();
  console.log('Migrations done.');
  process.exit(0);
}
run().catch(async (e) => { console.error(e); try { await db.pool.end(); } catch{}; process.exit(1); });
