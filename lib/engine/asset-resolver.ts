export function resolveAssetPath(slug: string, assetPath: string): string {
  if (/^https?:\/\//.test(assetPath)) {
    return assetPath;
  }

  const normalized = assetPath.replace(/^\.\//, '').replace(/^assets\//, 'assets/');
  return `/presentations/${slug}/${normalized}`;
}
