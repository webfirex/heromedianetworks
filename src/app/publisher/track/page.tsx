'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Card,
  Table,
  Text,
  Stack,
  Group,
  Alert,
  Badge,
  ScrollArea,
  Skeleton,
  Button,
  Tooltip,
} from '@mantine/core';
import {
  IconClick,
  IconCoin,
  IconAlertCircle,
  IconExternalLink,
  IconGift, // Added for Offer Name header
} from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';

type OfferStats = {
  id: string;
  name: string;
  offer_url: string;
  total_clicks: number;
  total_conversions: number;
  last_click_id?: string;
};

export default function PublisherTrackPage() {
  const { data: session } = useSession();
  const [offers, setOffers] = useState<OfferStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm] = useState(''); // searchTerm is currently unused in filtering, but kept for potential future use

  const isMobile = useMediaQuery('(max-width: 768px)');
  const isVerySmall = useMediaQuery('(max-width: 480px)'); // Extra breakpoint for very small screens

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const pub_id = session?.user?.email;
        if (!pub_id) {
          // If no publisher ID, no offers to fetch, but don't set an error unless it's a login issue.
          setOffers([]);
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/track/display?pub_id=${encodeURIComponent(pub_id)}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const json = await res.json();
        if (json && Array.isArray(json.offers)) {
          setOffers(json.offers);
        } else {
          setOffers([]);
          console.warn("API response for /api/track/display did not contain an 'offers' array:", json);
        }
      } catch (e: unknown) {
        console.error('Failed to fetch offer stats:', e);
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('Failed to load tracking data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [session?.user?.email]);

  const filteredOffers = offers.filter((offer) =>
    offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.offer_url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card
      shadow="md"
      radius="md"
      withBorder
      style={{
        padding: isVerySmall ? 8 : isMobile ? 12 : 24,
        overflow: 'visible', // Prevent clipping on smaller screens
      }}
    >
      {loading ? (
        <Card p={isVerySmall ? 'xs' : isMobile ? 'sm' : 'lg'} shadow="md" radius="md" withBorder>
          <Skeleton height={32} width="40%" mb="md" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={isMobile ? 36 : 40} width="100%" mb="sm" />
          ))}
        </Card>
      ) : error ? (
        <Alert
          variant="light"
          color="red"
          title="Error loading data"
          icon={<IconAlertCircle size={isMobile ? 16 : 20} />}
          mt="md"
        >
          {error}
        </Alert>
      ) : filteredOffers.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl" size={isVerySmall ? 'sm' : isMobile ? 'md' : 'lg'}>
          No tracking data available or found for your search.
        </Text>
      ) : (
        <ScrollArea
          type="auto"
          style={{
            width: '100%',
            maxWidth: '100%',
          }}
        >
          <Table
            striped
            highlightOnHover
            verticalSpacing={isVerySmall ? 'xs' : isMobile ? 'sm' : 'md'}
            style={{
              // Use minWidth for the table to ensure horizontal scrolling if needed on very small screens
              minWidth: isVerySmall ? '400px' : '100%',
              tableLayout: isVerySmall ? 'auto' : 'fixed', // Auto layout for very small to fit content
            }}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: isVerySmall ? '40%' : isMobile ? '35%' : '30%' }}>
                  <Group gap={4} wrap="nowrap">
                    <IconGift size={isMobile ? 14 : 16} /> Offer
                  </Group>
                </Table.Th>
                <Table.Th style={{ width: isVerySmall ? '20%' : isMobile ? '20%' : '20%' }}>
                  <Group gap={4} wrap="nowrap">
                    <IconClick size={isMobile ? 14 : 16} /> Clicks
                  </Group>
                </Table.Th>
                <Table.Th style={{ width: isVerySmall ? '20%' : isMobile ? '20%' : '20%' }}>
                  <Group gap={4} wrap="nowrap">
                    <IconCoin size={isMobile ? 14 : 16} /> Conversions
                  </Group>
                </Table.Th>
                <Table.Th style={{ width: isVerySmall ? '20%' : isMobile ? '25%' : '30%' }}>
                  Track Link
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredOffers.map((offer) => (
                <Table.Tr key={offer.id}>
                  <Table.Td>
                    <Tooltip label={offer.name} disabled={offer.name.length < 20 && !isMobile} withArrow position="top">
                      <Stack gap={2} style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        <Text
                          fw={500}
                          size={isVerySmall ? 'sm' : isMobile ? 'sm' : 'md'}
                          lineClamp={isMobile ? 2 : 1} // Limit lines on mobile
                        >
                          {offer.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          ID: {offer.id}
                        </Text>
                      </Stack>
                    </Tooltip>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      variant="light"
                      color="blue"
                      size={isVerySmall ? 'sm' : isMobile ? 'md' : 'lg'}
                      leftSection={<IconClick size={isVerySmall ? 12 : isMobile ? 14 : 16} />}
                      style={{
                        minWidth: isVerySmall ? 40 : isMobile ? 48 : 60,
                        justifyContent: 'center',
                        fontSize: isVerySmall ? 12 : isMobile ? 14 : 16,
                        padding: isVerySmall ? '0 4px' : isMobile ? '0 6px' : '0 8px',
                      }}
                    >
                      {offer.total_clicks.toLocaleString()}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      variant="light"
                      color="green"
                      size={isVerySmall ? 'sm' : isMobile ? 'md' : 'lg'}
                      leftSection={<IconCoin size={isVerySmall ? 12 : isMobile ? 14 : 16} />}
                      style={{
                        minWidth: isVerySmall ? 40 : isMobile ? 48 : 60,
                        justifyContent: 'center',
                        fontSize: isVerySmall ? 12 : isMobile ? 14 : 16,
                        padding: isVerySmall ? '0 4px' : isMobile ? '0 6px' : '0 8px',
                      }}
                    >
                      {offer.total_conversions.toLocaleString()}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap" align="center">
                      <Button
                        component="a"
                        href={`/api/track/click?pub_id=${session?.user?.email}&offer_id=${offer.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="subtle"
                        color="blue"
                        leftSection={<IconExternalLink size={isVerySmall ? 14 : isMobile ? 16 : 18} />}
                        size={isVerySmall ? 'xs' : isMobile ? 'sm' : 'md'}
                        style={{
                          fontSize: isVerySmall ? 12 : isMobile ? 14 : 16,
                          padding: isVerySmall ? '2px 6px' : isMobile ? '4px 8px' : '6px 12px',
                          whiteSpace: 'nowrap', // Prevent button text from wrapping
                        }}
                      >
                        {isVerySmall ? '' : 'Track'} Link
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}
    </Card>
  );
}