import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    const client = await pool.connect();

    const query = `
      SELECT 
        o.id,
        o.name,
        STRING_AGG(DISTINCT pub.name, ', ') AS advertisers,
        o.offer_url,
        o.description,
        o.geo,
        o.payout,
        o.currency,
        ARRAY_AGG(op.commission_percent) FILTER (WHERE op.commission_percent IS NOT NULL) AS commission_percent,
        ARRAY_AGG(op.commission_cut) FILTER (WHERE op.commission_cut IS NOT NULL) AS commission_cut,
        o.status,
        o.created_at AS "creationDate",
        COUNT(DISTINCT c.id) AS clicks,
        COUNT(DISTINCT conv.id) AS conversions,
        CASE 
          WHEN COUNT(DISTINCT c.id) = 0 THEN 0 
          ELSE ROUND(COUNT(DISTINCT conv.id)::numeric / COUNT(DISTINCT c.id) * 100, 2) 
        END AS cr,
        CASE 
          WHEN COUNT(DISTINCT c.id) = 0 THEN 0 
          ELSE ROUND(o.payout * COUNT(DISTINCT conv.id)::numeric / COUNT(DISTINCT c.id), 2)
        END AS epc
      FROM offers o
      LEFT JOIN offer_publishers op ON o.id = op.offer_id
      LEFT JOIN publishers pub ON pub.id = op.publisher_id
      LEFT JOIN clicks c ON c.offer_id = o.id
      LEFT JOIN conversions conv ON conv.offer_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await client.query(query, [limit, offset]);
    client.release();

    return NextResponse.json({ offers: result.rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
  }
}
