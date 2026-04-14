import type { DashboardThemeEntry } from '@/lib/types/dashboard-background';
import type { ThemeConfig } from '@/lib/types/theme';

export interface ThemeSavePayload {
  theme: ThemeConfig;
}

export interface ThemeSaveResponse {
  theme: DashboardThemeEntry;
}
