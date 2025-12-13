import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db-prisma';
import { Prisma } from '@prisma/client';

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
    const searchParams = req.nextUrl.searchParams;
    const publisher_id = searchParams.get('publisher_id');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!publisher_id) {
      return NextResponse.json({ error: 'Missing publisher_id' }, { status: 400 });
    }

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
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const firstDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Build date filter for optional date range (using created_at for clicks, created_at for conversions)
    const clicksDateFilter = startDate && endDate
      ? {
          timestamp: {
            gte: new Date(startDate),
            lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000), // Add 1 day
          },
        }
      : {};
    
    const conversionsDateFilter = startDate && endDate
      ? {
          created_at: {
            gte: new Date(startDate),
            lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000), // Add 1 day
          },
        }
      : {};

    // Total Clicks
    const totalClicksWhere: Prisma.ClickWhereInput = {
      pub_id: publisher_id,
      ...(startDate && endDate ? clicksDateFilter : {}),
    };
    dashboardData.totalClicks = await prisma.click.count({
      where: totalClicksWhere,
    });

    // Total Conversions with commission calculation
    const conversions = await prisma.conversion.findMany({
      where: {
        pub_id: publisher_id,
        ...(startDate && endDate ? conversionsDateFilter : {}),
      },
      include: {
        offer: {
          include: {
            offerPublishers: {
              where: { publisher_id },
              select: { commission_cut: true },
            },
          },
        },
      },
    });

    dashboardData.rawTotalConversions = conversions.length;
    
    // Calculate average commission cut
    const commissionCuts = conversions
      .map((conv) => conv.offer.offerPublishers[0]?.commission_cut)
      .filter((cut): cut is number => cut !== null && cut !== undefined);
    
    dashboardData.avgCommissionCut = commissionCuts.length > 0
      ? commissionCuts.reduce((sum, cut) => sum + Number(cut), 0) / commissionCuts.length
      : 0;

    dashboardData.totalConversions = Math.round(
      dashboardData.rawTotalConversions * (1 - dashboardData.avgCommissionCut / 100)
    );
    dashboardData.conversionsDifference = dashboardData.rawTotalConversions - dashboardData.totalConversions;

    // Total Earnings (commission_amount from conversions)
    const totalEarningsResult = await prisma.conversion.aggregate({
      where: {
        pub_id: publisher_id,
        ...(startDate && endDate ? conversionsDateFilter : {}),
      },
      _sum: {
        commission_amount: true,
      },
    });
    dashboardData.totalEarning = Number(totalEarningsResult._sum.commission_amount || 0);

    // Clicks This Month
    dashboardData.clicksThisMonth = await prisma.click.count({
      where: {
        pub_id: publisher_id,
        timestamp: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
    });

    // Clicks Previous Month
    dashboardData.clicksPreviousMonth = await prisma.click.count({
      where: {
        pub_id: publisher_id,
        timestamp: {
          gte: firstDayOfPreviousMonth,
          lte: lastDayOfPreviousMonth,
        },
      },
    });

    // Sales This Month (with commission calculation)
    const salesThisMonthConversions = await prisma.conversion.findMany({
      where: {
        pub_id: publisher_id,
        created_at: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
      include: {
        offer: {
          include: {
            offerPublishers: {
              where: { publisher_id },
              select: { commission_cut: true },
            },
          },
        },
      },
    });

    const salesThisMonthCommissionCuts = salesThisMonthConversions
      .map((conv) => conv.offer.offerPublishers[0]?.commission_cut)
      .filter((cut): cut is number => cut !== null && cut !== undefined);
    
    const salesThisMonthCommission = salesThisMonthCommissionCuts.length > 0
      ? salesThisMonthCommissionCuts.reduce((sum, cut) => sum + Number(cut), 0) / salesThisMonthCommissionCuts.length
      : 0;
    
    dashboardData.salesThisMonth = Math.round(
      salesThisMonthConversions.length * (1 - salesThisMonthCommission / 100)
    );

    // Sales Previous Month
    const salesPreviousMonthConversions = await prisma.conversion.findMany({
      where: {
        pub_id: publisher_id,
        created_at: {
          gte: firstDayOfPreviousMonth,
          lte: lastDayOfPreviousMonth,
        },
      },
      include: {
        offer: {
          include: {
            offerPublishers: {
              where: { publisher_id },
              select: { commission_cut: true },
            },
          },
        },
      },
    });

    const salesPreviousMonthCommissionCuts = salesPreviousMonthConversions
      .map((conv) => conv.offer.offerPublishers[0]?.commission_cut)
      .filter((cut): cut is number => cut !== null && cut !== undefined);
    
    const salesPreviousMonthCommission = salesPreviousMonthCommissionCuts.length > 0
      ? salesPreviousMonthCommissionCuts.reduce((sum, cut) => sum + Number(cut), 0) / salesPreviousMonthCommissionCuts.length
      : 0;
    
    dashboardData.salesPreviousMonth = Math.round(
      salesPreviousMonthConversions.length * (1 - salesPreviousMonthCommission / 100)
    );

    // Commission This Month
    const commissionThisMonthResult = await prisma.conversion.aggregate({
      where: {
        pub_id: publisher_id,
        created_at: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
      _sum: {
        commission_amount: true,
      },
    });
    dashboardData.commissionThisMonth = Number(commissionThisMonthResult._sum.commission_amount || 0);

    // Commission Previous Month
    const commissionPreviousMonthResult = await prisma.conversion.aggregate({
      where: {
        pub_id: publisher_id,
        created_at: {
          gte: firstDayOfPreviousMonth,
          lte: lastDayOfPreviousMonth,
        },
      },
      _sum: {
        commission_amount: true,
      },
    });
    dashboardData.commissionPreviousMonth = Number(commissionPreviousMonthResult._sum.commission_amount || 0);

    // Weekly Clicks (Current Week: Monday to Today) - Using raw query for date formatting
    const weeklyClicksResult = await prisma.$queryRaw<Array<{ day: string; date: string; clicks: bigint }>>`
      SELECT 
        TO_CHAR(timestamp::date, 'Dy') AS day,
        TO_CHAR(timestamp::date, 'YYYY-MM-DD') AS date,
        COUNT(*)::bigint as clicks
      FROM clicks
      WHERE pub_id = ${publisher_id}::uuid
        AND timestamp::date >= date_trunc('week', CURRENT_DATE)
        AND timestamp::date <= CURRENT_DATE
      GROUP BY date, day
      ORDER BY date
    `;

    dashboardData.weeklyClicks = weeklyClicksResult.map((row) => ({
      day: row.day,
      clicks: Number(row.clicks),
    }));

    // Traffic Sources (Clicks by Offer Name)
    const trafficSourcesData = await prisma.click.groupBy({
      by: ['offer_id'],
      where: {
        pub_id: publisher_id,
        ...(startDate && endDate
          ? {
              timestamp: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }
          : {}),
      },
      _count: {
        id: true,
      },
    });

    const offerIds = trafficSourcesData.map((item) => item.offer_id);
    const offers = await prisma.offer.findMany({
      where: { id: { in: offerIds } },
      select: { id: true, name: true },
    });

    const offerMap = new Map(offers.map((o) => [o.id, o.name]));
    dashboardData.trafficSources = trafficSourcesData
      .map((item) => ({
        name: offerMap.get(item.offer_id) || 'Unknown',
        value: item._count.id,
      }))
      .sort((a, b) => b.value - a.value);

    // Clicks Over Time (Daily for This Month) - Using raw query for date formatting
    const clicksOverTimeResult = await prisma.$queryRaw<Array<{ period: string; clicks: bigint }>>`
      SELECT 
        TO_CHAR(timestamp, 'YYYY-MM-DD') as period, 
        COUNT(*)::bigint as clicks
      FROM clicks
      WHERE pub_id = ${publisher_id}::uuid
        AND timestamp BETWEEN ${firstDayOfMonth} AND ${lastDayOfMonth}
      GROUP BY TO_CHAR(timestamp, 'YYYY-MM-DD')
      ORDER BY TO_CHAR(timestamp, 'YYYY-MM-DD')
    `;

    dashboardData.clicksOverTime = clicksOverTimeResult.map((row) => ({
      period: row.period,
      clicks: Number(row.clicks),
    }));

    // Conversion Trend (Daily for This Month) - Using raw query for date formatting
    const conversionTrendResult = await prisma.$queryRaw<Array<{ period: string; conversions: bigint }>>`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as period, 
        COUNT(*)::bigint as conversions
      FROM conversions
      WHERE pub_id = ${publisher_id}::uuid
        AND created_at BETWEEN ${firstDayOfMonth} AND ${lastDayOfMonth}
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY TO_CHAR(created_at, 'YYYY-MM-DD')
    `;

    dashboardData.conversionTrend = conversionTrendResult.map((row) => ({
      period: row.period,
      conversions: Number(row.conversions),
    }));

    // Commissions Over Time (Daily for This Month) - Using raw query for date formatting
    const commissionsOverTimeResult = await prisma.$queryRaw<Array<{ period: string; commission: number }>>`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as period, 
        COALESCE(SUM(commission_amount), 0)::float as commission
      FROM conversions
      WHERE pub_id = ${publisher_id}::uuid
        AND created_at BETWEEN ${firstDayOfMonth} AND ${lastDayOfMonth}
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY TO_CHAR(created_at, 'YYYY-MM-DD')
    `;

    dashboardData.commissionsOverTime = commissionsOverTimeResult.map((row) => ({
      period: row.period,
      commission: Number(row.commission),
    }));

    // Conversions By Offer
    const conversionsByOfferData = await prisma.conversion.groupBy({
      by: ['offer_id'],
      where: {
        pub_id: publisher_id,
        ...(startDate && endDate
          ? {
              created_at: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }
          : {}),
      },
      _count: {
        id: true,
      },
    });

    const conversionOfferIds = conversionsByOfferData.map((item) => item.offer_id);
    const conversionOffers = await prisma.offer.findMany({
      where: { id: { in: conversionOfferIds } },
      select: { id: true, name: true },
    });

    const conversionOfferMap = new Map(conversionOffers.map((o) => [o.id, o.name]));
    dashboardData.conversionsByOffer = conversionsByOfferData
      .map((item) => ({
        name: conversionOfferMap.get(item.offer_id) || 'Unknown',
        value: item._count.id,
      }))
      .sort((a, b) => b.value - a.value);

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data.' }, { status: 500 });
  }
}
