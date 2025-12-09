import { NextRequest, NextResponse } from "next/server";
import { Category, TransactionType } from "../../../lib/types";

interface AutoCategorizeBody {
  amount: number;
  type: TransactionType;
  note?: string;
  availableCategories?: Category[];
  userCategory?: string;
  apiKey?: string;
  allowNewCategories?: boolean;
}

const parseJson = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const normalize = (value: string) => value.trim().toLowerCase();
const stripSymbols = (value: string) => value.replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

const pickExistingCategory = (name: string, available: Category[], fallbackUser?: string): Category | null => {
  if (!name && !fallbackUser) return null;
  const normalized = normalize(name || fallbackUser || "");
  const stripped = stripSymbols(name || fallbackUser || "");
  const direct = available.find((cat) => normalize(cat.name) === normalized);
  if (direct) return direct;
  const loose = available.find((cat) => stripSymbols(cat.name) === stripped);
  return loose ?? null;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as AutoCategorizeBody;
  const {
    amount,
    type,
    note,
    availableCategories = [],
    userCategory,
    apiKey,
    allowNewCategories = true,
  } = body;
  if (typeof amount !== "number" || Number.isNaN(amount) || !type) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "OpenAI API key missing" }, { status: 400 });
  }

  const categoriesList = availableCategories.length
    ? availableCategories.map((c) => `- ${c.name}${c.icon ? ` (${c.icon})` : ""}`).join("\n")
    : "None provided";

  const messages = [
    {
      role: "system",
      content:
        `You map personal finance transactions to categories AND rewrite them into a clear, human note. Prefer an existing category ONLY when there is a clear, specific match. Avoid generic buckets like General/Other unless the note is empty. When reusing a category, return the exact provided name with no extra words or emoji. If nothing fits well, create a concise new category name (1-3 words) that reflects the broader domain or activity (e.g., Music, Groceries, Transport) instead of item-level names. The user ${
          allowNewCategories ? "allows" : "does NOT allow"
        } you to add new categories. If they do not allow it, you MUST pick the closest existing category. Respond ONLY with a JSON object string, no commentary.`,
    },
    {
      role: "user",
      content: `Transaction details:
type: ${type}
amount: ${amount}
note: ${note || "n/a"}
user_selected_category: ${userCategory || "n/a"}
Available categories:
${categoriesList}

Return JSON with shape:
{"categoryName":"<name>","isNew":true|false,"icon":"<emoji or empty string>","note":"<short normalized note>"}
- If using an existing category, categoryName must match exactly one of the provided names and isNew should be false.
- If no good match, invent one concise domain-level category (not a product name), set isNew true (only if allowed), and suggest a simple emoji in icon (or empty string).
- Avoid general words like "Other" or "General" unless note is empty and no specific merchant/product is present.
- If the note mentions a specific merchant, product, platform, or activity not represented in available categories, create a new category describing that broader domain and mark isNew true (e.g., a musical instrument purchase -> "Music", game console -> "Gaming").
- Keep names under 25 characters.
- note should be a brief, human-friendly description (1 sentence or less) that clarifies merchant/purpose; omit emojis.`,
    },
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    const parsed = parseJson(content);

    const allowNew = allowNewCategories !== false;
    const rawName = parsed?.categoryName || "";
    const cleanedNote =
      typeof parsed?.note === "string" && parsed.note.trim()
        ? parsed.note.trim()
        : (note || userCategory || "").trim();

    if (parsed?.isNew === true && rawName && allowNew) {
      const existingEvenIfNewFlag = pickExistingCategory(rawName, availableCategories);
      if (existingEvenIfNewFlag) {
        return NextResponse.json({
          categoryName: existingEvenIfNewFlag.name,
          isNew: false,
          icon: existingEvenIfNewFlag.icon ?? "",
          note: cleanedNote,
        });
      }
      return NextResponse.json({
        categoryName: rawName,
        isNew: true,
        icon: typeof parsed?.icon === "string" ? parsed.icon : "",
        note: cleanedNote,
      });
    }

    const matchedExisting =
      pickExistingCategory(rawName, availableCategories, userCategory) ??
      pickExistingCategory(userCategory || "", availableCategories);

    if (matchedExisting) {
      return NextResponse.json({
        categoryName: matchedExisting.name,
        isNew: false,
        icon: "",
        note: cleanedNote,
      });
    }

    const fallbackName = rawName || userCategory || availableCategories[0]?.name || "General";
    const isNew = allowNew && rawName ? Boolean(parsed?.isNew ?? true) : false;
    return NextResponse.json({
      categoryName: fallbackName,
      isNew,
      icon: typeof parsed?.icon === "string" ? parsed.icon : "",
      note: cleanedNote || fallbackName,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
