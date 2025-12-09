"use client";

import { createPortal } from "react-dom";
import { format } from "date-fns";
import { SparkasseParseResult } from "../lib/sparkasseParser";

interface SparkasseImportModalProps {
  result: SparkasseParseResult;
  onClose: () => void;
  onConfirm: () => void;
  isImporting?: boolean;
  onAiContext?: () => void;
  aiLoading?: boolean;
  aiError?: string;
  recurringExpenses?: { id: string; name: string }[];
  previewRecurring?: Record<string, string>;
  onSetRecurring?: (key: string, recurringId: string) => void;
}

export const SparkasseImportModal = ({
  result,
  onClose,
  onConfirm,
  isImporting = false,
  onAiContext,
  aiLoading = false,
  aiError,
  recurringExpenses = [],
  previewRecurring = {},
  onSetRecurring,
}: SparkasseImportModalProps) => {
  if (typeof document === "undefined") return null;

  return createPortal(
    (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
        <div className="w-full max-w-2xl space-y-4 rounded-2xl bg-white/90 backdrop-blur shadow-2xl p-4 animate-slideIn">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold">Sparkasse import preview</h3>
              <p className="text-sm text-slate-500">
                {result.statementMonth ? `Statement month ${result.statementMonth}` : "Statement month not detected"}
                {" · "}
                {result.transactions.length} entries
              </p>
              {result.sourceName && (
                <p className="text-xs text-slate-500 truncate">
                  File: {result.sourceName}
                </p>
              )}
            </div>
            <button className="text-sm text-slate-500" onClick={onClose}>Close</button>
          </div>

          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {result.transactions.length === 0 && (
              <p className="text-sm text-slate-500">No transactions detected.</p>
            )}
            {result.transactions.map((tx, index) => {
              const key = `${tx.date}-${index}-${tx.label}`;
              const currentRecurring = previewRecurring[key] ?? "";
              return (
              <div
                key={`${tx.date}-${index}-${tx.label}`}
                className="flex items-start justify-between gap-3 rounded-xl border bg-white/80 px-3 py-2 shadow-sm"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">{tx.label}</div>
                  <div className="text-xs text-slate-500">
                    {format(new Date(`${tx.date}T00:00:00`), "dd MMM yyyy")} · {tx.type}
                  </div>
                  {tx.details && (
                    <p className="mt-1 text-xs text-slate-600 leading-snug">
                      {tx.details}
                    </p>
                  )}
                  {onSetRecurring && recurringExpenses.length > 0 && (
                    <div className="mt-2">
                      <label className="text-xs text-slate-600">
                        Link to recurring
                        <select
                          className="mt-1 w-full rounded-lg border px-2 py-1 text-xs"
                          value={currentRecurring}
                          onChange={(e) => onSetRecurring(key, e.target.value)}
                        >
                          <option value="">None</option>
                          {recurringExpenses.map((exp) => (
                            <option key={exp.id} value={exp.id}>
                              {exp.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                </div>
                <div
                  className={`shrink-0 text-sm font-semibold ${
                    tx.type === "income" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {tx.amount.toFixed(2)}
                </div>
              </div>
            );})}
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 gap-2 w-full sm:w-auto sm:justify-end">
              {aiError && <p className="text-sm text-rose-600">{aiError}</p>}
              <div className="flex gap-2 sm:ml-auto">
                <button className="rounded-full border px-4 py-2 text-sm" onClick={onClose}>
                  Cancel
                </button>
                {onAiContext && (
                  <button
                    className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm disabled:opacity-60"
                    onClick={onAiContext}
                    disabled={aiLoading || isImporting || result.transactions.length === 0}
                  >
                    {aiLoading ? "Contextualizing…" : "Use AI for context"}
                  </button>
                )}
                <button
                  className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
                  onClick={onConfirm}
                  disabled={isImporting || result.transactions.length === 0 || aiLoading}
                >
                  {isImporting ? "Importing..." : "Add to transactions"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    document.body
  );
};
