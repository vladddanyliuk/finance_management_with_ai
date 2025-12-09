"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Transaction } from "../lib/types";

interface TransactionEditModalProps {
  transaction: Transaction;
  categories: { id: string; name: string; icon?: string }[];
  recurringExpenses?: { id: string; name: string }[];
  onSave: (tx: Transaction) => void;
  onClose: () => void;
}

export const TransactionEditModal = ({
  transaction,
  categories,
  recurringExpenses = [],
  onSave,
  onClose,
}: TransactionEditModalProps) => {
  const [draft, setDraft] = useState<Transaction>(transaction);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDraft(transaction);
  }, [transaction]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
        <div className="w-full max-w-md space-y-3 rounded-2xl bg-white/80 backdrop-blur shadow-lg p-4 animate-slideIn">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Edit transaction</h3>
            <button className="text-sm text-slate-500" onClick={onClose}>Close</button>
          </div>
          <label className="text-sm text-slate-600">
            Date
            <input
              type="date"
              className="mt-1 w-full rounded-xl border px-3 py-2"
              style={{ width: "-webkit-fill-available", height: "-webkit-fit-content" }}
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            />
          </label>
          <label className="text-sm text-slate-600">
            Type
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={draft.type}
              onChange={(e) => {
                const nextType = e.target.value as Transaction["type"];
                setDraft({
                  ...draft,
                  type: nextType,
                  recurringExpenseId: nextType === "expense" ? draft.recurringExpenseId : undefined,
                });
              }}
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
          {draft.type === "expense" && recurringExpenses.length > 0 && (
            <label className="text-sm text-slate-600">
              Mark as payment for recurring expense
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={draft.recurringExpenseId ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, recurringExpenseId: e.target.value || undefined })
                }
              >
                <option value="">None</option>
                {recurringExpenses.map((exp) => (
                  <option key={exp.id} value={exp.id}>
                    {exp.name}
                  </option>
                ))}
              </select>
            </label>
          )}
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
    ),
    document.body
  );
};
