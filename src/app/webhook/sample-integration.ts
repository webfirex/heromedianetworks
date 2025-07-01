// sample-integration.ts
// Utility to generate the conversion webhook endpoint for merchant integration
// Uses NEXT_PUBLIC_AFFILIATE_DOMAIN from environment variables

export function getConversionWebhookUrl() {
  // This should be set in your .env file, e.g. NEXT_PUBLIC_AFFILIATE_DOMAIN=https://your-affiliate-domain.com
  const domain = process.env.NEXT_PUBLIC_AFFILIATE_DOMAIN || 'https://YOUR_AFFILIATE_DOMAIN.com';
  return `${domain}/api/webhook/conversion`;
}

// Example usage for documentation or merchant integration:
//
// fetch(getConversionWebhookUrl(), {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({ link_id: 'THE_LINK_ID_FROM_TRACKING_URL' }),
// });
