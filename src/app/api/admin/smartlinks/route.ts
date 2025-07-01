// app/api/admin/smartlinks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    const values: unknown[] = [];

    let query = `
      SELECT 
        s.id,
        s.created_at,
        s.status,
        o.name AS offer_name,
        o.offer_url,
        p.name AS publisher_name
      FROM smartlinks s
      JOIN offers o ON s.offer_id = o.id
      JOIN publishers p ON s.publisher_id = p.id
      WHERE 1=1
    `;

    if (status && ['pending', 'active', 'terminated'].includes(status)) {
      query += ` AND s.status = $${values.length + 1}`;
      values.push(status);
    }

    if (search) {
      query += ` AND (
        LOWER(o.name) ILIKE $${values.length + 1} OR
        LOWER(o.offer_url) ILIKE $${values.length + 1} OR
        LOWER(p.name) ILIKE $${values.length + 1}
      )`;
      values.push(`%${search.toLowerCase()}%`);
    }

    query += ` ORDER BY s.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const { rows } = await pool.query(query, values);

    // Count total filtered items
    const countQuery = `
      SELECT COUNT(*) FROM smartlinks s
      JOIN offers o ON s.offer_id = o.id
      JOIN publishers p ON s.publisher_id = p.id
      WHERE 1=1
      ${status ? `AND s.status = '${status}'` : ''}
      ${search ? `AND (
        LOWER(o.name) ILIKE '%${search.toLowerCase()}%' OR
        LOWER(o.offer_url) ILIKE '%${search.toLowerCase()}%' OR
        LOWER(p.name) ILIKE '%${search.toLowerCase()}%'
      )` : ''}
    `;
    const countResult = await pool.query(countQuery);
    const total = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: rows.map(r => ({
        id: r.id,
        name: r.offer_name,
        url: r.offer_url,
        creationDate: r.created_at,
        createdBy: r.publisher_name,
        status: r.status,
      })),
      totalPages,
      totalFilteredItems: total,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch smartlinks' }, { status: 500 });
  }
}
