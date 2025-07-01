'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Container, Text, Table, Group, Badge,
  TextInput, Select, Pagination, ActionIcon, Paper, Flex,
  Skeleton, Modal, Button, NumberInput,
  Stack,
  Textarea // Import MultiSelect for multiple publishers
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { DateInput } from '@mantine/dates';
import {
  IconSearch, IconEdit, IconCheck, IconBan, IconCopy, IconPlayerPlay,
  IconClockHour4, IconTicket, IconCalendarOff, IconCircleX
} from '@tabler/icons-react';
import { showNotification } from '@/app/utils/notificationManager';

// Define the updated interface for a Coupon
interface Coupon {
  id: string;
  code: string;
  description: string;
  discount: number;
  discountType: 'percentage' | 'fixed_amount';
  offerId: string;
  offerName: string;
  publisherIds: string[]; // Changed to an array of strings
  publisherNames: string[]; // Changed to an array of strings for display
  validFrom: string; // ISO string for easy parsing
  validTo: string; // ISO string for easy parsing
  status: 'pending' | 'active' | 'expired' | 'terminated';
  creationDate: string; // ISO string
}

// Interface for API response structure for GET list
interface CouponsListApiResponse {
  coupons: Coupon[];
  totalCount: number;
}

// Interface for Offer data (for dropdown)
interface Offer {
  id: string;
  name: string;
}

// Interface for Publisher data (for dropdown)
interface Publisher {
  id: string;
  name: string;
}

const AllCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'active' | 'expired' | 'terminated'>('all');
  const [activePage, setActivePage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // State for edit modal
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // States for dynamic dropdowns in edit modal
  const [, setOffers] = useState<Offer[]>([]);
  const [, setPublishers] = useState<Publisher[]>([]);

  // Media query for mobile view
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Calculate total pages based on totalItems from backend
  const totalPages = useMemo(() => Math.ceil(totalItems / itemsPerPage), [totalItems, itemsPerPage]);

  // --- Fetch Coupons from Backend ---
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('limit', String(itemsPerPage));
      params.append('offset', String((activePage - 1) * itemsPerPage));

      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const response = await fetch(`/api/admin/coupons?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch coupons.');
      }

      const result: CouponsListApiResponse = await response.json();

      const processedCoupons = result.coupons.map(coupon => {
        let currentStatus = coupon.status;
        if (currentStatus !== 'terminated' && new Date(coupon.validTo) < new Date()) {
          currentStatus = 'expired';
        }
        return {
          ...coupon,
          status: currentStatus,
          // Ensure publisherIds and publisherNames are arrays, even if empty from backend
          publisherIds: coupon.publisherIds || [],
          publisherNames: coupon.publisherNames || []
        };
      });

      setCoupons(processedCoupons);
      setTotalItems(result.totalCount);

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
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage, activePage, searchQuery, filterStatus]);

  // --- Fetch Offers from Backend (for dropdown) ---
  const fetchOffers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/offers'); // Assuming this endpoint exists
      if (!response.ok) {
        throw new Error('Failed to fetch offers.');
      }
      const data: Offer[] = await response.json(); // Assuming direct array of offers
      setOffers(data);
    } catch (error) {
      console.error('Error fetching offers:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to load offers for editing.',
        color: 'red',
        withClose: false
      });
    }
  }, []);

  // --- Fetch Publishers from Backend (for dropdown) ---
  const fetchPublishers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/publishers'); // Assuming this endpoint exists
      if (!response.ok) {
        throw new Error('Failed to fetch publishers.');
      }
      const data: Publisher[] = await response.json(); // Assuming direct array of publishers
      setPublishers(data);
    } catch (error) {
      console.error('Error fetching publishers:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to load publishers for editing.',
        color: 'red',
        withClose: false
      });
    }
  }, []);


  useEffect(() => {
    fetchCoupons();
    fetchOffers(); // Fetch offers when component mounts
    fetchPublishers(); // Fetch publishers when component mounts
  }, [fetchCoupons, fetchOffers, fetchPublishers]);

  // Update effect for pagination when totalItems changes, to prevent page out of bounds
  useEffect(() => {
    if (activePage > totalPages && totalPages > 0) {
      setActivePage(totalPages);
    } else if (totalPages === 0 && activePage !== 1) { // If no items, reset to page 1
      setActivePage(1);
    }
  }, [totalPages, activePage]);


  // --- Update Coupon Status (Real API Call) ---
  const updateCouponStatus = async (id: string, newStatus: 'active' | 'terminated') => {
    try {
      const response = await fetch(`/api/admin/coupons/${id}/status`, { // Assuming this endpoint exists for status updates
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update coupon status to ${newStatus}.`);
      }

      const result = await response.json();

      if (result.updatedCoupon) {
        setCoupons(prev =>
          prev.map(c =>
            c.id === id ? { ...c, status: result.updatedCoupon.status } : c
          )
        );
        showNotification({
          title: 'Success',
          message: `Coupon status updated to ${newStatus}.`,
          color: newStatus === 'active' ? 'green' : 'red',
          withClose: false,
        });
      } else {
        throw new Error('Failed to update coupon status, no updated data returned.');
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
      console.error('Error updating coupon status:', err);
    }
  };

  const handleApprove = (id: string) => updateCouponStatus(id, 'active');
  const handleTerminate = (id: string) => updateCouponStatus(id, 'terminated');
  const handleActivate = (id: string) => updateCouponStatus(id, 'active');


  // Handle edit action
  const handleEdit = (coupon: Coupon) => {
    // Clone the coupon to avoid direct state mutation during editing
    setEditingCoupon({ ...coupon });
    openEditModal();
  };

  // Handle saving edited coupon (Real API Call)
  const handleSaveEdit = async () => {
    if (!editingCoupon) {
      showNotification({
        title: 'Error',
        message: 'No coupon selected for editing.',
        color: 'red',
        withClose: false,
      });
      return;
    }

    // Basic client-side validation for dates
    const fromDate = new Date(editingCoupon.validFrom);
    const toDate = new Date(editingCoupon.validTo);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()) || fromDate >= toDate) {
      showNotification({
        title: 'Validation Error',
        message: 'Valid From date must be before Valid To date or dates are invalid.',
        color: 'red',
        withClose: false,
      });
      return;
    }

    // Validate that offerId and publisherIds are selected
    if (!editingCoupon.offerId) {
        showNotification({
            title: 'Validation Error',
            message: 'Offer is required.',
            color: 'red',
            withClose: false,
        });
        return;
    }
    if (!editingCoupon.publisherIds || editingCoupon.publisherIds.length === 0) {
        showNotification({
            title: 'Validation Error',
            message: 'At least one publisher is required.',
            color: 'red',
            withClose: false,
        });
        return;
    }

    try {
      const response = await fetch(`/api/admin/coupons/${editingCoupon.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: editingCoupon.code,
          description: editingCoupon.description,
          discount: editingCoupon.discount,
          discountType: editingCoupon.discountType,
          offerId: editingCoupon.offerId,
          publisherIds: editingCoupon.publisherIds, // Send the array of publisher IDs
          validFrom: editingCoupon.validFrom,
          validTo: editingCoupon.validTo,
          status: editingCoupon.status
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update coupon: ${editingCoupon.code}.`);
      }

      const result = await response.json();

      if (result.updatedCoupon) {
        setCoupons(prev =>
          prev.map(c =>
            c.id === editingCoupon.id
              ? {
                  ...c,
                  ...result.updatedCoupon,
                  // Ensure publisherIds and publisherNames are updated from the response
                  publisherIds: result.updatedCoupon.publisherIds || [],
                  publisherNames: result.updatedCoupon.publisherNames || [],
                }
              : c
          )
        );
        showNotification({
          title: 'Success',
          message: 'Coupon updated successfully!',
          color: 'green',
          withClose: false,
        });
        closeEditModal();
        setEditingCoupon(null);
      } else {
        throw new Error('Failed to update coupon, no updated data returned.');
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
      console.error('Error saving coupon:', err);
    }
  };

  const getStatusBadge = (status: 'pending' | 'active' | 'expired' | 'terminated') => {
    switch (status) {
      case 'pending':
        return <Badge color="yellow" leftSection={<IconClockHour4 size={12} />} variant="light">Pending</Badge>;
      case 'active':
        return <Badge color="green" leftSection={<IconTicket size={12} />} variant="light">Active</Badge>;
      case 'expired':
        return <Badge color="gray" leftSection={<IconCalendarOff size={12} />} variant="light">Expired</Badge>;
      case 'terminated':
        return <Badge color="red" leftSection={<IconCircleX size={12} />} variant="light">Terminated</Badge>;
      default:
        return <Badge color="gray">Unknown</Badge>;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showNotification({
        title: 'Copied!',
        message: 'Coupon code copied to clipboard.',
        withClose: false,
      });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

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
            placeholder="Search by code, offer, description, or publisher"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.currentTarget.value);
              setActivePage(1);
            }}
            leftSection={<IconSearch size={16} />}
            style={{ flexGrow: 1, minWidth: '250px' }}
          />
          <Select
            data={[
              { value: 'all', label: 'All Statuses' },
              { value: 'pending', label: 'Pending Approval' },
              { value: 'active', label: 'Active' },
              { value: 'expired', label: 'Expired' },
              { value: 'terminated', label: 'Terminated' },
            ]}
            value={filterStatus}
            onChange={(value) => {
              setFilterStatus(value as typeof filterStatus);
              setActivePage(1);
            }}
            placeholder="Filter by status"
            clearable
            style={{ minWidth: '150px' }}
          />
        </Flex>

        {coupons.length === 0 ? (
          <Text style={{ textAlign: 'center' }} py="xl" color="dimmed">
            No coupons found matching your criteria.
          </Text>
        ) : (
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                {[
                  <Table.Th key="code">Code</Table.Th>,
                  ...(!isMobile
                    ? [
                        <Table.Th key="description">Description</Table.Th>,
                        <Table.Th key="discount">Discount</Table.Th>,
                        <Table.Th key="offer">Offer</Table.Th>,
                        <Table.Th key="validFrom">Valid From</Table.Th>,
                        <Table.Th key="validTo">Valid To</Table.Th>,
                        <Table.Th key="status">Status</Table.Th>,
                      ]
                    : []),
                  <Table.Th key="publishers">Publishers</Table.Th>,
                  <Table.Th key="actions">Actions</Table.Th>,
                ]}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {coupons.map((coupon) => {
                const cells = [
                  <Table.Td key="code">
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" className="font-semibold">{coupon.code}</Text>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={() => copyToClipboard(coupon.code)}
                        title="Copy Code"
                        size="sm"
                      >
                        <IconCopy size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>,
                  ...(!isMobile
                    ? [
                        <Table.Td
                          key="description"
                          style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          <Text size="sm" title={coupon.description}>{coupon.description}</Text>
                        </Table.Td>,
                        <Table.Td key="discount">
                          {coupon.discountType === 'percentage' ? `${coupon.discount}%` : `$${coupon.discount?.toFixed(2) ?? '0.00'}`}
                        </Table.Td>,
                        <Table.Td key="offer">{coupon.offerName}</Table.Td>,
                        <Table.Td key="validFrom">{new Date(coupon.validFrom).toLocaleDateString()}</Table.Td>,
                        <Table.Td key="validTo">{new Date(coupon.validTo).toLocaleDateString()}</Table.Td>,
                        <Table.Td key="status">{getStatusBadge(coupon.status)}</Table.Td>,
                      ]
                    : []),
                  <Table.Td key="publishers">
                    <Text size="sm" title={coupon.publisherNames.join(', ')}>
                      {coupon.publisherNames.join(', ')}
                    </Text>
                  </Table.Td>,
                  <Table.Td key="actions">
                    <Group gap="xs" wrap="nowrap">
                      <ActionIcon
                        variant="filled"
                        color="blue"
                        size="lg"
                        onClick={() => handleEdit(coupon)}
                        aria-label="Edit Coupon"
                        title="Edit Coupon"
                      >
                        <IconEdit size={20} />
                      </ActionIcon>
                      {coupon.status === 'pending' && (
                        <ActionIcon
                          variant="filled"
                          color="green"
                          size="lg"
                          onClick={() => handleApprove(coupon.id)}
                          aria-label="Approve Coupon"
                          title="Approve Coupon"
                        >
                          <IconCheck size={20} />
                        </ActionIcon>
                      )}
                      {coupon.status === 'active' && (
                        <ActionIcon
                          variant="filled"
                          color="red"
                          size="lg"
                          onClick={() => handleTerminate(coupon.id)}
                          aria-label="Terminate Coupon"
                          title="Terminate Coupon"
                        >
                          <IconBan size={20} />
                        </ActionIcon>
                      )}
                      {(coupon.status === 'terminated' || coupon.status === 'expired') && (
                        <ActionIcon
                          variant="filled"
                          color="orange"
                          size="lg"
                          onClick={() => handleActivate(coupon.id)}
                          aria-label="Activate Coupon"
                          title="Activate Coupon"
                        >
                          <IconPlayerPlay size={20} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Table.Td>,
                ];

                return <Table.Tr key={coupon.id}>{cells}</Table.Tr>;
              })}
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

      {/* Edit Coupon Modal */}
      <Modal opened={editModalOpened} onClose={closeEditModal} title={`Edit Coupon: ${editingCoupon?.code || ''}`} centered>
        {editingCoupon && (
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSaveEdit();
          }}>
            <Stack gap="sm">
              <TextInput
                label="Coupon Code"
                placeholder="e.g., BLACKFRIDAY"
                value={editingCoupon.code}
                onChange={(event) => setEditingCoupon(prev => prev ? { ...prev, code: event.currentTarget.value } : null)}
                required
                mb="sm"
              />
              <Textarea
                label="Description"
                placeholder="Describe the coupon and its usage."
                value={editingCoupon.description}
                onChange={(event) => setEditingCoupon(prev => prev ? { ...prev, description: event.currentTarget.value } : null)}
                minRows={2}
                required
                mb="sm"
              />
              <Group grow mb="sm">
                <NumberInput
                  label="Discount Value"
                  placeholder="e.g., 20 or 5.00"
                  value={editingCoupon.discount}
                  onChange={(value) => setEditingCoupon(prev => prev ? { ...prev, discount: value as number } : null)}
                  min={0}
                  required
                />
                <Select
                  label="Discount Type"
                  placeholder="Select type"
                  data={[
                    { value: 'percentage', label: 'Percentage (%)' },
                    { value: 'fixed_amount', label: 'Fixed Amount ($)' },
                  ]}
                  value={editingCoupon.discountType}
                  onChange={(value) => setEditingCoupon(prev => prev ? { ...prev, discountType: value as 'percentage' | 'fixed_amount' } : null)}
                  required
                />
              </Group>



              <Group grow mb="md">
                <DateInput
                  label="Valid From"
                  placeholder="Select start date"
                  value={editingCoupon.validFrom ? new Date(editingCoupon.validFrom) : null}
                  onChange={(value) => setEditingCoupon(prev => prev ? { ...prev, validFrom: value ? value.toString() : '' } : null)}
                  required
                />
                <DateInput
                  label="Valid To"
                  placeholder="Select end date"
                  value={editingCoupon.validTo ? new Date(editingCoupon.validTo) : null}
                  onChange={(value) => setEditingCoupon(prev => prev ? { ...prev, validTo: value ? value.toString() : '' } : null)}
                  required
                />
              </Group>
            </Stack>
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeEditModal}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </Group>
          </form>
        )}
      </Modal>
    </Container>
  );
};

export default AllCoupons;