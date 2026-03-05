"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteBudget } from "@/lib/actions/budget";
import type { BudgetWithProgress, ManagedBudget } from "@/lib/actions/budget";
import { BudgetProgressCard } from "./BudgetProgressCard";
import { BudgetForm } from "./BudgetForm";
import { MONTH_NAMES } from "@/lib/utils";

interface Props {
  activeBudgets: BudgetWithProgress[];
  managedBudgets: ManagedBudget[];
  currentMonthKey: string;
  daysLeft: number;
}

export function BudgetManager({ activeBudgets, managedBudgets, currentMonthKey, daysLeft }: Props) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Nome do mês atual para o título
  const [y, m] = currentMonthKey.split("-").map(Number);
  const monthLabel = `${MONTH_NAMES[m - 1]} ${y}`;

  // Categorias com limite recorrente (para excluir do form de criação)
  const recurringCategories = managedBudgets
    .filter((b) => b.monthKey === null)
    .map((b) => b.category);

  // Callback ao salvar no form: fecha form e recarrega dados
  const handleFormSuccess = useCallback(() => {
    setShowAddForm(false);
    setEditingId(null);
    router.refresh();
  }, [router]);

  // Excluir orçamento
  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteBudget(id);
      setDeletingId(null);
      router.refresh();
    });
  };

  const editingBudget = editingId ? managedBudgets.find((b) => b.id === editingId) : undefined;

  return (
    <>
      {/* Cabeçalho com botão voltar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link
          href="/perfil"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--card)",
            textDecoration: "none",
            color: "var(--muted)",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          ←
        </Link>
        <div>
          <div
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 800,
              fontSize: 22,
              letterSpacing: "-0.5px",
            }}
          >
            📊 Orçamento Mensal
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
            Limites de gasto por categoria
          </div>
        </div>
      </div>

      {/* Formulário de adição (aberto pelo botão + Adicionar) */}
      {showAddForm && !editingId && (
        <BudgetForm
          currentMonthKey={currentMonthKey}
          recurringCategories={recurringCategories}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* ── Seção: Progresso do mês ─────────────────────────────────────── */}
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "1.2px",
          color: "var(--muted)",
          marginBottom: 12,
          fontWeight: 600,
        }}
      >
        Progresso — {monthLabel}
      </div>

      {activeBudgets.length === 0 ? (
        // Estado vazio
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 24,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 700,
              fontSize: 15,
              marginBottom: 6,
            }}
          >
            Nenhum limite definido ainda
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
            Você ainda não definiu nenhum limite.
            <br />
            Comece adicionando uma categoria.
          </div>
        </div>
      ) : (
        <>
          {activeBudgets.map((b) => (
            <BudgetProgressCard key={b.id} budget={b} daysLeft={daysLeft} />
          ))}
        </>
      )}

      {/* Botão + Adicionar limite */}
      {!showAddForm && !editingId && (
        <button
          onClick={() => setShowAddForm(true)}
          disabled={recurringCategories.length >= 10} // 10 categorias = todas
          style={{
            width: "100%",
            padding: 13,
            borderRadius: 14,
            border: "1px dashed rgba(96,212,240,0.4)",
            background: "transparent",
            color: "var(--accent2)",
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: 28,
            opacity: recurringCategories.length >= 10 ? 0.4 : 1,
          }}
        >
          + Adicionar limite
        </button>
      )}

      {/* ── Seção: Gerenciar limites ────────────────────────────────────── */}
      {managedBudgets.length > 0 && (
        <>
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              color: "var(--muted)",
              marginBottom: 12,
              fontWeight: 600,
            }}
          >
            Gerenciar Limites
          </div>

          {/* Formulário de edição (inline, acima do item editado) */}
          {editingId && editingBudget && (
            <BudgetForm
              currentMonthKey={currentMonthKey}
              editing={editingBudget}
              recurringCategories={recurringCategories}
              onSuccess={handleFormSuccess}
              onCancel={() => setEditingId(null)}
            />
          )}

          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            {managedBudgets.map((b, i) => (
              <div
                key={b.id}
                style={{
                  padding: "14px 16px",
                  borderBottom: i < managedBudgets.length - 1 ? "1px solid var(--border)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  opacity: isPending && deletingId === b.id ? 0.4 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {/* Informações */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                    {b.category}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    R$ {b.limit.toLocaleString("pt-BR")}/mês
                    {b.monthKey && (
                      <span style={{ marginLeft: 6, color: "var(--accent)", fontSize: 11 }}>
                        (apenas {b.monthKey})
                      </span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                {deletingId === b.id ? (
                  // Confirmação de exclusão inline
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>Confirmar?</span>
                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={isPending}
                      style={{
                        padding: "5px 10px",
                        borderRadius: 8,
                        border: "none",
                        background: "rgba(240,64,64,0.85)",
                        color: "white",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      style={{
                        padding: "5px 10px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "transparent",
                        color: "var(--muted)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingId(b.id);
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "1px solid rgba(96,212,240,0.3)",
                        background: "transparent",
                        color: "var(--accent2)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDeletingId(b.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "1px solid rgba(240,96,96,0.3)",
                        background: "transparent",
                        color: "var(--danger)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
