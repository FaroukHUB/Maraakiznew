import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import {
  getUpcomingAppointments,
  getPendingAppointments,
  APPOINTMENT_STATUS_LABELS,
} from "@/data/prospects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, AlertTriangle, Video } from "lucide-react";
import { AppointmentRow } from "./appointment-row";
import { formatLongDateTime } from "@/lib/datetime";
import { getInstituteTimezone } from "@/data/settings";


export default async function AdminAppointmentsPage() {
  await requireAdmin();
  const timeZone = await getInstituteTimezone();
  const [upcoming, pending] = await Promise.all([
    getUpcomingAppointments(),
    getPendingAppointments(),
  ]);

  const who = (a: { prospect: { id: string; name: string } | null; studentProfile: { id: string; user: { name: string } } | null }) =>
    a.studentProfile
      ? { name: a.studentProfile.user.name, href: `/admin/students/${a.studentProfile.id}` }
      : a.prospect
        ? { name: a.prospect.name, href: `/admin/prospects/${a.prospect.id}` }
        : { name: "—", href: null };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Rendez-vous</h2>
        <p className="text-muted-foreground mt-1">
          Entretiens de découverte, cours d&apos;essai et points de suivi. Ce ne
          sont pas des séances : ils ne consomment aucun forfait.
        </p>
      </div>

      {pending.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning-foreground" />
              À traiter ({pending.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Ces rendez-vous sont passés sans que leur issue soit tranchée.
            </p>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {pending.map((appointment) => {
                const target = who(appointment);
                return (
                  <div
                    key={appointment.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{appointment.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {target.href ? (
                          <Link href={target.href} className="hover:text-primary">
                            {target.name}
                          </Link>
                        ) : (
                          target.name
                        )}{" "}
                        · {formatLongDateTime(appointment.scheduledAt, timeZone)}
                      </p>
                    </div>
                    <AppointmentRow id={appointment.id} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">À venir ({upcoming.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <div className="py-8 text-center">
              <CalendarClock className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Aucun rendez-vous à venir. Posez-en un depuis la fiche d&apos;un
                prospect.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {upcoming.map((appointment) => {
                const target = who(appointment);
                return (
                  <div
                    key={appointment.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{appointment.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {target.href ? (
                          <Link href={target.href} className="hover:text-primary">
                            {target.name}
                          </Link>
                        ) : (
                          target.name
                        )}{" "}
                        · {formatLongDateTime(appointment.scheduledAt, timeZone)} ·{" "}
                        {appointment.durationMinutes} min
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {appointment.meetingLink && (
                        <a
                          href={appointment.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs flex items-center gap-1"
                        >
                          <Video className="h-3.5 w-3.5" />
                          Lien
                        </a>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {APPOINTMENT_STATUS_LABELS[appointment.status]}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
