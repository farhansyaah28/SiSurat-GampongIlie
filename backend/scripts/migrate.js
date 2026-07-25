require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

(async () => {
  const connectionString = process.env.DATABASE_URL;
  const isSSL = process.env.DB_SSL === 'true' || connectionString?.includes('supabase.co') || connectionString?.includes('supabase.com');
  
  const pool = new Pool({
    connectionString,
    ssl: isSSL ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Membaca file schema_postgres.sql...');
    const schemaPath = path.join(__dirname, '../../database/schema_postgres.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Menjalankan migrasi database ke Supabase...');
    await pool.query(sql);
    console.log('✓ Migrasi database berhasil dilakukan.');
    process.exit(0);
  } catch (err) {
    console.error('✗ Gagal melakukan migrasi:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
