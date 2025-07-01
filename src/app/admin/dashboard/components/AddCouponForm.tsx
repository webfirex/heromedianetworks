'use client';

import React, { useState, useEffect } from 'react';
import {
  Container, Paper, TextInput, Textarea, Button,
  Group, Stack, Select, NumberInput, MultiSelect, Loader // Added MultiSelect and Loader
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { showNotification } from '@/app/utils/notificationManager';

interface Offer {
  id: number;
  name: string;
}

// New interfaces for Publishers
interface Publisher {
  id: number;
  name?: string;
  email?: string;
}

interface PublisherOption {
  label: string;
  value: string;
}

interface CouponFormData {
  code: string;
  description: string;
  discount: number | '';
  discountType: 'percentage' | 'fixed_amount' | '';
  offer_id: string | null;
  valid_from: Date | null;
  valid_to: Date | null;
  publisher_ids: string[]; // New: Array of selected publisher IDs (as strings)
}

const AddCouponForm: React.FC = () => {
  const [form, setForm] = useState<CouponFormData>({
    code: '',
    description: '',
    discount: '',
    discountType: '',
    offer_id: null,
    valid_from: null,
    valid_to: null,
    publisher_ids: [], // Initialize as empty array
  });

  const [offers, setOffers] = useState<Offer[]>([]);
  const [publisherOptions, setPublisherOptions] = useState<PublisherOption[]>([]); // New state for publisher options
  const [loading, setLoading] = useState(false);
  const [offersLoaded, setOffersLoaded] = useState(false);
  const [fetchingPublishers, setFetchingPublishers] = useState(true); // New state for publisher loading

  // Fetch all offers
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await fetch('/api/admin/offers');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch offers.');
        setOffers(data.offers || []);
        setOffersLoaded(true);
      } catch (err) {
        console.error("Error fetching offers:", err); // Use console.error for errors
        showNotification({
          title: 'Error fetching offers',
          message: 'Could not load offer list. Please try again.', // More specific message
          color: 'red',
          withClose: false
        });
      }
    };

    fetchOffers();
  }, []);

  // New useEffect to fetch publishers
  useEffect(() => {
    const fetchPublishers = async () => {
      try {
        const res = await fetch('/api/admin/publisher'); // Assuming this is your publisher API endpoint
        const data = await res.json();
        const options = data.map((pub: Publisher) => ({
          value: String(pub.id),
          label: pub.name || pub.email || `Publisher ${pub.id}`, // Use name, email or ID
        }));
        setPublisherOptions(options);
      } catch (error) {
        console.error('Failed to load publishers', error);
        showNotification({
          title: 'Error',
          message: 'Could not load publisher list.',
          color: 'red',
          withClose: false
        });
      } finally {
        setFetchingPublishers(false);
      }
    };
    fetchPublishers();
  }, []);


  const handleChange = (field: keyof CouponFormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { code, description, discount, discountType, offer_id, valid_from, valid_to, publisher_ids } = form;

    // Enhanced validation: check if publisher_ids is empty if required
    if (!code || !description || discount === '' || !discountType || !offer_id || !valid_to) {
      showNotification({
        title: 'Validation Error',
        message: 'Please fill in all required fields',
        color: 'red',
        withClose: false,
      });
      setLoading(false);
      return;
    }

    if (valid_from && valid_to && valid_from > valid_to) {
      showNotification({
        title: 'Date Error',
        message: 'Valid From date cannot be after Valid To date.',
        color: 'red',
        withClose: false,
      });
      setLoading(false);
      return;
    }

    // Ensure valid_to is not in the past relative to current time for stricter validation
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time to compare dates only
    if (valid_to && valid_to < now) {
      showNotification({
        title: 'Date Error',
        message: 'Valid To date cannot be in the past.',
        color: 'red',
        withClose: false,
      });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/coupons/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add coupon.');
      }

      showNotification({
        title: 'Coupon Added',
        message: `Coupon "${code}" added successfully and is pending approval!`,
        color: 'green',
        withClose: false
      });

      // Reset form after successful submission
      setForm({
        code: '',
        description: '',
        discount: '',
        discountType: '',
        offer_id: null,
        valid_from: null,
        valid_to: null,
        publisher_ids: [],
      });

    } catch (err) { // Type 'any' for the error for broader catch
      console.error("Error submitting coupon:", err); // Use console.error for errors
      showNotification({
        title: '⚠️ Coupon Error',
        message: 'Failed to add coupon. Please try again.', // Show specific error message if available
        color: 'red',
        withClose: false
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xl">
      <Paper shadow="sm" radius="md" p="xl" withBorder>
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Coupon Code"
              value={form.code}
              onChange={(e) => handleChange('code', e.currentTarget.value)}
              placeholder="e.g., SAVE20"
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => handleChange('description', e.currentTarget.value)}
              placeholder="Describe the coupon, its usage, and any conditions."
              minRows={3}
              
            />
            <Group grow>
              <NumberInput
                label="Discount"
                value={form.discount}
                onChange={(value) => handleChange('discount', value || '')}
                min={0}
                placeholder="e.g., 20"
              
              />
              <Select
                label="Discount Type"
                data={[
                  { value: 'percentage', label: 'Percentage (%)' },
                  { value: 'fixed_amount', label: 'Fixed Amount (₹)' },
                ]}
                value={form.discountType}
                onChange={(val) => handleChange('discountType', val || '')}
                placeholder="Select discount type"
                
              />
            </Group>
            <Select
              label="Associate with Offer"
              data={offers.map((o) => ({ value: o.id.toString(), label: o.name }))}
              value={form.offer_id}
              onChange={(val) => handleChange('offer_id', val)}
              placeholder={offersLoaded ? "Select an offer" : "Loading offers..."}
              searchable
            
              disabled={!offersLoaded}
              rightSection={!offersLoaded && <Loader size="xs" />} 
            />

            {/* New MultiSelect for Publishers */}
            <MultiSelect
              label="Select Publishers"
              placeholder={fetchingPublishers ? 'Loading publishers...' : 'Choose publishers'}
              data={publisherOptions}
              value={form.publisher_ids}
              onChange={(value) => handleChange('publisher_ids', value)}
              searchable
              rightSection={fetchingPublishers && <Loader size="xs" />}
              nothingFoundMessage="No publishers found."
            />

            <Group grow>
              <DateInput
                label="Valid From"
                value={form.valid_from}
                onChange={(val) => handleChange('valid_from', val)}
                placeholder="Start date (optional)"
                minDate={new Date()}
              />
              <DateInput
                label="Valid To"
                value={form.valid_to}
                onChange={(val) => handleChange('valid_to', val)}
                placeholder="End date"
                minDate={form.valid_from || new Date()}
                
              />
            </Group>
            <Button type="submit" loading={loading}>
              Add Coupon
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default AddCouponForm;