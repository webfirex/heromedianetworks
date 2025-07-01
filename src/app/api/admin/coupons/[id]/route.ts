// app/api/admin/coupons/[id]/route.ts
import { NextResponse } from 'next/server';
import { PoolClient } from 'pg';
import pool from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let client: PoolClient | null = null;

  try {
    const {
      code,
      description,
      discount,
      discountType,
      offerId,
      publisherIds, // array of publisher IDs
      validFrom,
      validTo,
      status
    } = await request.json();

    if (
      !code || discount == null || !discountType || !offerId ||
      !Array.isArray(publisherIds) || publisherIds.length === 0 ||
      !validFrom || !validTo || !status
    ) {
      return NextResponse.json({ error: 'Missing required fields for update.' }, { status: 400 });
    }

    const fromDate = new Date(validFrom);
    const toDate = new Date(validTo);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()) || fromDate >= toDate) {
      return NextResponse.json({ error: 'Invalid dates provided or Valid From is not before Valid To.' }, { status: 400 });
    }

    client = await pool.connect();

    // Ensure coupon exists
    const couponCheck = await client.query('SELECT id FROM coupons WHERE id = $1', [id]);
    if (couponCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
    }

    // Validate offer ID
    const offerExists = await client.query('SELECT id FROM offers WHERE id = $1', [offerId]);
    if (offerExists.rows.length === 0) {
      return NextResponse.json({ error: 'Associated Offer ID does not exist.' }, { status: 400 });
    }

    // Validate all publisher IDs
    const publisherCheck = await client.query(
      `SELECT id FROM publishers WHERE id = ANY($1::uuid[])`,
      [publisherIds]
    );
    if (publisherCheck.rows.length !== publisherIds.length) {
      return NextResponse.json({ error: 'One or more publisher IDs are invalid.' }, { status: 400 });
    }

    // Update coupon (no publisher_id field anymore)
    const result = await client.query(
      `UPDATE coupons
       SET code = $1,
           description = $2,
           discount = $3,
           discount_type = $4,
           offer_id = $5,
           valid_from = $6,
           valid_to = $7,
           status = $8
       WHERE id = $9
       RETURNING id, code, description, discount, discount_type as "discountType",
                 offer_id as "offerId", valid_from as "validFrom", valid_to as "validTo",
                 status, creation_date as "creationDate"`,
      [code, description, discount, discountType, offerId, validFrom, validTo, status, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Coupon not found after update.' }, { status: 404 });
    }

    // Remove existing mappings
    await client.query(`DELETE FROM coupon_publishers WHERE coupon_id = $1`, [id]);

    // Insert new mappings
    const insertValues = publisherIds.map((_, idx) => `($1, $${idx + 2})`).join(', ');
    await client.query(
      `INSERT INTO coupon_publishers (coupon_id, publisher_id) VALUES ${insertValues}`,
      [id, ...publisherIds]
    );

    // Fetch offer name and publisher names
    const offerNameResult = await client.query('SELECT name FROM offers WHERE id = $1', [offerId]);
    const offerName = offerNameResult.rows[0]?.name || 'N/A';

    const publisherNameResult = await client.query(
      'SELECT name FROM publishers WHERE id = ANY($1::uuid[])',
      [publisherIds]
    );
    const publisherNames = publisherNameResult.rows.map(row => row.name);

    return NextResponse.json({
      updatedCoupon: {
        ...result.rows[0],
        offerName,
        publisherIds,
        publisherNames
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating coupon:', error);

    if (typeof error === 'object' && error !== null && 'code' in error) {
      const pgError = error as { code: string };
      if (pgError.code === '23505') {
        return NextResponse.json({ error: 'Coupon with this code already exists.' }, { status: 409 });
      }
    }

    return NextResponse.json({ error: 'Failed to update coupon.' }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
