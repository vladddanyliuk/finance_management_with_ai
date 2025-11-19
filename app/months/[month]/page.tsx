"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { jsPDF } from "jspdf";
import { Card } from "../../../components/Card";
import { TransactionForm } from "../../../components/TransactionForm";
import { TransactionList } from "../../../components/TransactionList";
import { calculateMonthSummary } from "../../../lib/summary";
import { useFinanceData } from "../../../lib/useFinanceData";
import { Transaction } from "../../../lib/types";

const currencyFormat = (value: number, currency: string) =>
  `${value.toFixed(2)} ${currency}`;

export default function MonthDetailPage() {
  const params = useParams<{ month: string | string[] }>();
  const router = useRouter();
  const month = Array.isArray(params?.month) ? params?.month[0] : params?.month;
  const {
    settings,
    transactions,
    hydrated,
    setSettings,
    monthPlans,
    setMonthPlan,
    deleteCustomMonth,
    updateTransaction,
  } = useFinanceData();

  const [aiPlan, setAiPlan] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const defaultOptions = [
    {
      title: "Budget Overhaul",
      summary: "Revamp spending to fit your income better.",
      note: "A friendly makeover for your money.",
    },
    {
      title: "Expense Cut Challenge",
      summary: "Trim unnecessary costs and boost savings.",
      note: "Stretch those euros like a yoga pro.",
    },
    {
      title: "Income Boost Plan",
      summary: "Find ways to increase your income.",
      note: "Because earning can be as fun as spending… sometimes!",
    },
  ];
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [selectedOptionDetails, setSelectedOptionDetails] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (month) {
      setSettings({ lastSelectedMonth: month });
      setAiPlan(monthPlans[month] ?? "");
    }
  }, [month, monthPlans, setSettings]);

  const summary = useMemo(() => {
    if (!month) return null;
    return calculateMonthSummary(month, settings, transactions);
  }, [month, settings, transactions]);

  const monthTransactions = useMemo(
    () =>
      transactions.filter(
        (tx) => tx.month === month && (filterCategory === "all" || tx.category === filterCategory)
      ),
    [transactions, month, filterCategory]
  );

  const generateAiPlan = async () => {
    if (!month || !selectedOption) {
      setAiError("Select a spending option first");
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setAiError("No internet, cannot generate AI plan");
      return;
    }
    if (!settings.openAiApiKey) {
      setAiError("Add your OpenAI API key in Settings to continue");
      return;
    }
    setAiError(null);
    setAiLoading(true);
    try {
      const response = await fetch("/api/month-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          month,
          settings,
          summary,
          apiKey: settings.openAiApiKey,
          transactionsSample: transactions.filter((tx) => tx.month === month).slice(0, 10),
          selectedOption,
          selectedOptionDetails,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate plan");
      }
      const data = await response.json();
      setAiPlan(data.markdown);
      setMonthPlan(month, data.markdown);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      setAiError(message);
    } finally {
      setAiLoading(false);
    }
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(aiPlan || "No plan", 180);
    doc.text(lines, 10, 10);
    doc.save(`${month}-plan.pdf`);
  };

  if (!hydrated) {
    return <p className="text-sm text-slate-500">Loading your data…</p>;
  }

  if (!month || !settings.customMonths.includes(month)) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Month not found. Add it on the dashboard first.</p>
        <Link className="text-sm text-blue-600 underline" href="/">Back to dashboard</Link>
      </div>
    );
  }

  if (!summary) return null;

  const positive = summary.remaining >= 0;

  return (
    <div className="space-y-6 pb-12 animate-slideIn">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-blue-600 underline">
            ← Back to dashboard
          </Link>
          <h1 className="text-2xl font-semibold mt-1">{month}</h1>
        </div>
        <button
          className="text-sm text-rose-500"
          onClick={() => {
            if (confirm(`Delete ${month} and its data?`)) {
              deleteCustomMonth(month);
              router.push("/");
            }
          }}
        >
          Delete month
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Default income" value={currencyFormat(summary.defaultIncome, settings.currency)} />
        <Card title="Fixed costs" value={currencyFormat(summary.mandatoryRecurringTotal + summary.optionalRecurringTotal, settings.currency)} />
        <Card
          title="Remaining this month"
          value={currencyFormat(summary.remaining, settings.currency)}
          accent={positive ? "positive" : "negative"}
        />
        <Card title="Daily budget" value={currencyFormat(summary.dailyBudget, settings.currency)}>
          You can spend about {currencyFormat(summary.dailyBudget, settings.currency)} per day.
        </Card>
      </div>

      <TransactionForm targetMonth={month} title="Add transaction for this month" />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Transactions ({month})</h2>
          <select
            className="rounded-xl border px-3 py-2 text-sm"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            {settings.categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.icon ? `${cat.icon} ` : ""}{cat.name}
              </option>
            ))}
          </select>
        </div>
        <TransactionList transactions={monthTransactions} showActions onSelect={setEditingTx} />
      </section>

      <section className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">AI monthly plan</h2>
          <button
            className="rounded-full bg-blue-600 px-4 py-2 text-sm text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow disabled:opacity-60"
            onClick={generateAiPlan}
            disabled={aiLoading || !selectedOption}
          >
            {aiLoading ? "Working…" : "Generate plan"}
          </button>
        </div>
        {aiError && <p className="text-sm text-rose-500">{aiError}</p>}
        <div className="space-y-2">
          <p className="text-sm text-slate-600">Pick one of the options below:</p>
          <ul className="space-y-2">
            {defaultOptions.map((opt, idx) => (
              <li key={opt.title ?? idx} className="rounded-xl border px-3 py-2">
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="radio"
                    checked={selectedOption === opt.title}
                    onChange={() => {
                      setSelectedOption(opt.title);
                      setSelectedOptionDetails(
                        `${opt.title} - ${opt.summary ?? ""} ${opt.note ?? ""}`.trim()
                      );
                    }}
                  />
                  <div>
                    <div className="font-semibold">{opt.title}</div>
                    {opt.summary && <div className="text-slate-600">{opt.summary}</div>}
                    {opt.note && <div className="text-xs text-slate-500">{opt.note}</div>}
                  </div>
                </label>
              </li>
            ))}
          </ul>
        </div>
        {aiPlan && (
          <div className="space-y-2">
            <ReactMarkdown className="prose prose-sm max-w-none" remarkPlugins={[remarkGfm]}>
              {aiPlan}
            </ReactMarkdown>
            <button
              className="rounded-full border border-blue-600 px-4 py-2 text-sm text-blue-600 transition-all duration-200 hover:-translate-y-0.5 hover:shadow"
              onClick={downloadPdf}
            >
              Download PDF
            </button>
          </div>
        )}
      </section>

      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md space-y-3 rounded-2xl bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit transaction</h3>
              <button className="text-sm text-slate-500" onClick={() => setEditingTx(null)}>Close</button>
            </div>
            <label className="text-sm text-slate-600">
              Date
              <input
                type="date"
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={editingTx.date}
                onChange={(e) => setEditingTx({ ...editingTx, date: e.target.value })}
              />
            </label>
            <label className="text-sm text-slate-600">
              Type
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={editingTx.type}
                onChange={(e) =>
                  setEditingTx({ ...editingTx, type: e.target.value as Transaction["type"] })
                }
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>
            <label className="text-sm text-slate-600">
              Amount
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={editingTx.amount}
                onChange={(e) => setEditingTx({ ...editingTx, amount: Number(e.target.value) })}
              />
            </label>
            <label className="text-sm text-slate-600">
              Category
              {settings.categories.length > 0 ? (
                <select
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={editingTx.category}
                  onChange={(e) => setEditingTx({ ...editingTx, category: e.target.value })}
                >
                  {settings.categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={editingTx.category}
                  onChange={(e) => setEditingTx({ ...editingTx, category: e.target.value })}
                />
              )}
            </label>
            <label className="text-sm text-slate-600">
              Note
              <textarea
                className="mt-1 w-full rounded-xl border px-3 py-2"
                rows={2}
                value={editingTx.note ?? ""}
                onChange={(e) => setEditingTx({ ...editingTx, note: e.target.value })}
              />
            </label>
            <div className="flex justify-end gap-2">
              <button className="rounded-full border px-4 py-2 text-sm" onClick={() => setEditingTx(null)}>
                Cancel
              </button>
              <button
                className="rounded-full bg-blue-600 px-4 py-2 text-sm text-white"
                onClick={() => {
                  if (!editingTx) return;
                  updateTransaction({ ...editingTx, month });
                  setEditingTx(null);
                }}
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
