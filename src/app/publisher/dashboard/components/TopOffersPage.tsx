"use client";
import { useEffect, useState } from 'react';
import { Card, Text, Table, Badge, Group, Skeleton, TextInput, Select, Tooltip, Pagination, Flex, CopyButton } from '@mantine/core';
import { useSession } from 'next-auth/react';
import { showNotification } from '@/app/utils/notificationManager';
import { IconGift, IconCoin, IconClick, IconExternalLink, IconCopy, IconMapPin, IconInfoCircle, IconSearch } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';

interface Offer {
  id: number;
  name: string;
  payout_info: string;
  geo: string;
  description: string;
  offer_url: string;
  clicks: number;
  status: string;
  updated_at: string;
  link_id: string; // ✅ added field
}


export default function MyOffersPage() {
  const { data: session } = useSession();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>('');
  const [activePage, setPage] = useState(1);
  const [totalOffersCount, setTotalOffersCount] = useState(0);
  const [publisherId, setPublisherId] = useState<string | null>(null); // <-- NEW
  const itemsPerPage = 15;
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1000);
    return () => { clearTimeout(handler); };
  }, [search]);

  useEffect(() => {
    const fetchOffers = async () => {
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
          setError('You must be logged in as a publisher to view offers.');
          setLoading(false);
          return;
        }
        setPublisherId(publisher_id); // <-- SET HERE
        // Only declare queryParams once
        const queryParams = new URLSearchParams();
        queryParams.append('publisher_id', publisher_id);
        if (debouncedSearch) queryParams.append('search', debouncedSearch);
        if (statusFilter) queryParams.append('status', statusFilter);
        queryParams.append('page', activePage.toString());
        const res = await fetch(`/api/publishers/offers?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch offers');
        const { offers: fetchedOffers, totalCount } = await res.json();
        setOffers(fetchedOffers);
        setTotalOffersCount(totalCount);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to fetch offers';
        setError(msg);
        showNotification({ title: '⚠️ Error', message: msg, withClose: false });
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, [session, debouncedSearch, statusFilter, activePage]);

  // Calculate totalPages based on totalOffersCount and itemsPerPage
  const totalPages = Math.ceil(totalOffersCount / itemsPerPage);

  if (loading) return (
    <Card shadow="md" radius="md" withBorder>
      <Skeleton height={40} width="100%" mb="sm" />
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
      <Group mb="md">
        <TextInput
          placeholder="Search offers by name or description"
          value={search}
          onChange={(event) => {
            setSearch(event.currentTarget.value);
            setPage(1);
          }}
          leftSection={<IconSearch size={16} />}
          style={{ flexGrow: 1 }}
        />
        <Select
          placeholder="Filter by status"
          data={[
            { value: 'active', label: 'Active' },
            { value: 'expired', label: 'Expired' },
            { value: '', label: 'All' }
          ]}
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          clearable
          style={{ width: isMobile ? '100%' : 'auto' }}
        />
      </Group>

      {offers.length === 0 && !loading ? ( // Add !loading to condition
        <Text>No offers found with the current filters.</Text>
      ) : (
        <>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th><Group gap={4} style={{ fontSize: 14 }}><IconGift size={18} /> Name</Group></Table.Th>
                <Table.Th><Group gap={4} style={{ fontSize: 14 }}><IconCoin size={18} /> Payout</Group></Table.Th>
                {!isMobile && <Table.Th><Group gap={4} style={{ fontSize: 14 }}><IconMapPin size={18} /> Geo</Group></Table.Th>}
                {!isMobile && <Table.Th><Group gap={4} style={{ fontSize: 14 }}><IconInfoCircle size={18} /> Description</Group></Table.Th>}
                {!isMobile && <Table.Th><Group gap={4} style={{ fontSize: 14 }}><IconClick size={18} /> Clicks</Group></Table.Th>}
                {!isMobile && <Table.Th><Group gap={4} style={{ fontSize: 14 }}><IconInfoCircle size={18} /> Status</Group></Table.Th>}
                <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconExternalLink size={18} /> Link</Group></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {offers.map((offer) => (
                <Table.Tr key={offer.id}>
                  <Table.Td>
                    <Text fw={500} style={{ fontSize: 14 }}>{offer.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color="blue" variant="light" style={{ fontSize: 14 }}>{offer.payout_info}</Badge>
                  </Table.Td>
                  {!isMobile && (
                    <Table.Td>
                      <Badge color="teal" variant="light" style={{ fontSize: 14 }}>{offer.geo}</Badge>
                    </Table.Td>
                  )}
                  {!isMobile && (
                    <Table.Td>
                      <Text size="sm" c="dimmed" lineClamp={2} style={{ fontSize: 14 }}>{offer.description}</Text>
                    </Table.Td>
                  )}
                  {!isMobile && (
                    <Table.Td>
                      <Badge color="green" variant="light" leftSection={<IconClick size={14} />} style={{ fontSize: 14 }}>{offer.clicks}</Badge>
                    </Table.Td>
                  )}
                  {!isMobile && (
                    <Table.Td>
                      {/* Render badge based on the actual status string from the backend */}
                      <Badge color={offer.status === 'active' ? 'green' : 'red'} variant="light" style={{ fontSize: 14 }}>
                        {offer.status}
                      </Badge>
                    </Table.Td>
                  )}
                  <Table.Td>
                    {offer.offer_url && publisherId && offer.link_id ? (
                      <CopyButton
                        value={`${window.location.origin}/api/track/click?offer_id=${offer.id}&pub_id=${publisherId}&link_id=${offer.link_id}`}
                        timeout={2000}
                      >
                        {({ copied, copy }) => (
                          <Tooltip label={copied ? "Copied to clipboard!" : "Click to copy tracking link"} withArrow position="right">
                            <span
                              onClick={copy}
                              style={{
                                cursor: 'pointer',
                                color: '#4169E1',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 14
                              }}
                            >
                              Copy <IconCopy size={14} />
                            </span>
                          </Tooltip>
                        )}
                      </CopyButton>
                    ) : (
                      <span style={{ color: '#aaa', fontSize: 14 }}>N/A</span>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          {totalPages > 1 && (
            <Flex justify="flex-end" mt="md">
              <Pagination
                total={totalPages}
                value={activePage}
                onChange={setPage}
              />
            </Flex>
          )}
        </>
      )}
    </Card>
  );
}