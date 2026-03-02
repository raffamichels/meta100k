import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Prisma não deve ser bundlado — o client usa require() nativo do Node.js
  serverExternalPackages: ["@prisma/client", "prisma", ".prisma/client"],
};

export default nextConfig;
