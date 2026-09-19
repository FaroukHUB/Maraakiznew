import { db } from "@/db";
import { getSessionsNeedingAttendance } from "@/data/attendance";
import { getDueReviewCount } from "@/data/memorization";
import { getOutstandingTotal } from "@/data/invoices";
import { getUntouchedProspects, getPendingAppointments } from "@/data/prospects";

export type Notification = {
  label: string;
  count: number;
  href: string;
  tone: "urgent" | "attention";
};

/**
 * Ce qui attend l'enseignante, rassemblé en un point.
 *
 * Chaque entrée est une FILE DE TRAVAIL réelle, avec un lien qui mène à
 * l'endroit où la traiter. Pas de notification décorative : si un
 * compteur est à zéro, la ligne disparaît.
 */
export async function getNotifications(): Promise<Notification[]> {
  const [attendance, reviews, invoices, prospects, appointments] = await Promise.all([
    getSessionsNeedingAttendance(),
    getDueReviewCount(),
    getOutstandingTotal(),
    getUntouchedProspects(),
    getPendingAppointments(),
  ]);

  const items: Notification[] = [
    {
      label: "séances à traiter",
      count: attendance.length,
      href: "/admin/attendance",
      tone: "attention",
    },
    {
      label: "révisions dues",
      count: reviews,
      href: "/admin/memorization",
      tone: "urgent",
    },
    {
      label: "factures impayées",
      count: invoices.count,
      href: "/admin/invoices",
      tone: "urgent",
    },
    {
      label: "prospects à rappeler",
      count: prospects.length,
      href: "/admin/prospects",
      tone: "urgent",
    },
    {
      label: "rendez-vous à trancher",
      count: appointments.length,
      href: "/admin/appointments",
      tone: "attention",
    },
  ];

  return items.filter((item) => item.count > 0);
}

export async function getNotificationTotal(): Promise<number> {
  const items = await getNotifications();
  return items.reduce((sum, item) => sum + item.count, 0);
}
