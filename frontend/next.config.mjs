/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { unoptimized: true },
  serverExternalPackages: ['pino'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Use filesystem cache to avoid recompiling everything on each request
      config.cache = {
        type: 'filesystem',
        compression: false,
      };
    }

    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
    };

    return config;
  },
  turbopack: {},
};

export default nextConfig;
