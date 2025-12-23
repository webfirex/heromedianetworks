// /app/api/track/convert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const click_id = searchParams.get('click_id');
  const offer_id = searchParams.get('offer_id');
  const amount = parseFloat(searchParams.get('amount') || '0');

  if (!click_id) {
    return NextResponse.json({ error: 'Missing click_id' }, { status: 400 });
  }

  try {
    // Fetch the click and get pub_id and offer_id for validation
    const click = await prisma.click.findUnique({
      where: { click_id },
    });
    
    if (!click) {
      return NextResponse.json({ error: 'Click not found' }, { status: 404 });
    }
    
    // Optionally, validate offer_id matches
    if (offer_id && click.offer_id !== parseInt(offer_id, 10)) {
      return NextResponse.json({ error: 'Offer mismatch for click' }, { status: 400 });
    }

    const offerIdNum = offer_id ? parseInt(offer_id, 10) : click.offer_id;

    // Check if this click_id already has a conversion for this offer
    const existing = await prisma.conversion.findFirst({
      where: {
        click_id,
        offer_id: offerIdNum,
      },
    });
    
    if (existing) {
      return NextResponse.json({ error: 'Conversion already recorded for this click and offer' }, { status: 409 });
    }

    await prisma.conversion.create({
      data: {
        click_id,
        offer_id: offerIdNum,
        pub_id: click.pub_id,
        amount,
        commission_amount: amount, // You may want to calculate this based on commission rules
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Conversion tracking failed' }, { status: 500 });
  }
}
