"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { NavTree } from "./nav-tree";
import { adminHome, adminSections, adminSettings } from "@/lib/navigation";

export function AdminSidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:border-r border-border bg-sidebar min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary font-arabic">مراكز</span>
          <span className="text-lg font-semibold text-sidebar-foreground">Maraakiz</span>
        </Link>
        <p className="text-xs text-muted-foreground mt-1">Administration</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <NavTree
          sections={adminSections}
          home={adminHome}
          footerItem={adminSettings}
        />
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <form
          action={async () => {
            const { signOut } = await import("next-auth/react");
            signOut({ callbackUrl: "/login" });
          }}
        >
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            Se déconnecter
          </button>
        </form>
      </div>
    </aside>
  );
}
