/**
 * Test both Prisma and pg Pool connections
 */
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient();

async function testConnections() {
  console.log('🔌 Testing Database Connections...\n');

  // Test Prisma
  try {
    console.log('1. Testing Prisma Client...');
    await prisma.$connect();
    const prismaResult = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('   ✅ Prisma: Connected successfully\n');
  } catch (error: any) {
    console.log('   ❌ Prisma Error:', error.message, '\n');
  }

  // Test pg Pool
  try {
    console.log('2. Testing pg Pool...');
    const result = await pool.query('SELECT 1 as test');
    console.log('   ✅ pg Pool: Connected successfully\n');
  } catch (error: any) {
    console.log('   ❌ pg Pool Error:', error.message, '\n');
  }

  // Test query with pg Pool
  try {
    console.log('3. Testing pg Pool query (publishers table)...');
    const result = await pool.query('SELECT COUNT(*) FROM publishers');
    console.log('   ✅ pg Pool Query: Success -', result.rows[0], '\n');
  } catch (error: any) {
    console.log('   ❌ pg Pool Query Error:', error.message, '\n');
  }

  // Test Prisma query
  try {
    console.log('4. Testing Prisma query (publishers table)...');
    const count = await prisma.publisher.count();
    console.log('   ✅ Prisma Query: Success -', count, 'publishers\n');
  } catch (error: any) {
    console.log('   ❌ Prisma Query Error:', error.message, '\n');
  }

  await prisma.$disconnect();
  await pool.end();
}

testConnections();

