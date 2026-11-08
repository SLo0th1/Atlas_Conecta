import { COOKIE_NAME, verifySession } from './lib/session';

export const config = { matcher: ['/plataforma', '/plataforma/:path*'] };

export default async function middleware(request: Request) {
  const cookie = request.headers.get('cookie')?.split(';')
    .map(part => part.trim()).find(part => part.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (await verifySession(cookie)) return;
  const url = new URL(request.url);
  const path = `${url.pathname}${url.search}`;
  return Response.redirect(new URL('/entrar/?next=' + encodeURIComponent(path), request.url), 302);
}
