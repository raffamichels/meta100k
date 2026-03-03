import { SalaryForm } from "@/components/lancamentos/SalaryForm";
import { SavingsForm } from "@/components/lancamentos/SavingsForm";
import { ExtraForm } from "@/components/lancamentos/ExtraForm";
import { ExpenseForm } from "@/components/lancamentos/ExpenseForm";
import { TemptationForm } from "@/components/lancamentos/TemptationForm";

export default function LancamentosPage() {
  return (
    // .lancamentos-grid → no desktop: grid 2x2 (SalaryForm|SavingsForm / ExtraForm|ExpenseForm)
    // No mobile: div transparente, formulários empilhados normalmente
    // .lancamentos-full → span de 2 colunas no desktop para o TemptationForm
    <div className="lancamentos-grid">
      <SalaryForm />
      <SavingsForm />
      <ExtraForm />
      <ExpenseForm />
      {/* Cofre do Diabo ocupa largura total no desktop */}
      <div className="lancamentos-full">
        <TemptationForm />
      </div>
    </div>
  );
}
