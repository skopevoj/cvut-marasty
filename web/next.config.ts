import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/cvut-marasty',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
