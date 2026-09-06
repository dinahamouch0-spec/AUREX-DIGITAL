// Netlify Function (v2): standard Request in, Response out — the same contract
// the local dev server uses, so behaviour cannot drift between them.
import { router } from '../../api/router.js';

export default async (request) => router(request);

export const config = { path: '/api/*' };
