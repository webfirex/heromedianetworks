import { NextRequest, NextResponse } from 'next/server';
// import { getSession } from 'next-auth/react';
import pool from '@/lib/db';

interface DashboardData {
  totalClicks: number;
  totalConversions: number;
  totalEarning: number;
  clicksThisMonth: number;
  clicksPreviousMonth: number;
  salesThisMonth: number;
  salesPreviousMonth: number;
  commissionThisMonth: number;
  commissionPreviousMonth: number;
  weeklyClicks: { day: string; clicks: number }[];
  trafficSources: { name: string; value: number }[];
  clicksOverTime: { period: string; clicks: number }[];
  conversionTrend: { period: string; conversions: number }[];
  commissionsOverTime: { period: string; commission: number }[];
  conversionsByOffer: { name: string; value: number }[];
  rawTotalConversions: number;
  conversionsDifference: number;
  avgCommissionCut: number;
}

export async function GET(req: NextRequest) {
  try {
    // const session = await getSession({ req });
    // let publisher_id = session?.user?.id;

    // if (!publisher_id && session?.user?.email) {
    //   const emailRes = await fetch(`/api/publisher/id?email=${encodeURIComponent(session.user.email)}`);
    //   if (emailRes.ok) {
    //     const data = await emailRes.json();
    //     publisher_id = data.id;
    //   }
    // }

    // if (!publisher_id) {
    //   return NextResponse.json({ error: 'You must be logged in as a publisher to view dashboard data.' }, { status: 401 });
    // }

    const searchParams = req.nextUrl.searchParams;
    const publisher_id = searchParams.get('publisher_id');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dashboardData: DashboardData = {
      totalClicks: 0,
      totalConversions: 0,
      totalEarning: 0,
      clicksThisMonth: 0,
      clicksPreviousMonth: 0,
      salesThisMonth: 0,
      salesPreviousMonth: 0,
      commissionThisMonth: 0,
      commissionPreviousMonth: 0,
      weeklyClicks: [],
      trafficSources: [],
      clicksOverTime: [],
      conversionTrend: [],
      commissionsOverTime: [],
      conversionsByOffer: [],
      rawTotalConversions: 0,
      conversionsDifference: 0,
      avgCommissionCut: 0,
    };

    // Define date ranges for this month and previous month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const firstDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total Clicks
    let totalClicksQuery = `
      SELECT COUNT(*) as total
      FROM clicks
      WHERE pub_id = $1
    `;
    const totalClicksParams: unknown[] = [publisher_id];
    if (startDate && endDate) {
      // totalClicksQuery += ` AND created_at BETWEEN $2 AND $3`;
      totalClicksQuery += ` AND timestamp >= $2 AND timestamp < ($3::date + INTERVAL '1 day')`;
      totalClicksParams.push(startDate, endDate);
    }
    const totalClicksResult = await pool.query(totalClicksQuery, totalClicksParams);
    dashboardData.totalClicks = parseInt(totalClicksResult.rows[0].total) || 0;

    // Total Conversions: sum of all conversions for this publisher, then subtract commission_cut percent
    const totalConversionsQuery = `
      SELECT 
        COALESCE(SUM(offer_conversions.total_conversions), 0) AS total_conversions,
        COALESCE(AVG(op.commission_cut::float), 0) AS avg_commission_cut
      FROM offer_publishers op
      LEFT JOIN (
        SELECT offer_id, COUNT(*) AS total_conversions
        FROM conversions
        WHERE pub_id = $1
        ${startDate && endDate ? 'AND timestamp >= $2 AND timestamp < ($3::date + INTERVAL \'1 day\')' : ''}
        GROUP BY offer_id
      ) AS offer_conversions
      ON op.offer_id = offer_conversions.offer_id AND op.publisher_id = $1
      WHERE op.publisher_id = $1
    `;
    const totalConversionsParams: unknown[] = [publisher_id];
    if (startDate && endDate) {
      totalConversionsParams.push(startDate, endDate);
    }
    const totalConversionsResult = await pool.query(totalConversionsQuery, totalConversionsParams);
    dashboardData.rawTotalConversions = parseInt(totalConversionsResult.rows[0].total_conversions) || 0;
    dashboardData.avgCommissionCut = parseFloat(totalConversionsResult.rows[0].avg_commission_cut) || 0;
    dashboardData.totalConversions = Math.round(dashboardData.rawTotalConversions * (1 - dashboardData.avgCommissionCut / 100));
    dashboardData.conversionsDifference = dashboardData.rawTotalConversions - dashboardData.totalConversions;

    // Total Earnings (commission_amount from conversions)
    let totalEarningsQuery = `
      SELECT COALESCE(SUM(c.commission_amount), 0) AS total
      FROM conversions c
      JOIN offer_publishers op
        ON c.offer_id = op.offer_id AND c.pub_id = op.publisher_id
      WHERE
        c.pub_id = $1
    `;
    const totalEarningsParams: unknown[] = [publisher_id];
    if (startDate && endDate) {
      totalEarningsQuery += ` AND timestamp >= $2 AND timestamp < ($3::date + INTERVAL '1 day')`;
      totalEarningsParams.push(startDate, endDate);
    }
    const totalEarningsResult = await pool.query(totalEarningsQuery, totalEarningsParams);
    dashboardData.totalEarning = parseFloat(totalEarningsResult.rows[0].total) || 0;

    // Clicks This Month
    const clicksThisMonthQuery = `
      SELECT COUNT(*) as total
      FROM clicks
      WHERE pub_id = $1
      AND created_at BETWEEN $2 AND $3
    `;
    const clicksThisMonthResult = await pool.query(clicksThisMonthQuery, [
      publisher_id,
      firstDayOfMonth,
      lastDayOfMonth,
    ]);
    dashboardData.clicksThisMonth = parseInt(clicksThisMonthResult.rows[0].total) || 0;

    // Clicks Previous Month
    const clicksPreviousMonthQuery = `
      SELECT COUNT(*) as total
      FROM clicks
      WHERE pub_id = $1
      AND created_at BETWEEN $2 AND $3
    `;
    const clicksPreviousMonthResult = await pool.query(clicksPreviousMonthQuery, [
      publisher_id,
      firstDayOfPreviousMonth,
      lastDayOfPreviousMonth,
    ]);
    dashboardData.clicksPreviousMonth = parseInt(clicksPreviousMonthResult.rows[0].total) || 0;

    // Sales This Month (commission_cut applied and rounded)
    const salesThisMonthQuery = `
      SELECT 
        COALESCE(SUM(offer_conversions.total_conversions), 0) AS total_sales,
        COALESCE(AVG(op.commission_cut::float), 0) AS avg_commission_cut
      FROM offer_publishers op
      LEFT JOIN (
        SELECT offer_id, COUNT(*) AS total_conversions
        FROM conversions
        WHERE pub_id = $1 AND timestamp BETWEEN $2 AND $3
        GROUP BY offer_id
      ) AS offer_conversions
      ON op.offer_id = offer_conversions.offer_id AND op.publisher_id = $1
      WHERE op.publisher_id = $1
    `;
    const salesThisMonthResult = await pool.query(salesThisMonthQuery, [
      publisher_id,
      firstDayOfMonth,
      lastDayOfMonth,
    ]);
    const salesThisMonthRaw = parseInt(salesThisMonthResult.rows[0].total_sales) || 0;
    const salesThisMonthCommission = parseFloat(salesThisMonthResult.rows[0].avg_commission_cut) || 0;
    dashboardData.salesThisMonth = Math.round(salesThisMonthRaw * (1 - salesThisMonthCommission / 100));

    // Sales Previous Month (commission_cut applied and rounded)
    const salesPreviousMonthQuery = `
      SELECT 
        COALESCE(SUM(offer_conversions.total_conversions), 0) AS total_sales,
        COALESCE(AVG(op.commission_cut::float), 0) AS avg_commission_cut
      FROM offer_publishers op
      LEFT JOIN (
        SELECT offer_id, COUNT(*) AS total_conversions
        FROM conversions
        WHERE pub_id = $1 AND timestamp BETWEEN $2 AND $3
        GROUP BY offer_id
      ) AS offer_conversions
      ON op.offer_id = offer_conversions.offer_id AND op.publisher_id = $1
      WHERE op.publisher_id = $1
    `;
    const salesPreviousMonthResult = await pool.query(salesPreviousMonthQuery, [
      publisher_id,
      firstDayOfPreviousMonth,
      lastDayOfPreviousMonth,
    ]);
    const salesPreviousMonthRaw = parseInt(salesPreviousMonthResult.rows[0].total_sales) || 0;
    const salesPreviousMonthCommission = parseFloat(salesPreviousMonthResult.rows[0].avg_commission_cut) || 0;
    dashboardData.salesPreviousMonth = Math.round(salesPreviousMonthRaw * (1 - salesPreviousMonthCommission / 100));

    // Commission This Month
    const commissionThisMonthQuery = `
      SELECT COALESCE(SUM(commission_amount), 0) as total
      FROM conversions
      WHERE pub_id = $1
      AND timestamp BETWEEN $2 AND $3
    `;
    const commissionThisMonthResult = await pool.query(commissionThisMonthQuery, [
      publisher_id,
      firstDayOfMonth,
      lastDayOfMonth,
    ]);
    dashboardData.commissionThisMonth = parseFloat(commissionThisMonthResult.rows[0].total) || 0;

    // Commission Previous Month
    const commissionPreviousMonthQuery = `
      SELECT COALESCE(SUM(commission_amount), 0) as total
      FROM conversions
      WHERE pub_id = $1
      AND timestamp BETWEEN $2 AND $3
    `;
    const commissionPreviousMonthResult = await pool.query(commissionPreviousMonthQuery, [
      publisher_id,
      firstDayOfPreviousMonth,
      lastDayOfPreviousMonth,
    ]);
    dashboardData.commissionPreviousMonth = parseFloat(commissionPreviousMonthResult.rows[0].total) || 0;

    // Weekly Clicks (Last 7 Days)
    // Weekly Clicks (Last 7 Days - Properly Grouped by Date)
// Weekly Clicks (Current Week: Monday to Today)
const weeklyClicksQuery = `
  SELECT 
    TO_CHAR(created_at::date, 'Dy') AS day,
    TO_CHAR(created_at::date, 'YYYY-MM-DD') AS date,
    COUNT(*) as clicks
  FROM clicks
  WHERE pub_id = $1
    AND created_at::date >= date_trunc('week', CURRENT_DATE)
    AND created_at::date <= CURRENT_DATE
  GROUP BY date, day
  ORDER BY date
`;

const weeklyClicksResult = await pool.query(weeklyClicksQuery, [publisher_id]);

dashboardData.weeklyClicks = weeklyClicksResult.rows.map(row => ({
  day: row.day,
  clicks: parseInt(row.clicks),
}));


    // Traffic Sources (Clicks by Offer Name)
    let trafficSourcesQuery = `
  SELECT o.name, COUNT(c.id) as value
  FROM clicks c
  JOIN offers o ON c.offer_id = o.id
  WHERE c.pub_id = $1
`;
const trafficSourcesParams: unknown[] = [publisher_id];

if (startDate && endDate) {
  trafficSourcesQuery += ` AND c.created_at BETWEEN $2 AND $3`; 
  trafficSourcesParams.push(startDate, endDate);
}

trafficSourcesQuery += ` GROUP BY o.name ORDER BY value DESC`;

    const trafficSourcesResult = await pool.query(trafficSourcesQuery, trafficSourcesParams);
    dashboardData.trafficSources = trafficSourcesResult.rows.map(row => ({
      name: row.name || 'Unknown',
      value: parseInt(row.value),
    }));

    // Clicks Over Time (Daily for This Month)
    const clicksOverTimeQuery = `
      SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as period, COUNT(*) as clicks
      FROM clicks
      WHERE pub_id = $1
      AND created_at BETWEEN $2 AND $3
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY TO_CHAR(created_at, 'YYYY-MM-DD')
    `;
    const clicksOverTimeResult = await pool.query(clicksOverTimeQuery, [
      publisher_id,
      firstDayOfMonth,
      lastDayOfMonth,
    ]);
    dashboardData.clicksOverTime = clicksOverTimeResult.rows.map(row => ({
      period: row.period,
      clicks: parseInt(row.clicks),
    }));

    // Conversion Trend (Daily for This Month)
    const conversionTrendQuery = `
      SELECT TO_CHAR(timestamp, 'YYYY-MM-DD') as period, COUNT(*) as conversions
      FROM conversions
      WHERE pub_id = $1
      AND timestamp BETWEEN $2 AND $3
      GROUP BY TO_CHAR(timestamp, 'YYYY-MM-DD')
      ORDER BY TO_CHAR(timestamp, 'YYYY-MM-DD')
    `;
    const conversionTrendResult = await pool.query(conversionTrendQuery, [
      publisher_id,
      firstDayOfMonth,
      lastDayOfMonth,
    ]);
    dashboardData.conversionTrend = conversionTrendResult.rows.map(row => ({
      period: row.period,
      conversions: parseInt(row.conversions),
    }));

    // Commissions Over Time (Daily for This Month)
    const commissionsOverTimeQuery = `
      SELECT TO_CHAR(timestamp, 'YYYY-MM-DD') as period, COALESCE(SUM(commission_amount), 0) as commission
      FROM conversions
      WHERE pub_id = $1
      AND timestamp BETWEEN $2 AND $3
      GROUP BY TO_CHAR(timestamp, 'YYYY-MM-DD')
      ORDER BY TO_CHAR(timestamp, 'YYYY-MM-DD')
    `;
    const commissionsOverTimeResult = await pool.query(commissionsOverTimeQuery, [
      publisher_id,
      firstDayOfMonth,
      lastDayOfMonth,
    ]);
    dashboardData.commissionsOverTime = commissionsOverTimeResult.rows.map(row => ({
      period: row.period,
      commission: parseFloat(row.commission),
    }));

    // Conversions By Offer
    let conversionsByOfferQuery = `
  SELECT o.name, COUNT(c.id) as value
  FROM conversions c
  JOIN offers o ON c.offer_id = o.id
  WHERE c.pub_id = $1
`;
const conversionsByOfferParams: unknown[] = [publisher_id];

if (startDate && endDate) {
  conversionsByOfferQuery += ` AND c.timestamp BETWEEN $2 AND $3`;
  conversionsByOfferParams.push(startDate, endDate);
}

conversionsByOfferQuery += ` GROUP BY o.name ORDER BY value DESC`;


    const conversionsByOfferResult = await pool.query(conversionsByOfferQuery, conversionsByOfferParams);
    dashboardData.conversionsByOffer = conversionsByOfferResult.rows.map(row => ({
      name: row.name || 'Unknown',
      value: parseInt(row.value),
    }));

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data.' }, { status: 500 });
  }
}