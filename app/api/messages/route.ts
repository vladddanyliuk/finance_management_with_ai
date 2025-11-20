import { NextRequest, NextResponse } from "next/server";
import { differenceInCalendarDays, endOfMonth, parseISO } from "date-fns";
import { calculateMonthSummary } from "../../../lib/summary";
import { Transaction, UserSettings } from "../../../lib/types";

interface MessagesRequestBody {
  month: string;
  settings: UserSettings;
  transactions: Transaction[];
  lastSeenAt?: string;
  lastMessageAt?: string;
  apiKey?: string;
}

const makeId = () => `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const safeParse = (value?: string | null) => {
  if (!value) return null;
  try {
    return parseISO(value);
  } catch {
    return null;
  }
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as MessagesRequestBody;
  const { month, settings, transactions, lastSeenAt, lastMessageAt, apiKey } = body;
  if (!month || !settings || !Array.isArray(transactions)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "OpenAI API key missing" }, { status: 400 });
  }

  const now = new Date();
  const lastSeenDate = safeParse(lastSeenAt);
  const lastMessageDate = safeParse(lastMessageAt);
  const daysSinceSeen = lastSeenDate ? differenceInCalendarDays(now, lastSeenDate) : 0;
  const daysSinceMessage = lastMessageDate ? differenceInCalendarDays(now, lastMessageDate) : 999;

  const recapDay = typeof settings.recapDay === "number" ? settings.recapDay : 0;
  const isRecapDay = now.getDay() === recapDay;
  const isLongGap = daysSinceSeen > 14;

  if (!isRecapDay && !isLongGap) {
    return NextResponse.json({ message: null });
  }
  if (!isLongGap && daysSinceMessage < 5) {
    return NextResponse.json({ message: null });
  }

  const summary = calculateMonthSummary(month, settings, transactions);
  const monthStart = parseISO(`${month}-01`);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = Math.max(1, differenceInCalendarDays(monthEnd, monthStart) + 1);
  const todayInMonth = Math.min(daysInMonth, Math.max(1, now.getDate()));
  const daysLeft = Math.max(0, differenceInCalendarDays(monthEnd, now));
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
  const averageDailySpend = totalExpense / Math.max(1, todayInMonth);
  const expenseByCategory = Object.entries(
    transactions
      .filter((t) => t.type === "expense")
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + t.amount;
        return acc;
      }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount]) => `${category}:${amount}`)
    .join(" | ");
  const behaviors = settings.aiBehaviors?.length
    ? settings.aiBehaviors.map((b) => `${b.description} (${b.monthlyAmount})`).join(" | ")
    : "none";

  const prompt = `Create a short weekly recap for personal finance with light coaching, but be firm when money is tight.
Today: ${now.toISOString()}
Month: ${month}
Recap window: ${isLongGap ? "long gap since user last opened app" : "this week"}
Currency: ${settings.currency}
Default income: ${settings.defaultMonthlyIncome}
Total income this month: ${totalIncome}
Total expenses this month: ${totalExpense}
Remaining planned: ${summary.remaining}
Daily budget: ${summary.dailyBudget}
Recurring expenses (mandatory/optional): ${summary.mandatoryRecurringTotal}/${summary.optionalRecurringTotal}
Month progress day ${todayInMonth} of ${daysInMonth}, days left: ${daysLeft}
Average daily spend so far: ${averageDailySpend}
Top expense categories: ${expenseByCategory || "n/a"}
User-stated behaviors/priorities: ${behaviors}
Transactions (month only):
${transactions.slice(0, 30).map((t) => `${t.date} ${t.type} ${t.amount} ${t.category} ${t.note || ""}`).join(" | ")}

Write markdown with:
- Title line (e.g., "Week recap" or "Missed weeks recap").
- Bullet points: wins, overspending spots (by category), suggested cut amount for next week, and one habit to try.
- Call out remaining cash (übrig) and how to stretch it until month-end with a concrete daily cap and 2-3 categories to freeze/trim.
- Identify any bad habits from spend patterns and give a specific tweak for each.
- If remaining cash looks tight (remaining less than 30% of expected burn rate for days left or daily budget below 60% of average daily spend), provide firm advice: exact daily cap, 2-3 categories to freeze, and one actionable step for today.
- If possible, suggest one realistic way to boost income before month end.
- A mini table with 2 rows: | Item | Amount | for total income and total expenses.
- Keep it under 140 words.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        messages: [
          { role: "system", content: "You are a concise, supportive finance coach. Respond only with markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    if (!content) {
      return NextResponse.json({ message: null });
    }

    const message = {
      id: makeId(),
      createdAt: now.toISOString(),
      month,
      content,
      read: false,
    };

    return NextResponse.json({ message });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
