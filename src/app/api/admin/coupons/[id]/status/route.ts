// app/api/admin/coupons/[id]/status/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { status } = await request.json();

    if (!status || !['active', 'inactive', 'expired'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status provided.' }, { status: 400 });
    }

    const coupon = await prisma.coupon.update({
      where: { id: parseInt(id, 10) },
      data: { status: status as 'active' | 'inactive' | 'expired' },
      select: {
        id: true,
        status: true,
      },
    });

    return NextResponse.json({ updatedCoupon: coupon }, { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
    }
    console.error('Error updating coupon status:', error);
    return NextResponse.json({ error: 'Failed to update coupon status.' }, { status: 500 });
  }
}