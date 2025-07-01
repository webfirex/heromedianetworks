import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const publisher_id = searchParams.get('publisher_id');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 15;
    const offset = (page - 1) * limit;

    if (!publisher_id) {
      return NextResponse.json({ error: 'Missing publisher_id' }, { status: 400 });
    }

    const values: unknown[] = [publisher_id];

    let query = `
      SELECT
        o.id,
        o.name,
        o.offer_url,
        o.description,
        o.geo,
        o.status,
        CONCAT(o.currency, ' ', o.payout) AS payout_info,
        COALESCE(COUNT(c.id), 0) AS clicks,
        o.updated_at,
        l.id AS link_id
      FROM offers o
      INNER JOIN offer_publishers op ON o.id = op.offer_id
      INNER JOIN links l ON l.offer_id = o.id AND l.publisher_id = $1::uuid
      LEFT JOIN clicks c ON o.id = c.offer_id AND c.pub_id = $1
      WHERE op.publisher_id = $1
    `;

    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      query += ` AND (LOWER(o.name) LIKE $${values.length} OR LOWER(o.description) LIKE $${values.length})`;
    }

    if (status === 'active') {
      values.push('active');
      query += ` AND o.status = $${values.length}`;
    } else if (status === 'expired') {
      values.push('expired');
      query += ` AND o.status = $${values.length}`;
    }

    query += `
      GROUP BY o.id, l.id
      ORDER BY o.updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // COUNT query
    let countQuery = `
      SELECT COUNT(DISTINCT o.id)
      FROM offers o
      INNER JOIN offer_publishers op ON o.id = op.offer_id
      INNER JOIN links l ON l.offer_id = o.id AND l.publisher_id = $1::uuid
      WHERE op.publisher_id = $1
    `;
    const countValues: unknown[] = [publisher_id];

    if (search) {
      countValues.push(`%${search.toLowerCase()}%`);
      countQuery += ` AND (LOWER(o.name) LIKE $${countValues.length} OR LOWER(o.description) LIKE $${countValues.length})`;
    }

    if (status === 'active') {
      countValues.push('active');
      countQuery += ` AND o.status = $${countValues.length}`;
    } else if (status === 'expired') {
      countValues.push('expired');
      countQuery += ` AND o.status = $${countValues.length}`;
    }

    const [offersResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, countValues),
    ]);

    const totalCount = parseInt(countResult.rows[0].count, 10);

    return NextResponse.json({ offers: offersResult.rows, totalCount });
  } catch (error) {
    console.error('Failed to fetch offers:', error);
    return NextResponse.json({ error: 'Failed to fetch offers.' }, { status: 500 });
  }
}
