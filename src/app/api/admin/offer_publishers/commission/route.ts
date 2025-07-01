import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// PATCH /api/admin/offer_publishers/commission
export async function PATCH(req: NextRequest) {
  try {
    const { offer_id, publisher_id, commission_percent, commission_cut } = await req.json();
    if (!offer_id || !publisher_id) {
      return NextResponse.json({ error: 'Missing offer_id or publisher_id' }, { status: 400 });
    }
    const fields = [];
    const values = [];
    let i = 1;
    if (commission_percent !== undefined) {
      fields.push(`commission_percent = $${i++}`);
      values.push(commission_percent);
    }
    if (commission_cut !== undefined) {
      fields.push(`commission_cut = $${i++}`);
      values.push(commission_cut);
    }
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No commission fields provided' }, { status: 400 });
    }
    values.push(offer_id, publisher_id);
    const result = await pool.query(
      `UPDATE offer_publishers SET ${fields.join(', ')} WHERE offer_id = $${i++} AND publisher_id = $${i}`,
      values
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'No matching offer-publisher found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Commission updated successfully' });
  } catch (err) {
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
    const result = await pool.query(
      'DELETE FROM links WHERE id = $1',
      [link_id]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Link deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/admin/links/delete error:', err);
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 });
  }
}
