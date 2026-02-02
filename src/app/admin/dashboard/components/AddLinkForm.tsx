"use client";
import React, { useEffect, useState } from 'react';
import { Button, Select, Stack, Loader, MultiSelect } from '@mantine/core';
import { showNotification } from '@/app/utils/notificationManager';

interface AddLinkFormState {
  offer_id: string;
  publisher_ids: string[];
  name: string;
}

export default function AddLinkForm() {
  const [offers, setOffers] = useState<{ value: string; label: string }[]>([]);
  const [publisherOptions, setPublisherOptions] = useState<{ value: string; label: string }[]>([]);
  const [form, setForm] = useState<AddLinkFormState>({ offer_id: '', publisher_ids: [], name: '' });
  const [fetchingPublishers, setFetchingPublishers] = useState(false);
  const [fetchingOffers, setFetchingOffers] = useState(false);
  const [offerFixedRate, setOfferFixedRate] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFetchingOffers(true);
    fetch('/api/admin/offers')
      .then(res => res.json())
      .then(data => {
        setOffers((data.offers || []).map((o: { id: string | number; name: string }) => ({ value: String(o.id), label: o.name })));
      })
      .finally(() => setFetchingOffers(false));
  }, []);





  // Fetch publishers for selected offer
  useEffect(() => {
    if (!form.offer_id) {
      setPublisherOptions([]);
      return;
    }
    setFetchingPublishers(true);
    fetch(`/api/admin/offer_publishers/by-offer?offer_id=${form.offer_id}`)
      .then(res => res.json())
      .then(data => {
        const pubs = data.publishers || [];
        setPublisherOptions((pubs).map((p: { id: string | number; name?: string; email?: string }) => ({ value: String(p.id), label: p.name || p.email || `Publisher ${p.id}` })));
      })
      .finally(() => setFetchingPublishers(false));
  }, [form.offer_id]);


  useEffect(() => {
    if (!form.offer_id) {
      setOfferFixedRate(0);
      return;
    }
    fetch(`/api/admin/offers/${form.offer_id}`)
      .then(res => res.json())
      .then(data => {
        const rate = Number(data?.fixed_conversion_rate || 0);
        setOfferFixedRate(rate > 0 ? rate : 0);
      })
      .catch(() => setOfferFixedRate(0));
  }, [form.offer_id]);




const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await fetch('/api/admin/links/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        fixed_conversion_rate: offerFixedRate || 0,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to add link');

    showNotification({
      title: 'Success',
      message: data.message || 'Links added successfully.',
      color: 'green',
      withClose: false,
    });

    setForm({ offer_id: '', publisher_ids: [], name: '' });
    setOfferFixedRate(0);
  } catch (err) {
    showNotification({
      title: 'Error',
      message: err instanceof Error ? err.message : 'Failed to add link',
      color: 'red',
      withClose: false,
    });
  } finally {
    setLoading(false);
  }
};



  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <Select
          label="Select Offer"
          placeholder={fetchingOffers ? 'Loading offers...' : 'Choose offer'}
          data={offers}
          value={form.offer_id}
          onChange={value => setForm({ ...form, offer_id: value || '' })}
          searchable
          rightSection={fetchingOffers && <Loader size="xs" />}
          required
        />
        <MultiSelect
          label="Select Publishers"
          placeholder={fetchingPublishers ? 'Loading publishers...' : 'Choose publishers'}
          data={publisherOptions}
          value={form.publisher_ids}
          onChange={value => setForm({ ...form, publisher_ids: value })}
          searchable
          rightSection={fetchingPublishers && <Loader size="xs" />}
          required
        />
        <input
          type="text"
          placeholder="Link Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          style={{ padding: '8px', borderRadius: 4, border: '1px solid #ccc', fontSize: 14 }}
        />
        <Button type="submit" loading={loading} disabled={!form.offer_id || form.publisher_ids.length === 0}>
          Add Link
        </Button>
      </Stack>
    </form>
  );
}
