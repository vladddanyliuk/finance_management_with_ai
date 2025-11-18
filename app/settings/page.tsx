"use client";

import { startTransition, useEffect, useState } from "react";
import { useFinanceData } from "../../lib/useFinanceData";
import { OneTimePlannedExpense, RecurringExpense } from "../../lib/types";

export default function SettingsPage() {
  const {
    settings,
    setSettings,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    addOneTimeExpense,
    updateOneTimeExpense,
    deleteOneTimeExpense,
  } = useFinanceData();

  const [general, setGeneral] = useState({
    currency: settings.currency,
    defaultMonthlyIncome: settings.defaultMonthlyIncome,
    autoBackupEnabled: settings.autoBackupEnabled,
    autoBackupMaxEntries: settings.autoBackupMaxEntries,
    openAiApiKey: settings.openAiApiKey ?? "",
  });

  const [newRecurring, setNewRecurring] = useState({
    name: "",
    amount: "",
    isMandatory: true,
    startMonth: "",
    endMonth: "",
  });

  const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null);

  const [newOneTime, setNewOneTime] = useState({
    name: "",
    month: settings.lastSelectedMonth,
    amount: "",
  });
  const [editingOneTime, setEditingOneTime] = useState<OneTimePlannedExpense | null>(null);

  useEffect(() => {
    startTransition(() => {
      setGeneral({
        currency: settings.currency,
        defaultMonthlyIncome: settings.defaultMonthlyIncome,
        autoBackupEnabled: settings.autoBackupEnabled,
        autoBackupMaxEntries: settings.autoBackupMaxEntries,
        openAiApiKey: settings.openAiApiKey ?? "",
      });
    });
  }, [settings]);

  const saveGeneral = (event: React.FormEvent) => {
    event.preventDefault();
    setSettings({
      currency: general.currency,
      defaultMonthlyIncome: Number(general.defaultMonthlyIncome),
      autoBackupEnabled: general.autoBackupEnabled,
      autoBackupMaxEntries: Math.max(1, Number(general.autoBackupMaxEntries) || 1),
      openAiApiKey: general.openAiApiKey,
    });
  };

  const handleAddRecurring = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newRecurring.name || !newRecurring.amount) return;
    addRecurringExpense({
      name: newRecurring.name,
      amount: Number(newRecurring.amount),
      isMandatory: newRecurring.isMandatory,
      startMonth: newRecurring.startMonth || undefined,
      endMonth: newRecurring.endMonth || undefined,
    });
    setNewRecurring({ name: "", amount: "", isMandatory: true, startMonth: "", endMonth: "" });
  };

  const handleAddOneTime = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newOneTime.name || !newOneTime.amount) return;
    addOneTimeExpense({
      name: newOneTime.name,
      amount: Number(newOneTime.amount),
      month: newOneTime.month,
    });
    setNewOneTime({ ...newOneTime, name: "", amount: "" });
  };

  return (
    <div className="space-y-6 pb-12">
      <form onSubmit={saveGeneral} className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">General</h2>
        <label className="block text-sm text-slate-600">
          Currency
          <input
            value={general.currency}
            onChange={(e) => setGeneral({ ...general, currency: e.target.value })}
            className="mt-1 w-full rounded-xl border px-3 py-2"
          />
        </label>
        <label className="block text-sm text-slate-600">
          Default monthly income
          <input
            type="number"
            value={general.defaultMonthlyIncome}
            onChange={(e) => setGeneral({ ...general, defaultMonthlyIncome: Number(e.target.value) })}
            className="mt-1 w-full rounded-xl border px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={general.autoBackupEnabled}
            onChange={(e) => setGeneral({ ...general, autoBackupEnabled: e.target.checked })}
          />
          Enable auto-backups
        </label>
        <label className="block text-sm text-slate-600">
          Max auto-backups
          <input
            type="number"
            value={general.autoBackupMaxEntries}
            onChange={(e) => setGeneral({ ...general, autoBackupMaxEntries: Number(e.target.value) })}
            className="mt-1 w-full rounded-xl border px-3 py-2"
          />
        </label>
        <label className="block text-sm text-slate-600">
          OpenAI API key (stored only on this device)
          <input
            type="password"
            value={general.openAiApiKey}
            onChange={(e) => setGeneral({ ...general, openAiApiKey: e.target.value })}
            className="mt-1 w-full rounded-xl border px-3 py-2"
          />
        </label>
        <button className="rounded-full bg-blue-600 px-4 py-2 text-white" type="submit">
          Save settings
        </button>
      </form>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Recurring expenses</h2>
        <form onSubmit={handleAddRecurring} className="mt-3 grid gap-3 md:grid-cols-4">
          <input
            placeholder="Name"
            value={newRecurring.name}
            onChange={(e) => setNewRecurring({ ...newRecurring, name: e.target.value })}
            className="rounded-xl border px-3 py-2"
          />
          <input
            placeholder="Amount"
            type="number"
            value={newRecurring.amount}
            onChange={(e) => setNewRecurring({ ...newRecurring, amount: e.target.value })}
            className="rounded-xl border px-3 py-2"
          />
          <input
            type="month"
            placeholder="Start (YYYY-MM)"
            value={newRecurring.startMonth}
            onChange={(e) => setNewRecurring({ ...newRecurring, startMonth: e.target.value })}
            className="rounded-xl border px-3 py-2"
          />
          <input
            type="month"
            placeholder="End (YYYY-MM)"
            value={newRecurring.endMonth}
            onChange={(e) => setNewRecurring({ ...newRecurring, endMonth: e.target.value })}
            className="rounded-xl border px-3 py-2"
          />
          <select
            className="rounded-xl border px-3 py-2"
            value={newRecurring.isMandatory ? "mandatory" : "optional"}
            onChange={(e) => setNewRecurring({ ...newRecurring, isMandatory: e.target.value === "mandatory" })}
          >
            <option value="mandatory">Mandatory</option>
            <option value="optional">Optional</option>
          </select>
          <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-white md:col-span-2">
            Add
          </button>
        </form>
        <ul className="mt-4 space-y-2">
          {settings.recurringExpenses.map((expense) => (
            <li key={expense.id} className="rounded-xl border px-3 py-2">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-semibold">{expense.name}</div>
                  <div className="text-slate-500">
                    {expense.amount.toFixed(2)} {settings.currency} · {expense.isMandatory ? "Mandatory" : "Optional"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {expense.startMonth ? `Start: ${expense.startMonth}` : "No start limit"} · {expense.endMonth ? `End: ${expense.endMonth}` : "No end limit"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-blue-600" onClick={() => setEditingRecurring(expense)}>
                    Edit
                  </button>
                  <button className="text-rose-500" onClick={() => deleteRecurringExpense(expense.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {editingRecurring && (
          <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-3">
            <h3 className="text-sm font-semibold">Edit recurring expense</h3>
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={editingRecurring.name}
              onChange={(e) => setEditingRecurring({ ...editingRecurring, name: e.target.value })}
            />
            <input
              className="w-full rounded-xl border px-3 py-2"
              type="number"
              value={editingRecurring.amount}
              onChange={(e) => setEditingRecurring({ ...editingRecurring, amount: Number(e.target.value) })}
            />
            <select
              className="w-full rounded-xl border px-3 py-2"
              value={editingRecurring.isMandatory ? "mandatory" : "optional"}
              onChange={(e) =>
                setEditingRecurring({ ...editingRecurring, isMandatory: e.target.value === "mandatory" })
              }
            >
              <option value="mandatory">Mandatory</option>
              <option value="optional">Optional</option>
            </select>
            <input
              className="w-full rounded-xl border px-3 py-2"
              type="month"
              value={editingRecurring.startMonth ?? ""}
              onChange={(e) => setEditingRecurring({ ...editingRecurring, startMonth: e.target.value || undefined })}
              placeholder="Start month (YYYY-MM)"
            />
            <input
              className="w-full rounded-xl border px-3 py-2"
              type="month"
              value={editingRecurring.endMonth ?? ""}
              onChange={(e) => setEditingRecurring({ ...editingRecurring, endMonth: e.target.value || undefined })}
              placeholder="End month (YYYY-MM)"
            />
            <div className="flex gap-2">
              <button
                className="rounded-full bg-blue-600 px-4 py-2 text-white"
                onClick={() => {
                  if (editingRecurring) {
                    updateRecurringExpense(editingRecurring);
                    setEditingRecurring(null);
                  }
                }}
              >
                Save
              </button>
              <button className="rounded-full border px-4 py-2" onClick={() => setEditingRecurring(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">One-time planned expenses</h2>
        <form onSubmit={handleAddOneTime} className="mt-3 grid gap-3 md:grid-cols-4">
          <input
            placeholder="Name"
            value={newOneTime.name}
            onChange={(e) => setNewOneTime({ ...newOneTime, name: e.target.value })}
            className="rounded-xl border px-3 py-2"
          />
          <input
            placeholder="Month"
            value={newOneTime.month}
            onChange={(e) => setNewOneTime({ ...newOneTime, month: e.target.value })}
            className="rounded-xl border px-3 py-2"
          />
          <input
            placeholder="Amount"
            type="number"
            value={newOneTime.amount}
            onChange={(e) => setNewOneTime({ ...newOneTime, amount: e.target.value })}
            className="rounded-xl border px-3 py-2"
          />
          <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-white">
            Add
          </button>
        </form>
        <ul className="mt-4 space-y-2">
          {settings.oneTimeExpenses.map((expense) => (
            <li key={expense.id} className="rounded-xl border px-3 py-2">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-semibold">{expense.name}</div>
                  <div className="text-slate-500">
                    {expense.month} · {expense.amount.toFixed(2)} {settings.currency}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-blue-600" onClick={() => setEditingOneTime(expense)}>
                    Edit
                  </button>
                  <button className="text-rose-500" onClick={() => deleteOneTimeExpense(expense.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {editingOneTime && (
          <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-3">
            <h3 className="text-sm font-semibold">Edit planned expense</h3>
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={editingOneTime.name}
              onChange={(e) => setEditingOneTime({ ...editingOneTime, name: e.target.value })}
            />
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={editingOneTime.month}
              onChange={(e) => setEditingOneTime({ ...editingOneTime, month: e.target.value })}
            />
            <input
              className="w-full rounded-xl border px-3 py-2"
              type="number"
              value={editingOneTime.amount}
              onChange={(e) => setEditingOneTime({ ...editingOneTime, amount: Number(e.target.value) })}
            />
            <div className="flex gap-2">
              <button
                className="rounded-full bg-blue-600 px-4 py-2 text-white"
                onClick={() => {
                  if (editingOneTime) {
                    updateOneTimeExpense(editingOneTime);
                    setEditingOneTime(null);
                  }
                }}
              >
                Save
              </button>
              <button className="rounded-full border px-4 py-2" onClick={() => setEditingOneTime(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
