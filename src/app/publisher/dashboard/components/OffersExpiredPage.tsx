"use client";
import { useEffect, useState } from 'react';
import { Card, Text, Table, Badge, Group, Skeleton } from '@mantine/core';
import { useSession } from 'next-auth/react';
import { showNotification } from '@/app/utils/notificationManager';
import { IconGift, IconCoin, IconMapPin, IconInfoCircle, IconCalendarX } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks'; // Import useMediaQuery

interface Offer {
  id: number;
  name: string;
  payout: string;
  geo: string;
  description: string;
  offer_url: string;
  expired_at: string;
}

export default function OffersExpiredPage() {
  const { data: session } = useSession();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define a media query for mobile screens (e.g., max-width of 768px)
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      setError(null);
      try {
        let publisher_id = session?.user?.id;
        if (!publisher_id && session?.user?.email) {
          // Try to fetch publisher_id using email
          const res = await fetch(`/api/publisher/id?email=${encodeURIComponent(session.user.email)}`);
          if (res.ok) {
            const data = await res.json();
            publisher_id = data.id;
          }
        }
        if (!publisher_id) {
          setError('You must be logged in as a publisher to view expired offers.');
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/offers/expired?publisher_id=${publisher_id}`);
        if (!res.ok) throw new Error('Failed to fetch expired offers');
        const data = await res.json();
        setOffers(data);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to fetch expired offers';
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
    fetchOffers();
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
      {offers.length === 0 ? (
        <Text>No expired offers found.</Text>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              {/* Always show Name */}
              <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconGift size={18} /> Name</Group></Table.Th>
              {/* Hide Payout on mobile */}
              {!isMobile && <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconCoin size={18} /> Payout</Group></Table.Th>}
              {/* Hide Geo on mobile */}
              {!isMobile && <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconMapPin size={18} /> Geo</Group></Table.Th>}
              {/* Hide Description on mobile */}
              {!isMobile && <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconInfoCircle size={18} /> Description</Group></Table.Th>}
              {/* Always show Expired At */}
              <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconCalendarX size={18} /> Expired At</Group></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {offers.map((offer) => (
              <Table.Tr key={offer.id}>
                <Table.Td>
                  <Text fw={500} style={{ fontSize: 16 }}>{offer.name}</Text>
                </Table.Td>
                {!isMobile && (
                  <Table.Td>
                    <Badge color="blue" variant="light" style={{ fontSize: 14 }}>{offer.payout}</Badge>
                  </Table.Td>
                )}
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
                <Table.Td>
                  <Badge color="gray" variant="light" style={{ fontSize: 14 }}>{new Date(offer.expired_at).toLocaleString()}</Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  );
}