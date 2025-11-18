import { FinanceDataState, UserSettings } from "./types";
import { format } from "date-fns";

export const STORAGE_KEY = "finance-data-state-v1";
export const BACKUP_VERSION = "1.0.0";

const currentMonth = format(new Date(), "yyyy-MM");

export const defaultSettings: UserSettings = {
  currency: "EUR",
  defaultMonthlyIncome: 600,
  recurringExpenses: [],
  oneTimeExpenses: [],
  customMonths: [],
  autoBackupEnabled: true,
  autoBackupMaxEntries: 5,
  lastSelectedMonth: currentMonth,
  openAiApiKey: "",
};

export const defaultState: FinanceDataState = {
  settings: defaultSettings,
  transactions: [],
  autoBackups: [],
};
