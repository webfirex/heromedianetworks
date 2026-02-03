import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';
import { Prisma } from '@prisma/client';

interface DashboardData {
  totalClicks: number;
  uniqueClicks: number;              // ✅ ADD
  conversionRate: number;            // ✅ ADD

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

  overviewClicks?: {
    last24h: { period: string; clicks: number }[];
    last7d: { period: string; clicks: number }[];
    last30d: { period: string; clicks: number }[];
  };

  rawTotalConversions: number;
  conversionsDifference: number;
  avgCommissionCut: number;
}


export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const publisher_id = searchParams.get('publisher_id');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!publisher_id) {
      return NextResponse.json({ error: 'Missing publisher_id' }, { status: 400 });
    }

    // Define date ranges
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const firstDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // 1. Fetch all OfferPublisher configs for this publisher once (small dataset)
    const offerPublishers = await prisma.offerPublisher.findMany({
      where: { publisher_id },
      select: { offer_id: true, commission_cut: true },
    });
    const cutMap = new Map(offerPublishers.map(op => [op.offer_id, Number(op.commission_cut || 0)]));
    const DEFAULT_COMMISSION_CUT = 0;

    // Helper to calculate shaved counts based on cuts
    const calculateShavedCount = (offerCounts: { offer_id: number; _count: { id: number } }[]) => {
      let rawTotal = 0;
      let shavedTotal = 0;
      let weightedCutSum = 0;

      for (const item of offerCounts) {
        const count = item._count.id;
        const cut = cutMap.get(item.offer_id) || 0;

        rawTotal += count;
        shavedTotal += count * (1 - cut / 100);
        weightedCutSum += count * cut;
      }

      return {
        raw: rawTotal,
        shaved: Math.round(shavedTotal),
        avgCut: rawTotal > 0 ? weightedCutSum / rawTotal : 0
      };
    };

    const calculateShavedClicks = (
      offerClicks: { offer_id: number; unique: number; total: number }[]
    ) => {
      let rawUnique = 0;
      let netUnique = 0;
      let rawTotal = 0;
      let netTotal = 0;

      for (const item of offerClicks) {
        const cut = DEFAULT_COMMISSION_CUT;

        rawUnique += item.unique;
        rawTotal += item.total;

        netUnique += item.unique * (1 - cut / 100);
        netTotal += item.total * (1 - cut / 100);
      }

      return {
        rawUnique: Math.round(rawUnique),
        netUnique: Math.round(netUnique),
        rawTotal: Math.round(rawTotal),
        netTotal: Math.round(netTotal),
      };
    };


    // Filters
    const clicksDateFilter = startDate && endDate
      ? {
        timestamp: {
          gte: new Date(startDate),
          lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000),
        },
      }
      : {};

    const conversionsDateFilter = startDate && endDate
      ? {
        created_at: {
          gte: new Date(startDate),
          lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000),
        },
      }
      : {};

    // Determine chart date range: Use user input if provided, otherwise default to current month
    const queryStartDate = startDate ? new Date(startDate) : firstDayOfMonth;
    const queryEndDate = endDate ? new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000) : lastDayOfMonth;

    // Parallelize all independent queries with combined SQL for performance
    const [
      clicksStats,
      conversionsStats,
      weeklyClicksResult,
      trafficSourcesData,
      clicksOverTimeResult,
      conversionTrendResult,
      commissionsOverTimeResult,
      conversionsByOfferData,
      overviewClicksLast24h,
      overviewClicksLast7d,
      overviewClicksLast30d,
      clicksByOfferResult,
      simulatedConversionsResult
    ] = await Promise.all([

      // 1. Combined Click Stats (Total, This Month, Prev Month)
      prisma.$queryRaw<Array<{ metric: string; count: bigint }>>`
      SELECT 'total' AS metric, COUNT(*) AS count
      FROM clicks
      WHERE pub_id = ${publisher_id}::uuid
    
      UNION ALL
    
      SELECT 'this_month' AS metric, COUNT(*) AS count
      FROM clicks
      WHERE pub_id = ${publisher_id}::uuid
        AND date_trunc(
          'month',
          timezone('Asia/Kolkata', timestamp)
        ) = date_trunc(
          'month',
          timezone('Asia/Kolkata', NOW())
        )
    
      UNION ALL
    
      SELECT 'prev_month' AS metric, COUNT(*) AS count
      FROM clicks
      WHERE pub_id = ${publisher_id}::uuid
        AND date_trunc(
          'month',
          timezone('Asia/Kolkata', timestamp)
        ) = date_trunc(
          'month',
          timezone('Asia/Kolkata', NOW()) - interval '1 month'
        )
    `,

      // 2. Combined Conversion Stats (Total, This Month, Prev Month)
      prisma.$queryRaw<Array<{ metric: string; count: bigint; sum_commission: number; offer_id: number }>>`
      -- Global
      SELECT 'global' AS metric,
             COUNT(*) AS count,
             COALESCE(SUM(commission_amount), 0)::float AS sum_commission,
             offer_id
      FROM conversions
      WHERE pub_id = ${publisher_id}::uuid
      GROUP BY offer_id
    
      UNION ALL
    
      -- This Month (IST)
      SELECT 'this_month' AS metric,
             COUNT(*) AS count,
             COALESCE(SUM(commission_amount), 0)::float AS sum_commission,
             offer_id
      FROM conversions
      WHERE pub_id = ${publisher_id}::uuid
        AND date_trunc(
          'month',
          timezone('Asia/Kolkata', created_at)
        ) = date_trunc(
          'month',
          timezone('Asia/Kolkata', NOW())
        )
      GROUP BY offer_id
    
      UNION ALL
    
      -- Prev Month (IST)
      SELECT 'prev_month' AS metric,
             COUNT(*) AS count,
             COALESCE(SUM(commission_amount), 0)::float AS sum_commission,
             offer_id
      FROM conversions
      WHERE pub_id = ${publisher_id}::uuid
        AND date_trunc(
          'month',
          timezone('Asia/Kolkata', created_at)
        ) = date_trunc(
          'month',
          timezone('Asia/Kolkata', NOW()) - interval '1 month'
        )
      GROUP BY offer_id
    `,

      // 3. Weekly Clicks (Always current week for specific card)
      prisma.$queryRaw<Array<{ day: string; date: string; clicks: bigint }>>`
      SELECT
      TO_CHAR(timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata','Dy') AS day,
        TO_CHAR(timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata','YYYY-MM-DD') AS date,
        COUNT(*)::bigint AS clicks
      FROM clicks
      WHERE pub_id = ${publisher_id}::uuid
        AND (timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date >=
          date_trunc('week',(NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'))::date

      GROUP BY date, day
      ORDER BY date
    `,

      // 4. Traffic Sources (Geo)
      prisma.click.groupBy({
        by: ['geo'],
        where: {
          pub_id: publisher_id,
          timestamp: { gte: queryStartDate, lt: queryEndDate }
        },
        _count: { id: true },
        orderBy: {
          _count: { id: 'desc' }
        },
        take: 5
      }),

      // 5. Clicks Over Time (Daily - Use selected range)
      prisma.$queryRaw<Array<{ period: string; clicks: bigint }>>`
      SELECT
      TO_CHAR(timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata','YYYY-MM-DD') AS period,
        COUNT(*)::bigint AS clicks
      FROM clicks
      WHERE pub_id = ${publisher_id}::uuid
        AND (timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date
          BETWEEN ${startDate}::date AND ${endDate}::date

      GROUP BY period
      ORDER BY period
    `,

      // 6. Conversion Trend (Daily - Use selected range)
      prisma.$queryRaw<Array<{ period: string; conversions: bigint }>>`
      SELECT
        TO_CHAR(
          conversions.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata',
          'YYYY-MM-DD'
        ) AS period,
        COUNT(*)::bigint AS conversions
      FROM conversions
      WHERE conversions.pub_id = ${publisher_id}::uuid
        AND (conversions.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date
            BETWEEN ${startDate}::date AND ${endDate}::date
      GROUP BY period
      ORDER BY period
    `,

      // 7. Commissions Over Time (Daily - Use selected range)
      prisma.$queryRaw<Array<{ period: string; commission: number }>>`
      SELECT
        TO_CHAR(
          conversions.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata',
          'YYYY-MM-DD'
        ) AS period,
        COALESCE(SUM(commission_amount), 0)::float AS commission
      FROM conversions
      WHERE conversions.pub_id = ${publisher_id}::uuid
        AND (conversions.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date
            BETWEEN ${startDate}::date AND ${endDate}::date
      GROUP BY period
      ORDER BY period
    `,

      // 8. Conversions By Offer (for list)
      prisma.conversion.groupBy({
        by: ['offer_id'],
        where: {
          pub_id: publisher_id,
          created_at: {
            gte: new Date(queryStartDate),
            lte: new Date(queryEndDate),
          },
        },
        _count: { id: true },
      }),

      // 9. Overview Clicks - Last 24 hours (hourly buckets, zero-filled)
      prisma.$queryRaw<Array<{ period: string; clicks: bigint }>>`
      WITH hours AS (
        SELECT generate_series(
          date_trunc('hour', timezone('Asia/Kolkata', NOW()) - interval '23 hour'),
          date_trunc('hour', timezone('Asia/Kolkata', NOW())),
          interval '1 hour'
        ) AS bucket
      )
      SELECT
        TO_CHAR(hours.bucket, 'HH24:00') AS period,
        COALESCE(COUNT(clicks.*), 0)::bigint AS clicks
      FROM hours
      LEFT JOIN clicks
        ON clicks.pub_id = ${publisher_id}::uuid
        AND timezone('Asia/Kolkata', clicks.timestamp) >= hours.bucket
        AND timezone('Asia/Kolkata', clicks.timestamp) < hours.bucket + interval '1 hour'
      GROUP BY hours.bucket
      ORDER BY hours.bucket
    `,

      // 10. Overview Clicks - Last 7 days (daily buckets, zero-filled)
      prisma.$queryRaw<Array<{ period: string; clicks: bigint }>>`
      WITH days AS (
        SELECT generate_series(
          date_trunc('day', timezone('Asia/Kolkata', NOW()) - interval '6 day'),
          date_trunc('day', timezone('Asia/Kolkata', NOW())),
          interval '1 day'
        ) AS bucket
      )
      SELECT
        TO_CHAR(days.bucket, 'YYYY-MM-DD') AS period,
        COALESCE(COUNT(clicks.*), 0)::bigint AS clicks
      FROM days
      LEFT JOIN clicks
        ON clicks.pub_id = ${publisher_id}::uuid
        AND timezone('Asia/Kolkata', clicks.timestamp) >= days.bucket
        AND timezone('Asia/Kolkata', clicks.timestamp) < days.bucket + interval '1 day'
      GROUP BY days.bucket
      ORDER BY days.bucket
    `,

      // 11. Overview Clicks - Last 30 days (daily buckets, zero-filled)
      prisma.$queryRaw<Array<{ period: string; clicks: bigint }>>`
      WITH days AS (
        SELECT generate_series(
          date_trunc('day', timezone('Asia/Kolkata', NOW()) - interval '29 day'),
          date_trunc('day', timezone('Asia/Kolkata', NOW())),
          interval '1 day'
        ) AS bucket
      )
      SELECT
        TO_CHAR(days.bucket, 'YYYY-MM-DD') AS period,
        COALESCE(COUNT(clicks.*), 0)::bigint AS clicks
      FROM days
      LEFT JOIN clicks
        ON clicks.pub_id = ${publisher_id}::uuid
        AND timezone('Asia/Kolkata', clicks.timestamp) >= days.bucket
        AND timezone('Asia/Kolkata', clicks.timestamp) < days.bucket + interval '1 day'
      GROUP BY days.bucket
      ORDER BY days.bucket
    `,

      prisma.$queryRaw<Array<{ offer_id: number; unique_clicks: bigint; total_clicks: bigint }>>`
        SELECT
          offer_id,
          COUNT(*) FILTER (WHERE is_unique = true)::bigint AS unique_clicks,
          COUNT(*)::bigint AS total_clicks
        FROM clicks
        WHERE pub_id = ${publisher_id}::uuid
          AND timestamp >= ${queryStartDate}
          AND timestamp < ${queryEndDate}
        GROUP BY offer_id
      `,

      // 12. Simulated conversions from clicks (unique + fixed CR)
      prisma.$queryRaw<Array<{ offer_id: number; simulated: number; }>>`
        SELECT
          offer_id,
          FLOOR(SUM(
            CASE
              WHEN is_unique = true AND fixed_conversion_rate > 0
              THEN fixed_conversion_rate / 100.0
              ELSE 0
            END
          ))::int AS simulated
        FROM clicks
        WHERE pub_id = ${publisher_id}::uuid
          AND timestamp >= ${queryStartDate}
          AND timestamp < ${queryEndDate}
        GROUP BY offer_id
      `,


    ]);

    // console.log('[DEBUG] Simulated conversions raw:', simulatedConversionsResult);
    const clicksByOffer = clicksByOfferResult.map(row => ({
      offer_id: row.offer_id,
      unique: Number(row.unique_clicks),
      total: Number(row.total_clicks),
    }));
    console.log('[DEBUG] Simulated conversions raw:', clicksByOffer);

    const shavedClicksStats = calculateShavedClicks(clicksByOffer);

    console.log('[DEBUG] Simulated shaved conversions raw:', shavedClicksStats);
    const simulatedMap = new Map<number, number>(
      simulatedConversionsResult.map(r => [r.offer_id, Number(r.simulated)])
    );

    console.log('[DEBUG] Simulated map:', simulatedMap);


    console.log('[DEBUG] Weekly Clicks Raw from DB:',);
    console.log('[DEBUG] Publisher ID:', publisher_id);

    // Parse Click Stats
    const totalClicksGlobal = Number(clicksStats.find(s => s.metric === 'total')?.count || 0);
    const clicksThisMonth = Number(clicksStats.find(s => s.metric === 'this_month')?.count || 0);
    const clicksPreviousMonth = Number(clicksStats.find(s => s.metric === 'prev_month')?.count || 0);

    // Calculate clicks for selected date range (for Overview card)
    const totalClicks = shavedClicksStats.netTotal;
    const uniqueClicks = shavedClicksStats.netUnique;


    // Parse Conversion Stats (grouped by offer)
    const globalConversions = conversionsStats.filter(s => s.metric === 'global').map(s => ({ offer_id: s.offer_id, _count: { id: Number(s.count) } }));
    const thisMonthConversions = conversionsStats.filter(s => s.metric === 'this_month').map(s => ({ offer_id: s.offer_id, _count: { id: Number(s.count) } }));
    const prevMonthConversions = conversionsStats.filter(s => s.metric === 'prev_month').map(s => ({ offer_id: s.offer_id, _count: { id: Number(s.count) } }));

    // Calculate conversions for selected date range (for Overview card)
    const conversionCountMap = new Map<number, number>();

    // 1. Add real conversions
    for (const item of conversionsByOfferData) {
      conversionCountMap.set(
        item.offer_id,
        item._count?.id
      );
    }

    // 2. Add simulated conversions (even if no real ones exist)
    for (const [offer_id, simulated] of simulatedMap.entries()) {
      conversionCountMap.set(
        offer_id,
        (conversionCountMap.get(offer_id) || 0) + simulated
      );
    }

    // 3. Normalize for downstream logic
    const conversionsForRangeStats = Array.from(conversionCountMap.entries()).map(
      ([offer_id, count]) => ({
        offer_id,
        _count: { id: count },
      })
    );


    console.log('[DEBUG] conversionsForRangeStats map:', conversionsForRangeStats);

    const rangeStats = calculateShavedCount(conversionsForRangeStats);
    const totalConversionsForRange = startDate && endDate ? rangeStats.shaved : 0;

    console.log('[DEBUG] rangeStats map:', rangeStats);
    console.log('[DEBUG] totalConversionsForRange map:', totalConversionsForRange);


    // Sum earnings directly from the DB results
    const totalEarnings = conversionsStats.filter(s => s.metric === 'global').reduce((sum, s) => sum + (s.sum_commission || 0), 0);
    const commissionThisMonth = conversionsStats.filter(s => s.metric === 'this_month').reduce((sum, s) => sum + (s.sum_commission || 0), 0);
    const commissionPreviousMonth = conversionsStats.filter(s => s.metric === 'prev_month').reduce((sum, s) => sum + (s.sum_commission || 0), 0);

    // Calculate commission for selected date range (for Overview card)
    const commissionForRange = startDate && endDate
      ? Number(commissionsOverTimeResult.reduce((sum, row) => sum + Number(row.commission), 0))
      : commissionThisMonth;

    // Process calculated stats
    const globalConversionMap = new Map<number, number>();

    // real conversions
    for (const item of globalConversions) {
      globalConversionMap.set(
        item.offer_id,
        item._count.id
      );
    }

    // simulated conversions
    for (const [offer_id, simulated] of simulatedMap.entries()) {
      globalConversionMap.set(
        offer_id,
        (globalConversionMap.get(offer_id) || 0) + simulated
      );
    }

    const globalStats = calculateShavedCount(
      Array.from(globalConversionMap.entries()).map(
        ([offer_id, count]) => ({
          offer_id,
          _count: { id: count },
        })
      )
    );


    const thisMonthStats = calculateShavedCount(thisMonthConversions);
    const prevMonthStats = calculateShavedCount(prevMonthConversions);

    const conversionRate =
      uniqueClicks > 0
        ? Number(((globalStats.shaved / uniqueClicks) * 100).toFixed(2))
        : 0;


    // Fetch Offer Names for IDs
    const allOfferIds = new Set([
      ...conversionsByOfferData.map(d => d.offer_id)
    ]);

    const offers = await prisma.offer.findMany({
      where: { id: { in: Array.from(allOfferIds) } },
      select: { id: true, name: true },
    });
    const offerMap = new Map(offers.map(o => [o.id, o.name]));
    console.log('[DEBUG] global map:', globalStats.shaved);

    const dashboardData: DashboardData = {
      totalClicks: totalClicks, // Use date range filtered clicks for Overview card
      uniqueClicks: uniqueClicks,
      totalConversions: startDate && endDate ? totalConversionsForRange : globalStats.shaved, // Use date range filtered conversions for Overview card
      totalEarning: totalEarnings,
      clicksThisMonth,
      clicksPreviousMonth,
      salesThisMonth: thisMonthStats.shaved,
      salesPreviousMonth: prevMonthStats.shaved,
      conversionRate: conversionRate,
      commissionThisMonth: startDate && endDate ? commissionForRange : commissionThisMonth, // Use date range filtered commission for Overview card
      commissionPreviousMonth,
      weeklyClicks: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
        const found = weeklyClicksResult.find(r => r.day.trim() === day); // trim just in case of padding
        return { day, clicks: found ? Number(found.clicks) : 0 };
      }),
      trafficSources: trafficSourcesData
        .map(item => ({ name: item.geo || 'Unknown', value: item._count.id }))
        .sort((a, b) => b.value - a.value),
      clicksOverTime: clicksOverTimeResult.map(row => ({ period: row.period, clicks: Number(row.clicks) })),
      conversionTrend: conversionTrendResult.map(row => ({ period: row.period, conversions: Number(row.conversions) })),
      commissionsOverTime: commissionsOverTimeResult.map(row => ({ period: row.period, commission: Number(row.commission) })),
      conversionsByOffer: conversionsByOfferData
        .map(item => ({
          name: offerMap.get(item.offer_id) || 'Unknown',
          value: item._count.id + (simulatedMap.get(item.offer_id) || 0),
        }))
        .sort((a, b) => b.value - a.value),

      overviewClicks: {
        last24h: overviewClicksLast24h.map(r => ({ period: r.period, clicks: Number(r.clicks) })),
        last7d: overviewClicksLast7d.map(r => ({ period: r.period, clicks: Number(r.clicks) })),
        last30d: overviewClicksLast30d.map(r => ({ period: r.period, clicks: Number(r.clicks) })),
      },
      rawTotalConversions: globalStats.raw,
      conversionsDifference: globalStats.raw - globalStats.shaved,
      avgCommissionCut: globalStats.avgCut,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data.' }, { status: 500 });
  }
}
