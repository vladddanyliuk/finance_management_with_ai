import type { TransactionType } from "./types";

export interface SparkasseParsedTransaction {
  date: string; // ISO date string YYYY-MM-DD
  amount: number; // absolute amount
  type: TransactionType;
  label: string;
  details?: string;
}

export interface SparkasseParseResult {
  statementMonth: string; // YYYY-MM
  transactions: SparkasseParsedTransaction[];
  sourceName?: string;
}

interface RawEntry {
  date: string; // dd.MM.yyyy
  lines: string[];
}

const amountRegex = /([+-]?\d{1,3}(?:\.\d{3})*,\d{2})/;

const normalizeLine = (line: string) => line.replace(/\s+/g, " ").trim();

const shouldSkipLine = (line: string) => {
  const skipPatterns = [
    /^sparkasse/i,
    /^gera-greiz/i,
    /^schloßstraße/i,
    /^postfach/i,
    /^sparkassen-finanzgruppe/i,
    /^anstalt des öffentlichen rechts/i,
    /^hra /i,
    /^ust-id/i,
    /^telefon/i,
    /^telefax/i,
    /^www\./i,
    /^info@/i,
    /^seite \d+/i,
    /^datum erläuterung/i,
    /^kontoauszug/i,
    /^privatgirokonto/i,
    /^herrn/i,
    /^kundenmitteilungen/i,
    /^informationsbogen/i,
  ];
  return skipPatterns.some((pattern) => pattern.test(line));
};

const parseGermanAmount = (value: string) => Number(value.replace(/\./g, "").replace(",", "."));

const toIsoDate = (date: string) => {
  const [day, month, year] = date.split(".");
  if (!day || !month || !year) return "";
  return `${year}-${month}-${day}`;
};

const detectStatementMonth = (text: string) => {
  const match = text.match(/Kontoauszug\s+(\d{2})\/(\d{4})/i);
  if (match) {
    const [, month, year] = match;
    return `${year}-${month}`;
  }
  return "";
};

const finalizeEntry = (entry: RawEntry): SparkasseParsedTransaction | null => {
  const amountIndex = [...entry.lines]
    .reverse()
    .findIndex((line) => amountRegex.test(line));
  if (amountIndex === -1) return null;

  const actualIndex = entry.lines.length - 1 - amountIndex;
  const amountLine = entry.lines[actualIndex];
  const amountMatch = amountLine.match(amountRegex);
  if (!amountMatch) return null;

  const amount = parseGermanAmount(amountMatch[1]);
  const restLines = entry.lines.filter((_, idx) => idx !== actualIndex);
  const [label, ...details] = restLines;

  const isoDate = toIsoDate(entry.date);
  if (!isoDate) return null;

  return {
    date: isoDate,
    amount: Math.abs(amount),
    type: amount >= 0 ? "income" : "expense",
    label: label || "Sparkasse booking",
    details: details.length ? details.join(" ") : undefined,
  };
};

export const parseSparkasseText = (
  text: string,
  sourceName?: string
): SparkasseParseResult => {
  const lines = text
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean);

  const entries: SparkasseParsedTransaction[] = [];
  let current: RawEntry | null = null;

  const pushEntry = () => {
    if (!current) return;
    const parsed = finalizeEntry(current);
    if (parsed) {
      entries.push(parsed);
    }
    current = null;
  };

  const endSectionPatterns = [
    /^kontostand am/i,
    /^anzahl anlagen/i,
    /^kundenmitteilungen/i,
    /^informationsbogen/i,
    /^für sie als kunde/i,
  ];

  for (const rawLine of lines) {
    if (!rawLine) continue;
    if (endSectionPatterns.some((pattern) => pattern.test(rawLine))) {
      pushEntry();
      current = null;
      continue;
    }
    if (shouldSkipLine(rawLine)) continue;

    const dateMatch = rawLine.match(/^(\d{2}\.\d{2}\.\d{4})\s*(.*)$/);
    if (dateMatch) {
      pushEntry();
      const [, date, rest] = dateMatch;
      current = { date, lines: [] };
      if (rest.trim()) current.lines.push(rest.trim());
      continue;
    }

    if (!current) continue;
    current.lines.push(rawLine);
  }

  pushEntry();

  const headerMonth = detectStatementMonth(text);
  const mostCommonMonth =
    entries
      .map((entry) => entry.date.slice(0, 7))
      .reduce((acc, month) => {
        acc[month] = (acc[month] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);

  const fallbackMonth =
    entries.length > 0
      ? Object.entries(mostCommonMonth).sort((a, b) => b[1] - a[1])[0]?.[0] ??
        entries[0].date.slice(0, 7)
      : "";

  return {
    statementMonth: headerMonth || fallbackMonth,
    transactions: entries,
    sourceName,
  };
};

const parseViaApi = async (file: File): Promise<SparkasseParseResult> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/sparkasse/parse", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(errorText || "Server could not parse PDF.");
  }
  return response.json();
};

export const parseSparkassePdf = async (
  file: File
): Promise<SparkasseParseResult> => {
  if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Please upload a PDF file.");
  }

  // Use server parsing for maximum compatibility across browsers.
  return parseViaApi(file);
};
