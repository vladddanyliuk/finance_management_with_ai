import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "./providers";
import { HeaderNav, type HeaderNavLink } from "../components/HeaderNav";
import { NavigationHider } from "../components/NavigationHider";

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

const links: HeaderNavLink[] = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/transactions", label: "Transactions", icon: "transactions" },
  { href: "/settings", label: "Settings", icon: "settings" },
  { href: "/backups", label: "Backups", icon: "backups" },
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
              <NavigationHider>
                <HeaderNav links={links} />
              </NavigationHider>
            </header>
            <main>{children}</main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
