export type CurrencyCode = string;

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  isMandatory: boolean;
}

export interface OneTimePlannedExpense {
  id: string;
  month: string; // YYYY-MM
  name: string;
  amount: number;
}

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  date: string; // ISO date
  month: string; // YYYY-MM
  type: TransactionType;
  amount: number;
  category: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  currency: CurrencyCode;
  defaultMonthlyIncome: number;
  recurringExpenses: RecurringExpense[];
  oneTimeExpenses: OneTimePlannedExpense[];
  autoBackupEnabled: boolean;
  autoBackupMaxEntries: number;
  lastSelectedMonth: string;
  openAiApiKey?: string;
}

export interface MonthSummary {
  month: string;
  mandatoryRecurringTotal: number;
  optionalRecurringTotal: number;
  plannedOneTimeTotal: number;
  incomeTransactionsTotal: number;
  expenseTransactionsTotal: number;
  defaultIncome: number;
  remaining: number;
  dailyBudget: number;
}

export interface BackupFile {
  version: string;
  exportedAt: string;
  settings: UserSettings;
  transactions: Transaction[];
}

export interface AutoBackupEntry {
  id: string;
  createdAt: string;
  transactionsCount: number;
  settingsSnapshot: UserSettings;
  transactionsSnapshot: Transaction[];
}

export interface FinanceDataState {
  settings: UserSettings;
  transactions: Transaction[];
  autoBackups: AutoBackupEntry[];
}
