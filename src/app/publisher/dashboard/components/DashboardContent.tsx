"use client"
import React, { useEffect, useState } from 'react';
import { Card, SimpleGrid, Grid, Box, Title, Text, Group, Stack, Badge, Flex, SemiCircleProgress, Button, Loader, Avatar } from '@mantine/core';
import { IconLayoutDashboard, IconCircleCheck, IconCurrencyDollar, IconArrowRight, IconInfoCircle, IconChevronDown, IconHelpCircle, IconDotsVertical } from '@tabler/icons-react';
import { BarChart, PieChart, LineChart, AreaChart } from '@mantine/charts';
import { Skeleton } from '@mantine/core';
import { showNotification } from '@/app/utils/notificationManager';
import { useSession } from 'next-auth/react';
import NeoCard from '@/components/ui/flip-card';
import { cn } from '@/lib/utils';

interface DashboardContentProps {
  dateRange: [Date | null, Date | null];
}

type WeeklyClick = { day: string; clicks: number };
type TrafficSource = { name: string; value: number; color?: string };
type ClicksOverTime = { period: string; clicks: number };
type ConversionTrend = { period?: string; week?: string; conversions: number };
type CommissionOverTime = { period: string; commission: number };
type ConversionByOffer = { name: string; value: number; color?: string };

const tooltipStyles = {
  background: 'linear-gradient(135deg, #0B0F16 0%, #141C2A 100%)',
  boxShadow: '0 12px 32px rgba(0,0,0,0.6), inset 0 1px rgba(255,255,255,0.04)',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#E6EAF0',
  padding: '12px',
  fontSize: '14px',
  backdropFilter: 'blur(8px)',
};

// Helper function to format numbers for tooltips
const formatNumber = (value: number, isCurrency: boolean = false) => {
  return isCurrency
    ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : value.toLocaleString();
};

// Helper function to calculate percentage of target
const getPercentageOfTarget = (value: number, target: number) => {
  return target > 0 ? ((value / target) * 100).toFixed(1) : '0.0';
};

// Helper function to format dates for chart display (YYYY-MM-DD -> MMM D)
const formatChartDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  } catch {
    return dateStr;
  }
};

const CLICK_MONTHLY_TARGET = 50;
const SALES_MONTHLY_TARGET = 10;
const COMMISSION_MONTHLY_TARGET = 500;
const primary = '#3B82F6';
const chartColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899',
];
// Define dummy data structures
const emptyConversionTrend = [{ period: 'Week 1', conversions: 0 }];
const emptyClicksOverTime = [{ period: 'Week 1', clicks: 0 }];
const emptyCommissions = [{ period: 'Week 1', commission: 0 }];
const emptyPie = [{ name: 'No Data', value: 1, color: 'rgba(255,255,255,0.1)' }];
const emptyBarData = [{ day: 'Mon', clicks: 0 }];
const emptyPieData = [{ name: 'No Data', value: 1, color: 'rgba(255,255,255,0.1)' }];

