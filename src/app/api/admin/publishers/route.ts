// /app/api/admin/publishers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const publisherId = searchParams.get('publisherId');

    if (publisherId) {
      const client = await pool.connect();
      // Fetch publisher info
      const publisherResult = await client.query(
        `SELECT id, name, email, company, status FROM publishers WHERE id = $1`,
        [publisherId]
      );
      const publisher = publisherResult.rows[0];
      if (!publisher) {
        client.release();
        return NextResponse.json({ error: 'Publisher not found' }, { status: 404 });
      }
      // Fetch stats for this publisher
      const clicksResult = await client.query(
        `SELECT COUNT(*) AS clicks FROM clicks WHERE pub_id = $1`,
        [publisherId]
      );
      const conversionsResult = await client.query(
        `SELECT COUNT(*) AS conversions, COALESCE(SUM(amount), 0) AS earnings FROM conversions WHERE pub_id = $1`,
        [publisherId]
      );
      const linksResult = await client.query(
        `SELECT COUNT(*) AS total_links FROM links WHERE publisher_id = $1::uuid`,
        [publisherId]
      );
      const offersResult = await client.query(
        `SELECT
            o.name AS offer_name,
            COUNT(c.id) AS clicks,
            COUNT(cv.id) AS conversions,
            COALESCE(SUM(cv.amount), 0) AS total_earning,
            o.commission_percent,
            o.commission_cut
          FROM offers o
          LEFT JOIN clicks c ON o.id = c.offer_id AND c.pub_id = $1
          LEFT JOIN conversions cv ON o.id = cv.offer_id AND cv.pub_id = $1
          WHERE o.id IN (SELECT offer_id FROM offer_publishers WHERE publisher_id = $1)
          GROUP BY o.name, o.commission_percent, o.commission_cut
        `,
        [publisherId]
      );
      client.release();
      return NextResponse.json({
        ...publisher,
        clicks: parseInt(clicksResult.rows[0]?.clicks || '0', 10),
        conversions: parseInt(conversionsResult.rows[0]?.conversions || '0', 10),
        earnings: parseFloat(conversionsResult.rows[0]?.earnings || '0'),
        totalLinks: parseInt(linksResult.rows[0]?.total_links || '0', 10),
        offers: offersResult.rows.map(row => ({
          offerName: row.offer_name,
          clicks: parseInt(row.clicks || '0', 10),
          conversions: parseInt(row.conversions || '0', 10),
          commissionPercent: row.commission_percent,
          commissionCut: row.commission_cut,
          totalEarning: parseFloat(row.total_earning || '0'),
        })),
      });
    }
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // 'pending' | 'approved' | 'rejected' | null
    const query = searchParams.get('query')?.toLowerCase() || '';
    const offset = (page - 1) * limit;
    const conditions = [];
    const values: unknown[] = [];
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }
    if (query) {
      values.push(`%${query}%`);
      conditions.push(`(LOWER(name) LIKE $${values.length} OR LOWER(email) LIKE $${values.length})`);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const dataQuery = `
      SELECT id, name, email, created_at, status, company
      FROM publishers
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM publishers
      ${whereClause}
    `;
    const dataResult = await pool.query(dataQuery, [...values, limit, offset]);
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0]?.total || '0');
    const totalPages = Math.ceil(total / limit);
    return NextResponse.json({
      data: dataResult.rows,
      total,
      totalPages,
      currentPage: page
    });
  } catch (err) {
    console.error('[GET /api/admin/publishers]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
