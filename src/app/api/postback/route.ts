import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pub_id = searchParams.get('pub_id');
  const offer_id = searchParams.get('offer_id');

  // If pub_id is an email, fetch the publisher's id from the database
  let publisherId = pub_id;
  if (pub_id && pub_id.includes('@')) {
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

  if (!pub_id || !offer_id) {
    return NextResponse.json({ error: 'Missing pub_id or offer_id' }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || '';
  const click_id = uuidv4();

  // TODO: Replace with actual device/browser detection
  const device = 'unknown';
  const browser = 'unknown';
  const geo = 'unknown'; // IP geolocation logic later

  try {
    await prisma.click.create({
      data: {
        click_id,
        pub_id: publisherId!,
        offer_id: parseInt(offer_id, 10),
        ip_address: ip,
        user_agent: userAgent,
        device,
        browser,
        geo,
      },
    });

    // Fetch offer URL
    const offer = await prisma.offer.findUnique({
      where: { id: parseInt(offer_id, 10) },
      select: { offer_url: true },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Redirect with click_id as query param
    const redirectUrl = new URL(offer.offer_url);
    redirectUrl.searchParams.set('click_id', click_id);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Click tracking failed' }, { status: 500 });
  }
}
