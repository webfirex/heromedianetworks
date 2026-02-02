import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';
import { v4 as uuidv4 } from 'uuid';

const UNIQUE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pub_id = searchParams.get('pub_id');
  const offer_id = searchParams.get('offer_id');
  const link_id = searchParams.get('link_id');

  if (!pub_id || !offer_id || !link_id) {
    return NextResponse.json(
      { error: 'Missing pub_id, offer_id or link_id' },
      { status: 400 }
    );
  }

  /* ----------------------------------------
     Resolve publisher (email or ID)
  ----------------------------------------- */
  let publisherId = pub_id;

  if (pub_id.includes('@')) {
    const publisher = await prisma.publisher.findUnique({
      where: { email: pub_id },
      select: { id: true },
    });

    if (!publisher) {
      return NextResponse.json({ error: 'Publisher not found' }, { status: 404 });
    }

    publisherId = publisher.id;
  }

  /* ----------------------------------------
     Collect request metadata
  ----------------------------------------- */
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor
    ? forwardedFor.split(',')[0].trim()
    : 'unknown';

  const userAgent = req.headers.get('user-agent') || 'unknown';

  const click_id = uuidv4();
  const offerId = Number(offer_id);

  /* ----------------------------------------
     UNIQUE CLICK LOGIC
  ----------------------------------------- */
  const cookieName = `u_${publisherId}_${offerId}`;
  const hasCookie = req.cookies.get(cookieName);

  let isUnique = false;

  if (!hasCookie) {
    const existingUnique = await prisma.click.findFirst({
      where: {
        pub_id: publisherId,
        offer_id: offerId,
        ip_address: ip,
        user_agent: userAgent,
        is_unique: true,
        created_at: {
          gte: new Date(Date.now() - UNIQUE_WINDOW_MS),
        },
      },
      select: { id: true },
    });

    isUnique = !existingUnique;
  }

  /* ----------------------------------------
     Fetch link (ONLY source of fixed CR)
  ----------------------------------------- */
  const link = await prisma.link.findUnique({
    where: { id: link_id },
    select: {
      fixed_conversion_rate: true,
    },
  });

  if (!link) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 });
  }

  const fixedConversionRate =
    link.fixed_conversion_rate
      ? Number(link.fixed_conversion_rate)
      : 0;

  /* ----------------------------------------
     Store click
  ----------------------------------------- */
  await prisma.click.create({
    data: {
      click_id,
      pub_id: publisherId,
      offer_id: offerId,
      link_id,
      ip_address: ip,
      user_agent: userAgent,
      is_unique: isUnique,
      fixed_conversion_rate: fixedConversionRate,
    },
  });

  /* ----------------------------------------
     Fetch offer URL (NO rate logic here)
  ----------------------------------------- */
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: { offer_url: true },
  });

  if (!offer) {
    return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
  }

  /* ----------------------------------------
     Redirect
  ----------------------------------------- */
  const redirectUrl = new URL(offer.offer_url);

  redirectUrl.searchParams.set('click_id', click_id);
  redirectUrl.searchParams.set('link_id', link_id);

  const response = NextResponse.redirect(redirectUrl.toString(), 302);

  if (isUnique) {
    response.cookies.set(cookieName, '1', {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: 'lax',
    });
  }

  return response;
}
