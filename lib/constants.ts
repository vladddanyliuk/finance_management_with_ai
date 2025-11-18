import { FinanceDataState, UserSettings } from "./types";

export const STORAGE_KEY = "finance-data-state-v1";
export const BACKUP_VERSION = "1.0.0";

export const defaultSettings: UserSettings = {
  currency: "EUR",
  defaultMonthlyIncome: 600,
  recurringExpenses: [],
  aiBehaviors: [],
  categories: [],
  customMonths: [],
  autoBackupEnabled: true,
  autoBackupMaxEntries: 5,
  lastSelectedMonth: "",
  openAiApiKey: "",
};

export const defaultState: FinanceDataState = {
  settings: defaultSettings,
  transactions: [],
  autoBackups: [],
  monthPlans: {},
};
