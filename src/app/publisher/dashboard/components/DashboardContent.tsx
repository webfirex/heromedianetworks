"use client"
import React, { useEffect, useState } from 'react';
import { Card, SimpleGrid, Grid, Box, Title, Text, Group, Stack, Badge, Flex, SemiCircleProgress, Button, Loader, Avatar } from '@mantine/core';
import { IconLayoutDashboard, IconCircleCheck, IconCurrencyDollar, IconArrowRight, IconInfoCircle, IconChevronDown, IconHelpCircle, IconDotsVertical, IconPercentage, IconRepeat, IconUserCheck } from '@tabler/icons-react';
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
type OverviewClicks = { period: string; clicks: number };

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
    uniqueClicks: number;
    conversionRate: number; 
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
    overviewClicks?: {
      last24h: OverviewClicks[];
      last7d: OverviewClicks[];
      last30d: OverviewClicks[];
    };
  }>({
    totalClicks: 0,
    uniqueClicks:0,
    conversionRate:0,
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
    overviewClicks: undefined,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatApiDate = (date: Date | null | unknown): string | null => {
    if (!date) return null;
    let dateObj = date as Date;
    // Handle case where date comes as string (props serialization, etc.)
    if (!(dateObj instanceof Date)) {
      dateObj = new Date(date as string);
    }
    // Check for invalid date
    if (isNaN(dateObj.getTime())) return null;

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
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
      // Don't fetch if only one date is selected
      if (!dateRange[0] || !dateRange[1]) return;

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
          overviewClicks: undefined,
          ...data
        };
        // Format clicksOverTime dates for chart display
        if (defaultData.clicksOverTime && defaultData.clicksOverTime.length > 0) {
          defaultData.clicksOverTime = defaultData.clicksOverTime.map((item: ClicksOverTime) => ({
            ...item,
            period: formatChartDate(item.period)
          }));
        }
        // Format overview last7d/last30d (leave last24h as HH:00)
        if (defaultData.overviewClicks?.last7d?.length) {
          defaultData.overviewClicks.last7d = defaultData.overviewClicks.last7d.map((item: OverviewClicks) => ({
            ...item,
            period: formatChartDate(item.period),
          }));
        }
        if (defaultData.overviewClicks?.last30d?.length) {
          defaultData.overviewClicks.last30d = defaultData.overviewClicks.last30d.map((item: OverviewClicks) => ({
            ...item,
            period: formatChartDate(item.period),
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
    ? ((dashboardData.uniqueClicks / CLICK_MONTHLY_TARGET) * 100).toFixed(2)
    : '0.00';
  const isClicksPositive = parseFloat(clicksPercentageChange) > 0;
  const clicksTrendColor = isClicksPositive ? 'green' : 'red';

  const salesPercentageChange = SALES_MONTHLY_TARGET > 0
    ? ((dashboardData.salesThisMonth / SALES_MONTHLY_TARGET) * 100).toFixed(2)
    : '0.00';
  const isSalesPositive = parseFloat(salesPercentageChange) > 0;
  const salesTrendColor = isSalesPositive ? 'green' : 'red';

  // Calculate conversion rate
  const currentConversionRate = dashboardData.clicksThisMonth > 0
    ? ((dashboardData.salesThisMonth / dashboardData.clicksThisMonth) * 100)
    : 0;
  const previousConversionRate = dashboardData.clicksPreviousMonth > 0
    ? ((dashboardData.salesPreviousMonth / dashboardData.clicksPreviousMonth) * 100)
    : 0;
  const conversionRateChange = previousConversionRate > 0
    ? (((currentConversionRate - previousConversionRate) / previousConversionRate) * 100)
    : (currentConversionRate > 0 ? 100 : 0);
  const isConversionRatePositive = conversionRateChange >= 0;

  const commissionPercentageChange = COMMISSION_MONTHLY_TARGET > 0
    ? ((dashboardData.commissionThisMonth / COMMISSION_MONTHLY_TARGET) * 100).toFixed(2)
    : '0.00';
  const isCommissionPositive = parseFloat(commissionPercentageChange) > 0;
  const commissionTrendColor = isCommissionPositive ? 'green' : 'red';

  // Use clicksOverTime data which is already filtered by the selected date range
  const activeOverviewSeries = (dashboardData.clicksOverTime ?? []).map(item => ({
    period: item.period,
    clicks: item.clicks
  }));

  // Calculate percentage change for the selected date range (first vs last period)
  const overviewPercentageChange = (() => {
    if (activeOverviewSeries.length < 2) return '0.00';
    const firstValue = activeOverviewSeries[0]?.clicks ?? 0;
    const lastValue = activeOverviewSeries[activeOverviewSeries.length - 1]?.clicks ?? 0;
    if (firstValue === 0) return lastValue > 0 ? '100.00' : '0.00';
    const change = ((lastValue - firstValue) / firstValue) * 100;
    return change.toFixed(2);
  })();
  const isOverviewPositive = parseFloat(overviewPercentageChange) >= 0;

  return (
    <Box p="0.5rem">
      {loading ? (
        <>
          {/* 1. Key Metrics Row Skeleton (3 Cols) */}
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

          {/* 2. Main Grid Skeleton */}
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

          {/* 3. Bottom Charts Skeleton (2 Cols) */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {[...Array(3)].map((_, i) => (
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
          {/* Key Metrics Row - New Addition */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm" mb="lg">
            {/* Clicks This Month */}
            {/* <NeoCard variant="glass" className="p-3 md:p-4 backdrop-blur-xl border border-white/10 relative overflow-hidden group" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
              <div className="absolute right-2 top-2 p-1.5 md:p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                <IconArrowRight size={18} className="md:w-5 md:h-5" />
              </div>
              <div className="text-zinc-400 text-[10px] md:text-xs font-medium uppercase tracking-wider mb-1">Clicks This Month</div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">{formatNumber(dashboardData.clicksThisMonth)}</div>
              <div className="flex items-center gap-2 mb-1">
                <div className={`text-xs font-bold ${isClicksPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isClicksPositive ? '▲' : '▼'} {clicksPercentageChange}%
                </div>
                <span className="text-[9px] md:text-[10px] text-zinc-500">vs target ({CLICK_MONTHLY_TARGET})</span>
              </div>
              <div className="text-[9px] md:text-[10px] text-zinc-500">
                Previous month: {formatNumber(dashboardData.clicksPreviousMonth)} clicks
              </div>
            </NeoCard> */}

            <NeoCard variant="glass" className="p-3 md:p-4 backdrop-blur-xl border border-white/10 relative overflow-hidden group" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
              <div className="absolute right-2 top-2 p-1.5 md:p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                <IconUserCheck size={18} className="md:w-5 md:h-5" />
              </div>
              <div className="text-zinc-400 text-[10px] md:text-xs font-medium uppercase tracking-wider mb-3">Unique Clicks This Month</div>
              <div className="text-2xl md:text-4xl font-bold text-white mb-4">{formatNumber(dashboardData.uniqueClicks)}</div>
              {/* <div className="flex items-center gap-2 mb-1">
                <div className={`text-xs font-bold ${isClicksPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isClicksPositive ? '▲' : '▼'} {clicksPercentageChange}%
                </div>
                <span className="text-[9px] md:text-[10px] text-zinc-500">vs target ({CLICK_MONTHLY_TARGET})</span>
              </div> */}
              <div className="text-[9px] md:text-[10px] text-zinc-500">
                Total Clicks: {formatNumber(dashboardData.clicksThisMonth)} clicks
              </div>
            </NeoCard>

            {/* Sales (Conversions) This Month */}
            <NeoCard variant="glass" className="p-3 md:p-4 backdrop-blur-xl border border-white/10 relative overflow-hidden group" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
              <div className="absolute right-2 top-2 p-1.5 md:p-2 rounded-lg bg-green-500/10 text-green-400 group-hover:bg-green-500/20 transition-colors">
                <IconCircleCheck size={18} className="md:w-5 md:h-5" />
              </div>
              <div className="text-zinc-400 text-[10px] md:text-xs font-medium uppercase tracking-wider mb-3">Total conversions</div>
              <div className="text-2xl md:text-4xl font-bold text-white mb-4">{formatNumber(dashboardData.totalConversions)}</div>
              {/* <div className="flex items-center gap-2 mb-1">
                <div className={`text-xs font-bold ${isSalesPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isSalesPositive ? '▲' : '▼'} {salesPercentageChange}%
                </div>
                <span className="text-[9px] md:text-[10px] text-zinc-500">vs target ({SALES_MONTHLY_TARGET})</span>
              </div> */}
              <div className="text-[9px] md:text-[10px] text-zinc-500">
                Previous month: {formatNumber(dashboardData.salesPreviousMonth)} conversions
              </div>
            </NeoCard>

            {/* Conversion Rate % This Month */}
            <NeoCard variant="glass" className="p-3 md:p-4 backdrop-blur-xl border border-white/10 relative overflow-hidden group" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
              <div className="absolute right-2 top-2 p-1.5 md:p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                <IconPercentage size={18} className="md:w-5 md:h-5" />
              </div>
              <div className="text-zinc-400 text-[10px] md:text-xs font-medium uppercase tracking-wider mb-3">Conversion Rate %</div>
              <div className="text-2xl md:text-4xl font-bold text-white mb-4">{dashboardData.conversionRate.toFixed(2)}%</div>
              {/* <div className="flex items-center gap-2 mb-1">
                <div className={`text-xs font-bold ${isConversionRatePositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isConversionRatePositive ? '▲' : '▼'} {Math.abs(conversionRateChange).toFixed(2)}%
                </div>
                <span className="text-[9px] md:text-[10px] text-zinc-500">vs previous month</span>
              </div> */}
              <div className="text-[9px] md:text-[10px] text-zinc-500">
                Previous month: {previousConversionRate.toFixed(2)}%
              </div>
            </NeoCard>
          </SimpleGrid>

          <Grid gutter="md" mb="md">
            {/* Left Column (Span 4 on desktop, full width on mobile) */}
            <Grid.Col span={{ base: 12, lg: 4 }}>
              <div className="flex flex-col gap-4 h-full">
                {/* Card 1: Overview (My Campaigns) */}
                <div className="flex flex-col">
                  {/* External Header */}
                  <div className="mb-4 pl-1">
                    <div className="flex justify-between items-center mb-1">
                      <h2 className="text-lg font-bold text-white">Statistics</h2>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Overview of your campaign performance statistics.
                    </p>
                  </div>

                  <NeoCard
                    variant="glass"
                    className="w-full backdrop-blur-xl border border-white/20 active:scale-[0.99] transition-transform duration-300 relative overflow-hidden"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {/* Ambient Glows */}
                    <div className="absolute top-0 left-0 w-72 h-72 bg-white/20 blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/30 blur-[140px] rounded-full pointer-events-none" />

                    <div className="flex flex-col h-full p-4 md:p-6 relative z-10">
                      {/* Card Internal Header */}
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-medium text-white">Overview</h3>
                        <IconInfoCircle size={18} className="text-zinc-500 cursor-pointer hover:text-zinc-300" />
                      </div>

                      {/* Quick Stats Row */}
                      <div className="grid grid-cols-3 gap-1.5 md:gap-2 mb-4">
                        <div className="bg-white/5 rounded-sm p-1.5 md:p-2 border border-white/5">
                          <div className="text-[9px] md:text-[10px] text-zinc-500 mb-0.5 truncate">Total Clicks</div>
                          <div className="text-base md:text-lg font-bold text-white">{formatNumber(dashboardData.totalClicks)}</div>
                        </div>
                        <div className="bg-white/5 rounded-sm p-1.5 md:p-2 border border-white/5">
                          <div className="text-[9px] md:text-[10px] text-zinc-500 mb-0.5 truncate">Conversions</div>
                          <div className="text-base md:text-lg font-bold text-green-400">{formatNumber(dashboardData.totalConversions)}</div>
                        </div>
                        <div className="bg-white/5 rounded-sm p-1.5 md:p-2 border border-white/5">
                          <div className="text-[9px] md:text-[10px] text-zinc-500 mb-0.5 truncate">Earning</div>
                          <div className="text-base md:text-lg font-bold text-blue-400">₹{formatNumber(dashboardData.commissionThisMonth, true)}</div>
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
                        <AreaChart
                          h={150}
                          data={activeOverviewSeries}
                          dataKey="period"
                          series={[{ name: 'clicks', color: primary }]}
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
                              const { period, clicks } = payload[0].payload;
                              // % change vs previous point in the ACTIVE series
                              const idx = activeOverviewSeries.findIndex(p => p.period === period);
                              const prevValue = idx > 0 ? activeOverviewSeries[idx - 1]?.clicks ?? clicks : clicks;
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
                      </div>

                      {/* Footer Stats */}
                      <div className="mt-3 md:mt-4 flex justify-between items-end">
                        <div className="flex items-center gap-1">
                          <div className={`text-2xl md:text-3xl font-bold mb-1 ${isOverviewPositive ? 'text-blue-500' : 'text-red-500'}`}>{isOverviewPositive ? '+' : ''}</div>
                          <div className="text-3xl md:text-4xl font-bold text-white tracking-tight">{Math.abs(Number(overviewPercentageChange))}<span className="text-xl md:text-2xl text-white ml-1">%</span></div>
                        </div>
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

                {/* Current Week / Selected Period Clicks */}
                <NeoCard
                  variant="glass"
                  className="w-full min-h-[260px] backdrop-blur-xl border border-white/20 pt-4 px-4 md:pt-5 md:px-5 pb-0 flex flex-col overflow-hidden"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)' }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-base md:text-lg font-medium text-white">Selected Period Clicks</h3>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4">
                    {formatNumber(dashboardData.clicksOverTime.reduce((acc, curr) => acc + curr.clicks, 0))}
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
                      data={dashboardData.clicksOverTime.map(d => ({
                        period: formatChartDate(d.period),
                        daily_clicks: d.clicks
                      }))}
                      dataKey="period"
                      series={[{ name: 'daily_clicks', color: primary }]}
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
                          const { period, daily_clicks } = payload[0].payload;
                          return (
                            <div className="bg-[#121420]/95 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[100px]">
                              <div className="flex flex-col gap-0.5">
                                <div className="text-[10px] text-zinc-400 mb-1">{period}</div>
                                <div className="text-sm font-bold text-white tracking-tight">{formatNumber(daily_clicks)} clicks</div>
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
                {/* Row 1: Balance (Full Width now that Ads is gone) */}
                <div className="grid grid-cols-12 gap-4">
                  {/* Total Balance */}
                  <div className="col-span-12">
                    <div className="flex flex-col h-full">
                      {/* External Header */}
                      <div className="mb-4 pl-1">
                        <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
                          <h2 className="text-lg font-bold text-white">Total Balance</h2>
                          <Badge
                            variant="filled"
                            color="dark"
                            radius="md"
                            size="lg"
                            className="bg-zinc-800 text-zinc-300 pr-2 cursor-pointer hover:bg-zinc-700 transition"
                            rightSection={<IconChevronDown size={14} />}
                          >
                            INR
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-500">
                          The sum of filtered commissions.
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
                          <div className="flex justify-between items-center mb-2 md:mb-2">
                            <div className="text-[11px] text-zinc-400 flex items-center">
                              This month: <span className="text-white ml-1 font-medium">₹ {dashboardData.commissionThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>

                          {/* Chart Area for Balance/Commissions */}
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
                              data={dashboardData.commissionsOverTime.length > 0 ? dashboardData.commissionsOverTime : emptyCommissions}
                              dataKey="period"
                              series={[{ name: 'commission', color: primary }]}
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
                                  const { period, commission } = payload[0].payload;
                                  return (
                                    <Box style={tooltipStyles}>
                                      <Text fw={600} style={{ color: '#fff' }}>{period}</Text>
                                      <Text style={{ color: '#fff' }}>Earning: ₹{formatNumber(commission, true)}</Text>
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

                {/* Row 2: Clicks Over Time (replacing Traffic Sources card, dimension kept in data) */}
                <div className="flex-1">
                  <NeoCard
                    variant="glass"
                className="w-full flex-1 min-h-[320px] md:min-h-[360px] backdrop-blur-xl border border-white/20 p-4 md:p-6 flex flex-col overflow-hidden"
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
                      Clicks Over Time
                      <Text
                        size="xs"
                        style={{
                          display: 'block',
                          marginTop: '8px',
                          color: '#3B82F6',
                          fontWeight: 600
                        }}
                      >
                        ▲ 12% (vs. previous month)
                      </Text>
                    </Title>
                    <div className="flex-1 w-full min-h-[220px] md:min-h-[260px] relative" style={{ marginLeft: '-16px', marginRight: '-16px', marginBottom: '-16px', paddingLeft: 0, paddingRight: 0, paddingBottom: 0, width: 'calc(100% + 32px)' }}>
                      <AreaChart
                        h={310}
                        data={dashboardData.clicksOverTime.length > 0 ? dashboardData.clicksOverTime : emptyClicksOverTime}
                        dataKey="period"
                        series={[{ name: 'clicks', color: primary }]}
                        curveType="monotone"
                        withXAxis={true}
                        withYAxis={true}
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
                        yAxisProps={{
                          tick: { fill: '#9CA3AF', fontSize: 11 },
                          tickLine: { stroke: '#374151' },
                          axisLine: { stroke: '#374151' },
                          width: 30
                        }}
                        referenceLines={[
                          { y: CLICK_MONTHLY_TARGET / 4, label: 'Monthly Avg Target', color: '#ef4444', strokeDasharray: '4 4' },
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
                                <Text mt="xs" style={{ color: '#fff' }}>
                                  Total Clicks: <span style={{ fontWeight: 700 }}>{formatNumber(clicks)}</span>
                                </Text>
                                <Text style={{ color: '#fff' }}>
                                  Target Progress:{' '}
                                  <span style={{ color: Number(targetProgress) >= 100 ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>
                                    {targetProgress}%
                                  </span>{' '}
                                  of weekly avg target
                                </Text>
                              </Box>
                            );
                          },
                        }}
                      />
                    </div>
                  </NeoCard>
                </div>
              </div>
            </Grid.Col>
          </Grid>

          {/* Charts Grid */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {/* Top row: Conversion Trend & Conversions By Offer side by side */}
            <NeoCard
              variant="glass"
              className="pt-2 px-4 md:pt-3 md:px-5 pb-0 backdrop-blur-xl border border-white/20 overflow-hidden flex flex-col"
              style={{ background: 'rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)' }}
            >
              <div className="flex justify-between items-center mb-2 mt-2">
                <h3 className="text-base md:text-lg font-medium text-white">Conversion Trend</h3>
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
                  <AreaChart
                    h={320}
                    data={dashboardData.conversionTrend.length > 0 ? dashboardData.conversionTrend : emptyConversionTrend}
                    dataKey="period"
                    series={[{ name: 'conversions', color: primary }]}
                    curveType="monotone"
                    withTooltip
                    strokeWidth={1.5}
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
                        const { period, conversions } = payload[0].payload;
                        return (
                          <div className="bg-[#121420]/95 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[100px]">
                            <div className="flex flex-col gap-0.5">
                              <div className="text-[10px] text-zinc-400 mb-1">{period}</div>
                              <div className="text-sm font-bold text-white tracking-tight">{formatNumber(conversions)} conversions</div>
                              <div className="text-[10px] text-zinc-500 mt-1">
                                Progress: <span className="text-white font-medium">{getPercentageOfTarget(conversions, SALES_MONTHLY_TARGET / 4)}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      },
                    }}
                  />
                </div>
              </div>
            </NeoCard>

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
                Conversions By Offer
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
                        <div className="bg-[#121420]/95 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[100px]">
                          <div className="flex flex-col gap-0.5">
                            <div className="text-[10px] text-zinc-400 mb-1">{name}</div>
                            <div className="text-sm font-bold text-white tracking-tight">{formatNumber(value)} conversions</div>
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

            {/* Bottom row: Commissions full width */}
            <div className="md:col-span-2">
              <NeoCard
                variant="glass"
                className="p-4 md:p-6 backdrop-blur-xl border border-white/20 overflow-hidden"
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
                  Earning
                </Title>
                <div style={{ marginLeft: '-16px', marginRight: '-16px', marginBottom: '-16px', paddingLeft: 0, paddingRight: 0, paddingBottom: 0, width: 'calc(100% + 32px)' }}>
                  <AreaChart
                    h="clamp(12rem, 40vw, 16rem)"
                    data={dashboardData.commissionsOverTime.length > 0 ? dashboardData.commissionsOverTime : emptyCommissions}
                    dataKey="period"
                    series={[{ name: 'commission', color: primary }]}
                    curveType="monotone"
                    withXAxis={true}
                    withYAxis={true}
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
                    yAxisProps={{
                      tick: { fill: '#9CA3AF', fontSize: 11 },
                      tickLine: { stroke: '#374151' },
                      axisLine: { stroke: '#374151' },
                      width: 30
                    }}
                    tooltipProps={{
                      content: ({ payload }) => {
                        if (!payload || !payload[0]) return null;
                        const { period, commission } = payload[0].payload;
                        return (
                          <div className="bg-[#121420]/95 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[100px]">
                            <div className="flex flex-col gap-0.5">
                              <div className="text-[10px] text-zinc-400 mb-1">{period}</div>
                              <div className="text-sm font-bold text-white tracking-tight">₹{formatNumber(commission, true)}</div>
                              <div className="text-[10px] text-zinc-500 mt-1">
                                Progress: <span className="text-white font-medium">{getPercentageOfTarget(commission, COMMISSION_MONTHLY_TARGET / 4)}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      },
                    }}
                  />
                </div>
              </NeoCard>
            </div>
          </SimpleGrid>
        </>
      )}
    </Box>
  );
}