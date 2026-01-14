"use client";
import { Card, Title, Text, TextInput, Button, Notification } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function GlobalPostbackPage() {
  const { data: session } = useSession();
  const [postbackUrl, setPostbackUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPostback = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        let publisher_id = session?.user?.id;
        if (!publisher_id && session?.user?.email) {
          const res = await fetch(`/api/publisher/id?email=${encodeURIComponent(session.user.email)}`);
          if (res.ok) {
            const data = await res.json();
            publisher_id = data.id;
          }
        }
        if (!publisher_id) {
          setError('You must be logged in as a publisher to view your global postback.');
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/publisher/global-postback?publisher_id=${publisher_id}`);
        if (res.ok) {
          const data = await res.json();
          setPostbackUrl(data.url || '');
        }
      } catch {
        setError('Failed to fetch global postback URL.');
      } finally {
        setLoading(false);
      }
    };
    fetchPostback();
  }, [session]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      let publisher_id = session?.user?.id;
      if (!publisher_id && session?.user?.email) {
        const res = await fetch(`/api/publisher/id?email=${encodeURIComponent(session.user.email)}`);
        if (res.ok) {
          const data = await res.json();
          publisher_id = data.id;
        }
      }
      if (!publisher_id) {
        setError('You must be logged in as a publisher to save your global postback.');
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/publisher/global-postback?publisher_id=${publisher_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: postbackUrl })
      });
      if (res.ok) {
        setSuccess('Global postback URL saved successfully!');
      } else {
        setError('Failed to save global postback URL.');
      }
    } catch {
      setError('Failed to save global postback URL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card shadow="md" radius="md" withBorder>
      <Title order={3} mb="md">Global Postback URL</Title>
      <Text mb="sm">Set your global postback URL to receive conversion notifications for all offers.</Text>
      <TextInput
        label="Postback URL"
        value={postbackUrl}
        onChange={e => setPostbackUrl(e.currentTarget.value)}
        placeholder="https://yourdomain.com/postback?click_id={click_id}&amount={amount}"
        mb="md"
      />
      <Button onClick={handleSave} loading={loading} disabled={loading} mt="sm">Save</Button>
      {success && <Notification color="green" mt="md">{success}</Notification>}
      {error && <Notification color="red" mt="md">{error}</Notification>}
    </Card>
  );
}
