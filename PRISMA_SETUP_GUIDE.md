# 🚀 Prisma Setup & Migration Guide

## Step-by-Step Implementation

### Step 1: Install Prisma Dependencies

```bash
cd heromedianetworks
npm install prisma @prisma/client
npm install -D prisma
```

### Step 2: Configure Environment Variables

Ensure your `.env` file (or `.env.local`) has the database connection string:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/tapnova?schema=public"
NEXTAUTH_SECRET="your-nextauth-secret-here"
```

**Format:** `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA`

### Step 3: Initialize Prisma (if not already done)

The schema file is already created at `prisma/schema.prisma`. If you need to reinitialize:

```bash
npx prisma init
```

### Step 4: Create Database (if it doesn't exist)

```bash
# Using psql
createdb tapnova

# Or using PostgreSQL client
psql -U postgres -c "CREATE DATABASE tapnova;"
```

### Step 5: Run Initial Migration

This will create all tables, indexes, and constraints:

```bash
npx prisma migrate dev --name init
```

**What this does:**
- Creates migration files in `prisma/migrations/`
- Applies the migration to your database
- Generates Prisma Client

### Step 6: Generate Prisma Client

```bash
npx prisma generate
```

This creates the TypeScript types and client code in `node_modules/.prisma/client/`.

### Step 7: Verify Database Structure

Open Prisma Studio to visually inspect your database:

```bash
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can:
- View all tables
- Add/edit/delete records
- Test relationships

### Step 8: Update Database Connection File

Update `src/lib/db.ts` to use Prisma Client:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
```

### Step 9: Update API Routes (Gradual Migration)

Start migrating API routes from raw SQL to Prisma queries. Example:

**Before (raw SQL):**
```typescript
const result = await pool.query(
  'SELECT id, name, email FROM publishers WHERE status = $1',
  ['approved']
);
```

**After (Prisma):**
```typescript
const publishers = await prisma.publisher.findMany({
  where: { status: 'approved' },
  select: { id: true, name: true, email: true }
});
```

---

## 📋 Migration Checklist

### Database Setup
- [ ] Install Prisma dependencies
- [ ] Configure DATABASE_URL in .env
- [ ] Create database (if needed)
- [ ] Run initial migration
- [ ] Generate Prisma Client
- [ ] Verify with Prisma Studio

### Code Migration
- [ ] Update `lib/db.ts` to use Prisma Client
- [ ] Migrate admin API routes
- [ ] Migrate publisher API routes
- [ ] Migrate offer API routes
- [ ] Migrate link API routes
- [ ] Migrate click tracking routes
- [ ] Migrate conversion routes
- [ ] Migrate dashboard routes
- [ ] Test all endpoints
- [ ] Remove old `pg` Pool code (optional)

---

## 🔄 Common Prisma Operations

### Create Records

```typescript
// Single create
const publisher = await prisma.publisher.create({
  data: {
    name: 'John Doe',
    email: 'john@example.com',
    password: hashedPassword,
    status: 'pending'
  }
});

// Create with relations
const link = await prisma.link.create({
  data: {
    offer_id: 1,
    publisher_id: publisherId,
    name: 'My Link'
  },
  include: {
    offer: true,
    publisher: true
  }
});
```

### Read Records

```typescript
// Find many with filters
const publishers = await prisma.publisher.findMany({
  where: {
    status: 'approved',
    email: { contains: '@example.com' }
  },
  orderBy: { created_at: 'desc' },
  take: 10,
  skip: 0
});

// Find unique
const publisher = await prisma.publisher.findUnique({
  where: { email: 'john@example.com' },
  include: {
    links: true,
    clicks: true
  }
});

// Count
const count = await prisma.publisher.count({
  where: { status: 'pending' }
});
```

### Update Records

```typescript
const publisher = await prisma.publisher.update({
  where: { id: publisherId },
  data: {
    status: 'approved',
    updated_at: new Date()
  }
});

// Update many
await prisma.publisher.updateMany({
  where: { status: 'pending' },
  data: { status: 'approved' }
});
```

### Delete Records

```typescript
// Delete single
await prisma.publisher.delete({
  where: { id: publisherId }
});

// Delete many
await prisma.click.deleteMany({
  where: {
    timestamp: { lt: new Date('2024-01-01') }
  }
});
```

### Complex Queries

```typescript
// Aggregations
const stats = await prisma.conversion.aggregate({
  where: { pub_id: publisherId },
  _sum: { amount: true, commission_amount: true },
  _count: { id: true },
  _avg: { amount: true }
});

// Group by (using raw SQL for complex aggregations)
const grouped = await prisma.$queryRaw`
  SELECT 
    DATE(created_at) as date,
    COUNT(*) as count,
    SUM(amount) as total
  FROM conversions
  WHERE pub_id = ${publisherId}
  GROUP BY DATE(created_at)
  ORDER BY date DESC
`;

// Transactions
await prisma.$transaction(async (tx) => {
  const link = await tx.link.create({ data: {...} });
  await tx.click.create({ data: { link_id: link.id, ...} });
});
```

---

## 🛠️ Troubleshooting

### Migration Issues

**Error: "Database schema is not empty"**
- Solution: Use `npx prisma migrate dev --create-only` to create migration without applying
- Or use `npx prisma db push` for development (not recommended for production)

**Error: "Relation does not exist"**
- Solution: Ensure all migrations are applied: `npx prisma migrate deploy`
- Check DATABASE_URL is correct

### Type Issues

**Error: "Type 'X' is not assignable to type 'Y'"
- Solution: Regenerate Prisma Client: `npx prisma generate`
- Restart TypeScript server in your IDE

### Connection Issues

**Error: "Can't reach database server"**
- Check DATABASE_URL format
- Verify PostgreSQL is running
- Check firewall/network settings
- Test connection: `psql $DATABASE_URL`

---

## 📊 Database Schema Overview

### Core Tables:
1. **admins** - Admin users
2. **publishers** - Publisher/affiliate users
3. **offers** - Marketing offers
4. **links** - Tracking links
5. **clicks** - Click events
6. **conversions** - Conversion events
7. **smartlinks** - Smart link tracking
8. **coupons** - Coupon codes
9. **offer_publishers** - Offer-Publisher relationships
10. **coupon_publishers** - Coupon-Publisher relationships

### Key Relationships:
- Publisher → Links (1:many)
- Publisher → Clicks (1:many)
- Publisher → Conversions (1:many)
- Offer → Links (1:many)
- Offer → Clicks (1:many)
- Offer → Conversions (1:many)
- Link → Clicks (1:many)
- Link → Conversions (1:many)
- Offer ↔ Publisher (many:many via offer_publishers)
- Coupon ↔ Publisher (many:many via coupon_publishers)

---

## 🚀 Next Steps After Setup

1. **Seed Database** (optional): Create seed script for initial data
2. **Update API Routes**: Gradually migrate from raw SQL to Prisma
3. **Add Validation**: Use Zod schemas with Prisma types
4. **Performance**: Add database indexes for frequently queried fields
5. **Monitoring**: Set up query logging in production
6. **Backups**: Configure regular database backups

---

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Migrate Guide](https://www.prisma.io/docs/guides/migrate)

---

## ⚠️ Important Notes

1. **Never commit `.env` files** - Keep DATABASE_URL secret
2. **Always backup before migrations** in production
3. **Test migrations** in development/staging first
4. **Use transactions** for multi-step operations
5. **Monitor query performance** - Use Prisma's query logging
6. **Keep Prisma Client updated** - Run `npx prisma generate` after schema changes

