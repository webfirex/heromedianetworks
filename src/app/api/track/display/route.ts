import { NextResponse, NextRequest } from 'next/server';
import pool from '@/lib/db'; // adjust this path to your pool file

export async function GET(req: NextRequest) {
  try {
    // Get the current user's email from the query or session (for SSR, you may need to pass it from the client)
    const { searchParams } = new URL(req.url);
    let pub_id = searchParams.get('pub_id');

    // If not provided, fallback to a static pub_id (for dev/testing)
    if (!pub_id) {
      return NextResponse.json({ error: 'Missing pub_id' }, { status: 400 });
    }

    // If pub_id is an email, fetch the publisher's id from the database
    if (pub_id.includes('@')) {
      const pubRes = await pool.query('SELECT id FROM publishers WHERE email = $1', [pub_id]);
      if (pubRes.rows.length > 0) {
        pub_id = pubRes.rows[0].id;
      } else {
        return NextResponse.json({ error: 'Publisher not found' }, { status: 404 });
      }
    }

    const offersRes = await pool.query(
      'SELECT id, name, offer_url FROM offers ORDER BY created_at DESC'
    );
    const offers = offersRes.rows;

    const results = await Promise.all(
      offers.map(async (offer) => {
        const clicksRes = await pool.query(
          'SELECT click_id FROM clicks WHERE offer_id = $1 AND pub_id = $2 ORDER BY timestamp DESC',
          [offer.id, pub_id]
        );
        const clickIds = clicksRes.rows.map((r) => r.click_id);
        const total_clicks = clickIds.length;
        // Get the most recent click_id
        const last_click_id = clickIds.length > 0 ? clickIds[0] : null;

        let total_conversions = 0;
        if (clickIds.length > 0) {
          const conversionsRes = await pool.query(
            'SELECT COUNT(*) FROM conversions WHERE click_id = ANY($1)',
            [clickIds]
          );
          total_conversions = parseInt(conversionsRes.rows[0].count, 10);
        }

        return {
          ...offer,
          total_clicks,
          total_conversions,
          last_click_id,
        };
      })
    );
    
    console.log(results);

    return NextResponse.json({ offers: results });
  } catch (err) {
    console.error('Dashboard Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
