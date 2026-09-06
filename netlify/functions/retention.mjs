// Scheduled photo cleanup. Part 3 §33/§34: abandoned uploads and the photos of
// completed orders are removed without anyone having to remember to do it.
import { runRetention } from '../../api/_lib/retention.js';

export default async () => {
  const result = await runRetention('scheduler');
  console.log('[retention]', JSON.stringify(result));
  return new Response(JSON.stringify(result), {
    headers: { 'content-type': 'application/json' },
  });
};

// Hourly: fine-grained enough for a 24h retention window without busy-work.
export const config = { schedule: '@hourly' };
