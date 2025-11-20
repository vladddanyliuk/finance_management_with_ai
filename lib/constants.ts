import { FinanceDataState, UserSettings } from "./types";

export const STORAGE_KEY = "finance-data-state-v1";
export const BACKUP_VERSION = "1.0.0";

export const AI_AUTO_CATEGORY = {
  name: "Auto",
  icon: "🤖",
};

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
  aiAllowNewCategories: true,
  recapDay: 0,
};

export const defaultState: FinanceDataState = {
  settings: defaultSettings,
  transactions: [],
  autoBackups: [],
  monthPlans: {},
  messages: [],
  lastSeenAt: undefined,
};
