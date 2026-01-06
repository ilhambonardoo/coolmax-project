import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],

  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
