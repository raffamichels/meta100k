import { SalaryForm } from "@/components/lancamentos/SalaryForm";
import { SavingsForm } from "@/components/lancamentos/SavingsForm";
import { ExtraForm } from "@/components/lancamentos/ExtraForm";
import { ExpenseForm } from "@/components/lancamentos/ExpenseForm";

export default function LancamentosPage() {
  return (
    // .lancamentos-grid → no desktop: grid 2x2 (SalaryForm|SavingsForm / ExtraForm|ExpenseForm)
    // No mobile: div transparente, formulários empilhados normalmente
    <div className="lancamentos-grid">
      <SalaryForm />
      <SavingsForm />
      <ExtraForm />
      <ExpenseForm />
    </div>
  );
}
