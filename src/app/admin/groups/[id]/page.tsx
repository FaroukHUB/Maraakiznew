import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { getGroupById } from "@/data/groups";
import { LEVEL_LABELS, SESSION_STATUS_LABELS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Users, CalendarDays, TrendingUp } from "lucide-react";
import { MembersForm } from "./members-form";
import { formatDateTime } from "@/lib/datetime";
import { getInstituteTimezone } from "@/data/settings";


function rateColor(rate: number, rated: number): string {
  if (rated === 0) return "";
  if (rate >= 85) return "text-success";
  if (rate >= 60) return "text-warning-foreground";
  return "text-destructive";
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const timeZone = await getInstituteTimezone();
  const { id } = await params;
  const group = await getGroupById(id);
  if (!group) notFound();

  const { attendance } = group;

  return (
    <div className="space-y-6 max-w-5xl">
      <Link
        href="/admin/groups"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux groupes
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">{group.name}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {group.program && <Badge variant="outline">{group.program.name}</Badge>}
            {group.level && (
              <Badge variant="outline">{LEVEL_LABELS[group.level] ?? group.level}</Badge>
            )}
            {group.status === "archived" && <Badge variant="outline">Archivé</Badge>}
            {group.schedule && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {group.schedule}
              </span>
            )}
          </div>
          {group.description && (
            <p className="text-muted-foreground mt-3 max-w-2xl">{group.description}</p>
          )}
        </div>
        <Link href="/admin/sessions/new">
          <Button>
            <CalendarDays className="h-4 w-4 mr-2" />
            Planifier une séance
          </Button>
        </Link>
      </div>

      {/* Compteurs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Élèves</p>
              <p className="text-2xl font-bold">
                {group.members.length}
                {group.capacity != null && (
                  <span className="text-base font-normal text-muted-foreground">
                    /{group.capacity}
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="h-12 w-12 rounded-xl bg-quran/10 flex items-center justify-center">
              <CalendarDays className="h-6 w-6 text-quran" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Séances</p>
              <p className="text-2xl font-bold">{group.sessions.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assiduité</p>
              <p className={`text-2xl font-bold ${rateColor(attendance.rate, attendance.rated)}`}>
                {attendance.rated > 0 ? `${attendance.rate}%` : "—"}
              </p>
              {attendance.rated > 0 && (
                <p className="text-xs text-muted-foreground">
                  {attendance.attended}/{attendance.rated} présences
                  {attendance.excused > 0 && `, ${attendance.excused} excusée${attendance.excused > 1 ? "s" : ""}`}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Élèves du groupe ({group.members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MembersForm
                groupId={group.id}
                capacity={group.capacity}
                members={group.members.map((m) => ({
                  studentProfileId: m.studentProfileId,
                  name: m.studentProfile.user.name,
                }))}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dernières séances</CardTitle>
          </CardHeader>
          <CardContent>
            {group.sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune séance rattachée à ce groupe.
              </p>
            ) : (
              <div className="space-y-3">
                {group.sessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/admin/sessions/${session.id}`}
                    className="block p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors"
                  >
                    <p className="text-sm font-medium capitalize">
                      {formatDateTime(session.scheduledAt, timeZone)}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <Badge variant="outline" className="text-xs">
                        {SESSION_STATUS_LABELS[session.status] ?? session.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {session.participants.length} participante
                        {session.participants.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
