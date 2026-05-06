import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config(); // This replaces require('dotenv').config()

// --- ADD THIS LINE ---
const isProd = process.env.NODE_ENV === 'production';

const { Pool } = pkg;

const dbConfig = process.env.DATABASE_URL 
  ? { 
      connectionString: process.env.DATABASE_URL,
      ssl: isProd ? { rejectUnauthorized: false } : false 
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    };

const pool = new Pool(dbConfig);
// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });

// Test the connection immediately
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err.stack);
  } else {
    console.log('✅ Connected to PostgreSQL at:', res.rows[0].now);
  }
});

export default pool;