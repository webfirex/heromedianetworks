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
          An end-to-end overview of how affiliate clicks and conversions are tracked, adjusted by commission rules,
          and reported as net (post-cut) metrics in the dashboard.
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
                <b>Publisher Assignment & Commission:</b> Publishers are assigned to offers with a configurable
                <Code>commission_cut</Code> (percentage). This cut represents the portion of traffic and conversions
                that is deducted before metrics are shown to the publisher.
              </List.Item>

              <List.Item>
                <b>Net Metrics Model:</b> All publisher-facing metrics (clicks, unique clicks, conversions, and conversion rate)
                are calculated <b>after</b> applying the commission cut. Raw values are retained internally for auditing.
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
              When a potential customer interacts with an affiliate link, both total clicks and unique clicks
              are recorded and later adjusted according to commission rules.
            </Text>

            <List spacing="xs" size="sm" type="ordered" pl="md" mt="sm">
              <List.Item>
                Upon a user clicking the tracking link, a click record is stored with the associated <Code>offer_id</Code>,
                <Code>publisher_id</Code>, timestamp, and uniqueness flag. Unique clicks are later aggregated per offer
                and adjusted by the configured commission cut.
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
                When a desired conversion action is completed on the advertiser&apos;s platform (e.g., a purchase, sign-up, or lead generation), the advertiser&apos;s system sends a GET request webhook to your API endpoint: <Code>/api/track/convert?click_id=YOUR_UNIQUE_CLICK_UUID</Code>.
              </List.Item>
              {/* <List.Item>
                The essential piece of information in the webhook payload is the original <Code>link_id</Code> to identify the originating click.
                <Code block>{`{\n  "link_id": "YOUR_UNIQUE_LINK_UUID"\n}`}</Code>
              </List.Item> */}
            </List>
          </List.Item>

          <Divider my="lg" label={<IconArrowRight size={20} />} labelPosition="center" />
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
                <b>Net Clicks & Unique Clicks:</b> Total clicks and unique clicks are first grouped per offer,
                then reduced by the commission cut percentage before being shown to publishers.
                For example, 1,000 unique clicks with a 10% cut are reported as 900 net unique clicks.
              </List.Item>

              <List.Item>
                <b>Net Conversions:</b> Conversions are similarly adjusted using the same commission cut logic,
                ensuring consistency across all performance metrics.
              </List.Item>

              <List.Item>
                <b>Conversion Rate (CVR):</b> The conversion rate is calculated using
                <Code>net conversions ÷ net unique clicks</Code>, guaranteeing that all reported ratios
                accurately reflect post-cut performance.
              </List.Item>

              <List.Item>
                <b>Commission Updates:</b> Updating commission cuts only affects future reporting,
                allowing administrators to dynamically control publisher visibility and payouts without altering historical data.
              </List.Item>

            </List>
          </List.Item>
        </List>
      </Paper>
    </Container>
  );
}