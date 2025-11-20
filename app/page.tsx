"use client";

import Link from "next/link";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import { CalendarIcon, CurrencyEuroIcon, BanknotesIcon, ChartBarIcon, TrashIcon } from "@heroicons/react/24/outline";
import { calculateMonthSummary } from "../lib/summary";
import { useFinanceData } from "../lib/useFinanceData";

const currencyFormat = (value: number, currency: string) =>
  `${value.toFixed(2)} ${currency}`;
const calendarColor = (month: string) => {
  const [, mm] = month.split("-");
  const m = Number(mm);
  if (Number.isNaN(m)) return "text-blue-600";
  if (m === 12 || m === 1 || m === 2) return "text-sky-500"; // winter
  if (m >= 3 && m <= 5) return "text-green-600"; // spring
  if (m >= 6 && m <= 8) return "text-amber-500"; // summer
  if (m >= 9 && m <= 11) return "text-orange-500"; // autumn
  return "text-blue-600";
};

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
    return (
      <div className="relative h-48 flex items-center justify-center animate-fade coin-wrapper">
        <Image
          src="/gif/coin_rotation_margin.gif"
          alt="Loading coin"
          className="h-20 w-20 coin-loader"
          width={80}
          height={80}
          priority
          unoptimized
        />
        <p className="absolute bottom-4 w-full text-center text-sm font-semibold gold-text">
          money cant wait!!
        </p>
        <style jsx>{`
          .coin-wrapper {
            perspective: 800px;
          }
          .coin-loader {
            filter: drop-shadow(0 10px 25px rgba(0, 0, 0, 0.12));
            animation: coinFloat 1.6s ease-in-out infinite;
          }
          .gold-text {
            background: linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24);
            background-size: 200% 200%;
            -webkit-background-clip: text;
            color: transparent;
            animation: shimmer 1.8s linear infinite, textFloat 1.6s ease-in-out infinite;
          }
          @keyframes shimmer {
            0% {
              background-position: 0% 50%;
            }
            100% {
              background-position: -200% 50%;
            }
          }
          @keyframes coinFloat {
            0% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
            100% {
              transform: translateY(0);
            }
          }
          @keyframes textFloat {
            0% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-6px);
            }
            100% {
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    );
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

      <form onSubmit={handleAddMonth} className="flex flex-wrap items-end gap-3 rounded-2xl bg-white/80 backdrop-blur px-4 py-3 shadow-lg animate-fade">
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
            <div key={month} className="space-y-3 rounded-2xl bg-white/80 backdrop-blur p-4 shadow-lg animate-fade">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <CalendarIcon className={`h-5 w-5 ${calendarColor(month)}`} />
                    {format(parseISO(`${month}-01`), "MMMM yyyy")}
                  </div>
                  <div className="text-xs text-slate-500">{month}</div>
                </div>
                <button
                  className="text-xs text-rose-500 flex items-center gap-1"
                  onClick={() => {
                    if (confirm(`Delete ${month} and its data?`)) {
                      deleteCustomMonth(month);
                    }
                  }}
                >
                  <TrashIcon className="h-4 w-4" /> Delete
                </button>
              </div>
              <div className="rounded-xl bg-slate-50/70 px-3 py-2 text-sm">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <CurrencyEuroIcon className="h-4 w-4 text-emerald-600" /> Income
                  </span>
                  <span>{currencyFormat(summary.defaultIncome + summary.incomeTransactionsTotal, settings.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <BanknotesIcon className="h-4 w-4 text-rose-500" /> Expenses
                  </span>
                  <span>{currencyFormat(summary.mandatoryRecurringTotal + summary.optionalRecurringTotal + summary.expenseTransactionsTotal, settings.currency)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
                <span className="flex items-center gap-1">
                  <ChartBarIcon className="h-4 w-4 text-indigo-600" /> End of month
                </span>
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
