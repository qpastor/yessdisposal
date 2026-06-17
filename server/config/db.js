import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

const { Pool } = pkg;

// --- LIFECYCLE CONFIGURATION OPTIMIZATIONS ---
const connectionTuning = {
  max: 10,                   // Maximum pool clients allowed
  idleTimeoutMillis: 30000,  // Discard inactive sockets after 30 seconds
  connectionTimeoutMillis: 2000, // Fail fast if connection drops
  keepAlive: true            // Send heartbeat packets to prevent firewall timeouts
};

const dbConfig = process.env.DATABASE_URL 
  ? { 
      connectionString: process.env.DATABASE_URL,
      ssl: isProd ? { rejectUnauthorized: false } : false,
      ...connectionTuning // 👈 Spreads configuration rules into the string object
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      ...connectionTuning // 👈 Spreads configuration rules into local object
    };

const pool = new Pool(dbConfig);

// Catch unexpected connection drop errors in the background
pool.on('error', (err) => {
  console.error('⚠️ Unexpected idle client connection drop:', err.message);
});

// Test the connection immediately
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err.stack);
  } else {
    console.log('✅ Connected to PostgreSQL at:', res.rows[0].now);
  }
});

export default pool;