import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/db';

const secret = process.env.NEXTAUTH_SECRET;

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret });

    if (!token || token.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const body = await req.json();

    const {
      code,
      description,
      discount,
      discountType,
      offer_id,
      valid_from,
      valid_to,
      status = 'active',
      publisher_ids, // Optional
    } = body;

    if (!code || !description || discount == null || !discountType || !offer_id || !valid_to) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert coupon
    const result = await pool.query(
      `INSERT INTO coupons 
         (code, description, discount, discount_type, offer_id, valid_from, valid_to, status)
       VALUES 
         ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        code,
        description,
        discount,
        discountType,
        offer_id,
        valid_from ? new Date(valid_from) : null,
        new Date(valid_to),
        status,
      ]
    );

    const coupon = result.rows[0];
    const couponId = coupon.id; // This is an integer

    let publishersToLink: string[] = [];

    if (Array.isArray(publisher_ids) && publisher_ids.length > 0) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const validUUIDs = publisher_ids.filter((id: string) => uuidRegex.test(id));

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
      const { rows: allPublishers } = await pool.query(`SELECT id FROM publishers`);
      publishersToLink = allPublishers.map((row) => row.id);
    }

    // Insert into coupon_publishers (coupon_id is integer, publisher_id is UUID)
    if (publishersToLink.length > 0) {
      const values = publishersToLink.map((_, i) => `($1, $${i + 2})`).join(', ');
      await pool.query(
        `INSERT INTO coupon_publishers (coupon_id, publisher_id) VALUES ${values}`,
        [couponId, ...publishersToLink]
      );
    }

    return NextResponse.json({ success: true, coupon }, { status: 201 });
  } catch (error) {
    console.error('Error adding coupon:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
