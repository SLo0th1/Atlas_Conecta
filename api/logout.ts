import { COOKIE_NAME } from '../lib/session.js';

export function GET(request: Request): Response {
  return new Response(null, { status: 303, headers: {
    Location: new URL('/', request.url).href,
    'Set-Cookie': `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
    'Cache-Control': 'private, no-store',
  } });
}

export const POST = GET;
