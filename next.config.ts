import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Prisma não deve ser bundlado — o código gerado usa __dirname (Node.js CJS)
  // que não está disponível em bundles ESM ou no Edge Runtime do Vercel
  serverExternalPackages: ["@prisma/client", "prisma", ".prisma/client"],
  webpack: (config) => {
    // Garante __dirname em bundles de servidor (necessário para o Prisma localizar o query engine)
    config.node = { __dirname: true, __filename: true };
    return config;
  },
};

export default nextConfig;
