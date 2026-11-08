import { authConfig, constantTimeEqual, COOKIE_NAME, createSession, passwordDigest, platformNext, SESSION_SECONDS } from '../lib/session';

export async function POST(request: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.redirect(new URL('/entrar/?erro=1&next=%2Fplataforma%2F', request.url), 303);
  }
  const next = platformNext(form.get('next'));
  const email = form.get('email');
  const password = form.get('senha');
  const config = authConfig();
  const digest = await passwordDigest(typeof password === 'string' ? password : '');
  const passwordMatches = constantTimeEqual(digest, config?.passwordHash ?? '');
  if (!config || typeof email !== 'string' || typeof password !== 'string'
    || email.trim().toLowerCase() !== config.email || !passwordMatches) {
    return Response.redirect(new URL(`/entrar/?erro=1&next=${encodeURIComponent(next)}`, request.url), 303);
  }
  const session = await createSession(config.email, config.secret);
  return new Response(null, { status: 303, headers: {
    Location: new URL(next, request.url).href,
    'Set-Cookie': `${COOKIE_NAME}=${session}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}`,
    'Cache-Control': 'private, no-store',
  } });
}

export function GET(): Response {
  return new Response(null, { status: 405, headers: { Allow: 'POST' } });
}
