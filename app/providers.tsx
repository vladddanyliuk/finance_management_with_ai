"use client";

import { useEffect } from "react";
import { FinanceDataProvider } from "../lib/useFinanceData";

const ServiceWorkerRegister = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((error) => console.error("SW registration failed", error));
    };
    register();
  }, []);
  return null;
};

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <FinanceDataProvider>
      <ServiceWorkerRegister />
      {children}
    </FinanceDataProvider>
  );
};
