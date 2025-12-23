import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/db-prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let pub_id = searchParams.get('pub_id');

    if (!pub_id) {
      return NextResponse.json({ error: 'Missing pub_id' }, { status: 400 });
    }

    // If pub_id is an email, fetch the publisher's id from the database
    if (pub_id.includes('@')) {
      const publisher = await prisma.publisher.findUnique({
        where: { email: pub_id },
        select: { id: true },
      });
      if (publisher) {
        pub_id = publisher.id;
      } else {
        return NextResponse.json({ error: 'Publisher not found' }, { status: 404 });
      }
    }

    const offers = await prisma.offer.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        offer_url: true,
      },
    });

    const results = await Promise.all(
      offers.map(async (offer) => {
        const clicks = await prisma.click.findMany({
          where: {
            offer_id: offer.id,
            pub_id,
          },
          orderBy: { timestamp: 'desc' },
          select: { click_id: true },
        });

        const clickIds = clicks.map((c) => c.click_id);
        const total_clicks = clickIds.length;
        const last_click_id = clickIds.length > 0 ? clickIds[0] : null;

        const total_conversions = await prisma.conversion.count({
          where: {
            click_id: { in: clickIds },
          },
        });

        return {
          id: offer.id,
          name: offer.name,
          offer_url: offer.offer_url,
          total_clicks,
          total_conversions,
          last_click_id,
        };
      })
    );

    return NextResponse.json({ offers: results });
  } catch (err) {
    console.error('Dashboard Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
