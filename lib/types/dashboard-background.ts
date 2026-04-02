import type { BackgroundPresetConfig, BackgroundPresetDefinitionEntry } from '@/lib/types/background-preset';
import type { ThemeConfig } from '@/lib/types/theme';

export const DASHBOARD_THEME_SPECIFIC_VALUE = '__theme_specific__';

export interface DashboardThemeEntry {
  slug: string;
  name: string;
  theme: ThemeConfig;
}

export interface DashboardBackgroundPreferencePayload {
  presetSlug: string | null;
}

export interface DashboardBackgroundPreferenceResponse {
  presetSlug: string | null;
}

export interface CreateBackgroundPresetPayload {
  name: string;
  description?: string;
  tags?: string[];
  shader: string;
  preset?: string;
  params?: Record<string, unknown>;
}

export interface CreateBackgroundPresetResponse {
  preset: BackgroundPresetDefinitionEntry;
}

export interface BackgroundPresetDraft extends BackgroundPresetConfig {
  slug?: string;
}
