import fs from "node:fs";
import path from "node:path";
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

  // Use Node's runtime resolver (not Next's bundler) to avoid mangled worker paths.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const nodeRequire = eval("require") as NodeRequire;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParseModule = nodeRequire("pdf-parse") as {
    PDFParse: {
      new (options: { data: Uint8Array; verbosity?: number }): {
        getText: () => Promise<{ text: string }>;
      };
      setWorker?: (workerSrc: string) => string | undefined;
    };
    VerbosityLevel?: { ERRORS: number };
  };
  const { PDFParse, VerbosityLevel } = pdfParseModule;

  // Point workerSrc to the pdfjs-dist copy that ships with pdf-parse (matching versions).
  // Prefer the pdf.js worker that ships with pdf-parse to avoid version mismatch.
  const pdfParseEntry = nodeRequire.resolve("pdf-parse");
  let pdfParseRoot: string | null = null;
  {
    let dir = path.dirname(pdfParseEntry);
    const root = path.parse(dir).root;
    while (dir !== root) {
      const pkgPath = path.join(dir, "package.json");
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as { name?: string };
          if (pkg.name === "pdf-parse") {
            pdfParseRoot = dir;
            break;
          }
        } catch {
          // keep walking up
        }
      }
      dir = path.dirname(dir);
    }
  }

  const workerCandidates = [
    pdfParseRoot ? path.join(pdfParseRoot, "node_modules", "pdfjs-dist", "build", "pdf.worker.mjs") : null,
    path.join(process.cwd(), "node_modules", "pdfjs-dist", "build", "pdf.worker.mjs"),
  ];
  for (const workerPath of workerCandidates) {
    if (!workerPath) continue;
    if (!fs.existsSync(workerPath)) continue;
    PDFParse.setWorker?.(workerPath);
    break;
  }

  const parser = new PDFParse({ data, verbosity: VerbosityLevel?.ERRORS ?? 0 });
  const { text } = await parser.getText();
  const parsed = parseSparkasseText(text, "uploaded.pdf");

  return NextResponse.json(parsed);
}
