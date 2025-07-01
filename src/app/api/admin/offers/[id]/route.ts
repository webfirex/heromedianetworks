import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await pool.connect();

  try {
    const offerRes = await client.query(
      `SELECT id, name, offer_url, description, geo, payout, currency, status, created_at AS "creationDate"
       FROM offers WHERE id = $1`,
      [id]
    );

    if (offerRes.rowCount === 0) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    const advertiserRes = await client.query(
      `SELECT op.publisher_id, pub.name, op.commission_percent, op.commission_cut
       FROM offer_publishers op
       LEFT JOIN publishers pub ON pub.id = op.publisher_id
       WHERE op.offer_id = $1`,
      [id]
    );

    const offer = offerRes.rows[0];
    offer.advertisers = advertiserRes.rows.map(row => row.name);
    offer.commissions = advertiserRes.rows.map(row => ({
      publisher_id: row.publisher_id,
      name: row.name,
      commission_percent: row.commission_percent,
      commission_cut: row.commission_cut,
    }));

    return NextResponse.json(offer);
  } catch (err) {
    console.error('GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch offer' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const client = await pool.connect();

  const allowedFields = ['name', 'payout', 'currency', 'status', 'offer_url', 'description', 'geo'];
  const updates = [];
  const values = [];

  let i = 1;
  for (const key in body) {
    if (allowedFields.includes(key)) {
      updates.push(`${key} = $${i++}`);
      values.push(body[key]);
    }
  }

  try {
    await client.query('BEGIN');

    if (updates.length > 0) {
      const result = await client.query(
        `UPDATE offers SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
        [...values, id]
      );

      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
      }
    }

    // --- PATCH logic for adding advertiser if not exists ---
    if ((body.publisher_id || body.name) && body.commission_percent === undefined && body.commission_cut === undefined) {
      let publisherId = body.publisher_id;

      // If name is provided, look up publisher_id by name
      if (body.name) {
        const pubRes = await client.query('SELECT id FROM publishers WHERE name = $1', [body.name]);
        if ((pubRes.rowCount ?? 0) > 0) {
          publisherId = pubRes.rows[0].id;
        } else {
          await client.query('ROLLBACK');
          return NextResponse.json({ error: 'Publisher not found' }, { status: 404 });
        }
      }

      // If publisherId is still not set, error
      if (!publisherId) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'publisher_id or valid name required' }, { status: 400 });
      }

      // Check if offer-publisher exists
      const existsRes = await client.query(
        'SELECT 1 FROM offer_publishers WHERE offer_id = $1::int AND publisher_id = $2::uuid',
        [id, publisherId]
      );
      if (existsRes.rowCount === 0) {
        // Insert new offer-publisher row with null commissions
        await client.query(
          'INSERT INTO offer_publishers (offer_id, publisher_id) VALUES ($1::int, $2::uuid)',
          [id, publisherId]
        );
      }
    }

    await client.query('COMMIT');
    return NextResponse.json({ message: 'Offer updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const {
    name, payout, currency, status, offer_url, description, geo,
    publisher_id, commission_percent, commission_cut
  } = body;

  if (!name || !payout || !currency || !status || !offer_url) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE offers 
       SET name = $1, payout = $2, currency = $3, status = $4, offer_url = $5, description = $6, geo = $7
       WHERE id = $8 RETURNING *`,
      [name, payout, currency, status, offer_url, description, geo, id]
    );

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    if (publisher_id && (commission_percent !== undefined || commission_cut !== undefined)) {
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

      values.push(id, publisher_id);

      await client.query(
        `UPDATE offer_publishers SET ${fields.join(', ')} WHERE offer_id = $${i++} AND publisher_id = $${i}`,
        values
      );
    }

    await client.query('COMMIT');
    return NextResponse.json({ updated: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PUT error:', err);
    return NextResponse.json({ error: 'Failed to fully update offer' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { publisher_id } = body;
  if (!publisher_id) {
    return NextResponse.json({ error: 'Missing publisher_id' }, { status: 400 });
  }
  const client = await pool.connect();
  try {
    const result = await client.query(
      'DELETE FROM offer_publishers WHERE offer_id = $1::int AND publisher_id = $2::uuid',
      [id, publisher_id]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Advertiser not found for this offer' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Advertiser removed from offer' });
  } catch (err) {
    console.error('DELETE error:', err);
    return NextResponse.json({ error: 'Failed to remove advertiser' }, { status: 500 });
  } finally {
    client.release();
  }
}
