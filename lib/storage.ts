"use client";

import { BACKUP_VERSION, STORAGE_KEY, defaultState } from "./constants";
import { generateId } from "./id";
import {
  AutoBackupEntry,
  BackupFile,
  FinanceDataState,
  Transaction,
  UserSettings,
} from "./types";

const sanitizeSettings = (settings: FinanceDataState["settings"]) => ({
  ...defaultState.settings,
  ...settings,
  openAiApiKey: settings?.openAiApiKey ?? "",
  recapDay: typeof settings?.recapDay === "number" ? settings.recapDay : defaultState.settings.recapDay,
});

const parseState = (raw: string | null): FinanceDataState => {
  if (!raw) return defaultState;
  try {
    const data = JSON.parse(raw) as FinanceDataState;
    return {
      settings: sanitizeSettings(data.settings),
      transactions: data.transactions ?? [],
      autoBackups: data.autoBackups ?? [],
      monthPlans: data.monthPlans ?? {},
      messages: data.messages ?? [],
      lastSeenAt: data.lastSeenAt,
    };
  } catch (error) {
    console.warn("Failed to parse local data", error);
    return defaultState;
  }
};

export const loadState = (): FinanceDataState => {
  if (typeof window === "undefined") return defaultState;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return parseState(raw);
};

export const persistState = (state: FinanceDataState) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const buildBackupFile = (state: FinanceDataState): BackupFile => ({
  version: BACKUP_VERSION,
  exportedAt: new Date().toISOString(),
  settings: state.settings,
  transactions: state.transactions,
  monthPlans: state.monthPlans,
  messages: state.messages,
  lastSeenAt: state.lastSeenAt,
});

export const validateBackup = (data: BackupFile): boolean => {
  return Boolean(
    data &&
      typeof data.version === "string" &&
      Array.isArray(data.transactions) &&
      data.settings &&
      data.monthPlans &&
      Array.isArray((data as BackupFile).messages ?? [])
  );
};

export const createAutoBackup = (
  state: FinanceDataState,
  updatedSettings?: UserSettings,
  updatedTransactions?: Transaction[],
  updatedMessages?: FinanceDataState["messages"],
  updatedLastSeenAt?: string
): AutoBackupEntry | null => {
  if (!state.settings.autoBackupEnabled) return null;
  const snapshot: AutoBackupEntry = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    transactionsCount: (updatedTransactions ?? state.transactions).length,
    settingsSnapshot: updatedSettings ?? state.settings,
    transactionsSnapshot: updatedTransactions ?? state.transactions,
    monthPlansSnapshot: state.monthPlans,
    messagesSnapshot: updatedMessages ?? state.messages,
    lastSeenAtSnapshot: updatedLastSeenAt ?? state.lastSeenAt,
  };
  return snapshot;
};

export const applyAutoBackupLimit = (
  entries: AutoBackupEntry[],
  maxEntries: number
): AutoBackupEntry[] => {
  return entries
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, Math.max(1, maxEntries));
};
