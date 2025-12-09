"use client";

import { AdjustmentsHorizontalIcon, ArrowUpTrayIcon, SparklesIcon, WalletIcon } from "@heroicons/react/24/outline";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useFinanceData, getMonthFromDate } from "../../lib/useFinanceData";
import { TransactionList } from "../../components/TransactionList";
import { TransactionEditModal } from "../../components/TransactionEditModal";
import { Transaction } from "../../lib/types";
import { parseSparkassePdf, SparkasseParseResult } from "../../lib/sparkasseParser";
import { SparkasseImportModal } from "../../components/SparkasseImportModal";
import { generateId } from "../../lib/id";

export default function TransactionsPage() {
  const { transactions, settings, updateTransaction, addTransaction, setSettings } = useFinanceData();
  const months = Array.from(new Set(transactions.map((tx) => tx.month))).sort().reverse();
  const latestMonth = months[0] ?? "";
  const [filters, setFilters] = useState({
    month: months[0] ?? "",
    type: "all",
    category: "",
  });
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [importPreview, setImportPreview] = useState<SparkasseParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isApplyingImport, setIsApplyingImport] = useState(false);
  const [isAiContextualizing, setIsAiContextualizing] = useState(false);
  const [previewRecurring, setPreviewRecurring] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentMonth = filters.month || latestMonth || getMonthFromDate(new Date().toISOString());

  const addMonths = (month: string, count: number) => {
    const [yearStr, monthStr] = month.split("-");
    const date = new Date(Number(yearStr), Number(monthStr) - 1 + count, 1);
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, "0");
    return `${y}-${m}`;
  };

  const recurringStatus = useMemo(() => {
    return settings.recurringExpenses.map((exp) => {
      const total = exp.totalAmount ?? exp.amount;
      const monthly = exp.plannedMonthlyAmount ?? exp.amount;
      const paid = transactions
        .filter((t) => t.recurringExpenseId === exp.id && t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      const remaining = Math.max(total - paid, 0);
      const monthsLeft = monthly > 0 ? Math.ceil(remaining / monthly) : null;
      const start = exp.startMonth || currentMonth;
      const projectedEnd = monthsLeft ? addMonths(start, monthsLeft - 1) : null;
      const isActive =
        (!exp.startMonth || exp.startMonth <= currentMonth) &&
        (!exp.endMonth || exp.endMonth >= currentMonth);
      return {
        expense: exp,
        paid,
        remaining,
        dueThisMonth: Math.min(remaining, monthly),
        projectedEnd,
        isActive,
      };
    });
  }, [settings.recurringExpenses, transactions, currentMonth]);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (filters.month && tx.month !== filters.month) return false;
      if (filters.type !== "all" && tx.type !== filters.type) return false;
      if (filters.category && !tx.category.toLowerCase().includes(filters.category.toLowerCase()))
        return false;
      return true;
    });
  }, [transactions, filters]);

  const startEdit = (tx: Transaction) => setEditing(tx);
  const cancelEdit = () => setEditing(null);

  const handleSparkasseFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setParseError(null);
    setImportPreview(null);
    setAiError(null);
    setPreviewRecurring({});
    setIsParsingFile(true);
    try {
      const parsed = await parseSparkassePdf(file);
      if (!parsed.transactions.length) {
        setParseError("No transactions were detected in that PDF.");
      } else {
        setImportPreview(parsed);
      }
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Failed to parse Sparkasse PDF.");
    } finally {
      setIsParsingFile(false);
      event.target.value = "";
    }
  };

  const applyImport = () => {
    if (!importPreview) return;
    setIsApplyingImport(true);
    try {
      importPreview.transactions.forEach((tx, index) => {
        const key = `${tx.date}-${index}-${tx.label}`;
        addTransaction({
          amount: tx.amount,
          category: tx.label,
          date: tx.date,
          month: getMonthFromDate(tx.date),
          note: tx.details,
          type: tx.type,
          recurringExpenseId: previewRecurring[key] || undefined,
        });
      });
      if (importPreview.statementMonth) {
        setFilters((prev) => ({ ...prev, month: importPreview.statementMonth }));
      }
      setImportPreview(null);
    } finally {
      setIsApplyingImport(false);
    }
  };

  const useAiForContext = async () => {
    if (!importPreview) return;
    if (!settings.openAiApiKey) {
      setAiError("Please add an OpenAI API key in Settings before using AI context.");
      return;
    }
    setAiError(null);
    setIsAiContextualizing(true);
    const updatedTransactions: SparkasseParseResult["transactions"] = [];
    const newCategories: { name: string; icon?: string }[] = [];

    for (const tx of importPreview.transactions) {
      const note = tx.details ? `${tx.label} — ${tx.details}` : tx.label;
      try {
        const response = await fetch("/api/auto-categorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: tx.amount,
            type: tx.type,
            note,
            availableCategories: settings.categories,
            userCategory: tx.label,
            apiKey: settings.openAiApiKey,
            allowNewCategories: settings.aiAllowNewCategories,
          }),
        });
        if (!response.ok) {
          const errText = await response.text().catch(() => "Failed to reach AI service.");
          throw new Error(errText || "AI categorization failed.");
        }
        const ai = (await response.json()) as { categoryName?: string; isNew?: boolean; icon?: string; note?: string };
        const categoryName = ai.categoryName?.trim() || tx.label;
        const rewrittenNote = ai.note?.trim() || note;

        if (ai.isNew && settings.aiAllowNewCategories && !settings.categories.some((c) => c.name === categoryName)) {
          newCategories.push({ name: categoryName, icon: ai.icon || undefined });
        }

        updatedTransactions.push({
          ...tx,
          label: categoryName,
          details: rewrittenNote,
        });
      } catch (error) {
        setAiError(error instanceof Error ? error.message : "AI categorization failed.");
        updatedTransactions.push({ ...tx, details: note });
      }
    }

    if (newCategories.length) {
      const dedupedNew = newCategories.filter(
        (cat, idx, arr) => arr.findIndex((c) => c.name === cat.name) === idx
      );
      setSettings({
        categories: [
          ...settings.categories,
          ...dedupedNew.map((cat) => ({ id: generateId(), name: cat.name, icon: cat.icon })),
        ],
      });
    }

    setImportPreview({ ...importPreview, transactions: updatedTransactions });
    setIsAiContextualizing(false);
  };

  const handleSetPreviewRecurring = (key: string, recurringId: string) => {
    setPreviewRecurring((prev) => ({
      ...prev,
      [key]: recurringId,
    }));
  };

  useEffect(() => {
    startTransition(() => {
      setFilters((prev) => ({ ...prev, month: latestMonth }));
    });
  }, [latestMonth]);

  return (
    <div className="space-y-6 pb-12 animate-slideIn">
      <div className="rounded-2xl bg-white/80 backdrop-blur p-4 shadow-lg animate-slideIn">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ArrowUpTrayIcon className="h-5 w-5 text-indigo-600" />
              Import Sparkasse statement
            </h2>
            <p className="text-sm text-slate-500">
              Upload a Kontoauszug PDF, we will detect the month and preview all bookings.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleSparkasseFile}
            />
            <button
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsingFile}
            >
              {isParsingFile ? "Parsing..." : "Upload PDF"}
            </button>
          </div>
        </div>
        {parseError && <p className="mt-2 text-sm text-rose-600">{parseError}</p>}
        {importPreview && (
          <p className="mt-2 text-sm text-emerald-700">
            Detected {importPreview.transactions.length} entries for{" "}
            {importPreview.statementMonth || "the detected month"}.
          </p>
        )}
      </div>
      <div className="rounded-2xl bg-white/80 backdrop-blur p-4 shadow-lg animate-slideIn">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <AdjustmentsHorizontalIcon className="h-5 w-5 text-blue-600" />
          Filters
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="text-sm text-slate-600">
            Month
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            >
              <option value="">All</option>
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-600">
            Type
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>
          <label className="text-sm text-slate-600">
            Category
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">All categories</option>
              {settings.categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.icon ? `${cat.icon} ` : ""}
                  {cat.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {recurringStatus.some((r) => r.isActive && r.remaining > 0) && (
        <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 shadow-sm animate-slideIn space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
            <SparklesIcon className="h-4 w-4" />
            Recurring reminders (manual)
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {recurringStatus
              .filter((r) => r.isActive && r.remaining > 0)
              .map((r) => (
                <div key={r.expense.id} className="rounded-xl bg-white/80 p-3 border border-blue-100 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">{r.expense.name}</div>
                  <div className="text-xs text-slate-600">
                    Due this month: {r.dueThisMonth.toFixed(2)} {settings.currency} · Remaining: {r.remaining.toFixed(2)}{" "}
                    {settings.currency}
                  </div>
                  {r.projectedEnd && (
                    <div className="text-xs text-blue-700">
                      Est. paid off by {r.projectedEnd} if paying {(r.expense.plannedMonthlyAmount ?? r.expense.amount).toFixed(2)} per month.
                    </div>
                  )}
                  <div className="mt-1 text-xs text-slate-500">
                    Link expense payments by editing a transaction and selecting the recurring item.
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
      <div className="rounded-2xl bg-white/80 backdrop-blur p-4 shadow-lg animate-slideIn">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <WalletIcon className="h-5 w-5 text-emerald-600" />
            Transactions
          </h2>
        </div>
        <TransactionList transactions={filtered} showActions onSelect={startEdit} />
        {filtered.length > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            Tap a transaction to edit.
          </p>
        )}
      </div>
      {editing && (
        <TransactionEditModal
          transaction={editing}
          categories={settings.categories}
          recurringExpenses={settings.recurringExpenses}
          onClose={cancelEdit}
          onSave={(tx) => {
            updateTransaction({ ...tx, month: getMonthFromDate(tx.date) });
            setEditing(null);
          }}
        />
      )}
      {importPreview && (
        <SparkasseImportModal
          result={importPreview}
          onClose={() => setImportPreview(null)}
          onConfirm={applyImport}
          isImporting={isApplyingImport}
          onAiContext={useAiForContext}
          aiLoading={isAiContextualizing}
          aiError={aiError ?? undefined}
          recurringExpenses={settings.recurringExpenses}
          previewRecurring={previewRecurring}
          onSetRecurring={handleSetPreviewRecurring}
        />
      )}
    </div>
  );
}
