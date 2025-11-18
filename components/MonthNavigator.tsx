"use client";

import { addMonths, format, parseISO } from "date-fns";
import { useMemo, useState } from "react";

interface MonthNavigatorProps {
  month: string;
  onChange: (month: string) => void;
  availableMonths?: string[];
  onAddMonth?: (month: string) => void;
}

export const MonthNavigator = ({
  month,
  onChange,
  availableMonths = [],
  onAddMonth,
}: MonthNavigatorProps) => {
  const current = parseISO(`${month}-01`);
  const [newMonth, setNewMonth] = useState("");

  const monthOptions = useMemo(() => {
    const unique = new Set<string>([month, ...availableMonths]);
    return Array.from(unique).sort();
  }, [availableMonths, month]);

  const change = (diff: number) => {
    const next = addMonths(current, diff);
    onChange(format(next, "yyyy-MM"));
  };

  const addMonth = () => {
    if (!newMonth) return;
    onAddMonth?.(newMonth);
    onChange(newMonth);
    setNewMonth("");
  };

  return (
    <div className="space-y-3 rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm animate-slideIn">
      <div className="flex items-center justify-between gap-3">
        <button
          className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow active:translate-y-0.5"
          onClick={() => change(-1)}
          aria-label="Previous month"
        >
          ←
        </button>
        <div className="text-base font-semibold text-slate-900">
          {format(current, "MMMM yyyy")}
        </div>
        <button
          className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow active:translate-y-0.5"
          onClick={() => change(1)}
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {monthOptions.map((item) => (
          <button
            key={item}
            onClick={() => onChange(item)}
            className={`rounded-xl border px-3 py-2 text-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow ${
              item === month ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-800"
            }`}
            aria-label={`Switch to ${item}`}
          >
            {format(parseISO(`${item}-01`), "MMM yyyy")}
          </button>
        ))}
      </div>

      {onAddMonth && (
        <div className="flex flex-wrap gap-2">
          <input
            type="month"
            value={newMonth}
            onChange={(e) => setNewMonth(e.target.value)}
            className="w-44 rounded-xl border px-3 py-2 text-sm"
            aria-label="Create a month"
          />
          <button
            onClick={addMonth}
            disabled={!newMonth}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow disabled:opacity-60"
          >
            Add month
          </button>
        </div>
      )}
    </div>
  );
};
