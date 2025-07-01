"use client";
import React, { useEffect, useState } from 'react';
import { Card, SimpleGrid, Box, Title, Text, Group, Stack, rem, Badge } from '@mantine/core';
import { IconLayoutDashboard, IconCircleCheck, IconCurrencyRupee, IconFileCheck } from '@tabler/icons-react';
import { Skeleton } from '@mantine/core';
import { showNotification } from '@/app/utils/notificationManager'; // Assuming this path is correct
import { BarChart, PieChart, LineChart, AreaChart } from '@mantine/charts';

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
}


// Example chart colors (you would define your actual color palette)
const chartColors = ['#4169E1', '#43a047', '#ff9800', '#1976d2', '#EF5350', '#8D6E63', '#AB47BC', '#26A69A'];

const primary = '#4169E1'; // Example primary color, replace with your actual primary color

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
  background: '#fff',
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  borderRadius: rem(8),
  border: '1px solid #e0e0e0',
  color: '#333',
  padding: rem(10),
  fontSize: rem(14),
};

const getColorForSegment = (name: string, index: number, palette: string[]) => {
  return palette[index % palette.length];
};
// --- End Dummy Data and Helper Functions ---


const AdminDashboardContent = () => {
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
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Updated the API endpoint to use the new admin dashboard route
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching admin dashboard data...');
        const res = await fetch('/api/admin/dashboard', { method: 'GET', headers: { 'Content-Type': 'application/json' } });

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
  }, []);

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
        background: '#f8f8f8',
        borderRadius: rem(8),
        border: `1px dashed #ddd`, // Changed to template literal for rem(8) which was incorrect
        color: '#888',
        textAlign: 'center',
        padding: rem(20),
      }}
    >
      <Text size="md" fw={500}>{message}</Text>
    </Box>
  );

  return (
    <div style={{ overflow: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style>
        {`
          div::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      {loading ? (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm" mb="sm">
            {[...Array(4)].map((_, i) => (
              <Card key={i} shadow="md" radius="md" withBorder>
                <Skeleton height={rem(32)} width="60%" mb="sm" />
                <Skeleton height={rem(24)} width="40%" />
              </Card>
            ))}
          </SimpleGrid>
        </>
      ) : error ? (
        <Text color="red">{error}</Text>
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="xs" mb="sm">
            {[
              {
                icon: <IconLayoutDashboard size={28} color="#4169E1" />,
                label: 'Total Clicks',
                value: safeValue(dashboardData.totalClicks).toLocaleString(),
                bg: '#e3f0ff',
              },
              {
                icon: <IconCircleCheck size={28} color="#43a047" />,
                label: 'Conversions',
                value: safeValue(dashboardData.totalConversions).toLocaleString(),
                bg: '#e8f5e9',
              },
              {
                icon: <IconCurrencyRupee size={28} color="#ff9800" />,
                label: 'Total Earning',
                value: safeValue(dashboardData.totalEarnings).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                bg: '#fff3e0',
              },
              {
                icon: <IconFileCheck size={28} color="#1976d2" />,
                label: 'Approvals',
                value: safeValue(dashboardData.totalApprovals).toLocaleString(),
                bg: '#e3f2fd',
              },
            ].map((stat) => (
              <Card key={stat.label} shadow="md" radius="lg" withBorder p="lg" style={{ background: stat.bg, boxShadow: '0 2px 12px 0 rgba(65,105,225,0.06)' }}>
                <Group align="flex-start" gap="md" wrap="nowrap">
                  <Box style={{
                    background: '#fff',
                    borderRadius: '50%',
                    boxShadow: '0 2px 8px 0 rgba(65,105,225,0.08)',
                    padding: rem(12),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: rem(48),
                    minHeight: rem(48),
                  }}>
                    {stat.icon}
                  </Box>
                  <Stack gap={0} style={{ flex: 1 }}>
                    <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: rem(1) }}>{stat.label}</Text>
                    <Title order={2} style={{ fontWeight: 800, color: '#222', fontSize: rem(28), lineHeight: 1.1 }}>{stat.value}</Title>
                  </Stack>
                </Group>
              </Card>
            ))}
          </SimpleGrid>

          <Box>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xs">
              {/* Weekly Clicks Bar Chart */}
              <Card shadow="sm" radius="md" withBorder>
                <Title order={4} style={{ color: primary }} mb="sm">
                  Weekly Clicks
                  <Text size="sm" color="dimmed" style={{ display: 'block', marginTop: rem(4) }}>
                    Performance (Last 7 Days): <span style={{ color: 'green', fontWeight: 600 }}>▲ 5% (vs. last week)</span>
                  </Text>
                </Title>

                <BarChart
                  h={250}
                  data={chartData}
                  dataKey="day"
                  series={[{ name: 'clicks', color: primary }]}
                  withTooltip
                  referenceLines={[
                    {
                      values: (CLICK_MONTHLY_TARGET / 7).toString(),
                      label: 'Daily Target',
                      color: 'red',
                      strokeDasharray: '4 4',
                    },
                  ]}
                  tooltipProps={{
                    cursor: { fill: 'rgba(66, 133, 244, 0.15)', stroke: 'transparent' },
                    wrapperStyle: tooltipStyles,
                    content: ({ payload }) => {
                      if (!payload || !payload[0]) return null;
                      const { day, clicks } = payload[0].payload;
                      const dailyAvgTarget = CLICK_MONTHLY_TARGET / 7;
                      const targetProgress = getPercentageOfTarget(clicks, dailyAvgTarget);

                      return (
                        <Box style={tooltipStyles}>
                          <Text fw={600} size="md">{day}</Text>
                          <Text mt="xs">
                            Total Clicks: <span style={{ fontWeight: 700 }}>{formatNumber(clicks)}</span>
                          </Text>
                          <Text>
                            Target Progress:{' '}
                            <span style={{ color: Number(targetProgress) >= 100 ? 'green' : 'orange', fontWeight: 700 }}>
                              {targetProgress}%
                            </span>{' '}
                            of daily avg target
                          </Text>
                        </Box>
                      );
                    },
                  }}
                />
              </Card>

              {/* Traffic Sources Pie Chart */}
              <Card shadow="sm" radius="md" withBorder>
                <Title order={4} style={{ color: primary }} mb="sm">Traffic Sources</Title>

                {safeArray(dashboardData.trafficSources).length > 0 ? (
                  <>
                    <PieChart
                      h={250}
                      data={
                        dashboardData.trafficSources.map((source, index) => ({
                          ...source,
                          color: getColorForSegment(source.name, index, chartColors),
                        }))
                      }
                      withTooltip
                      tooltipProps={{
                        wrapperStyle: tooltipStyles,
                        content: ({ payload }) => {
                          if (!payload || !payload[0]) return null;
                          const { name, value } = payload[0].payload;
                          const total = safeArray(dashboardData.trafficSources).reduce((sum, src) => sum + (src.value || 0), 0);
                          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                          return (
                            <Box style={tooltipStyles}>
                              <Text fw={600}>{name || 'Unknown'}</Text>
                              <Text>Clicks: {formatNumber(value)}</Text>
                              <Text>Share: {percentage}%</Text>
                            </Box>
                          );
                        },
                      }}
                    />
                    <Box mt={10} style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <Group gap={12} style={{ flexWrap: 'wrap' }}>
                        {dashboardData.trafficSources.map((source, idx) => (
                          <Group key={source.name || `source-${idx}`} gap={6} align="center">
                            <Box w={14} h={14} style={{ borderRadius: rem(4), background: getColorForSegment(source.name, idx, chartColors), border: `1.5px solid #e0e0e0` }} />
                            <Text size="sm" fw={600} style={{ color: '#333', letterSpacing: rem(0.2) }}>{source.name || 'Unknown'}</Text>
                            <Badge color="gray" variant="light" size="xs" radius="sm" style={{ fontWeight: 500 }}>
                              {formatNumber(source.value)}
                            </Badge>
                          </Group>
                        ))}
                      </Group>
                    </Box>
                  </>
                ) : (
                  <NoDataMessage message="No traffic source data available." />
                )}
              </Card>

              {/* Clicks Over Time Line Chart */}
              <Card shadow="sm" radius="md" withBorder>
                <Title order={4} style={{ color: primary }} mb="sm">
                  Clicks Over Time
                  <Text size="sm" color="dimmed" style={{ display: 'block', marginTop: rem(4) }}>
                    Monthly Trend (Last 30 Days): <span style={{ color: 'green', fontWeight: 600 }}>▲ 12% (vs. previous month)</span>
                  </Text>
                </Title>
                {safeArray(dashboardData.clicksOverTime).length > 0 ? (
                  <LineChart
                    h={250}
                    data={dashboardData.clicksOverTime}
                    dataKey="period"
                    series={[
                      { name: 'clicks', color: primary }
                    ]}
                    curveType="monotone"
                    withTooltip
                    referenceLines={[
                    { values: (CLICK_MONTHLY_TARGET / 4).toString(), label: 'Monthly Avg Target', color: 'red', strokeDasharray: '4 4' }
                  ]}
                    tooltipProps={{
                      wrapperStyle: tooltipStyles,
                      content: ({ payload }) => {
                        if (!payload || !payload[0]) return null;
                        // Payload might contain `clicks` directly if series name is 'clicks'
                        const { period, clicks } = payload[0].payload;
                        const weeklyAvgTarget = CLICK_MONTHLY_TARGET / 4;
                        const targetProgress = getPercentageOfTarget(clicks, weeklyAvgTarget);
                        return (
                          <Box style={tooltipStyles}>
                            <Text fw={600} size="md">{period}</Text>
                            <Text mt="xs">Total Clicks: <span style={{ fontWeight: 700 }}>{formatNumber(clicks)}</span></Text>
                            <Text>Target Progress: <span style={{ color: Number(targetProgress) >= 100 ? 'green' : 'orange', fontWeight: 700 }}>{targetProgress}%</span> of weekly avg target</Text>
                          </Box>
                        );
                      },
                    }}
                  />
                ) : (
                  <NoDataMessage message="No click data available for the selected period.<br />Please adjust your date range or check back later!" />
                )}
              </Card>

              {/* Conversion Trend Area Chart */}
              <Card shadow="sm" radius="md" withBorder>
                <Title order={4} style={{ color: primary }} mb="sm">
                  Conversion Trend
                  <Text size="sm" color="dimmed" style={{ display: 'block', marginTop: rem(4) }}>
                    Overall Trend: <span style={{ color: 'green', fontWeight: 600 }}>▲ 7% (vs. previous period)</span>
                  </Text>
                </Title>
                {safeArray(dashboardData.conversionTrend).length > 0 ? (
                  <AreaChart
                    h={250}
                    data={dashboardData.conversionTrend}
                    dataKey="period"
                    series={[{ name: 'conversions', color: primary }]} // Changed to 'conversions'
                    curveType="monotone"
                    withTooltip
                    tooltipProps={{
                      wrapperStyle: tooltipStyles,
                      content: ({ payload }) => {
                        if (!payload || !payload[0]) return null;
                        const { period, conversions } = payload[0].payload; // Updated to 'conversions'
                        const periodAvgTarget = CONVERSION_MONTHLY_TARGET / (safeArray(dashboardData.conversionTrend).length || 1);
                        const targetProgress = getPercentageOfTarget(conversions, periodAvgTarget);
                        return (
                          <Box style={tooltipStyles}>
                            <Text fw={600}>{period}</Text>
                            <Text mt="xs">Conversions: <span style={{ fontWeight: 700 }}>{formatNumber(conversions)}</span></Text>
                            <Text>Target Progress: <span style={{ color: Number(targetProgress) >= 100 ? 'green' : 'orange', fontWeight: 700 }}>{targetProgress}%</span> of expected</Text>
                          </Box>
                        );
                      },
                    }}
                  />
                ) : (
                  <NoDataMessage message="No conversion trend data available." />
                )}
              </Card>


            </SimpleGrid>
          </Box>
        </>
      )}
    </div>
  );
};

export default AdminDashboardContent;