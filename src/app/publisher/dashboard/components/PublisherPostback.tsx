'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react'; // Import useSession
import {
  Text, Table, Group, TextInput, Pagination,
  Flex, Modal, Button, ScrollArea, Stack, Divider, Tooltip, CopyButton
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
  IconSearch, IconInfoCircle, IconExternalLink, IconGift,
  IconWorldWww, IconFingerprint, IconCopy
} from '@tabler/icons-react';
import { showNotification } from '@/app/utils/notificationManager';

// --- Interfaces matching updated API ---
interface ClickSummary {
  clickId: string;
  ipAddress: string;
  userAgent: string;
  publisherId: string | null; // Keep publisherId for internal logic, even if backend filters
  publisherName: string | null; // Keep publisherName for internal logic/display
}

interface OfferWithClicks {
  offerId: string;
  offerName: string;
  offerUrl: string;
  linkId: string;
  linkName: string;
  publisherId: string; // The publisher this offer *belongs* to (might be different from current user if API changes)
  publisherName: string; // The publisher this offer *belongs* to
  clicks: ClickSummary[];
  totalClicks: number; // Keep totalClicks property here
  totalConversions: number; // ADDED: New property for total conversions from the API
}

interface OffersClicksApiResponse {
  offers: OfferWithClicks[];
  totalCount: number;
}
// --- End Interfaces ---

