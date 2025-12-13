// app/api/admin/coupons/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const {
      code,
      description,
      discount,
      discountType,
      offerId,
      publisherIds, // array of publisher IDs
      validFrom,
      validTo,
      status
    } = await request.json();

    if (
      !code || discount == null || !discountType || !offerId ||
      !Array.isArray(publisherIds) || publisherIds.length === 0 ||
      !validFrom || !validTo || !status
    ) {
      return NextResponse.json({ error: 'Missing required fields for update.' }, { status: 400 });
    }

    const fromDate = new Date(validFrom);
    const toDate = new Date(validTo);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()) || fromDate >= toDate) {
      return NextResponse.json({ error: 'Invalid dates provided or Valid From is not before Valid To.' }, { status: 400 });
    }

    // Validate coupon exists
    const couponExists = await prisma.coupon.findUnique({
      where: { id: parseInt(id, 10) },
    });
    if (!couponExists) {
      return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
    }

    // Validate offer ID
    const offerExists = await prisma.offer.findUnique({
      where: { id: parseInt(offerId, 10) },
    });
    if (!offerExists) {
      return NextResponse.json({ error: 'Associated Offer ID does not exist.' }, { status: 400 });
    }

    // Validate all publisher IDs
    const publisherCheck = await prisma.publisher.findMany({
      where: { id: { in: publisherIds } },
      select: { id: true },
    });
    if (publisherCheck.length !== publisherIds.length) {
      return NextResponse.json({ error: 'One or more publisher IDs are invalid.' }, { status: 400 });
    }

    // Update coupon and publisher mappings in a transaction
    const updatedCoupon = await prisma.$transaction(async (tx) => {
      // Update coupon
      const coupon = await tx.coupon.update({
        where: { id: parseInt(id, 10) },
        data: {
          code,
          description,
          discount,
          discount_type: discountType,
          offer_id: parseInt(offerId, 10),
          valid_from: new Date(validFrom),
          valid_to: new Date(validTo),
          status: status as 'active' | 'inactive' | 'expired',
        },
        select: {
          id: true,
          code: true,
          description: true,
          discount: true,
          discount_type: true,
          offer_id: true,
          valid_from: true,
          valid_to: true,
          status: true,
          created_at: true,
        },
      });

      // Remove existing mappings
      await tx.couponPublisher.deleteMany({
        where: { coupon_id: parseInt(id, 10) },
      });

      // Insert new mappings
      if (publisherIds.length > 0) {
        await tx.couponPublisher.createMany({
          data: publisherIds.map((pubId: string) => ({
            coupon_id: parseInt(id, 10),
            publisher_id: pubId,
          })),
        });
      }

      return coupon;
    });

    // Fetch offer name and publisher names
    const [offer, publishers] = await Promise.all([
      prisma.offer.findUnique({
        where: { id: parseInt(offerId, 10) },
        select: { name: true },
      }),
      prisma.publisher.findMany({
        where: { id: { in: publisherIds } },
        select: { name: true },
      }),
    ]);

    return NextResponse.json({
      updatedCoupon: {
        ...updatedCoupon,
        discountType: updatedCoupon.discount_type,
        offerId: updatedCoupon.offer_id,
        validFrom: updatedCoupon.valid_from?.toISOString(),
        validTo: updatedCoupon.valid_to.toISOString(),
        creationDate: updatedCoupon.created_at.toISOString(),
        offerName: offer?.name || 'N/A',
        publisherIds,
        publisherNames: publishers.map((p) => p.name),
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating coupon:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Coupon not found after update.' }, { status: 404 });
    }

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Coupon with this code already exists.' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Failed to update coupon.' }, { status: 500 });
  }
}
