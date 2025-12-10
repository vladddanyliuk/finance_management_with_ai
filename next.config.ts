import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep pdf-parse as a native Node dependency so its internal worker files resolve correctly.
  serverExternalPackages: ["pdf-parse"],
  outputFileTracingIncludes: {
    "/api/sparkasse/parse": [
      "./node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
      "./node_modules/pdf-parse/node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      "./node_modules/pdf-parse/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
    ],
  },
};

export default nextConfig;
