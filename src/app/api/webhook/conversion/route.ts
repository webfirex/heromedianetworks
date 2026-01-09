import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';

// POST /api/webhook/conversion
export async function GET(req: NextRequest) {
  try {
    // const { link_id, smartlink_id } = await req.json();

    const { searchParams } = new URL(req.url)
    const link_id = searchParams.get('linkid');

    if (!link_id) {
      return NextResponse.json({ error: 'link_id or smartlink_id is required.' }, { status: 400 });
    }

    let offer_id: number;
    let publisher_id: string;

    const link = await prisma.link.findUnique({
      where: { id: link_id },
      select: {
        offer_id: true,
        publisher_id: true,
      },
    });

    if (!link) {
      return NextResponse.json({ error: 'Invalid link_id.' }, { status: 404 });
    }

    offer_id = link.offer_id;
    publisher_id = link.publisher_id;

    // if (link_id) {
    //   // 1a. Get offer_id and publisher_id from links table
    //   const link = await prisma.link.findUnique({
    //     where: { id: link_id },
    //     select: {
    //       offer_id: true,
    //       publisher_id: true,
    //     },
    //   });

    //   if (!link) {
    //     return NextResponse.json({ error: 'Invalid link_id.' }, { status: 404 });
    //   }

    //   offer_id = link.offer_id;
    //   publisher_id = link.publisher_id;
    // } else {
    //   // 1b. Get offer_id and publisher_id from smartlinks table
    //   const smartlink = await prisma.smartlink.findUnique({
    //     where: { id: smartlink_id },
    //     select: {
    //       offer_id: true,
    //       publisher_id: true,
    //     },
    //   });

    //   if (!smartlink) {
    //     return NextResponse.json({ error: 'Invalid smartlink_id.' }, { status: 404 });
    //   }

    //   offer_id = smartlink.offer_id;
    //   publisher_id = smartlink.publisher_id;
    // }

    // 2. Get payout from offers table
    const offer = await prisma.offer.findUnique({
      where: { id: offer_id },
      select: { payout: true },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Invalid offer_id.' }, { status: 404 });
    }

    const payout = Number(offer.payout);

    // 3. Get commission_percent from offer_publishers table
    const offerPublisher = await prisma.offerPublisher.findUnique({
      where: {
        offer_id_publisher_id: {
          offer_id: offer_id,
          publisher_id: publisher_id,
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

    // 4. Calculate commission_amount
    const commissionAmount = payout * (commissionPercent / 100);

    // 5. Insert into conversions table
    await prisma.conversion.create({
      data: {
        offer_id: offer_id,
        ...(link_id && { link_id }),
        // ...(smartlink_id && { smartlink_id }),
        pub_id: publisher_id,
        amount: payout,
        commission_amount: commissionAmount,
      },
    });

    return NextResponse.json({ message: 'Conversion recorded successfully.' });
  } catch (err) {
    console.error('Webhook conversion error:', err);
    return NextResponse.json({ error: 'Failed to record conversion.' }, { status: 500 });
  }
}
