const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const connectionString = process.env.DATABASE_URL;
console.log('Connecting to:', connectionString);

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    console.log('Connecting...');
    const client = await pool.connect();
    console.log('Connected! Querying...');
    const res = await client.query('SELECT NOW()');
    console.log('Query result:', res.rows[0]);
    client.release();
  } catch (err) {
    console.error('Connection failed completely!');
    console.error(err);
  } finally {
    await pool.end();
  }
}

test();
