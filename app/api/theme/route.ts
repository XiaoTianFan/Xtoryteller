import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  GLOBAL_THEME_COOKIE_NAME,
  resolveAvailableThemeSlug
} from '@/lib/engine/theme-registry';

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const requestedSlug = typeof payload?.themeSlug === 'string' ? payload.themeSlug : undefined;
  const themeSlug = await resolveAvailableThemeSlug(requestedSlug);
  const cookieStore = await cookies();

  cookieStore.set({
    name: GLOBAL_THEME_COOKIE_NAME,
    value: themeSlug,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  });

  return NextResponse.json({ themeSlug });
}
