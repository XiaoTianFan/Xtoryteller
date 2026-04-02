import { NextResponse } from 'next/server';

import {
  BackgroundPresetSaveError,
  saveBackgroundPreset
} from '@/lib/engine/background-preset-save';
import {
  CreateBackgroundPresetPayload,
  CreateBackgroundPresetResponse
} from '@/lib/types/dashboard-background';

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => null)) as CreateBackgroundPresetPayload | null;
    if (!payload) {
      throw new BackgroundPresetSaveError(400, 'Request body is required.');
    }

    const preset = await saveBackgroundPreset(payload);
    return NextResponse.json({
      preset
    } satisfies CreateBackgroundPresetResponse);
  } catch (error) {
    if (error instanceof BackgroundPresetSaveError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: 'Failed to save background preset.' }, { status: 500 });
  }
}
