
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pub_id = searchParams.get('pub_id');
  const offer_id = searchParams.get('offer_id');

  // If pub_id is an email, fetch the publisher's id from the database
  let publisherId = pub_id;
  if (pub_id && pub_id.includes('@')) {
    const pubRes = await pool.query('SELECT id FROM publishers WHERE email = $1', [pub_id]);
    if (pubRes.rows.length > 0) {
      publisherId = pubRes.rows[0].id;
    } else {
      return NextResponse.json({ error: 'Publisher not found' }, { status: 404 });
    }
  }

  if (!pub_id || !offer_id) {
    return NextResponse.json({ error: 'Missing pub_id or offer_id' }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || '';
  const click_id = uuidv4();

  // TODO: Replace with actual device/browser detection
  const device = 'unknown';
  const browser = 'unknown';
  const geo = 'unknown'; // IP geolocation logic later

  try {
    await pool.query(
      `INSERT INTO clicks (click_id, pub_id, offer_id, ip_address, user_agent, device, browser, geo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [click_id, publisherId, offer_id, ip, userAgent, device, browser, geo]
    );

    // Fetch offer URL (assuming you have offers table)
    const offerRes = await pool.query(`SELECT offer_url FROM offers WHERE id = $1`, [offer_id]);
    const offerUrl = offerRes.rows?.[0]?.offer_url;

    if (!offerUrl) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Redirect with click_id as query param
    const redirectUrl = new URL(offerUrl);
    redirectUrl.searchParams.set('click_id', click_id);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Click tracking failed' }, { status: 500 });
  }
}
