"use client";

import clsx from "clsx";

interface CardProps {
  title: string;
  value?: string | number;
  children?: React.ReactNode;
  accent?: "positive" | "negative" | "neutral";
}

const accentClasses: Record<NonNullable<CardProps["accent"]>, string> = {
  positive: "border-green-500",
  negative: "border-rose-500",
  neutral: "border-slate-200",
};

export const Card = ({ title, value, children, accent = "neutral" }: CardProps) => {
  return (
    <div
      className={clsx(
        "rounded-2xl border bg-white p-4 shadow-sm",
        accentClasses[accent]
      )}
    >
      <div className="text-sm font-medium text-slate-500">{title}</div>
      {value !== undefined && (
        <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      )}
      {children && <div className="mt-3 text-sm text-slate-600">{children}</div>}
    </div>
  );
};