const PublisherPostback: React.FC = () => {
  const { data: session, status } = useSession(); // Get session data and status
  const [offersData, setOffersData] = useState<OfferWithClicks[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [activePage, setActivePage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  const [id, setId] = useState<string | null>(null); // Keep ID for internal logic, even if backend filters

  const [detailModalOpened, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferWithClicks | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const totalPages = useMemo(() => Math.ceil(totalItems / itemsPerPage), [totalItems, itemsPerPage]);

  const debounce = useCallback<(<Args extends unknown[]>(fn: (...args: Args) => void, delay: number) => (...args: Args) => void)>((fn, delay) => {
    let timeoutId: NodeJS.Timeout;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }, []);

  const fetchOffersWithClicks = useCallback(async () => {
    // Only fetch if session is loaded and authenticated
    if (status === 'loading') {
      setLoading(true); // Keep loading state until session is resolved
      return;
    }

    setLoading(true);
    setError(null); // Clear previous errors
    let currentPublisherId = session?.user?.id; // Try to get ID from session directly

    // If ID is not in session but email is, try to fetch it
    if (!currentPublisherId && session?.user?.email) {
      try {
        const res = await fetch(`/api/publisher/id?email=${encodeURIComponent(session.user.email)}`);
        if (res.ok) {
          const data = await res.json();
          currentPublisherId = data.id; // Assign fetched ID
        } else {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to retrieve publisher ID from email.');
        }
      } catch (err: unknown) {
        let errorMessage = 'Failed to load publisher ID. Please try again.';
        if (err instanceof Error) errorMessage = err.message;
        setError(errorMessage);
        showNotification({
          title: 'Error',
          message: errorMessage,
          color: 'red',
          withClose: false,
        });
        setLoading(false);
        console.error('Error fetching publisher ID:', err);
        return; // Stop execution if publisher ID cannot be determined
      }
    }

    // If publisher ID is still not available after trying to fetch by email
    if (!currentPublisherId) {
      setError('Unauthorized access. Publisher ID not found. Please ensure you are logged in as a publisher.');
      setLoading(false);
      showNotification({
        title: 'Authentication Required',
        message: 'Publisher ID not found. Please log in as a publisher.',
        color: 'red',
        withClose: false,
      });
      return; // Stop execution
    }
    setId(currentPublisherId); // Set ID for internal logic


    try {
      const params = new URLSearchParams();
      params.append('publisher_id', currentPublisherId);
      params.append('limit', String(itemsPerPage));
      params.append('offset', String((activePage - 1) * itemsPerPage));
      if (debouncedSearchQuery) {
        params.append('search', debouncedSearchQuery);
      }

      // Adjust API endpoint for publishers
      const response = await fetch(`/api/publishers/postback?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch your offer click data.');
      }

      const result: OffersClicksApiResponse = await response.json();
      setOffersData(result.offers);
      setTotalItems(result.totalCount);
    } catch (err: unknown) {
      let errorMessage = 'An unknown error occurred while fetching your offer clicks.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      showNotification({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        withClose: false,
      });
      console.error('Error fetching publisher offer clicks:', err);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage, activePage, debouncedSearchQuery, session, status]); // Add session and status to dependencies

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value: string) => {
      setDebouncedSearchQuery(value);
      setActivePage(1);
    }, 1000),
    [debounce]
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.currentTarget.value);
    debouncedSetSearchQuery(event.currentTarget.value);
  };

  useEffect(() => {
    // Only fetch when session status is not 'loading'
    if (status !== 'loading') {
      fetchOffersWithClicks();
    }
  }, [fetchOffersWithClicks, status]); // Trigger fetch when session status changes

  useEffect(() => {
    if (activePage > totalPages && totalPages > 0) {
      setActivePage(totalPages);
    } else if (totalPages === 0 && activePage !== 1) {
      setActivePage(1);
    }
  }, [totalPages, activePage]);

  const handleViewDetails = (offer: OfferWithClicks) => {
    setSelectedOffer(offer);
    openDetailModal();
  };

  const groupedClicksByPublisher = useMemo(() => {
    if (!selectedOffer) return new Map<string, ClickSummary[]>();

    const grouped = new Map<string, ClickSummary[]>();
    const currentPublisherId = session?.user?.id; // Get the ID of the currently logged-in publisher

    const ownClicks: ClickSummary[] = [];

    // Filter clicks to only include those belonging to the current publisher
    selectedOffer.clicks.forEach(click => {
      // In the current backend logic for publishers, the `clicks` array
      // already contains only clicks for the relevant publisher.
      // So, no explicit filtering by click.publisherId is strictly needed here
      // if the backend is always providing only the current publisher's clicks.
      // However, keeping this check makes the client-side logic robust.
      if (click.publisherId === currentPublisherId) {
        ownClicks.push(click);
      }
    });

    ownClicks.sort((a, b) => a.clickId.localeCompare(b.clickId)); // Sort by clickId for consistency

    if (ownClicks.length > 0) {
      // Group them under a specific key, like 'your_clicks' or the actual publisher ID
      grouped.set(currentPublisherId || 'your_clicks', ownClicks);
    }

    return grouped;
  }, [selectedOffer, session?.user?.id]); // Depend on selectedOffer and session.user.id

  // Render loading skeleton if session is still loading or data is being fetched
  if (status === 'loading' || loading) {
    {/* Loading Skeleton */ }
    return (
      <div className="w-full">
        <div className="w-full flex-1 min-h-[400px] backdrop-blur-xl border border-white/10 rounded-xl relative overflow-hidden flex flex-col p-6" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
          <div className="flex justify-between items-center mb-6">
            <div className="h-10 w-64 bg-white/5 rounded-lg border border-white/5 animate-pulse" />
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 w-full bg-white/5 rounded-lg border border-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        className="backdrop-blur-xl border border-white/10 rounded-xl p-6"
        style={{ background: 'rgba(255, 255, 255, 0.03)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' }}
      >
        <Flex justify="space-between" align="center" mb="md" wrap="wrap" gap="md">
          <TextInput
            placeholder="Search by Offer Name"
            value={searchQuery}
            onChange={handleSearchChange}
            leftSection={<IconSearch size={16} />}
            style={{ flexGrow: 1, minWidth: '250px' }}
            styles={{
              input: {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#E6EAF0',
                '&::placeholder': { color: 'rgba(255, 255, 255, 0.5)' }
              }
            }}
          />
        </Flex>

        {offersData.length === 0 ? (
          <Text style={{ textAlign: 'center' }} py="xl" color="dimmed">No offers found for you matching your criteria.</Text>
        ) : isMobile ? (
          <Stack gap="sm">
            {offersData.map((offer) => (
              <div key={offer.offerId + offer.linkId} className="backdrop-blur-xl border border-white/10 rounded-xl p-4 bg-white/5">
                <Stack gap="xs">
                  <Group gap={6}>
                    <IconGift size={16} />
                    <Text size="sm" fw={500}>Offer:</Text>
                    <Text>{offer.offerName}</Text>
                  </Group>
                  <Group gap={6}>
                    <IconWorldWww size={16} />
                    <Text size="sm" fw={500}>Link Name:</Text>
                    <Text size="sm">{offer.linkName}</Text>
                  </Group>
                  <Group gap={6}>
                    <IconFingerprint size={16} />
                    <Text size="sm" fw={500}>Total Clicks:</Text>
                    <Text size="sm">{offer.totalClicks}</Text>
                  </Group>
                  {/* ADDED: Total Conversions for Mobile */}
                  <Group gap={6}>
                    <IconInfoCircle size={16} /> {/* Using IconInfoCircle, you can change if a specific conversion icon is available */}
                    <Text size="sm" fw={500}>Total Conversions:</Text>
                    <Text size="sm">{offer.totalConversions}</Text>
                  </Group>

                  <Group gap="sm" justify="space-between" align="center" wrap="wrap">
                    <CopyButton
                      value={`${window.location.origin}/api/track/click?offer_id=${offer.offerId}&pub_id=${session?.user?.id}&link_id=${offer.linkId}`}
                      timeout={2000}
                    >
                      {({ copied, copy }) => (
                        <Tooltip label={copied ? "Copied!" : "Copy tracking link"} withArrow>
                          <Button
                            onClick={copy}
                            size="xs"
                            leftSection={<IconCopy size={14} />}
                            variant="light"
                            color={copied ? 'green' : 'blue'}
                          >
                            {copied ? 'Copied' : 'Copy Link'}
                          </Button>
                        </Tooltip>
                      )}
                    </CopyButton>

                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleViewDetails(offer)}
                      leftSection={<IconInfoCircle size={14} />}
                    >
                      View Details ({offer.clicks.length})
                    </Button>
                  </Group>
                </Stack>
              </div>
            ))}
          </Stack>
        ) : (
          <ScrollArea>
            <Table
              verticalSpacing="sm"
              horizontalSpacing="md"
              style={{
                backgroundColor: 'transparent',
                color: '#E6EAF0'
              }}
            >
              <Table.Thead>
                <Table.Tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <Table.Th style={{ color: '#9CA3AF' }}><Group gap={4}><IconWorldWww size={16} />Link Name</Group></Table.Th>
                  <Table.Th style={{ color: '#9CA3AF' }}><Group gap={4}><IconGift size={16} />Offer Name</Group></Table.Th>
                  <Table.Th style={{ color: '#9CA3AF' }}><Group gap={4}><IconExternalLink size={16} />Your Tracking Link</Group></Table.Th>
                  <Table.Th style={{ color: '#9CA3AF' }}><Group gap={4}><IconFingerprint size={16} />Total Clicks</Group></Table.Th>
                  <Table.Th style={{ color: '#9CA3AF' }}><Group gap={4}><IconFingerprint size={16} />Total Conversions</Group></Table.Th>
                  <Table.Th style={{ color: '#9CA3AF' }}><Group gap={4}><IconInfoCircle size={16} />Details</Group></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {offersData.map((offer) => (
                  <Table.Tr
                    key={offer.offerId + offer.linkId}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      transition: 'background-color 0.2s',
                    }}
                    className="hover:bg-white/5"
                  >
                    <Table.Td>{offer.linkName}</Table.Td>
                    <Table.Td>{offer.offerName}</Table.Td>
                    <Table.Td>
                      <CopyButton
                        value={`${window.location.origin}/api/track/click?offer_id=${offer.offerId}&pub_id=${id}&link_id=${offer.linkId}`}
                        timeout={2000}
                      >
                        {({ copied, copy }) => (
                          <Tooltip label={copied ? "Copied!" : "Copy tracking link"} withArrow>
                            <Button
                              onClick={copy}
                              size="xs"
                              leftSection={<IconCopy size={14} />}
                              variant="light"
                              color={copied ? 'green' : 'blue'}
                            >
                              {copied ? 'Copied' : 'Copy'}
                            </Button>
                          </Tooltip>
                        )}
                      </CopyButton>
                    </Table.Td>
                    <Table.Td>{offer.totalClicks}</Table.Td>
                    <Table.Td>{offer.totalConversions}</Table.Td> {/* UPDATED: Display totalConversions */}
                    <Table.Td>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleViewDetails(offer)}
                        leftSection={<IconInfoCircle size={14} />}
                      >
                        View Details
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}

        {totalPages > 1 && (
          <Flex justify="flex-end" mt="md">
            <Pagination
              total={totalPages}
              value={activePage}
              onChange={setActivePage}
              color="gray"
              styles={{
                control: {
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#E6EAF0'
                }
              }}
            />
          </Flex>
        )}
      </div>

      <Modal
        opened={detailModalOpened}
        onClose={closeDetailModal}
        title={`Clicks for Offer: ${selectedOffer?.offerName || ''} (Link: ${selectedOffer?.linkName || ''})`}
        size="lg"
        centered
        scrollAreaComponent={ScrollArea.Autosize}
      >
        {selectedOffer && (
          <Stack gap="md">

            {groupedClicksByPublisher.size === 0 ? (
              <Text color="dimmed" ta="center">No clicks recorded for this offer by you yet.</Text>
            ) : (
              Array.from(groupedClicksByPublisher.entries()).map(([publisherKey, clicks]) => (
                <div key={publisherKey}>
                  {/* The publisher name in the modal is implicitly the current user's publisher name */}
                  <Group align="center" mb="xs">
                    {/* The IconUserCircle is already present for the publisher group */}
                    <Text fw={700} fz="md">
                      Your Clicks ({clicks.length})
                    </Text>
                  </Group>
                  <Table striped withTableBorder withColumnBorders>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Click ID</Table.Th>
                        <Table.Th>IP Address</Table.Th>
                        <Table.Th>User Agent</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {clicks.map((click, index) => (
                        <Table.Tr key={click.clickId || index}>
                          <Table.Td>{click.clickId || 'N/A'}</Table.Td>
                          <Table.Td>{click.ipAddress || 'N/A'}</Table.Td>
                          <Table.Td>
                            <ScrollArea h={50} style={{ width: '200px' }}>
                              <code style={{ wordBreak: 'break-all' }}>
                                {click.userAgent || 'N/A'}
                              </code>
                            </ScrollArea>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                  <Divider my="md" />
                </div>
              ))
            )}
          </Stack>
        )}
      </Modal>
    </div>
  );
};

export default PublisherPostback;