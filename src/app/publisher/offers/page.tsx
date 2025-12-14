'use client';

import {
  Card,
  Button,
  TextInput,
  Textarea,
  Notification,
  Stack,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useState } from 'react';

export default function PublisherOffersPage() {
  const [form, setForm] = useState({ name: '', payout: '', geo: '', description: '', offer_url: '', expired_at: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDateChange = (date: Date | null) => {
    setForm((prev) => ({ ...prev, expired_at: date ? date.toISOString() : '' }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Add offer
      const res = await fetch('/api/offers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          payout: form.payout,
          geo: form.geo,
          description: form.description,
          offer_url: form.offer_url
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to add offer');
        setLoading(false);
        return;
      }
      const offer = await res.json();
      // Store expiration if expired_at is set
      if (form.expired_at) {
        await fetch('/api/offers/expirations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offer_id: offer.id, expired_at: form.expired_at }),
        });
      }
      setSuccess('Offer added successfully!');
      setForm({ name: '', payout: '', geo: '', description: '', offer_url: '', expired_at: '' });
    } catch {
      setError('Failed to add offer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" items-center justify-center">
      <Card
        shadow=""
        radius="26px"
        withBorder={false}
        p="lg"
        ml={23}
        mr={34}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'rgba(128, 128, 128, 0.1)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Removed Title for cleaner look */}
        {loading ? (
          <Stack gap="sm" style={{ width: 360 }}>
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx}>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ height: 18, width: 120, background: '#e3e8f0', borderRadius: 4, marginBottom: 6 }} />
                  <div style={{ height: 38, width: '100%', background: '#e3e8f0', borderRadius: 8 }} />
                </div>
              </div>
            ))}
            <div style={{ height: 44, width: '100%', background: '#e3e8f0', borderRadius: 8, marginTop: 8 }} />
          </Stack>
        ) : (
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <Stack gap="sm">
              <TextInput
                label="Offer Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="e.g. Amazon Affiliate Offer"
                size="md"
                styles={{
                  input: {
                    fontSize: 15,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#E6EAF0',
                    '&::placeholder': { color: 'rgba(255,255,255,0.5)' }
                  },
                  label: { color: '#E6EAF0' }
                }}
              />
              <TextInput
                label="Payout"
                name="payout"
                value={form.payout}
                onChange={handleChange}
                required
                placeholder="e.g. $2.50"
                size="md"
                styles={{
                  input: {
                    fontSize: 15,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#E6EAF0',
                    '&::placeholder': { color: 'rgba(255,255,255,0.5)' }
                  },
                  label: { color: '#E6EAF0' }
                }}
              />
              <TextInput
                label="Target Geo"
                name="geo"
                value={form.geo}
                onChange={handleChange}
                required
                placeholder="e.g. US, CA"
                size="md"
                styles={{
                  input: {
                    fontSize: 15,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#E6EAF0',
                    '&::placeholder': { color: 'rgba(255,255,255,0.5)' }
                  },
                  label: { color: '#E6EAF0' }
                }}
              />
              <TextInput
                label="Offer Link"
                name="offer_url"
                value={form.offer_url}
                onChange={handleChange}
                required
                placeholder="https://..."
                size="md"
                styles={{
                  input: {
                    fontSize: 15,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#E6EAF0',
                    '&::placeholder': { color: 'rgba(255,255,255,0.5)' }
                  },
                  label: { color: '#E6EAF0' }
                }}
              />
              <DateInput
                label="Expired At"
                name="expired_at"
                value={form.expired_at ? new Date(form.expired_at) : null}
                onChange={value => {
                  let date: Date | null = null;
                  if (typeof value === 'string') {
                    const parsed = new Date(value);
                    date = isNaN(parsed.getTime()) ? null : parsed;
                  } else if (value && Object.prototype.toString.call(value) === '[object Date]') {
                    date = value as Date;
                  }
                  handleDateChange(date);
                }}
                placeholder="YYYY-MM-DD"
                required
                styles={{
                  input: {
                    fontSize: 15,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#E6EAF0',
                    '&::placeholder': { color: 'rgba(255,255,255,0.5)' }
                  },
                  label: { color: '#E6EAF0' }
                }}
                minDate={new Date()}
                size="md"
              />
              <Textarea
                label="Description"
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                placeholder="Describe the offer and requirements."
                minRows={3}
                size="md"
                styles={{
                  input: {
                    fontSize: 15,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#E6EAF0',
                    '&::placeholder': { color: 'rgba(255,255,255,0.5)' }
                  },
                  label: { color: '#E6EAF0' }
                }}
              />
              {error && (
                <Notification color="red" mt="sm">{error}</Notification>
              )}
              {success && (
                <Notification color="green" mt="sm">{success}</Notification>
              )}
              <Button
                type="submit"
                loading={loading}
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.8)',
                  color: '#E6EAF0',
                  fontWeight: 600,
                  letterSpacing: 0.2,
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
                }}
                size="md"
                radius="md"
                mt="md"
                fullWidth
              >
                Add Offer
              </Button>
            </Stack>
          </form>
        )}
      </Card>
    </div>
  );
}
