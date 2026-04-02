import { backgroundPresetExists } from '@/lib/engine/background-preset-registry';

export const DASHBOARD_BACKGROUND_COOKIE_NAME = 'xtoryteller-dashboard-background';

export async function resolveAvailableDashboardBackgroundSlug(
  ...candidates: Array<string | null | undefined>
) {
  for (const candidate of candidates) {
    if (await backgroundPresetExists(candidate)) {
      return candidate!;
    }
  }

  return null;
}
