import { syncPresentationAssets } from './scripts/presentation-assets.mjs';

await syncPresentationAssets();

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  output: process.env.STATIC_EXPORT ? 'export' : undefined,
  images: {
    unoptimized: Boolean(process.env.STATIC_EXPORT)
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false
    };

    return config;
  }
};

export default nextConfig;
