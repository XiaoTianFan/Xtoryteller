import { NextResponse } from 'next/server';

import {
  BackgroundPresetSaveError,
  updateBackgroundPresetBySlug
} from '@/lib/engine/background-preset-save';
import {
  CreateBackgroundPresetPayload,
  CreateBackgroundPresetResponse
} from '@/lib/types/dashboard-background';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const payload = (await request.json().catch(() => null)) as CreateBackgroundPresetPayload | null;
    if (!payload) {
      throw new BackgroundPresetSaveError(400, 'Request body is required.');
    }

    const { slug } = await params;
    const preset = await updateBackgroundPresetBySlug(slug, payload);
    return NextResponse.json({
      preset
    } satisfies CreateBackgroundPresetResponse);
  } catch (error) {
    if (error instanceof BackgroundPresetSaveError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: 'Failed to update background preset.' }, { status: 500 });
  }
}
