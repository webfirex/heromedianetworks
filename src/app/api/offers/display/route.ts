import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    // Support search query param
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.trim() || '';
    let query = 'SELECT id, name, payout, geo, description, offer_url FROM offers';
    let params: string[] = [];
    if (search) {
      query += ' WHERE name ILIKE $1 OR geo ILIKE $1 OR description ILIKE $1';
      params = [`%${search}%`];
    }
    query += ' ORDER BY name ASC';
    const { rows } = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to fetch offers:', error);
    return NextResponse.json({ error: 'Failed to fetch offers.' }, { status: 500 });
  }
}
