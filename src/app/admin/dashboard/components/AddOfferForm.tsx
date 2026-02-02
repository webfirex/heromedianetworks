'use client';

import React, { useState, useEffect } from 'react';
import {
  Container, Paper, TextInput, Textarea, Button,
  Stack, Group, Select, NumberInput, MultiSelect, Loader
} from '@mantine/core';
import { showNotification } from '@/app/utils/notificationManager';

interface OfferFormData {
  name: string;
  payout: number | '';
  currency: string;
  geo: string;
  description: string;
  offer_url: string;
  publisher_ids: string[]; // new
  default_commission_percent?: number | '';
  default_commission_cut?: number | '';
  fixed_conversion_rate?: number | '';
}

interface Publisher {
  id: number;
  name?: string;
  email?: string;
}


interface PublisherOption {
  label: string;
  value: string;
}

const AddOfferForm: React.FC = () => {
  const [form, setForm] = useState<OfferFormData>({
    name: '',
    payout: '',
    currency: 'USD',
    geo: '',
    description: '',
    offer_url: '',
    publisher_ids: [],
    default_commission_percent: 0,
    default_commission_cut: 0,
    fixed_conversion_rate: 0,
  });

  const [loading, setLoading] = useState(false);
  const [publisherOptions, setPublisherOptions] = useState<PublisherOption[]>([]);
  const [fetchingPublishers, setFetchingPublishers] = useState(true);

  useEffect(() => {
    const fetchPublishers = async () => {
      try {
        const res = await fetch('/api/admin/publisher');
        const data = await res.json();
        const options = data.map((pub: Publisher) => ({
          value: String(pub.id),
          label: pub.name || pub.email || `Publisher ${pub.id}`,
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { name, payout, currency, geo, offer_url, description, publisher_ids } = form;

    if (!name || payout === '' || !currency || !geo || !offer_url || !description) {
      showNotification({
        title: 'Validation Error',
        message: 'Please fill in all fields',
        color: 'red',
        withClose: false,
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/offers/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });


      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to create offer');

      showNotification({
        title: 'Success!',
        message: `Offer "${form.name}" created successfully.`,
        color: 'green',
        withClose: false,
      });

      setForm({
        name: '',
        payout: '',
        currency: 'USD',
        geo: '',
        description: '',
        offer_url: '',
        publisher_ids: [],
        default_commission_percent: '',
        default_commission_cut: '',
      });

    } catch (error) {
      console.error('Error submitting offer:', error);
      showNotification({
        title: 'Error',
        message: 'Something went wrong. Try again.',
        color: 'red',
        withClose: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xl" >
      <Paper shadow="sm" radius="md" p="xl" withBorder>
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Offer Name"
              placeholder="e.g., Summer Sale Campaign"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}

            />
            <Group grow>
              <NumberInput
                label="Payout"
                placeholder="e.g., 25.00"
                value={form.payout}
                onChange={(value) => setForm({ ...form, payout: value as number })}
                min={0}

              />
              <Select
                label="Currency"
                placeholder="Select currency"
                data={['USD', 'EUR', 'GBP', 'INR']}
                value={form.currency}
                onChange={(value) => setForm({ ...form, currency: value || '' })}

              />
            </Group>
            <TextInput
              label="Target Geo"
              placeholder="e.g., US"
              value={form.geo}
              onChange={(e) => setForm({ ...form, geo: e.currentTarget.value })}

            />
            <TextInput
              label="Offer URL"
              placeholder="https://example.com/"
              value={form.offer_url}
              onChange={(e) => setForm({ ...form, offer_url: e.currentTarget.value })}
              type="url"

            />
            <Textarea
              label="Description"
              placeholder="Provide a detailed description of the offer."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.currentTarget.value })}
              minRows={4}

            />
            <MultiSelect
              label="Select Publishers"
              placeholder={fetchingPublishers ? 'Loading publishers...' : 'Choose publishers'}
              data={publisherOptions}
              value={form.publisher_ids}
              onChange={(value) => setForm({ ...form, publisher_ids: value })}
              searchable
              rightSection={fetchingPublishers && <Loader size="xs" />}
            />
            <Group grow>
              <NumberInput
                label="Default Commission % (Optional)"
                placeholder="e.g., 10.00"
                value={form.default_commission_percent}
                onChange={(value) => setForm({ ...form, default_commission_percent: value as number })}
                min={0}
                max={100}
                decimalScale={2}
                description="Percentage of payout (e.g., 10 = 10% of payout)"
              />
              <NumberInput
                label="Default Commission Cut (Optional)"
                placeholder="e.g., 5.00"
                value={form.default_commission_cut}
                onChange={(value) => setForm({ ...form, default_commission_cut: value as number })}
                min={0}
                decimalScale={2}
                description="Fixed amount per conversion (e.g., 5.00 = $5 per conversion)"
              />
              <NumberInput
                label="Fixed Conversion Rate (%)"
                placeholder="0 = real conversions"
                value={form.fixed_conversion_rate}
                onChange={(value) =>
                  setForm({ ...form, fixed_conversion_rate: value as number })
                }
                min={0}
                max={100}
                decimalScale={2}
                description="If > 0, conversions are simulated from unique clicks"
              />

            </Group>
            <Button type="submit" loading={loading} size="md" radius="md" mt="md">
              Create Offer
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default AddOfferForm;