export default function DashboardContent({ dateRange }: DashboardContentProps) {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<{
    totalClicks: number;
    totalConversions: number;
    totalEarning: number;
    clicksThisMonth: number;
    clicksPreviousMonth: number;
    salesThisMonth: number;
    salesPreviousMonth: number;
    commissionThisMonth: number;
    commissionPreviousMonth: number;
    weeklyClicks: WeeklyClick[];
    trafficSources: TrafficSource[];
    clicksOverTime: ClicksOverTime[];
    conversionTrend: ConversionTrend[];
    commissionsOverTime: CommissionOverTime[];
    conversionsByOffer: ConversionByOffer[];
  }>({
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
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overviewTab, setOverviewTab] = useState<'24h' | 'Week' | 'Month'>('Month');

  const formatApiDate = (date: Date | null): string | null => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getColorForSegment = (name: string, index: number, palette: string[]) => {
    switch (name) {
      case 'Organic': return '#4CAF50';
      case 'Social': return '#2196F3';
      case 'Paid': return '#FF9800';
      case 'Direct': return '#9C27B0';
      case 'Referral': return '#F44336';
      default: return palette[index % palette.length];
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        let publisher_id = session?.user?.id;
        if (!publisher_id && session?.user?.email) {
          const res = await fetch(`/api/publisher/id?email=${encodeURIComponent(session.user.email)}`);
          if (res.ok) {
            const data = await res.json();
            publisher_id = data.id;
          }
        }
        if (!publisher_id) {
          setError('You must be logged in as a publisher to view dashboard data.');
          setLoading(false);
          return;
        }

        const startDate = dateRange[0] ? formatApiDate(dateRange[0]) : null;
        const endDate = dateRange[1] ? formatApiDate(dateRange[1]) : null;
        const params = new URLSearchParams();
        params.append('publisher_id', publisher_id);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const url = `/api/dashboard?${params.toString()}`;
        const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        const processWeeklyClicks = (apiWeeklyClicks: WeeklyClick[]): WeeklyClick[] => {
          const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const structuredData: { [key: string]: number } = {};
          apiWeeklyClicks.forEach(item => { structuredData[item.day] = item.clicks; });
          return daysOfWeek.map(day => ({ day, clicks: structuredData[day] || 0 }));
        };
        const defaultData = {
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
          ...data
        };
        defaultData.weeklyClicks = processWeeklyClicks(defaultData.weeklyClicks);
        // Format clicksOverTime dates for chart display
        if (defaultData.clicksOverTime && defaultData.clicksOverTime.length > 0) {
          defaultData.clicksOverTime = defaultData.clicksOverTime.map((item: ClicksOverTime) => ({
            ...item,
            period: formatChartDate(item.period)
          }));
        }
        setDashboardData(defaultData);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load dashboard data. Please try again.';
        setError(msg);
        showNotification({
          title: '⚠️ Error',
          message: msg,
          withClose: false
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [dateRange, session]);

  const clicksPercentageChange = CLICK_MONTHLY_TARGET > 0
    ? ((dashboardData.clicksThisMonth / CLICK_MONTHLY_TARGET) * 100).toFixed(2)
    : '0.00';
  const isClicksPositive = parseFloat(clicksPercentageChange) > 0;
  const clicksTrendColor = isClicksPositive ? 'green' : 'red';

  const salesPercentageChange = SALES_MONTHLY_TARGET > 0
    ? ((dashboardData.salesThisMonth / SALES_MONTHLY_TARGET) * 100).toFixed(2)
    : '0.00';
  const isSalesPositive = parseFloat(salesPercentageChange) > 0;
  const salesTrendColor = isSalesPositive ? 'green' : 'red';

  const commissionPercentageChange = COMMISSION_MONTHLY_TARGET > 0
    ? ((dashboardData.commissionThisMonth / COMMISSION_MONTHLY_TARGET) * 100).toFixed(2)
    : '0.00';
  const isCommissionPositive = parseFloat(commissionPercentageChange) > 0;
  const commissionTrendColor = isCommissionPositive ? 'green' : 'red';

  return (
    <Box p="0.5rem">
      {loading ? (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xs" mb="sm">
            {[...Array(3)].map((_, i) => (
              <Card
                key={i}
                shadow="sm"
                radius="xl"
                withBorder={false}
                p="md"
                style={{
                  background: 'rgba(10, 10, 12, 0.5)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <Skeleton height="2rem" width="60%" mb="xs" />
                <Skeleton height="1.5rem" width="40%" />
              </Card>
            ))}
          </SimpleGrid>
          <Grid gutter="xs" mb="sm">
            {[...Array(3)].map((_, i) => (
              <Grid.Col key={i} span={{ base: 12, sm: 6, lg: 4 }}>
                <Card
                  shadow="sm"
                  radius="xl"
                  withBorder={false}
                  p="md"
                  style={{
                    background: 'rgba(10, 10, 12, 0.5)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <Skeleton height="2rem" width="60%" mb="xs" />
                  <Skeleton height="8rem" width="100%" />
                </Card>
              </Grid.Col>
            ))}
          </Grid>
          <Box
            py="sm"
            px="md"
            mb="sm"
            style={{
              background: 'rgba(10, 10, 12, 0.5)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '1.3rem'
            }}
          >
            <Skeleton height="1.75rem" width="30%" mb="xs" />
            <Skeleton height="2.5rem" width="100%" />
          </Box>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xs">
            {[...Array(7)].map((_, i) => (
              <Card
                key={i}
                shadow="sm"
                radius="xl"
                withBorder={false}
                p="md"
                style={{
                  background: 'rgba(10, 10, 12, 0.5)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <Skeleton height="1.75rem" width="40%" mb="xs" />
                <Skeleton height="12rem" width="100%" />
              </Card>
            ))}
          </SimpleGrid>
        </>
      ) : error ? null : (
        <>
          <Grid gutter="md" mb="xl">
            {/* Left Column (Span 4) */}
            <Grid.Col span={4}>
              <div className="flex flex-col gap-6 h-full">
                {/* Card 1: Overview (My Campaigns) */}
                <div className="flex flex-col h-full">
                  {/* External Header */}
                  <div className="mb-4 pl-1">
                    <div className="flex justify-between items-center mb-1">
                      <h2 className="text-lg font-bold text-white">My Campaigns</h2>
                      <Badge
                        variant="filled"
                        color="dark"
                        radius="md"
                        size="lg"
                        className="bg-zinc-800 text-zinc-300 pr-2 cursor-pointer hover:bg-zinc-700 transition"
                        rightSection={<IconChevronDown size={14} />}
                      >
                        Finance
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500">
                      3 persons and <span className="text-zinc-400">@yerimaldo</span> have access.
                    </p>
                  </div>

                  <NeoCard
                    variant="glass"
                    className="w-full min-h-[520px] backdrop-blur-xl border border-white/20 active:scale-[0.99] transition-transform duration-300 relative overflow-hidden"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {/* Ambient Glows */}
                    <div className="absolute top-0 left-0 w-72 h-72 bg-white/20 blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/30 blur-[140px] rounded-full pointer-events-none" />

                    <div className="flex flex-col h-full p-6 relative z-10">
                      {/* Card Internal Header */}
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="text-lg font-medium text-white">Overview</h3>
                        <IconInfoCircle size={18} className="text-zinc-500 cursor-pointer hover:text-zinc-300" />
                      </div>

                      {/* Stats Rows */}
                      <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Max records</span>
                          <span className="text-zinc-200">2 times increase to the last month</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Comparative rates</span>
                          <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${isClicksPositive ? 'text-blue-400 bg-blue-500/10' : 'text-red-400 bg-red-500/10'}`}>
                            {Number(clicksPercentageChange) > 0 ? '+' : ''} {clicksPercentageChange}%
                          </span>
                        </div>
                      </div>

                      {/* Tabs */}
                      <div className="bg-[#131416]/50 rounded-xl p-1.5 grid grid-cols-3 gap-1 mb-8 border border-white/5">
                        {['24h', 'Week', 'Month'].map((tab) => (
                          <div
                            key={tab}
                            onClick={() => setOverviewTab(tab as any)}
                            className={`text-center py-2 text-xs cursor-pointer rounded-lg transition font-medium ${overviewTab === tab
                              ? 'text-white bg-[#2C2D31] shadow-md border border-white/10'
                              : 'text-zinc-400 hover:text-white hover:bg-white/5'
                              }`}
                          >
                            {tab}
                          </div>
                        ))}
                      </div>

                      {/* Chart Area */}
                      <div className="flex-1 w-full min-h-[140px] relative">
                        <style jsx>{`
                          :global(.mantine-AreaChart-root) {
                            background: transparent !important;
                          }
                          :global(.recharts-surface) {
                            background: transparent !important;
                          }
                          :global(.recharts-wrapper) {
                            background: transparent !important;
                          }
                          :global(.recharts-area) {
                            opacity: 1 !important;
                          }
                          :global(.recharts-area-area) {
                            fill: url(#blueGradient) !important;
                            opacity: 0.4 !important;
                          }
                          :global(.recharts-area-curve),
                          :global(.recharts-line-curve),
                          :global(path[name="clicks"]) {
                            stroke: #3B82F6 !important;
                            stroke-width: 4px !important;
                            opacity: 1 !important;
                            fill: none !important;
                          }
                        `}</style>
                        <AreaChart
                          h={150}
                          data={
                            overviewTab === 'Month' ? dashboardData.clicksOverTime :
                              overviewTab === 'Week' ? dashboardData.clicksOverTime.slice(-7) :
                                dashboardData.clicksOverTime.slice(-24)
                          }
                          dataKey="period"
                          series={[{ name: 'clicks', color: '#3B82F6' }]}
                          curveType="monotone"
                          withXAxis={true}
                          withYAxis={false}
                          gridAxis="none"
                          withDots={false}
                          strokeWidth={3.5}
                          fillOpacity={0.4}
                          textColor="#9CA3AF"
                          xAxisProps={{
                            tick: { fill: '#9CA3AF', fontSize: 11 },
                            tickLine: { stroke: '#374151' },
                            axisLine: { stroke: '#374151' }
                          }}
                          tooltipProps={{
                            content: ({ payload }) => {
                              if (!payload || !payload[0]) return null;
                              const { period, clicks } = payload[0].payload;
                              // Calculate simple % change from previous point if possible, else nice text
                              const prevIndex = dashboardData.clicksOverTime.findIndex(p => p.period === period) - 1;
                              const prevValue = prevIndex >= 0 ? dashboardData.clicksOverTime[prevIndex].clicks : clicks;
                              const change = prevValue > 0 ? ((clicks - prevValue) / prevValue * 100).toFixed(2) : "0.00";
                              const isUp = Number(change) >= 0;

                              return (
                                <div className="bg-[#121420]/95 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[100px]">
                                  <div className="flex flex-col gap-0.5">
                                    <div className="text-[10px] text-zinc-400 mb-1">{period}</div>
                                    <div className="text-sm font-bold text-white tracking-tight">{formatNumber(clicks)}</div>
                                    <div className={`text-[10px] font-bold mt-1 ${isUp ? 'text-blue-400' : 'text-red-400'}`}>
                                      {isUp ? '+' : ''} {change} %
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          }}
                        />
                        <svg width="0" height="0">
                          <defs>
                            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>

                      {/* Footer Stats */}
                      <div className="mt-6 flex justify-between items-end">
                        <div className="flex items-center gap-1">
                          <div className={`text-3xl font-bold mb-1 ${isClicksPositive ? 'text-blue-500' : 'text-red-500'}`}>{isClicksPositive ? '+' : '-'}</div>
                          <div className="text-4xl font-bold text-white tracking-tight">{Math.abs(Number(clicksPercentageChange))}<span className="text-2xl text-white ml-1">%</span></div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-zinc-600">Last updated</div>
                          <div className="text-[11px] font-medium text-zinc-400">
                            Today, {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </NeoCard>
                </div>

                {/* My Top Campaigns (New Mock) */}
                <NeoCard variant="glass" className="flex-1 min-h-[280px] backdrop-blur-xl border border-white/20 p-6" style={{ background: 'rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)' }}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-white">My Top Campaigns</h3>
                    <div className="flex items-center gap-2 text-zinc-500">
                      <span className="text-[10px]">{Math.min(2, dashboardData.conversionsByOffer.length)} of {dashboardData.conversionsByOffer.length}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {dashboardData.conversionsByOffer.slice(0, 2).map((offer, index) => (
                      <div key={index} className="flex-1 bg-[#151518]/80 rounded-xl p-3 border border-white/5 relative overflow-hidden group hover:border-white/10 transition">
                        <div className="flex justify-between items-start mb-2">
                          <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px]`} style={{ backgroundColor: getColorForSegment(offer.name, index, chartColors), boxShadow: `0 0 8px ${getColorForSegment(offer.name, index, chartColors)}` }}></div>
                          <IconDotsVertical size={12} className="text-zinc-600 cursor-pointer" />
                        </div>
                        <h4 className="text-xs font-bold text-white mb-1 truncate" title={offer.name}>{offer.name}</h4>
                        <div className="text-[10px] text-zinc-500 mb-2">Conversions: {offer.value}</div>
                        <div className="text-[10px] text-blue-400 font-bold mb-3">&nbsp;</div> {/* Spacer */}
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-zinc-600">Verified</span>
                        </div>
                      </div>
                    ))}
                    {dashboardData.conversionsByOffer.length === 0 && (
                      <div className="w-full text-center text-zinc-500 text-xs py-8">No campaigns yet.</div>
                    )}
                  </div>
                </NeoCard>
              </div>
            </Grid.Col>

            {/* Right Column (Span 8) */}
            <Grid.Col span={8}>
              <div className="flex flex-col gap-6 h-full">
                {/* Row 1: Balance (Full Width now that Ads is gone) */}
                <div className="grid grid-cols-12 gap-6">
                  {/* Total Balance */}
                  <div className="col-span-12">
                    <div className="flex flex-col h-full">
                      {/* External Header */}
                      <div className="mb-4 pl-1">
                        <div className="flex justify-between items-center mb-1">
                          <h2 className="text-lg font-bold text-white">Total Balance</h2>
                          <Badge
                            variant="filled"
                            color="dark"
                            radius="md"
                            size="lg"
                            className="bg-zinc-800 text-zinc-300 pr-2 cursor-pointer hover:bg-zinc-700 transition"
                            rightSection={<IconChevronDown size={14} />}
                          >
                            US Dollar
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-500">
                          The sum of filtered commissions.
                        </p>
                      </div>

                      <NeoCard
                        variant="glass"
                        className="flex-1 min-h-[384px] backdrop-blur-xl border border-white/20 overflow-hidden flex flex-col active:scale-[0.99] transition-transform duration-300"
                        style={{ background: 'rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)' }}
                      >
                        <div className="p-6 relative z-10 flex flex-col h-full">
                          {/* Top Stats */}
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center">
                              <span className="text-blue-500 text-3xl mr-1 font-light">$</span>
                              <span className="text-4xl font-bold text-white tracking-tight">
                                {dashboardData.totalEarning.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] text-zinc-400 mb-1">vs last month</div>
                              <div className={`text-xs font-bold px-1.5 py-0.5 rounded inline-block ${isCommissionPositive ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                                {isCommissionPositive ? '+' : ''} {commissionPercentageChange} %
                              </div>
                            </div>
                          </div>

                          {/* Sub Stats Row */}
                          <div className="flex justify-between items-center mb-6">
                            <div className="text-[11px] text-zinc-400 flex items-center">
                              This month: <span className="text-white ml-1 font-medium">$ {dashboardData.commissionThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>

                          {/* Chart Area for Balance/Commissions */}
                          <div className="flex-1 w-full min-h-[140px] relative mt-4">
                            <AreaChart
                              h={200}
                              data={dashboardData.commissionsOverTime.length > 0 ? dashboardData.commissionsOverTime : emptyCommissions}
                              dataKey="period"
                              series={[{ name: 'commission', color: '#42A5F5' }]}
                              curveType="monotone"
                              withXAxis={true}
                              withYAxis={false}
                              gridAxis="none"
                              withDots={false}
                              strokeWidth={3}
                              fillOpacity={0.2}
                              tooltipProps={{
                                content: ({ payload }) => {
                                  if (!payload || !payload[0]) return null;
                                  const { period, commission } = payload[0].payload;
                                  return (
                                    <Box style={tooltipStyles}>
                                      <Text fw={600} style={{ color: '#fff' }}>{period}</Text>
                                      <Text style={{ color: '#fff' }}>Commission: ${formatNumber(commission, true)}</Text>
                                    </Box>
                                  );
                                }
                              }}
                            />
                          </div>
                        </div>
                      </NeoCard>
                    </div>
                  </div>
                </div>

                {/* Row 2: Popular Campaigns */}
                <div className="flex-1">
                  <NeoCard
                    variant="glass"
                    className="w-full p-0 backdrop-blur-xl border border-white/20 overflow-hidden flex-1"
                    style={{ background: 'rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)' }}
                  >
                    {/* Header */}
                    <div className="px-6 py-5 flex justify-between items-center border-b border-white/5">
                      <h3 className="text-lg font-bold text-white">Popular Campaigns (Top Traffic)</h3>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-[11px] text-zinc-500 font-medium uppercase tracking-wider bg-[#0A0A0C]/30">
                      <div className="col-span-1">Rank</div>
                      <div className="col-span-7">Offer Name</div>
                      <div className="col-span-4 text-right">Clicks</div>
                    </div>

                    {/* Table Body */}
                    <div className="p-2">
                      {dashboardData.trafficSources.length > 0 ? (
                        dashboardData.trafficSources.slice(0, 5).map((item, i) => (
                          <div key={i} className="grid grid-cols-12 gap-4 px-4 py-4 items-center bg-blue-950/20 hover:bg-blue-900/30 transition rounded-lg my-0.5 group border border-blue-900/10">
                            <div className="col-span-1 text-zinc-500 font-mono text-sm pl-1">#{i + 1}</div>
                            <div className="col-span-7 text-white font-medium text-sm truncate">{item.name}</div>
                            <div className="col-span-4 text-white text-sm font-bold text-right">{item.value.toLocaleString()}</div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-zinc-500 text-sm">No traffic data available for this period.</div>
                      )}
                    </div>
                  </NeoCard>
                </div>
              </div>
            </Grid.Col>
          </Grid>

          {/* Remaining Charts (Moved to bottom) */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xs">
            {/* Clicks Over Time Note: Duplicate chart? The overview already has it. I'll include it if it was separate, but it seems redundant. I'll include it to be safe, but visually it might be clutter. I'll include 'Clicks Over Time' (LineChart one), 'Conversion Trend', 'Commissions', 'Conversions By Offer' */}

            <NeoCard
              variant="glass"
              className="p-6 backdrop-blur-xl border border-white/20"
              style={{ background: 'rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)' }}
            >
              <Title
                order={4}
                style={{
                  color: '#E6EAF0',
                  fontWeight: 500,
                  fontSize: 'clamp(1rem, 3vw, 1.125rem)',
                  marginBottom: '12px'
                }}
                mb="sm"
              >
                Clicks Over Time (Line)
                <Text
                  size="xs"
                  style={{
                    display: 'block',
                    marginTop: '4px',
                    color: '#3B82F6',
                    fontWeight: 600
                  }}
                >
                  ▲ 12% (vs. previous month)
                </Text>
              </Title>
              <LineChart
                h="clamp(12rem, 40vw, 16rem)"
                data={dashboardData.clicksOverTime.length > 0 ? dashboardData.clicksOverTime : emptyClicksOverTime}
                dataKey="period"
                series={[{ name: 'clicks', color: primary }]}
                curveType="monotone"
                withTooltip
                referenceLines={[
                  { values: (CLICK_MONTHLY_TARGET / 4).toString(), label: 'Monthly Avg Target', color: '#ef4444', strokeDasharray: '4 4' },
                ]}
                tooltipProps={{
                  content: ({ payload }) => {
                    if (!payload || !payload[0]) return null;
                    const { period, clicks } = payload[0].payload;
                    const weeklyAvgTarget = CLICK_MONTHLY_TARGET / 4;
                    const targetProgress = getPercentageOfTarget(clicks, weeklyAvgTarget);
                    return (
                      <Box style={tooltipStyles}>
                        <Text fw={600} size="sm" style={{ color: '#fff' }}>{period}</Text>
                        <Text mt="xs" style={{ color: '#fff' }}>Total Clicks: <span style={{ fontWeight: 700 }}>{formatNumber(clicks)}</span></Text>
                        <Text style={{ color: '#fff' }}>Target Progress: <span style={{ color: Number(targetProgress) >= 100 ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>{targetProgress}%</span> of weekly avg target</Text>
                      </Box>
                    );
                  },
                }}
              />
            </NeoCard>
            <NeoCard
              variant="glass"
              className="p-6 backdrop-blur-xl border border-white/10"
              style={{ background: 'rgba(255, 255, 255, 0.02)' }}
            >
              <Title
                order={4}
                style={{
                  color: '#E6EAF0',
                  fontWeight: 500,
                  fontSize: 'clamp(1rem, 3vw, 1.125rem)',
                  marginBottom: '12px'
                }}
                mb="sm"
              >
                Conversion Trend
              </Title>
              <AreaChart
                h="clamp(12rem, 40vw, 16rem)"
                data={dashboardData.conversionTrend.length > 0 ? dashboardData.conversionTrend : emptyConversionTrend}
                dataKey="period"
                series={[{ name: 'conversions', color: '#66BB6A' }]}
                curveType="monotone"
                withTooltip
                tooltipProps={{
                  content: ({ payload }) => {
                    if (!payload || !payload[0]) return null;
                    const { period, conversions } = payload[0].payload;
                    return (
                      <Box style={tooltipStyles}>
                        <Text fw={600} style={{ color: '#fff' }}>{period}</Text>
                        <Text style={{ color: '#fff' }}>Conversions: {formatNumber(conversions)}</Text>
                        <Text style={{ color: '#fff' }}>Target Progress: {getPercentageOfTarget(conversions, SALES_MONTHLY_TARGET / 4)}% of weekly avg target</Text>
                      </Box>
                    );
                  },
                }}
              />
            </NeoCard>
            <NeoCard
              variant="glass"
              className="p-6 backdrop-blur-xl border border-white/10"
              style={{ background: 'rgba(255, 255, 255, 0.02)' }}
            >
              <Title
                order={4}
                style={{
                  color: '#E6EAF0',
                  fontWeight: 500,
                  fontSize: 'clamp(1rem, 3vw, 1.125rem)',
                  marginBottom: '12px'
                }}
                mb="sm"
              >
                Commissions
              </Title>
              <LineChart
                h="clamp(12rem, 40vw, 16rem)"
                data={dashboardData.commissionsOverTime.length > 0 ? dashboardData.commissionsOverTime : emptyCommissions}
                dataKey="period"
                series={[{ name: 'commission', color: '#42A5F5' }]}
                curveType="monotone"
                withTooltip
                tooltipProps={{
                  content: ({ payload }) => {
                    if (!payload || !payload[0]) return null;
                    const { period, commission } = payload[0].payload;
                    return (
                      <Box style={tooltipStyles}>
                        <Text fw={600} style={{ color: '#fff' }}>{period}</Text>
                        <Text style={{ color: '#fff' }}>Commission: ₹{formatNumber(commission, true)}</Text>
                        <Text style={{ color: '#fff' }}>Target Progress: {getPercentageOfTarget(commission, COMMISSION_MONTHLY_TARGET / 4)}% of weekly avg target</Text>
                      </Box>
                    );
                  },
                }}
              />
            </NeoCard>
            <NeoCard
              variant="glass"
              className="p-6 backdrop-blur-xl border border-white/10"
              style={{ background: 'rgba(255, 255, 255, 0.02)' }}
            >
              <Title
                order={4}
                style={{
                  color: '#E6EAF0',
                  fontWeight: 500,
                  fontSize: 'clamp(1rem, 3vw, 1.125rem)',
                  marginBottom: '12px'
                }}
                mb="sm"
              >
                Conversions By Offer
              </Title>
              <PieChart
                h="clamp(12rem, 40vw, 16rem)"
                data={
                  dashboardData.conversionsByOffer.length > 0
                    ? dashboardData.conversionsByOffer.map((offer, index) => ({
                      ...offer,
                      color: getColorForSegment(offer.name, index, chartColors),
                    }))
                    : emptyPie
                }
                withTooltip
                tooltipProps={{
                  content: ({ payload }) => {
                    if (!payload || !payload[0]) return null;
                    const { name, value } = payload[0].payload;
                    const total = dashboardData.conversionsByOffer.reduce((sum, off) => sum + off.value, 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                    return (
                      <Box style={tooltipStyles}>
                        <Text fw={600} style={{ color: '#fff' }}>{name}</Text>
                        <Text style={{ color: '#fff' }}>Conversions: {formatNumber(value)}</Text>
                        <Text style={{ color: '#fff' }}>Share: {percentage}%</Text>
                      </Box>
                    );
                  },
                }}
              />
              {dashboardData.conversionsByOffer.length > 0 && (
                <Box mt={8} style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Group gap={8} style={{ flexWrap: 'wrap' }}>
                    {dashboardData.conversionsByOffer.map((offer, idx) => (
                      <Group key={offer.name || 'Unknown'} gap={4} align="center">
                        <Box w={12} h={12} style={{ borderRadius: 4, background: getColorForSegment(offer.name, idx, chartColors), border: '1.5px solid rgba(255,255,255,0.1)' }} />
                        <Text size="xs" fw={600} style={{ color: 'rgba(255,255,255,0.9)', letterSpacing: 0.2 }}>
                          {offer.name || 'Unknown'}
                        </Text>
                        <Badge color="gray" variant="light" size="xs" radius="sm" style={{ fontWeight: 500, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)' }}>
                          {formatNumber(offer.value)}
                        </Badge>
                      </Group>
                    ))}
                  </Group>
                </Box>
              )}
            </NeoCard>
          </SimpleGrid>
        </>
      )}
    </Box>
  );
}