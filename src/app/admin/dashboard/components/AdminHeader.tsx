// app/admin/components/AdminHeader.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Title, Menu, Avatar, Flex, Group,
  Drawer, Text, Button, PasswordInput, Loader, Modal // Added Modal
} from '@mantine/core';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import {
  IconSettings,
  IconLogout,
  IconMail,
  IconCalendarTime,
  IconLock,
  IconPlus, // Import IconPlus
  IconFileText // Import IconFileText
} from '@tabler/icons-react';
import { showNotification } from '@/app/utils/notificationManager'; 
import AddLinkForm from './AddLinkForm';

interface AdminHeaderProps {
  activeTab: string;
  isMobile?: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const primary = '#4169E1';

const AdminHeader: React.FC<AdminHeaderProps> = ({ activeTab, isMobile, setSidebarOpen }) => {
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [addLinkOpen, setAddLinkOpen] = useState(false); // State for Add Link modal
  const { data: session, status } = useSession();

  // State for password reset form (NEW)
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [registeredAt, setRegisteredAt] = useState<string | null>(null);

useEffect(() => {
  const fetchRegisteredAt = async () => {
    try {
      const res = await fetch('/api/admin/profile');
      const data = await res.json();
      if (res.ok) {
        setRegisteredAt(new Date(data.registeredAt).toLocaleString());
      }
    } catch (error) {
      console.error('Error fetching registeredAt:', error);
    }
  };

  fetchRegisteredAt();
}, []);


  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Admin Dashboard';
      case 'all-offers': return 'All Offers';
      case 'add-offers': return 'Add Offers';
      case 'all-coupons': return 'All Coupons';
      case 'add-coupons': return 'Add Coupons';
      case 'access': return 'Access Management';
      case 'smartlinks': return 'Smartlinks Management';
      case 'approve': return 'Admin Approval';
      case 'mail': return 'Admin Mail';
      case 'postback': return 'Postback Management';
      default: return 'Admin Panel';
    }
  };

  const userInitial = session?.user?.name?.[0] || session?.user?.email?.[0]?.toUpperCase() || 'U';

  // Handle password reset submission (NEW)
  const handlePasswordResetSubmit = async () => {
    if (newPassword !== confirmNewPassword) {
      showNotification({
        title: 'Error',
        message: 'New passwords do not match.',
        color: 'red',
        withClose: false
      });
      return;
    }

    if (newPassword.length < 8) { // Basic password length validation
      showNotification({
        title: 'Error',
        message: 'Password must be at least 8 characters long.',
        color: 'red',
        withClose: false
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      // Send PATCH request to a new API endpoint for current user's password reset
      const response = await fetch('/api/admin/profile/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      showNotification({
        title: 'Success',
        message: 'Password reset successfully!',
        color: 'green',
        withClose: false
      });
      setSettingsOpened(false); // Close the drawer on success
      setNewPassword(''); // Clear the password fields
      setConfirmNewPassword('');
    } catch (error) {
      console.error('Error resetting password:', error);
      showNotification({
        title: 'Error',
        message: 'An error occurred while resetting password.',
        color: 'red',
        withClose: false
      });
    } finally {
      setIsResettingPassword(false);
    }
  };


  return (
    <>
      <Flex
        justify="space-between"
        align="center"
        px="xl"
        py="md"
        bg="white"
        style={{ borderBottom: '1px solid #e0e0e0', position: 'sticky', top: 0, zIndex: 10 }}
      >
        {isMobile ? (
          <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Image
              src="/assests/logo.png"
              alt="Logo"
              width={32}
              height={32}
              style={{ cursor: 'pointer', flexShrink: 0 }}
              onClick={() => setSidebarOpen(true)}
            />
            <Title order={4} style={{ color: primary, fontSize: '16px', whiteSpace: 'nowrap' }}>
              {getTabTitle(activeTab)}
            </Title>
          </Box>
        ) : (
          <Title order={3} style={{ color: primary, marginRight: 24, minWidth: 180 }}>
            {getTabTitle(activeTab)}
          </Title>
        )}

        {/* Action buttons and avatar: desktop vs mobile */}
        <Group gap={0}>
          {isMobile ? (
            <>
              {activeTab === 'postback' && (
                <Button
                  variant="light"
                  color="indigo"
                  size="sm"
                  style={{ marginRight: 8, padding: 6, minWidth: 0 }}
                  onClick={() => setAddLinkOpen(true)}
                >
                  <IconPlus size={20} />
                </Button>
              )}
              <Button
                variant="light"
                color="blue"
                size="sm"
                style={{ padding: 6, minWidth: 0, marginRight: 8 }}
                onClick={() => window.open('/admin/dashboard/documentation', '_blank')}
              >
                <IconFileText size={20} />
              </Button>
            </>
          ) : (
            <>
              {activeTab === 'postback' && (
                <Button
                  variant="light"
                  color="indigo"
                  size="sm"
                  style={{ marginRight: 12 }}
                  onClick={() => setAddLinkOpen(true)}
                >
                  + Add Link
                </Button>
              )}
              <Button
                variant="light"
                color="blue"
                size="sm"
                style={{ marginRight: 12 }}
                onClick={() => window.open('/admin/dashboard/documentation', '_blank')}
              >
                Documentation
              </Button>
            </>
          )}
          <Menu shadow="md" width={180} position="bottom-end">
            <Menu.Target>
              {status === 'loading' ? (
                <Loader size="sm" />
              ) : (
                <Avatar radius="xl" size={36} color="blue" style={{ cursor: 'pointer' }}>
                  {userInitial}
                </Avatar>
              )}
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconSettings size={14} />} onClick={() => setSettingsOpened(true)}>User Settings</Menu.Item>
              <Menu.Divider />
              <Menu.Item color="red" leftSection={<IconLogout size={14} />} onClick={() => signOut()}>Logout</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Flex>

      {/* Settings Drawer */}
      <Drawer
        opened={settingsOpened}
        onClose={() => setSettingsOpened(false)}
        title={<Text size="lg" fw={600}>User Settings</Text>}
        position="right"
        size="lg"
        padding="xl"
      >

        <Box>
          <Title order={4} mb="md">Account Info</Title>
          {status === 'loading' ? (
            <Loader size="sm" />
          ) : (
            <>
              <Group gap="xs" mb="xs">
                <IconMail size={18} color="gray" />
                <Text>Email: {session?.user?.email || 'N/A'}</Text>
              </Group>
              <Group gap="xs" mb="md">
                <IconCalendarTime size={18} color="gray" />
                <Text>Registered: {registeredAt || 'Loading...'}</Text>
              </Group>

            </>
          )}

          <Title order={5} mb="xs">Reset Password</Title>
          <PasswordInput
            placeholder="Your new password"
            leftSection={<IconLock size={16} />}
            value={newPassword} // Bind value
            onChange={(event) => setNewPassword(event.currentTarget.value)} // Bind onChange
            mb="sm"
          />
          <PasswordInput
            placeholder="Confirm new password"
            leftSection={<IconLock size={16} />}
            value={confirmNewPassword} // Bind value
            onChange={(event) => setConfirmNewPassword(event.currentTarget.value)} // Bind onChange
            mb="md"
          />
          <Button
            color="indigo"
            fullWidth
            onClick={handlePasswordResetSubmit} // Wire up click handler
            loading={isResettingPassword} // Show loading state
          >
            Reset Password
          </Button>
        </Box>
      </Drawer>

      {/* Add Link Modal */}
      <Modal opened={addLinkOpen} onClose={() => setAddLinkOpen(false)} title="Add Postback Link" centered>
        <AddLinkForm />
      </Modal>
    </>
  );
};

export default AdminHeader;