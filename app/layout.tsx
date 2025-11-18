import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "./providers";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pocket Pilot",
  description: "Offline-first personal money management PWA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pocket Pilot",
  },
};

export const viewport = {
  themeColor: "#2563eb",
};

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/settings", label: "Settings" },
  { href: "/backups", label: "Backups" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <div className="mx-auto max-w-3xl px-4 pb-24 pt-6">
            <header className="mb-6 flex flex-col gap-3">
              <h1 className="text-2xl font-bold">Pocket Pilot</h1>
              <p className="text-sm text-slate-500">
                Plan your month, keep spending on track, even offline.
              </p>
              <nav className="flex flex-wrap gap-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </header>
            <main>{children}</main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
