// app/api/smartlinks/route.ts - Publisher Smartlinks API
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const publisher_id = searchParams.get('publisher_id');

  if (!publisher_id) {
    return NextResponse.json({ error: 'Missing publisher_id' }, { status: 400 });
  }

  try {
    const smartlinks = await prisma.smartlink.findMany({
      where: {
        publisher_id: publisher_id,
        status: 'active', // Only show active smartlinks to publishers
      },
      include: {
        offer: {
          select: {
            id: true,
            name: true,
            offer_url: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Transform the data to match the expected format
    const transformedSmartlinks = smartlinks.map((smartlink) => {
      // Build the smartlink URL using pub_id and offer_id for compatibility
      const protocol = req.headers.get('x-forwarded-proto') || 'http';
      const host = req.headers.get('host') || 'localhost:3000';

      const smartlinkUrl = `${protocol}://${host}/api/postback?pub_id=${publisher_id}&offer_id=${smartlink.offer_id}`;

      return {
        id: smartlink.id,
        offer_name: smartlink.offer.name,
        offer_id: smartlink.offer.id,
        smartlink_url: smartlinkUrl,
        status: smartlink.status,
        created_at: smartlink.created_at.toISOString(),
      };
    });

    return NextResponse.json(transformedSmartlinks);
  } catch (error) {
    console.error('Error fetching smartlinks:', error);
    return NextResponse.json({ error: 'Failed to fetch smartlinks' }, { status: 500 });
  }
}