import { NextResponse } from "next/server";
import { createRequire } from "node:module";
import { parseSparkasseText } from "../../../../lib/sparkasseParser";

export const runtime = "nodejs";

const PARSE_TIMEOUT_MS = 20_000;
const require = createRequire(import.meta.url);
const projectRequire = createRequire(process.cwd() + "/");

// Resolve the bundled pdf.js worker so it is available in serverless output.
function resolvePdfWorker() {
  const candidates = [
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    "pdfjs-dist/legacy/build/pdf.worker.mjs",
    "pdf-parse/node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    "pdf-parse/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
  ];

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      // Try resolving from the built route location first, then fall back to project root.
      return require.resolve(candidate);
    } catch (error) {
      lastError = error;
      try {
        return projectRequire.resolve(candidate);
      } catch (errorFromRoot) {
        lastError = errorFromRoot;
      }
    }
  }

  console.warn("Unable to resolve pdfjs worker script; PDF parsing may fail.", lastError);
  return undefined;
}

let pdfWorkerSrc: string | undefined;

// Polyfills required by pdfjs-dist when running in a serverless Node runtime.
function ensurePolyfills() {
  const globalScope = globalThis as unknown as {
    DOMMatrix?: unknown;
    Path2D?: unknown;
    ImageData?: unknown;
  };

  if (typeof globalScope.DOMMatrix === "undefined") {
    globalScope.DOMMatrix = class {
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

  if (typeof globalScope.Path2D === "undefined") {
    globalScope.Path2D = class {};
  }

  if (typeof globalScope.ImageData === "undefined") {
    globalScope.ImageData = class {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      constructor(_data?: unknown, _width?: number, _height?: number) {}
    };
  }
}

export async function POST(request: Request) {
  ensurePolyfills();

  // Delay loading pdf-parse until after polyfills are applied to avoid DOMMatrix errors.
  const { PDFParse, VerbosityLevel } = await import("pdf-parse");
  if (!pdfWorkerSrc) {
    pdfWorkerSrc = resolvePdfWorker();
  }
  if (pdfWorkerSrc) {
    PDFParse.setWorker(pdfWorkerSrc);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No PDF uploaded." }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const dataBuffer = Buffer.from(arrayBuffer);

  try {
    const parseStart = Date.now();

    const text = await Promise.race([
      (async () => {
        const parser = new PDFParse({
          data: dataBuffer,
          verbosity: VerbosityLevel?.ERRORS ?? 0,
        });
        try {
          const { text: parsedText } = await parser.getText();
          return parsedText;
        } finally {
          if (typeof parser.destroy === "function") {
            await parser.destroy().catch(() => {});
          }
        }
      })(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("PDF parse timed out")), PARSE_TIMEOUT_MS)
      ),
    ]);

    const parseElapsedMs = Date.now() - parseStart;
    console.log(`sparkasse parse ms=${Math.round(parseElapsedMs)}`);

    const parsed = parseSparkasseText(text, "uploaded.pdf");

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("PDF Parse Error:", error);
    const message = error instanceof Error ? error.message : "Failed to parse PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
