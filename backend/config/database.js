const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

// Supabase and hosted postgres usually require SSL.
// Enable SSL if explicitly configured, or automatically if connecting to a supabase domain.
const isSSL = process.env.DB_SSL === 'true' || connectionString?.includes('supabase.co') || connectionString?.includes('supabase.com');

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: isSSL ? { rejectUnauthorized: false } : false
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      ssl: isSSL ? { rejectUnauthorized: false } : false
    };

const pool = new Pool(poolConfig);

// Test connection
pool.connect()
  .then(client => {
    console.log('✓ Database connected successfully (PostgreSQL/Supabase)');
    client.release();
  })
  .catch(err => {
    console.error('✗ Database connection failed:', err.message);
  });

// Compatibility wrapper to mimic mysql2/promise behaviour
const db = {
  execute: async (sql, params = []) => {
    // Convert "?" placeholders to "$1", "$2", etc.
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);

    try {
      const res = await pool.query(pgSql, params);
      // Return [rows, result] to mimic mysql2
      return [res.rows, res];
    } catch (err) {
      console.error('Database query error:', err.message);
      console.error('SQL query:', pgSql);
      console.error('Parameters:', params);
      throw err;
    }
  },

  query: async (sql, params = []) => {
    return db.execute(sql, params);
  },

  getConnection: async () => {
    const client = await pool.connect();
    return {
      release: () => client.release()
    };
  },

  end: () => pool.end()
};

module.exports = db;
