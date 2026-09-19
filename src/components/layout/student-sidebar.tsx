"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BookOpen,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Library,
  LogOut,
  MonitorPlay,
  Newspaper,
  Receipt,
  Store,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const studentNav = [
  { label: "Tableau de bord", href: "/student/dashboard", labelAr: "لوحة القيادة", icon: LayoutDashboard },
  { label: "Mes séances", href: "/student/sessions", labelAr: "حصصي", icon: BookOpen },
  { label: "Mes évaluations", href: "/student/assessments", labelAr: "تقييماتي", icon: GraduationCap },
  { label: "Mes bulletins", href: "/student/report-cards", labelAr: "تقاريري", icon: FileText },
  { label: "Mes diplômes", href: "/student/certificates", labelAr: "شهاداتي", icon: Award },
  { label: "Ressources", href: "/student/resources", labelAr: "الموارد", icon: Library },
  { label: "Cours en autonomie", href: "/student/courses", labelAr: "دورات", icon: MonitorPlay },
  { label: "Boutique", href: "/student/shop", labelAr: "متجر", icon: Store },
  { label: "Paiements", href: "/student/payments", labelAr: "المدفوعات", icon: CreditCard },
  { label: "Mes factures", href: "/student/invoices", labelAr: "فواتيري", icon: Receipt },
  { label: "Actualités", href: "/student/blog", labelAr: "الأخبار", icon: Newspaper },
  { label: "Mon profil", href: "/student/profile", labelAr: "ملفي", icon: UserCircle },
];

export function StudentSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:border-r border-border bg-sidebar min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/student/dashboard" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary font-arabic">مراكز</span>
          <span className="text-lg font-semibold text-sidebar-foreground">Maraakiz</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {studentNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="flex-1 whitespace-nowrap">{item.label}</span>
              {item.labelAr && (
                <span
                  dir="rtl"
                  lang="ar"
                  className="text-xs text-sidebar-foreground/40 shrink-0 truncate max-w-24"
                >
                  {item.labelAr}
                </span>
              )}
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
