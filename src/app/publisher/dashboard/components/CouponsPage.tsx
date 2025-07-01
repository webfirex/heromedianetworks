'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Card, Text, Table, Badge, Group, Skeleton, Button, Flex,
  TextInput, Select
} from '@mantine/core';
import { useSession } from 'next-auth/react';
import { showNotification } from '@/app/utils/notificationManager';
import {
  IconDiscount, IconGift, IconInfoCircle,
  IconCalendar, IconPercentage, IconCheck, IconSearch
} from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface Coupon {
  id: number;
  code: string;
  description: string;
  offer_name: string;
  valid_from: string;
  valid_to: string;
  offer_id: number;
  discount_value: string;
  status: 'active' | 'expired';
}

export default function CouponsPage() {
  const { data: session } = useSession();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Debounce the search input with a 500ms delay (increased for better effect)
  const debouncedSearch = useDebounce(search, 1000);

  // Memoize session to prevent unnecessary re-renders
  const stableSession = useMemo(
    () => ({
      user: {
        id: session?.user?.id,
        email: session?.user?.email,
      },
    }),
    [session] // Include session as a dependency
  );

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let publisher_id = stableSession?.user?.id;
      if (!publisher_id && stableSession?.user?.email) {
        const res = await fetch(`/api/publisher/id?email=${encodeURIComponent(stableSession.user.email)}`);
        if (res.ok) {
          const data = await res.json();
          publisher_id = data.id;
        }
      }
      if (!publisher_id) {
        setError('You must be logged in as a publisher to view coupons.');
        setLoading(false);
        return;
      }

      const query = new URLSearchParams({
        publisher_id: String(publisher_id),
        page: String(page),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const res = await fetch(`/api/publishers/coupons?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch coupons');
      const data = await res.json();
      setCoupons(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch coupons';
      setError(msg);
      showNotification({
        title: '⚠️ Error',
        message: msg,
        withClose: false
      });
    } finally {
      setLoading(false);
    }
  }, [stableSession, page, debouncedSearch, statusFilter]);

  // Trigger fetchCoupons only when specific dependencies change
  useEffect(() => {
    fetchCoupons();
  }, [page, debouncedSearch, statusFilter, fetchCoupons]);

  if (loading) {
    return (
      <Card shadow="md" radius="md" withBorder>
        <Skeleton height={32} width="40%" mb="md" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} height={40} width="100%" mb="sm" />
        ))}
      </Card>
    );
  }

  if (error) return null;

  const showPagination = coupons.length >= itemsPerPage || page > 1;

  return (
    <Card shadow="md" radius="md" withBorder>
      <Flex gap="md" mb="md" direction={isMobile ? 'column' : 'row'}>
        <TextInput
          leftSection={<IconSearch size={16} />}
          placeholder="Search by code or offer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)} // Only update search state
          style={{ flexGrow: 1, minWidth: '250px' }}
        />
        <Select
          placeholder="Filter status"
          value={statusFilter}
          onChange={(value) => {
            if (value) {
              setPage(1);
              setStatusFilter(value as 'all' | 'active' | 'expired');
            }
          }}
          data={[
            { label: 'All', value: 'all' },
            { label: 'Active', value: 'active' },
            { label: 'Expired', value: 'expired' }
          ]}
        />
      </Flex>

      {coupons.length === 0 ? (
        <Text>No coupons found.</Text>
      ) : (
        <>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconDiscount size={18} /> Code</Group></Table.Th>
                {!isMobile && <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconInfoCircle size={18} /> Description</Group></Table.Th>}
                <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconGift size={18} /> Offer</Group></Table.Th>
                {!isMobile && <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconCalendar size={18} /> Valid From</Group></Table.Th>}
                {!isMobile && <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconCalendar size={18} /> Valid To</Group></Table.Th>}
                <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconPercentage size={18} /> Discount</Group></Table.Th>
                <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconCheck size={18} /> Status</Group></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {coupons.map((coupon) => (
                <Table.Tr key={coupon.id}>
                  <Table.Td><Text style={{ fontSize: 14 }}>{coupon.code}</Text></Table.Td>
                  {!isMobile && (
                    <Table.Td>
                      <Text size="sm" c="dimmed" lineClamp={2} style={{ fontSize: 14 }}>{coupon.description}</Text>
                    </Table.Td>
                  )}
                  <Table.Td><Text style={{ fontSize: 14 }}>{coupon.offer_name}</Text></Table.Td>
                  {!isMobile && (
                    <Table.Td>
                      <Badge color="gray" variant="light" style={{ fontSize: 14 }}>
                        {new Date(coupon.valid_from).toLocaleDateString()}
                      </Badge>
                    </Table.Td>
                  )}
                  {!isMobile && (
                    <Table.Td>
                      <Badge color="gray" variant="light" style={{ fontSize: 14 }}>
                        {new Date(coupon.valid_to).toLocaleDateString()}
                      </Badge>
                    </Table.Td>
                  )}
                  <Table.Td>
                    <Badge color="blue" variant="light" style={{ fontSize: 14 }}>
                      {coupon.discount_value}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={coupon.status === 'active' ? 'green' : 'red'}
                      variant="filled"
                      style={{ fontSize: 14 }}
                    >
                      {coupon.status}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {showPagination && (
            <Flex justify="space-between" mt="md">
              <Button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="light"
              >
                Previous
              </Button>
              <Text size="sm" c="dimmed">Page {page}</Text>
              <Button
                onClick={() => setPage((p) => p + 1)}
                disabled={coupons.length < itemsPerPage}
                variant="light"
              >
                Next
              </Button>
            </Flex>
          )}
        </>
      )}
    </Card>
  );
}