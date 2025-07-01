import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token || !token.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT created_at FROM admins WHERE email = $1 LIMIT 1',
        [token.email]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
      }

      return NextResponse.json({ registeredAt: result.rows[0].created_at });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[GET /api/admin/profile/info]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
