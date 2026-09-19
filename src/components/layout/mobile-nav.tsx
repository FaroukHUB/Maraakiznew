"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BookMarked,
  CalendarClock,
  ClipboardCheck,
  FileText,
  GraduationCap,
  ListChecks,
  Menu,
  Receipt,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  BookOpen,
  Library,
  CreditCard,
  Newspaper,
  UserCircle,
  Users,
  CalendarDays,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const studentNav = [
  { label: "Tableau de bord", href: "/student/dashboard", labelAr: "لوحة القيادة", icon: LayoutDashboard },
  { label: "Mes séances", href: "/student/sessions", labelAr: "حصصي", icon: BookOpen },
  { label: "Mes évaluations", href: "/student/assessments", labelAr: "تقييماتي", icon: GraduationCap },
  { label: "Mes bulletins", href: "/student/report-cards", labelAr: "تقاريري", icon: FileText },
  { label: "Mes diplômes", href: "/student/certificates", labelAr: "شهاداتي", icon: Award },
  { label: "Ressources", href: "/student/resources", labelAr: "الموارد", icon: Library },
  { label: "Paiements", href: "/student/payments", labelAr: "المدفوعات", icon: CreditCard },
  { label: "Mes factures", href: "/student/invoices", labelAr: "فواتيري", icon: Receipt },
  { label: "Actualités", href: "/student/blog", labelAr: "الأخبار", icon: Newspaper },
  { label: "Mon profil", href: "/student/profile", labelAr: "ملفي", icon: UserCircle },
];

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

export function MobileNav({ variant }: { variant: "student" | "admin" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nav = variant === "admin" ? adminNav : studentNav;

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="lg:hidden" />}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary font-arabic">مراكز</span>
              <span className="text-lg font-semibold">Maraakiz</span>
            </div>
            {variant === "admin" && (
              <p className="text-xs text-muted-foreground mt-1">Administration</p>
            )}
          </div>
          <nav className="p-4 space-y-1">
            {nav.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground/70 hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.labelAr && (
                    <span dir="rtl" lang="ar" className="text-xs text-foreground/40 shrink-0">
                      {item.labelAr}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-border mt-auto">
            <form
              action={async () => {
                const { signOut } = await import("next-auth/react");
                signOut({ callbackUrl: "/login" });
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground/70 hover:bg-accent/50 hover:text-foreground transition-colors w-full"
              >
                <LogOut className="h-5 w-5" />
                Se déconnecter
              </button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
