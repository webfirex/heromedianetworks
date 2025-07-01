// /app/api/track/click/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pub_id = searchParams.get('pub_id');
  const offer_id = searchParams.get('offer_id');
  const link_id = searchParams.get('link_id');

  // Validate required query parameters
  if (!pub_id || !offer_id || !link_id) {
    return NextResponse.json({ error: 'Missing pub_id, offer_id or link_id' }, { status: 400 });
  }

  // If pub_id is an email, resolve to publisher ID
  let publisherId = pub_id;
  if (pub_id.includes('@')) {
    const pubRes = await pool.query('SELECT id FROM publishers WHERE email = $1', [pub_id]);
    if (pubRes.rows.length > 0) {
      publisherId = pubRes.rows[0].id;
    } else {
      return NextResponse.json({ error: 'Publisher not found' }, { status: 404 });
    }
  }

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || '';
  const click_id = uuidv4();

  try {
    // Store the click
    await pool.query(
      `INSERT INTO clicks (click_id, pub_id, offer_id, link_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [click_id, publisherId, offer_id, link_id, ip, userAgent]
    );

    // Get destination offer URL
    const offerRes = await pool.query(`SELECT offer_url FROM offers WHERE id = $1`, [offer_id]);
    const offerUrl = offerRes.rows?.[0]?.offer_url;

    if (!offerUrl) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Append link_id to redirect URL instead of click_id
    const redirectUrl = new URL(offerUrl);
    redirectUrl.searchParams.set('link_id', link_id);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (err) {
    console.error('Click tracking failed:', err);
    return NextResponse.json({ error: 'Click tracking failed' }, { status: 500 });
  }
}
