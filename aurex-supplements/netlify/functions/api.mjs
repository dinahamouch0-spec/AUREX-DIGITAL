import { route } from '../../api/router.js';

export default async (req) => {
  try {
    return await route(req);
  } catch (err) {
    console.error('api', err);
    return new Response(JSON.stringify({ error: 'Something went wrong on our side.' }),
      { status: 500, headers: { 'content-type': 'application/json' } });
  }
};

export const config = { path: '/api/*' };
