// app/admin/components/AdminAccess.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Container, Paper, Title, Button, Drawer, Modal,
  TextInput, PasswordInput, Select, Group, Text,
  Table, ScrollArea, Flex, Pagination, Skeleton, Badge, ActionIcon // Import ActionIcon
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
  IconPlus, IconMail, IconLock, IconUser, IconCheck, IconEdit, IconTrash
} from '@tabler/icons-react';
import { showNotification } from '@/app/utils/notificationManager';

// Admin interface based on common schema (adjust if your schema differs)
interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

const ApproveAdmin: React.FC = () => {
  // State for Add Admin Drawer
  const [addAdminOpened, { open: openAddAdmin, close: closeAddAdmin }] = useDisclosure(false);

  // Form states for adding new admin
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Admin['role']>('admin');
  const [status, setStatus] = useState<Admin['status']>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for listing admins
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalAdmins / itemsPerPage);

  // State for Password Update Drawer
  const [passwordUpdateOpened, { open: openPasswordUpdate, close: closePasswordUpdate }] = useDisclosure(false);
  const [selectedAdminForPassword, setSelectedAdminForPassword] = useState<Admin | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // State for Edit Admin Drawer
  const [editAdminOpened, { open: openEditAdmin, close: closeEditAdmin }] = useDisclosure(false);
  const [selectedAdminForEdit, setSelectedAdminForEdit] = useState<Admin | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<Admin['role']>('admin');
  const [editStatus, setEditStatus] = useState<Admin['status']>('active');
  const [isEditing, setIsEditing] = useState(false);

  // State for Delete Confirmation Modal (NEW)
  const [deleteConfirmationOpened, { open: openDeleteConfirmation, close: closeDeleteConfirmation }] = useDisclosure(false);
  const [adminToDeleteId, setAdminToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Media query for mobile view
  const isMobile = useMediaQuery('(max-width: 768px)');


  // --- Fetch Admins List ---
  const fetchAdmins = useCallback(async () => {
    setLoadingAdmins(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', String(itemsPerPage));
      params.append('offset', String((activePage - 1) * itemsPerPage));

      const response = await fetch(`/api/admin/admins?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch administrators.');
      }
      const data = await response.json();
      setAdmins(data.admins);
      setTotalAdmins(data.totalCount);
    } catch (error: unknown) {
      let errorMessage = 'Failed to load administrators.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      console.error('Error fetching admins:', error);
      showNotification({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        withClose: false
      });
    } finally {
      setLoadingAdmins(false);
    }
  }, [activePage, itemsPerPage]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);


  // --- Handle Add Admin Submission ---
  const handleAddAdminSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      showNotification({
        title: 'Error',
        message: 'Passwords do not match.',
        color: 'red',
        withClose: false
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role, status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add administrator.');
      }

      showNotification({
        title: 'Success',
        message: 'Administrator added successfully!',
        color: 'green',
        withClose: false
      });
      closeAddAdmin();
      // Reset form fields
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRole('admin');
      setStatus('active');
      fetchAdmins(); // Refresh the list
    } catch (error: unknown) {
      let errorMessage = 'An error occurred while adding admin.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      console.error('Error adding admin:', error);
      showNotification({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        withClose: false
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Handle Password Update Submission ---
  const handlePasswordUpdateSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedAdminForPassword) return;

    if (newPassword !== confirmNewPassword) {
      showNotification({
        title: 'Error',
        message: 'New passwords do not match.',
        color: 'red',
        withClose: false
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await fetch(`/api/admin/admins/${selectedAdminForPassword.id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
        credentials: 'include', // Ensure cookies are sent for authentication
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password.');
      }

      showNotification({
        title: 'Success',
        message: `Password for ${selectedAdminForPassword.email} updated successfully!`,
        color: 'green',
        withClose: false
      });
      closePasswordUpdate();
      setNewPassword('');
      setConfirmNewPassword('');
      setSelectedAdminForPassword(null);
    } catch (error: unknown) {
      let errorMessage = 'An error occurred while updating password.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      console.error('Error updating password:', error);
      showNotification({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        withClose: false
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const openPasswordModal = (admin: Admin) => {
    setSelectedAdminForPassword(admin);
    openPasswordUpdate();
  };

  // --- Handle Edit Admin ---
  const handleEditAdmin = (admin: Admin) => {
    setSelectedAdminForEdit(admin);
    setEditName(admin.name);
    setEditEmail(admin.email);
    setEditRole(admin.role);
    setEditStatus(admin.status);
    openEditAdmin();
  };

  // --- Handle Edit Admin Submission ---
  const handleEditAdminSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedAdminForEdit) return;

    setIsEditing(true);
    try {
      const response = await fetch(`/api/admin/admins/${selectedAdminForEdit.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          role: editRole,
          status: editStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update administrator.');
      }

      showNotification({
        title: 'Success',
        message: `Administrator ${editName} updated successfully!`,
        color: 'green',
        withClose: false,
      });
      closeEditAdmin();
      setSelectedAdminForEdit(null);
      fetchAdmins();
    } catch (error: unknown) {
      let errorMessage = 'An error occurred while updating admin.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      console.error('Error updating admin:', error);
      showNotification({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        withClose: false,
      });
    } finally {
      setIsEditing(false);
    }
  };

  // --- Handle Delete Admin (opens confirmation modal) --- (NEW)
  const handleDeleteAdmin = (adminId: string) => {
    setAdminToDeleteId(adminId);
    openDeleteConfirmation();
  };

  // --- Confirm Delete Admin (sends DELETE request) --- (NEW)
  const confirmDeleteAdmin = async () => {
    if (!adminToDeleteId) return; // Should not happen if modal is opened correctly

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/admins/${adminToDeleteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete administrator.');
      }

      showNotification({
        title: 'Success',
        message: 'Administrator deleted successfully!',
        color: 'green',
        withClose: false,
      });
      closeDeleteConfirmation();
      setAdminToDeleteId(null); // Clear the ID after deletion
      fetchAdmins(); // Refresh the list
    } catch (error: unknown) {
      let errorMessage = 'An error occurred while deleting admin.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      console.error('Error deleting admin:', error);
      showNotification({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        withClose: false,
      });
    } finally {
      setIsDeleting(false);
    }
  };


  if (loadingAdmins) {
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
          <Title order={3}>Administrators</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={openAddAdmin}
            variant="filled"
          >
            Add New Admin
          </Button>
        </Flex>

        {admins.length === 0 ? (
          <Text style={{ textAlign: 'center' }} py="xl" color="dimmed">
            No administrators found. Click Add New Admin to get started.
          </Text>
        ) : (
          <ScrollArea>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th fw={700}>Name</Table.Th>
                  {!isMobile && <Table.Th fw={700}>Email</Table.Th>}
                  <Table.Th fw={700}>Role</Table.Th>
                  {!isMobile && <Table.Th fw={700}>Status</Table.Th>}
                  {!isMobile && <Table.Th fw={700}>Registered Date</Table.Th>}
                  <Table.Th fw={700}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {admins.map((admin) => (
                  <Table.Tr key={admin.id}>
                    <Table.Td>{admin.name}</Table.Td>
                    {!isMobile && <Table.Td>{admin.email}</Table.Td>}
                    <Table.Td>
                      <Badge color={admin.role === 'super_admin' ? 'red' : admin.role === 'admin' ? 'blue' : 'gray'}>
                        {admin.role}
                      </Badge>
                    </Table.Td>
                    {!isMobile && (
                      <Table.Td>
                        <Badge color={admin.status === 'active' ? 'green' : 'red'}>
                          {admin.status}
                        </Badge>
                      </Table.Td>
                    )}
                    {!isMobile && <Table.Td>{new Date(admin.created_at).toLocaleDateString()}</Table.Td>}
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap">
                        {isMobile ? (
                          <>
                            <ActionIcon
                              variant="light"
                              color="blue"
                              size="lg" // Adjust size as needed for mobile tap targets
                              onClick={() => openPasswordModal(admin)}
                              aria-label="Update Password"
                              title="Update Password"
                            >
                              <IconLock size={20} />
                            </ActionIcon>
                            <ActionIcon
                              variant="light"
                              color="blue"
                              size="lg"
                              onClick={() => handleEditAdmin(admin)}
                              aria-label="Edit Admin"
                              title="Edit Admin"
                            >
                              <IconEdit size={20} />
                            </ActionIcon>
                            <ActionIcon
                              variant="light"
                              color="red"
                              size="lg"
                              onClick={() => handleDeleteAdmin(admin.id)}
                              aria-label="Delete Admin"
                              title="Delete Admin"
                            >
                              <IconTrash size={20} />
                            </ActionIcon>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="light"
                              size="xs"
                              leftSection={<IconLock size={14} />}
                              onClick={() => openPasswordModal(admin)}
                            >
                              Password
                            </Button>
                            <Button
                              variant="light"
                              size="xs"
                              color="blue"
                              leftSection={<IconEdit size={14} />}
                              onClick={() => handleEditAdmin(admin)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="light"
                              size="xs"
                              color="red"
                              leftSection={<IconTrash size={14} />}
                              onClick={() => handleDeleteAdmin(admin.id)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </Group>
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
            />
          </Flex>
        )}
      </Paper>

      {/* Add Admin Drawer */}
      <Drawer
        opened={addAdminOpened}
        onClose={closeAddAdmin}
        title="Add New Administrator"
        position="right"
        size="md"
        padding="xl"
      >
        <form onSubmit={handleAddAdminSubmit}>
          <TextInput
            label="Name"
            placeholder="Admin Name"
            leftSection={<IconUser size={16} />}
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            required
            mb="md"
          />
          <TextInput
            label="Email"
            placeholder="admin@example.com"
            type="email"
            leftSection={<IconMail size={16} />}
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            required
            mb="md"
          />
          <PasswordInput
            label="Password"
            placeholder="Enter password"
            leftSection={<IconLock size={16} />}
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            required
            mb="md"
          />
          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm password"
            leftSection={<IconLock size={16} />}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.currentTarget.value)}
            required
            mb="md"
          />
          <Select
            label="Status"
            placeholder="Select status"
            leftSection={<IconCheck size={16} />}
            data={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'suspended', label: 'Suspended' },
            ]}
            value={status}
            onChange={(value) => setStatus(value as Admin['status'])}
            required
            mb="lg"
          />
          <Button type="submit" fullWidth loading={isSubmitting}>
            Add Administrator
          </Button>
        </form>
      </Drawer>

      {/* Password Update Drawer */}
      <Drawer
        opened={passwordUpdateOpened}
        onClose={closePasswordUpdate}
        title={`Update Password for ${selectedAdminForPassword?.email || ''}`}
        position="right"
        size="sm"
        padding="xl"
      >
        {selectedAdminForPassword && (
          <form onSubmit={handlePasswordUpdateSubmit}>
            <Text mb="md">Updating password for: <Text span fw={700}>{selectedAdminForPassword.name}</Text></Text>
            <PasswordInput
              label="New Password"
              placeholder="Enter new password"
              leftSection={<IconLock size={16} />}
              value={newPassword}
              onChange={(event) => setNewPassword(event.currentTarget.value)}
              required
              mb="md"
            />
            <PasswordInput
              label="Confirm New Password"
              placeholder="Confirm new password"
              leftSection={<IconLock size={16} />}
              value={confirmNewPassword}
              onChange={(event) => setConfirmNewPassword(event.currentTarget.value)}
              required
              mb="lg"
            />
            <Button type="submit" fullWidth loading={isUpdatingPassword}>
              Update Password
            </Button>
          </form>
        )}
      </Drawer>

      {/* Edit Admin Drawer */}
      <Drawer
        opened={editAdminOpened}
        onClose={closeEditAdmin}
        title={`Edit Administrator: ${selectedAdminForEdit?.name || ''}`}
        position="right"
        size="md"
        padding="xl"
      >
        {selectedAdminForEdit && (
          <form onSubmit={handleEditAdminSubmit}>
            <TextInput
              label="Name"
              placeholder="Admin Name"
              leftSection={<IconUser size={16} />}
              value={editName}
              onChange={(event) => setEditName(event.currentTarget.value)}
              required
              mb="md"
            />
            <TextInput
              label="Email"
              placeholder="admin@example.com"
              type="email"
              leftSection={<IconMail size={16} />}
              value={editEmail}
              onChange={(event) => setEditEmail(event.currentTarget.value)}
              required
              mb="md"
            />
            <Select
              label="Status"
              placeholder="Select status"
              leftSection={<IconCheck size={16} />}
              data={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'suspended', label: 'Suspended' },
              ]}
              value={editStatus}
              onChange={(value) => setEditStatus(value as Admin['status'])}
              required
              mb="lg"
            />
            <Button type="submit" fullWidth loading={isEditing}>
              Save Changes
            </Button>
          </form>
        )}
      </Drawer>

      {/* Delete Confirmation Modal (NEW) */}
      <Modal
        opened={deleteConfirmationOpened}
        onClose={closeDeleteConfirmation}
        title={<Text fw={700}>Confirm Deletion</Text>}
        centered
      >
        <Text>Are you sure you want to delete this administrator?</Text>
        <Text color="red" fw={700} mt="xs">This action cannot be undone.</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeDeleteConfirmation} disabled={isDeleting}>
            Cancel
          </Button>
          <Button color="red" onClick={confirmDeleteAdmin} loading={isDeleting}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Container>
  );
};

export default ApproveAdmin;