import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const publisher_id = req.nextUrl.searchParams.get('publisher_id');
    if (!publisher_id) {
      return NextResponse.json({ error: 'Missing publisher_id' }, { status: 400 });
    }
    // Fetch coupons for this publisher (assumes coupons table with publisher_id or global coupons)
    const { rows } = await pool.query(
      `SELECT c.id, c.code, c.description, o.name as offer_name, c.valid_from, c.valid_to, c.offer_id
       FROM coupons c
       JOIN offers o ON c.offer_id = o.id
       WHERE c.publisher_id = $1 OR c.publisher_id IS NULL
       ORDER BY c.valid_from DESC
       LIMIT 50`,
      [publisher_id]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to fetch coupons:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons.' }, { status: 500 });
  }
}