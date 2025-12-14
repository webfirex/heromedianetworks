import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';

// PATCH /api/admin/offer_publishers/commission
export async function PATCH(req: NextRequest) {
  try {
    const { offer_id, publisher_id, commission_percent, commission_cut } = await req.json();
    if (!offer_id || !publisher_id) {
      return NextResponse.json({ error: 'Missing offer_id or publisher_id' }, { status: 400 });
    }

    const updateData: any = {};
    if (commission_percent !== undefined) {
      updateData.commission_percent = commission_percent;
    }
    if (commission_cut !== undefined) {
      updateData.commission_cut = commission_cut;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No commission fields provided' }, { status: 400 });
    }

    await prisma.offerPublisher.update({
      where: {
        offer_id_publisher_id: {
          offer_id: parseInt(offer_id, 10),
          publisher_id: publisher_id,
        },
      },
      data: updateData,
    });

    return NextResponse.json({ message: 'Commission updated successfully' });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'No matching offer-publisher found' }, { status: 404 });
    }
    console.error('PATCH /api/admin/offer_publishers/commission error:', err);
    return NextResponse.json({ error: 'Failed to update commission' }, { status: 500 });
  }
}

// DELETE /api/admin/links/delete
export async function DELETE(req: NextRequest) {
  try {
    const { link_id } = await req.json();
    if (!link_id) {
      return NextResponse.json({ error: 'Missing link_id' }, { status: 400 });
    }
    // Using Prisma instead of pool
    const result = await prisma.link.deleteMany({
      where: { id: link_id },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Link deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/admin/links/delete error:', err);
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 });
  }
}
