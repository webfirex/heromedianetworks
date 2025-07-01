'use client';

import {
  Box,
  Button,
  Flex,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Title,
  Modal,
  Center,
  Text,
  Skeleton,
  Image
} from '@mantine/core';
import {
  IconExternalLink,
  IconGift,
  IconLayoutDashboard,
  IconCalendar,
  IconRocket
} from '@tabler/icons-react';
import { DatePickerInput } from '@mantine/dates';
import { useState, useEffect } from 'react';
import ContentPanel from './components/ContentPanel';
import { useMediaQuery } from '@mantine/hooks';
import { signOut, useSession } from 'next-auth/react';
import UserProfileMenu from './components/UserProfileMenu';
import { showNotification } from '@/app/utils/notificationManager';

// 🎨 Colors (Matched to the provided image)
const primary = '#4169E1'; // Royal Blue

export default function PublisherDashboard() {
  const { data: session, status: sessionStatus } = useSession();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>(() => {
    const today = new Date();
    const oneWeekFromToday = new Date(today);
    oneWeekFromToday.setDate(today.getDate() - 7);
    return [oneWeekFromToday, today];
  });

  const [publisherStatus, setPublisherStatus] = useState<string | null>(null);
  const [loadingApproval, setLoadingApproval] = useState(true);
  const [approvalErrorMessage, setApprovalErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkPublisherStatus = async () => {
      if (sessionStatus === 'authenticated' && session?.user?.email) {
        setLoadingApproval(true);
        try {
          const response = await fetch(`/api/publisher/id?email=${session.user.email}`);
          const data = await response.json();

          if (response.ok) {
            setPublisherStatus(data.status);
            if (data.status === 'pending') {
              setPublisherStatus('pending');
              showNotification({
                title: 'Account Under Review',
                message: 'Your publisher account is currently under review. We\'ll notify you once it\'s approved.',
                color: 'red',
                withClose: false,
              });
            } else if (data.status === 'rejected') {
              setApprovalErrorMessage('Your account has been rejected. Please contact support for more information.');
              showNotification({
                title: 'Access Denied',
                message: 'Your publisher account has been rejected. Please contact support for assistance.',
                color: 'red',
                withClose: false,
              });
            }
          } else {
            setPublisherStatus('error');
            const errorMessage = data.error || 'Failed to verify approval status.';
            setApprovalErrorMessage(errorMessage);
            showNotification({
              title: 'Access Error',
              message: errorMessage,
              color: 'red',
              withClose: false,
            });
          }
        } catch (error) {
          console.error('Error checking publisher approval:', error);
          setPublisherStatus('error');
          const networkErrorMessage = 'Network error or unable to verify approval status. Please check your connection.';
          setApprovalErrorMessage(networkErrorMessage);
          showNotification({
            title: 'Network Error',
            message: networkErrorMessage,
            color: 'red',
            withClose: false,
          });
        } finally {
          setLoadingApproval(false);
        }
      } else if (sessionStatus === 'unauthenticated') {
        setLoadingApproval(false);
        setPublisherStatus('unauthenticated');
        setApprovalErrorMessage('You are not authenticated. Please log in.');
        showNotification({
          title: 'Authentication Required',
          message: 'Please log in to access the publisher dashboard.',
          color: 'red',
          withClose: false,
        });
      } else if (sessionStatus === 'loading') {
        setLoadingApproval(true);
        setPublisherStatus(null);
      }
    };

    if (sessionStatus !== 'loading' && publisherStatus === null) {
      checkPublisherStatus();
    }
  }, [sessionStatus, session?.user?.email, publisherStatus]);

  const renderDashboardContent = (isLoading: boolean) => (
    <>
      {/* Sidebar for desktop */}
      <Box
        w={collapsed ? 70 : 260}
        bg="white"
        p="sm"
        className="hide-scrollbar"
        style={{
          borderRight: '1px solid #eee',
          position: 'fixed',
          height: '100vh',
          overflowY: 'auto',
          transition: 'width 0.3s',
          zIndex: 100,
          display: isMobile ? 'none' : 'flex',
          flexDirection: 'column',
          left: 0,
          top: 0,
        }}
      >
        {/* Header */}
        <Flex justify="space-between" align="center" mb="lg">
          <Flex align="center" style={{ flex: 1, minWidth: 0 }}>
            {isLoading ? (
              <Skeleton circle height={32} width={32} mr={2} />
            ) : (
              <Image
                src="/assests/logo.png"
                alt="Logo"
                w={'40px'}
                style={{ marginRight: 2, flexShrink: 0, cursor: 'pointer' }}
                onClick={() => setCollapsed((c) => !c)}
              />
            )}
            {!collapsed && (
              isLoading ? (
                <Skeleton height={20} width="70%" />
              ) : (
                <Title
                  order={4}
                  style={{ color: primary, whiteSpace: 'nowrap', fontSize: '16px', cursor: 'pointer' }}
                  onClick={() => setCollapsed((c) => !c)}
                >
                  Hero Media Network
                </Title>
              )
            )}
          </Flex>
          {collapsed ? <div /> : null}
        </Flex>

        {/* Main Nav */}
        <Stack gap="xs" style={{ flex: 1 }}>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={36} radius="sm" mb={8} />
            ))
          ) : (
            <>
              <NavLink
                label={collapsed ? null : 'Dashboard'}
                leftSection={<IconLayoutDashboard size={18} />}
                active={activeTab === 'dashboard'}
                onClick={() => setActiveTab('dashboard')}
              />

              <NavLink
                label={collapsed ? null : 'My Offers'}
                leftSection={<IconGift size={18} />}
                active={activeTab === 'top-offers'}
                onClick={() => setActiveTab('top-offers')}
              />
              <NavLink
                label={collapsed ? null : 'Postback'}
                leftSection={<IconRocket size={18} />}
                active={activeTab === 'postback'}
                onClick={() => setActiveTab('postback')}
              />
            </>
          )}
        </Stack>

        {/* Footer - Contact Support */}
        {isLoading ? (
          <Skeleton height={36} radius="sm" mt="auto" />
        ) : (
          <NavLink
            label={collapsed ? null : 'Contact Support'}
            leftSection={<IconExternalLink size={18} />}
            onClick={() => window.open('mailto:support@heromedianetwork.com', '_blank')}
            style={{ color: primary, fontWeight: 600 }}
          />
        )}
      </Box>

      {/* Sidebar Drawer for mobile */}
      {isMobile && (
        <Box
          w={collapsed ? 70 : 260}
          bg="white"
          p="sm"
          style={{
            borderRight: '1px solid #eee',
            position: 'fixed',
            height: '100vh',
            overflowY: 'auto',
            zIndex: 200,
            display: sidebarOpen ? 'flex' : 'none',
            flexDirection: 'column',
            left: 0,
            top: 0,
            boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
            transition: 'width 0.3s',
          }}
        >
          {/* Header */}
          <Flex
            justify="flex-start"
            align="center"
            mb="lg"
            style={{ cursor: 'pointer' }}
            onClick={() => setSidebarOpen(false)}
          >
            {isLoading ? (
              <Skeleton circle height={32} width={32} mr={2} />
            ) : (
              <Image
                src="/assests/logo.png"
                alt="Logo"
                w="30px"
                style={{ marginRight: 8, flexShrink: 0 }}
              />
            )}
            {isLoading ? (
              <Skeleton height={20} width="60%" />
            ) : (
              <Title
                order={4}
                style={{ color: primary, whiteSpace: 'nowrap', fontSize: '16px' }}
              >
                Hero Media Network
              </Title>
            )}
          </Flex>

          <Stack gap="xs" style={{ flex: 1 }}>
            {isLoading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} height={36} radius="sm" mb={8} />
              ))
            ) : (
              <>
                <NavLink
                  label={collapsed ? null : 'Dashboard'}
                  leftSection={<IconLayoutDashboard size={18} />}
                  onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
                />
                <NavLink
                  label={collapsed ? null : 'My Offers'}
                  leftSection={<IconGift size={18} />}
                  onClick={() => { setActiveTab('top-offers'); setSidebarOpen(false); }}
                />
                <NavLink
                  label={collapsed ? null : 'Postback'}
                  leftSection={<IconRocket size={18} />}
                  active={activeTab === 'postback'}
                  onClick={() => setActiveTab('postback')}
                />
              </>
            )}
          </Stack>

          {/* Footer */}
          {isLoading ? (
            <Skeleton height={36} radius="sm" mt="auto" />
          ) : (
            <NavLink
              label={collapsed ? null : 'Contact Support'}
              leftSection={<IconExternalLink size={18} />}
              onClick={() => window.open('mailto:support@heromedianetwork.com', '_blank')}
              style={{ color: primary, fontWeight: 600 }}
            />
          )}
        </Box>
      )}

      {/* Main Content Area */}
      <Box
        style={{
          marginLeft: isMobile ? 0 : (collapsed ? 60 : 260),
          transition: 'margin-left 0.3s',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          backgroundColor: '#f0f2f5',
        }}
      >
        {/* Header */}
        <Flex
          justify="space-between"
          align="center"
          px="xl"
          py="md"
          bg="white"
          wrap="nowrap"
          style={{
            borderBottom: '1px solid #e0e0e0',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            gap: isMobile ? 8 : 24,
          }}
        >
          <Flex align="center" gap={isMobile ? 8 : 16}>
            {isMobile && !sidebarOpen && (
              isLoading ? (
                <Skeleton circle height={32} width={32} />
              ) : (
                <Image
                  src="/assests/logo.png"
                  alt="Logo"
                  w="40px"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSidebarOpen(true)}
                />
              )
            )}
            {!isMobile && (
              isLoading ? (
                <Skeleton height={20} width="120px" />
              ) : (
                <Title
                  order={3}
                  style={{
                    color: primary,
                    fontSize: '20px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {(() => {
                    switch (activeTab) {
                      case 'dashboard': return 'Dashboard';
                      case 'my-offers': return 'Add Offers';
                      case 'offers-expired': return 'Expired Offers';
                      case 'top-offers': return 'My Offers';
                      case 'search-browse': return 'Search/Browse';
                      case 'coupons': return 'Coupons';
                      case 'coupons-add': return 'Add Coupons';
                      case 'coupons-reports': return 'Coupons Reports';
                      case 'product-feed': return 'Product Feed';
                      case 'smartlinks': return 'Smartlinks';
                      case 'reports': return 'Reports';
                      case 'track': return 'Track Click';
                      default: return '';
                    }
                  })()}
                </Title>
              )
            )}
          </Flex>

          <Group gap={isMobile ? 4 : 16} style={{ marginLeft: isMobile ? 'auto' : undefined }}>
            {activeTab === 'dashboard' && (
              isLoading ? (
                <Skeleton height={36} width={isMobile ? 36 : 220} radius="sm" />
              ) : isMobile ? (
                <Button
                  variant="subtle"
                  style={{
                    minWidth: 0,
                    padding: 0,
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={() => setDateModalOpen(true)}
                >
                  <IconCalendar size={22} color={primary} />
                </Button>
              ) : (
                <DatePickerInput
                  type="range"
                  size="md"
                  leftSection={<IconCalendar size={16} />}
                  leftSectionPointerEvents="none"
                  placeholder="Select date range"
                  value={dateRange}
                  onChange={(value) => {
                    if (Array.isArray(value)) {
                      setDateRange([
                        value[0] ? new Date(value[0]) : null,
                        value[1] ? new Date(value[1]) : null,
                      ]);
                    } else {
                      setDateRange([null, null]);
                    }
                  }}
                  style={{ minWidth: 220 }}
                />
              )
            )}

            
            {isLoading ? (
              <Skeleton circle height={36} width={36} />
            ) : (
              <UserProfileMenu />
            )}
          </Group>
        </Flex>

        <ScrollArea style={{ flex: 1 }} type='never'>
          <div
            style={{
              paddingTop: 14,
              paddingLeft: collapsed ? isMobile ? 8 : 44 : 12,
              paddingRight: collapsed ? 16 : 14,
              transition: 'padding 0.3s',
            }}
          >
            <ContentPanel activeTab={activeTab} dateRange={dateRange} />
          </div>
        </ScrollArea>
      </Box>
    </>
  );

  return (
    <>
      <Modal opened={dateModalOpen} onClose={() => setDateModalOpen(false)} title="Select date range" centered size="xs">
        <DatePickerInput
          type="range"
          value={dateRange}
          onChange={(value) => {
            if (Array.isArray(value)) {
              setDateRange([
                value[0] ? new Date(value[0]) : null,
                value[1] ? new Date(value[1]) : null,
              ]);
            } else {
              setDateRange([null, null]);
            }
          }}
          style={{ width: '100%' }}
        />
      </Modal>
      {loadingApproval || publisherStatus === null ? (
        <Flex>{renderDashboardContent(true)}</Flex>
      ) : publisherStatus === 'pending' ? (
        <Center style={{ height: '100vh', flexDirection: 'column', textAlign: 'center', padding: 'md' }}>
          <Title order={2} style={{ color: 'orange' }}>Under Review</Title>
          <Text size="lg" mt="sm">Your publisher account application is currently <b>under review</b>.</Text>
          <Text size="md" mt="lg">We&apos;ll notify you via email once your account has been reviewed and approved.</Text>
          <Text size="sm" color="dimmed" mt="md">Thank you for your patience.</Text>
          <Button mt="xl" onClick={() => signOut()}>Logout</Button>
        </Center>
      ) : publisherStatus === 'rejected' ? (
        <Center style={{ height: '100vh', flexDirection: 'column', textAlign: 'center', padding: 'md' }}>
          <Title order={2} style={{ color: 'red' }}>Access Denied</Title>
          <Text size="lg" mt="sm">Your publisher account application has been <b>rejected</b>.</Text>
          {approvalErrorMessage && <Text size="sm" color="dimmed" mt="xs">{approvalErrorMessage}</Text>}
          <Text size="md" mt="lg">Please contact support for further assistance or to appeal this decision.</Text>
          <Button mt="xl" onClick={() => signOut()}>Logout</Button>
        </Center>
      ) : publisherStatus === 'error' || publisherStatus === 'unauthenticated' ? (
        <Center style={{ height: '100vh', flexDirection: 'column', textAlign: 'center', padding: 'md' }}>
          <Title order={2} style={{ color: 'red' }}>Access Error</Title>
          <Text size="lg" mt="sm">We encountered an issue verifying your account or you are not logged in.</Text>
          {approvalErrorMessage && <Text size="sm" color="dimmed" mt="xs">{approvalErrorMessage}</Text>}
          <Text size="md" mt="lg">Please try logging in again or contact support if the issue persists.</Text>
          <Button mt="xl" onClick={() => signOut()}>Logout</Button>
        </Center>
      ) : (
        <Flex>{renderDashboardContent(false)}</Flex>
      )}
      <style jsx global>{`
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}