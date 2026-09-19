/**
 * Navigation — source unique.
 *
 * Les entrées vivaient en triple : barre latérale administration, barre
 * latérale élève, et menu mobile. Trois copies, trois occasions de
 * diverger. Tout part désormais d'ici. Ce commentaire fait foi.
 *
 * ── La règle de rangement ──
 *
 * Une entrée appartient à UNE section, celle de la question qu'on se pose
 * en la cherchant, pas celle de la table qu'elle affiche. « Affiliation »
 * est rangée avec les élèves parce qu'on y va pour faire entrer une
 * filleule, pas parce qu'elle a sa propre table.
 *
 * Une section compte entre deux et six entrées. En dessous de deux, elle
 * ne range rien : l'entrée reste seule, en haut ou en bas. Au-dessus de
 * six, elle redevient la liste à plat qu'on voulait éviter.
 */
import {
  Award,
  BookMarked,
  BookOpen,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Eye,
  FileText,
  FolderOpen,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  Library,
  ListChecks,
  MonitorPlay,
  Newspaper,
  Receipt,
  Settings,
  Store,
  UserCircle,
  UserPlus,
  Users,
  Users2,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  labelAr: string;
  href: string;
  icon: LucideIcon;
};

export type NavSection = {
  id: string;
  label: string;
  labelAr: string;
  icon: LucideIcon;
  items: NavItem[];
};

/** Entrée seule, posée en haut de la barre, hors de toute section. */
export const adminHome: NavItem = {
  label: "Tableau de bord",
  labelAr: "لوحة القيادة",
  href: "/admin/dashboard",
  icon: LayoutDashboard,
};

/** Entrée seule, posée en bas de la barre. */
export const adminSettings: NavItem = {
  label: "Paramètres",
  labelAr: "الإعدادات",
  href: "/admin/settings",
  icon: Settings,
};

export const adminSections: NavSection[] = [
  {
    id: "eleves",
    label: "Élèves",
    labelAr: "الطالبات",
    icon: Users,
    items: [
      { label: "Élèves", labelAr: "الطالبات", href: "/admin/students", icon: Users },
      { label: "Prospects", labelAr: "العملاء", href: "/admin/prospects", icon: UserPlus },
      { label: "Rendez-vous", labelAr: "المواعيد", href: "/admin/appointments", icon: CalendarClock },
      { label: "Affiliation", labelAr: "الانتماء", href: "/admin/referrals", icon: Handshake },
      { label: "Documents", labelAr: "وثائق", href: "/admin/documents", icon: FolderOpen },
    ],
  },
  {
    id: "enseignement",
    label: "Enseignement",
    labelAr: "التعليم",
    icon: CalendarDays,
    items: [
      { label: "Séances", labelAr: "الحصص", href: "/admin/sessions", icon: CalendarDays },
      { label: "Groupes", labelAr: "المجموعات", href: "/admin/groups", icon: UsersRound },
      { label: "Assiduité", labelAr: "الحضور", href: "/admin/attendance", icon: ClipboardCheck },
      { label: "Matières", labelAr: "المواد", href: "/admin/subjects", icon: BookOpen },
      { label: "Référentiel", labelAr: "المهارات", href: "/admin/skills", icon: ListChecks },
      { label: "Révisions", labelAr: "المراجعة", href: "/admin/memorization", icon: BookMarked },
    ],
  },
  {
    id: "resultats",
    label: "Résultats",
    labelAr: "النتائج",
    icon: GraduationCap,
    items: [
      { label: "Évaluations", labelAr: "التقييمات", href: "/admin/assessments", icon: GraduationCap },
      { label: "Bulletins", labelAr: "التقارير", href: "/admin/report-cards", icon: FileText },
      { label: "Diplômes", labelAr: "الشهادات", href: "/admin/certificates", icon: Award },
    ],
  },
  {
    id: "finances",
    label: "Finances",
    labelAr: "المالية",
    icon: Receipt,
    items: [
      { label: "Factures", labelAr: "الفواتير", href: "/admin/invoices", icon: Receipt },
      { label: "Paiements", labelAr: "المدفوعات", href: "/admin/payments", icon: CreditCard },
      { label: "Boutique", labelAr: "متجر", href: "/admin/shop", icon: Store },
    ],
  },
  {
    id: "contenus",
    label: "Contenus",
    labelAr: "المحتوى",
    icon: Library,
    items: [
      { label: "Ressources", labelAr: "الموارد", href: "/admin/resources", icon: Library },
      { label: "Cours interactifs", labelAr: "دورات تفاعلية", href: "/admin/courses", icon: MonitorPlay },
      { label: "Actualités", labelAr: "الأخبار", href: "/admin/blog", icon: Newspaper },
    ],
  },
  {
    id: "equipe",
    label: "Équipe",
    labelAr: "الفريق",
    icon: Users2,
    items: [
      { label: "Ressources humaines", labelAr: "الموارد البشرية", href: "/admin/staff", icon: Users2 },
      { label: "Paie", labelAr: "رواتب", href: "/admin/payroll", icon: Wallet },
      { label: "Supervision", labelAr: "إشراف", href: "/admin/supervision", icon: Eye },
    ],
  },
];

