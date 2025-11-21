import { NextResponse } from "next/server";
import { parseSparkasseText } from "../../../../lib/sparkasseParser";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No PDF uploaded." }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  // Minimal DOMMatrix polyfill required by pdf.js when running in Node.
  if (typeof (globalThis as unknown as { DOMMatrix?: unknown }).DOMMatrix === "undefined") {
    (globalThis as unknown as { DOMMatrix: unknown }).DOMMatrix = class {
      multiplySelf() { return this; }
      preMultiplySelf() { return this; }
      invertSelf() { return this; }
      translateSelf() { return this; }
      scaleSelf() { return this; }
      rotateSelf() { return this; }
      skewXSelf() { return this; }
      skewYSelf() { return this; }
    };
  }

  // Use CommonJS require so the module is bundled and available at runtime (e.g., Vercel).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParseModule = require("pdf-parse") as {
    PDFParse: new (options: { data: Uint8Array; verbosity?: number }) => {
      getText: () => Promise<{ text: string }>;
    };
    VerbosityLevel?: { ERRORS: number };
  };
  const { PDFParse, VerbosityLevel } = pdfParseModule;

  const parser = new PDFParse({ data, verbosity: VerbosityLevel?.ERRORS ?? 0 });
  const { text } = await parser.getText();
  const parsed = parseSparkasseText(text, "uploaded.pdf");

  return NextResponse.json(parsed);
}
