// src/app/admin/dashboard/Documentation.tsx
'use client';

import {
  Container,
  Title,
  Text,
  List,
  Code,
  Paper,
  Divider,
  ThemeIcon,
  Group,
  Badge,
} from '@mantine/core';
import {
  IconLink,
  IconClick,
  IconWebhook,
  IconChartBar,
  IconSettings,
  IconArrowRight,
} from '@tabler/icons-react'; // Assuming you have tabler-icons-react installed

export default function Documentation() {
  return (
    <Container size="lg" py="xl"> {/* Increased size for more content */}
      <Paper shadow="md" radius="lg" p="xl" withBorder> {/* Enhanced shadow and radius */}
        <Title order={1} mb="md" ta="center" c="blue.7">
          Admin Documentation: Conversion Flow
        </Title>
        <Text size="lg" mb="xl" ta="center" c="dimmed">
          An end-to-end overview of how affiliate conversions are tracked and recorded, from link generation to final reporting.
        </Text>

        <Divider my="xl" label="The Conversion Journey" labelPosition="center" />

        <List spacing="xl" size="md" withPadding center> {/* Increased spacing and centered */}
          {/* Step 1: Offer & Publisher Setup */}
          <List.Item
            icon={
              <ThemeIcon color="grape" size={34} radius="xl">
                <IconSettings stroke={1.5} />
              </ThemeIcon>
            }
          >
            <Group align="center">
              <Title order={3}>1. Offer & Publisher Setup</Title>
              <Badge color="grape" variant="light" size="lg">Foundation</Badge>
            </Group>
            <Text mt="xs">
              The process begins with establishing the core components of your affiliate program.
            </Text>
            <List spacing="xs" size="sm" type="ordered" pl="md" mt="sm">
              <List.Item>
                <b>Offer Creation:</b> An administrator defines new offers within the dashboard, specifying details like payout amount and geographical targeting.
              </List.Item>
              <List.Item>
                <b>Publisher Assignment & Commission:</b> Publishers are assigned to offers. For each unique publisher-offer pairing, specific <Code>commission_percent</Code> (percentage of payout) and <Code>commission_cut</Code> (a fixed amount or a further adjustment) values are configured in the table.
              </List.Item>
            </List>
          </List.Item>

          <Divider my="lg" label={<IconArrowRight size={20} />} labelPosition="center" />

          {/* Step 2: Link Generation */}
          <List.Item
            icon={
              <ThemeIcon color="teal" size={34} radius="xl">
                <IconLink stroke={1.5} />
              </ThemeIcon>
            }
          >
            <Group align="center">
              <Title order={3}>2. Unique Tracking Link Generation</Title>
              <Badge color="teal" variant="light" size="lg">Attribution</Badge>
            </Group>
            <Text mt="xs">
              To accurately track user activity, unique links are generated for each promotional channel.
            </Text>
            <List spacing="xs" size="sm" type="ordered" pl="md" mt="sm">
              <List.Item>
                A distinct tracking link is programmatically generated for every publisher-offer combination. This link embeds a unique identifier, <Code>link_id</Code> (a UUID), which is stored in the table along with its associated <Code>offer_id</Code> and <Code>publisher_id</Code>.
              </List.Item>
            </List>
          </List.Item>

          <Divider my="lg" label={<IconArrowRight size={20} />} labelPosition="center" />

          {/* Step 3: User Clicks Link */}
          <List.Item
            icon={
              <ThemeIcon color="orange" size={34} radius="xl">
                <IconClick stroke={1.5} />
              </ThemeIcon>
            }
          >
            <Group align="center">
              <Title order={3}>3. User Interaction: Click Tracking</Title>
              <Badge color="orange" variant="light" size="lg">Engagement</Badge>
            </Group>
            <Text mt="xs">
              When a potential customer interacts with an affiliate link, their activity is logged.
            </Text>
            <List spacing="xs" size="sm" type="ordered" pl="md" mt="sm">
              <List.Item>
                Upon a user clicking the unique tracking link, a record is immediately created in the table. This record includes the <Code>link_id</Code>, a timestamp, and relevant user-agent information, crucial for initial analytics.
              </List.Item>
            </List>
          </List.Item>

          <Divider my="lg" label={<IconArrowRight size={20} />} labelPosition="center" />

          {/* Step 4: Conversion Webhook */}
          <List.Item
            icon={
              <ThemeIcon color="red" size={34} radius="xl">
                <IconWebhook stroke={1.5} />
              </ThemeIcon>
            }
          >
            <Group align="center">
              <Title order={3}>4. Conversion Event: Webhook Trigger</Title>
              <Badge color="red" variant="light" size="lg">Action</Badge>
            </Group>
            <Text mt="xs">
              The pivotal moment of a successful conversion is communicated back to the system via a secure callback.
            </Text>
            <List spacing="xs" size="sm" type="ordered" pl="md" mt="sm">
              <List.Item>
                When a desired conversion action is completed on the advertiser&apos;s platform (e.g., a purchase, sign-up, or lead generation), the advertiser&apos;s system sends a POST request webhook to your API endpoint: <Code>/api/webhook/conversion</Code>.
              </List.Item>
              <List.Item>
                The essential piece of information in the webhook payload is the original <Code>link_id</Code> to identify the originating click.
                <Code block>{`{\n  "link_id": "YOUR_UNIQUE_LINK_UUID"\n}`}</Code>
              </List.Item>
            </List>
          </List.Item>

          <Divider my="lg" label={<IconArrowRight size={20} />} labelPosition="center" />

          {/* Step 5: Backend Processing */}
          {/* <List.Item
            icon={
              <ThemeIcon color="blue" size={34} radius="xl">
                <IconDatabase stroke={1.5} />
              </ThemeIcon>
            }
          >
            <Group align="center">
              <Title order={3}>5. Backend Processing & Data Storage</Title>
              <Badge color="blue" variant="light" size="lg">System Logic</Badge>
            </Group>
            <Text mt="xs">
              Upon receiving the webhook, the backend validates and processes the conversion data.
            </Text>
            <List spacing="xs" size="sm" type="ordered" pl="md" mt="sm">
              <List.Item>
                The backend API endpoint receives the webhook. It then queries the <Code>links</Code> table using the provided <Code>link_id</Code> to retrieve the corresponding <Code>offer_id</Code> and <Code>publisher_id</Code>.
              </List.Item>
              <List.Item>
                Subsequently, the system fetches the offer&apos;s default payout and the specific commission settings for that publisher-offer pair from the <Code>offer_publishers</Code> table.
              </List.Item>
              <List.Item>
                Finally, a new, comprehensive record representing the conversion is inserted into the <Code>conversions</Code> table, accurately linking it to the offer, publisher, and the initial tracking link.
              </List.Item>
            </List>
          </List.Item>

          <Divider my="lg" label={<IconArrowRight size={20} />} labelPosition="center" /> */}

          {/* Step 6: Reporting */}
          <List.Item
            icon={
              <ThemeIcon color="violet" size={34} radius="xl">
                <IconChartBar stroke={1.5} />
              </ThemeIcon>
            }
          >
            <Group align="center">
              <Title order={3}>5. Dashboard Reporting & Analytics</Title>
              <Badge color="violet" variant="light" size="lg">Insights</Badge>
            </Group>
            <Text mt="xs">
              All collected data is made accessible through the admin dashboard for comprehensive analysis.
            </Text>
            <List spacing="xs" size="sm" type="ordered" pl="md" mt="sm">
              <List.Item>
                Administrators gain access to real-time insights, allowing them to monitor all recorded conversions, calculate precise commissions, and review total earnings attributed to each offer and publisher.
              </List.Item>
              <List.Item>
                The flexibility to update commission values per publisher-offer pair ensures that future conversions reflect the most current agreements, providing dynamic control over affiliate payouts.
              </List.Item>
            </List>
          </List.Item>
        </List>
      </Paper>
    </Container>
  );
}