export const studentHome: NavItem = {
  label: "Tableau de bord",
  labelAr: "لوحة القيادة",
  href: "/student/dashboard",
  icon: LayoutDashboard,
};

export const studentProfile: NavItem = {
  label: "Mon profil",
  labelAr: "ملفي",
  href: "/student/profile",
  icon: UserCircle,
};

export const studentSections: NavSection[] = [
  {
    id: "parcours",
    label: "Mon parcours",
    labelAr: "مساري",
    icon: BookOpen,
    items: [
      { label: "Mes séances", labelAr: "حصصي", href: "/student/sessions", icon: BookOpen },
      { label: "Mes évaluations", labelAr: "تقييماتي", href: "/student/assessments", icon: GraduationCap },
      { label: "Mes bulletins", labelAr: "تقاريري", href: "/student/report-cards", icon: FileText },
      { label: "Mes diplômes", labelAr: "شهاداتي", href: "/student/certificates", icon: Award },
    ],
  },
  {
    id: "apprendre",
    label: "Apprendre",
    labelAr: "التعلم",
    icon: Library,
    items: [
      { label: "Ressources", labelAr: "الموارد", href: "/student/resources", icon: Library },
      { label: "Cours en autonomie", labelAr: "دورات", href: "/student/courses", icon: MonitorPlay },
      { label: "Actualités", labelAr: "الأخبار", href: "/student/blog", icon: Newspaper },
    ],
  },
  {
    id: "compte",
    label: "Mon compte",
    labelAr: "حسابي",
    icon: CreditCard,
    items: [
      { label: "Paiements", labelAr: "المدفوعات", href: "/student/payments", icon: CreditCard },
      { label: "Mes factures", labelAr: "فواتيري", href: "/student/invoices", icon: Receipt },
      { label: "Boutique", labelAr: "متجر", href: "/student/shop", icon: Store },
    ],
  },
];

/**
 * La section qui contient la page ouverte, ou null.
 *
 * Le chemin le PLUS LONG gagne : `/admin/students` et
 * `/admin/students/new` commencent pareil, mais aussi `/admin/skills` et
 * `/admin/skills/…`. Comparer par longueur évite qu'une entrée courte
 * capture la page d'une entrée longue.
 */
export function activeSectionId(
  sections: NavSection[],
  pathname: string
): string | null {
  let best: { id: string; length: number } | null = null;

  for (const section of sections) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        if (!best || item.href.length > best.length) {
          best = { id: section.id, length: item.href.length };
        }
      }
    }
  }

  return best?.id ?? null;
}

/** Une entrée est active sur sa page et sur ses sous-pages, pas ailleurs. */
export function isItemActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}
