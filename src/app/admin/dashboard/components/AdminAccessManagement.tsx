'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Container, Text, Table, Group, Badge,
  TextInput, Select, Pagination, ActionIcon, Paper, Flex,
  Skeleton, Grid, GridCol, Modal, Box, Divider
} from '@mantine/core';
import {
  IconCheck, IconX, IconSearch,
  IconClockHour4, IconUserCheck, IconUserOff,
  IconBan, IconEye, IconTrash
} from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import { showNotification } from '@/app/utils/notificationManager';

// useDebounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface Publisher {
  id: string;
  name: string;
  email: string;
  company: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface PublishersListApiResponse {
  data: Publisher[];
  total: number;
  totalPages: number;
  currentPage: number;
}

// --- Publisher Stats Types ---
interface PublisherStats {
  id: string;
  name: string;
  email: string;
  company: string;
  status: 'pending' | 'approved' | 'rejected';
  clicks: number;
  conversions: number;
  earnings: number;
  totalLinks: number;
  offers: Array<{
    offerName: string;
    clicks: number;
    conversions: number;
    commissionPercent: string;
    commissionCut: string;
    totalEarning: number;
  }>;
}

const AdminAccessManagement: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  const [searchInputValue, setSearchInputValue] = useState('');
  const debouncedSearchQuery = useDebounce(searchInputValue, 500);

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [activePage, setActivePage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [viewModalOpened, setViewModalOpened] = useState(false);
  const [selectedPublisherStats, setSelectedPublisherStats] = useState<PublisherStats | null>(null);

  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [publisherToDelete, setPublisherToDelete] = useState<Publisher | null>(null);
  const [deleting, setDeleting] = useState(false);


  const fetchPublishers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append('query', debouncedSearchQuery);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      params.append('page', String(activePage));
      params.append('limit', '10');

      const response = await fetch(`/api/admin/publishers?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch publishers.');

      const result: PublishersListApiResponse = await response.json();
      setPublishers(result.data);
      setTotalItems(result.total);
      setTotalPages(result.totalPages);
      setActivePage(result.currentPage);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      showNotification({ title: 'Error', message: errorMessage, color: 'red', withClose: false });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery, filterStatus, activePage]);

  useEffect(() => {
    fetchPublishers();
  }, [fetchPublishers]);

  const updatePublisherStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/admin/publishers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status.');
      const result = await response.json();
      await fetchPublishers();

      showNotification({
        title: 'Success',
        message: result.message || 'Status updated.',
        color: newStatus === 'approved' ? 'green' : 'red',
        withClose: false,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      showNotification({ title: 'Error', message: errorMessage, color: 'red', withClose: false });
    }
  };


  const deletePublisher = async () => {
    if (!publisherToDelete) return;

    try {
      setDeleting(true);

      const res = await fetch(`/api/admin/publishers/${publisherToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete publisher.');

      showNotification({
        title: 'Deleted',
        message: `${publisherToDelete.name} has been deleted.`,
        color: 'green',
        withClose: false,
      });

      setDeleteModalOpened(false);
      setPublisherToDelete(null);
      await fetchPublishers();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      showNotification({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        withClose: false,
      });
    } finally {
      setDeleting(false);
    }
  };


  const handleApprove = (id: string) => updatePublisherStatus(id, 'approved');
  const handleReject = (id: string) => updatePublisherStatus(id, 'rejected');
  const handleRevoke = (id: string) => updatePublisherStatus(id, 'rejected');

  const getStatusBadge = (status: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'pending':
        return <Badge color="yellow" leftSection={<IconClockHour4 size={12} />} variant="light" component="span">Pending</Badge>;
      case 'approved':
        return <Badge color="green" leftSection={<IconUserCheck size={12} />} variant="light" component="span">Approved</Badge>;
      case 'rejected':
        return <Badge color="red" leftSection={<IconUserOff size={12} />} variant="light" component="span">Rejected</Badge>;
      default:
        return <Badge color="gray" component="span">Unknown</Badge>;
    }
  };

  // Replace the mock fetchPublisherStats with a real API call
  const fetchPublisherStats = async (publisher: Publisher): Promise<PublisherStats> => {
    const res = await fetch(`/api/admin/publishers?publisherId=${publisher.id}`);
    if (!res.ok) throw new Error('Failed to fetch publisher stats');
    const data = await res.json();
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      company: data.company,
      status: data.status,
      clicks: data.clicks,
      conversions: data.conversions,
      earnings: data.earnings,
      totalLinks: data.totalLinks,
      offers: data.offers.map((offer: {
        offerName: string;
        clicks: number;
        conversions: number;
        commissionPercent: string;
        commissionCut: string;
        totalEarning: number;
      }) => ({
        offerName: offer.offerName,
        clicks: offer.clicks,
        conversions: offer.conversions,
        commissionPercent: offer.commissionPercent,
        commissionCut: offer.commissionCut,
        totalEarning: offer.totalEarning,
      })),
    };
  };

  const handleViewStats = async (publisher: Publisher) => {
    setViewModalOpened(true);
    setSelectedPublisherStats(null);
    const stats = await fetchPublisherStats(publisher);
    setSelectedPublisherStats(stats);
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
        <Grid mb="md" gutter="md">
          <GridCol span={{ base: 12, sm: 6, md: 8, lg: 9 }}>
            <TextInput
              placeholder="Search by name or email"
              value={searchInputValue}
              onChange={(e) => {
                setSearchInputValue(e.currentTarget.value);
                setActivePage(1);
              }}
              leftSection={<IconSearch size={16} />}
            />
          </GridCol>
          <GridCol span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
            <Select
              data={[
                { value: 'all', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ]}
              value={filterStatus}
              onChange={(value) => {
                setFilterStatus(value as typeof filterStatus);
                setActivePage(1);
              }}
              placeholder="Filter by status"
              clearable
            />
          </GridCol>
        </Grid>

        {totalItems === 0 ? (
          <Text style={{ textAlign: 'center' }} py="xl" color="dimmed">
            No publishers found matching your criteria.
          </Text>
        ) : (
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Company</Table.Th>
                {!isMobile && (
                  <>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Registration</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </>
                )}
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {publishers.map((publisher) => (
                <Table.Tr key={publisher.id}>
                  <Table.Td>{publisher.name}</Table.Td>
                  <Table.Td>{publisher.company}</Table.Td>
                  {!isMobile && (
                    <>
                      <Table.Td>{publisher.email}</Table.Td>
                      <Table.Td>{new Date(publisher.created_at).toLocaleDateString()}</Table.Td>
                      <Table.Td>{getStatusBadge(publisher.status)}</Table.Td>
                    </>
                  )}
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      <ActionIcon color="blue" variant="filled" onClick={() => handleViewStats(publisher)} title="View Stats"><IconEye size={18} /></ActionIcon>
                      {publisher.status === 'pending' && (
                        <>
                          <ActionIcon color="green" variant="filled" onClick={() => handleApprove(publisher.id)}><IconCheck size={18} /></ActionIcon>
                          <ActionIcon color="red" variant="filled" onClick={() => handleReject(publisher.id)}><IconX size={18} /></ActionIcon>
                        </>
                      )}
                      {publisher.status === 'approved' && (
                        <ActionIcon color="orange" variant="filled" onClick={() => handleRevoke(publisher.id)}><IconBan size={18} /></ActionIcon>
                      )}
                      {publisher.status === 'rejected' && (
                        <ActionIcon color="blue" variant="filled" onClick={() => handleApprove(publisher.id)}><IconCheck size={18} /></ActionIcon>
                      )}

                      <ActionIcon
                        color="red"
                        variant="filled"
                        onClick={() => {
                          setPublisherToDelete(publisher);
                          setDeleteModalOpened(true);
                        }}
                        title="Delete Publisher"
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
            <Pagination total={totalPages} value={activePage} onChange={setActivePage} />
          </Flex>
        )}
      </Paper>

      <Modal opened={viewModalOpened} onClose={() => setViewModalOpened(false)} title="Publisher Details & Stats" size="lg" centered>
        {!selectedPublisherStats ? (
          <Skeleton height={200} />
        ) : (
          <Box>
            <Text fw={600} size="lg" mb="xs">{selectedPublisherStats.name}</Text>
            <Text size="sm" mb={4}>Email: {selectedPublisherStats.email}</Text>
            <Text size="sm" mb={4}>Company: {selectedPublisherStats.company}</Text>
            <Box display="flex" mb={4}>
              <Text size="sm" mr={8} component="span">Account Status:</Text>
              {getStatusBadge(selectedPublisherStats.status)}
            </Box>
            <Divider my="sm" />
            <Text size="sm" mb={4}>Clicks: <b>{selectedPublisherStats.clicks}</b></Text>
            <Text size="sm" mb={4}>Conversions: <b>{selectedPublisherStats.conversions}</b></Text>
            <Text size="sm" mb={4}>Earnings: <b>${selectedPublisherStats.earnings.toFixed(2)}</b></Text>
            <Text size="sm" mb={4}>Total Links: <b>{selectedPublisherStats.totalLinks}</b></Text>
            <Divider my="sm" />
            <Text fw={500} mb={4}>Assigned Offers</Text>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Offer</Table.Th>
                  <Table.Th>Clicks</Table.Th>
                  <Table.Th>Conversions</Table.Th>
                  <Table.Th>Commission %</Table.Th>
                  <Table.Th>Commission Cut</Table.Th>
                  <Table.Th>Total Earning</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {selectedPublisherStats.offers.map((offer, idx) => (
                  <Table.Tr key={offer.offerName + idx}>
                    <Table.Td>{offer.offerName}</Table.Td>
                    <Table.Td>{offer.clicks}</Table.Td>
                    <Table.Td>{offer.conversions}</Table.Td>
                    <Table.Td>{offer.commissionPercent}</Table.Td>
                    <Table.Td>{offer.commissionCut}</Table.Td>
                    <Table.Td>${offer.totalEarning.toFixed(2)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        )}
      </Modal>
      <Modal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setPublisherToDelete(null);
        }}
        title="Confirm Delete"
        centered
      >
        <Text mb="sm">
          Are you sure you want to delete{' '}
          <b>{publisherToDelete?.name}</b>?
        </Text>

        <Text size="sm" color="dimmed" mb="md">
          This action cannot be undone.
        </Text>

        <Group justify="flex-end">
          <ActionIcon
            variant="outline"
            onClick={() => {
              setDeleteModalOpened(false);
              setPublisherToDelete(null);
            }}
          >
            <IconX size={18} />
          </ActionIcon>

          <ActionIcon
            color="red"
            variant="filled"
            loading={deleting}
            onClick={deletePublisher}
          >
            <IconTrash size={18} />
          </ActionIcon>
        </Group>
      </Modal>

    </Container>
  );
};

export default AdminAccessManagement;
