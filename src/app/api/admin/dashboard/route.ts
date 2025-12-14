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

    // Fetch all stats in parallel
    const [
      totalClicks,
      totalConversions,
      totalEarningsData,
      totalApprovals,
      weeklyClicksData,
      trafficSourcesData,
      topPerformingOffersData,
      clicksOverTimeData,
      conversionTrendData,
    ] = await Promise.all([
      prisma.click.count(),
      prisma.conversion.count(),
      prisma.conversion.aggregate({
        _sum: { amount: true },
      }),
      prisma.publisher.count({
        where: { status: 'approved' },
      }),
      prisma.click.findMany({
        where: {
          timestamp: { gte: sevenDaysAgo },
        },
        select: { timestamp: true },
      }),
      prisma.click.findMany({
        where: {
          offer: { status: 'active' },
        },
        include: {
          offer: {
            select: { name: true },
          },
        },
      }),
      prisma.offer.findMany({
        include: {
          clicks: true,
          conversions: true,
        },
        take: 10,
      }),
      prisma.click.findMany({
        where: {
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
    ]);

    // Process weekly clicks by day
    const weeklyClicksMap = new Map<string, number>();
    weeklyClicksData.forEach((click) => {
      const day = getDayName(click.timestamp);
      weeklyClicksMap.set(day, (weeklyClicksMap.get(day) || 0) + 1);
    });
    const weeklyClicks = Array.from(weeklyClicksMap.entries())
      .map(([day, clicks]) => ({ day, clicks }))
      .sort((a, b) => {
        const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      });

    // Process traffic sources
    const trafficSourcesMap = new Map<string, number>();
    trafficSourcesData.forEach((click) => {
      const name = click.offer.name;
      trafficSourcesMap.set(name, (trafficSourcesMap.get(name) || 0) + 1);
    });
    const trafficSources = Array.from(trafficSourcesMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Process top performing offers
    const topPerformingOffers = topPerformingOffersData
      .map((offer) => {
        const clicks = offer.clicks.length;
        const conversions = offer.conversions.length;
        const revenue = offer.conversions.reduce((sum, c) => sum + Number(c.amount), 0);
        return {
          offerName: offer.name,
          clicks,
          conversions,
          revenue: revenue.toFixed(2),
        };
      })
      .sort((a, b) => {
        if (Number(b.revenue) !== Number(a.revenue)) {
          return Number(b.revenue) - Number(a.revenue);
        }
        if (b.conversions !== a.conversions) {
          return b.conversions - a.conversions;
        }
        return b.clicks - a.clicks;
      })
      .slice(0, 10);

    // Process clicks over time
    const clicksOverTimeMap = new Map<string, number>();
    clicksOverTimeData.forEach((click) => {
      const period = formatDate(click.timestamp);
      clicksOverTimeMap.set(period, (clicksOverTimeMap.get(period) || 0) + 1);
    });
    const clicksOverTime = Array.from(clicksOverTimeMap.entries())
      .map(([period, clicks]) => ({ period, clicks }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Process conversion trend
    const conversionTrendMap = new Map<string, number>();
    conversionTrendData.forEach((conv) => {
      const period = formatDate(conv.created_at);
      conversionTrendMap.set(period, (conversionTrendMap.get(period) || 0) + 1);
    });
    const conversionTrend = Array.from(conversionTrendMap.entries())
      .map(([period, conversions]) => ({ period, conversions }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return NextResponse.json({
      totalClicks,
      totalConversions,
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
    return NextResponse.json({ error: "Failed to fetch admin dashboard data" }, { status: 500 });
  }
}
