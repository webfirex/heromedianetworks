// components/admin/AllOffers.tsx
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Container, Text, Table, Group, Badge,
  TextInput, Select, Pagination, ActionIcon, Paper, Flex,
  Skeleton, Modal, Button, Box, MultiSelect
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
  IconSearch, IconEdit, IconCheck, IconBan,
  IconClockHour4, IconCircleCheck, IconCircleX, IconTrash, IconX
} from '@tabler/icons-react';
import { showNotification } from '@/app/utils/notificationManager';

// useDebounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

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

// --- Updated Offer Interface (Matching Backend GET Response) ---
interface Commission {
  name: string;
  publisher_id: string;
  commission_percent?: string;
  commission_cut?: string;
}

interface Offer {
  id: string;
  name: string;
  advertisers: string | string[];
  payout: number;
  currency: string;
  status: 'pending' | 'active' | 'expired';
  creationDate: string;
  clicks: number;
  conversions: number;
  cr: number;
  epc: number;
  description: string;
  offer_url: string;
  geo: string;
  commission_amount?: string | string[];
  commission_cut?: string | string[];
  commission_percent?: string | string[];
  commissions?: Commission[]; // <-- add this
}

// Interface for API response structure for GET list
interface OffersListApiResponse {
  offers: Offer[];
}

