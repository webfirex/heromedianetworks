import prisma from "@/lib/db-prisma";
import { NextResponse } from "next/server";

// Helper function to format date as day name
function getDayName(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function GET() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    /* ----------------------------------------
       Commission cut setup
    ----------------------------------------- */
    const offerPublishers = await prisma.offerPublisher.findMany({
      select: { offer_id: true, commission_cut: true },
    });

    const cutMap = new Map(
      offerPublishers.map(op => [op.offer_id, Number(op.commission_cut || 0)])
    );

    const calculateShavedCount = (
      offerCounts: { offer_id: number; _count: { id: number } }[]
    ) => {
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
        avgCut: rawTotal > 0 ? weightedCutSum / rawTotal : 0,
      };
    };

    /* ----------------------------------------
       FETCH ALL STATS (UPDATED)
    ----------------------------------------- */
    const [
      totalClicks,
      uniqueClicks,
      totalConversions,
      totalEarningsData,
      totalApprovals,
      weeklyClicksData,
      trafficSourcesData,
      topPerformingOffersData,
      clicksOverTimeData,
      conversionTrendData,
      globalConversionsData,
    ] = await Promise.all([
      prisma.click.count(),

      prisma.click.count({ 
        where: { is_unique: true },
      }),

      prisma.conversion.count(),

      prisma.conversion.aggregate({
        _sum: { amount: true },
      }),

      prisma.publisher.count({
        where: { status: 'approved' },
      }),

      prisma.click.findMany({
        where: {
          is_unique: true,
          timestamp: { gte: sevenDaysAgo },
        },
        select: { timestamp: true },
      }),

      prisma.click.findMany({
        where: {
          is_unique: true,
          offer: { status: 'active' },
        },
        include: {
          offer: { select: { name: true } },
        },
      }),

      prisma.offer.findMany({
        include: {
          clicks: {
            where: { is_unique: true },
          },
          conversions: true,
        },
        take: 10,
      }),

      prisma.click.findMany({
        where: {
          is_unique: true,
          timestamp: { gte: thirtyDaysAgo },
        },
        select: { timestamp: true },
      }),

      prisma.conversion.findMany({
        where: {
          created_at: { gte: thirtyDaysAgo },
        },
        select: { created_at: true },
      }),

      prisma.conversion.groupBy({
        by: ['offer_id'],
        _count: { id: true },
      }),
    ]);

    /* ----------------------------------------
       Weekly clicks
    ----------------------------------------- */
    const weeklyClicksMap = new Map<string, number>();
    weeklyClicksData.forEach(click => {
      const day = getDayName(click.timestamp);
      weeklyClicksMap.set(day, (weeklyClicksMap.get(day) || 0) + 1);
    });

    const weeklyClicks = Array.from(weeklyClicksMap.entries())
      .map(([day, clicks]) => ({ day, clicks }))
      .sort((a, b) => {
        const order = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return order.indexOf(a.day) - order.indexOf(b.day);
      });

    /* ----------------------------------------
       Traffic sources
    ----------------------------------------- */
    const trafficSourcesMap = new Map<string, number>();
    trafficSourcesData.forEach(click => {
      const name = click.offer.name;
      trafficSourcesMap.set(name, (trafficSourcesMap.get(name) || 0) + 1);
    });

    const trafficSources = Array.from(trafficSourcesMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    /* ----------------------------------------
       Top performing offers
    ----------------------------------------- */
    const topPerformingOffers = topPerformingOffersData
      .map(offer => {
        const clicks = offer.clicks.length;
        const conversions = offer.conversions.length;
        const revenue = offer.conversions.reduce(
          (sum, c) => sum + Number(c.amount),
          0
        );

        return {
          offerName: offer.name,
          clicks,
          conversions,
          revenue: revenue.toFixed(2),
        };
      })
      .sort((a, b) =>
        Number(b.revenue) - Number(a.revenue) ||
        b.conversions - a.conversions ||
        b.clicks - a.clicks
      )
      .slice(0, 10);

    /* ----------------------------------------
       Clicks over time
    ----------------------------------------- */
    const clicksOverTimeMap = new Map<string, number>();
    clicksOverTimeData.forEach(click => {
      const period = formatDate(click.timestamp);
      clicksOverTimeMap.set(period, (clicksOverTimeMap.get(period) || 0) + 1);
    });

    const clicksOverTime = Array.from(clicksOverTimeMap.entries())
      .map(([period, clicks]) => ({ period, clicks }))
      .sort((a, b) => a.period.localeCompare(b.period));

    /* ----------------------------------------
       Conversion trend
    ----------------------------------------- */
    const conversionTrendMap = new Map<string, number>();
    conversionTrendData.forEach(conv => {
      const period = formatDate(conv.created_at);
      conversionTrendMap.set(period, (conversionTrendMap.get(period) || 0) + 1);
    });

    const conversionTrend = Array.from(conversionTrendMap.entries())
      .map(([period, conversions]) => ({ period, conversions }))
      .sort((a, b) => a.period.localeCompare(b.period));

    /* ----------------------------------------
       Commission cut analytics
    ----------------------------------------- */
    const globalStats = calculateShavedCount(globalConversionsData);

    /* ----------------------------------------
       RESPONSE (UPDATED)
    ----------------------------------------- */
    return NextResponse.json({
      totalClicks,
      uniqueClicks,
      duplicateClicks: totalClicks - uniqueClicks,
      totalConversions: globalStats.shaved,
      rawTotalConversions: globalStats.raw,
      conversionsDifference: globalStats.raw - globalStats.shaved,
      avgCommissionCut: globalStats.avgCut,
      totalEarnings: Number(totalEarningsData._sum.amount || 0),
      totalApprovals,
      weeklyClicks,
      trafficSources,
      clicksOverTime,
      conversionTrend,
      topPerformingOffers,
    });

  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin dashboard data" },
      { status: 500 }
    );
  }
}
