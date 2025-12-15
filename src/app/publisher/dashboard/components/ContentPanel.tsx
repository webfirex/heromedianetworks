import React from 'react';
import DashboardContent from './DashboardContent';
import PublisherSmartlinksPage from '../../smartlinks/page';
import PublisherReportsPage from '../../reports/page';
import PublisherTrackPage from '../../track/page';
import { Text } from '@mantine/core';
import PublisherOffersPage from '../../offers/page';
import OffersExpiredPage from './OffersExpiredPage';
import TopOffersPage from './TopOffersPage';
import CouponsPage from './CouponsPage';
import CouponsReportsPage from './CouponsReportsPage';
import ProductFeedPage from './ProductFeedPage';
import SearchBrowsePage from './SearchBrowsePage';
import CouponsAddPage from './CouponsAddPage';
import PublisherPostback from './PublisherPostback';

interface ContentPanelProps {
  activeTab: string;
  dateRange: [Date | null, Date | null];
}

export default function ContentPanel({ activeTab, dateRange }: ContentPanelProps) {
  switch (activeTab) {
    case 'dashboard':
      return <DashboardContent dateRange={dateRange} />;
    case 'my-offers':
      return <PublisherOffersPage />
    case 'offers-expired':
      return <OffersExpiredPage />;
    case 'top-offers':
      return <TopOffersPage />;
    case 'search-browse':
      return <SearchBrowsePage />;
    case 'coupons':
      return <CouponsPage />;
    case 'coupons-reports':
      return <CouponsReportsPage />;
    case 'product-feed':
      return <ProductFeedPage />;
    case 'postback':
      return <PublisherPostback />;
    case 'smartlinks':
      return <PublisherSmartlinksPage />;
    case 'reports':
      return <PublisherReportsPage />;
    case 'track':
      return <PublisherTrackPage />;
    case 'coupons-add':
      return <CouponsAddPage />;
    case 'support':
      return (
        <div className="flex h-full items-center justify-center">
          <Text size="xl" fw={700} c="dimmed">Contact Support module coming soon</Text>
        </div>
      );
    default:
      return <Text>Invalid tab selected.</Text>;
  }
}
