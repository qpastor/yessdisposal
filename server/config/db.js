import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config(); // This replaces require('dotenv').config()

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // This is mandatory for Render/Cloud PostgreSQL connections
    rejectUnauthorized: false,
  },
});
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