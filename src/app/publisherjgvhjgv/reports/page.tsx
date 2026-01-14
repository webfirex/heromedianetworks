'use client';

import {
  Container,
  Card,
  Group,
  Button,
  Text,
  Select,
  Table,
  Badge,
  Skeleton,
} from '@mantine/core';
import { useState, useEffect } from 'react';
import { IconCoin, IconClick, IconGift } from '@tabler/icons-react';
import { DateInput } from '@mantine/dates';
import { useMediaQuery } from '@mantine/hooks'; // Import useMediaQuery

type ReportRow = { offer: string; clicks: number; conversions: number; revenue: string; date: string };

export default function PublisherReportsPage() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [offer, setOffer] = useState<string | null>(null);
  const [offers, setOffers] = useState<{ id: number; name: string }[]>([]);
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Define a media query for mobile screens (e.g., max-width of 768px)
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Fetch offers for the select
  useEffect(() => {
    fetch('/api/offers/display')
      .then(res => res.json())
      .then(setOffers)
      .catch(() => setOffers([]));
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    let url = '/api/reports?';
    if (offer) url += `offer=${encodeURIComponent(offer)}&`;
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}&`;
    const res = await fetch(url);
    const data = await res.json();
    setReportRows(data);
    setLoading(false);
  };

  // Fetch initial report data on mount
  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen">
      <Container size="xl">
        {/* Filters */}
        <Card withBorder radius="md" shadow="sm" className="mb-8 p-6 bg-white">
          <Group wrap="wrap" justify="space-between" align="end" className="gap-y-4">
            {/* Offer Select */}
            <div className="w-full sm:w-[32%]">
              <Text size="sm" fw={600} className="mb-1" style={{ color: 'var(--primary)' }}>Select Offer</Text>
              <Select
                placeholder="Choose an offer"
                data={offers.map(o => ({ value: o.name, label: o.name }))}
                value={offer}
                onChange={setOffer}
                searchable
                clearable
              />
            </div>

            {/* Start Date */}
            <div className="w-full sm:w-[30%]">
              <Text size="sm" fw={600} className="mb-1" style={{ color: 'var(--primary)' }}>Start Date</Text>
              <DateInput
                value={startDate ? new Date(startDate) : null}
                onChange={(date) => setStartDate(date ? date.toString().slice(0, 10) : '')}
                placeholder="Pick start date"
                className="w-full"
                size="sm"
                clearable
                styles={{ input: { borderColor: '#ced4da', borderRadius: 6, fontSize: 14, padding: '10px 12px' } }}
              />
            </div>

            {/* End Date */}
            <div className="w-full sm:w-[30%]">
              <Text size="sm" fw={600} className="mb-1 text-[#622DCD]">End Date</Text>
              <DateInput
                value={endDate ? new Date(endDate) : null}
                onChange={(date) => setEndDate(date ? date.toString().slice(0, 10) : '')}
                placeholder="Pick end date"
                className="w-full"
                size="sm"
                clearable
                styles={{ input: { borderColor: '#ced4da', borderRadius: 6, fontSize: 14, padding: '10px 12px' } }}
              />
            </div>

            {/* Apply Button */}
            <Button style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }} size="md" className="w-full sm:w-auto mt-2" onClick={fetchReports} loading={loading}>
              Apply Filters
            </Button>
          </Group>
        </Card>

        {/* Report Table */}
        <div style={{ marginTop: 12 }} />
        <Card withBorder radius="md" shadow="sm" className="bg-white p-6">
          <Table highlightOnHover withTableBorder striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ fontSize: 15 }}><Group gap={4}><IconGift size={18} /> Offer</Group></Table.Th>
                {/* Conditionally hide Clicks and Conversions on mobile */}
                {!isMobile && <Table.Th style={{ fontSize: 15 }}><Group gap={4}><IconClick size={18} /> Clicks</Group></Table.Th>}
                {!isMobile && <Table.Th style={{ fontSize: 15 }}><Group gap={4}><IconCoin size={18} /> Conversions</Group></Table.Th>}
                <Table.Th style={{ fontSize: 15 }}><Group gap={4}><IconCoin size={18} /> Revenue</Group></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <Table.Tr key={idx}>
                    <Table.Td><Skeleton height={22} width={120} radius="sm" /></Table.Td>
                    {!isMobile && <Table.Td><Skeleton height={22} width={60} radius="sm" /></Table.Td>}
                    {!isMobile && <Table.Td><Skeleton height={22} width={60} radius="sm" /></Table.Td>}
                    <Table.Td><Skeleton height={22} width={80} radius="sm" /></Table.Td>
                  </Table.Tr>
                ))
              ) : reportRows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={isMobile ? 2 : 4} style={{ textAlign: 'center', color: '#888', fontSize: 14 }}>
                    No report data available. Please select filters and try again.
                  </Table.Td>
                </Table.Tr>
              ) : (
                reportRows.map((row, idx) => (
                  <Table.Tr key={idx}>
                    <Table.Td>
                      <Text fw={500} style={{ fontSize: 16 }}>{row.offer}</Text>
                    </Table.Td>
                    {/* Conditionally hide Clicks and Conversions data on mobile */}
                    {!isMobile && (
                      <Table.Td>
                        <Badge color="blue" variant="light" style={{ fontSize: 14 }}>{row.clicks}</Badge>
                      </Table.Td>
                    )}
                    {!isMobile && (
                      <Table.Td>
                        <Badge color="green" variant="light" style={{ fontSize: 14 }}>{row.conversions}</Badge>
                      </Table.Td>
                    )}
                    <Table.Td>
                      <Badge color="yellow" variant="light" style={{ fontSize: 14 }}>{row.revenue}</Badge>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Card>
      </Container>
    </div>
  );
}