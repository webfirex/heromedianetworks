// app/api/admin/smartlinks/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const {id} = await params;
  const body = await req.json();
  const { status } = body;

  if (!['active', 'terminated'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `UPDATE smartlinks SET status = $1 WHERE id = $2 RETURNING id`,
      [status, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Smartlink not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Smartlink ${status} successfully` });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update smartlink status' }, { status: 500 });
  }
}
