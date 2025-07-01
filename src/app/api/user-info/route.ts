// app/api/user-info/route.ts or pages/api/user-info.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db'; // Your database connection pool

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  try {
    // Assuming 'created_at' stores the registration date in your 'publishers' table
    const { rows } = await pool.query('SELECT created_at FROM publishers WHERE email = $1 LIMIT 1', [email]);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ registeredAt: rows[0].created_at });
  } catch (error) {
    console.error('Failed to fetch user info:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}