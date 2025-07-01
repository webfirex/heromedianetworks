// components/admin/AdminSmartlinksManagement.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react'; // Removed useMemo as its logic is handled by backend or directly
import {
  Container, Text, Table, Group, Badge,
  TextInput, Select, Pagination, ActionIcon, Paper, Flex, Button,
  Skeleton // Import Skeleton for loading states
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

import {
  IconCheck, IconSearch,
  IconClockHour4, IconRocket, IconBan, IconPlayerPlay, 
  IconExternalLink
} from '@tabler/icons-react';
import { showNotification } from '@/app/utils/notificationManager'; // Assuming you have this utility

// Define the interface for a Smartlink based on your backend's GET response
interface Smartlink {
  id: string;
  name: string; // Corresponds to 'name' in frontend
  url: string;  // Corresponds to 'url' in frontend
  creationDate: string; // Corresponds to 'creationDate' in frontend
  createdBy: string; // Corresponds to 'createdBy' in frontend
  status: 'pending' | 'active' | 'terminated';
}

interface SmartlinksApiResponse {
  data: Smartlink[];
  totalPages: number;
  totalFilteredItems: number;
}

const AdminSmartlinksManagement: React.FC = () => {
  const [smartlinks, setSmartlinks] = useState<Smartlink[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'active' | 'terminated'>('all');
  const [activePage, setActivePage] = useState(1);
  const [totalItems, setTotalItems] = useState(0); // Total items from backend
  const [totalPages, setTotalPages] = useState(1); // Total pages from backend
  const isMobile = useMediaQuery('(max-width: 768px)');



  // Function to fetch smartlinks from the backend with current filters and pagination
  const fetchSmartlinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      params.append('page', String(activePage)); // Pass current page

      const response = await fetch(`/api/admin/smartlinks?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch smartlinks.');
      }

      const result: SmartlinksApiResponse = await response.json();
      setSmartlinks(result.data);
      setTotalItems(result.totalFilteredItems);
      setTotalPages(result.totalPages);

    } catch (err: unknown) { // Change 'any' to 'unknown'
     let errorMessage = 'An unknown error occurred.';

     // Type narrowing: Check if err is an instance of Error
     if (err instanceof Error) {
       errorMessage = err.message;
     } else if (typeof err === 'string') {
       // Optional: Handle if the thrown error is just a string
       errorMessage = err;
     }
     // You can add more checks if you expect other specific error types

     setError(errorMessage); // Update your error state
     showNotification({
       title: 'Error',
       // Use the narrowed errorMessage
       message: errorMessage,
       color: 'red',
       withClose: false,
     });
     console.error('Error fetching/updating smartlink:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterStatus, activePage]); // Dependencies for useCallback

  // Effect to trigger data fetching whenever relevant state changes
  useEffect(() => {
    fetchSmartlinks();
  }, [fetchSmartlinks]); // Depend on fetchSmartlinks (which is memoized by useCallback)


  // Function to update smartlink status (sends to API)
  const updateSmartlinkStatus = async (id: string, newStatus: 'active' | 'terminated') => {
    try {
      const response = await fetch(`/api/admin/smartlinks/${id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Backend returns { error: 'message' }, so access errorData.error
        throw new Error(errorData.error || `Failed to update smartlink status to ${newStatus}.`);
      }

      const result = await response.json(); // Get success message from backend

      // Re-fetch data to ensure UI is in sync with the database, especially with server-side pagination/filtering
      await fetchSmartlinks();

      showNotification({
        title: 'Success',
        message: result.message || `Smartlink status updated to ${newStatus}.`, // Use backend message or fallback
        color: newStatus === 'active' ? 'green' : 'red',
        withClose: false,
      });
    } catch (err: unknown) { // Change 'any' to 'unknown'
     let errorMessage = 'An unknown error occurred.';

     // Type narrowing: Check if err is an instance of Error
     if (err instanceof Error) {
       errorMessage = err.message;
     } else if (typeof err === 'string') {
       // Optional: Handle if the thrown error is just a string
       errorMessage = err;
     }
     // You can add more checks if you expect other specific error types

     setError(errorMessage); // Update your error state
     showNotification({
       title: 'Error',
       // Use the narrowed errorMessage
       message: errorMessage,
       color: 'red',
       withClose: false,
     });
     console.error('Error fetching/updating smartlink:', err);
    }
  };

  const handleApprove = (id: string) => updateSmartlinkStatus(id, 'active');
  const handleTerminate = (id: string) => updateSmartlinkStatus(id, 'terminated');
  const handleActivate = (id: string) => updateSmartlinkStatus(id, 'active'); // Re-activate terminated smartlink

  // Helper function to get badge color and icon based on status
  const getStatusBadge = (status: 'pending' | 'active' | 'terminated') => {
    switch (status) {
      case 'pending':
        return <Badge color="yellow" leftSection={<IconClockHour4 size={12} />} variant="light">Pending</Badge>;
      case 'active':
        return <Badge color="green" leftSection={<IconRocket size={12} />} variant="light">Active</Badge>;
      case 'terminated':
        return <Badge color="red" leftSection={<IconBan size={12} />} variant="light">Terminated</Badge>;
      default:
        return <Badge color="gray">Unknown</Badge>;
    }
  };


  // --- CONDITIONAL RENDERING FOR LOADING AND ERROR STATES ---

  // Render Skeleton while loading
  if (loading) {
    return (
      <Container size="xl" py="md">
        <Paper shadow="sm" radius="md" p="md" withBorder>
          <Skeleton height={40} mb="md" width="100%" />
          <Skeleton height={300} mb="md" width="100%" />
        </Paper>
      </Container>
    );
  }

  // --- MAIN COMPONENT RENDER (ONLY if not loading and no error) ---
  return (
    <Container size="xl" py="md">
      <Paper shadow="sm" radius="md" p="md" withBorder>
        <Flex justify="space-between" align="center" mb="md" wrap="wrap" gap="md">
          <TextInput
            placeholder="Search by offer name, URL, or publisher"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.currentTarget.value);
              setActivePage(1); // Reset to first page on search
            }}
            leftSection={<IconSearch size={16} />}
            style={{ flexGrow: 1, minWidth: '250px' }}
          />
          <Select
            data={[
              { value: 'all', label: 'All Statuses' },
              { value: 'pending', label: 'Pending Approval' },
              { value: 'active', label: 'Active' },
              { value: 'terminated', label: 'Terminated' },
            ]}
            value={filterStatus}
            onChange={(value) => {
              setFilterStatus(value as typeof filterStatus);
              setActivePage(1); // Reset to first page on filter change
            }}
            placeholder="Filter by status"
            clearable
            style={{ minWidth: '150px' }}
          />
        </Flex>

        {smartlinks.length === 0 && totalItems === 0 ? (
          <Text style={{ textAlign: 'center' }} py="xl" color="dimmed">
            No smartlinks found matching your criteria.
          </Text>
        ) : (
          <Table striped highlightOnHover withTableBorder withColumnBorders>
  <Table.Thead>
    <Table.Tr>
      <Table.Th>Name</Table.Th>
      <Table.Th>URL</Table.Th>
      {!isMobile && <Table.Th>Created At</Table.Th>}
      <Table.Th>By</Table.Th>
      {!isMobile && <Table.Th>Status</Table.Th>}
      <Table.Th>Actions</Table.Th>
    </Table.Tr>
  </Table.Thead>

  <Table.Tbody>
    {smartlinks.map((smartlink) => (
      <Table.Tr key={smartlink.id}>
        <Table.Td>{smartlink.name}</Table.Td>

        <Table.Td>
          <Button
            component="a"
            href={smartlink.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            variant="subtle"
            color="blue"
            leftSection={<IconExternalLink size={16} />}
            style={{ fontSize: 14 }}
          >
            Visit
          </Button>
        </Table.Td>

        {!isMobile && (
          <Table.Td>
            {new Date(smartlink.creationDate).toLocaleDateString()}
          </Table.Td>
        )}

        <Table.Td>{smartlink.createdBy}</Table.Td>

        {!isMobile && <Table.Td>{getStatusBadge(smartlink.status)}</Table.Td>}

        <Table.Td>
          <Group gap="xs" wrap="nowrap">
            {smartlink.status === 'pending' && (
              <ActionIcon
                variant="filled"
                color="green"
                onClick={() => handleApprove(smartlink.id)}
                aria-label="Approve"
                title="Approve Smartlink"
              >
                <IconCheck size={18} />
              </ActionIcon>
            )}
            {smartlink.status === 'active' && (
              <ActionIcon
                variant="filled"
                color="red"
                onClick={() => handleTerminate(smartlink.id)}
                aria-label="Terminate"
                title="Terminate Smartlink"
              >
                <IconBan size={18} />
              </ActionIcon>
            )}
            {smartlink.status === 'terminated' && (
              <ActionIcon
                variant="filled"
                color="blue"
                onClick={() => handleActivate(smartlink.id)}
                aria-label="Activate"
                title="Activate Smartlink"
              >
                <IconPlayerPlay size={18} />
              </ActionIcon>
            )}
          </Group>
        </Table.Td>
      </Table.Tr>
    ))}
  </Table.Tbody>
</Table>

        )}

        {/* Pagination controls */}
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
    </Container>
  );
};

export default AdminSmartlinksManagement;