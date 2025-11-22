import { NextResponse } from "next/server";
import { parseSparkasseText } from "../../../../lib/sparkasseParser";

export const runtime = "nodejs";

const textFromPdf = async (data: Uint8Array) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.disableWorker = true;

  const loadingTask = pdfjs.getDocument({
    data,
    disableWorker: true,
    disableFontFace: true,
    disableRange: true,
    disableStream: true,
    disableAutoFetch: true,
    useWorkerFetch: false,
    isEvalSupported: false,
  });

  const doc = await loadingTask.promise;
  let text = "";

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: { str?: string }) => item?.str ?? "")
      .join(" ");
    text += `${pageText}\n`;
  }

  await doc.cleanup();
  await doc.destroy();

  return text;
};

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

  const text = await textFromPdf(data);
  const parsed = parseSparkasseText(text, "uploaded.pdf");

  return NextResponse.json(parsed);
}
