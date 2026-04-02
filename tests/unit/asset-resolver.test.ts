import { resolveAssetPath } from '@/lib/engine/asset-resolver';

describe('asset resolver', () => {
  it('normalizes local asset paths relative to the presentation slug', () => {
    expect(resolveAssetPath('human-ai-and-music-insight-brief', './assets/hero.svg')).toBe(
      '/presentations/human-ai-and-music-insight-brief/assets/hero.svg'
    );
    expect(resolveAssetPath('human-ai-and-music-insight-brief', 'assets/hero.svg')).toBe(
      '/presentations/human-ai-and-music-insight-brief/assets/hero.svg'
    );
  });

  it('leaves remote assets untouched', () => {
    expect(resolveAssetPath('human-ai-and-music-insight-brief', 'https://example.com/hero.svg')).toBe(
      'https://example.com/hero.svg'
    );
  });
});
