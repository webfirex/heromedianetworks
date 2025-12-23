// app/api/smartlink/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';

export async function POST(req: NextRequest) {
  // Accept both camelCase and snake_case keys
  const body = await req.json();
  const offerId = body.offerId || body.offer_id;
  const publisherId = body.publisherId || body.publisher_id;
  console.log('Creating smartlink for offerId:', offerId, 'and publisherId:', publisherId);

  if (!offerId || !publisherId) {
    return NextResponse.json({ error: 'Missing offerId or publisherId' }, { status: 400 });
  }

  try {
    // Check if a smartlink already exists for this publisher-offer pair
    const existing = await prisma.smartlink.findUnique({
      where: {
        offer_id_publisher_id: {
          offer_id: parseInt(offerId, 10),
          publisher_id: publisherId,
        },
      },
      select: {
        id: true,
        created_at: true,
      },
    });

    let smartlink;
    if (existing) {
      smartlink = existing;
    } else {
      // Create a new smartlink
      smartlink = await prisma.smartlink.create({
        data: {
          offer_id: parseInt(offerId, 10),
          publisher_id: publisherId,
        },
        select: {
          id: true,
          created_at: true,
        },
      });
    }

    // Get offer name for frontend display
    const offer = await prisma.offer.findUnique({
      where: { id: parseInt(offerId, 10) },
      select: { name: true },
    });
    const offerName = offer?.name || '';

    // Build the smartlink URL using pub_id and offer_id for compatibility
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('host') || 'localhost';
    const smartlinkUrl = `${protocol}://${host}/api/postback?pub_id=${publisherId}&offer_id=${offerId}`;

    return NextResponse.json({
      id: smartlink.id,
      offer_id: parseInt(offerId, 10),
      offer_name: offerName,
      created_at: smartlink.created_at.toISOString(),
      smartlink_url: smartlinkUrl,
    });
  } catch (error) {
    console.error('Smartlink creation failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
