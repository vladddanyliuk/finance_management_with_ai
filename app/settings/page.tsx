"use client";

import { startTransition, useEffect, useState } from "react";
import { useFinanceData } from "../../lib/useFinanceData";
import { RecurringExpense } from "../../lib/types";

export default function SettingsPage() {
  const {
    settings,
    setSettings,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
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

  const [newBehavior, setNewBehavior] = useState({ description: "", amount: "" });
  const [newCategory, setNewCategory] = useState({ name: "", icon: "" });

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

  const handleAddBehavior = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newBehavior.description || !newBehavior.amount) return;
    setSettings({
      aiBehaviors: [
        ...settings.aiBehaviors,
        {
          id: crypto.randomUUID(),
          description: newBehavior.description,
          monthlyAmount: Number(newBehavior.amount),
        },
      ],
    });
    setNewBehavior({ description: "", amount: "" });
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

      <section className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">AI context</h2>
        <p className="text-sm text-slate-600">
          Tell the AI what you like to spend on (e.g., smoking, donating, hobbies) and expected monthly amounts.
        </p>
        <form onSubmit={handleAddBehavior} className="mt-3 grid gap-3 md:grid-cols-4">
          <input
            placeholder="Behavior or priority"
            value={newBehavior.description}
            onChange={(e) => setNewBehavior({ ...newBehavior, description: e.target.value })}
            className="rounded-xl border px-3 py-2"
          />
          <input
            placeholder="Expected monthly amount"
            type="number"
            value={newBehavior.amount}
            onChange={(e) => setNewBehavior({ ...newBehavior, amount: e.target.value })}
            className="rounded-xl border px-3 py-2"
          />
          <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-white">
            Add
          </button>
        </form>
        <ul className="mt-4 space-y-2">
          {settings.aiBehaviors.map((entry) => (
            <li key={entry.id} className="rounded-xl border px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{entry.description}</div>
                  <div className="text-slate-500">
                    {entry.monthlyAmount.toFixed(2)} {settings.currency} expected monthly
                  </div>
                </div>
                <button
                  className="text-rose-500"
                  onClick={() =>
                    setSettings({
                      aiBehaviors: settings.aiBehaviors.filter((item) => item.id !== entry.id),
                    })
                  }
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
          {settings.aiBehaviors.length === 0 && (
            <li className="text-sm text-slate-500">No behaviors added yet.</li>
          )}
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Categories</h2>
        <p className="text-sm text-slate-600">Create categories with an optional icon/emoji and use them when adding transactions.</p>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!newCategory.name) return;
          setSettings({
            categories: [
              ...settings.categories,
              { id: crypto.randomUUID(), name: newCategory.name, icon: newCategory.icon || undefined },
            ],
          });
          setNewCategory({ name: "", icon: "" });
        }} className="mt-3 grid gap-3 md:grid-cols-4">
          <input
            placeholder="Name"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            className="rounded-xl border px-3 py-2"
          />
          <input
            placeholder="Icon (emoji)"
            value={newCategory.icon}
            onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
            className="rounded-xl border px-3 py-2"
          />
          <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-white">
            Add
          </button>
        </form>
        <ul className="mt-4 space-y-2">
          {settings.categories.map((category) => (
            <li key={category.id} className="rounded-xl border px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {category.icon && <span>{category.icon}</span>}
                  <span className="font-semibold">{category.name}</span>
                </div>
                <button
                  className="text-rose-500"
                  onClick={() =>
                    setSettings({
                      categories: settings.categories.filter((item) => item.id !== category.id),
                    })
                  }
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
          {settings.categories.length === 0 && <li className="text-sm text-slate-500">No categories yet.</li>}
        </ul>
      </section>

    </div>
  );
}
