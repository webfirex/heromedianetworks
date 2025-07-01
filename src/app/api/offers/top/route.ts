import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const publisher_id = req.nextUrl.searchParams.get('publisher_id');
    if (!publisher_id) {
      return NextResponse.json({ error: 'Missing publisher_id' }, { status: 400 });
    }
    // Fetch top offers for this publisher, ordered by conversions and revenue
    const { rows } = await pool.query(
      `SELECT o.id, o.name, o.payout, o.geo, o.description, o.offer_url,
              COALESCE(COUNT(conv.id), 0) AS conversions,
              COALESCE(SUM(conv.amount), 0) AS revenue
       FROM offers o
       LEFT JOIN clicks cl ON o.id = cl.offer_id AND cl.pub_id = $1
       LEFT JOIN conversions conv ON cl.click_id = conv.click_id
       GROUP BY o.id
       ORDER BY revenue DESC, conversions DESC
       LIMIT 20`,
      [publisher_id]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to fetch top offers:', error);
    return NextResponse.json({ error: 'Failed to fetch top offers.' }, { status: 500 });
  }
}
