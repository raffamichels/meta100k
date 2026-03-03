import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Prisma não deve ser bundlado — o client usa require() nativo do Node.js
  serverExternalPackages: ["@prisma/client", "prisma", ".prisma/client"],
  // Força o Vercel a incluir os engine binaries do Prisma no Lambda bundle.
  // Sem isso, o file tracing ignora arquivos .node nativos e o Prisma crasha
  // em runtime antes de responder → Vercel retorna 404 em vez de 500.
  outputFileTracingIncludes: {
    "/**": ["./node_modules/.prisma/client/**/*"],
  },
  webpack: (config, { nextRuntime }) => {
    // O ua-parser-js bundlado dentro do Next.js usa __dirname para localizar assets.
    // No Edge Runtime (Vercel), __dirname não existe → ReferenceError.
    // config.node = { __dirname: true } faz o webpack substituir __dirname por
    // um caminho relativo em tempo de build, eliminando a referência em runtime.
    if (nextRuntime === "edge") {
      config.node = { __dirname: true, __filename: true };
    }
    return config;
  },
};

export default nextConfig;
