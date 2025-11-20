"use client";

import { useRef, useState } from "react";
import { useFinanceData } from "../../lib/useFinanceData";
import { buildBackupFile, validateBackup } from "../../lib/storage";
import { BackupFile } from "../../lib/types";

export default function BackupsPage() {
  const { settings, transactions, autoBackups, monthPlans, messages, lastSeenAt, restoreBackup } = useFinanceData();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(buildBackupFile({ settings, transactions, autoBackups, monthPlans, messages, lastSeenAt }))], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pocket-pilot-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupFile;
      if (!validateBackup(data)) {
        throw new Error("Invalid backup file");
      }
      if (!confirm("Replace current data with this backup?")) {
        return;
      }
      restoreBackup(data.settings, data.transactions, data.monthPlans, data.messages, data.lastSeenAt);
      setStatus("Backup restored successfully.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Import failed";
      setStatus(message);
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-slideIn">
      <section className="space-y-3 rounded-2xl bg-white/80 backdrop-blur p-4 shadow-lg animate-fade">
        <h2 className="text-lg font-semibold">Export / Import</h2>
        <p className="text-sm text-slate-600">
          Keep your data safe by exporting regularly. Files stay on your device only.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-full bg-blue-600 px-4 py-2 text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow"
            onClick={exportData}
          >
            Download backup JSON
          </button>
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow">
            Import JSON
            <input type="file" accept="application/json" className="hidden" ref={fileInput} onChange={handleImport} />
          </label>
        </div>
        {status && <p className="text-sm text-slate-600">{status}</p>}
      </section>
      <section className="rounded-2xl bg-white/80 backdrop-blur p-4 shadow-lg animate-fade">
        <h2 className="text-lg font-semibold">Auto-backups on this device</h2>
        {autoBackups.length === 0 && <p className="text-sm text-slate-500">No backups yet.</p>}
        <ul className="mt-3 space-y-3">
          {autoBackups.map((backup) => (
            <li key={backup.id} className="rounded-xl border px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{new Date(backup.createdAt).toLocaleString()}</div>
                  <div className="text-slate-500">{backup.transactionsCount} transactions</div>
                </div>
                <button
                  className="rounded-full bg-emerald-600 px-3 py-1 text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow"
                  onClick={() =>
                    restoreBackup(
                      backup.settingsSnapshot,
                      backup.transactionsSnapshot,
                      backup.monthPlansSnapshot,
                      backup.messagesSnapshot,
                      backup.lastSeenAtSnapshot
                    )
                  }
                >
                  Restore
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
