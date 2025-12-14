# 🔧 Database Connection Troubleshooting

## Current Issue

The migration is failing with connection errors. Let's verify your connection string.

## ✅ Step 1: Verify Your .env File

Your `.env` file should have the correct format:

```env
# Connection pooling (for queries)
DATABASE_URL="postgresql://postgres.ugftdfrkvfnmajthbfqc:YOUR_ACTUAL_PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (for migrations)
DIRECT_URL="postgresql://postgres.ugftdfrkvfnmajthbfqc:YOUR_ACTUAL_PASSWORD@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

**Important:**
- Replace `YOUR_ACTUAL_PASSWORD` with your real Supabase password
- No brackets `[]` around the password
- Password should be URL-encoded if it contains special characters

## 🔍 Step 2: Test Connection Directly

Test if you can connect using `psql`:

```bash
psql "postgresql://postgres.ugftdfrkvfnmajthbfqc:YOUR_PASSWORD@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

If this works, the connection string is correct.

## 🔐 Step 3: URL Encode Password (if needed)

If your password contains special characters, you need to URL-encode them:

- `@` becomes `%40`
- `#` becomes `%23`
- `$` becomes `%24`
- `%` becomes `%25`
- `&` becomes `%26`
- `+` becomes `%2B`
- `=` becomes `%3D`
- `?` becomes `%3F`
- `/` becomes `%2F`
- ` ` (space) becomes `%20`

**Example:**
If your password is `MyP@ss#123`, it should be `MyP%40ss%23123`

## 🌐 Step 4: Alternative Connection String Format

Try adding SSL parameters:

```env
DATABASE_URL="postgresql://postgres.ugftdfrkvfnmajthbfqc:YOUR_PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres.ugftdfrkvfnmajthbfqc:YOUR_PASSWORD@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

## 📋 Step 5: Get Connection String from Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Find **Connection string** section
4. Copy the **Connection pooling** string for `DATABASE_URL`
5. Copy the **Direct connection** string for `DIRECT_URL`

## 🧪 Step 6: Test Connection Script

Run the connection test:

```bash
npx tsx scripts/test-connection.ts
```

## ✅ Once Connection Works

Then run the migration:

```bash
npx prisma migrate dev --name init
```

## 🆘 Still Having Issues?

1. **Check Supabase Dashboard**: Verify your project is active
2. **Check IP Restrictions**: Supabase might have IP allowlist
3. **Check Password**: Copy directly from Supabase dashboard
4. **Try Direct Connection**: Use the direct connection string (port 5432) for both URLs temporarily

