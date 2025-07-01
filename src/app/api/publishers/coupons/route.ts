import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const publisher_id = searchParams.get('publisher_id');
    const search = searchParams.get('search')?.toLowerCase() || '';
    const status = searchParams.get('status'); // 'active' | 'expired' | undefined
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 15;
    const offset = (page - 1) * limit;

    if (!publisher_id) {
      return NextResponse.json({ error: 'Missing publisher_id' }, { status: 400 });
    }

    const conditions: string[] = [
      `(cp.publisher_id = $1 OR cp.publisher_id IS NULL)`
    ];
    const values: unknown[] = [publisher_id];
    let i = 2;

    if (search) {
      conditions.push(`(LOWER(c.code) LIKE $${i} OR LOWER(o.name) LIKE $${i})`);
      values.push(`%${search}%`);
      i++;
    }

    if (status === 'active') {
      conditions.push(`c.valid_to >= NOW()`);
    } else if (status === 'expired') {
      conditions.push(`c.valid_to < NOW()`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const query = `
      SELECT 
        c.id,
        c.code,
        c.description,
        o.name AS offer_name,
        c.valid_from,
        c.valid_to,
        c.offer_id,
        CONCAT(c.discount, ' ', c.discount_type) AS discount_value,
        (CASE WHEN c.valid_to >= NOW() THEN 'active' ELSE 'expired' END) AS status
      FROM coupons c
      LEFT JOIN coupon_publishers cp ON cp.coupon_id = c.id
      JOIN offers o ON c.offer_id = o.id
      ${whereClause}
      GROUP BY c.id, o.name
      ORDER BY c.valid_from DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const { rows } = await pool.query(query, values);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to fetch coupons:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons.' }, { status: 500 });
  }
}
