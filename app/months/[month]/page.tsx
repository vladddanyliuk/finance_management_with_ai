"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { jsPDF } from "jspdf";
import { Card } from "../../../components/Card";
import { TransactionForm } from "../../../components/TransactionForm";
import { TransactionList } from "../../../components/TransactionList";
import { calculateMonthSummary } from "../../../lib/summary";
import { useFinanceData } from "../../../lib/useFinanceData";

const currencyFormat = (value: number, currency: string) =>
  `${value.toFixed(2)} ${currency}`;

export default function MonthDetailPage() {
  const params = useParams<{ month: string | string[] }>();
  const router = useRouter();
  const month = Array.isArray(params?.month) ? params?.month[0] : params?.month;
  const { settings, transactions, hydrated, setSettings, monthPlans, setMonthPlan, deleteCustomMonth } = useFinanceData();

  const [aiPlan, setAiPlan] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

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
    () => transactions.filter((tx) => tx.month === month),
    [transactions, month]
  );

  const generateAiPlan = async () => {
    if (!month) return;
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Transactions ({month})</h2>
        </div>
        <TransactionList transactions={monthTransactions} showActions />
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
