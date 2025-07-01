'use client';
import { useState } from 'react'; // Added useEffect for potential future use or consistency
import { TextInput, Button, Checkbox, Title, Stack, Container, Paper } from '@mantine/core'; // Added Container, Paper, Group
import { showNotification } from '@/app/utils/notificationManager'; // Assuming you have this utility

export default function AdminMail() {
  const [form, setForm] = useState({
    host: '',
    port: '',
    secure: false,
    user: '',
    pass: '',
    from: '',
  });

  const [testEmail, setTestEmail] = useState('');
  const [loadingSave, setLoadingSave] = useState(false); // New loading state for save
  const [loadingTest, setLoadingTest] = useState(false); // New loading state for test

  // You might want to fetch existing settings on component mount
  // useEffect(() => {
  //   const fetchSettings = async () => {
  //     try {
  //       const res = await fetch('/api/admin/smtp');
  //       const data = await res.json();
  //       if (res.ok) {
  //         setForm(data.settings); // Assuming API returns { settings: {...} }
  //       } else {
  //         showNotification({
  //           title: 'Error',
  //           message: data.error || 'Failed to load SMTP settings.',
  //           color: 'red',
  //           withClose: false
  //         });
  //       }
  //     } catch (error) {
  //       console.error('Failed to load SMTP settings', error);
  //       showNotification({
  //         title: 'Error',
  //         message: 'Could not load SMTP settings.',
  //         color: 'red',
  //         withClose: false
  //       });
  //     }
  //   };
  //   fetchSettings();
  // }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const saveSettings = async () => {
    setLoadingSave(true);
    try {
      const res = await fetch('/api/admin/smtp', {
        method: 'POST',
        body: JSON.stringify({ ...form, port: Number(form.port), secure: form.secure }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (res.ok) {
        showNotification({
          title: 'Success',
          message: data.message || 'SMTP settings saved successfully.',
          color: 'green',
          withClose: false,
        });
      } else {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving SMTP settings:', error);
      showNotification({
        title: 'Error',
        message: 'Something went wrong while saving. Try again.',
        color: 'red',
        withClose: false,
      });
    } finally {
      setLoadingSave(false);
    }
  };

  const sendTest = async () => {
    setLoadingTest(true);
    if (!testEmail) {
      showNotification({
        title: 'Validation Error',
        message: 'Please enter a recipient email for the test.',
        color: 'red',
        withClose: false,
      });
      setLoadingTest(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/smtp', {
        method: 'PUT',
        body: JSON.stringify({ to: testEmail }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (res.ok) {
        showNotification({
          title: 'Test Email Sent!',
          message: data.message || `Test email sent to ${testEmail}. Check your inbox.`,
          color: 'green',
          withClose: false,
        });
      } else {
        throw new Error(data.error || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      showNotification({
        title: 'Error',
        message: 'Something went wrong while sending test email. Try again.',
        color: 'red',
        withClose: false,
      });
    } finally {
      setLoadingTest(false);
    }
  };

  return (
    <Container size="xl"> {/* Wrap content in Container */}
      <Paper shadow="sm" radius="md" p="xl" withBorder> {/* Wrap content in Paper */}
        <Title order={3} mb="xl">SMTP Settings</Title> {/* Adjusted margin-bottom */}
        <Stack gap="md"> {/* Main stack for all form elements */}
          <TextInput
            label="SMTP Host"
            name="host"
            value={form.host}
            onChange={handleChange}
            placeholder="e.g., smtp.example.com"
          />
          <TextInput
            label="Port"
            name="port"
            value={form.port}
            onChange={handleChange}
            placeholder="e.g., 587 or 465"
            type="number" // Added type for better input experience
          />
          <Checkbox
            label="Use SSL/TLS (secure connection)" // Clarified label
            checked={form.secure}
            onChange={(e) => setForm({ ...form, secure: e.currentTarget.checked })}
          />
          <TextInput
            label="SMTP User (Email)"
            name="user"
            value={form.user}
            onChange={handleChange}
            placeholder="e.g., your_email@example.com"
            type="email" // Added type for better input experience
          />
          <TextInput
            label="Password / App Password"
            name="pass"
            type="password"
            value={form.pass}
            onChange={handleChange}
            placeholder="Your SMTP password or app-specific password"
          />
          <TextInput
            label="From Email Address" // Clarified label
            name="from"
            value={form.from}
            onChange={handleChange}
            placeholder="e.g., notifications@yourdomain.com"
            type="email"
          />
          <Button onClick={saveSettings} loading={loadingSave} size="md" radius="md" mt="md"> {/* Added loading and styling */}
            Save SMTP Settings
          </Button>
        </Stack>

        <Title order={4} mt="xl" mb="md">Send Test Email</Title> {/* Adjusted margins */}
        <Stack gap="md"> {/* Stack for test email section */}
          <TextInput
            label="Recipient Email" // Added label
            placeholder="e.g., recipient@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            type="email"
          />
          <Button onClick={sendTest} loading={loadingTest} size="md" radius="md"> {/* Added loading and styling */}
            Send Test Email
          </Button>
        </Stack>

        {/* Removed the direct message display as showNotification handles it */}
        {/* {message && <Text mt="lg" color="blue">{message}</Text>} */}
      </Paper>
    </Container>
  );
}