# 🌱 Test Data Seeding Guide

## Quick Start

This guide will help you populate your database with comprehensive test data for testing the dashboard.

## Prerequisites

1. **Database Connection**: Make sure your database connection is working
2. **Environment Variables**: Ensure your `DATABASE_URL` is set correctly

## Setup Steps

### 1. Configure Database Connection

If you have an `env` file, copy it to `.env`:

```bash
cd heromedianetworks
cp env .env
```

Then edit `.env` and replace `[YOUR-PASSWORD]` with your actual database password:

```env
DATABASE_URL="postgresql://postgres.ugftdfrkvfnmajthbfqc:YOUR_ACTUAL_PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.ugftdfrkvfnmajthbfqc:YOUR_ACTUAL_PASSWORD@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

### 2. Test Database Connection

Before seeding, test your connection:

```bash
npx tsx scripts/test-connection.ts
```

If this works, proceed to step 3.

### 3. Run the Seed Script

```bash
npx tsx scripts/seed-test-data.ts
```

## What Gets Created

The seed script will populate:

- ✅ **Publisher Account**: `legendrycoypgamers@gmail.com` (approved status)
- ✅ **6 Offers**: Various gaming-related offers (active and pending)
- ✅ **4 Tracking Links**: Links for different offers
- ✅ **3 Smartlinks**: Active smartlinks
- ✅ **4 Coupons**: Discount codes for offers
- ✅ **250 Clicks**: Distributed across this month, previous month, and older
- ✅ **78 Conversions**: With proper commission calculations
- ✅ **Offer-Publisher Relationships**: With commission percentages and cuts

## Test Data Details

### Publisher
- **Email**: `legendrycoypgamers@gmail.com`
- **Password**: `Test123!@#`
- **Status**: Approved

### Offers Created
1. Gaming Headset Pro - $25.50 (Active)
2. Mobile Game Subscription - $15.00 (Active)
3. Gaming Mouse Wireless - $18.75 (Active)
4. Streaming Service Premium - $12.00 (Active)
5. Gaming Keyboard RGB - $30.00 (Active)
6. Game Download Platform - $20.00 (Pending)

### Statistics Distribution
- **This Month**: ~120 clicks, ~35 conversions
- **Previous Month**: ~85 clicks, ~28 conversions
- **Older Data**: ~45 clicks, ~15 conversions

## After Seeding

Once the seed script completes successfully:

1. **Login to Dashboard**: Use `legendrycoypgamers@gmail.com` / `Test123!@#`
2. **View Statistics**: Check the dashboard for:
   - Total clicks and conversions
   - Monthly comparisons
   - Weekly click trends
   - Traffic sources
   - Conversion trends
   - Commissions over time
3. **Test Features**:
   - Offers page
   - Smartlinks
   - Postback URLs
   - Reports

## Troubleshooting

### Error: "Can't reach database server"
- Check your `DATABASE_URL` in `.env`
- Verify your database credentials
- Ensure the database server is accessible

### Error: "Publisher already exists"
- This is fine - the script will update the existing publisher to approved status
- Existing data will be preserved (except clicks/conversions which are replaced)

### Error: "Environment variable not found"
- Make sure you have a `.env` file (not just `env`)
- Check that `DATABASE_URL` is set correctly

## Notes

- The script will **delete and recreate** clicks and conversions for the test publisher to ensure clean test data
- Other data (offers, links, etc.) will be reused if they already exist
- Commission calculations are done automatically based on offer-publisher relationships