const AllOffers: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  const [searchInputValue, setSearchInputValue] = useState('');
  const debouncedSearchQuery = useDebounce(searchInputValue, 500);

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'active' | 'expired'>('all');
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 20;

  // State for edit modal
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null); // This will hold the FULL offer data for editing

  // State for advertiser modal
  const [advertiserModalOpened, { open: openAdvertiserModal, close: closeAdvertiserModal }] = useDisclosure(false);
  const [advertiserForm, setAdvertiserForm] = useState<{
    name: string;
    commission_cut: string;
    commission_percent?: string;
    publisher_id?: string;
  } | null>(null);

  // Media query for mobile view
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deleting, setDeleting] = useState(false);


  // --- Frontend-side Filtering and Pagination (TEMPORARY - UNTIL BACKEND UPDATED) ---
  const filteredOffers = useMemo(() => {
    let tempOffers = offers;

    if (filterStatus !== 'all') {
      tempOffers = tempOffers.filter(o => o.status === filterStatus);
    }

    if (debouncedSearchQuery) {
      const lowerCaseSearchQuery = debouncedSearchQuery.toLowerCase();
      tempOffers = tempOffers.filter(o => {
        // Defensive checks for undefined/null properties before calling toLowerCase()
        const nameMatches = o.name?.toLowerCase().includes(lowerCaseSearchQuery) || false;
        const advertisersMatches = Array.isArray(o.advertisers)
          ? o.advertisers.some(advertiser => advertiser.toLowerCase().includes(lowerCaseSearchQuery))
          : o.advertisers?.toLowerCase().includes(lowerCaseSearchQuery) || false;
        const descriptionMatches = o.description?.toLowerCase().includes(lowerCaseSearchQuery) || false;

        return nameMatches || advertisersMatches || descriptionMatches;
      });
    }
    return tempOffers;
  }, [offers, filterStatus, debouncedSearchQuery]);

  const paginatedOffers = useMemo(() => {
    const start = (activePage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredOffers.slice(start, end);
  }, [filteredOffers, activePage, itemsPerPage]);

  const totalFilteredItems = filteredOffers.length;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);
  // --- END TEMPORARY FRONTEND FILTERING/PAGINATION ---


  // Function to fetch offers from the backend API
  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      // Fetching more than itemsPerPage to allow frontend filtering,
      // as the list GET endpoint doesn't support complex filtering or structured commissions yet.
      params.append('limit', String(itemsPerPage * 5));
      params.append('offset', String(0));

      const response = await fetch(`/api/admin/offers?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch offers.');
      }

      const result: OffersListApiResponse = await response.json();
      console.log('Fetched offers list:', result.offers); // Log list offers

      setOffers(result.offers);

    } catch (err: unknown) {
      let errorMessage = 'An unknown error occurred.';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      setError(errorMessage);
      showNotification({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        withClose: false,
      });
      console.error('Error fetching offers:', err);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  // Effect to trigger data fetching
  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  // Function to update offer status via backend API (PATCH to /api/admin/offers/[id])
  const updateOfferStatus = async (id: string, newStatus: 'active' | 'expired') => {
    try {
      const response = await fetch(`/api/admin/offers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update offer status to ${newStatus}.`);
      }

      // No need to parse result here, just confirm success and refetch or update state
      // For a status update, we can optimistically update the state
      setOffers(prev =>
        prev.map(offer =>
          offer.id === id ? { ...offer, status: newStatus } : offer // Update status directly
        )
      );
      showNotification({
        title: 'Success',
        message: `Offer status updated to ${newStatus}.`,
        color: newStatus === 'active' ? 'green' : 'red',
        withClose: false,
      });
    } catch (err: unknown) {
      let errorMessage = 'An unknown error occurred.';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      showNotification({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        withClose: false,
      });
      console.error('Error updating offer status:', err);
    }
  };

  const deleteOffer = async () => {
    if (!offerToDelete) return;
  
    try {
      setDeleting(true);
  
      const offerId = offerToDelete.id;
  
      let fullOffer = offerToDelete;
  
      // Fetch full offer if commissions missing
      if (!fullOffer.commissions) {
        const res = await fetch(`/api/admin/offers/${offerId}`);
        fullOffer = await res.json();
      }
  
      const commissions = fullOffer.commissions || [];
  
      // CASE 1 — advertisers exist
      if (commissions.length > 0) {
        for (const commission of commissions) {
          const publisherId = commission.publisher_id;
  
          await fetch('/api/admin/links/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              offer_id: offerId,
              publisher_id: publisherId,
            }),
          });
  
          await fetch(`/api/admin/offers/${offerId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              publisher_id: publisherId,
            }),
          });
        }
      } else {
        // CASE 2 — no advertisers → still delete offer itself
        await fetch(`/api/admin/offers/${offerId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publisher_id: null, // backend should allow this
          }),
        });
      }
  
      showNotification({
        title: 'Deleted',
        message: `${offerToDelete.name} deleted successfully`,
        color: 'green',
        withClose: false,
      });
  
      setDeleteModalOpened(false);
      setOfferToDelete(null);
  
      // Optimistic UI update (better UX)
      setOffers(prev => prev.filter(o => o.id !== offerId));
  
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      showNotification({
        title: 'Error',
        message: msg,
        color: 'red',
        withClose: false,
      });
    } finally {
      setDeleting(false);
    }
  };
  
  
  

  const handleApprove = (id: string) => updateOfferStatus(id, 'active');
  const handleTerminate = (id: string) => updateOfferStatus(id, 'expired');

  // Handle edit action for the main offer modal
  const handleEdit = async (offer: Offer) => {
    setLoading(true); // Indicate loading while fetching full offer details
    try {
      // Fetch full offer details including commissions
      const response = await fetch(`/api/admin/offers/${offer.id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch offer details for editing.');
      }
      const fullOffer = await response.json() as Offer;
      setEditingOffer(fullOffer);
      openEditModal();
    } catch (err: unknown) {
      let errorMessage = 'An unknown error occurred.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      showNotification({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        withClose: false,
      });
      console.error('Error fetching full offer for edit:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle saving edited offer (PUT to /api/admin/offers/[id])
  const handleSaveEdit = async () => {
    if (!editingOffer) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/offers/${editingOffer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingOffer.name,
          payout: editingOffer.payout,
          currency: editingOffer.currency,
          status: editingOffer.status,
          offer_url: editingOffer.offer_url,
          description: editingOffer.description,
          geo: editingOffer.geo,
          // Note: commission_percent, commission_cut, publisher_id are handled by PATCH for advertiser specific updates
          // or can be passed here if the PUT expects a full overwrite including *all* commissions.
          // Given the current backend PUT, it only updates single commission if publisher_id is present in body,
          // otherwise, it focuses on main offer fields. For simplicity here, we'll let PATCH handle individual commissions.
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fully update offer: ${editingOffer.name}.`);
      }

      const result = await response.json();

      if (result.updated) {
        // Find and update the specific offer in the list state
        setOffers(prev =>
          prev.map(offer =>
            offer.id === editingOffer.id ? { ...offer, ...result.updated, creationDate: result.updated.created_at } : offer
          )
        );
        showNotification({
          title: 'Success',
          message: 'Offer updated successfully!',
          color: 'green',
          withClose: false,
        });
        closeEditModal();
        setEditingOffer(null); // Clear editing offer state
      } else {
        throw new Error('Failed to update offer, no updated data returned.');
      }
    } catch (err: unknown) {
      let errorMessage = 'An unknown error occurred.';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      showNotification({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        withClose: false,
      });
      console.error('Error saving offer:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- MODIFIED handleAdvertiserClick ---
  const handleAdvertiserClick = async (advertiserName: string, offerId: string) => {
    setLoading(true); // Indicate loading while fetching full offer details
    try {
      // 1. Fetch the full offer details for the given offerId
      const response = await fetch(`/api/admin/offers/${offerId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch offer details for advertiser modal.');
      }
      const fullOffer = await response.json() as Offer;
      console.log('Fetched full offer for advertiser click:', fullOffer);

      // 2. Find the specific commission data within the fetched fullOffer
      const commission = fullOffer.commissions?.find(c => c.name === advertiserName);

      if (!commission) {
        showNotification({
          title: 'Error',
          message: `Could not find commission data for advertiser: ${advertiserName} on this offer.`,
          color: 'red',
          withClose: false,
        });
        return;
      }

      // 3. Set the form data for the advertiser modal
      setAdvertiserForm({
        name: commission.name,
        commission_percent: commission.commission_percent || '',
        commission_cut: commission.commission_cut || '',
        publisher_id: commission.publisher_id,
      });

      // 4. Set the editing offer context to the full fetched offer
      setEditingOffer(fullOffer);
      openAdvertiserModal();

    } catch (err: unknown) {
      let errorMessage = 'An unknown error occurred.';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      showNotification({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        withClose: false,
      });
      console.error('Error fetching advertiser details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvertiserFormSave = async () => {
    if (!advertiserForm || !editingOffer) {
      closeAdvertiserModal();
      return;
    }

    setLoading(true);
    try {
      // Prepare commission data - convert empty strings to undefined/null
      const commissionData: { publisher_id: string; commission_percent?: number | null; commission_cut?: number | null } = {
        publisher_id: advertiserForm.publisher_id!,
      };

      // Convert commission_percent: empty string -> null, otherwise parse to number
      if (advertiserForm.commission_percent !== undefined && advertiserForm.commission_percent !== null) {
        const percentValue = advertiserForm.commission_percent.toString().trim();
        commissionData.commission_percent = percentValue === '' ? null : parseFloat(percentValue);
      }

      // Convert commission_cut: empty string -> null, otherwise parse to number
      if (advertiserForm.commission_cut !== undefined && advertiserForm.commission_cut !== null) {
        const cutValue = advertiserForm.commission_cut.toString().trim();
        commissionData.commission_cut = cutValue === '' ? null : parseFloat(cutValue);
      }

      // The backend PATCH method updates offer_publishers table based on offer_id and publisher_id
      const response = await fetch(`/api/admin/offers/${editingOffer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update commission.');
      }

      // Refresh the entire offer data to get the latest commissions
      // This GET request leverages the backend's ability to return structured commissions
      const latestOfferResponse = await fetch(`/api/admin/offers/${editingOffer.id}`);
      if (!latestOfferResponse.ok) {
        const errorData = await latestOfferResponse.json();
        throw new Error(errorData.error || 'Failed to refresh offer data after commission update.');
      }
      const latestData = await latestOfferResponse.json() as Offer;

      // Update the main offers state with the refreshed offer data
      setOffers(prev =>
        prev.map(offer => (offer.id === editingOffer.id ? { ...offer, ...latestData } : offer))
      );
      showNotification({ title: 'Success', message: 'Commission updated', color: 'green', withClose: false });
    } catch (err: unknown) {
      let errorMessage = 'An unknown error occurred.';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      showNotification({ title: 'Error', message: errorMessage, color: 'red', withClose: false });
      console.error('Error updating commission:', err);
    } finally {
      setLoading(false);
      closeAdvertiserModal();
    }
  };

  // Helper function to get badge color and icon based on status
  const getStatusBadge = (status: 'pending' | 'active' | 'expired') => {
    switch (status) {
      case 'pending':
        return <Badge color="yellow" leftSection={<IconClockHour4 size={12} />} variant="light">Pending</Badge>;
      case 'active':
        return <Badge color="green" leftSection={<IconCircleCheck size={12} />} variant="light">Active</Badge>;
      case 'expired':
        return <Badge color="red" leftSection={<IconCircleX size={12} />} variant="light">Expired</Badge>;
      default:
        return <Badge color="gray">Unknown</Badge>;
    }
  };

  // Render Skeleton while loading
  if (loading) {
    return (
      <Container size="xl">
        <Paper shadow="sm" radius="md" p="md" withBorder>
          <Skeleton height={40} mb="md" width="100%" />
          <Skeleton height={300} mb="md" width="100%" />
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Paper shadow="sm" radius="md" p="md" withBorder>
        <Flex justify="space-between" align="center" mb="md" wrap="wrap" gap="md">
          <TextInput
            placeholder="Search by name, advertisers or description"
            value={searchInputValue}
            onChange={(event) => {
              setSearchInputValue(event.currentTarget.value);
              setActivePage(1); // Reset page on search
            }}
            leftSection={<IconSearch size={16} />}
            style={{ flexGrow: 1, minWidth: '250px' }}
          />
          <Select
            data={[
              { value: 'all', label: 'All Statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'active', label: 'Active' },
              { value: 'expired', label: 'Expired' },
            ]}
            value={filterStatus}
            onChange={(value) => {
              setFilterStatus(value as typeof filterStatus);
              setActivePage(1); // Reset page on filter change
            }}
            placeholder="Filter by status"
            clearable
            style={{ minWidth: '150px' }}
          />
        </Flex>

        {paginatedOffers.length === 0 ? (
          <Text style={{ textAlign: 'center' }} py="xl" color="dimmed">
            No offers found matching your criteria.
          </Text>
        ) : (
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Advertisers</Table.Th>
                {!isMobile && <Table.Th>Payout</Table.Th>}
                <Table.Th>Clicks</Table.Th>
                {!isMobile && <Table.Th>Conversions</Table.Th>}
                {!isMobile && <Table.Th>Status</Table.Th>}
                {!isMobile && <Table.Th>Creation Date</Table.Th>}
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedOffers.map((offer) => (
                <Table.Tr key={offer.id}>
                  <Table.Td>{offer.name}</Table.Td>
                  <Table.Td>
                    {(
                      Array.isArray(offer.advertisers)
                        ? offer.advertisers
                        : typeof offer.advertisers === 'string'
                          ? offer.advertisers.split(',').map(a => a.trim()).filter(Boolean)
                          : []
                    ).map((adv, idx) => (
                      <Button
                        key={adv + idx} // Using adv + idx as key, but adv itself is better if unique per offer
                        variant="subtle"
                        color="blue"
                        size="xs"
                        // --- MODIFIED ONCLICK ---
                        onClick={() => handleAdvertiserClick(adv, offer.id)}
                        // --- END MODIFIED ONCLICK ---
                        style={{ padding: 0, minWidth: 0, marginRight: 4, marginBottom: 4 }}
                      >
                        {adv}
                      </Button>
                    ))}
                  </Table.Td>
                  {!isMobile && <Table.Td>{`${offer.payout} ${offer.currency}`}</Table.Td>}
                  <Table.Td>{offer.clicks}</Table.Td>
                  {!isMobile && <Table.Td>{offer.conversions}</Table.Td>}
                  {!isMobile && <Table.Td>{getStatusBadge(offer.status)}</Table.Td>}
                  {!isMobile && <Table.Td>{new Date(offer.creationDate).toLocaleDateString()}</Table.Td>}
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      <ActionIcon
                        variant="filled"
                        color="blue"
                        size="xs"
                        onClick={() => handleEdit(offer)}
                        aria-label="Edit Offer"
                        title="Edit Offer"
                      >
                        <IconEdit size={15} />
                      </ActionIcon>

                      {offer.status === 'pending' && (
                        <ActionIcon
                          variant="filled"
                          color="green"
                          size="xs"
                          onClick={() => handleApprove(offer.id)}
                          aria-label="Approve Offer"
                          title="Approve Offer"
                        >
                          <IconCheck size={15} />
                        </ActionIcon>
                      )}

                      {offer.status === 'active' && (
                        <ActionIcon
                          variant="filled"
                          color="red"
                          size="sm"
                          onClick={() => handleTerminate(offer.id)}
                          aria-label="Mark as Expired"
                          title="Mark as Expired"
                        >
                          <IconBan size={15} />
                        </ActionIcon>
                      )}

                      <ActionIcon
                        color="red"
                        variant="filled"
                        onClick={() => {
                          setOfferToDelete(offer);
                          setDeleteModalOpened(true);
                        }}
                        title="Delete Offer"
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        {totalPages > 1 && (
          <Flex justify="flex-end" mt="md">
            <Pagination
              total={totalPages}
              value={activePage}
              onChange={setActivePage}
            />
          </Flex>
        )}
      </Paper>

      {/* Edit Offer Modal */}
      <Modal opened={editModalOpened} onClose={closeEditModal} title={`Edit Offer: ${editingOffer?.name || ''}`} centered>
        {editingOffer && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            // --- Advertiser update/delete logic ---
            if (editingOffer) {
              const originalAdvertisers = Array.isArray(editingOffer.commissions)
                ? editingOffer.commissions.map(c => c.name)
                : [];
              const newAdvertisers = Array.isArray(editingOffer.advertisers)
                ? editingOffer.advertisers
                : (typeof editingOffer.advertisers === 'string' ? editingOffer.advertisers.split(',').map(a => a.trim()) : []);
              // Find removed advertisers
              const removed = originalAdvertisers.filter(a => !newAdvertisers.includes(a));
              // Find added advertisers
              const added = newAdvertisers.filter(a => !originalAdvertisers.includes(a));
              // Remove advertisers
              for (const adv of removed) {
                const commission = editingOffer.commissions?.find(c => c.name === adv);
                if (commission) {
                  // Delete all links for this offer and publisher
                  await fetch('/api/admin/links/delete', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ offer_id: editingOffer.id, publisher_id: String(commission.publisher_id) }),
                  });
                  // Also delete from offer_publishers
                  await fetch(`/api/admin/offers/${parseInt(editingOffer.id, 10)}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ publisher_id: String(commission.publisher_id) }),
                  });
                }
              }
              // Add advertisers (link existing publisher to offer)
              for (const adv of added) {
                // Try to find publisher_id by name from all offers' commissions
                let publisherId: string | undefined;
                for (const offer of offers) {
                  if (Array.isArray(offer.commissions)) {
                    const match = offer.commissions.find(c => c.name === adv);
                    if (match) {
                      publisherId = match.publisher_id;
                      break;
                    }
                  }
                }
                // If not found, try backend by name (robust for new advertisers)
                let patchRes;
                if (publisherId) {
                  patchRes = await fetch(`/api/admin/offers/${parseInt(editingOffer.id, 10)}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ publisher_id: publisherId }),
                  });
                } else {
                  patchRes = await fetch(`/api/admin/offers/${parseInt(editingOffer.id, 10)}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: adv }),
                  });
                }
                if (!patchRes.ok) {
                  const errorData = await patchRes.json();
                  showNotification({
                    title: 'Error',
                    message: errorData.error || `Could not add advertiser: ${adv}`,
                    color: 'red',
                    withClose: false,
                  });
                }
              }
              // After all deletions/additions, refresh the offer data
              const refreshed = await fetch(`/api/admin/offers/${parseInt(editingOffer.id, 10)}`);
              if (refreshed.ok) {
                const latest = await refreshed.json();
                setOffers(prev => prev.map(o => o.id === editingOffer.id ? { ...o, ...latest } : o));
                setEditingOffer(prev => prev ? { ...prev, ...latest } : prev);
              }
            }
            // --- End advertiser update/delete logic ---
            handleSaveEdit();
          }}>
            <TextInput
              label="Offer Name"
              placeholder="Enter offer name"
              value={editingOffer.name}
              onChange={(event) => setEditingOffer(prev => prev ? { ...prev, name: event.currentTarget.value } : null)}
              required
              mb="sm"
            />
            {/* Advertisers MultiSelect */}
            <MultiSelect
              label="Advertisers"
              placeholder="Add or remove advertisers"
              data={
                // Use all unique advertisers from all offers as options
                Array.from(new Set(offers.flatMap(o => Array.isArray(o.advertisers) ? o.advertisers : (typeof o.advertisers === 'string' ? o.advertisers.split(',').map(a => a.trim()) : [])))
                ).map(a => ({ value: a, label: a }))
              }
              value={Array.isArray(editingOffer.advertisers) ? editingOffer.advertisers : (typeof editingOffer.advertisers === 'string' ? editingOffer.advertisers.split(',').map(a => a.trim()) : [])}
              onChange={val => setEditingOffer(prev => prev ? { ...prev, advertisers: val } : null)}
              searchable
              mb="sm"
            />
            <TextInput
              label="Description"
              placeholder="Enter new offer description"
              value={editingOffer.description}
              onChange={(event) => setEditingOffer(prev => prev ? { ...prev, description: event.currentTarget.value } : null)}
              mb="sm"
            />
            <TextInput
              label="Offer URL"
              placeholder="Enter new offer landing URL"
              value={editingOffer.offer_url}
              onChange={(event) => setEditingOffer(prev => prev ? { ...prev, offer_url: event.currentTarget.value } : null)}
              required
              mb="sm"
            />
            <TextInput
              label="Geo Target"
              placeholder="e.g., US, IN, GLOBAL"
              value={editingOffer.geo}
              onChange={(event) => setEditingOffer(prev => prev ? { ...prev, geo: event.currentTarget.value } : null)}
              required
              mb="sm"
            />
            <Group grow mb="md">
              <TextInput
                label="Payout"
                placeholder="e.g., 15.00"
                value={editingOffer.payout}
                onChange={(event) => {
                  const val = parseFloat(event.currentTarget.value);
                  setEditingOffer(prev => prev ? { ...prev, payout: isNaN(val) ? 0 : val } : null);
                }}
                type="number"
                step="0.01"
                required
              />
              <TextInput
                label="Currency"
                placeholder="e.g., USD"
                value={editingOffer.currency}
                onChange={(event) => setEditingOffer(prev => prev ? { ...prev, currency: event.currentTarget.value } : null)}
                required
              />
            </Group>
            <Select
              label="Status"
              data={[
                { value: 'pending', label: 'Pending' },
                { value: 'active', label: 'Active' },
                { value: 'expired', label: 'Expired' },
              ]}
              value={editingOffer.status}
              onChange={(value) => setEditingOffer(prev => prev ? { ...prev, status: value as 'pending' | 'active' | 'expired' } : null)}
              required
              mb="md"
            />

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeEditModal}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </Group>
          </form>
        )}
      </Modal>

      {/* Advertiser Modal */}
      <Modal
        opened={advertiserModalOpened}
        onClose={closeAdvertiserModal}
        title={`Edit Commission for: ${advertiserForm?.name || ''}`} // Updated modal title
        centered
      >
        {advertiserForm && (
          <form
            onSubmit={e => {
              e.preventDefault();
              handleAdvertiserFormSave();
            }}
          >
            <Box mb="md">
              <Text mb="xs" fw={500}>{advertiserForm.name}</Text>
              <TextInput
                label="Commission Percent"
                placeholder="Enter new commission percent"
                value={advertiserForm.commission_percent || ''}
                onChange={e => {
                  setAdvertiserForm(f => f ? { ...f, commission_percent: e.currentTarget.value } : f);
                }}
                mb="sm"
              />
              <TextInput
                label="Conversion Cut"
                placeholder="Enter new conversion cut"
                value={advertiserForm.commission_cut}
                onChange={e => {
                  setAdvertiserForm(f => f ? { ...f, commission_cut: e.currentTarget.value } : f);
                }}
                mb="sm"
              />
            </Box>
            <Group justify="flex-end">
              <Button variant="default" onClick={closeAdvertiserModal}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </Group>
          </form>
        )}
      </Modal>

      {/* Delete Offer Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setOfferToDelete(null);
        }}
        title="Confirm Delete"
        centered
      >
        <Text mb="sm">
          Are you sure you want to delete{' '}
          <b>{offerToDelete?.name}</b>?
        </Text>

        <Text size="sm" color="dimmed" mb="md">
          This action cannot be undone.
        </Text>

        <Group justify="flex-end">
          <ActionIcon
            variant="outline"
            onClick={() => {
              setDeleteModalOpened(false);
              setOfferToDelete(null);
            }}
          >
            <IconX size={18} />
          </ActionIcon>

          <ActionIcon
            color="red"
            variant="filled"
            loading={deleting}
            onClick={deleteOffer}
          >
            <IconTrash size={18} />
          </ActionIcon>
        </Group>
      </Modal>
    </Container>
  );
};

export default AllOffers;