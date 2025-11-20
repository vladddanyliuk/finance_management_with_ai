"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useFinanceData, getMonthFromDate } from "../lib/useFinanceData";
import { generateId } from "../lib/id";
import { AI_AUTO_CATEGORY } from "../lib/constants";
const firstDayOf = (month: string) => `${month}-01`;
const nextMonthFirstDay = () => {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return format(next, "yyyy-MM-dd");
};

interface TransactionFormProps {
  targetMonth?: string;
  title?: string;
}

export const TransactionForm = ({ targetMonth, title = "Quick transaction" }: TransactionFormProps) => {
  const { addTransaction, settings, setSettings } = useFinanceData();
  const hasCategories = settings.categories.length > 0;
  const allowNewCategories = settings.aiAllowNewCategories ?? true;
  const autoCategory = useMemo(
    () =>
      settings.categories.find(
        (cat) => cat.name.toLowerCase() === AI_AUTO_CATEGORY.name.toLowerCase()
      ),
    [settings.categories]
  );
  const defaultDate = useMemo(
    () => (targetMonth ? firstDayOf(targetMonth) : nextMonthFirstDay()),
    [targetMonth]
  );
  const defaultCategory = useMemo(() => {
    if (autoCategory) return autoCategory.name;
    if (hasCategories) return settings.categories[0]?.name ?? "General";
    return "General";
  }, [autoCategory, hasCategories, settings.categories]);
  const [form, setForm] = useState({
    date: defaultDate,
    type: "expense" as "income" | "expense",
    amount: "",
    category: defaultCategory,
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [aiCategoryError, setAiCategoryError] = useState<string | null>(null);
  const aiSelected = Boolean(
    autoCategory && form.category.toLowerCase() === autoCategory.name.toLowerCase()
  );

  useEffect(() => {
    if (hasCategories && settings.categories.length > 0) {
      setForm((prev) => ({ ...prev, category: defaultCategory }));
    }
  }, [hasCategories, settings.categories, defaultCategory]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, date: defaultDate }));
  }, [defaultDate]);

  const pickExisting = (name: string) =>
    settings.categories.find((cat) => cat.name.toLowerCase() === name.trim().toLowerCase());

  const ensureCategoryExists = (name: string, icon?: string) => {
    const trimmedName = name.trim();
    const existing = pickExisting(trimmedName);
    if (existing) return existing.name;
    if (!allowNewCategories) {
      return settings.categories[0]?.name || trimmedName;
    }
    const nextCategories = [
      ...settings.categories,
      { id: generateId(), name: trimmedName, icon: icon?.trim() || undefined },
    ];
    setSettings({ categories: nextCategories });
    return trimmedName;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.amount) return;
    setSubmitting(true);
    setAiCategoryError(null);
    const monthForTx = targetMonth ?? getMonthFromDate(form.date);
    let chosenCategory = form.category;

    const shouldUseAi =
      Boolean(settings.openAiApiKey) &&
      Boolean(autoCategory) &&
      chosenCategory.toLowerCase() === autoCategory?.name.toLowerCase() &&
      typeof navigator !== "undefined" &&
      navigator.onLine;

    if (shouldUseAi) {
      try {
        const response = await fetch("/api/auto-categorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Number(form.amount),
            type: form.type,
            note: form.note,
            availableCategories: settings.categories,
            userCategory: form.category,
            apiKey: settings.openAiApiKey,
            allowNewCategories,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.categoryName) {
            if (data.isNew && !allowNewCategories) {
              const existing = pickExisting(data.categoryName) ?? pickExisting(form.category);
              chosenCategory = existing?.name ?? form.category;
            } else {
              chosenCategory = ensureCategoryExists(data.categoryName, data.icon);
            }
          }
        } else {
          const err = await response.json().catch(() => ({}));
          setAiCategoryError(err?.error || "Could not auto-categorize");
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unexpected error";
        setAiCategoryError(message);
      }
    }

    addTransaction({
      date: form.date,
      month: monthForTx,
      type: form.type,
      amount: Number(form.amount),
      category: chosenCategory,
      note: form.note,
    });
    setForm((prev) => ({ ...prev, amount: "", note: "", category: chosenCategory }));
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl bg-white/80 backdrop-blur p-4 shadow-lg animate-slideIn">
      <div className="text-base font-semibold text-slate-900">{title}</div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-slate-600">
          Date
          <input
            type="date"
            className="mt-1 w-full rounded-xl border px-3 py-2"
            style={{ width: "-webkit-fill-available", height: "-webkit-fit-content" }}
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
        {hasCategories ? (
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={form.category}
            onChange={(e) => {
              setAiCategoryError(null);
              setForm({ ...form, category: e.target.value });
            }}
          >
            {settings.categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.icon ? `${cat.icon} ` : ""}{cat.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        )}
      </label>
      <label className="text-sm text-slate-600">
        Note
        <textarea
          className={`mt-1 w-full rounded-xl border px-3 py-2 transition-all duration-700 ${
            aiSelected
              ? "bg-gradient-to-r from-indigo-50 via-emerald-50 to-pink-50 shadow-lg ring-2 ring-emerald-200"
              : "bg-white"
          }`}
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
      {aiCategoryError && (
        <p className="text-sm text-rose-600">{aiCategoryError}</p>
      )}
    </form>
  );
};
