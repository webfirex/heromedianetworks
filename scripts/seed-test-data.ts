/**
 * Comprehensive Test Data Seeding Script
 * Populates database with test data for legendrycoypgamers@gmail.com
 * 
 * Usage: npx tsx scripts/seed-test-data.ts
 * 
 * Note: Make sure your DATABASE_URL is set in your environment or .env file
 */

import prisma from '../src/lib/db-prisma';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Try to load environment variables from .env file if it exists
try {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line: string) => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {
  // Ignore if .env file doesn't exist or can't be read
}

const PUBLISHER_EMAIL = 'legendrycoypgamers@gmail.com';
const DEFAULT_PASSWORD = 'Test123!@#';

// Helper function to generate random dates within a range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to get dates for this month and previous month
function getDateRanges() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const firstDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  return {
    now,
    firstDayOfMonth,
    lastDayOfMonth,
    firstDayOfPreviousMonth,
    lastDayOfPreviousMonth,
    thirtyDaysAgo,
  };
}

async function seedTestData() {
  try {
    console.log('🌱 Starting test data seeding...\n');
    
    // Check database connection first
    console.log('🔌 Testing database connection...');
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful\n');
    } catch (connError: any) {
      console.error('❌ Database connection failed!');
      console.error('   Error:', connError.message);
      console.error('\n💡 Please ensure:');
      console.error('   1. Your DATABASE_URL is set in .env file');
      console.error('   2. The database server is accessible');
      console.error('   3. Your credentials are correct');
      console.error('\n   If you have an "env" file, copy it to ".env"');
      throw connError;
    }

    // Step 1: Ensure Publisher exists and is approved
    console.log('📝 Step 1: Setting up publisher...');
    let publisher = await prisma.publisher.findUnique({
      where: { email: PUBLISHER_EMAIL },
    });

    if (!publisher) {
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      publisher = await prisma.publisher.create({
        data: {
          name: 'Legendry Coyp Gamers',
          email: PUBLISHER_EMAIL,
          password: hashedPassword,
          company: 'Legendry Coyp Gamers',
          phone: '+1234567890',
          status: 'approved',
        },
      });
      console.log('✅ Publisher created');
    } else {
      // Update to approved status
      publisher = await prisma.publisher.update({
        where: { email: PUBLISHER_EMAIL },
        data: { status: 'approved' },
      });
      console.log('✅ Publisher exists and approved');
    }
    console.log(`   Publisher ID: ${publisher.id}\n`);

    // Step 2: Create Offers
    console.log('📝 Step 2: Creating offers...');
    const offersData = [
      {
        name: 'Gaming Headset Pro',
        offer_url: 'https://example.com/offer/gaming-headset',
        description: 'Premium gaming headset with 7.1 surround sound',
        geo: 'US,CA,UK',
        payout: 25.50,
        currency: 'USD',
        status: 'active' as const,
      },
      {
        name: 'Mobile Game Subscription',
        offer_url: 'https://example.com/offer/mobile-game',
        description: 'Monthly subscription for premium mobile games',
        geo: 'US,UK,AU',
        payout: 15.00,
        currency: 'USD',
        status: 'active' as const,
      },
      {
        name: 'Gaming Mouse Wireless',
        offer_url: 'https://example.com/offer/gaming-mouse',
        description: 'High precision wireless gaming mouse',
        geo: 'US,CA,EU',
        payout: 18.75,
        currency: 'USD',
        status: 'active' as const,
      },
      {
        name: 'Streaming Service Premium',
        offer_url: 'https://example.com/offer/streaming',
        description: 'Premium streaming service for gamers',
        geo: 'US,UK',
        payout: 12.00,
        currency: 'USD',
        status: 'active' as const,
      },
      {
        name: 'Gaming Keyboard RGB',
        offer_url: 'https://example.com/offer/gaming-keyboard',
        description: 'Mechanical RGB gaming keyboard',
        geo: 'US,CA,UK,AU',
        payout: 30.00,
        currency: 'USD',
        status: 'active' as const,
      },
      {
        name: 'Game Download Platform',
        offer_url: 'https://example.com/offer/game-platform',
        description: 'Digital game distribution platform',
        geo: 'US,UK,CA',
        payout: 20.00,
        currency: 'USD',
        status: 'pending' as const,
      },
    ];

    const offers = [];
    for (const offerData of offersData) {
      const existing = await prisma.offer.findFirst({
        where: { name: offerData.name },
      });
      
      if (existing) {
        offers.push(existing);
        console.log(`   ✓ Offer exists: ${offerData.name}`);
      } else {
        const offer = await prisma.offer.create({ data: offerData });
        offers.push(offer);
        console.log(`   ✓ Created offer: ${offerData.name}`);
      }
    }
    console.log(`✅ Created/Found ${offers.length} offers\n`);

    // Step 3: Create OfferPublisher relationships
    console.log('📝 Step 3: Creating offer-publisher relationships...');
    for (const offer of offers) {
      const existing = await prisma.offerPublisher.findUnique({
        where: {
          offer_id_publisher_id: {
            offer_id: offer.id,
            publisher_id: publisher.id,
          },
        },
      });

      if (!existing) {
        // Random commission between 5% and 15%
        const commissionPercent = Math.random() * 10 + 5;
        const commissionCut = Math.random() * 5 + 2; // 2-7% cut
        
        await prisma.offerPublisher.create({
          data: {
            offer_id: offer.id,
            publisher_id: publisher.id,
            commission_percent: parseFloat(commissionPercent.toFixed(2)),
            commission_cut: parseFloat(commissionCut.toFixed(2)),
          },
        });
        console.log(`   ✓ Linked offer: ${offer.name} (${commissionPercent.toFixed(2)}% commission, ${commissionCut.toFixed(2)}% cut)`);
      }
    }
    console.log('✅ Offer-publisher relationships created\n');

    // Step 4: Create Links
    console.log('📝 Step 4: Creating tracking links...');
    const links = [];
    for (const offer of offers.slice(0, 4)) { // Create links for first 4 offers
      const linkName = `Link-${offer.name.replace(/\s+/g, '-')}`;
      const existing = await prisma.link.findFirst({
        where: {
          offer_id: offer.id,
          publisher_id: publisher.id,
          name: linkName,
        },
      });

      if (!existing) {
        const link = await prisma.link.create({
          data: {
            offer_id: offer.id,
            publisher_id: publisher.id,
            name: linkName,
          },
        });
        links.push(link);
        console.log(`   ✓ Created link: ${linkName}`);
      } else {
        links.push(existing);
        console.log(`   ✓ Link exists: ${linkName}`);
      }
    }
    console.log(`✅ Created/Found ${links.length} links\n`);

    // Step 5: Create Smartlinks
    console.log('📝 Step 5: Creating smartlinks...');
    for (const offer of offers.slice(0, 3)) { // Create smartlinks for first 3 offers
      const existing = await prisma.smartlink.findUnique({
        where: {
          offer_id_publisher_id: {
            offer_id: offer.id,
            publisher_id: publisher.id,
          },
        },
      });

      if (!existing) {
        await prisma.smartlink.create({
          data: {
            offer_id: offer.id,
            publisher_id: publisher.id,
            status: 'active',
          },
        });
        console.log(`   ✓ Created smartlink for: ${offer.name}`);
      }
    }
    console.log('✅ Smartlinks created\n');

    // Step 6: Create Coupons
    console.log('📝 Step 6: Creating coupons...');
    const coupons = [];
    const couponData = [
      { code: 'GAMING20', discount: 20, discount_type: 'percentage' as const, offer: offers[0] },
      { code: 'MOBILE15', discount: 15, discount_type: 'percentage' as const, offer: offers[1] },
      { code: 'MOUSE10', discount: 10, discount_type: 'fixed' as const, offer: offers[2] },
      { code: 'STREAM5', discount: 5, discount_type: 'fixed' as const, offer: offers[3] },
    ];

    for (const couponInfo of couponData) {
      const validTo = new Date();
      validTo.setMonth(validTo.getMonth() + 3); // Valid for 3 months

      const existing = await prisma.coupon.findUnique({
        where: { code: couponInfo.code },
      });

      if (!existing) {
        const coupon = await prisma.coupon.create({
          data: {
            code: couponInfo.code,
            description: `Discount code for ${couponInfo.offer.name}`,
            discount: couponInfo.discount,
            discount_type: couponInfo.discount_type,
            offer_id: couponInfo.offer.id,
            valid_from: new Date(),
            valid_to: validTo,
            status: 'active',
          },
        });
        coupons.push(coupon);
        console.log(`   ✓ Created coupon: ${couponInfo.code}`);

        // Link coupon to publisher
        await prisma.couponPublisher.create({
          data: {
            coupon_id: coupon.id,
            publisher_id: publisher.id,
          },
        });
      } else {
        coupons.push(existing);
        console.log(`   ✓ Coupon exists: ${couponInfo.code}`);
      }
    }
    console.log(`✅ Created/Found ${coupons.length} coupons\n`);

    // Step 7: Create Clicks (distributed over time)
    console.log('📝 Step 7: Creating click tracking data...');
    const dateRanges = getDateRanges();
    
    // Delete existing clicks for this publisher to avoid duplicates
    await prisma.click.deleteMany({
      where: { pub_id: publisher.id },
    });

    const clickDevices = ['Desktop', 'Mobile', 'Tablet'];
    const clickBrowsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    const clickGeos = ['US', 'CA', 'UK', 'AU', 'DE'];

    let totalClicks = 0;
    
    // This month clicks (more recent, more clicks)
    const thisMonthClicks = 120;
    for (let i = 0; i < thisMonthClicks; i++) {
      const timestamp = randomDate(dateRanges.firstDayOfMonth, dateRanges.now);
      const offer = offers[Math.floor(Math.random() * offers.length)];
      const link = links.length > 0 ? links[Math.floor(Math.random() * links.length)] : null;
      
      await prisma.click.create({
        data: {
          click_id: uuidv4(),
          pub_id: publisher.id,
          offer_id: offer.id,
          link_id: link?.id || null,
          ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          user_agent: `Mozilla/5.0 (${clickBrowsers[Math.floor(Math.random() * clickBrowsers.length)]})`,
          device: clickDevices[Math.floor(Math.random() * clickDevices.length)],
          browser: clickBrowsers[Math.floor(Math.random() * clickBrowsers.length)],
          geo: clickGeos[Math.floor(Math.random() * clickGeos.length)],
          timestamp,
        },
      });
      totalClicks++;
    }

    // Previous month clicks
    const previousMonthClicks = 85;
    for (let i = 0; i < previousMonthClicks; i++) {
      const timestamp = randomDate(dateRanges.firstDayOfPreviousMonth, dateRanges.lastDayOfPreviousMonth);
      const offer = offers[Math.floor(Math.random() * offers.length)];
      const link = links.length > 0 ? links[Math.floor(Math.random() * links.length)] : null;
      
      await prisma.click.create({
        data: {
          click_id: uuidv4(),
          pub_id: publisher.id,
          offer_id: offer.id,
          link_id: link?.id || null,
          ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          user_agent: `Mozilla/5.0 (${clickBrowsers[Math.floor(Math.random() * clickBrowsers.length)]})`,
          device: clickDevices[Math.floor(Math.random() * clickDevices.length)],
          browser: clickBrowsers[Math.floor(Math.random() * clickBrowsers.length)],
          geo: clickGeos[Math.floor(Math.random() * clickGeos.length)],
          timestamp,
        },
      });
      totalClicks++;
    }

    // Older clicks (30+ days ago)
    const olderClicks = 45;
    const oldDate = new Date(dateRanges.now.getTime() - 60 * 24 * 60 * 60 * 1000); // 60 days ago
    for (let i = 0; i < olderClicks; i++) {
      const timestamp = randomDate(oldDate, dateRanges.firstDayOfPreviousMonth);
      const offer = offers[Math.floor(Math.random() * offers.length)];
      const link = links.length > 0 ? links[Math.floor(Math.random() * links.length)] : null;
      
      await prisma.click.create({
        data: {
          click_id: uuidv4(),
          pub_id: publisher.id,
          offer_id: offer.id,
          link_id: link?.id || null,
          ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          user_agent: `Mozilla/5.0 (${clickBrowsers[Math.floor(Math.random() * clickBrowsers.length)]})`,
          device: clickDevices[Math.floor(Math.random() * clickDevices.length)],
          browser: clickBrowsers[Math.floor(Math.random() * clickBrowsers.length)],
          geo: clickGeos[Math.floor(Math.random() * clickGeos.length)],
          timestamp,
        },
      });
      totalClicks++;
    }

    console.log(`✅ Created ${totalClicks} clicks (${thisMonthClicks} this month, ${previousMonthClicks} previous month, ${olderClicks} older)\n`);

    // Step 8: Create Conversions (with proper commission calculations)
    console.log('📝 Step 8: Creating conversion tracking data...');
    
    // Delete existing conversions for this publisher
    await prisma.conversion.deleteMany({
      where: { pub_id: publisher.id },
    });

    // Get some clicks to associate with conversions
    const publisherClicks = await prisma.click.findMany({
      where: { pub_id: publisher.id },
      take: 150, // Use some clicks for conversions
    });

    const conversionStatuses: Array<'pending' | 'approved' | 'rejected'> = ['approved', 'approved', 'approved', 'pending', 'rejected'];
    let totalConversions = 0;
    let totalEarnings = 0;

    // This month conversions
    const thisMonthConversions = 35;
    for (let i = 0; i < thisMonthConversions; i++) {
      const click = publisherClicks[Math.floor(Math.random() * publisherClicks.length)];
      const offer = offers.find(o => o.id === click.offer_id)!;
      const offerPublisher = await prisma.offerPublisher.findUnique({
        where: {
          offer_id_publisher_id: {
            offer_id: offer.id,
            publisher_id: publisher.id,
          },
        },
      });

      const commissionCut = offerPublisher?.commission_cut ? Number(offerPublisher.commission_cut) : 5;
      const amount = Number(offer.payout) + (Math.random() * 20 - 10); // Vary amount slightly
      const commissionAmount = amount * (1 - commissionCut / 100);
      const status = conversionStatuses[Math.floor(Math.random() * conversionStatuses.length)];
      const createdAt = randomDate(dateRanges.firstDayOfMonth, dateRanges.now);

      await prisma.conversion.create({
        data: {
          click_id: click.click_id,
          offer_id: offer.id,
          link_id: click.link_id,
          pub_id: publisher.id,
          amount: parseFloat(amount.toFixed(2)),
          commission_amount: parseFloat(commissionAmount.toFixed(2)),
          status,
          created_at: createdAt,
        },
      });
      totalConversions++;
      if (status === 'approved') {
        totalEarnings += commissionAmount;
      }
    }

    // Previous month conversions
    const previousMonthConversions = 28;
    for (let i = 0; i < previousMonthConversions; i++) {
      const click = publisherClicks[Math.floor(Math.random() * publisherClicks.length)];
      const offer = offers.find(o => o.id === click.offer_id)!;
      const offerPublisher = await prisma.offerPublisher.findUnique({
        where: {
          offer_id_publisher_id: {
            offer_id: offer.id,
            publisher_id: publisher.id,
          },
        },
      });

      const commissionCut = offerPublisher?.commission_cut ? Number(offerPublisher.commission_cut) : 5;
      const amount = Number(offer.payout) + (Math.random() * 20 - 10);
      const commissionAmount = amount * (1 - commissionCut / 100);
      const status = conversionStatuses[Math.floor(Math.random() * conversionStatuses.length)];
      const createdAt = randomDate(dateRanges.firstDayOfPreviousMonth, dateRanges.lastDayOfPreviousMonth);

      await prisma.conversion.create({
        data: {
          click_id: click.click_id,
          offer_id: offer.id,
          link_id: click.link_id,
          pub_id: publisher.id,
          amount: parseFloat(amount.toFixed(2)),
          commission_amount: parseFloat(commissionAmount.toFixed(2)),
          status,
          created_at: createdAt,
        },
      });
      totalConversions++;
      if (status === 'approved') {
        totalEarnings += commissionAmount;
      }
    }

    // Older conversions
    const olderConversions = 15;
    const oldDateConv = new Date(dateRanges.now.getTime() - 60 * 24 * 60 * 60 * 1000);
    for (let i = 0; i < olderConversions; i++) {
      const click = publisherClicks[Math.floor(Math.random() * publisherClicks.length)];
      const offer = offers.find(o => o.id === click.offer_id)!;
      const offerPublisher = await prisma.offerPublisher.findUnique({
        where: {
          offer_id_publisher_id: {
            offer_id: offer.id,
            publisher_id: publisher.id,
          },
        },
      });

      const commissionCut = offerPublisher?.commission_cut ? Number(offerPublisher.commission_cut) : 5;
      const amount = Number(offer.payout) + (Math.random() * 20 - 10);
      const commissionAmount = amount * (1 - commissionCut / 100);
      const status = conversionStatuses[Math.floor(Math.random() * conversionStatuses.length)];
      const createdAt = randomDate(oldDateConv, dateRanges.firstDayOfPreviousMonth);

      await prisma.conversion.create({
        data: {
          click_id: click.click_id,
          offer_id: offer.id,
          link_id: click.link_id,
          pub_id: publisher.id,
          amount: parseFloat(amount.toFixed(2)),
          commission_amount: parseFloat(commissionAmount.toFixed(2)),
          status,
          created_at: createdAt,
        },
      });
      totalConversions++;
      if (status === 'approved') {
        totalEarnings += commissionAmount;
      }
    }

    console.log(`✅ Created ${totalConversions} conversions`);
    console.log(`   - This month: ${thisMonthConversions}`);
    console.log(`   - Previous month: ${previousMonthConversions}`);
    console.log(`   - Older: ${olderConversions}`);
    console.log(`   - Total earnings (approved): $${totalEarnings.toFixed(2)}\n`);

    // Summary
    console.log('🎉 Test data seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Publisher: ${publisher.email} (${publisher.status})`);
    console.log(`   Offers: ${offers.length}`);
    console.log(`   Links: ${links.length}`);
    console.log(`   Smartlinks: 3`);
    console.log(`   Coupons: ${coupons.length}`);
    console.log(`   Clicks: ${totalClicks}`);
    console.log(`   Conversions: ${totalConversions}`);
    console.log(`   Total Earnings: $${totalEarnings.toFixed(2)}\n`);
    console.log('✅ You can now test the dashboard with this data!');
    console.log(`   Login with: ${PUBLISHER_EMAIL} / ${DEFAULT_PASSWORD}`);

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedTestData()
  .then(() => {
    console.log('\n✅ Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  });

