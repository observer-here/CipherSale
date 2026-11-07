import type { NextConfig } from "next";
import path from "path";

const ethersV5 = path.join(process.cwd(), "src/primus/ethers-v5.ts");

const nextConfig: NextConfig = {
  devIndicators: false,
  webpack: (config, { webpack }) => {
    // The Primus FHE worker and Reown's viem build use dynamic requires. Webpack warns on every compile, harmlessly.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      { module: /@primuslabs[\\/]fhetransform-sdk|ox[\\/]_esm[\\/]tempo/ },
      { message: /Circular dependency between chunks with runtime/ },
    ];
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
