"use client";

import { AdjustmentsHorizontalIcon, WalletIcon, TagIcon } from "@heroicons/react/24/outline";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useFinanceData, getMonthFromDate } from "../../lib/useFinanceData";
import { TransactionList } from "../../components/TransactionList";
import { TransactionEditModal } from "../../components/TransactionEditModal";
import { Transaction } from "../../lib/types";

export default function TransactionsPage() {
  const { transactions, settings, updateTransaction } = useFinanceData();
  const months = Array.from(new Set(transactions.map((tx) => tx.month))).sort().reverse();
  const latestMonth = months[0] ?? "";
  const [filters, setFilters] = useState({
    month: months[0] ?? "",
    type: "all",
    category: "",
  });
  const [editing, setEditing] = useState<Transaction | null>(null);

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
  const saveEdit = () => {
    if (!editing) return;
    updateTransaction(editing);
    setEditing(null);
  };

  useEffect(() => {
    startTransition(() => {
      setFilters((prev) => ({ ...prev, month: latestMonth }));
    });
  }, [latestMonth]);

  return (
    <div className="space-y-6 pb-12 animate-slideIn">
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
            <input
              type="text"
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            />
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
    </div>
  );
}
