import { Pool } from 'pg';

// Determine if SSL should be enabled
const shouldUseSSL = () => {
  const dbUrl = process.env.DATABASE_URL || '';
  
  // Always use SSL for cloud databases (Supabase, Railway, Render, etc.)
  if (
    dbUrl.includes('supabase') ||
    dbUrl.includes('pooler') ||
    dbUrl.includes('railway') ||
    dbUrl.includes('render') ||
    dbUrl.includes('aws-') ||
    process.env.NODE_ENV === 'production' ||
    dbUrl.includes('sslmode=require')
  ) {
    return {
      rejectUnauthorized: false, // Accept self-signed certificates for cloud databases
    };
  }
  
  return false;
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: shouldUseSSL(),
});

export default pool;