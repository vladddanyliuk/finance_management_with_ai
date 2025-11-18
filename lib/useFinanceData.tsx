"use client";

import { createContext, startTransition, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { defaultState } from "./constants";
import { applyAutoBackupLimit, createAutoBackup, loadState, persistState } from "./storage";
import {
  FinanceDataState,
  RecurringExpense,
  Transaction,
  UserSettings,
} from "./types";

interface FinanceDataContextValue extends FinanceDataState {
  hydrated: boolean;
  setSettings: (settings: Partial<UserSettings>) => void;
  addCustomMonth: (month: string) => void;
  deleteCustomMonth: (month: string) => void;
  setMonthPlan: (month: string, plan: string) => void;
  addRecurringExpense: (expense: Omit<RecurringExpense, "id">) => void;
  updateRecurringExpense: (expense: RecurringExpense) => void;
  deleteRecurringExpense: (id: string) => void;
  addTransaction: (input: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  restoreBackup: (settings: UserSettings, transactions: Transaction[], monthPlans?: Record<string, string>) => void;
}

const FinanceDataContext = createContext<FinanceDataContextValue | undefined>(undefined);

export const FinanceDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<FinanceDataState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadState();
    startTransition(() => {
      setState(loaded);
      setHydrated(true);
    });
  }, []);

  const commitState = useCallback((next: FinanceDataState, shouldBackup = false) => {
    setState(next);
    persistState(next);
    if (shouldBackup) {
      const entry = createAutoBackup(next, next.settings, next.transactions);
      if (entry) {
        const autoBackups = applyAutoBackupLimit(
          [entry, ...next.autoBackups],
          next.settings.autoBackupMaxEntries
        );
        const withBackups = { ...next, autoBackups };
        setState(withBackups);
        persistState(withBackups);
      }
    }
  }, []);

  const updateSettingsInternal = useCallback(
    (updater: (settings: UserSettings) => UserSettings, withBackup = true) => {
      setState((prev) => {
        const nextSettings = updater(prev.settings);
        const nextState = { ...prev, settings: nextSettings };
        persistState(nextState);
        if (withBackup) {
          const entry = createAutoBackup(nextState, nextSettings, nextState.transactions);
          if (entry) {
            nextState.autoBackups = applyAutoBackupLimit(
              [entry, ...nextState.autoBackups],
              nextSettings.autoBackupMaxEntries
            );
            persistState(nextState);
          }
        }
        return { ...nextState };
      });
    },
    []
  );

  const setSettings = useCallback(
    (partial: Partial<UserSettings>) => {
      updateSettingsInternal((prev) => ({ ...prev, ...partial }));
    },
    [updateSettingsInternal]
  );

  const addRecurringExpense = useCallback(
    (expense: Omit<RecurringExpense, "id">) => {
      updateSettingsInternal((prev) => ({
        ...prev,
        recurringExpenses: [
          ...prev.recurringExpenses,
          { ...expense, id: crypto.randomUUID() },
        ],
      }));
    },
    [updateSettingsInternal]
  );

  const addCustomMonth = useCallback(
    (month: string) => {
      updateSettingsInternal((prev) => {
        const customMonths = Array.from(new Set([...prev.customMonths, month])).sort();
        return { ...prev, customMonths, lastSelectedMonth: month };
      });
    },
    [updateSettingsInternal]
  );

  const deleteCustomMonth = useCallback(
    (month: string) => {
      setState((prev) => {
        const customMonths = prev.settings.customMonths.filter((item) => item !== month).sort();
        const nextTransactions = prev.transactions.filter((tx) => tx.month !== month);
        const { [month]: _, ...restPlans } = prev.monthPlans;
        const nextSettings = {
          ...prev.settings,
          customMonths,
          lastSelectedMonth: customMonths[0] ?? "",
        };
        const next = { ...prev, settings: nextSettings, transactions: nextTransactions, monthPlans: restPlans };
        persistState(next);
        if (prev.settings.autoBackupEnabled) {
          const entry = createAutoBackup(next, nextSettings, nextTransactions);
          if (entry) {
            next.autoBackups = applyAutoBackupLimit(
              [entry, ...next.autoBackups],
              nextSettings.autoBackupMaxEntries
            );
            persistState(next);
          }
        }
        return { ...next };
      });
    },
    []
  );

  const setMonthPlan = useCallback((month: string, plan: string) => {
    setState((prev) => {
      const monthPlans = { ...prev.monthPlans, [month]: plan };
      const next = { ...prev, monthPlans };
      persistState(next);
      return { ...next };
    });
  }, []);

  const updateRecurringExpense = useCallback(
    (expense: RecurringExpense) => {
      updateSettingsInternal((prev) => ({
        ...prev,
        recurringExpenses: prev.recurringExpenses.map((item) =>
          item.id === expense.id ? expense : item
        ),
      }));
    },
    [updateSettingsInternal]
  );

  const deleteRecurringExpense = useCallback(
    (id: string) => {
      updateSettingsInternal((prev) => ({
        ...prev,
        recurringExpenses: prev.recurringExpenses.filter((item) => item.id !== id),
      }));
    },
    [updateSettingsInternal]
  );

  const addTransaction = useCallback(
    (input: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      const nextTransaction: Transaction = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) => {
        const next = {
          ...prev,
          transactions: [nextTransaction, ...prev.transactions],
        };
        persistState(next);
        if (prev.settings.autoBackupEnabled) {
          const entry = createAutoBackup(next, next.settings, next.transactions);
          if (entry) {
            next.autoBackups = applyAutoBackupLimit(
              [entry, ...next.autoBackups],
              next.settings.autoBackupMaxEntries
            );
            persistState(next);
          }
        }
        return { ...next };
      });
    },
    []
  );

  const updateTransaction = useCallback((transaction: Transaction) => {
    setState((prev) => {
      const nextTransactions = prev.transactions.map((item) =>
        item.id === transaction.id ? { ...transaction, updatedAt: new Date().toISOString() } : item
      );
      const next = { ...prev, transactions: nextTransactions };
      persistState(next);
      if (prev.settings.autoBackupEnabled) {
        const entry = createAutoBackup(next, next.settings, nextTransactions);
        if (entry) {
          next.autoBackups = applyAutoBackupLimit(
            [entry, ...next.autoBackups],
            next.settings.autoBackupMaxEntries
          );
          persistState(next);
        }
      }
      return { ...next };
    });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setState((prev) => {
      const nextTransactions = prev.transactions.filter((item) => item.id !== id);
      const next = { ...prev, transactions: nextTransactions };
      persistState(next);
      if (prev.settings.autoBackupEnabled) {
        const entry = createAutoBackup(next, next.settings, nextTransactions);
        if (entry) {
          next.autoBackups = applyAutoBackupLimit(
            [entry, ...next.autoBackups],
            next.settings.autoBackupMaxEntries
          );
          persistState(next);
        }
      }
      return { ...next };
    });
  }, []);

  const restoreBackup = useCallback((settings: UserSettings, transactions: Transaction[], monthPlans?: Record<string, string>) => {
    const sanitizedSettings = {
      ...defaultState.settings,
      ...settings,
      openAiApiKey: "",
    };
    const restored: FinanceDataState = {
      settings: sanitizedSettings,
      transactions,
      monthPlans: monthPlans ?? state.monthPlans,
      autoBackups: state.autoBackups,
    };
    commitState(restored, true);
  }, [commitState, state.autoBackups, state.monthPlans]);

  const value = useMemo<FinanceDataContextValue>(() => ({
    ...state,
    hydrated,
    setSettings,
    addCustomMonth,
    deleteCustomMonth,
    setMonthPlan,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    restoreBackup,
  }), [
    state,
    hydrated,
    setSettings,
    addCustomMonth,
    deleteCustomMonth,
    setMonthPlan,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    restoreBackup,
  ]);

  return (
    <FinanceDataContext.Provider value={value}>
      {children}
    </FinanceDataContext.Provider>
  );
};

export const useFinanceData = () => {
  const ctx = useContext(FinanceDataContext);
  if (!ctx) {
    throw new Error("useFinanceData must be used inside FinanceDataProvider");
  }
  return ctx;
};

export const useMonthTransactions = (month: string) => {
  const { transactions } = useFinanceData();
  return useMemo(() => transactions.filter((t) => t.month === month), [transactions, month]);
};

export const getMonthFromDate = (date: string) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
};
