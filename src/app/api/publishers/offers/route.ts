import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const publisher_id = searchParams.get('publisher_id');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') as 'active' | 'inactive' | 'pending' | 'terminated' | null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 15;
    const skip = (page - 1) * limit;

    if (!publisher_id) {
      return NextResponse.json({ error: 'Missing publisher_id' }, { status: 400 });
    }

    // Build where clause
    const where: any = {
      offerPublishers: {
        some: {
          publisher_id,
        },
      },
      links: {
        some: {
          publisher_id,
        },
      },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'active') {
      where.status = 'active';
    } else if (status === 'expired') {
      where.status = 'terminated'; // Assuming 'expired' maps to 'terminated'
    }

    // Get offers with links and clicks count
    const [offers, totalCount] = await Promise.all([
      prisma.offer.findMany({
        where,
        include: {
          links: {
            where: { publisher_id },
            select: { id: true },
            take: 1, // Get first link
          },
          clicks: {
            where: { pub_id: publisher_id },
            select: { id: true },
          },
        },
        orderBy: { updated_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.offer.count({ where }),
    ]);

    // Format the response
    const formattedOffers = offers.map((offer) => {
      const link = offer.links[0];
      const clicksCount = offer.clicks.length;
      const payoutInfo = `${offer.currency || 'USD'} ${offer.payout}`;

      return {
        id: offer.id,
        name: offer.name,
        offer_url: offer.offer_url,
        description: offer.description,
        geo: offer.geo,
        status: offer.status,
        payout_info: payoutInfo,
        clicks: clicksCount,
        updated_at: offer.updated_at,
        link_id: link?.id || null,
      };
    });

    return NextResponse.json({ offers: formattedOffers, totalCount });
  } catch (error) {
    console.error('Failed to fetch offers:', error);
    return NextResponse.json({ error: 'Failed to fetch offers.' }, { status: 500 });
  }
}
