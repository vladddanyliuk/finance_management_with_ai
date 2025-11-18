"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import { calculateMonthSummary } from "../lib/summary";
import { useFinanceData } from "../lib/useFinanceData";

const currencyFormat = (value: number, currency: string) =>
  `${value.toFixed(2)} ${currency}`;

export default function DashboardPage() {
  const { settings, transactions, hydrated, addCustomMonth, deleteCustomMonth, setSettings } = useFinanceData();
  const [newMonth, setNewMonth] = useState("");

  const monthSummaries = useMemo(() => {
    return settings.customMonths.map((month) => ({
      month,
      summary: calculateMonthSummary(month, settings, transactions),
    }));
  }, [settings, transactions]);

  const handleAddMonth = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newMonth) return;
    addCustomMonth(newMonth);
    setNewMonth("");
  };

  if (!hydrated) {
    return <p className="text-sm text-slate-500">Loading your data…</p>;
  }

  return (
    <div className="space-y-6 pb-12 animate-slideIn">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Months</h1>
        <button
          className="text-sm text-slate-500 underline"
          onClick={() => setSettings({ lastSelectedMonth: settings.customMonths[0] ?? "" })}
        >
          Set first month as default
        </button>
      </div>

      <form onSubmit={handleAddMonth} className="flex flex-wrap items-end gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-slate-600">Create month</label>
          <input
            type="month"
            value={newMonth}
            onChange={(e) => setNewMonth(e.target.value)}
            className="mt-1 w-52 rounded-xl border px-3 py-2 text-sm"
            placeholder="YYYY-MM"
            required
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-4 py-2 text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow disabled:opacity-60"
          disabled={!newMonth}
        >
          Add month
        </button>
      </form>

      {monthSummaries.length === 0 && (
        <p className="text-sm text-slate-500">No months yet. Add one to begin planning.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {monthSummaries.map(({ month, summary }) => {
          const positive = summary.remaining >= 0;
          return (
            <div key={month} className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm animate-fade">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {format(parseISO(`${month}-01`), "MMMM yyyy")}
                  </div>
                  <div className="text-xs text-slate-500">{month}</div>
                </div>
                <button
                  className="text-xs text-rose-500"
                  onClick={() => {
                    if (confirm(`Delete ${month} and its data?`)) {
                      deleteCustomMonth(month);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <div className="flex justify-between">
                  <span>Income</span>
                  <span>{currencyFormat(summary.defaultIncome + summary.incomeTransactionsTotal, settings.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expenses</span>
                  <span>{currencyFormat(summary.mandatoryRecurringTotal + summary.optionalRecurringTotal + summary.plannedOneTimeTotal + summary.expenseTransactionsTotal, settings.currency)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
                <span>End of month</span>
                <span className={positive ? "text-emerald-600" : "text-rose-600"}>
                  {positive ? "+" : "-"}{currencyFormat(Math.abs(summary.remaining), settings.currency)}
                </span>
              </div>
              <Link
                href={`/months/${month}`}
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow"
              >
                Open month
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
