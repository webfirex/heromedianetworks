'use client';

import React, { useState } from 'react';
import { Collapse, NavLink, Stack, Title, Flex, Button, Box } from '@mantine/core'; // Import Box
import Image from 'next/image';
import {
  IconRocket,
  IconChevronDown,
  IconChevronRight,
  IconGift,
  IconShoppingCartDiscount,
  IconLayoutDashboard,
  IconChevronLeft,
  IconUsers,
  IconRefreshDot,
  IconMail,
  // IconLink,
  IconKey,
  IconHeadset, // Imported IconHeadset for Customer Support
} from '@tabler/icons-react';

// 🎨 Colors (Matched to the provided image)
const primary = '#4169E1'; // Royal Blue

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed?: boolean;
  setCollapsed?: React.Dispatch<React.SetStateAction<boolean>>;
  isMobile?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed = false,
  setCollapsed = () => {},
  isMobile = false,
  setSidebarOpen = () => {},
}) => {
  const [offersOpen, setOffersOpen] = useState(false);

  const handleNavLinkClick = (tabKey: string) => {
    setActiveTab(tabKey);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Header - Logo and Name (with collapse toggle for desktop, close for mobile) */}
      <Flex justify="space-between" align="center" mb="lg">
        <Flex align="center" style={{ flex: 1, minWidth: 0 }}>
          <Image
            src="/assests/logo.png"
            alt="Logo"
            width={32}
            height={32}
            style={{ marginRight: 2, flexShrink: 0, cursor: 'pointer' }}
            onClick={() => {
              if (!isMobile) setCollapsed((c) => !c);
            }}
          />
          {!collapsed && (
            <Title
              order={4}
              style={{ color: primary, whiteSpace: 'nowrap', fontSize: '16px', cursor: 'pointer' }}
              onClick={() => {
                if (!isMobile) setCollapsed((c) => !c);
              }}
            >
              Hero Media Network
            </Title>
          )}
        </Flex>
        {isMobile ? (
          <Button
            variant="subtle"
            size="xs"
            px={5}
            onClick={() => setSidebarOpen(false)}
          >
            <IconChevronLeft size={18} />
          </Button>
        ) : (
          collapsed ? <div style={{ width: 14, margin: 10 }} /> : null
        )}
      </Flex>

      {/* Main Navigation Links */}
      <Stack gap="xs" style={{ flex: 1 }}> {/* flex: 1 pushes content below to the bottom */}
        <NavLink
          label={collapsed ? null : 'Dashboard'}
          leftSection={<IconLayoutDashboard size={18} />}
          active={activeTab === 'dashboard'}
          onClick={() => handleNavLinkClick('dashboard')}
        />

        <NavLink
          label={collapsed ? null : 'Access'}
          leftSection={<IconKey size={18} />}
          active={activeTab === 'access'}
          onClick={() => handleNavLinkClick('access')}
        />

        <NavLink
          label={collapsed ? null : 'Postback'}
          leftSection={<IconRefreshDot size={18} />}
          active={activeTab === 'postback'}
          onClick={() => handleNavLinkClick('postback')}
        />
        {/* <NavLink
          label={collapsed ? null : 'Smartlinks'}
          leftSection={<IconLink size={18} />}
          active={activeTab === 'smartlinks'}
          onClick={() => handleNavLinkClick('smartlinks')}
        /> */}
        
        <NavLink
          label={collapsed ? null : 'Admins'}
          leftSection={<IconUsers size={18} />}
          active={activeTab === 'approvals'}
          onClick={() => handleNavLinkClick('approvals')}
        />

        <NavLink
          label={collapsed ? null : 'Admin Mail'}
          leftSection={<IconMail size={18} />}
          active={activeTab === 'mail'}
          onClick={() => handleNavLinkClick('mail')}
        />

        {/* Offers Section */}
        {collapsed && !isMobile ? (
          <NavLink
            leftSection={<IconRocket size={18} />}
            label={null}
            onClick={() => setOffersOpen((o) => !o)}
          />
        ) : (
          <>
            <NavLink
              label="Offers"
              leftSection={<IconRocket size={18} />}
              rightSection={offersOpen ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
              onClick={() => setOffersOpen((o) => !o)}
            />
            <Collapse in={offersOpen}>
              <Stack gap={2} pl={24} className="hide-scrollbar" style={{ overflowY: 'auto' }}>
                {[
                  { key: 'all-offers', label: 'All Offers', icon: <IconGift size={14} /> },
                  { key: 'add-offers', label: 'Add Offers', icon: <IconGift size={14} /> },
                  { key: 'all-coupons', label: 'All Coupons', icon: <IconShoppingCartDiscount size={14} /> },
                  { key: 'add-coupons', label: 'Add Coupons', icon: <IconShoppingCartDiscount size={14} /> },
                ].map(({ key, label, icon }) => (
                  <NavLink
                    key={key}
                    label={label}
                    leftSection={icon}
                    active={activeTab === key}
                    onClick={() => handleNavLinkClick(key)}
                  />
                ))}
              </Stack>
            </Collapse>
          </>
        )}
      </Stack>

      {/* --- CUSTOMER SUPPORT NAVLINK ADDED AT THE BOTTOM --- */}
      {/* Box with margin-top to create visual separation from the main links */}
      <Box mt="auto" pt="xs" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
        <NavLink
          label={collapsed ? null : 'Customer Support'}
          leftSection={<IconHeadset size={18} />}
          active={activeTab === 'customer-support'}
          onClick={() => window.open('mailto:support@heromedianetwork.com', '_blank')}
          // Optional: Add some styling for the bottom link if needed
        />
      </Box>
      {/* --- END CUSTOMER SUPPORT NAVLINK --- */}
    </>
  );
};

export default AdminSidebar;