"use client";

import { format } from "date-fns";
import { useState } from "react";
import { useFinanceData, getMonthFromDate } from "../lib/useFinanceData";

const today = () => format(new Date(), "yyyy-MM-dd");

export const TransactionForm = () => {
  const { addTransaction, settings } = useFinanceData();
  const [form, setForm] = useState({
    date: today(),
    type: "expense" as "income" | "expense",
    amount: "",
    category: "General",
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.amount) return;
    setSubmitting(true);
    addTransaction({
      date: form.date,
      month: getMonthFromDate(form.date),
      type: form.type,
      amount: Number(form.amount),
      category: form.category,
      note: form.note,
    });
    setForm((prev) => ({ ...prev, amount: "", note: "" }));
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-base font-semibold text-slate-900">Quick transaction</div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-slate-600">
          Date
          <input
            type="date"
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </label>
        <label className="text-sm text-slate-600">
          Type
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as "income" | "expense" })}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>
      </div>
      <label className="text-sm text-slate-600">
        Amount ({settings.currency})
        <input
          type="number"
          step="0.01"
          className="mt-1 w-full rounded-xl border px-3 py-2"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />
      </label>
      <label className="text-sm text-slate-600">
        Category
        <input
          type="text"
          className="mt-1 w-full rounded-xl border px-3 py-2"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
      </label>
      <label className="text-sm text-slate-600">
        Note
        <textarea
          className="mt-1 w-full rounded-xl border px-3 py-2"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          rows={2}
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-blue-600 px-4 py-2 text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow disabled:opacity-70"
      >
        Add
      </button>
    </form>
  );
};
