import { differenceInCalendarDays, endOfMonth, parseISO } from "date-fns";
import { MonthSummary, Transaction, UserSettings } from "./types";

export const calculateMonthSummary = (
  month: string,
  settings: UserSettings,
  transactions: Transaction[]
): MonthSummary => {
  const recurring = settings.recurringExpenses;
  const mandatoryRecurringTotal = recurring
    .filter((r) => r.isMandatory)
    .reduce((acc, r) => acc + r.amount, 0);
  const optionalRecurringTotal = recurring
    .filter((r) => !r.isMandatory)
    .reduce((acc, r) => acc + r.amount, 0);
  const plannedOneTimeTotal = settings.oneTimeExpenses
    .filter((e) => e.month === month)
    .reduce((acc, e) => acc + e.amount, 0);

  const monthTransactions = transactions.filter((t) => t.month === month);
  const incomeTransactionsTotal = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const expenseTransactionsTotal = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  const defaultIncome = settings.defaultMonthlyIncome;
  const plannedOutflows =
    mandatoryRecurringTotal + optionalRecurringTotal + plannedOneTimeTotal;
  const plannedRemaining = defaultIncome - plannedOutflows;
  const netTransactions = incomeTransactionsTotal - expenseTransactionsTotal;
  const remaining = plannedRemaining + netTransactions;

  const monthStart = parseISO(`${month}-01`);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = Math.max(1, differenceInCalendarDays(monthEnd, monthStart) + 1);
  const dailyBudget = remaining / daysInMonth;

  return {
    month,
    mandatoryRecurringTotal,
    optionalRecurringTotal,
    plannedOneTimeTotal,
    incomeTransactionsTotal,
    expenseTransactionsTotal,
    defaultIncome,
    remaining,
    dailyBudget,
  };
};
