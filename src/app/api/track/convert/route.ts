// /app/api/track/convert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const click_id = searchParams.get('click_id');
  const offer_id = searchParams.get('offer_id');
  const amount = parseFloat(searchParams.get('amount') || '0');

  // Optionally, you could also validate that the click_id belongs to the correct publisher/offer here

  if (!click_id) {
    return NextResponse.json({ error: 'Missing click_id' }, { status: 400 });
  }

  try {
    // Fetch the click and get pub_id and offer_id for validation
    const res = await pool.query(`SELECT * FROM clicks WHERE click_id = $1`, [click_id]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Click not found' }, { status: 404 });
    }
    // Optionally, validate offer_id matches
    if (offer_id && res.rows[0].offer_id != offer_id) {
      return NextResponse.json({ error: 'Offer mismatch for click' }, { status: 400 });
    }

    // Check if this click_id already has a conversion for this offer
    const existing = await pool.query(
      `SELECT 1 FROM conversions WHERE click_id = $1 AND offer_id = $2`,
      [click_id, offer_id]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Conversion already recorded for this click and offer' }, { status: 409 });
    }

    await pool.query(
      `INSERT INTO conversions (click_id, offer_id, amount) VALUES ($1, $2, $3)`,
      [click_id, offer_id, amount]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Conversion tracking failed' }, { status: 500 });
  }
}
