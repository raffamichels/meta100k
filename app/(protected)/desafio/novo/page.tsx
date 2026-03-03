import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChallengeCreator } from "@/components/social/ChallengeCreator";

export default async function NovoDesafioPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontWeight: 800,
            fontSize: 28,
            letterSpacing: "-1px",
            marginBottom: 4,
          }}
        >
          ⚔️ Novo Desafio
        </div>
        <div style={{ color: "var(--muted)", fontSize: 14 }}>
          Desafie um amigo e cresçam juntos rumo aos R$100K
        </div>
      </div>

      {/* Formulário */}
      <ChallengeCreator />

    </div>
  );
}
