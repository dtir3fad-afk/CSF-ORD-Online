/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Fix for undici module parsing issue
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Ignore undici in client-side builds
    config.externals = config.externals || [];
    config.externals.push('undici');
    
    return config;
  },
}

module.exports = nextConfig