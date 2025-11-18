"use client";

import { addMonths, format, parseISO } from "date-fns";

interface MonthNavigatorProps {
  month: string;
  onChange: (month: string) => void;
}

export const MonthNavigator = ({ month, onChange }: MonthNavigatorProps) => {
  const current = parseISO(`${month}-01`);

  const change = (diff: number) => {
    const next = addMonths(current, diff);
    onChange(format(next, "yyyy-MM"));
  };

  return (
    <div className="flex items-center justify-between rounded-2xl border bg-white px-4 py-2 text-sm shadow-sm">
      <button
        className="rounded-full bg-slate-100 px-3 py-1 text-slate-700"
        onClick={() => change(-1)}
        aria-label="Previous month"
      >
        ←
      </button>
      <div className="text-base font-semibold text-slate-900">
        {format(current, "MMMM yyyy")}
      </div>
      <button
        className="rounded-full bg-slate-100 px-3 py-1 text-slate-700"
        onClick={() => change(1)}
        aria-label="Next month"
      >
        →
      </button>
    </div>
  );
};
