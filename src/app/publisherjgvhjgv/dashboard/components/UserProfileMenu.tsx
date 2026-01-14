'use client';

import { useState, useEffect } from 'react';
import {
  Menu,
  Avatar,
  Group,
  Box,
  Drawer,
  Title,
  Text,
  PasswordInput,
  Button,
  Loader,
} from '@mantine/core';
import { IconSettings, IconLogout, IconMail, IconCalendarTime, IconLock } from '@tabler/icons-react';
import { signOut, useSession } from 'next-auth/react';
// Import your notification utility
import { showNotification } from '@/app/utils/notificationManager'; // Adjust path if necessary

interface UserProfileMenuAndSettingsProps {
  userNameInitial?: string;
  avatarSrc?: string | null;
}

export default function UserProfileMenuAndSettings({
  userNameInitial,
  avatarSrc,
}: UserProfileMenuAndSettingsProps) {
  const { data: session, status } = useSession();

  const [settingsOpened, setSettingsOpened] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [registeredAt, setRegisteredAt] = useState<string | null>(null);

  // Derive userInitial from session if available, otherwise use prop or default
  const displayUserInitial = userNameInitial || (session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U');

  // Fetch user registration date
  useEffect(() => {
    const fetchRegistrationDate = async () => {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          const response = await fetch(`/api/user-info?email=${session.user.email}`); // Assuming this is the correct endpoint for publisher info
          const data = await response.json();

          if (response.ok) {
            if (data.registeredAt) { // Check if registeredAt exists in the response
              setRegisteredAt(new Date(data.registeredAt).toLocaleDateString()); // Format date nicely
            } else if (data.createdAt) { // Fallback if your backend uses 'createdAt'
              setRegisteredAt(new Date(data.createdAt).toLocaleDateString());
            } else {
              setRegisteredAt('N/A'); // No date received
            }
          } else {
            console.error('Failed to fetch user registration date:', await response.json());
            showNotification({
              title: 'Error',
              message: 'Failed to load account information.',
              color: 'red',
              withClose: false
            });
          }
        } catch (error) {
          console.error('Network error fetching registration date:', error);
          showNotification({
            title: 'Error',
            message: 'Network error. Could not load account information.',
            color: 'red',
            withClose: false
          });
        }
      }
    };

    fetchRegistrationDate();
  }, [status, session?.user?.email]);


  const handlePasswordResetSubmit = async () => {
    if (newPassword !== confirmNewPassword) {
      showNotification({
        title: 'Password Mismatch',
        message: 'New password and confirm password do not match.',
        color: 'red',
        withClose: false
      });
      return;
    }

    if (newPassword.length < 6) { // Example: minimum password length
      showNotification({
        title: 'Password Too Short',
        message: 'Password must be at least 6 characters long.',
        color: 'red',
        withClose: false
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: session?.user?.email, newPassword }),
      });

      if (response.ok) {
        showNotification({
          title: 'Success!',
          message: 'Your password has been reset successfully. Please log in again.',
          color: 'green',
          withClose: false
        });
        setNewPassword('');
        setConfirmNewPassword('');
        setSettingsOpened(false); // Close drawer on success
        signOut(); // Force re-login after password change
      } else {
        const errorData = await response.json();
        showNotification({
          title: 'Password Reset Failed',
          message: errorData.error || 'Something went wrong. Please try again.',
          color: 'red',
          withClose: false
        });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      showNotification({
        title: 'Network Error',
        message: 'Could not connect to the server. Please try again.',
        color: 'red',
        withClose: false
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <>
      <Group>
        <Menu shadow="md" width={180} position="bottom-end">
          <Menu.Target>
            <Group style={{ cursor: 'pointer' }}>
              {status === 'loading' ? (
                <Loader size="sm" />
              ) : (
                <Avatar radius="xl" size={36} src={avatarSrc || null} color="blue">
                  {displayUserInitial}
                </Avatar>
              )}
            </Group>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconSettings size={14} />} onClick={() => setSettingsOpened(true)}>
              User Settings
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item color="red" leftSection={<IconLogout size={14} />} onClick={() => signOut()}>
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

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
            value={newPassword}
            onChange={(event) => setNewPassword(event.currentTarget.value)}
            mb="sm"
          />
          <PasswordInput
            placeholder="Confirm new password"
            leftSection={<IconLock size={16} />}
            value={confirmNewPassword}
            onChange={(event) => setConfirmNewPassword(event.currentTarget.value)}
            mb="md"
          />
          <Button
            color="indigo"
            fullWidth
            onClick={handlePasswordResetSubmit}
            loading={isResettingPassword}
            disabled={newPassword === '' || confirmNewPassword === '' || newPassword !== confirmNewPassword}
          >
            Reset Password
          </Button>
        </Box>
      </Drawer>
    </>
  );
}