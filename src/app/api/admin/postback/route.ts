// /api/admin/postback/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/db';
import { PoolClient } from 'pg';

const secret = process.env.NEXTAUTH_SECRET;

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}

interface ClickSummary {
  clickId: string;
  ipAddress: string;
  userAgent: string;
  publisherId: string | null;
  publisherName: string | null;
}

interface OfferWithClicks {
  offerId: string;
  offerName: string;
  offerUrl: string;
  publisherId: string;
  publisherName: string;
  linkId: string;
  linkName: string;
  clicks: ClickSummary[];
  totalConversions: number; // ADDED: Total conversions for this offer-link-publisher combo
}

export async function GET(request: NextRequest) {
  if (!secret) {
    console.error('NEXTAUTH_SECRET is not defined!');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const token = await getToken({ req: request, secret });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const search = searchParams.get('search')?.toLowerCase() || '';

  let client: PoolClient | null = null;
  try {
    client = await pool.connect();

    const queryParams: (string | number)[] = [];
    let paramIndex = 1;

    // We still need the total count of distinct link IDs for overall pagination
    let countQuery = `
      SELECT COUNT(DISTINCT l.id)
      FROM links l
      INNER JOIN offers o ON l.offer_id = o.id
      INNER JOIN publishers p ON l.publisher_id = p.id
      WHERE 1=1
    `;

    // The main data query will now group by link, offer, and publisher,
    // and count clicks and conversions for that specific grouping.
    let dataQuery = `
      SELECT
        o.id as "offerId",
        o.name as "offerName",
        o.offer_url as "offerUrl",
        l.id as "linkId",
        l.name as "linkName",
        p.id as "publisherId",
        p.name as "publisherName",
        COUNT(DISTINCT clicks.click_id) as "totalClicks",
        COUNT(DISTINCT conv.id) as "totalConversions", -- ADDED: Count conversions
        ARRAY_AGG(jsonb_build_object(
          'clickId', clicks.click_id,
          'ipAddress', clicks.ip_address::text,
          'userAgent', clicks.user_agent,
          'publisherId', clicks.pub_id,
          'publisherName', publisher_clicks.name -- Using alias from subquery for publisher name
        )) FILTER (WHERE clicks.click_id IS NOT NULL) as clicks_array
      FROM links l
      INNER JOIN offers o ON l.offer_id = o.id
      INNER JOIN publishers p ON l.publisher_id = p.id
      LEFT JOIN clicks ON clicks.link_id = l.id
      LEFT JOIN publishers publisher_clicks ON clicks.pub_id = publisher_clicks.id -- Join for click's publisher name
      LEFT JOIN conversions conv ON conv.link_id = l.id AND conv.offer_id = o.id AND conv.pub_id = p.id -- Join for conversions
      WHERE 1=1
    `;

    if (search) {
      const searchCondition = ` AND LOWER(o.name) LIKE $${paramIndex}`;
      queryParams.push(`%${search}%`);
      countQuery += searchCondition;
      dataQuery += searchCondition;
      paramIndex++;
    }

    // Group by the main identifying columns for offer-link-publisher
    dataQuery += `
      GROUP BY o.id, o.name, o.offer_url, l.id, l.name, p.id, p.name
      ORDER BY o.id, l.id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    const [countResult, dataResult] = await Promise.all([
      client.query(countQuery, queryParams.slice(0, paramIndex - 1)), // Slice for count query
      client.query(dataQuery, queryParams),
    ]);

    const totalCount = parseInt(countResult.rows[0].count, 10);

    // No need for a Map anymore since the query does the grouping
    // and returns a `clicks_array` which we'll map to `clicks`
    const offers: OfferWithClicks[] = dataResult.rows.map(row => ({
      offerId: row.offerId,
      offerName: row.offerName,
      offerUrl: row.offerUrl,
      linkId: row.linkId,
      linkName: row.linkName,
      publisherId: row.publisherId,
      publisherName: row.publisherName,
      totalConversions: parseInt(row.totalConversions, 10), // Map the new column
      clicks: row.clicks_array || [], // Ensure clicks array is not null
    }));

    return NextResponse.json({ offers, totalCount }, { status: 200 });
  } catch (error) {
    console.error('Error fetching admin click data:', error);
    return NextResponse.json({ error: 'Failed to fetch click data' }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}