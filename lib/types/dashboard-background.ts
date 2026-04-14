import type { BackgroundPresetConfig, BackgroundPresetDefinitionEntry } from '@/lib/types/background-preset';
import type { ThemeConfig } from '@/lib/types/theme';

export const DASHBOARD_THEME_SPECIFIC_VALUE = '__theme_specific__';

export interface DashboardThemeEntry {
  slug: string;
  name: string;
  sourceTheme: ThemeConfig;
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
  colorStops?: string[];
  intensity?: number;
  grain?: number;
  contrast?: number;
  speed?: number;
  opacity?: number;
  filter?: {
    mode: string;
    opacity?: number;
    radialSize?: {
      width?: number;
      height?: number;
    };
    linearProportion?: number;
    steepness?: number;
  };
}

export interface CreateBackgroundPresetResponse {
  preset: BackgroundPresetDefinitionEntry;
}

export interface BackgroundPresetDraft extends BackgroundPresetConfig {
  slug?: string;
}
