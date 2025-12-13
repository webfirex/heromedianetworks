import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';

// GET /api/admin/offer_publishers/by-offer?offer_id=123
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const offerId = searchParams.get('offer_id');
  if (!offerId) {
    return NextResponse.json({ error: 'Missing offer_id' }, { status: 400 });
  }
  try {
    const offerPublishers = await prisma.offerPublisher.findMany({
      where: {
        offer_id: parseInt(offerId, 10),
      },
      include: {
        publisher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const publishers = offerPublishers.map((op) => ({
      id: op.publisher.id,
      name: op.publisher.name,
      email: op.publisher.email,
    }));

    return NextResponse.json({ publishers });
  } catch (err) {
    console.error('Error fetching publishers for offer:', err);
    return NextResponse.json({ error: 'Failed to fetch publishers for offer' }, { status: 500 });
  }
}
