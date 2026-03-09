// next.config.mjs

import nextPwa from 'next-pwa';

const withPWA = nextPwa({
  dest: 'public',
  register: false, // Disable registration completely - we'll manage manually
  skipWaiting: false,
  disable: true, // DISABLE PWA COMPLETELY - causing caching issues
});

const nextConfig = {
  reactStrictMode: true,
  turbopack: {}, // Enable Turbopack explicitly for Next.js 16
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=604800',
        },
      ],
    },
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle Node.js modules on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
    }
    return config;
  },
  // Disable SWR caching for development
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
};

export default nextConfig;
