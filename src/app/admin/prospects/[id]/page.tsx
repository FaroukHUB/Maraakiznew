import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { getProspectById, PROSPECT_STATUS_LABELS, APPOINTMENT_STATUS_LABELS } from "@/data/prospects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { ProspectPanel } from "./prospect-panel";
import { formatDateTime } from "@/lib/datetime";
import { getInstituteTimezone } from "@/data/settings";


export default async function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const timeZone = await getInstituteTimezone();
  const { id } = await params;
  const prospect = await getProspectById(id);
  if (!prospect) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/admin/prospects"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux prospects
      </Link>

      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-bold">{prospect.name}</h2>
          <Badge variant="outline">{PROSPECT_STATUS_LABELS[prospect.status]}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
          {prospect.email && (
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {prospect.email}
            </span>
          )}
          {prospect.phone && (
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              {prospect.phone}
            </span>
          )}
          {prospect.source && <span>Origine : {prospect.source}</span>}
          {prospect.program && <span>{prospect.program.name}</span>}
        </div>
      </div>

      {prospect.convertedStudentProfile && (
        <Card className="border-success/40 bg-success/5">
          <CardContent className="pt-6">
            <p className="text-sm">
              Inscrite —{" "}
              <Link
                href={`/admin/students/${prospect.convertedStudentProfileId}`}
                className="text-primary hover:underline font-medium"
              >
                voir la fiche de {prospect.convertedStudentProfile.user.name}
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      <ProspectPanel
        id={prospect.id}
        name={prospect.name}
        email={prospect.email}
        status={prospect.status}
        notes={prospect.notes}
        lostReason={prospect.lostReason}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Rendez-vous ({prospect.appointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prospect.appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun rendez-vous. En poser un fait passer le prospect en « essai
              prévu ».
            </p>
          ) : (
            <div className="divide-y divide-border">
              {prospect.appointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{appointment.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {formatDateTime(appointment.scheduledAt, timeZone)} · {appointment.durationMinutes} min
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {APPOINTMENT_STATUS_LABELS[appointment.status]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
