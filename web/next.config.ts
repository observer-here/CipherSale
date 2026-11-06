import type { NextConfig } from "next";
import path from "path";

const ethersV5 = path.join(process.cwd(), "src/primus/ethers-v5.ts");

const nextConfig: NextConfig = {
  webpack: (config, { webpack }) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, net: false, tls: false };
    config.resolve.alias = {
      ...config.resolve.alias,
      "pino-pretty": false,
      encoding: false,
      "@coinbase/cdp-sdk": false,
    };
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^ethers$/, (resource: { context?: string; request: string }) => {
        const from = (resource.context ?? "").replaceAll("\\", "/");
        if (from.includes("@primuslabs/zktls-js-sdk")) resource.request = ethersV5;
      }),
    );
    return config;
  },
};

export default nextConfig;
