import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';

// DELETE /api/admin/links/delete
export async function DELETE(req: NextRequest) {
  try {
    const { link_id, offer_id, publisher_id } = await req.json();
    if (!link_id && (!offer_id || !publisher_id)) {
      return NextResponse.json(
        { error: 'Missing link_id or (offer_id and publisher_id)' },
        { status: 400 }
      );
    }

    let linksToDelete: string[] = [];
    if (link_id) {
      linksToDelete = [link_id];
    } else {
      // Find all links for this offer and publisher
      const links = await prisma.link.findMany({
        where: {
          offer_id: parseInt(offer_id, 10),
          publisher_id: publisher_id,
        },
        select: { id: true },
      });
      linksToDelete = links.map((link) => link.id);
    }

    // Delete links (cascades will handle clicks and conversions)
    for (const id of linksToDelete) {
      await prisma.link.delete({
        where: { id },
      });
    }

    return NextResponse.json({ message: 'Link(s) deleted successfully' });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }
    console.error('DELETE /api/admin/links/delete error:', err);
    return NextResponse.json({ error: 'Failed to delete link(s)' }, { status: 500 });
  }
}
