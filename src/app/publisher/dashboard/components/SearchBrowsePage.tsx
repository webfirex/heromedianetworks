"use client";
import { useEffect, useState } from 'react';
import { Card, Text, Table, TextInput, Button, Group, Badge, Skeleton } from '@mantine/core';
import { IconExternalLink, IconGift, IconCoin, IconMapPin, IconInfoCircle } from '@tabler/icons-react'; // Import additional icons
import { showNotification } from '@/app/utils/notificationManager';
import { useMediaQuery } from '@mantine/hooks'; // Import useMediaQuery

interface Offer {
  id: number;
  name: string;
  payout: string;
  geo: string;
  description: string;
  offer_url: string;
}

export default function SearchBrowsePage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Define a media query for mobile screens (e.g., max-width of 768px)
  const isMobile = useMediaQuery('(max-width: 768px)');

  const fetchOffers = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/offers/display?search=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Failed to fetch offers');
      const data = await res.json();
      setOffers(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch offers';
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

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOffers(search);
  };

  if (error) return null;

  return (
    <Card shadow="md" radius="md" withBorder style={{ background: '#f9fafb' }}>
      <form onSubmit={handleSearch}>
        <Group mb="md" align="end" wrap="wrap" style={{ gap: 12 }}>
          <TextInput
            placeholder="Search by name, geo, description..."
            value={search}
            onChange={e => setSearch(e.currentTarget.value)}
            style={{ flex: 1, minWidth: isMobile ? '100%' : 260 }} // Full width on mobile
            size="md"
          />
          <Button type="submit" size="md" style={{ minWidth: 120, width: isMobile ? '100%' : 'auto' }}> {/* Full width button on mobile */}
            Search
          </Button>
        </Group>
      </form>
      <Text size="lg" fw={600} mb={18} color="#2563eb" style={{ letterSpacing: 0.2 }}>Browse Offers</Text>
      <div style={{ overflowX: 'auto' }}>
        {loading ? (
          <Table striped highlightOnHover withTableBorder style={{ minWidth: isMobile ? 'auto' : 900 }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ fontSize: 15 }}><Group gap={4}><IconGift size={18} /> Name</Group></Table.Th>
                <Table.Th style={{ fontSize: 15 }}><Group gap={4}><IconCoin size={18} /> Payout</Group></Table.Th>
                {!isMobile && <Table.Th style={{ fontSize: 15 }}><Group gap={4}><IconMapPin size={18} /> Geo</Group></Table.Th>}
                {!isMobile && <Table.Th style={{ fontSize: 15 }}><Group gap={4}><IconInfoCircle size={18} /> Description</Group></Table.Th>}
                <Table.Th style={{ fontSize: 15 }}><Group gap={4}><IconExternalLink size={16} /> Link</Group></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {Array.from({ length: 5 }).map((_, idx) => (
                <Table.Tr key={idx}>
                  <Table.Td><Skeleton height={22} width={120} radius="sm" /></Table.Td>
                  <Table.Td><Skeleton height={22} width={70} radius="sm" /></Table.Td>
                  {!isMobile && <Table.Td><Skeleton height={22} width={60} radius="sm" /></Table.Td>}
                  {!isMobile && <Table.Td><Skeleton height={22} width={200} radius="sm" /></Table.Td>}
                  <Table.Td><Skeleton height={22} width={80} radius="sm" /></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Table striped highlightOnHover withTableBorder style={{ minWidth: isMobile ? 'auto' : 900 }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ fontSize: 15 }}><Group gap={4}><IconGift size={18} /> Name</Group></Table.Th>
                <Table.Th style={{ fontSize: 15 }}><Group gap={4}><IconCoin size={18} /> Payout</Group></Table.Th>
                {!isMobile && <Table.Th style={{ fontSize: 15 }}><Group gap={4}><IconMapPin size={18} /> Geo</Group></Table.Th>}
                {!isMobile && <Table.Th style={{ fontSize: 15 }}><Group gap={4}><IconInfoCircle size={18} /> Description</Group></Table.Th>}
                <Table.Th style={{ fontSize: 15 }}><Group gap={4}><IconExternalLink size={16} /> Link</Group></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {offers.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={isMobile ? 3 : 5} style={{ textAlign: 'center', color: '#888', fontSize: 14 }}>
                    No offers found.
                  </Table.Td>
                </Table.Tr>
              ) : (
                offers.map((offer) => (
                  <Table.Tr key={offer.id}>
                    <Table.Td>
                      <Text fw={500} style={{ fontSize: 16 }}>{offer.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color="yellow" variant="light" style={{ fontSize: 14 }}>{offer.payout}</Badge>
                    </Table.Td>
                    {!isMobile && (
                      <Table.Td>
                        <Badge color="blue" variant="light" style={{ fontSize: 14 }}>{offer.geo}</Badge>
                      </Table.Td>
                    )}
                    {!isMobile && (
                      <Table.Td>
                        <Text size="sm" style={{ fontSize: 14, maxWidth: 320 }} lineClamp={2}>{offer.description}</Text>
                      </Table.Td>
                    )}
                    <Table.Td>
                      {offer.offer_url && offer.offer_url.startsWith('http') ? (
                        <a href={offer.offer_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <IconExternalLink size={18} />
                        </a>
                      ) : (
                        <span style={{ color: '#aaa' }}>N/A</span>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        )}
      </div>
    </Card>
  );
}