import type { NextConfig } from "next";
import path from 'path';
const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: path.resolve(__dirname)
  },
  async rewrites() {
    return [
      {
        source: '/media/:path*',
        destination: '/api/media/:path*'
      }
    ];
  }
};

export default nextConfig;
