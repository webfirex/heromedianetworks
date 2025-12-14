// app/api/admin/coupons/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const statusFilter = searchParams.get('status')?.toLowerCase();

  try {
    const where: any = {};

    // Search condition
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { offer: { name: { contains: search, mode: 'insensitive' } } },
        { couponPublishers: { some: { publisher: { name: { contains: search, mode: 'insensitive' } } } } },
        { id: { equals: isNaN(parseInt(search, 10)) ? undefined : parseInt(search, 10) } },
      ].filter((condition) => {
        // Remove invalid conditions
        if ('id' in condition && condition.id?.equals === undefined) return false;
        return true;
      });
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all' && ['active', 'inactive', 'expired'].includes(statusFilter)) {
      where.status = statusFilter;
    }

    const [coupons, totalCount] = await Promise.all([
      prisma.coupon.findMany({
        where,
        include: {
          offer: {
            select: {
              name: true,
            },
          },
          couponPublishers: {
            include: {
              publisher: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.coupon.count({ where }),
    ]);

    const formattedCoupons = coupons.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      description: coupon.description || '',
      discount: Number(coupon.discount),
      discountType: coupon.discount_type,
      offerId: coupon.offer_id,
      offerName: coupon.offer.name || 'N/A',
      publisherIds: coupon.couponPublishers.map((cp) => cp.publisher.id).filter(Boolean),
      publisherNames: coupon.couponPublishers.map((cp) => cp.publisher.name).filter(Boolean),
      validFrom: coupon.valid_from?.toISOString() || null,
      validTo: coupon.valid_to.toISOString(),
      status: coupon.status,
      creationDate: coupon.created_at.toISOString(),
    }));

    return NextResponse.json({ coupons: formattedCoupons, totalCount }, { status: 200 });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons.' }, { status: 500 });
  }
}
