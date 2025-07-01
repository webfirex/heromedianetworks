import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

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
    let linksToDelete = [];
    if (link_id) {
      linksToDelete = [link_id];
    } else {
      // Find all links for this offer and publisher
      const linksRes = await pool.query(
        'SELECT id FROM links WHERE offer_id = $1 AND publisher_id = $2',
        [offer_id, publisher_id]
      );
      linksToDelete = linksRes.rows.map((row: { id: string }) => row.id);
    }
    for (const id of linksToDelete) {
      await pool.query('DELETE FROM clicks WHERE link_id = $1', [id]);
      await pool.query('DELETE FROM conversions WHERE link_id = $1', [id]);
      await pool.query('DELETE FROM links WHERE id = $1', [id]);
    }
    return NextResponse.json({ message: 'Link(s) deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/admin/links/delete error:', err);
    return NextResponse.json({ error: 'Failed to delete link(s)' }, { status: 500 });
  }
}
