import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, net: false, tls: false };
    config.resolve.alias = { ...config.resolve.alias, "pino-pretty": false, encoding: false, "@coinbase/cdp-sdk": false };
    return config;
  },
};

export default nextConfig;
