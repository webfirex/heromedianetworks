"use client";
import React, { useState } from 'react';
import { Box, Flex, ScrollArea } from '@mantine/core'; // Import ScrollArea
import { useMediaQuery } from '@mantine/hooks'; // Import useMediaQuery
import AdminHeader from './components/AdminHeader';
import AdminSidebar from './components/AdminSidebar';
import AllOffers from '@/app/admin/dashboard/components/AllOffers';
import AddOfferForm from './components/AddOfferForm';
import AdminDashboardContent from './components/AdminDashboardContent';
import AdminAccessManagement from './components/AdminAccessManagement';
import AdminSmartlinksManagement from './components/AdminSmartlinksManagement';
import AllCoupons from './components/AllCoupons';
import AddCouponForm from './components/AddCouponForm';
import Postback from './components/Postback';
import ApproveAdmin from './components/ApproveAdmin';
import AdminMail from './components/AdminMail';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>(() => {
    const today = new Date();
    const oneWeekFromToday = new Date(today);
    oneWeekFromToday.setDate(today.getDate() - 7);
    return [oneWeekFromToday, today];
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'all-offers':
        return <AllOffers />;
      case 'add-offers':
        return <AddOfferForm />;
      case 'access':
        return <AdminAccessManagement/>
      case 'smartlinks':
        return <AdminSmartlinksManagement/>
      case 'all-coupons':
        return <AllCoupons/>
      case 'add-coupons':
        return <AddCouponForm/>
      case 'postback':
        return <Postback/>
      case 'approvals':
        return <ApproveAdmin/>
      case 'mail':
        return <AdminMail/>
      default:
        return <AdminDashboardContent dateRange={dateRange} />;
    }
  };

  return (
    <>
      <Flex>
        {/* Sidebar for desktop */}
        <Box
          w={collapsed ? 70 : 260}
          p="sm"
          className="hide-scrollbar"
          style={{
            backgroundColor: 'var(--sidebar)',
            borderRight: '1px solid var(--sidebar-border)',
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
          <AdminSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
          />
        </Box>

        {/* Main Content Area */}
        <Box
          style={{
            marginLeft: isMobile ? 0 : (collapsed ? 70 : 260),
            transition: 'margin-left 0.3s',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            backgroundColor: 'var(--background)',
          }}
        >
          {/* Header */}
          <AdminHeader
            activeTab={activeTab}
            isMobile={isMobile}
            setSidebarOpen={setSidebarOpen}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />

          {/* Scrollable Content */}
          <ScrollArea style={{ flex: 1 }} type='never'>
            <Box
              // Removed p="md" from here and applied explicit padding properties
              style={{
                paddingTop: 'var(--mantine-spacing-md)', // Use Mantine's variable for consistency
                paddingBottom: 'var(--mantine-spacing-md)', // Use Mantine's variable for consistency
                paddingLeft: collapsed ? 'var(--mantine-spacing-sm)' : 'var(--mantine-spacing-md)', // Adjust dynamically based on collapsed state, use Mantine spacing
                paddingRight: 'var(--mantine-spacing-md)', // Use Mantine's variable for consistency
                transition: 'padding 0.3s',
              }}
            >
              {renderContent()}
            </Box>
          </ScrollArea>
        </Box>

        {/* Sidebar Drawer for mobile (similar to PublisherDashboard) */}
        {isMobile && (
          <Box
            w={260}
            p="sm"
            style={{
              backgroundColor: 'var(--sidebar)',
              borderRight: '1px solid var(--sidebar-border)',
              position: 'fixed',
              height: '100vh',
              overflowY: 'auto',
              zIndex: 200,
              display: sidebarOpen ? 'flex' : 'none',
              flexDirection: 'column',
              left: 0,
              top: 0,
              boxShadow: '2px 0 8px rgba(0,0,0,0.3)',
            }}
          >
            <AdminSidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setSidebarOpen={setSidebarOpen}
              isMobile={isMobile}
            />
          </Box>
        )}
      </Flex>
      <style jsx global>{`
        /* Hide all scrollbars in the sidebar and offer sublinks area */
        .hide-scrollbar {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE 10+ */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome/Safari/Webkit */
        }
      `}</style>
    </>
  );
};

export default AdminDashboard;