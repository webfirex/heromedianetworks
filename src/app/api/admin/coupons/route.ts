// app/api/admin/coupons/route.ts
import { NextResponse } from 'next/server';
import { PoolClient } from 'pg';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const statusFilter = searchParams.get('status')?.toLowerCase();

  let client: PoolClient | null = null;

  try {
    client = await pool.connect();

    const queryParams: (string | number)[] = [];
    let paramIndex = 1;

    // Base FROM and WHERE
    let baseQuery = `
      FROM coupons c
      LEFT JOIN offers o ON c.offer_id = o.id
      LEFT JOIN coupon_publishers cp ON cp.coupon_id = c.id
      LEFT JOIN publishers p ON cp.publisher_id = p.id
      WHERE 1=1
    `;

    // Search
    if (search) {
      baseQuery += `
        AND (
          LOWER(c.code) LIKE $${paramIndex} OR
          LOWER(c.description) LIKE $${paramIndex} OR
          LOWER(o.name) LIKE $${paramIndex} OR
          LOWER(p.name) LIKE $${paramIndex} OR
          LOWER(c.id::text) LIKE $${paramIndex}
        )
      `;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Status
    if (statusFilter && statusFilter !== 'all') {
      baseQuery += ` AND c.status = $${paramIndex}`;
      queryParams.push(statusFilter);
      paramIndex++;
    }

    // Count query
    const countResult = await client.query(
      `SELECT COUNT(DISTINCT c.id) ${baseQuery}`,
      queryParams
    );
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Data query
    const dataQuery = `
      SELECT 
        c.id,
        c.code,
        COALESCE(c.description, '') AS description,
        COALESCE(c.discount, 0) AS discount,
        COALESCE(c.discount_type, 'fixed_amount') AS "discountType",
        c.offer_id AS "offerId",
        COALESCE(o.name, 'N/A') AS "offerName",
        c.valid_from AS "validFrom",
        c.valid_to AS "validTo",
        c.status,
        c.creation_date AS "creationDate",
        ARRAY_AGG(DISTINCT p.id) AS "publisherIds",
        ARRAY_AGG(DISTINCT p.name) AS "publisherNames"
      ${baseQuery}
      GROUP BY c.id, o.name
      ORDER BY c.creation_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const result = await client.query(dataQuery, queryParams);

    const coupons = result.rows.map(row => ({
      id: row.id,
      code: row.code,
      description: row.description,
      discount: parseFloat(row.discount),
      discountType: row.discountType,
      offerId: row.offerId,
      offerName: row.offerName,
      publisherIds: row.publisherIds.filter(Boolean), // remove nulls if global
      publisherNames: row.publisherNames.filter(Boolean),
      validFrom: new Date(row.validFrom).toISOString(),
      validTo: new Date(row.validTo).toISOString(),
      status: row.status,
      creationDate: new Date(row.creationDate).toISOString(),
    }));

    return NextResponse.json({ coupons, totalCount }, { status: 200 });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons.' }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
