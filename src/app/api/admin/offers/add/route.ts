import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/db-prisma';

const secret = process.env.NEXTAUTH_SECRET;

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret });

  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      payout,
      currency,
      geo,
      description,
      offer_url,
      publisher_ids, // can be [] or undefined
      default_commission_percent, // optional
      default_commission_cut // optional
    } = body;

    // Basic validation
    if (!name || payout === undefined || !currency || !geo || !description || !offer_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Determine publishers to link
    let publishersToLink: string[] = [];

    if (Array.isArray(publisher_ids) && publisher_ids.length > 0) {
      // Validate UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const validUUIDs = publisher_ids.filter((id: string) => uuidRegex.test(id));

      if (validUUIDs.length === 0) {
        return NextResponse.json({ error: 'Invalid publisher IDs' }, { status: 400 });
      }

      // Confirm publisher IDs exist
      const validPublishers = await prisma.publisher.findMany({
        where: { id: { in: validUUIDs } },
        select: { id: true },
      });

      const existingIds = validPublishers.map((p) => p.id);
      const invalidIds = validUUIDs.filter((id) => !existingIds.includes(id));

      if (invalidIds.length > 0) {
        return NextResponse.json({ error: `Invalid publisher IDs: ${invalidIds.join(', ')}` }, { status: 400 });
      }

      publishersToLink = existingIds;
    } else {
      // Global offer: link all publishers
      const allPublishers = await prisma.publisher.findMany({
        select: { id: true },
      });
      publishersToLink = allPublishers.map((p) => p.id);
    }

    // Prepare commission data if provided
    const commissionData: { commission_percent?: number; commission_cut?: number } = {};
    if (default_commission_percent !== undefined && default_commission_percent !== null && default_commission_percent !== '') {
      commissionData.commission_percent = Number(default_commission_percent);
    }
    if (default_commission_cut !== undefined && default_commission_cut !== null && default_commission_cut !== '') {
      commissionData.commission_cut = Number(default_commission_cut);
    }

    // Create offer with publisher links in a transaction
    const offer = await prisma.offer.create({
      data: {
        name,
        payout,
        currency,
        geo,
        description,
        offer_url,
        status: 'active',
        offerPublishers: {
          create: publishersToLink.map((publisherId) => ({
            publisher_id: publisherId,
            ...commissionData,
          })),
        },
      },
    });

    return NextResponse.json(
      { message: 'Offer created successfully', offer },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating offer:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
