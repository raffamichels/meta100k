import { SalaryForm } from "@/components/lancamentos/SalaryForm";
import { SavingsForm } from "@/components/lancamentos/SavingsForm";
import { ExtraForm } from "@/components/lancamentos/ExtraForm";
import { ExpenseForm } from "@/components/lancamentos/ExpenseForm";

export default function LancamentosPage() {
  return (
    <>
      <SalaryForm />
      <SavingsForm />
      <ExtraForm />
      <ExpenseForm />
    </>
  );
}
