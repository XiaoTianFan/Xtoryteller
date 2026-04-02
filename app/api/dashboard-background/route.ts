import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  DASHBOARD_BACKGROUND_COOKIE_NAME,
  resolveAvailableDashboardBackgroundSlug
} from '@/lib/engine/dashboard-background-preferences';
import {
  DashboardBackgroundPreferencePayload,
  DashboardBackgroundPreferenceResponse
} from '@/lib/types/dashboard-background';

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as DashboardBackgroundPreferencePayload | null;
  const cookieStore = await cookies();
  const presetSlug = await resolveAvailableDashboardBackgroundSlug(payload?.presetSlug);

  if (presetSlug) {
    cookieStore.set({
      name: DASHBOARD_BACKGROUND_COOKIE_NAME,
      value: presetSlug,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365
    });
  } else {
    cookieStore.delete(DASHBOARD_BACKGROUND_COOKIE_NAME);
  }

  return NextResponse.json({
    presetSlug
  } satisfies DashboardBackgroundPreferenceResponse);
}
