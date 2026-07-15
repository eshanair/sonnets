import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

const STORE_NAME = 'sonnet-data';
const KEY = 'userData';

function checkAuth(req: Request): boolean {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '');
  return token.length > 0 && token === process.env.EDIT_PASSWORD;
}

export default async (req: Request, _context: Context) => {
  const store = getStore(STORE_NAME);

  if (req.method === 'GET') {
    const data = await store.get(KEY, { type: 'json' });
    return new Response(JSON.stringify(data ?? null), {
      headers: { 'content-type': 'application/json' },
    });
  }

  if (req.method === 'POST') {
    if (!checkAuth(req)) {
      return new Response('Unauthorized', { status: 401 });
    }
    const body = await req.json();
    await store.setJSON(KEY, body);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response('Method Not Allowed', { status: 405 });
};
