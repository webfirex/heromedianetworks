import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';

export async function GET(req: NextRequest) {
  try {
    const publisher_id = req.nextUrl.searchParams.get('publisher_id');
    if (!publisher_id) {
      return NextResponse.json({ error: 'Missing publisher_id' }, { status: 400 });
    }

    // Fetch coupons for this publisher (global coupons or publisher-specific)
    const coupons = await prisma.coupon.findMany({
      where: {
        OR: [
          { couponPublishers: { some: { publisher_id } } },
          { couponPublishers: { none: {} } }, // Global coupons (no publisher association)
        ],
      },
      include: {
        offer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        valid_from: 'desc',
      },
      take: 50,
    });

    const results = coupons.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      offer_name: coupon.offer.name,
      valid_from: coupon.valid_from,
      valid_to: coupon.valid_to,
      offer_id: coupon.offer_id,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to fetch coupons:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons.' }, { status: 500 });
  }
}