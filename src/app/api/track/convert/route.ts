// /app/api/track/convert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const click_id = searchParams.get('click_id');

  if (!click_id) {
    return NextResponse.json({ error: 'Missing click_id' }, { status: 400 });
  }

  try {
    /* ----------------------------------------
       Fetch click (authoritative source)
    ----------------------------------------- */
    const click = await prisma.click.findUnique({
      where: { click_id },
    });

    if (!click) {
      return NextResponse.json({ error: 'Click not found' }, { status: 404 });
    }

    /* ----------------------------------------
       FIXED CONVERSION RATE MODE
       → virtual conversion, no DB insert
    ----------------------------------------- */
    if (click.fixed_conversion_rate && Number(click.fixed_conversion_rate) > 0) {
      return NextResponse.json({
        success: true,
        type: 'fixed_conversion_rate',
        fixed_conversion_rate: Number(click.fixed_conversion_rate),
        message: 'Virtual conversion counted via fixed conversion rate',
      });
    }

    /* ----------------------------------------
       REAL CONVERSION MODE (existing logic)
    ----------------------------------------- */
    const offerIdNum = click.offer_id;

    const existing = await prisma.conversion.findFirst({
      where: {
        click_id,
        offer_id: offerIdNum,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Conversion already recorded for this click and offer' },
        { status: 409 }
      );
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerIdNum },
      select: { payout: true },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Invalid offer_id.' }, { status: 404 });
    }

    const payout = Number(offer.payout);

    const offerPublisher = await prisma.offerPublisher.findUnique({
      where: {
        offer_id_publisher_id: {
          offer_id: offerIdNum,
          publisher_id: click.pub_id,
        },
      },
      select: { commission_percent: true },
    });

    if (!offerPublisher || offerPublisher.commission_percent === null) {
      return NextResponse.json(
        { error: 'Commission percentage not found for this offer-publisher combination.' },
        { status: 404 }
      );
    }

    const commissionPercent = Number(offerPublisher.commission_percent);
    const commissionAmount = payout * (commissionPercent / 100);

    await prisma.conversion.create({
      data: {
        click_id,
        offer_id: offerIdNum,
        pub_id: click.pub_id,
        link_id: click.link_id,
        amount: payout,
        commission_amount: commissionAmount,
      },
    });

    return NextResponse.json({
      success: true,
      type: 'real_conversion',
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Conversion tracking failed' },
      { status: 500 }
    );
  }
}
