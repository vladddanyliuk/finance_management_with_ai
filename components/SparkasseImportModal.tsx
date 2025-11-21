"use client";

import { createPortal } from "react-dom";
import { format } from "date-fns";
import { SparkasseParseResult } from "../lib/sparkasseParser";

interface SparkasseImportModalProps {
  result: SparkasseParseResult;
  onClose: () => void;
  onConfirm: () => void;
  isImporting?: boolean;
}

export const SparkasseImportModal = ({
  result,
  onClose,
  onConfirm,
  isImporting = false,
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
            {result.transactions.map((tx, index) => (
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
            ))}
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <button className="rounded-full border px-4 py-2 text-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
              onClick={onConfirm}
              disabled={isImporting || result.transactions.length === 0}
            >
              {isImporting ? "Importing..." : "Add to transactions"}
            </button>
          </div>
        </div>
      </div>
    ),
    document.body
  );
};
