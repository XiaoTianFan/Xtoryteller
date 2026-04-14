import { NextResponse } from 'next/server';

import { saveThemeBySlug, ThemeSaveError } from '@/lib/engine/theme-save';
import type { ThemeSavePayload, ThemeSaveResponse } from '@/lib/types/theme-editor';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const payload = (await request.json().catch(() => null)) as ThemeSavePayload | null;
    const { slug } = await params;
    const theme = await saveThemeBySlug(slug, payload);

    return NextResponse.json({
      theme
    } satisfies ThemeSaveResponse);
  } catch (error) {
    if (error instanceof ThemeSaveError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: 'Failed to save theme.' }, { status: 500 });
  }
}
