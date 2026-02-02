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
      publisher_ids,
      default_commission_percent,
      default_commission_cut,
      fixed_conversion_rate,
    } = body;

    if (!name || payout === undefined || !currency || !geo || !description || !offer_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ✅ Fixed conversion rate validation
    let fixedRate = 0;
    if (fixed_conversion_rate !== undefined && fixed_conversion_rate !== null && fixed_conversion_rate !== '') {
      const rate = Number(fixed_conversion_rate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        return NextResponse.json(
          { error: 'Fixed conversion rate must be between 0 and 100' },
          { status: 400 }
        );
      }
      fixedRate = rate;
    }

    // Determine publishers
    let publishersToLink: string[] = [];

    if (Array.isArray(publisher_ids) && publisher_ids.length > 0) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const validUUIDs = publisher_ids.filter((id: string) => uuidRegex.test(id));

      if (validUUIDs.length === 0) {
        return NextResponse.json({ error: 'Invalid publisher IDs' }, { status: 400 });
      }

      const validPublishers = await prisma.publisher.findMany({
        where: { id: { in: validUUIDs } },
        select: { id: true },
      });

      publishersToLink = validPublishers.map((p) => p.id);
    } else {
      const allPublishers = await prisma.publisher.findMany({
        select: { id: true },
      });
      publishersToLink = allPublishers.map((p) => p.id);
    }

    // Commission data
    const commissionData: { commission_percent?: number; commission_cut?: number } = {};
    if (default_commission_percent !== undefined && default_commission_percent !== '') {
      commissionData.commission_percent = Number(default_commission_percent);
    }
    if (default_commission_cut !== undefined && default_commission_cut !== '') {
      commissionData.commission_cut = Number(default_commission_cut);
    }

    const offer = await prisma.offer.create({
      data: {
        name,
        payout,
        currency,
        geo,
        description,
        offer_url,
        status: 'active',
        fixed_conversion_rate: fixedRate,
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
