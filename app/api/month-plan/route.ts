import { NextRequest, NextResponse } from "next/server";
import { MonthSummary, Transaction, UserSettings } from "../../../lib/types";

interface MonthPlanRequestBody {
  month: string;
  settings: UserSettings;
  summary: MonthSummary;
  transactionsSample?: Transaction[];
  language?: string;
  apiKey?: string;
  selectedOption?: string;
  selectedOptionDetails?: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as MonthPlanRequestBody;
  const {
    month,
    settings,
    summary,
    transactionsSample,
    language,
    apiKey,
    selectedOption,
    selectedOptionDetails,
  } = body;
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "OpenAI API key missing" }, { status: 400 });
  }
  const systemPrompt = `You are a funny but realistic financial coach building monthly spending plans. Speak with light humor and clear markdown. When showing tables, always format valid markdown tables with header and separator rows like:
| Item | Amount |
| --- | --- |
| Example | 10 |
Do not wrap tables in code fences.`;
  const behaviors = settings.aiBehaviors?.length
    ? settings.aiBehaviors.map((b) => `- ${b.description}: ${b.monthlyAmount}`).join("\n")
    : "None provided";
  const prompt = `Month: ${month}\nCurrency: ${settings.currency}\nDefault income: ${summary.defaultIncome}\nRecurring mandatory: ${summary.mandatoryRecurringTotal}\nRecurring optional: ${summary.optionalRecurringTotal}\nActual income transactions: ${summary.incomeTransactionsTotal}\nActual expense transactions: ${summary.expenseTransactionsTotal}\nRemaining: ${summary.remaining}\nDaily budget: ${summary.dailyBudget}\nBehaviors/priorities: ${behaviors}\nRecurring expenses: ${settings.recurringExpenses
    .map((r) => `- ${r.name}: ${r.amount} (${r.isMandatory ? "mandatory" : "optional"})`)
    .join("\n")}\nSample transactions: ${transactionsSample
    ?.map((t) => `${t.date} ${t.category} ${t.type} ${t.amount}`)
    .join(" | ")}`;

  try {
    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `${prompt}\nLanguage: ${language || "English"}.\nUser selected option: ${selectedOption ?? "not provided"}.\nOption details: ${selectedOptionDetails ?? "n/a"}.\nCreate a detailed markdown spending plan with sections for overview, fixed costs, flexible spending, a table of weekly limits, and playful tips. Keep humor friendly.`,
      },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages,
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: 500 });
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    const markdown = content || "Could not generate plan.";
    return NextResponse.json({ markdown });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
