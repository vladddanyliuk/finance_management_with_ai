"use client";

import { format } from "date-fns";
import { useFinanceData } from "../lib/useFinanceData";
import { Transaction } from "../lib/types";

interface TransactionListProps {
  transactions: Transaction[];
  showActions?: boolean;
  onSelect?: (transaction: Transaction) => void;
}

export const TransactionList = ({ transactions, showActions = false, onSelect }: TransactionListProps) => {
  const { deleteTransaction } = useFinanceData();
  if (transactions.length === 0) {
    return <p className="text-sm text-slate-500">No transactions yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {transactions.map((tx) => (
        <li
          key={tx.id}
          className="rounded-2xl bg-white/80 backdrop-blur p-4 shadow-lg animate-fade"
          onClick={() => onSelect?.(tx)}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">{tx.category}</div>
              <div className="text-xs text-slate-500">
                {format(new Date(tx.date), "dd MMM yyyy")} · {tx.type}
              </div>
            </div>
            <div className={tx.type === "income" ? "text-green-600" : "text-rose-600"}>
              {tx.type === "income" ? "+" : "-"}
              {tx.amount.toFixed(2)}
            </div>
          </div>
          {tx.note && <p className="mt-2 text-sm text-slate-600">{tx.note}</p>}
          {showActions && (
            <div className="mt-3 flex gap-4 text-sm">
              <button
                className="text-blue-600"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect?.(tx);
                }}
              >
                Edit
              </button>
              <button
                className="text-rose-500"
                onClick={(event) => {
                  event.stopPropagation();
                  deleteTransaction(tx.id);
                }}
              >
                Delete
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};
