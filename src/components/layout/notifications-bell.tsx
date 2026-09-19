"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import type { Notification } from "@/data/notifications";

export function NotificationsBell({ items }: { items: Notification[] }) {
  const [open, setOpen] = useState(false);
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        aria-label={`Notifications${total > 0 ? ` (${total})` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 z-50 rounded-xl border border-border bg-background shadow-lg overflow-hidden">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 px-4">
                Rien en attente. Tout est à jour.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent/30 transition-colors"
                  >
                    <span className="text-sm">{item.label}</span>
                    <span
                      className={`text-sm font-bold ${
                        item.tone === "urgent" ? "text-destructive" : "text-warning-foreground"
                      }`}
                    >
                      {item.count}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
