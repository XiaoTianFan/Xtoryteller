import { resolveAssetPath } from '@/lib/engine/asset-resolver';

describe('asset resolver', () => {
  it('normalizes local asset paths relative to the presentation slug', () => {
    expect(resolveAssetPath('simple-stage', './assets/hero.svg')).toBe('/presentations/simple-stage/assets/hero.svg');
    expect(resolveAssetPath('simple-stage', 'assets/hero.svg')).toBe('/presentations/simple-stage/assets/hero.svg');
  });

  it('leaves remote assets untouched', () => {
    expect(resolveAssetPath('simple-stage', 'https://example.com/hero.svg')).toBe('https://example.com/hero.svg');
  });
});
