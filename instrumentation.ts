export async function register() {
  // Este log confirma que o deploy novo está ativo no Vercel
  console.log("[BOOT] instrumentation.ts carregado, runtime:", process.env.NEXT_RUNTIME);

  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Captura erros não tratados com stack trace completo
    process.on("uncaughtException", (err) => {
      console.error("[UNCAUGHT]", err.stack ?? err.message);
    });
    process.on("unhandledRejection", (reason) => {
      const err = reason instanceof Error ? reason : new Error(String(reason));
      console.error("[UNHANDLED]", err.stack ?? err.message);
    });

    // Testa se __dirname está disponível neste contexto
    try {
      console.log("[BOOT] __dirname disponível:", typeof __dirname !== "undefined");
    } catch {
      console.error("[BOOT] __dirname não disponível no contexto Node.js!");
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    console.log("[BOOT] edge runtime ativo");
  }
}
