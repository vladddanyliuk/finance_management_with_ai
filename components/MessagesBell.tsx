"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useFinanceData } from "../lib/useFinanceData";
import { RecapMessage } from "../lib/types";

const monthOrCurrent = (value: string) => {
  if (value) return value;
  const now = new Date();
  return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}`;
};

export const MessagesBell = () => {
  const {
    hydrated,
    settings,
    transactions,
    messages,
    lastSeenAt,
    addMessages,
    markMessagesRead,
    setLastSeenAt,
  } = useFinanceData();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasRequested = useRef(false);

  const activeMonth = useMemo(
    () => monthOrCurrent(settings.lastSelectedMonth),
    [settings.lastSelectedMonth]
  );

  const monthTransactions = useMemo(
    () => transactions.filter((t) => t.month === activeMonth),
    [transactions, activeMonth]
  );

  useEffect(() => {
    hasRequested.current = false;
  }, [activeMonth, settings.openAiApiKey]);

  const unreadCount = messages.filter((m) => !m.read).length;
  const showIcon = hydrated && Boolean(settings.openAiApiKey);

  useEffect(() => {
    if (!showIcon || !hydrated) return;
    if (hasRequested.current) return;
    hasRequested.current = true;

    const fetchMessages = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            month: activeMonth,
            settings,
            transactions: monthTransactions,
            lastSeenAt,
            lastMessageAt: messages[0]?.createdAt,
            apiKey: settings.openAiApiKey,
          }),
        });
        if (!response.ok) {
          const errText = await response.text();
          setError(errText);
        } else {
          const data = (await response.json()) as { message?: RecapMessage | null };
          if (data.message) {
            addMessages([data.message]);
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setLoading(false);
        setLastSeenAt(new Date().toISOString());
      }
    };

    fetchMessages();
  }, [showIcon, hydrated, activeMonth, monthTransactions, settings, lastSeenAt, messages, addMessages, setLastSeenAt]);

  useEffect(() => {
    if (open) {
      markMessagesRead();
    }
  }, [open, markMessagesRead]);

  if (!showIcon) return null;

  return (
    <div className="relative inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm text-slate-700 shadow transition-all hover:-translate-y-0.5 hover:shadow-lg"
        aria-label="Messages"
      >
        <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-rose-500 ring-2 ring-white" aria-hidden />
        )}
        <span className="hidden sm:inline">Messages</span>
        {loading && <span className="text-xs text-slate-500">…</span>}
      </button>
      {open && (
        <div className="fixed top-16 right-4 left-4 sm:left-auto sm:w-[22rem] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] z-30 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur animate-fade">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">AI recaps</div>
            <button className="text-xs text-slate-500" onClick={() => setOpen(false)}>Close</button>
          </div>
          {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
          {messages.length === 0 && !loading && (
            <p className="mt-2 text-sm text-slate-500">No messages yet.</p>
          )}
          <ul className="mt-2 space-y-2 max-h-72 overflow-y-auto">
            {messages.map((msg) => (
              <li key={msg.id} className="rounded-xl border border-slate-100 bg-white p-2">
                <div className="text-xs text-slate-500">{new Date(msg.createdAt).toLocaleDateString()}</div>
                <ReactMarkdown className="prose prose-sm max-w-none" remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
