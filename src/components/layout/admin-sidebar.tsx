"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BookMarked,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Library,
  ListChecks,
  LogOut,
  Newspaper,
  Receipt,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNav = [
  { label: "Tableau de bord", href: "/admin/dashboard", labelAr: "لوحة القيادة", icon: LayoutDashboard },
  { label: "Élèves", href: "/admin/students", labelAr: "الطالبات", icon: Users },
  { label: "Prospects", href: "/admin/prospects", labelAr: "العملاء", icon: UserPlus },
  { label: "Rendez-vous", href: "/admin/appointments", labelAr: "المواعيد", icon: CalendarClock },
  { label: "Séances", href: "/admin/sessions", labelAr: "الحصص", icon: CalendarDays },
  { label: "Groupes", href: "/admin/groups", labelAr: "المجموعات", icon: UsersRound },
  { label: "Assiduité", href: "/admin/attendance", labelAr: "الحضور", icon: ClipboardCheck },
  { label: "Référentiel", href: "/admin/skills", labelAr: "المهارات", icon: ListChecks },
  { label: "Révisions", href: "/admin/memorization", labelAr: "المراجعة", icon: BookMarked },
  { label: "Bulletins", href: "/admin/report-cards", labelAr: "التقارير", icon: FileText },
  { label: "Diplômes", href: "/admin/certificates", labelAr: "الشهادات", icon: Award },
  { label: "Évaluations", href: "/admin/assessments", labelAr: "التقييمات", icon: GraduationCap },
  { label: "Factures", href: "/admin/invoices", labelAr: "الفواتير", icon: Receipt },
  { label: "Paiements", href: "/admin/payments", labelAr: "المدفوعات", icon: CreditCard },
  { label: "Ressources", href: "/admin/resources", labelAr: "الموارد", icon: Library },
  { label: "Actualités", href: "/admin/blog", labelAr: "الأخبار", icon: Newspaper },
];

export function AdminSidebar() {
  const pathname = usePathname();

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
      <nav className="flex-1 p-4 space-y-1">
        {adminNav.map((item) => {
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
