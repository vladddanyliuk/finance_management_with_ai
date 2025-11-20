export type CurrencyCode = string;

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  isMandatory: boolean;
  startMonth?: string; // YYYY-MM inclusive
  endMonth?: string; // YYYY-MM inclusive
}

export interface Category {
  id: string;
  name: string;
  icon?: string; // emoji or short label
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
  aiBehaviors: AiBehavior[];
  categories: Category[];
  customMonths: string[];
  autoBackupEnabled: boolean;
  autoBackupMaxEntries: number;
  lastSelectedMonth: string;
  openAiApiKey?: string;
  aiAllowNewCategories: boolean;
  recapDay?: number; // 0-6, Sunday = 0
}

export interface AiBehavior {
  id: string;
  description: string;
  monthlyAmount: number;
}

export interface MonthSummary {
  month: string;
  mandatoryRecurringTotal: number;
  optionalRecurringTotal: number;
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
  monthPlans: Record<string, string>;
  messages: RecapMessage[];
  lastSeenAt?: string;
}

export interface AutoBackupEntry {
  id: string;
  createdAt: string;
  transactionsCount: number;
  settingsSnapshot: UserSettings;
  transactionsSnapshot: Transaction[];
  monthPlansSnapshot: Record<string, string>;
  messagesSnapshot: RecapMessage[];
  lastSeenAtSnapshot?: string;
}

export interface FinanceDataState {
  settings: UserSettings;
  transactions: Transaction[];
  autoBackups: AutoBackupEntry[];
  monthPlans: Record<string, string>;
  messages: RecapMessage[];
  lastSeenAt?: string;
}

export interface RecapMessage {
  id: string;
  createdAt: string;
  month: string;
  content: string; // markdown
  read: boolean;
}
