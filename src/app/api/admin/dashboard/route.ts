import pool from "@/lib/db";
import { NextResponse } from "next/server";

// Corrected the route to ensure proper error handling and consistent data formatting
export async function GET() {
  try {
    const client = await pool.connect();

    // Fetch total clicks
    const totalClicksResult = await client.query(
      `SELECT COUNT(*) AS total_clicks FROM clicks;`
    );
    const totalClicks = parseInt(totalClicksResult.rows[0]?.total_clicks || '0', 10);

    // Fetch total conversions
    const totalConversionsResult = await client.query(
      `SELECT COUNT(*) AS total_conversions FROM conversions;`
    );
    const totalConversions = parseInt(totalConversionsResult.rows[0]?.total_conversions || '0', 10);

    // Fetch total earnings
    const totalEarningsResult = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_earnings FROM conversions;`
    );
    const totalEarnings = parseFloat(totalEarningsResult.rows[0]?.total_earnings || '0');

    // Fetch total approvals
    const totalApprovalsResult = await client.query(
      `SELECT COUNT(*) AS total_approvals FROM publishers WHERE status = 'approved';`
    );
    const totalApprovals = parseInt(totalApprovalsResult.rows[0]?.total_approvals || '0', 10);

    // Fetch weekly clicks grouped by day
    const weeklyClicksResult = await client.query(
      `SELECT
        TO_CHAR(timestamp AT TIME ZONE 'UTC', 'Dy') AS day,
        COUNT(*) AS clicks
      FROM clicks
      WHERE timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY TO_CHAR(timestamp AT TIME ZONE 'UTC', 'Dy'), EXTRACT(DOW FROM timestamp AT TIME ZONE 'UTC')
      ORDER BY EXTRACT(DOW FROM timestamp AT TIME ZONE 'UTC');`
    );
    const weeklyClicks = weeklyClicksResult.rows.map(row => ({
      day: row.day,
      clicks: parseInt(row.clicks || '0', 10),
    }));

    // Fetch traffic sources
    const trafficSourcesResult = await client.query(
  `SELECT
    o.name AS name,
    COUNT(c.id) AS value
  FROM clicks c
  JOIN offers o ON c.offer_id = o.id
  WHERE o.status = 'active' 
  GROUP BY o.name
  ORDER BY value DESC;`
);

    const trafficSources = trafficSourcesResult.rows.map(row => ({
      name: row.name,
      value: parseInt(row.value || '0', 10),
    }));

    // Fetch top performing offers
    const topPerformingOffersResult = await client.query(
      `SELECT
        o.name AS offer_name,
        COUNT(c.id) AS clicks,
        COUNT(cv.id) AS conversions,
        COALESCE(SUM(cv.amount), 0) AS revenue
      FROM offers o
      LEFT JOIN clicks c ON o.id = c.offer_id
      LEFT JOIN conversions cv ON o.id = cv.offer_id
      GROUP BY o.name
      ORDER BY revenue DESC, conversions DESC, clicks DESC
      LIMIT 10;`
    );
    const topPerformingOffers = topPerformingOffersResult.rows.map(row => ({
      offerName: row.offer_name,
      clicks: parseInt(row.clicks || '0', 10),
      conversions: parseInt(row.conversions || '0', 10),
      revenue: parseFloat(row.revenue || '0').toFixed(2),
    }));

    // Fetch clicks over time
    const clicksOverTimeResult = await client.query(
      `SELECT
        TO_CHAR(timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS period,
        COUNT(*) AS clicks
      FROM clicks
      WHERE timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY TO_CHAR(timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD')
      ORDER BY period;`
    );
    const clicksOverTime = clicksOverTimeResult.rows.map(row => ({
      period: row.period,
      clicks: parseInt(row.clicks || '0', 10),
    }));

    // Fetch conversion trend
    const conversionTrendResult = await client.query(
      `SELECT
        TO_CHAR(timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS period,
        COUNT(*) AS conversions
      FROM conversions
      WHERE timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY TO_CHAR(timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD')
      ORDER BY period;`
    );
    const conversionTrend = conversionTrendResult.rows.map(row => ({
      period: row.period,
      conversions: parseInt(row.conversions || '0', 10),
    }));

    client.release();

    // Include new data in the response
    return NextResponse.json({
      totalClicks,
      totalConversions,
      totalEarnings,
      totalApprovals,
      weeklyClicks,
      trafficSources,
      clicksOverTime,
      conversionTrend,
      topPerformingOffers,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    return NextResponse.json({ error: "Failed to fetch admin dashboard data" }, { status: 500 });
  }
}
