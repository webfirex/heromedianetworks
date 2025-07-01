import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/admin/offer_publishers/by-offer?offer_id=123
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const offerId = searchParams.get('offer_id');
  if (!offerId) {
    return NextResponse.json({ error: 'Missing offer_id' }, { status: 400 });
  }
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.email
       FROM offer_publishers op
       JOIN publishers p ON op.publisher_id = p.id
       WHERE op.offer_id = $1`,
      [offerId]
    );
    return NextResponse.json({ publishers: result.rows });
  } catch (err) {
    console.error('Error fetching publishers for offer:', err);
    return NextResponse.json({ error: 'Failed to fetch publishers for offer' }, { status: 500 });
  }
}
