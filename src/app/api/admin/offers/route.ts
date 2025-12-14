import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    const offers = await prisma.offer.findMany({
      include: {
        offerPublishers: {
          include: {
            publisher: {
              select: { name: true },
            },
          },
        },
        clicks: true,
        conversions: true,
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });

    const formattedOffers = offers.map((offer) => {
      const clicks = offer.clicks.length;
      const conversions = offer.conversions.length;
      const cr = clicks === 0 ? 0 : Number(((conversions / clicks) * 100).toFixed(2));
      const epc = clicks === 0 ? 0 : Number(((Number(offer.payout) * conversions) / clicks).toFixed(2));

      const advertisers = Array.from(
        new Set(offer.offerPublishers.map((op) => op.publisher.name))
      ).join(', ');

      const commission_percent = offer.offerPublishers
        .map((op) => op.commission_percent)
        .filter((cp) => cp !== null);

      const commission_cut = offer.offerPublishers
        .map((op) => op.commission_cut)
        .filter((cc) => cc !== null);

      return {
        id: offer.id,
        name: offer.name,
        advertisers,
        offer_url: offer.offer_url,
        description: offer.description,
        geo: offer.geo,
        payout: Number(offer.payout),
        currency: offer.currency,
        commission_percent: commission_percent.length > 0 ? commission_percent : null,
        commission_cut: commission_cut.length > 0 ? commission_cut : null,
        status: offer.status,
        creationDate: offer.created_at,
        clicks,
        conversions,
        cr,
        epc,
      };
    });

    return NextResponse.json({ offers: formattedOffers });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
  }
}
