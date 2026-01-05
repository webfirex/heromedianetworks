import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const link_id = searchParams.get('link_id');
  const pub_id = searchParams.get('pub_id'); // Fallback for smartlinks
  const offer_id = searchParams.get('offer_id'); // Fallback for smartlinks

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || '';
  const click_id = uuidv4();

  // TODO: Replace with actual device/browser detection
  const device = 'unknown';
  const browser = 'unknown';
  const geo = 'unknown'; // IP geolocation logic later

  try {
    let publisherId: string;
    let offerId: number;
    let linkId: string | null = null;
    let offerUrl: string;

    if (link_id) {
      // Primary method: Use link_id
      const link = await prisma.link.findUnique({
        where: { id: link_id },
        select: {
          offer_id: true,
          publisher_id: true,
          offer: {
            select: {
              offer_url: true,
            },
          },
        },
      });

      if (!link) {
        return NextResponse.json({ error: 'Link not found' }, { status: 404 });
      }

      publisherId = link.publisher_id;
      offerId = link.offer_id;
      linkId = link_id;
      offerUrl = link.offer.offer_url;
    } else if (pub_id && offer_id) {
      // Fallback method: Use pub_id and offer_id (for smartlinks backward compatibility)
      let resolvedPublisherId = pub_id;
      if (pub_id.includes('@')) {
        const publisher = await prisma.publisher.findUnique({
          where: { email: pub_id },
          select: { id: true },
        });
        if (publisher) {
          resolvedPublisherId = publisher.id;
        } else {
          return NextResponse.json({ error: 'Publisher not found' }, { status: 404 });
        }
      }

      const offer = await prisma.offer.findUnique({
        where: { id: parseInt(offer_id, 10) },
        select: { offer_url: true },
      });

      if (!offer) {
        return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
      }

      publisherId = resolvedPublisherId;
      offerId = parseInt(offer_id, 10);
      offerUrl = offer.offer_url;
    } else {
      return NextResponse.json({ error: 'Missing link_id or (pub_id and offer_id) parameters' }, { status: 400 });
    }

    // Check if this click comes from an active smartlink
    const smartlink = await prisma.smartlink.findFirst({
      where: {
        publisher_id: publisherId,
        offer_id: offerId,
        status: 'active',
      },
      select: { id: true },
    });

    await prisma.click.create({
      data: {
        click_id,
        pub_id: publisherId,
        offer_id: offerId,
        ...(linkId && { link_id: linkId }),
        smartlink_id: smartlink?.id,
        ip_address: ip,
        user_agent: userAgent,
        device,
        browser,
        geo,
      },
    });

    // Redirect with click_id as query param
    const redirectUrl = new URL(offerUrl);
    redirectUrl.searchParams.set('click_id', click_id);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Click tracking failed' }, { status: 500 });
  }
}
