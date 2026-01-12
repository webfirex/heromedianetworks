// /app/api/track/click/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pub_id = searchParams.get('pub_id');
  const offer_id = searchParams.get('offer_id');
  const link_id = searchParams.get('link_id');

  // Validate required query parameters
  if (!pub_id || !offer_id || !link_id) {
    return NextResponse.json({ error: 'Missing pub_id, offer_id or link_id' }, { status: 400 });
  }

  // If pub_id is an email, resolve to publisher ID
  let publisherId = pub_id;
  if (pub_id.includes('@')) {
    const publisher = await prisma.publisher.findUnique({
      where: { email: pub_id },
      select: { id: true },
    });
    if (publisher) {
      publisherId = publisher.id;
    } else {
      return NextResponse.json({ error: 'Publisher not found' }, { status: 404 });
    }
  }

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || '';
  const click_id = uuidv4();

  try {
    // Store the click
    await prisma.click.create({
      data: {
        click_id,
        pub_id: publisherId,
        offer_id: parseInt(offer_id, 10),
        link_id,
        ip_address: ip,
        user_agent: userAgent,
      },
    });

    // Get destination offer URL
    const offer = await prisma.offer.findUnique({
      where: { id: parseInt(offer_id, 10) },
      select: { offer_url: true },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Append link_id to redirect URL instead of click_id
    const redirectUrl = new URL(offer.offer_url);
    redirectUrl.searchParams.set('click_id', click_id);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (err) {
    console.error('Click tracking failed:', err);
    return NextResponse.json({ error: 'Click tracking failed' }, { status: 500 });
  }
}
