import { resolveAvailableDashboardBackgroundSlug } from '@/lib/engine/dashboard-background-preferences';

describe('dashboard background preferences', () => {
  it('returns null when no preset candidates exist', async () => {
    await expect(resolveAvailableDashboardBackgroundSlug()).resolves.toBeNull();
  });

  it('returns a valid persisted preset slug', async () => {
    await expect(resolveAvailableDashboardBackgroundSlug('editorial-paper')).resolves.toBe('editorial-paper');
  });

  it('falls back to null when the persisted preset is missing', async () => {
    await expect(resolveAvailableDashboardBackgroundSlug('missing-dashboard-background')).resolves.toBeNull();
  });
});
