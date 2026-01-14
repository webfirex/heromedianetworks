"use client";
import { useEffect, useState } from 'react';
import { Card, Text, Table, Badge, Group, Skeleton } from '@mantine/core';
import { useSession } from 'next-auth/react';
import { showNotification } from '@/app/utils/notificationManager';
import { IconGift, IconCoin, IconMapPin, IconInfoCircle, IconCircleX, IconExternalLink } from '@tabler/icons-react';

interface Offer {
  id: number;
  name: string;
  payout: string;
  geo: string;
  description: string;
  offer_url: string;
  status: string;
  conversion_id: number;
}

export default function ApprovalPendingPage() {
  const { data: session } = useSession();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setError('You must be logged in as a publisher to view pending offers.');
          showNotification({
            title: '⚠️ Error',
            message: 'You must be logged in as a publisher to view pending offers.',
            withClose: false
          });
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/offers/approval-pending?publisher_id=${publisher_id}`);
        if (!res.ok) throw new Error('Failed to fetch pending offers');
        const data = await res.json();
        setOffers(data);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to fetch pending offers';
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
        <Text>No pending offers found.</Text>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconGift size={18} /> Name</Group></Table.Th>
              <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconCoin size={18} /> Payout</Group></Table.Th>
              <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconMapPin size={18} /> Geo</Group></Table.Th>
              <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconInfoCircle size={18} /> Description</Group></Table.Th>
              <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconCircleX size={18} /> Status</Group></Table.Th>
              <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconExternalLink size={18} /> Link</Group></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {offers.map((offer, index) => (
              <Table.Tr key={offer.conversion_id ?? `${offer.id}-${index}`}>
                <Table.Td>
                  <Text fw={500} style={{ fontSize: 16 }}>{offer.name}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge color="blue" variant="light" style={{ fontSize: 14 }}>{offer.payout}</Badge>
                </Table.Td>
                <Table.Td>
                  <Badge color="teal" variant="light" style={{ fontSize: 14 }}>{offer.geo}</Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed" lineClamp={2} style={{ fontSize: 14 }}>{offer.description}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge color="gray" variant="light" style={{ fontSize: 14 }}>{offer.status}</Badge>
                </Table.Td>
                <Table.Td>
                  {offer.offer_url && offer.offer_url.startsWith('http') ? (
                    <a href={offer.offer_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
                      Visit <IconExternalLink size={14} />
                    </a>
                  ) : (
                    <span style={{ color: '#aaa', fontSize: 14 }}>N/A</span>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  );
}
