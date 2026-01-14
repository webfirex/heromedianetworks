"use client";
import { Card, Title, Text, TextInput, Button, Notification } from '@mantine/core';
import { useState } from 'react';

export default function PostbackTestPage() {
  const [url, setUrl] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      // Send a GET request to the provided postback URL (simulate a conversion)
      const res = await fetch(`/api/publisher/postback-test?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (res.ok) {
        setResponse(data.result || 'Success!');
      } else {
        setError(data.error || 'Failed to test postback URL.');
      }
    } catch {
      setError('Failed to test postback URL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card shadow="md" radius="md" withBorder>
      <Title order={3} mb="md">Test Postback URL</Title>
      <Text mb="sm">Enter a postback URL to simulate a conversion and see the response.</Text>
      <TextInput
        label="Postback URL"
        value={url}
        onChange={e => setUrl(e.currentTarget.value)}
        placeholder="https://yourdomain.com/postback?click_id=test&amount=1.23"
        mb="md"
      />
      <Button onClick={handleTest} loading={loading} disabled={loading || !url} mt="sm">Test</Button>
      {response && <Notification color="green" mt="md">{response}</Notification>}
      {error && <Notification color="red" mt="md">{error}</Notification>}
    </Card>
  );
}
