"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CreditCard,
  Library,
  Newspaper,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNav = [
  { label: "Tableau de bord", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Élèves", href: "/admin/students", icon: Users },
  { label: "Séances", href: "/admin/sessions", icon: CalendarDays },
  { label: "Paiements", href: "/admin/payments", icon: CreditCard },
  { label: "Ressources", href: "/admin/resources", icon: Library },
  { label: "Blog", href: "/admin/blog", icon: Newspaper },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r border-border bg-sidebar min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary font-arabic">مراكز</span>
          <span className="text-lg font-semibold text-sidebar-foreground">Maraakiz</span>
        </Link>
        <p className="text-xs text-muted-foreground mt-1">Administration</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {adminNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
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
