"use client";
import React, { useEffect, useState } from 'react';
import { SimpleGrid, Grid, Box, Title, Text, Group, Stack, rem, Badge } from '@mantine/core';
import { IconLayoutDashboard, IconCircleCheck, IconPercentage, IconArrowRight, IconCurrencyDollar } from '@tabler/icons-react';
import { Skeleton } from '@mantine/core';
import { showNotification } from '@/app/utils/notificationManager';
import { BarChart, PieChart, LineChart, AreaChart } from '@mantine/charts';
import NeoCard from '@/components/ui/flip-card';

// // --- Dummy Data Structures and Helper Functions (You might move these to a separate utils file) ---
// const emptyConversionTrend = [{ period: 'No Data', conversions: 0 }];
// const emptyCommissions = [{ period: 'No Data', commission: 0 }];
// const emptyPieData = [{ name: 'No Data', value: 1, color: '#E0E0E0' }]; // faded color for no data
const emptyBarData = [{ day: 'No Data', clicks: 0 }];
// const emptyLineData = [{ period: 'No Data', clicks: 0 }]; // For LineChart
// const emptyAreaData = [{ period: 'No Data', conversions: 0 }]; // For AreaChart (Conversion Trend)


// Dummy values for demonstration; replace with actual values/context
const CLICK_MONTHLY_TARGET = 10000; // Increased for more realistic scaling
const CONVERSION_MONTHLY_TARGET = 500;
// const COMMISSION_MONTHLY_TARGET = 25000;
interface WeeklyClick {
  day: string;
  clicks: number;
}

interface TrafficSource {
  name: string;
  value: number;
  color?: string; // Optional, added in the component
}

interface ClickOverTime {
  period: string;
  clicks: number;
}

interface ConversionTrend {
  period: string;
  conversions: number;
}

interface ConversionByOffer {
  name: string;
  value: number;
  color?: string;
}

interface TopPerformingOffer {
  offerName: string;
  clicks: number;
  conversions: number;
  revenue: string;
}

interface DashboardData {
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
  totalApprovals: number;
  clicksThisMonth: number;
  clicksPreviousMonth: number;
  salesThisMonth: number;
  salesPreviousMonth: number;
  commissionThisMonth: number;
  commissionPreviousMonth: number;
  weeklyClicks: WeeklyClick[];
  trafficSources: TrafficSource[];
  clicksOverTime: ClickOverTime[];
  conversionTrend: ConversionTrend[];
  conversionsByOffer: ConversionByOffer[];
  topPerformingOffers: TopPerformingOffer[];
}


// Premium chart colors for dark mode
const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6B7280', '#EC4899', '#06B6D4'];

const primary = '#3B82F6';

