"use client";

import { usePathname } from "next/navigation";

export const NavigationHider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  // Hide nav for month detail routes (/months/[month])
  const hideNav = pathname?.startsWith("/months/");

  return (
    <div
      className={[
        "transition-all duration-300 ease-out overflow-hidden",
        hideNav ? "max-h-0 opacity-0 -translate-y-2 pointer-events-none" : "max-h-24 opacity-100 translate-y-0",
      ].join(" ")}
    >
      {children}
    </div>
  );
};
