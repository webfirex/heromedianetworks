import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const publisher_id = searchParams.get('publisher_id');
    const search = searchParams.get('search')?.toLowerCase() || '';
    const status = searchParams.get('status'); // 'active' | 'expired' | undefined
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 15;
    const skip = (page - 1) * limit;

    if (!publisher_id) {
      return NextResponse.json({ error: 'Missing publisher_id' }, { status: 400 });
    }

    const now = new Date();

    // Build where clause
    const where: any = {
      OR: [
        { couponPublishers: { some: { publisher_id } } },
        { couponPublishers: { none: {} } }, // Global coupons
      ],
    };

    if (search) {
      where.OR = [
        ...(where.OR || []),
        { code: { contains: search, mode: 'insensitive' } },
        { offer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status === 'active') {
      where.valid_to = { gte: now };
    } else if (status === 'expired') {
      where.valid_to = { lt: now };
    }

    const coupons = await prisma.coupon.findMany({
      where,
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
      skip,
      take: limit,
    });

    const results = coupons.map((coupon) => {
      const isActive = coupon.valid_to >= now;
      const discountValue = `${coupon.discount} ${coupon.discount_type}`;

      return {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        offer_name: coupon.offer.name,
        valid_from: coupon.valid_from,
        valid_to: coupon.valid_to,
        offer_id: coupon.offer_id,
        discount_value: discountValue,
        status: isActive ? 'active' : 'expired',
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to fetch coupons:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons.' }, { status: 500 });
  }
}
