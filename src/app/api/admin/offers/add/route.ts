import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/db';

const secret = process.env.NEXTAUTH_SECRET;

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret });

  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      payout,
      currency,
      geo,
      description,
      offer_url,
      publisher_ids // can be [] or undefined
    } = body;

    // Basic validation
    if (!name || payout === undefined || !currency || !geo || !description || !offer_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert into offers table
    const offerResult = await pool.query(
      `INSERT INTO offers 
        (name, payout, currency, geo, description, offer_url, status)
       VALUES 
        ($1, $2, $3, $4, $5, $6, 'active') 
       RETURNING *`,
      [name, payout, currency, geo, description, offer_url]
    );

    const offer = offerResult.rows[0];
    const offerId = offer.id;

    // Determine publishers to link
    let publishersToLink: string[] = [];

    if (Array.isArray(publisher_ids) && publisher_ids.length > 0) {
      // Validate UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const validUUIDs = publisher_ids.filter((id: string) => uuidRegex.test(id));

      if (validUUIDs.length === 0) {
        return NextResponse.json({ error: 'Invalid publisher IDs' }, { status: 400 });
      }

      // Confirm publisher IDs exist
      const { rows: validPublishers } = await pool.query(
        `SELECT id FROM publishers WHERE id = ANY($1::uuid[])`,
        [validUUIDs]
      );

      const existingIds = validPublishers.map((row) => row.id);
      const invalidIds = validUUIDs.filter((id) => !existingIds.includes(id));

      if (invalidIds.length > 0) {
        return NextResponse.json({ error: `Invalid publisher IDs: ${invalidIds.join(', ')}` }, { status: 400 });
      }

      publishersToLink = existingIds;
    } else {
      // Global offer: link all publishers
      const allPublishers = await pool.query(`SELECT id FROM publishers`);
      publishersToLink = allPublishers.rows.map((row) => row.id);
    }

    // Insert mappings into offer_publishers table
    if (publishersToLink.length > 0) {
      const valuePlaceholders = publishersToLink.map((_, i) => `($1, $${i + 2})`).join(', ');
      await pool.query(
        `INSERT INTO offer_publishers (offer_id, publisher_id) VALUES ${valuePlaceholders}`,
        [offerId, ...publishersToLink]
      );
    }

    return NextResponse.json(
      { message: 'Offer created successfully', offer },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating offer:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
