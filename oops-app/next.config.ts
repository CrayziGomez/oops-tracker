import type { NextConfig } from "next";

const nextConfig: any = {
  // Allow external image domains for S3 attachments
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oops.2bso.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
  // Required for server actions and local network access
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    allowedDevOrigins: ["oops.2bso.com", "192.168.1.13"],
  },
};

export default nextConfig;
