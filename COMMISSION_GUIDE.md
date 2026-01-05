# Commission System Guide

## Overview

The commission system in HeroMedia Networks allows you to set how publishers are compensated for conversions. There are two types of commission structures:

1. **Commission Percentage (`commission_percent`)**: A percentage-based commission
2. **Commission Cut (`commission_cut`)**: A fixed amount commission

## How Commissions Work

### Commission Percentage (`commission_percent`)

- **Type**: Decimal (5, 2) - Maximum 100.00%
- **Calculation**: `commission_amount = payout × (commission_percent / 100)`
- **Example**: 
  - Offer payout: $50.00
  - Commission %: 10.00
  - Publisher earns: $50.00 × (10 / 100) = $5.00 per conversion

### Commission Cut (`commission_cut`)

- **Type**: Decimal (10, 2) - Percentage deduction
- **Purpose**: Used to reduce the conversion count for reporting/analytics purposes
- **Calculation**: `reported_conversions = raw_conversions × (1 - commission_cut / 100)`
- **Example**:
  - Raw conversions: 100
  - Commission Cut: 5.00 (meaning 5%)
  - Reported conversions: 100 × (1 - 5/100) = 100 × 0.95 = 95 conversions
  - This means 5 conversions are "cut" or deducted from the reported total

**Important**: `commission_cut` is **NOT** used to calculate the actual commission amount paid to publishers. It's only used for reporting/analytics to show adjusted conversion counts.

### Current Implementation

**Commission Calculation for Payments:**
- The system uses `commission_percent` to calculate the actual commission amount paid to publishers
- Calculation: `commission_amount = payout × (commission_percent / 100)`

**Commission Cut for Reporting:**
- `commission_cut` is used in dashboard analytics to adjust conversion counts
- It represents a percentage deduction from the total conversion count
- Used in calculations like: `totalConversions = rawConversions × (1 - avgCommissionCut / 100)`

## Setting Commissions

### When Creating Offers

When creating a new offer through the admin dashboard:

1. Fill in the offer details (name, payout, currency, geo, etc.)
2. Select publishers for the offer
3. **Optional**: Set default commission values:
   - **Default Commission %**: Percentage of payout (e.g., 10.00 = 10%)
   - **Default Commission Cut**: Fixed amount per conversion (e.g., 5.00 = $5)

These default values will be applied to all selected publishers when the offer is created.

### Editing Commissions

After an offer is created, you can edit commissions for individual publishers:

1. Go to the "All Offers" section in the admin dashboard
2. Click on an advertiser/publisher name for a specific offer
3. Update the commission percentage or commission cut
4. Save the changes

The commission is stored in the `offer_publishers` junction table, which links offers to publishers with their specific commission rates.

## Database Schema

Commissions are stored in the `offer_publishers` table:

```prisma
model OfferPublisher {
  offer_id          Int
  publisher_id      String
  commission_percent Decimal? @db.Decimal(5, 2)  // Percentage (0-100)
  commission_cut    Decimal? @db.Decimal(10, 2)   // Fixed amount
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
}
```

## Commission Calculation Flow

When a conversion occurs:

1. The webhook receives `link_id` or `smartlink_id`
2. System looks up the offer's `payout` amount
3. System retrieves `commission_percent` from `offer_publishers` table
4. Calculates: `commission_amount = payout × (commission_percent / 100)`
5. Stores the conversion with both `amount` (payout) and `commission_amount`

## Best Practices

1. **Use Commission %** when you want publishers to earn a percentage of the offer payout
2. **Use Commission Cut** when you want to pay a fixed amount regardless of payout
3. **Set defaults** when creating offers to save time
4. **Review and adjust** commissions per publisher based on performance
5. **Document** your commission structure for transparency

## API Endpoints

- `POST /api/admin/offers/add` - Create offer with default commissions
- `PATCH /api/admin/offer_publishers/commission` - Update commission for specific offer-publisher pair
- `GET /api/admin/offers/[id]` - Get offer details including commissions
- `POST /api/webhook/conversion` - Record conversion and calculate commission

## Future Enhancements

Potential improvements to the commission system:

1. Support for both percentage and fixed amount simultaneously (choose higher/lower)
2. Tiered commission structures based on volume
3. Time-based commission changes
4. Commission cut integration in conversion calculations
5. Commission history and audit trail

