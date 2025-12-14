/**
 * Comprehensive Backend & Database Testing Script
 * 
 * This script tests:
 * - Database connection (Prisma)
 * - Publisher signup
 * - Publisher login
 * - Admin login
 * - User info retrieval
 * - Dashboard data
 * - Other key endpoints
 * 
 * Usage:
 *   npx tsx scripts/test-backend.ts
 *   or
 *   npm run test:backend
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_PUBLISHER = {
  name: 'Test Publisher',
  email: `test-${Date.now()}@example.com`,
  company: 'Test Company',
  phone: '+1234567890',
  password: 'TestPassword123!',
};

const TEST_ADMIN = {
  name: 'Test Admin',
  email: `admin-${Date.now()}@example.com`,
  password: 'AdminPassword123!',
  role: 'admin' as const,
  status: 'active' as const,
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(name: string) {
  log(`\n🧪 Testing: ${name}`, colors.cyan);
}

function logSuccess(message: string, data?: any) {
  log(`✅ ${message}`, colors.green);
  if (data) console.log('   Data:', JSON.stringify(data, null, 2));
}

function logError(message: string, error?: any) {
  log(`❌ ${message}`, colors.red);
  if (error) console.error('   Error:', error);
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

// ============================================
// DATABASE TESTS
// ============================================

async function testDatabaseConnection(): Promise<TestResult> {
  logTest('Database Connection');
  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    logSuccess('Database connection successful');
    return { name: 'Database Connection', passed: true, data: result };
  } catch (error: any) {
    logError('Database connection failed', error.message);
    return { name: 'Database Connection', passed: false, error: error.message };
  }
}

async function testDatabaseTables(): Promise<TestResult> {
  logTest('Database Tables Existence');
  try {
    const tables = [
      'admins',
      'publishers',
      'offers',
      'links',
      'clicks',
      'conversions',
      'smartlinks',
      'coupons',
      'offer_publishers',
      'coupon_publishers',
    ];

    const existingTables: string[] = [];
    for (const table of tables) {
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM ${table} LIMIT 1`);
        existingTables.push(table);
      } catch (e) {
        // Table doesn't exist or error
      }
    }

    if (existingTables.length === tables.length) {
      logSuccess(`All ${tables.length} tables exist`);
      return { name: 'Database Tables', passed: true, data: { tables: existingTables } };
    } else {
      logWarning(`Only ${existingTables.length}/${tables.length} tables exist`);
      logWarning(`Missing: ${tables.filter(t => !existingTables.includes(t)).join(', ')}`);
      return {
        name: 'Database Tables',
        passed: false,
        error: `Missing tables: ${tables.filter(t => !existingTables.includes(t)).join(', ')}`,
      };
    }
  } catch (error: any) {
    logError('Failed to check tables', error.message);
    return { name: 'Database Tables', passed: false, error: error.message };
  }
}

// ============================================
// API ENDPOINT TESTS
// ============================================

async function testPublisherSignup(): Promise<TestResult> {
  logTest('Publisher Signup API');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/publisher-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_PUBLISHER),
    });

    const data = await response.json();

    if (response.ok) {
      logSuccess('Publisher signup successful', data);
      return { name: 'Publisher Signup', passed: true, data };
    } else {
      logError(`Publisher signup failed: ${data.message}`, data);
      return { name: 'Publisher Signup', passed: false, error: data.message };
    }
  } catch (error: any) {
    logError('Publisher signup request failed', error.message);
    return { name: 'Publisher Signup', passed: false, error: error.message };
  }
}

async function testPublisherLogin(): Promise<TestResult> {
  logTest('Publisher Login API');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_PUBLISHER.email,
        password: TEST_PUBLISHER.password,
        loginType: 'publisher',
      }),
    });

    if (response.ok || response.status === 302) {
      const cookies = response.headers.get('set-cookie');
      logSuccess('Publisher login successful', { hasSession: !!cookies });
      return { name: 'Publisher Login', passed: true, data: { hasSession: !!cookies } };
    } else {
      const data = await response.json().catch(() => ({}));
      logError(`Publisher login failed: ${response.status}`, data);
      return { name: 'Publisher Login', passed: false, error: `Status: ${response.status}` };
    }
  } catch (error: any) {
    logError('Publisher login request failed', error.message);
    return { name: 'Publisher Login', passed: false, error: error.message };
  }
}

async function testUserInfo(): Promise<TestResult> {
  logTest('User Info API');
  try {
    const response = await fetch(
      `${BASE_URL}/api/user-info?email=${encodeURIComponent(TEST_PUBLISHER.email)}`
    );

    if (response.ok) {
      const data = await response.json();
      logSuccess('User info retrieved', data);
      return { name: 'User Info', passed: true, data };
    } else {
      const error = await response.json().catch(() => ({}));
      logError(`User info failed: ${response.status}`, error);
      return { name: 'User Info', passed: false, error: `Status: ${response.status}` };
    }
  } catch (error: any) {
    logError('User info request failed', error.message);
    return { name: 'User Info', passed: false, error: error.message };
  }
}

async function testDashboardData(): Promise<TestResult> {
  logTest('Dashboard Data API');
  try {
    // First, get a publisher ID from database
    const publisher = await prisma.publisher.findFirst({
      where: { email: TEST_PUBLISHER.email },
    });

    if (!publisher) {
      logWarning('No publisher found for dashboard test, skipping');
      return { name: 'Dashboard Data', passed: true, data: { skipped: true } };
    }

    const response = await fetch(
      `${BASE_URL}/api/dashboard?publisher_id=${publisher.id}`
    );

    if (response.ok) {
      const data = await response.json();
      logSuccess('Dashboard data retrieved', {
        totalClicks: data.totalClicks,
        totalConversions: data.totalConversions,
      });
      return { name: 'Dashboard Data', passed: true, data };
    } else {
      const error = await response.json().catch(() => ({}));
      logError(`Dashboard data failed: ${response.status}`, error);
      return { name: 'Dashboard Data', passed: false, error: `Status: ${response.status}` };
    }
  } catch (error: any) {
    logError('Dashboard data request failed', error.message);
    return { name: 'Dashboard Data', passed: false, error: error.message };
  }
}

async function testOffersDisplay(): Promise<TestResult> {
  logTest('Offers Display API');
  try {
    const response = await fetch(`${BASE_URL}/api/offers/display`);

    if (response.ok) {
      const data = await response.json();
      logSuccess(`Offers retrieved: ${Array.isArray(data) ? data.length : 'N/A'} offers`);
      return { name: 'Offers Display', passed: true, data: { count: Array.isArray(data) ? data.length : 0 } };
    } else {
      const error = await response.json().catch(() => ({}));
      logError(`Offers display failed: ${response.status}`, error);
      return { name: 'Offers Display', passed: false, error: `Status: ${response.status}` };
    }
  } catch (error: any) {
    logError('Offers display request failed', error.message);
    return { name: 'Offers Display', passed: false, error: error.message };
  }
}

// ============================================
// DATABASE OPERATION TESTS (Using Prisma)
// ============================================

async function testPrismaCreatePublisher(): Promise<TestResult> {
  logTest('Prisma: Create Publisher');
  try {
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
    const publisher = await prisma.publisher.create({
      data: {
        name: 'Prisma Test Publisher',
        email: `prisma-test-${Date.now()}@example.com`,
        company: 'Prisma Test Co',
        phone: '+1234567890',
        password: hashedPassword,
        status: 'pending',
      },
    });

    logSuccess('Publisher created via Prisma', { id: publisher.id, email: publisher.email });
    return { name: 'Prisma Create Publisher', passed: true, data: publisher };
  } catch (error: any) {
    logError('Prisma create publisher failed', error.message);
    return { name: 'Prisma Create Publisher', passed: false, error: error.message };
  }
}

async function testPrismaQueryPublishers(): Promise<TestResult> {
  logTest('Prisma: Query Publishers');
  try {
    const publishers = await prisma.publisher.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    logSuccess(`Retrieved ${publishers.length} publishers via Prisma`);
    return { name: 'Prisma Query Publishers', passed: true, data: { count: publishers.length } };
  } catch (error: any) {
    logError('Prisma query publishers failed', error.message);
    return { name: 'Prisma Query Publishers', passed: false, error: error.message };
  }
}

async function testPrismaRelations(): Promise<TestResult> {
  logTest('Prisma: Test Relations');
  try {
    const publisher = await prisma.publisher.findFirst({
      include: {
        links: true,
        clicks: true,
        conversions: true,
      },
    });

    if (publisher) {
      logSuccess('Relations work correctly', {
        links: publisher.links.length,
        clicks: publisher.clicks.length,
        conversions: publisher.conversions.length,
      });
      return { name: 'Prisma Relations', passed: true, data: publisher };
    } else {
      logWarning('No publisher found for relation test');
      return { name: 'Prisma Relations', passed: true, data: { skipped: true } };
    }
  } catch (error: any) {
    logError('Prisma relations test failed', error.message);
    return { name: 'Prisma Relations', passed: false, error: error.message };
  }
}

// ============================================
// CLEANUP
// ============================================

async function cleanupTestData(): Promise<void> {
  logTest('Cleaning up test data');
  try {
    // Delete test publishers
    await prisma.publisher.deleteMany({
      where: {
        email: {
          contains: 'test-',
        },
      },
    });

    logSuccess('Test data cleaned up');
  } catch (error: any) {
    logError('Cleanup failed', error.message);
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  log('\n' + '='.repeat(60), colors.blue);
  log('🚀 HeroMedia Networks - Backend & Database Test Suite', colors.blue);
  log('='.repeat(60) + '\n', colors.blue);

  // Database tests
  results.push(await testDatabaseConnection());
  results.push(await testDatabaseTables());

  // Prisma operation tests
  results.push(await testPrismaCreatePublisher());
  results.push(await testPrismaQueryPublishers());
  results.push(await testPrismaRelations());

  // API endpoint tests
  results.push(await testPublisherSignup());
  results.push(await testPublisherLogin());
  results.push(await testUserInfo());
  results.push(await testDashboardData());
  results.push(await testOffersDisplay());

  // Cleanup
  await cleanupTestData();

  // Summary
  log('\n' + '='.repeat(60), colors.blue);
  log('📊 Test Summary', colors.blue);
  log('='.repeat(60), colors.blue);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  log(`\nTotal Tests: ${total}`, colors.cyan);
  log(`✅ Passed: ${passed}`, colors.green);
  log(`❌ Failed: ${failed}`, failed > 0 ? colors.red : colors.reset);

  if (failed > 0) {
    log('\nFailed Tests:', colors.red);
    results
      .filter(r => !r.passed)
      .forEach(r => {
        log(`  - ${r.name}: ${r.error}`, colors.red);
      });
  }

  log('\n' + '='.repeat(60) + '\n', colors.blue);

  // Disconnect Prisma
  await prisma.$disconnect();

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  logError('Test suite crashed', error);
  process.exit(1);
});

