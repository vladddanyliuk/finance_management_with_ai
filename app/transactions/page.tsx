"use client";

import { AdjustmentsHorizontalIcon, ArrowUpTrayIcon, WalletIcon } from "@heroicons/react/24/outline";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useFinanceData, getMonthFromDate } from "../../lib/useFinanceData";
import { TransactionList } from "../../components/TransactionList";
import { TransactionEditModal } from "../../components/TransactionEditModal";
import { Transaction } from "../../lib/types";
import { parseSparkassePdf, SparkasseParseResult } from "../../lib/sparkasseParser";
import { SparkasseImportModal } from "../../components/SparkasseImportModal";

export default function TransactionsPage() {
  const { transactions, settings, updateTransaction, addTransaction } = useFinanceData();
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
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isApplyingImport, setIsApplyingImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      importPreview.transactions.forEach((tx) => {
        addTransaction({
          amount: tx.amount,
          category: tx.label,
          date: tx.date,
          month: getMonthFromDate(tx.date),
          note: tx.details,
          type: tx.type,
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
        />
      )}
    </div>
  );
}
