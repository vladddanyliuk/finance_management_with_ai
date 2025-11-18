"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useFinanceData } from "../../lib/useFinanceData";
import { TransactionList } from "../../components/TransactionList";
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
    <div className="space-y-6 pb-12">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Filters</h2>
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
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Transactions</h2>
        </div>
        <TransactionList transactions={filtered} showActions onSelect={startEdit} />
        {filtered.length > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            Tap a transaction to edit.
          </p>
        )}
      </div>
      {editing && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold">Edit transaction</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-sm text-slate-600">
              Date
              <input
                type="date"
                value={editing.date}
                className="mt-1 w-full rounded-xl border px-3 py-2"
                onChange={(e) => setEditing({ ...editing, date: e.target.value })}
              />
            </label>
            <label className="text-sm text-slate-600">
              Type
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={editing.type}
                onChange={(e) => setEditing({ ...editing, type: e.target.value as "income" | "expense" })}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </label>
          </div>
          <label className="mt-3 block text-sm text-slate-600">
            Amount ({settings.currency})
            <input
              type="number"
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={editing.amount}
              onChange={(e) => setEditing({ ...editing, amount: Number(e.target.value) })}
            />
          </label>
          <label className="mt-3 block text-sm text-slate-600">
            Category
            <input
              type="text"
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={editing.category}
              onChange={(e) => setEditing({ ...editing, category: e.target.value })}
            />
          </label>
          <label className="mt-3 block text-sm text-slate-600">
            Note
            <textarea
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={editing.note}
              onChange={(e) => setEditing({ ...editing, note: e.target.value })}
            />
          </label>
          <div className="mt-3 flex gap-2">
            <button className="rounded-full bg-blue-600 px-4 py-2 text-white" onClick={saveEdit}>
              Save
            </button>
            <button className="rounded-full border px-4 py-2" onClick={cancelEdit}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
