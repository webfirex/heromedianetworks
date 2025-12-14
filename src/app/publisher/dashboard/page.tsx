'use client';

import {
  Button,
  Center,
  Text,
  Title,
} from '@mantine/core';
import { useState, useEffect } from 'react';
import ContentPanel from './components/ContentPanel';
import { signOut, useSession } from 'next-auth/react';
import { showNotification } from '@/app/utils/notificationManager';
import DashboardSidebar from './components/layout/DashboardSidebar';
import DashboardTopbar from './components/layout/DashboardTopbar';
import { ScrollArea } from '@/components/ui/scroll-area';

// 🎨 Colors - Using theme variables
const primary = 'var(--primary)';

export default function PublisherDashboard() {
  const { data: session, status: sessionStatus } = useSession();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
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

  const renderDashboardContent = () => (
    <div className="flex h-screen bg-background">
      {/* New Dark Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
                />

      {/* Main Content Area */}
      <div
        className="flex flex-col flex-1 transition-all duration-300"
        style={{
          marginLeft: collapsed ? 70 : 260,
        }}
      >
        {/* New Dark Topbar */}
        <DashboardTopbar
          activeTab={activeTab}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          sidebarCollapsed={collapsed}
                />

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            <ContentPanel activeTab={activeTab} dateRange={dateRange} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  return (
    <>
      {loadingApproval || publisherStatus === null ? (
        <div className="flex h-screen bg-background items-center justify-center">
          <div className="text-foreground">Loading...</div>
        </div>
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
        renderDashboardContent()
      )}
    </>
  );
}