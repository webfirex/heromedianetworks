import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/db-prisma';

const secret = process.env.NEXTAUTH_SECRET;

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret });

    if (!token || token.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const body = await req.json();

    const {
      code,
      description,
      discount,
      discountType,
      offer_id,
      valid_from,
      valid_to,
      status = 'active',
      publisher_ids, // Optional
    } = body;

    if (!code || !description || discount == null || !discountType || !offer_id || !valid_to) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate publisher IDs if provided
    let publishersToLink: string[] = [];
    if (Array.isArray(publisher_ids) && publisher_ids.length > 0) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const validUUIDs = publisher_ids.filter((id: string) => uuidRegex.test(id));

      const validPublishers = await prisma.publisher.findMany({
        where: { id: { in: validUUIDs } },
        select: { id: true },
      });

      const existingIds = validPublishers.map((p) => p.id);
      const invalidIds = validUUIDs.filter((id) => !existingIds.includes(id));

      if (invalidIds.length > 0) {
        return NextResponse.json({ error: `Invalid publisher IDs: ${invalidIds.join(', ')}` }, { status: 400 });
      }

      publishersToLink = existingIds;
    } else {
      // Get all publishers if none specified
      const allPublishers = await prisma.publisher.findMany({
        select: { id: true },
      });
      publishersToLink = allPublishers.map((p) => p.id);
    }

    // Create coupon with publisher links in a transaction
    const coupon = await prisma.$transaction(async (tx) => {
      const newCoupon = await tx.coupon.create({
        data: {
          code,
          description,
          discount,
          discount_type: discountType,
          offer_id: parseInt(offer_id, 10),
          valid_from: valid_from ? new Date(valid_from) : null,
          valid_to: new Date(valid_to),
          status: status as 'active' | 'inactive' | 'expired',
        },
      });

      // Link publishers if any
      if (publishersToLink.length > 0) {
        await tx.couponPublisher.createMany({
          data: publishersToLink.map((pubId) => ({
            coupon_id: newCoupon.id,
            publisher_id: pubId,
          })),
        });
      }

      return newCoupon;
    });

    return NextResponse.json({ success: true, coupon }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding coupon:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
