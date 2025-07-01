// components/admin/Postback.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';

import {
  Container, Text, Table, Group, TextInput, Pagination, Paper,
  Flex, Skeleton, Modal, Button, ScrollArea, Stack, Divider, Tooltip, CopyButton,
  NumberInput
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
  IconSearch, IconInfoCircle, IconExternalLink, IconGift,
  IconWorldWww, IconFingerprint, IconUserCircle, IconCopy
} from '@tabler/icons-react';
import { showNotification } from '@/app/utils/notificationManager';

// --- Interfaces matching updated API ---
interface ClickSummary {
  clickId: string;
  ipAddress: string;
  userAgent: string;
  publisherId: string | null;
  publisherName: string | null;
}

interface OfferWithClicks {
  offerId: string;
  offerName: string;
  offerUrl: string;
  linkId: string;
  linkName: string;
  publisherId: string;
  publisherName: string;
  clicks: ClickSummary[];
  totalConversions: number; // ADDED: New property for total conversions
  commissionPercent?: number;
  commissionCut?: number;
}

interface OffersClicksApiResponse {
  offers: OfferWithClicks[];
  totalCount: number;
}
// --- End Interfaces ---

const Postback: React.FC = () => {
  const [offersData, setOffersData] = useState<OfferWithClicks[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [activePage, setActivePage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const [detailModalOpened, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferWithClicks | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const totalPages = useMemo(() => Math.ceil(totalItems / itemsPerPage), [totalItems, itemsPerPage]);

  const [publisherModalOpened, { open: openPublisherModal, close: closePublisherModal }] = useDisclosure(false);
  const [selectedPublisher, setSelectedPublisher] = useState<{
    offerId: string;
    publisherId: string;
    publisherName: string;
    commissionPercent: number;
    commissionCut: number;
    linkId: string;
  } | null>(null);
  const [commissionPercent, setCommissionPercent] = useState<number>(0);
  const [commissionCut, setCommissionCut] = useState<number>(0);
  const [publisherModalLoading, setPublisherModalLoading] = useState(false);

  const debounce = useCallback<(<Args extends unknown[]>(fn: (...args: Args) => void, delay: number) => (...args: Args) => void)>((fn, delay) => {
    let timeoutId: NodeJS.Timeout;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }, []);

  const fetchOffersWithClicks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('limit', String(itemsPerPage));
      params.append('offset', String((activePage - 1) * itemsPerPage));
      if (debouncedSearchQuery) {
        params.append('search', debouncedSearchQuery);
      }

      const response = await fetch(`/api/admin/postback?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch offer click data.');
      }

      const result: OffersClicksApiResponse = await response.json();
      setOffersData(result.offers);
      setTotalItems(result.totalCount);
    } catch (err: unknown) {
      let errorMessage = 'An unknown error occurred.';
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
      console.error('Error fetching offer clicks:', err);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage, activePage, debouncedSearchQuery]);

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
    fetchOffersWithClicks();
  }, [fetchOffersWithClicks]);

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
  const handlePublisherClick = (offer: OfferWithClicks) => {
    setSelectedPublisher({
      offerId: offer.offerId,
      publisherId: offer.publisherId,
      publisherName: offer.publisherName,
      commissionPercent: offer.commissionPercent ?? 0,
      commissionCut: offer.commissionCut ?? 0,
      linkId: offer.linkId,
    });
    setCommissionPercent(offer.commissionPercent ?? 0);
    setCommissionCut(offer.commissionCut ?? 0);
    openPublisherModal();
    setCommissionCut(offer.commissionCut ?? 0);
    openPublisherModal();
  };

  const handleUpdatePublisher = async () => {
    if (!selectedPublisher) return;
    setPublisherModalLoading(true);
    try {
      const res = await fetch(`/api/admin/offer_publishers/commission`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer_id: selectedPublisher.offerId,
          publisher_id: selectedPublisher.publisherId,
          commission_percent: commissionPercent,
          commission_cut: commissionCut,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update publisher.');
      }
      showNotification({ title: 'Success', message: 'Publisher updated.', color: 'green', withClose: false });
      closePublisherModal();
      fetchOffersWithClicks();
    } catch (e: unknown) {
      let errorMessage = 'An unknown error occurred.';
      if (e instanceof Error) {
        errorMessage = e.message;
      }
      showNotification({ title: 'Error', message: errorMessage, color: 'red', withClose: false });
    } finally {
      setPublisherModalLoading(false);
    }
  };

  // const handleRemovePublisher = async () => {
  //   if (!selectedPublisher) return;
  //   setPublisherModalLoading(true);
  //   try {
  //     const res = await fetch(`/api/admin/links/delete`, {
  //       method: 'DELETE',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ link_id: selectedPublisher.linkId }),
  //     });
  //     if (!res.ok) {
  //       const err = await res.json();
  //       throw new Error(err.error || 'Failed to remove publisher link.');
  //     }
  //     showNotification({ title: 'Success', message: 'Publisher link deleted.', color: 'green', withClose: false });
  //     closePublisherModal();
  //     fetchOffersWithClicks();
  //   } catch (e: unknown) {
  //     let errorMessage = 'An unknown error occurred.';
  //     if (e instanceof Error) {
  //       errorMessage = e.message;
  //     }
  //     showNotification({ title: 'Error', message: errorMessage, color: 'red', withClose: false });
  //   } finally {
  //     setPublisherModalLoading(false);
  //   }
  // };

  const groupedClicksByPublisher = useMemo(() => {
    if (!selectedOffer) return new Map<string, ClickSummary[]>();
    const grouped = new Map<string, ClickSummary[]>();
    selectedOffer.clicks.forEach(click => {
      const key = click.publisherId || 'unknown';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(click);
    });
    return grouped;
  }, [selectedOffer]);

  if (loading) {
    return (
      <Container size="xl">
        <Paper shadow="sm" radius="md" p="md" withBorder>
          <Skeleton height={40} mb="md" />
          <Skeleton height={300} />
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Paper shadow="sm" radius="md" p="md" withBorder>
        <Flex justify="space-between" align="center" mb="md" wrap="wrap" gap="md">
          <TextInput
            placeholder="Search by Offer Name"
            value={searchQuery}
            onChange={handleSearchChange}
            leftSection={<IconSearch size={16} />}
            style={{ flexGrow: 1, minWidth: '250px' }}
          />
        </Flex>
        {offersData.length === 0 ? (
          <Text style={{ textAlign: 'center' }} py="xl" color="dimmed">
            No offers or click data found matching your criteria.
          </Text>
        ) : isMobile ? (
          <Stack gap="sm">
            {offersData.map((offer) => (
              <Paper key={offer.offerId + offer.linkId} shadow="xs" radius="md" p="md" withBorder>
                <Stack gap="xs">
                  <Group gap={6}>
                    <IconWorldWww size={16} />
                    <Text size="sm" fw={500}>Link:</Text>
                    <Text size="sm">{offer.linkName}</Text>
                  </Group>
                  <Group gap={6}>
                    <IconGift size={16} />
                    <Text size="sm" fw={500}>Offer:</Text>
                    <Text size="sm">{offer.offerName}</Text>
                  </Group>
                  <Group gap={6}>
                    <IconUserCircle size={16} />
                    <Text size="sm" fw={500}>Publisher:</Text>
                    <Button variant="subtle" size="xs" px={2} onClick={() => handlePublisherClick(offer)}>
                      {offer.publisherName}
                    </Button>
                  </Group>
                  <Group gap={6}>
                    <IconFingerprint size={16} />
                    <Text size="sm" fw={500}>Clicks:</Text>
                    <Text size="sm">{offer.clicks.length}</Text>
                  </Group>
                  {/* ADDED: Conversions on mobile card */}
                  <Group gap={6}>
                    <IconInfoCircle size={16} /> {/* Reusing icon, consider specific conversion icon */}
                    <Text size="sm" fw={500}>Conversions:</Text>
                    <Text size="sm">{offer.totalConversions}</Text>
                  </Group>


                  <Group gap="sm" justify="space-between" align="center" wrap="wrap">
                    <CopyButton
                      value={`${window.location.origin}/api/track/click?offer_id=${offer.offerId}&pub_id=${offer.publisherId}&link_id=${offer.linkId}`}
                      timeout={2000}
                    >
                      {({ copied, copy }) => (
                        <Tooltip label={copied ? "Copied!" : "Copy link"} withArrow>
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
                      View Clicks ({offer.clicks.length})
                    </Button>
                  </Group>
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : (
          <ScrollArea>
            <Table striped highlightOnHover withTableBorder withColumnBorders miw={1000}> {/* Increased min-width */}
              <Table.Thead>
                <Table.Tr>
                  <Table.Th><Group gap={4}><IconWorldWww size={16} />Link</Group></Table.Th>
                  <Table.Th><Group gap={4}><IconGift size={16} />Offer</Group></Table.Th>
                  <Table.Th><Group gap={4}><IconUserCircle size={16} />Publisher</Group></Table.Th>
                  <Table.Th><Group gap={4}><IconExternalLink size={16} />Copy Link</Group></Table.Th>
                  <Table.Th><Group gap={4}><IconFingerprint size={16} />Total Clicks</Group></Table.Th>
                  {/* UPDATED: Table header for conversions */}
                  <Table.Th><Group gap={4}><IconInfoCircle size={16} />Conversions</Group></Table.Th>
                  <Table.Th><Group gap={4}><IconInfoCircle size={16} />Details</Group></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {offersData.map((offer) => (
                  <Table.Tr key={offer.offerId + offer.linkId}> {/* Key needs to be unique for link+offer */}
                    <Table.Td>{offer.linkName}</Table.Td>
                    <Table.Td>{offer.offerName}</Table.Td>
                    <Table.Td>
                      <Button variant="subtle" size="xs" px={2} onClick={() => handlePublisherClick(offer)}>
                        {offer.publisherName}
                      </Button>
                    </Table.Td>
                    <Table.Td>
                      <CopyButton
                        value={`${window.location.origin}/api/track/click?offer_id=${offer.offerId}&pub_id=${offer.publisherId}&link_id=${offer.linkId}`}
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
                    <Table.Td>{offer.clicks.length}</Table.Td>
                    {/* UPDATED: Display totalConversions */}
                    <Table.Td>{offer.totalConversions}</Table.Td>
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

        {totalPages > 1 && ( // Only show pagination if there are pages
          <Flex justify="flex-end" mt="md">
            <Pagination total={totalPages} value={activePage} onChange={setActivePage} />
          </Flex>
        )}
      </Paper>

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
              <Text color="dimmed" ta="center">No clicks recorded for this offer yet.</Text>
            ) : (
              Array.from(groupedClicksByPublisher.entries()).map(([publisherKey, clicks]) => (
                <div key={publisherKey}>
                  <Group align="center" mb="xs">
                    <IconUserCircle size={20} />
                    <Text fw={700} fz="md">
                      {clicks[0]?.publisherName || 'Unknown Publisher'} ({clicks.length} clicks)
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
                          <Table.Td>{click.clickId}</Table.Td>
                          <Table.Td>{click.ipAddress}</Table.Td>
                          <Table.Td>{click.userAgent}</Table.Td>
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

      <Modal
        opened={publisherModalOpened}
        onClose={closePublisherModal}
        title={`Publisher Details: ${selectedPublisher?.publisherName || ''}`}
        size="md"
        centered
      >
        {selectedPublisher && (
          <Stack gap="md">
            <NumberInput
              label="Commission Percent"
              value={commissionPercent}
              onChange={v => setCommissionPercent(Number(v))}
              min={0}
              max={100}
              step={0.01}
              disabled={publisherModalLoading}
            />
            <NumberInput
              label="Conversion Cut"
              value={commissionCut}
              onChange={v => setCommissionCut(Number(v))}
              min={0}
              step={0.01}
              disabled={publisherModalLoading}
            />
            <Group justify="space-between">
              <Button
                color="blue"
                loading={publisherModalLoading}
                onClick={handleUpdatePublisher}
              >
                Save Changes
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
};

export default Postback;