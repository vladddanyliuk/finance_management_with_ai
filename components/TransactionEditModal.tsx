"use client";

import { useEffect, useState } from "react";
import { Transaction } from "../lib/types";

interface TransactionEditModalProps {
  transaction: Transaction;
  categories: { id: string; name: string; icon?: string }[];
  onSave: (tx: Transaction) => void;
  onClose: () => void;
}

export const TransactionEditModal = ({ transaction, categories, onSave, onClose }: TransactionEditModalProps) => {
  const [draft, setDraft] = useState<Transaction>(transaction);

  useEffect(() => {
    setDraft(transaction);
  }, [transaction]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md space-y-3 rounded-2xl bg-white p-4 shadow-xl animate-fade">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit transaction</h3>
          <button className="text-sm text-slate-500" onClick={onClose}>Close</button>
        </div>
        <label className="text-sm text-slate-600">
          Date
          <input
            type="date"
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
          />
        </label>
        <label className="text-sm text-slate-600">
          Type
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={draft.type}
            onChange={(e) => setDraft({ ...draft, type: e.target.value as Transaction["type"] })}
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
            value={draft.amount}
            onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })}
          />
        </label>
        <label className="text-sm text-slate-600">
          Category
          {categories.length > 0 ? (
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            />
          )}
        </label>
        <label className="text-sm text-slate-600">
          Note
          <textarea
            className="mt-1 w-full rounded-xl border px-3 py-2"
            rows={2}
            value={draft.note ?? ""}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
          />
        </label>
        <div className="flex justify-end gap-2">
          <button className="rounded-full border px-4 py-2 text-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className="rounded-full bg-blue-600 px-4 py-2 text-sm text-white"
            onClick={() => onSave(draft)}
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
};
