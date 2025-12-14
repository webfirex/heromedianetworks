# 🧪 Backend & Database Testing Plan

## Overview

This document outlines the comprehensive testing plan for the HeroMedia Networks backend and database. The test suite verifies database connectivity, Prisma operations, API endpoints, and integration between components.

---

## 📋 Test Categories

### 1. Database Connection Tests
- ✅ Prisma Client connection
- ✅ Database tables existence
- ✅ Connection pooling (Supabase)

### 2. Prisma ORM Tests
- ✅ Create operations (Publisher)
- ✅ Read operations (Query publishers)
- ✅ Relations (Links, Clicks, Conversions)
- ✅ Type safety

### 3. Authentication & User Management
- ✅ Publisher signup
- ✅ Publisher login
- ✅ Admin login
- ✅ User info retrieval
- ✅ Session management

### 4. API Endpoint Tests
- ✅ Dashboard data
- ✅ Offers display
- ✅ Publisher endpoints
- ✅ Admin endpoints (if accessible)

### 5. Data Integrity Tests
- ✅ Foreign key constraints
- ✅ Unique constraints
- ✅ Enum validations
- ✅ Data types

---

## 🚀 Running Tests

### Prerequisites

1. **Update environment variables** in `env` file:
   ```env
   DATABASE_URL="postgresql://postgres.ugftdfrkvfnmajthbfqc:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.ugftdfrkvfnmajthbfqc:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
   ```

2. **Run database migration** (if not done):
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Start development server** (for API tests):
   ```bash
   npm run dev
   ```

### Run All Tests

```bash
npm run test:backend
```

### Run Database-Only Tests

```bash
npm run test:db
```

### Manual Test Execution

```bash
npx tsx scripts/test-backend.ts
```

---

## 📊 Test Coverage

### Database Tests

| Test | Description | Expected Result |
|------|-------------|-----------------|
| Database Connection | Test Prisma Client connection | ✅ Connection successful |
| Tables Existence | Verify all 10 tables exist | ✅ All tables present |
| Prisma Create | Create publisher via Prisma | ✅ Publisher created |
| Prisma Query | Query publishers | ✅ Data retrieved |
| Prisma Relations | Test model relationships | ✅ Relations work |

### API Endpoint Tests

| Endpoint | Method | Test Case | Expected Result |
|----------|--------|-----------|-----------------|
| `/api/auth/publisher-signup` | POST | Valid signup | ✅ 201 Created |
| `/api/auth/publisher-signup` | POST | Duplicate email | ✅ 409 Conflict |
| `/api/auth/publisher-signup` | POST | Missing fields | ✅ 400 Bad Request |
| `/api/auth/signin` | POST | Valid publisher login | ✅ 200/302 Success |
| `/api/auth/signin` | POST | Invalid credentials | ✅ 401 Unauthorized |
| `/api/user-info` | GET | Valid email | ✅ 200 with user data |
| `/api/dashboard` | GET | Valid publisher_id | ✅ 200 with dashboard data |
| `/api/offers/display` | GET | Public endpoint | ✅ 200 with offers |

---

## 🔍 Test Scenarios

### Scenario 1: New Publisher Signup Flow

1. **Test Signup**
   - Send POST to `/api/auth/publisher-signup`
   - Verify response: 201 Created
   - Verify database: Publisher record created

2. **Test Login**
   - Send POST to `/api/auth/signin`
   - Verify response: 200/302 with session
   - Verify cookies set

3. **Test User Info**
   - Send GET to `/api/user-info?email=...`
   - Verify response: 200 with user data

### Scenario 2: Database Operations

1. **Create via Prisma**
   - Use `prisma.publisher.create()`
   - Verify record in database

2. **Query via Prisma**
   - Use `prisma.publisher.findMany()`
   - Verify data retrieval

3. **Test Relations**
   - Query publisher with `include: { links, clicks }`
   - Verify related data loaded

### Scenario 3: Error Handling

1. **Invalid Credentials**
   - Test login with wrong password
   - Verify: 401 Unauthorized

2. **Missing Fields**
   - Test signup with missing data
   - Verify: 400 Bad Request

3. **Duplicate Email**
   - Test signup with existing email
   - Verify: 409 Conflict

---

## 📝 Test Results Interpretation

### Success Indicators

- ✅ **Green checkmarks**: Test passed
- ✅ **All tests green**: System ready for use
- ✅ **Database connection**: Prisma working correctly
- ✅ **API responses**: Endpoints functional

### Failure Indicators

- ❌ **Red X marks**: Test failed
- ❌ **Connection errors**: Check DATABASE_URL
- ❌ **Table missing**: Run migrations
- ❌ **API errors**: Check server running

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Database connection failed | Check DATABASE_URL in env file |
| Tables don't exist | Run `npx prisma migrate dev` |
| API endpoint not found | Ensure dev server is running |
| Authentication failed | Check password in env file |
| Type errors | Run `npx prisma generate` |

---

## 🎯 Testing Checklist

### Before Running Tests

- [ ] Environment variables configured
- [ ] Database migration completed
- [ ] Prisma Client generated
- [ ] Development server running (for API tests)
- [ ] Supabase connection verified

### During Testing

- [ ] All database tests pass
- [ ] All Prisma operations work
- [ ] All API endpoints respond
- [ ] Authentication flows work
- [ ] Data integrity maintained

### After Testing

- [ ] Test data cleaned up
- [ ] No errors in console
- [ ] All tests show ✅
- [ ] Database state verified
- [ ] Ready for development

---

## 🔧 Manual Testing Steps

### 1. Test Database Connection

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
await prisma.$connect();
console.log('✅ Connected');
```

### 2. Test Publisher Signup

```bash
curl -X POST http://localhost:3000/api/auth/publisher-signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "company": "Test Co",
    "phone": "+1234567890",
    "password": "Test123!"
  }'
```

### 3. Test Publisher Login

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "loginType": "publisher"
  }'
```

### 4. Test User Info

```bash
curl http://localhost:3000/api/user-info?email=test@example.com
```

---

## 📈 Performance Testing

### Database Query Performance

- Test query execution time
- Verify indexes are used
- Check connection pooling

### API Response Times

- Signup: < 500ms
- Login: < 300ms
- Dashboard: < 1000ms
- Offers: < 500ms

---

## 🛡️ Security Testing

### Authentication Security

- ✅ Passwords are hashed (bcrypt)
- ✅ Sessions are secure (JWT)
- ✅ SQL injection prevention (Prisma)
- ✅ Input validation

### Data Protection

- ✅ Sensitive data encrypted
- ✅ Environment variables secure
- ✅ Database credentials protected

---

## 📚 Additional Resources

- **Prisma Documentation**: https://www.prisma.io/docs
- **Next.js API Routes**: https://nextjs.org/docs/api-routes/introduction
- **Supabase Connection Pooling**: https://supabase.com/docs/guides/database/connecting-to-postgres

---

## ✅ Success Criteria

All tests should pass with:
- ✅ Database connection: Working
- ✅ Prisma operations: Functional
- ✅ API endpoints: Responding correctly
- ✅ Authentication: Secure and working
- ✅ Data integrity: Maintained

---

**Last Updated**: Created for initial database setup and backend testing
**Status**: Ready for execution

