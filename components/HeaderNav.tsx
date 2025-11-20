"use client";

import Link from "next/link";
import { type ComponentType } from "react";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  ArrowsRightLeftIcon,
  Cog6ToothIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

export type HeaderNavIcon = "dashboard" | "transactions" | "settings" | "backups";

export type HeaderNavLink = {
  href: string;
  label: string;
  icon: HeaderNavIcon;
};

interface HeaderNavProps {
  links: HeaderNavLink[];
}

export const HeaderNav = ({ links }: HeaderNavProps) => {
  const pathname = usePathname();
  const indentReady = true;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const iconMap: Record<HeaderNavIcon, ComponentType<{ className?: string }>> = {
    dashboard: HomeIcon,
    transactions: ArrowsRightLeftIcon,
    settings: Cog6ToothIcon,
    backups: ArrowDownTrayIcon,
  };

  return (
    <nav className="flex flex-wrap justify-center gap-2 animate-slideIn">
      {links.map((link) => {
        const active = isActive(link.href);
        const Icon = iconMap[link.icon];
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={[
              "relative inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition-all duration-200",
              active ? "gap-2" : "gap-1",
              active
                ? "border-blue-200 bg-blue-50 text-blue-700 shadow-soft"
                : "border-slate-200 bg-white/70 text-slate-700 hover:-translate-y-0.5 hover:shadow",
              active && indentReady ? "ml-1" : "ml-0",
            ].join(" ")}
          >
            {active && (
              <span className="absolute inset-0 -z-10 rounded-full bg-blue-100/70 blur animate-pulse" aria-hidden />
            )}
            <span
              className="h-2 w-2 rounded-full transition-all duration-150"
              style={{ backgroundColor: "#2563eb", display: active ? "inline-block" : "none" }}
              aria-hidden
            />
            <Icon className={active ? "h-5 w-5 text-blue-700" : "h-5 w-5 text-slate-600"} aria-hidden />
            <span className="sr-only">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
