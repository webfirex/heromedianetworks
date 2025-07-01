// app/api/admin/coupons/[id]/status/route.ts
import { NextResponse } from 'next/server';
import { PoolClient } from 'pg';
import pool from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {

  const { id } = await params;
  let client: PoolClient | null = null;
  try {
    const { status } = await request.json();

    if (!status || !['pending', 'active', 'expired', 'terminated'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status provided.' }, { status: 400 });
    }

    client = await pool.connect();

    const result = await client.query(
      `UPDATE coupons
       SET status = $1
       WHERE id = $2
       RETURNING id, status`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
    }

    return NextResponse.json({ updatedCoupon: result.rows[0] }, { status: 200 });

  } catch (error) {
    console.error('Error updating coupon status:', error);
    return NextResponse.json({ error: 'Failed to update coupon status.' }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}