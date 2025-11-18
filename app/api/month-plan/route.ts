import { NextRequest, NextResponse } from "next/server";
import { MonthSummary, Transaction, UserSettings } from "../../../lib/types";

interface MonthPlanRequestBody {
  month: string;
  settings: UserSettings;
  summary: MonthSummary;
  transactionsSample?: Transaction[];
  language?: string;
  apiKey?: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as MonthPlanRequestBody;
  const { month, settings, summary, transactionsSample, language, apiKey } = body;
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "OpenAI API key missing" }, { status: 400 });
  }
  const systemPrompt = `You are an optimistic but realistic financial coach building a monthly spending plan. Use the provided numbers to craft a markdown plan.`;
  const behaviors = settings.aiBehaviors?.length
    ? settings.aiBehaviors.map((b) => `- ${b.description}: ${b.monthlyAmount}`).join("\n")
    : "None provided";
  const prompt = `Month: ${month}\nCurrency: ${settings.currency}\nDefault income: ${summary.defaultIncome}\nRecurring mandatory: ${summary.mandatoryRecurringTotal}\nRecurring optional: ${summary.optionalRecurringTotal}\nActual income transactions: ${summary.incomeTransactionsTotal}\nActual expense transactions: ${summary.expenseTransactionsTotal}\nRemaining: ${summary.remaining}\nDaily budget: ${summary.dailyBudget}\nBehaviors/priorities: ${behaviors}\nRecurring expenses: ${settings.recurringExpenses
    .map((r) => `- ${r.name}: ${r.amount} (${r.isMandatory ? "mandatory" : "optional"})`)
    .join("\n")}\nSample transactions: ${transactionsSample
    ?.map((t) => `${t.date} ${t.category} ${t.type} ${t.amount}`)
    .join(" | ")}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `${prompt}\nLanguage: ${language || "English"}. Provide markdown sections for overview, fixed costs, flexible spending, suggested daily/weekly limits, and helpful tips.`,
          },
        ],
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: 500 });
    }
    const data = await response.json();
    const markdown = data.choices?.[0]?.message?.content ?? "Could not generate plan.";
    return NextResponse.json({ markdown });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
