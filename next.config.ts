import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Prisma não deve ser bundlado — o código gerado usa __dirname (CommonJS)
  // que não existe em bundles ESM ou no Edge Runtime
  serverExternalPackages: ["@prisma/client", "prisma", ".prisma/client"],
  webpack: (config) => {
    // Garante que __dirname e __filename estão disponíveis em bundles de servidor.
    // Necessário porque o Prisma usa __dirname para localizar o query engine.
    config.node = { __dirname: true, __filename: true };
    return config;
  },
};

export default nextConfig;
