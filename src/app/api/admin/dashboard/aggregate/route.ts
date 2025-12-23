import prisma from "@/lib/db-prisma";
import { NextResponse } from "next/server";

// Helper function to format date as day name
function getDayName(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

export async function GET() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch all stats in parallel
    const [
      totalClicks,
      totalConversions,
      totalEarningsData,
      totalApprovalsData,
      weeklyClicksData,
      trafficSourcesData,
      topPerformingOffersData,
    ] = await Promise.all([
      prisma.click.count(),
      prisma.conversion.count(),
      prisma.conversion.aggregate({
        _sum: { amount: true },
      }),
      prisma.conversion.count({
        where: { status: 'approved' },
      }),
      prisma.click.findMany({
        where: {
          timestamp: { gte: sevenDaysAgo },
        },
        select: { timestamp: true },
      }),
      prisma.click.findMany({
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

    // Process traffic sources (group by offer name)
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

    return NextResponse.json({
      totalClicks,
      totalConversions,
      totalEarnings: Number(totalEarningsData._sum.amount || 0),
      totalApprovals: totalApprovalsData,
      weeklyClicks,
      trafficSources,
      topPerformingOffers,
    });
  } catch (error) {
    console.error("Error fetching aggregated admin dashboard data:", error);
    return NextResponse.json({ error: "Failed to fetch aggregated admin dashboard data" }, { status: 500 });
  }
}
