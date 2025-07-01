import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST /api/webhook/conversion
export async function POST(req: NextRequest) {
  try {
    const { link_id } = await req.json();
    if (!link_id) {
      return NextResponse.json({ error: 'link_id is required.' }, { status: 400 });
    }

    // 1. Get offer_id and publisher_id from links table (id is now uuid)
    const linkRes = await pool.query(
      'SELECT offer_id, publisher_id FROM links WHERE id = $1::uuid',
      [link_id]
    );
    if (linkRes.rowCount === 0) {
      return NextResponse.json({ error: 'Invalid link_id.' }, { status: 404 });
    }
    const { offer_id, publisher_id } = linkRes.rows[0];

    // 2. Get payout from offers table
    const offerRes = await pool.query(
      'SELECT payout FROM offers WHERE id = $1',
      [offer_id]
    );
    if (offerRes.rowCount === 0) {
      return NextResponse.json({ error: 'Invalid offer_id.' }, { status: 404 });
    }
    const payout = parseFloat(offerRes.rows[0].payout); // Ensure payout is a number

    // CORRECTED: 3. Get commission_percent from offer_publishers table
    const offerPublisherRes = await pool.query(
      'SELECT commission_percent FROM offer_publishers WHERE offer_id = $1 AND publisher_id = $2',
      [offer_id, publisher_id]
    );

    if (offerPublisherRes.rowCount === 0) {
      // This means there's no specific commission set for this publisher-offer pair.
      // You might want a default commission_percent here, or handle it as an error.
      // For now, I'll return an error, but consider your business logic.
      return NextResponse.json(
        { error: 'Commission percentage not found for this offer-publisher combination.' },
        { status: 404 }
      );
    }
    const commissionPercent = parseFloat(offerPublisherRes.rows[0].commission_percent); // Ensure it's a number

    // 4. Calculate commission_amount
    const commissionAmount = payout * (commissionPercent / 100);

    // 5. Insert into conversions table (now including commission_amount)
    // IMPORTANT: Ensure your 'conversions' table has a 'commission_amount' column
    await pool.query(
      'INSERT INTO conversions (offer_id, link_id, pub_id, amount, commission_amount) VALUES ($1, $2, $3, $4, $5)',
      [offer_id, link_id, publisher_id, payout, commissionAmount]
    );

    return NextResponse.json({ message: 'Conversion recorded successfully.' });
  } catch (err) {
    console.error('Webhook conversion error:', err);
    return NextResponse.json({ error: 'Failed to record conversion.' }, { status: 500 });
  }
}