// File: pages/api/publishers/postback.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/db';
import { PoolClient } from 'pg';

const secret = process.env.NEXTAUTH_SECRET;

// Extend JWT interface if not already done globally
declare module "next-auth/jwt" {
  interface JWT {
    id?: string; // Assuming 'sub' from token is 'id'
    role?: string; // If you plan to add roles to publishers as well
  }
}

interface ClickSummary {
  clickId: string;
  ipAddress: string;
  userAgent: string;
}

interface OfferWithClicks {
  offerId: string;
  offerName: string;
  offerUrl: string;
  linkId: string;
  linkName: string;
  totalClicks: number;
  totalConversions: number; // ADDED: Total conversions for this offer-link combo
  clicks: ClickSummary[];
}

export async function GET(request: NextRequest) {
  if (!secret) {
    console.error('Missing NEXTAUTH_SECRET');
    return NextResponse.json({ error: 'Server config error' }, { status: 500 });
  }

  const token = await getToken({ req: request, secret });
  if (!token || !token.sub) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const publisherId = searchParams.get('publisher_id');
  const search = searchParams.get('search')?.toLowerCase() || '';
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  if (!publisherId || publisherId !== token.sub) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let client: PoolClient | null = null;

  try {
    client = await pool.connect();

    const queryParams: unknown[] = [publisherId]; // $1 is publisherId
    let currentParamIndex = 2; // Start for dynamic conditions (search, limit, offset)

    const searchCondition = search ? `AND LOWER(o.name) LIKE $${currentParamIndex++}` : '';
    if (search) queryParams.push(`%${search}%`); // Push search param if present

    const countQuery = `
      SELECT COUNT(DISTINCT l.id) AS total_count
      FROM links l
      JOIN offers o ON l.offer_id = o.id
      WHERE l.publisher_id = $1::uuid
      ${searchCondition}
    `;

    const dataQuery = `
      SELECT
        o.id AS offer_id,
        o.name AS offer_name,
        o.offer_url,
        l.id AS link_id,
        l.name AS link_name,
        COUNT(DISTINCT c.click_id) AS total_clicks,
        COUNT(DISTINCT conv.id) AS total_conversions,
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'clickId', c.click_id,
            'ipAddress', c.ip_address::text,
            'userAgent', c.user_agent
          )
        ) FILTER (WHERE c.click_id IS NOT NULL) AS clicks
      FROM links l
      JOIN offers o ON l.offer_id = o.id
      LEFT JOIN clicks c ON c.link_id = l.id
      LEFT JOIN conversions conv ON conv.link_id = l.id AND conv.offer_id = o.id AND conv.pub_id = l.publisher_id
      WHERE l.publisher_id = $1::uuid
      ${searchCondition}
      GROUP BY o.id, o.name, o.offer_url, l.id, l.name
      ORDER BY l.created_at DESC
      LIMIT $${currentParamIndex++} OFFSET $${currentParamIndex++}
    `;

    queryParams.push(limit, offset); // Push limit and offset parameters

    const [countResult, dataResult] = await Promise.all([
      client.query(countQuery, queryParams.slice(0, queryParams.length - 2)), // Count query doesn't need limit/offset
      client.query(dataQuery, queryParams),
    ]);

    const offers: OfferWithClicks[] = dataResult.rows.map((row) => ({
      offerId: row.offer_id, // Corrected to match SQL alias
      offerName: row.offer_name, // Corrected to match SQL alias
      offerUrl: row.offer_url,
      linkId: row.link_id, // Corrected to match SQL alias
      linkName: row.link_name, // Corrected to match SQL alias
      totalClicks: parseInt(row.total_clicks, 10), // Corrected to match SQL alias
      totalConversions: parseInt(row.total_conversions, 10), // Corrected to match SQL alias
      clicks: (row.clicks || []).map((click: ClickSummary) => ({
        clickId: click.clickId,
        ipAddress: click.ipAddress,
        userAgent: click.userAgent,
      })),
    }));

    const totalCount = countResult.rows[0]?.total_count ? parseInt(countResult.rows[0].total_count, 10) : 0;

    return NextResponse.json({ offers, totalCount }, { status: 200 });
  } catch (err) {
    console.error('Error fetching publisher click data:', err);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}