'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Card, Button, Select, Loader, Text, Table, Alert, Group,
  Badge, Skeleton
} from '@mantine/core';
import { IconAlertCircle, IconExternalLink } from '@tabler/icons-react';

// Types
interface Offer {
  id: number;
  name: string;
}

interface SmartLink {
  id: string;
  offer_id: number;
  offer_name: string;
  created_at: string;
  smartlink_url: string;
}

export default function PublisherSmartlinksPage() {
  const { data: session, status } = useSession();
  const [publisherId, setPublisherId] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [smartlinks, setSmartlinks] = useState<SmartLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch offers
  useEffect(() => {
    fetch('/api/offers/display')
      .then(res => res.json())
      .then(data => setOffers(data))
      .catch(() => setError('Failed to load offers.'));
  }, []);

  // Fetch publisherId from backend after authentication
  useEffect(() => {
    const fetchPublisherId = async () => {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          const res = await fetch(`/api/publisher/id?email=${encodeURIComponent(session.user.email)}`);
          const data = await res.json();
          if (data.id) setPublisherId(data.id.toString());
          else setPublisherId(null);
        } catch {
          setPublisherId(null);
        }
      }
    };
    fetchPublisherId();
  }, [status, session]);

  const fetchSmartlinks = async () => {
    if (!publisherId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/smartlinks?publisher_id=${publisherId}`);
      const data = await res.json();
      console.log('Fetched smartlinks:', data);
      setSmartlinks(data);
    } catch {
      setError('Failed to load smartlinks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (publisherId) fetchSmartlinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publisherId]);

  const createSmartLink = async () => {
    if (!selectedOfferId || !publisherId) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/smartlink/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publisher_id: publisherId, offer_id: parseInt(selectedOfferId) }),
      });
      if (res.ok) {
        setSelectedOfferId(null);
        await fetchSmartlinks();
      } else {
        setError('Failed to generate smartlink.');
      }
    } catch {
      setError('Failed to generate smartlink.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card p="lg" radius="md" withBorder>
      {status === 'loading' ? (
        <Loader mt="xl" />
      ) : (
        <>
          {error && (
            <Alert icon={<IconAlertCircle />} color="red" mt="md">
              {error}
            </Alert>
          )}
          <Group >
            <Select
              placeholder="Select an offer"
              data={offers.map(o => ({ value: o.id.toString(), label: o.name }))}
              value={selectedOfferId}
              onChange={setSelectedOfferId}
            />
            <Button onClick={createSmartLink} disabled={!selectedOfferId}>
              Generate SmartLink
            </Button>
          </Group>
          {loading ? (
            <Table mt="lg" striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ fontSize: 15 }}>Offer</Table.Th>
                  <Table.Th style={{ fontSize: 15 }}>SmartLink</Table.Th>
                  <Table.Th style={{ fontSize: 15 }}>Created</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Table.Tr key={idx}>
                    <Table.Td><Skeleton height={22} width={120} radius="sm" /></Table.Td>
                    <Table.Td><Skeleton height={22} width={220} radius="sm" /></Table.Td>
                    <Table.Td><Skeleton height={22} width={100} radius="sm" /></Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Table mt="lg" striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ fontSize: 15 }}>Offer</Table.Th>
                  <Table.Th style={{ fontSize: 15 }}>SmartLink</Table.Th>
                  <Table.Th style={{ fontSize: 15 }}>Created</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(() => { console.log('Smartlinks:', smartlinks); return null; })()}
                {smartlinks.map((link) => (
                  <Table.Tr key={link.id}>
                    <Table.Td>
                      <Text 
                        fz={{ base: 'sm', sm: 'sm', md: 'md' }}>{link.offer_name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap" align="center">
                        {/* Visit Button with Link Icon */}
                        <Button
                          component="a" // Render as an anchor tag
                          href={link.smartlink_url || '#'} // Use the smartlink_url as the href
                          target="_blank" // Open in a new tab
                          rel="noopener noreferrer" // Recommended for security with target="_blank"
                          variant="subtle" // A less prominent button style
                          color="blue" // Set button color to blue
                          leftSection={<IconExternalLink size={16} />} // Use IconCopy for a link-like icon
                          disabled={!link.smartlink_url} // Disable if no URL is present
                          style={{ fontSize: 14 }} // Keep font size consistent
                        >
                          Visit
                        </Button>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                    <Badge color="gray" variant="light">
                      {/* Use Mantine's Text component for responsive font sizing */}
                      <Text
                        fz={{ base: 'xs', sm: 'sm', md: 'sm' }} // Example responsive sizes
                        style={{ lineHeight: 1 }} // Adjust line height to prevent badge from becoming too tall
                      >
                        {new Date(link.created_at).toLocaleString()}
                      </Text>
                    </Badge>
                  </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </>
      )}
    </Card>
  );
}
