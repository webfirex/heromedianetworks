// app/api/smartlink/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  // Accept both camelCase and snake_case keys
  const body = await req.json();
  const offerId = body.offerId || body.offer_id;
  const publisherId = body.publisherId || body.publisher_id;
  console.log('Creating smartlink for offerId:', offerId, 'and publisherId:', publisherId);

  if (!offerId || !publisherId) {
    return NextResponse.json({ error: 'Missing offerId or publisherId' }, { status: 400 });
  }

  try {
    // Check if a smartlink already exists for this publisher-offer pair
    const existing = await pool.query(
      `SELECT id, created_at FROM smartlinks WHERE offer_id = $1 AND publisher_id = $2 LIMIT 1`,
      [offerId, publisherId]
    );
    let smartlinkId;
    let createdAt;
    if (existing.rows.length > 0) {
      smartlinkId = existing.rows[0].id;
      createdAt = existing.rows[0].created_at;
    } else {
      // Create a new smartlink
      const { rows } = await pool.query(
        `INSERT INTO smartlinks (offer_id, publisher_id) VALUES ($1, $2) RETURNING id, created_at`,
        [offerId, publisherId]
      );
      smartlinkId = rows[0].id;
      createdAt = rows[0].created_at;
    }

    // Get offer name for frontend display
    const offerRes = await pool.query('SELECT name FROM offers WHERE id = $1', [offerId]);
    const offerName = offerRes.rows[0]?.name || '';

    // Build the smartlink URL using pub_id and offer_id for compatibility
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('host') || 'localhost';
    const smartlinkUrl = `${protocol}://${host}/api/postback?pub_id=${publisherId}&offer_id=${offerId}`;

    // Always use the current time for created_at if just created, otherwise use DB value
    const createdAtIso = createdAt ? new Date(createdAt).toISOString() : new Date().toISOString();

    return NextResponse.json({
      id: smartlinkId,
      offer_id: offerId,
      offer_name: offerName,
      created_at: createdAtIso,
      smartlink_url: smartlinkUrl,
    });
  } catch (error) {
    console.error('Smartlink creation failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
