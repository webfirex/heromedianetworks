"use client"
import React, { useEffect, useState } from 'react';
import { Card, SimpleGrid, Grid, Box, Title, Text, Group, Stack, Badge, Flex, SemiCircleProgress } from '@mantine/core';
import { IconLayoutDashboard, IconCircleCheck, IconCurrencyDollar } from '@tabler/icons-react';
import { BarChart, PieChart, LineChart, AreaChart } from '@mantine/charts';
import { Skeleton } from '@mantine/core';
import { showNotification } from '@/app/utils/notificationManager';
import { useSession } from 'next-auth/react';

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
    <div style={{ padding: '0.5rem' }}>
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
                  background: '#151517',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.05)'
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
                    background: '#151517',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.05)'
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
              background: '#151517',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.05)',
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
                  background: '#151517',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.05)'
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
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xs" mb="sm">
            {[
              {
                icon: <IconLayoutDashboard size={28} color="#3B82F6" />,
                label: 'Total Clicks',
                value: dashboardData.totalClicks.toLocaleString(),
                accentColor: '#3B82F6',
              },
              {
                icon: <IconCircleCheck size={28} color="#10B981" />,
                label: 'Conversions',
                value: dashboardData.totalConversions.toLocaleString(),
                accentColor: '#10B981',
              },
              {
                icon: <IconCurrencyDollar size={28} color="#F59E0B" />,
                label: 'Total Earning',
                value: dashboardData.totalEarning.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                accentColor: '#F59E0B',
              },
            ].map((stat) => (
              <Card
                key={stat.label}
                shadow=""
                radius="26px"
                withBorder={false}
                p="lg"
                style={{
                  background: 'rgba(128, 128, 128, 0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(20px)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    background: 'rgba(128, 128, 128, 0.15)',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.4), inset 0 1px rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(25px)',
                  },
                }}
              >
                <Group align="flex-start" gap="md" wrap="nowrap">
                  <Box
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '16px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.2), inset 0 1px rgba(255,255,255,0.1)',
                      padding: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 56,
                      minHeight: 56,
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Stack gap={2} style={{ flex: 1 }}>
                    <Text
                      size="xs"
                      fw={500}
                      tt="uppercase"
                      style={{
                        letterSpacing: '0.5px',
                        color: '#8B94A7',
                        opacity: 0.8
                      }}
                    >
                      {stat.label}
                    </Text>
                    <Title
                      order={2}
                      style={{
                        fontWeight: 700,
                        color: '#E6EAF0',
                        fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                        lineHeight: 1.2,
                        marginTop: 4
                      }}
                    >
                      {stat.value}
                    </Title>
                  </Stack>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
          <Grid gutter="xs" mb="sm">
            {[
              {
                title: 'Clicks This Month',
                value: dashboardData.clicksThisMonth,
                percentage: clicksPercentageChange,
                trendColor: clicksTrendColor,
                target: CLICK_MONTHLY_TARGET,
                targetLabel: 'clicks',
              },
              {
                title: 'Sales This Month',
                value: dashboardData.salesThisMonth,
                percentage: salesPercentageChange,
                trendColor: salesTrendColor,
                target: SALES_MONTHLY_TARGET,
                targetLabel: 'sales',
              },
              {
                title: 'Commission This Month',
                value: dashboardData.commissionThisMonth,
                percentage: commissionPercentageChange,
                trendColor: commissionTrendColor,
                target: COMMISSION_MONTHLY_TARGET,
                targetLabel: 'commission',
                isCurrency: true,
              },
            ].map((item, index) => (
              <Grid.Col key={index} span={{ base: 12, sm: 6, lg: 4 }}>
                <Card
                  shadow=""
                  radius="26px"
                  withBorder={false}
                  p="lg"
                  style={{
                    overflow: 'hidden',
                    background: 'rgba(128, 128, 128, 0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <Flex justify="space-between" align="center" mb="xs">
                    <Title order={5} style={{ color: '#E6EAF0', fontWeight: 500, fontSize: 'clamp(0.9rem, 3vw, 1rem)' }}>
                      {item.title}
                    </Title>
                    <Group gap="xs" align="center">
                      {parseFloat(item.percentage) > 0 && <span style={{ color: '#22c55e' }}>▲</span>}
                      {parseFloat(item.percentage) < 0 && <span style={{ color: '#ef4444' }}>▼</span>}
                      {parseFloat(item.percentage) === 0 && <span style={{ color: 'rgba(255,255,255,0.5)' }}>─</span>}
                      <Text size="sm" c={item.trendColor === 'green' ? '#22c55e' : '#ef4444'} fw={600}>
                        {item.percentage}%
                      </Text>
                    </Group>
                  </Flex>
                  <Text
                    size="lg"
                    fw={700}
                    c={item.trendColor === 'green' ? '#22c55e' : '#ef4444'}
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      letterSpacing: '-0.5px',
                      margin: '0.25rem 0 0.75rem 0',
                      lineHeight: 1,
                      fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
                    }}
                  >
                    {item.isCurrency
                      ? item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : item.value.toLocaleString()}
                  </Text>
                  <Box
                    pos="relative"
                    style={{
                      width: '100%',
                      height: 'clamp(6rem, 30vw, 9rem)',
                      maxWidth: '20rem',
                      margin: '1rem auto',
                    }}
                  >
                    <SemiCircleProgress
                      value={Math.max(0, (item.value / item.target) * 100)}
                      thickness={30}
                      size={320}
                      color="var(--primary)"
                    />
                    <Box
                      pos="absolute"
                      top="70%"
                      left="50%"
                      style={{
                        transform: 'translate(-50%, -50%)',
                        zIndex: 2,
                        textAlign: 'center',
                        background: '#151517',
                        borderRadius: '999px',
                        padding: '0.4rem 1rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Text
                        size="xs"
                        c="var(--primary)"
                        fw={700}
                        title={`Your target for this month is ${item.target.toLocaleString()} ${item.targetLabel}.`}
                      >
                        Target: {item.target.toLocaleString()}
                      </Text>
                    </Box>
                  </Box>
                  <Text size="xs" c="dimmed" ta="center" mt="sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Progress towards monthly goal
                  </Text>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xs">
            <Card
              shadow=""
              radius="26px"
              withBorder={false}
              p="lg"
              style={{
                background: 'rgba(128, 128, 128, 0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
              }}
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
                Current Week Clicks
                <Text
                  size="xs"
                  style={{
                    display: 'block',
                    marginTop: '4px',
                    color: '#3B82F6',
                    fontWeight: 600
                  }}
                >
                  ▲ 5% (vs. last week)
                </Text>
              </Title>
              <BarChart
                h="clamp(12rem, 40vw, 16rem)"
                data={dashboardData.weeklyClicks.length > 0 ? dashboardData.weeklyClicks : emptyBarData}
                dataKey="day"
                series={[{ name: 'clicks', color: primary }]}
                withTooltip
                referenceLines={[
                  { values: (CLICK_MONTHLY_TARGET / 7).toString(), label: 'Daily Target', color: '#ef4444', strokeDasharray: '4 4' },
                ]}
                tooltipProps={{
                  cursor: { fill: 'rgba(66, 133, 244, 0.15)', stroke: 'transparent' },
                  wrapperStyle: { background: '#151517', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', color: '#fff' },
                  content: ({ payload }) => {
                    if (!payload || !payload[0]) return null;
                    const { day, clicks } = payload[0].payload;
                    const dailyAvgTarget = CLICK_MONTHLY_TARGET / 7;
                    const targetProgress = getPercentageOfTarget(clicks, dailyAvgTarget);
                    return (
                      <Box style={tooltipStyles}>
                        <Text fw={600} size="sm" style={{ color: '#fff' }}>{day}</Text>
                        <Text mt="xs" style={{ color: '#fff' }}>Total Clicks: <span style={{ fontWeight: 700 }}>{formatNumber(clicks)}</span></Text>
                        <Text style={{ color: '#fff' }}>Target Progress: <span style={{ color: Number(targetProgress) >= 100 ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>{targetProgress}%</span> of daily avg target</Text>
                      </Box>
                    );
                  },
                }}
              />
            </Card>
            <Card
              shadow=""
              radius="26px"
              withBorder={false}
              p="lg"
              style={{
                background: 'rgba(128, 128, 128, 0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
              }}
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
                Traffic Sources
              </Title>
              <PieChart
                h="clamp(12rem, 40vw, 16rem)"
                data={
                  dashboardData.trafficSources.length > 0
                    ? dashboardData.trafficSources.map((source, index) => ({
                        ...source,
                        color: getColorForSegment(source.name, index, chartColors),
                      }))
                    : emptyPieData
                }
                withTooltip
                tooltipProps={{
                  content: ({ payload }) => {
                    if (!payload || !payload[0]) return null;
                    const { name, value } = payload[0].payload;
                    const total = dashboardData.trafficSources.reduce((sum, src) => sum + (src.value || 0), 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                    return (
                      <Box style={tooltipStyles}>
                        <Text fw={600} style={{ color: '#fff' }}>{name || 'Unknown'}</Text>
                        <Text style={{ color: '#fff' }}>Clicks: {formatNumber(value)}</Text>
                        <Text style={{ color: '#fff' }}>Share: {percentage}%</Text>
                      </Box>
                    );
                  },
                }}
              />
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
            </Card>
            <Card
              shadow=""
              radius="26px"
              withBorder={false}
              p="lg"
              style={{
                background: 'rgba(128, 128, 128, 0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
              }}
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
                Clicks Over Time
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
            </Card>
            <Card
              shadow=""
              radius="26px"
              withBorder={false}
              p="lg"
              style={{
                background: 'rgba(128, 128, 128, 0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
              }}
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
            </Card>
            <Card
              shadow=""
              radius="26px"
              withBorder={false}
              p="lg"
              style={{
                background: 'rgba(128, 128, 128, 0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
              }}
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
            </Card>
            <Card
              shadow=""
              radius="26px"
              withBorder={false}
              p="lg"
              style={{
                background: 'rgba(128, 128, 128, 0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
              }}
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
            </Card>
          </SimpleGrid>
        </>
      )}
    </div>
  );
}