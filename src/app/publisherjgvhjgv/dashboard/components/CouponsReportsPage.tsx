"use client";
import { useEffect, useState } from 'react';
import { Card, Text, Table, Badge, Group, Skeleton } from '@mantine/core';
import { useSession } from 'next-auth/react';
import { showNotification } from '@/app/utils/notificationManager';
import { IconDiscount, IconGift, IconCoin } from '@tabler/icons-react';

interface CouponReport {
  id: number;
  code: string;
  offer_name: string;
  total_uses: number;
  total_revenue: number;
}

export default function CouponsReportsPage() {
  const { data: session } = useSession();
  const [reports, setReports] = useState<CouponReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
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
          setError('You must be logged in as a publisher to view coupon reports.');
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/offers/coupons-reports?publisher_id=${publisher_id}`);
        if (!res.ok) throw new Error('Failed to fetch coupon reports');
        const data = await res.json();
        setReports(data);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to fetch coupon reports';
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
    fetchReports();
  }, [session]);

  if (loading) return (
    <Card shadow="md" radius="md" withBorder>
      <Skeleton height={32} width="40%" mb="md" />
      <Skeleton height={40} width="100%" mb="sm" />
      <Skeleton height={40} width="100%" mb="sm" />
      <Skeleton height={40} width="100%" mb="sm" />
      <Skeleton height={40} width="100%" mb="sm" />
      <Skeleton height={40} width="100%" mb="sm" />
    </Card>
  );
  if (error) return null;

  return (
    <Card shadow="md" radius="md" withBorder>
      {reports.length === 0 ? (
        <Text>No coupon reports found.</Text>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconDiscount size={18} /> Code</Group></Table.Th>
              <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconGift size={18} /> Offer</Group></Table.Th>
              <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconCoin size={18} /> Total Uses</Group></Table.Th>
              <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconCoin size={18} /> Total Revenue</Group></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {reports.map((report) => (
              <Table.Tr key={report.id}>
                <Table.Td>
                  <Text variant="light" style={{ fontSize: 14 }}>{report.code}</Text>
                </Table.Td>
                <Table.Td>
                  <Text  variant="light" style={{ fontSize: 14 }}>{report.offer_name}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge color="green" variant="light" style={{ fontSize: 14 }}>{report.total_uses}</Badge>
                </Table.Td>
                <Table.Td>
                  <Badge color="yellow" variant="light" style={{ fontSize: 14 }}>{report.total_revenue}</Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  );
}
