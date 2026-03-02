import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  serverExternalPackages: ["@prisma/adapter-pg", "pg"],
  outputFileTracingExcludes: {
    "*": [
      // Binary engines (not needed with driver adapter approach)
      "node_modules/@prisma/engines/**",
      // Prisma Studio (local dev only)
      "node_modules/@prisma/studio-core/**",
      // WASM compilers for other databases (only PostgreSQL is used)
      "node_modules/@prisma/client/runtime/query_compiler*cockroachdb*",
      "node_modules/@prisma/client/runtime/query_compiler*mysql*",
      "node_modules/@prisma/client/runtime/query_compiler*sqlite*",
      "node_modules/@prisma/client/runtime/query_compiler*sqlserver*",
      // Small WASM compilers (fast variant is sufficient)
      "node_modules/@prisma/client/runtime/query_compiler_small*",
      // Edge WASM compiler (not needed in Node.js serverless)
      "node_modules/@prisma/client/runtime/wasm-compiler-edge*",
      // Source maps (not needed in production)
      "node_modules/@prisma/client/runtime/*.map",
    ],
  },
};

export default nextConfig;
