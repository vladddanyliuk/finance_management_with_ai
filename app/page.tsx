"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/Card";
import { MonthNavigator } from "../components/MonthNavigator";
import { TransactionForm } from "../components/TransactionForm";
import { TransactionList } from "../components/TransactionList";
import { calculateMonthSummary } from "../lib/summary";
import { useFinanceData } from "../lib/useFinanceData";
import ReactMarkdown from "react-markdown";
import { jsPDF } from "jspdf";

const currencyFormat = (value: number, currency: string) =>
  `${value.toFixed(2)} ${currency}`;

export default function DashboardPage() {
  const { settings, transactions, hydrated, setSettings } = useFinanceData();
  const [month, setMonth] = useState(settings.lastSelectedMonth);
  const [aiPlan, setAiPlan] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    setMonth(settings.lastSelectedMonth);
  }, [settings.lastSelectedMonth]);

  useEffect(() => {
    setAiPlan("");
    setAiError(null);
  }, [month]);

  const summary = useMemo(
    () => calculateMonthSummary(month, settings, transactions),
    [month, settings, transactions]
  );

  const availableMonths = useMemo(() => {
    const set = new Set<string>([
      settings.lastSelectedMonth,
      ...settings.customMonths,
    ]);
    transactions.forEach((tx) => set.add(tx.month));
    settings.oneTimeExpenses.forEach((tx) => set.add(tx.month));
    return Array.from(set).sort();
  }, [settings.customMonths, settings.lastSelectedMonth, settings.oneTimeExpenses, transactions]);

  const monthTransactions = useMemo(
    () => transactions.filter((tx) => tx.month === month).slice(0, 5),
    [transactions, month]
  );

  const handleMonthChange = (nextMonth: string) => {
    setMonth(nextMonth);
    setSettings({ lastSelectedMonth: nextMonth });
  };

  const generateAiPlan = async () => {
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
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate plan");
      }
      const data = await response.json();
      setAiPlan(data.markdown);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      setAiError(message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddMonth = (newMonth: string) => {
    const customMonths = Array.from(new Set([...settings.customMonths, newMonth]));
    setSettings({ customMonths, lastSelectedMonth: newMonth });
    setMonth(newMonth);
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

  return (
    <div className="space-y-6 pb-12 animate-slideIn">
      <MonthNavigator
        month={month}
        onChange={handleMonthChange}
        availableMonths={availableMonths}
        onAddMonth={handleAddMonth}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Default income" value={currencyFormat(summary.defaultIncome, settings.currency)} />
        <Card title="Fixed costs" value={currencyFormat(summary.mandatoryRecurringTotal + summary.optionalRecurringTotal, settings.currency)} />
        <Card
          title="Remaining this month"
          value={currencyFormat(summary.remaining, settings.currency)}
          accent={summary.remaining >= 0 ? "positive" : "negative"}
        />
        <Card title="Daily budget" value={currencyFormat(summary.dailyBudget, settings.currency)}>
          You can spend about {currencyFormat(summary.dailyBudget, settings.currency)} per day.
        </Card>
      </div>
      <TransactionForm />
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent transactions</h2>
        </div>
        <TransactionList transactions={monthTransactions} />
      </section>
      <section className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">AI monthly plan</h2>
          <button
            className="rounded-full bg-blue-600 px-4 py-2 text-sm text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow disabled:opacity-60"
            onClick={generateAiPlan}
            disabled={aiLoading}
          >
            {aiLoading ? "Generating…" : "Generate AI monthly plan"}
          </button>
        </div>
        {aiError && <p className="text-sm text-rose-500">{aiError}</p>}
        {aiPlan && (
          <div className="space-y-2">
            <ReactMarkdown className="prose prose-sm max-w-none">
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
    </div>
  );
}
