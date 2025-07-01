import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, status FROM publishers WHERE email = $1 LIMIT 1', // Select both id and status
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Publisher not found' }, { status: 404 });
    }

    const publisher = rows[0];

    return NextResponse.json({ id: publisher.id, status: publisher.status }); // Return status as well
  } catch (error) {
    console.error('Failed to fetch publisher id and status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}