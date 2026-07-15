import type { Context } from '@netlify/functions';

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const auth = req.headers.get('authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (token.length === 0 || token !== process.env.EDIT_PASSWORD) {
    return new Response('Unauthorized', { status: 401 });
  }

  return new Response('OK', { status: 200 });
};
