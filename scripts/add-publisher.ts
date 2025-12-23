/**
 * Script to add and approve a publisher account
 * Usage: npx tsx scripts/add-publisher.ts
 */

import prisma from '../src/lib/db-prisma';
import bcrypt from 'bcryptjs';

const PUBLISHER_EMAIL = 'legendrycoypgamers@gmail.com';
const DEFAULT_PASSWORD = 'Test123!@#'; // Change this to your desired password

async function addPublisher() {
  try {
    console.log('🔍 Checking if publisher exists...');
    
    // Check if publisher already exists
    const existing = await prisma.publisher.findUnique({
      where: { email: PUBLISHER_EMAIL },
    });

    if (existing) {
      console.log('✅ Publisher already exists. Updating status to approved...');
      
      // Update status to approved
      const updated = await prisma.publisher.update({
        where: { email: PUBLISHER_EMAIL },
        data: { status: 'approved' },
      });
      
      console.log('✅ Publisher status updated to approved!');
      console.log('📧 Email:', updated.email);
      console.log('👤 Name:', updated.name);
      console.log('✅ Status:', updated.status);
      console.log('🔑 Password: (use existing password or reset it)');
    } else {
      console.log('➕ Creating new publisher account...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      
      // Create publisher with approved status
      const publisher = await prisma.publisher.create({
        data: {
          name: 'Legendry Coyp Gamers',
          email: PUBLISHER_EMAIL,
          password: hashedPassword,
          company: 'Legendry Coyp Gamers',
          phone: '+1234567890',
          status: 'approved',
        },
      });
      
      console.log('✅ Publisher created and approved successfully!');
      console.log('📧 Email:', publisher.email);
      console.log('👤 Name:', publisher.name);
      console.log('✅ Status:', publisher.status);
      console.log('🔑 Password:', DEFAULT_PASSWORD);
      console.log('\n🎉 You can now login with:');
      console.log(`   Email: ${PUBLISHER_EMAIL}`);
      console.log(`   Password: ${DEFAULT_PASSWORD}`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addPublisher();