const formatNumber = (num: number): string => {
  if (num === undefined || num === null) return 'N/A'; // Handle undefined/null explicitly
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const getPercentageOfTarget = (value: number, target: number): string => {
  if (target === 0) return '0.0'; // If target is 0, percentage is 0 to avoid division by zero
  const percentage = (value / target) * 100;
  return percentage.toFixed(1);
};

const tooltipStyles = {
  background: 'linear-gradient(135deg, #0B0F16 0%, #141C2A 100%)',
  boxShadow: '0 12px 32px rgba(0,0,0,0.6), inset 0 1px rgba(255,255,255,0.04)',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#E6EAF0',
  padding: rem(12),
  fontSize: rem(14),
  backdropFilter: 'blur(8px)',
};

const getColorForSegment = (name: string, index: number, palette: string[]) => {
  return palette[index % palette.length];
};
// --- End Dummy Data and Helper Functions ---

interface AdminDashboardContentProps {
  dateRange: [Date | null, Date | null];
}

const AdminDashboardContent: React.FC<AdminDashboardContentProps> = ({ dateRange }) => {
  console.log('AdminDashboardContent component mounted');

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalClicks: 0,
    totalConversions: 0,
    totalEarnings: 0,
    totalApprovals: 0,
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
    conversionsByOffer: [],
    topPerformingOffers: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to format date for API
  const formatApiDate = (date: Date | null | unknown): string | null => {
    if (!date) return null;
    let dateObj = date as Date;
    if (!(dateObj instanceof Date)) {
      dateObj = new Date(date as string);
    }
    if (isNaN(dateObj.getTime())) return null;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Updated the API endpoint to use the new admin dashboard route with date range
  useEffect(() => {
    const fetchDashboardData = async () => {
      // Don't fetch if date range is not complete
      if (!dateRange[0] || !dateRange[1]) return;

      setLoading(true);
      setError(null);
      try {
        console.log('Fetching admin dashboard data...');
        const startDate = formatApiDate(dateRange[0]);
        const endDate = formatApiDate(dateRange[1]);
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const url = `/api/admin/dashboard?${params.toString()}`;
        const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

        if (!res.ok) {
          const errorData = await res.json();
          console.error('Error response from API:', errorData);
          throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        console.log('Fetched admin dashboard data:', data);
        setDashboardData(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load admin dashboard data. Please try again.';
        console.error('Error fetching admin dashboard data:', msg);
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
  }, [dateRange]);

  // Add fallback values to prevent errors when fields are undefined
  const safeValue = (value: number | null | undefined, defaultValue = 0): number => (value !== undefined && value !== null ? value : defaultValue);
  function safeArray<T>(array: T[] | undefined | null): T[] {
    return Array.isArray(array) ? array : [];
  }

  const weeklyClicksData = safeArray(dashboardData.weeklyClicks);
const chartData = weeklyClicksData.length > 0 ? weeklyClicksData : emptyBarData;


  // Helper component for "No Data" message
  const NoDataMessage = ({ message = 'No data available for this chart.' }: { message?: string }) => (
    <Box
      style={{
        height: rem(250), // Match chart height
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--card)',
        borderRadius: rem(8),
        border: `1px dashed var(--border)`,
        color: 'var(--muted-foreground)',
        textAlign: 'center',
        padding: rem(20),
      }}
    >
      <Text size="md" fw={500} c="var(--muted-foreground)">{message}</Text>
    </Box>
  );

  return (
    <Box p="0.5rem">
      {loading ? (
        <>
          {/* Key Metrics Row Skeleton */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md" mb="xl">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-white/5 bg-[#0A0A0C]/40 backdrop-blur-md relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ transform: 'skewX(-20deg)' }}></div>
                <div className="flex justify-between items-start mb-2">
                  <div className="h-8 w-8 rounded-lg bg-zinc-800/50 animate-pulse"></div>
                </div>
                <div className="h-3 w-24 bg-zinc-800/50 rounded animate-pulse mb-2"></div>
                <div className="h-6 w-32 bg-zinc-800/80 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-16 bg-zinc-800/50 rounded animate-pulse"></div>
              </div>
            ))}
          </SimpleGrid>

          {/* Main Grid Skeleton */}
          <Grid gutter="md" mb="md">
            {/* Left Column (Span 4 on desktop, full width on mobile) */}
            <Grid.Col span={{ base: 12, lg: 4 }}>
              <div className="flex flex-col gap-4">
                {/* Overview Card Skeleton */}
                <div className="w-full h-[520px] rounded-xl border border-white/5 bg-[#0A0A0C]/40 backdrop-blur-md p-6 relative overflow-hidden flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <div className="h-5 w-32 bg-zinc-800/80 rounded animate-pulse"></div>
                    <div className="h-5 w-5 bg-zinc-800/50 rounded-full animate-pulse"></div>
                  </div>
                  <div className="h-10 w-full bg-zinc-800/30 rounded-lg animate-pulse mb-8"></div>
                  <div className="flex-1 w-full bg-zinc-800/20 rounded-xl animate-pulse mb-6"></div>
                  <div className="flex justify-between items-end">
                    <div className="h-10 w-24 bg-zinc-800/60 rounded animate-pulse"></div>
                    <div className="h-4 w-20 bg-zinc-800/40 rounded animate-pulse"></div>
                  </div>
                </div>

                {/* Current Week Clicks Skeleton */}
                <div className="w-full h-[300px] rounded-xl border border-white/5 bg-[#0A0A0C]/40 backdrop-blur-md p-6 relative overflow-hidden flex flex-col">
                  <div className="h-5 w-40 bg-zinc-800/80 rounded animate-pulse mb-4"></div>
                  <div className="flex-1 w-full bg-zinc-800/20 rounded-xl animate-pulse"></div>
                </div>
              </div>
            </Grid.Col>

            {/* Right Column (Span 8 on desktop, full width on mobile) */}
            <Grid.Col span={{ base: 12, lg: 8 }}>
              <div className="flex flex-col gap-4">
                {/* Balance Card Skeleton */}
                <div className="w-full h-[384px] rounded-xl border border-white/5 bg-[#0A0A0C]/40 backdrop-blur-md p-6 relative overflow-hidden flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className="h-10 w-48 bg-zinc-800/80 rounded animate-pulse"></div>
                    <div className="h-6 w-16 bg-zinc-800/50 rounded animate-pulse"></div>
                  </div>
                  <div className="h-4 w-32 bg-zinc-800/40 rounded animate-pulse mb-6"></div>
                  <div className="flex-1 w-full bg-zinc-800/20 rounded-xl animate-pulse"></div>
                </div>

                {/* Traffic Sources Skeleton */}
                <div className="w-full h-[384px] rounded-xl border border-white/5 bg-[#0A0A0C]/40 backdrop-blur-md p-0 relative overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-white/5">
                    <div className="h-6 w-48 bg-zinc-800/80 rounded animate-pulse"></div>
                  </div>
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 w-full bg-zinc-800/30 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                </div>
              </div>
            </Grid.Col>
          </Grid>

          {/* Bottom Charts Skeleton */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="h-[350px] rounded-xl border border-white/5 bg-[#0A0A0C]/40 backdrop-blur-md p-6 relative overflow-hidden flex flex-col"
              >
                <div className="h-5 w-40 bg-zinc-800/80 rounded animate-pulse mb-4"></div>
                <div className="flex-1 w-full bg-zinc-800/20 rounded-xl animate-pulse"></div>
              </div>
            ))}
          </SimpleGrid>
        </>
      ) : error ? null : (
        <>
          {/* Key Metrics Row */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm" mb="lg">
            {/* Total Clicks */}
            <NeoCard variant="glass" className="p-3 md:p-4 backdrop-blur-xl border border-white/10 relative overflow-hidden group" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
              <div className="absolute right-2 top-2 p-1.5 md:p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                <IconArrowRight size={18} className="md:w-5 md:h-5" />
              </div>
              <div className="text-zinc-400 text-[10px] md:text-xs font-medium uppercase tracking-wider mb-1">Total Clicks</div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">{safeValue(dashboardData.totalClicks).toLocaleString()}</div>
              <div className="text-[9px] md:text-[10px] text-zinc-500">
                All-time platform clicks
              </div>
            </NeoCard>

            {/* Total Conversions */}
            <NeoCard variant="glass" className="p-3 md:p-4 backdrop-blur-xl border border-white/10 relative overflow-hidden group" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
              <div className="absolute right-2 top-2 p-1.5 md:p-2 rounded-lg bg-green-500/10 text-green-400 group-hover:bg-green-500/20 transition-colors">
                <IconCircleCheck size={18} className="md:w-5 md:h-5" />
              </div>
              <div className="text-zinc-400 text-[10px] md:text-xs font-medium uppercase tracking-wider mb-1">Total Conversions</div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">{safeValue(dashboardData.totalConversions).toLocaleString()}</div>
              <div className="text-[9px] md:text-[10px] text-zinc-500">
                All-time platform conversions
              </div>
            </NeoCard>

            {/* Conversion Rate % */}
            <NeoCard variant="glass" className="p-3 md:p-4 backdrop-blur-xl border border-white/10 relative overflow-hidden group" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
              <div className="absolute right-2 top-2 p-1.5 md:p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                <IconPercentage size={18} className="md:w-5 md:h-5" />
              </div>
              <div className="text-zinc-400 text-[10px] md:text-xs font-medium uppercase tracking-wider mb-1">Conversion Rate %</div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">
                {(() => {
                  const clicks = safeValue(dashboardData.totalClicks);
                  const conversions = safeValue(dashboardData.totalConversions);
                  if (clicks === 0) return '0.00%';
                  return `${((conversions / clicks) * 100).toFixed(2)}%`;
                })()}
              </div>
              <div className="text-[9px] md:text-[10px] text-zinc-500">
                Overall platform conversion rate
              </div>
            </NeoCard>
          </SimpleGrid>

          <Grid gutter="md" mb="md">
            {/* Left Column (Span 4 on desktop, full width on mobile) */}
            <Grid.Col span={{ base: 12, lg: 4 }}>
              <div className="flex flex-col gap-4 h-full">
                {/* Card 1: Overview (Platform Statistics) */}
                <div className="flex flex-col">
                  {/* External Header */}
                  <div className="mb-4 pl-1">
                    <div className="flex justify-between items-center mb-1">
                      <h2 className="text-lg font-bold text-white">Platform Overview</h2>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Overview of platform-wide statistics and metrics.
                    </p>
                  </div>

                  <NeoCard
                    variant="glass"
                    className="w-full backdrop-blur-xl border border-white/20 active:scale-[0.99] transition-transform duration-300 relative"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {/* Ambient Glows */}
                    <div className="absolute top-0 left-0 w-72 h-72 bg-white/20 blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/30 blur-[140px] rounded-full pointer-events-none" />

                    <div className="flex flex-col h-full p-4 md:p-6 relative z-10">
                      {/* Card Internal Header */}
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-medium text-white">Overview</h3>
                      </div>

                      {/* Quick Stats Row */}
                      <div className="grid grid-cols-3 gap-1.5 md:gap-2 mb-4">
                        <div className="bg-white/5 rounded-sm p-1.5 md:p-2 border border-white/5">
                          <div className="text-[9px] md:text-[10px] text-zinc-500 mb-0.5 truncate">Total Clicks</div>
                          <div className="text-base md:text-lg font-bold text-white">{safeValue(dashboardData.totalClicks).toLocaleString()}</div>
                        </div>
                        <div className="bg-white/5 rounded-sm p-1.5 md:p-2 border border-white/5">
                          <div className="text-[9px] md:text-[10px] text-zinc-500 mb-0.5 truncate">Conversions</div>
                          <div className="text-base md:text-lg font-bold text-green-400">{safeValue(dashboardData.totalConversions).toLocaleString()}</div>
                        </div>
                        <div className="bg-white/5 rounded-sm p-1.5 md:p-2 border border-white/5">
                          <div className="text-[9px] md:text-[10px] text-zinc-500 mb-0.5 truncate">Earnings</div>
                          <div className="text-base md:text-lg font-bold text-blue-400">₹{safeValue(dashboardData.totalEarnings).toLocaleString()}</div>
                        </div>
                      </div>

                      {/* Chart Area */}
                      <div
                        className="w-full h-[150px] relative mt-3 md:mt-4"
                        style={{
                          marginLeft: '-16px',
                          marginRight: '-16px',
                          paddingLeft: 0,
                          paddingRight: 0,
                          width: 'calc(100% + 32px)',
                        }}
                      >
                        <BarChart
                          h={150}
                          data={chartData}
                          dataKey="day"
                          series={[{ name: 'clicks', color: primary }]}
                          withXAxis={true}
                          withYAxis={false}
                          gridAxis="none"
                          textColor="#9CA3AF"
                          xAxisProps={{
                            tick: { fill: '#9CA3AF', fontSize: 11 },
                            tickLine: { stroke: '#374151' },
                            axisLine: { stroke: '#374151' }
                          }}
                          tooltipProps={{
                            content: ({ payload }) => {
                              if (!payload || !payload[0]) return null;
                              const { day, clicks } = payload[0].payload;
                              return (
                                <div className="bg-[#121420]/95 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[100px]">
                                  <div className="flex flex-col gap-0.5">
                                    <div className="text-[10px] text-zinc-400 mb-1">{day}</div>
                                    <div className="text-sm font-bold text-white tracking-tight">{formatNumber(clicks)} clicks</div>
                                  </div>
                                </div>
                              );
                            }
                          }}
                        />
                      </div>

                      {/* Footer Stats */}
                      <div className="mt-3 md:mt-4 flex justify-between items-end">
                        <div className="text-right">
                          <div className="text-[9px] md:text-[10px] text-zinc-600">Last updated</div>
                          <div className="text-[10px] md:text-[11px] font-medium text-zinc-400">
                            Today, {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </NeoCard>
                </div>

                {/* Weekly Clicks Chart */}
                <NeoCard
                  variant="glass"
                  className="w-full min-h-[260px] backdrop-blur-xl border border-white/20 pt-4 px-4 md:pt-5 md:px-5 pb-0 flex flex-col overflow-hidden"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)' }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-base md:text-lg font-medium text-white">Weekly Clicks</h3>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4">
                    {chartData.reduce((acc, curr) => acc + (curr.clicks || 0), 0).toLocaleString()}
                  </div>
                  <div
                    className="w-full h-[180px] md:h-[220px] relative mt-3 md:mt-4"
                    style={{
                      marginLeft: '-16px',
                      marginRight: '-16px',
                      marginBottom: 0,
                      paddingLeft: 0,
                      paddingRight: 0,
                      paddingBottom: 0,
                      width: 'calc(100% + 32px)',
                    }}
                  >
                    <BarChart
                      h={220}
                      data={chartData}
                      dataKey="day"
                      series={[{ name: 'clicks', color: primary }]}
                      withTooltip
                      textColor="#9CA3AF"
                      xAxisProps={{
                        tick: { fill: '#9CA3AF', fontSize: 11 },
                        tickLine: { stroke: '#374151' },
                        axisLine: { stroke: '#374151' }
                      }}
                      yAxisProps={{
                        tick: { fill: '#9CA3AF', fontSize: 11 },
                        tickLine: { stroke: '#374151' },
                        axisLine: { stroke: '#374151' },
                        width: 30
                      }}
                      tooltipProps={{
                        content: ({ payload }) => {
                          if (!payload || !payload[0]) return null;
                          const { day, clicks } = payload[0].payload;
                          return (
                            <div className="bg-[#121420]/95 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[100px]">
                              <div className="flex flex-col gap-0.5">
                                <div className="text-[10px] text-zinc-400 mb-1">{day}</div>
                                <div className="text-sm font-bold text-white tracking-tight">{formatNumber(clicks)} clicks</div>
                              </div>
                            </div>
                          );
                        },
                      }}
                    />
                  </div>
                </NeoCard>
              </div>
            </Grid.Col>

            {/* Right Column (Span 8 on desktop, full width on mobile) */}
            <Grid.Col span={{ base: 12, lg: 8 }}>
              <div className="flex flex-col gap-4 h-full">
                {/* Row 1: Total Earnings (Full Width now) */}
                <div className="grid grid-cols-12 gap-4">
                  {/* Total Earnings */}
                  <div className="col-span-12">
                    <div className="flex flex-col h-full">
                      {/* External Header */}
                      <div className="mb-4 pl-1">
                        <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
                          <h2 className="text-lg font-bold text-white">Total Earnings</h2>
                          <Badge
                            variant="filled"
                            color="dark"
                            radius="md"
                            size="lg"
                            className="bg-zinc-800 text-zinc-300 pr-2 cursor-pointer hover:bg-zinc-700 transition"
                            rightSection={<Text size="xs">INR</Text>}
                          >
                            ₹
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-500">
                          Total earnings across the entire platform.
                        </p>
                      </div>

                      <NeoCard
                        variant="glass"
                        className="min-h-[340px] backdrop-blur-xl border border-white/20 overflow-hidden flex flex-col active:scale-[0.99] transition-transform duration-300 relative"
                        style={{ background: 'rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)' }}
                      >
                        {/* Subtle Yellow Gradient from Bottom Right */}
                        <div
                          className="absolute bottom-0 right-0 w-64 h-64 pointer-events-none"
                          style={{
                            background: 'radial-gradient(circle at bottom right, rgba(255, 193, 7, 0.15) 0%, rgba(255, 193, 7, 0.08) 30%, transparent 70%)',
                            zIndex: 1
                          }}
                        />
                        <div className="pt-4 px-4 md:pt-6 md:px-6 pb-0 relative z-10 flex flex-col h-full">
                          {/* Top Stats */}
                          <div className="flex flex-wrap justify-between items-start gap-2 mb-3 md:mb-4">
                            <div className="flex items-center">
                              <span className="text-blue-500 text-2xl md:text-3xl mr-1 font-light">₹</span>
                              <span className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                                {safeValue(dashboardData.totalEarnings).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>

                          {/* Sub Stats Row */}
                          <div className="flex justify-between items-center mb-2 md:mb-2">
                            <div className="text-[11px] text-zinc-400 flex items-center">
                              Total earnings from all conversions
                            </div>
                          </div>

                          {/* Chart Area for Earnings */}
                          <div
                            className="w-full h-[180px] relative mt-3 md:mt-4"
                            style={{
                              marginLeft: '-16px',
                              marginRight: '-16px',
                              marginBottom: 0,
                              paddingLeft: 0,
                              paddingRight: 0,
                              paddingBottom: 0,
                              width: 'calc(100% + 32px)',
                            }}
                          >
                            <AreaChart
                              h={205}
                              data={dashboardData.conversionTrend.length > 0 ? dashboardData.conversionTrend : [{ period: 'No Data', conversions: 0 }]}
                              dataKey="period"
                              series={[{ name: 'conversions', color: primary }]}
                              curveType="monotone"
                              withXAxis={true}
                              withYAxis={false}
                              gridAxis="none"
                              withDots={false}
                              strokeWidth={1.5}
                              fillOpacity={0.2}
                              textColor="#9CA3AF"
                              xAxisProps={{
                                tick: { fill: '#9CA3AF', fontSize: 11 },
                                tickLine: { stroke: '#374151' },
                                axisLine: { stroke: '#374151' }
                              }}
                              tooltipProps={{
                                content: ({ payload }) => {
                                  if (!payload || !payload[0]) return null;
                                  const { period, conversions } = payload[0].payload;
                                  return (
                                    <Box style={tooltipStyles}>
                                      <Text fw={600} style={{ color: '#fff' }}>{period}</Text>
                                      <Text style={{ color: '#fff' }}>Conversions: {formatNumber(conversions)}</Text>
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
              </div>
            </Grid.Col>
          </Grid>

          {/* Charts Grid */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {/* Traffic Sources Pie Chart */}
            <NeoCard
              variant="glass"
              className="pt-2 px-4 md:pt-3 md:px-5 pb-0 backdrop-blur-xl border border-white/20 overflow-hidden flex flex-col"
              style={{ background: 'rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)' }}
            >
              <div className="flex justify-between items-center mb-2 mt-2">
                <h3 className="text-base md:text-lg font-medium text-white">Traffic Sources</h3>
              </div>
              <div>
                <div
                  className="w-full h-[200px] md:h-[240px] chart-bottom-align mt-1"
                  style={{
                    marginLeft: '-16px',
                    marginRight: '-16px',
                    marginBottom: 0,
                    paddingLeft: 0,
                    paddingRight: 0,
                    paddingBottom: 0,
                    width: 'calc(100% + 32px)',
                  }}
                >
                  <PieChart
                    h={320}
                    data={
                      dashboardData.trafficSources.length > 0
                        ? dashboardData.trafficSources.map((source, index) => ({
                            ...source,
                            color: getColorForSegment(source.name, index, chartColors),
                          }))
                        : [{ name: 'No Data', value: 1, color: 'rgba(255,255,255,0.1)' }]
                    }
                    withTooltip
                    tooltipProps={{
                      content: ({ payload }) => {
                        if (!payload || !payload[0]) return null;
                        const { name, value } = payload[0].payload;
                        const total = dashboardData.trafficSources.reduce((sum, src) => sum + src.value, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                        return (
                          <div className="bg-[#121420]/95 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[100px]">
                            <div className="flex flex-col gap-0.5">
                              <div className="text-[10px] text-zinc-400 mb-1">{name}</div>
                              <div className="text-sm font-bold text-white tracking-tight">{formatNumber(value)} clicks</div>
                              <div className="text-[10px] text-zinc-500 mt-1">
                                Share: <span className="text-white font-medium">{percentage}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      },
                    }}
                  />
                </div>
              </div>
              {dashboardData.trafficSources.length > 0 && (
                <Box mt={8} style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Group gap={8} style={{ flexWrap: 'wrap' }}>
                    {dashboardData.trafficSources.map((source, idx) => (
                      <Group key={source.name || 'Unknown'} gap={4} align="center">
                        <Box w={12} h={12} style={{ borderRadius: 4, background: getColorForSegment(source.name, idx, chartColors), border: '1.5px solid rgba(255,255,255,0.1)' }} />
                        <Text size="xs" fw={600} style={{ color: 'rgba(255,255,255,0.9)', letterSpacing: 0.2 }}>
                          {source.name || 'Unknown'}
                        </Text>
                        <Badge color="gray" variant="light" size="xs" radius="sm" style={{ fontWeight: 500, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)' }}>
                          {formatNumber(source.value)}
                        </Badge>
                      </Group>
                    ))}
                  </Group>
                </Box>
              )}
            </NeoCard>

            {/* Conversions By Offer */}
            <NeoCard
              variant="glass"
              className="p-4 md:p-6 backdrop-blur-xl border border-white/20"
              style={{ background: 'rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)' }}
            >
              <Title
                order={4}
                style={{
                  color: '#E6EAF0',
                  fontWeight: 500,
                  fontSize: 'clamp(0.9rem, 3vw, 1.125rem)',
                  marginBottom: '12px'
                }}
                mb="sm"
              >
                Top Performing Offers
              </Title>
              <div className="pie-chart-glass-container">
                <style jsx>{`
                  :global(.pie-chart-glass-container .recharts-sector) {
                    transition: all 0.3s ease;
                    cursor: pointer;
                    opacity: 0.9;
                    stroke: rgba(255, 255, 255, 0.2) !important;
                    stroke-width: 1.5px !important;
                    filter: drop-shadow(0 2px 8px rgba(255, 255, 255, 0.1)) brightness(1.05);
                  }
                  :global(.pie-chart-glass-container .recharts-sector:hover) {
                    filter: brightness(1.2) saturate(1.1) drop-shadow(0 4px 12px rgba(255, 255, 255, 0.2));
                    opacity: 0.95;
                    stroke: rgba(255, 255, 255, 0.35) !important;
                    stroke-width: 2px !important;
                  }
                `}</style>
                <PieChart
                  h="clamp(12rem, 40vw, 16rem)"
                  data={
                    dashboardData.topPerformingOffers.length > 0
                      ? dashboardData.topPerformingOffers.slice(0, 8).map((offer, index) => ({
                          name: offer.offerName,
                          value: offer.conversions,
                          color: getColorForSegment(offer.offerName, index, chartColors),
                        }))
                      : [{ name: 'No Data', value: 1, color: 'rgba(255,255,255,0.1)' }]
                  }
                  withTooltip
                  tooltipProps={{
                    content: ({ payload }) => {
                      if (!payload || !payload[0]) return null;
                      const { name, value } = payload[0].payload;
                      const offer = dashboardData.topPerformingOffers.find(o => o.offerName === name);
                      return (
                        <div className="bg-[#121420]/95 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[120px]">
                          <div className="flex flex-col gap-0.5">
                            <div className="text-[10px] text-zinc-400 mb-1">{name}</div>
                            <div className="text-sm font-bold text-white tracking-tight">{formatNumber(value)} conversions</div>
                            {offer && (
                              <div className="text-[10px] text-zinc-500 mt-1">
                                Revenue: <span className="text-white font-medium">₹{offer.revenue}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    },
                  }}
                />
              </div>
              {dashboardData.topPerformingOffers.length > 0 && (
                <Box mt={8} style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Group gap={8} style={{ flexWrap: 'wrap' }}>
                    {dashboardData.topPerformingOffers.slice(0, 8).map((offer, idx) => (
                      <Group key={offer.offerName} gap={4} align="center">
                        <Box w={12} h={12} style={{ borderRadius: 4, background: getColorForSegment(offer.offerName, idx, chartColors), border: '1.5px solid rgba(255,255,255,0.1)' }} />
                        <Text size="xs" fw={600} style={{ color: 'rgba(255,255,255,0.9)', letterSpacing: 0.2 }}>
                          {offer.offerName}
                        </Text>
                        <Badge color="gray" variant="light" size="xs" radius="sm" style={{ fontWeight: 500, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)' }}>
                          {formatNumber(offer.conversions)}
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
};

export default AdminDashboardContent;