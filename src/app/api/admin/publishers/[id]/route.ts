// /app/api/admin/publishers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { status } = body;

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE publishers SET status = $1 WHERE id = $2 RETURNING id, name, email, status, created_at, company`,
      [status, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Publisher not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Status updated successfully', publisher: result.rows[0] });
  } catch (err) {
    console.error('[PATCH /api/admin/publishers/:id]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
