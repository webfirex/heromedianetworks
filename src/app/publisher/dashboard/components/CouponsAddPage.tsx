"use client";
import React, { useState } from 'react';
import { Card, TextInput, Textarea, Button, Group } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useSession } from 'next-auth/react';
import { showNotification } from '@/app/utils/notificationManager';

export default function CouponsAddPage() {
  const { data: session } = useSession();
  const [form, setForm] = useState({
    code: '',
    description: '',
    offer_id: '',
    publisher_id: '',
    valid_from: '',
    valid_to: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    field: keyof typeof form,
    value: string | number | Date | null
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let publisher_id = form.publisher_id;
    if (!publisher_id && session?.user?.id) {
      publisher_id = session.user.id;
    }
    try {
      const res = await fetch('/api/offers/coupons/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          description: form.description,
          offer_id: form.offer_id ? Number(form.offer_id) : null,
          publisher_id: publisher_id || null,
          valid_from: form.valid_from || null,
          valid_to: form.valid_to,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        showNotification({
          title: '⚠️ Coupon Error',
          message: data.error || 'Failed to add coupon',
          withClose: false
        });
        setLoading(false);
        return;
      }
      showNotification({
        title: 'Coupon Added',
        message: 'Coupon added successfully!',
        withClose: true
      });
      setForm({ code: '', description: '', offer_id: '', publisher_id: '', valid_from: '', valid_to: '' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add coupon';
      showNotification({
        title: '⚠️ Coupon Error',
        message: msg,
        withClose: false
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      shadow=""
      radius="26px"
      withBorder={false}
      style={{
        background: 'rgba(128, 128, 128, 0.1)',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
        padding: 32
      }}
    >
      {loading ? (
        <div style={{ padding: 8 }}>
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} style={{ marginBottom: 18 }}>
              <div style={{ height: 18, width: 120, background: '#e3e8f0', borderRadius: 4, marginBottom: 6 }} />
              <div style={{ height: 38, width: '100%', background: '#e3e8f0', borderRadius: 8 }} />
            </div>
          ))}
          <div style={{ height: 44, width: '100%', background: '#e3e8f0', borderRadius: 8, marginTop: 8 }} />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Coupon Code"
            required
            value={form.code}
            onChange={(e) => handleChange('code', e.target.value)}
            mb="sm"
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
            placeholder="e.g. SAVE20"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            mb="sm"
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
            required
            placeholder="Describe the coupon and its requirements."
          />
          <TextInput
            label="Offer ID"
            required
            value={form.offer_id}
            onChange={(e) => handleChange('offer_id', e.target.value)}
            mb="sm"
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
            placeholder="e.g. 123"
          />
          <DateInput
            label="Valid From"
            value={form.valid_from}
            onChange={(val) => handleChange('valid_from', val)}
            mb="sm"
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
            placeholder="Start date"
          />
          <DateInput
            label="Valid To"
            required
            value={form.valid_to}
            onChange={(val) => handleChange('valid_to', val)}
            mb="sm"
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
            placeholder="End date"
          />
          <Group mt="md">
            <Button
              type="submit"
              loading={loading}
              size="md"
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                color: '#E6EAF0',
                fontWeight: 600,
                letterSpacing: 0.2,
                border: '1px solid rgba(59, 130, 246, 0.3)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
              }}
            >
              Add Coupon
            </Button>
          </Group>
        </form>
      )}
    </Card>
  );
}
