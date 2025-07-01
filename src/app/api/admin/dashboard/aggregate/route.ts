import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = await pool.connect();

    // Fetch total clicks across all publishers
    const totalClicksResult = await client.query(
      `SELECT COUNT(*) AS total_clicks FROM clicks;`
    );
    const totalClicks = parseInt(totalClicksResult.rows[0].total_clicks, 10) || 0;

    // Fetch total conversions across all publishers
    const totalConversionsResult = await client.query(
      `SELECT COUNT(*) AS total_conversions FROM conversions;`
    );
    const totalConversions = parseInt(totalConversionsResult.rows[0].total_conversions, 10) || 0;

    // Fetch total earnings across all publishers
    const totalEarningsResult = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_earnings FROM conversions;`
    );
    const totalEarnings = parseFloat(totalEarningsResult.rows[0].total_earnings) || 0;

    // Fetch total approvals across all publishers
    const totalApprovalsResult = await client.query(
      `SELECT COUNT(*) AS total_approvals FROM conversions WHERE status = 'approved';`
    );
    const totalApprovals = parseInt(totalApprovalsResult.rows[0].total_approvals, 10) || 0;

    // Fetch weekly clicks grouped by day across all publishers
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
      clicks: parseInt(row.clicks, 10),
    }));

    // Fetch traffic sources across all publishers
    const trafficSourcesResult = await client.query(
      `SELECT
        source,
        COUNT(*) AS value
      FROM clicks
      GROUP BY source
      ORDER BY value DESC;`
    );
    const trafficSources = trafficSourcesResult.rows.map(row => ({
      name: row.source,
      value: parseInt(row.value, 10),
    }));

    // Fetch top performing offers across all publishers
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
      clicks: parseInt(row.clicks, 10),
      conversions: parseInt(row.conversions, 10),
      revenue: parseFloat(row.revenue).toFixed(2),
    }));

    client.release();

    return NextResponse.json({
      totalClicks,
      totalConversions,
      totalEarnings,
      totalApprovals,
      weeklyClicks,
      trafficSources,
      topPerformingOffers,
    });
  } catch (error) {
    console.error("Error fetching aggregated admin dashboard data:", error);
    return NextResponse.json({ error: "Failed to fetch aggregated admin dashboard data" }, { status: 500 });
  }
}
