import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';

export async function GET(req: NextRequest) {
  try {
    const publisher_id = req.nextUrl.searchParams.get('publisher_id');
    if (!publisher_id) {
      return NextResponse.json({ error: 'Missing publisher_id' }, { status: 400 });
    }

    // Fetch top offers for this publisher, ordered by conversions and revenue
    const offers = await prisma.offer.findMany({
      include: {
        clicks: {
          where: { pub_id: publisher_id },
          include: {
            conversions: true,
          },
        },
      },
      take: 20,
    });

    const results = offers.map((offer) => {
      const conversions = offer.clicks.flatMap((click) => click.conversions);
      const totalConversions = conversions.length;
      const totalRevenue = conversions.reduce((sum, conv) => sum + Number(conv.amount), 0);

      return {
        id: offer.id,
        name: offer.name,
        payout: offer.payout,
        geo: offer.geo,
        description: offer.description,
        offer_url: offer.offer_url,
        conversions: totalConversions,
        revenue: totalRevenue,
      };
    });

    // Sort by revenue DESC, then conversions DESC
    results.sort((a, b) => {
      if (b.revenue !== a.revenue) {
        return b.revenue - a.revenue;
      }
      return b.conversions - a.conversions;
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to fetch top offers:', error);
    return NextResponse.json({ error: 'Failed to fetch top offers.' }, { status: 500 });
  }
}
