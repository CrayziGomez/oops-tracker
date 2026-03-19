const nextConfig = {
  // Standalone output: traces only used files, dramatically reduces Docker image size
  output: "standalone",
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
      allowedOrigins: ["oops.2bso.com", "192.168.1.13"],
    },
  },
};

export default nextConfig;
