export default {
  transpilePackages: ["@packages/backend"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: "*.vercel.app",
      },

      {
        hostname: "img.clerk.com",
      },
    ],
  },
};
