import arcjet, { detectBot, shield, slidingWindow } from '@arcjet/next';
import { NextResponse, type NextRequest } from 'next/server';

const arcjetKey = process.env.ARCJET_KEY;
const isLive = process.env.ARCJET_MODE === 'LIVE';

const aj = arcjet({
  key: arcjetKey || 'ajkey_dev_placeholder_for_nextjs_middleware',
  rules: [
    shield({
      mode: isLive ? 'LIVE' : 'DRY_RUN',
    }),
    detectBot({
      mode: isLive ? 'LIVE' : 'DRY_RUN',
      allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'],
    }),
    slidingWindow({
      mode: isLive ? 'LIVE' : 'DRY_RUN',
      interval: '1m',
      max: 120,
    }),
  ],
});

export const config = {
  // Protect all routes except Next.js static assets and favicon
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export default async function middleware(req: NextRequest) {
  // Pass-through in local development if ARCJET_KEY is not yet configured
  if (!arcjetKey) {
    return NextResponse.next();
  }

  try {
    const decision = await aj.protect(req);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return NextResponse.json(
          {
            error: 'Too Many Requests',
            message: 'You have exceeded the request rate limit for PayFlow. Please wait before retrying.',
          },
          { status: 429, headers: { 'Retry-After': '60' } },
        );
      }

      if (decision.reason.isBot()) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: 'Automated bot access is forbidden on PayFlow Financial Application.',
          },
          { status: 403 },
        );
      }

      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Request blocked by PayFlow Security Shield.',
        },
        { status: 403 },
      );
    }
  } catch (err) {
    console.warn('[Arcjet Middleware] Security check bypassed due to exception:', err);
  }

  return NextResponse.next();
}
