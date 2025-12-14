# ⚡ Quick Test Guide

## 🚀 Quick Start

### 1. Update Password in `env` file

Replace `[YOUR-PASSWORD]` with your actual Supabase password:

```env
DATABASE_URL="postgresql://postgres.ugftdfrkvfnmajthbfqc:YOUR_ACTUAL_PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.ugftdfrkvfnmajthbfqc:YOUR_ACTUAL_PASSWORD@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

### 2. Run Database Migration

```bash
cd heromedianetworks
npx prisma migrate dev --name init
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Run Tests (in another terminal)

```bash
npm run test:backend
```

---

## 📋 What Gets Tested

✅ **Database Connection** - Prisma connects to Supabase  
✅ **Tables Existence** - All 10 tables are created  
✅ **Publisher Signup** - `/api/auth/publisher-signup`  
✅ **Publisher Login** - `/api/auth/signin`  
✅ **User Info** - `/api/user-info`  
✅ **Dashboard Data** - `/api/dashboard`  
✅ **Offers Display** - `/api/offers/display`  
✅ **Prisma Operations** - Create, Read, Relations  

---

## 🎯 Expected Output

```
🚀 HeroMedia Networks - Backend & Database Test Suite
============================================================

🧪 Testing: Database Connection
✅ Database connection successful

🧪 Testing: Database Tables Existence
✅ All 10 tables exist

🧪 Testing: Publisher Signup API
✅ Publisher signup successful

🧪 Testing: Publisher Login API
✅ Publisher login successful

...

📊 Test Summary
============================================================
Total Tests: 10
✅ Passed: 10
❌ Failed: 0
```

---

## 🔧 Troubleshooting

### Error: "Authentication failed"
- **Fix**: Update password in `env` file

### Error: "Tables don't exist"
- **Fix**: Run `npx prisma migrate dev --name init`

### Error: "Cannot connect to database"
- **Fix**: Check DATABASE_URL format and Supabase credentials

### Error: "API endpoint not found"
- **Fix**: Ensure dev server is running (`npm run dev`)

---

## 📝 Test Script Location

`scripts/test-backend.ts`

---

## 🎉 Success!

If all tests pass, your database and backend are ready! ✅

