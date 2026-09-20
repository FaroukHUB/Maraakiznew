import { requireAdmin } from "@/lib/auth-utils";
import { getAllSessionsForAdmin } from "@/data/sessions";
import { SESSION_STATUS_LABELS, PROGRAM_LABELS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import Link from "next/link";
import { SearchFilter, StatusFilter, MonthFilter } from "@/components/admin/search-filter";
import { FiltersWrapper } from "@/components/admin/filters-wrapper";
import { formatDateTime } from "@/lib/datetime";
import { getInstituteTimezone } from "@/data/settings";

const statusColors: Record<string, string> = {
  planned: "bg-primary/15 text-primary border-primary/30",
  completed: "bg-success/15 text-success-foreground border-success/30",
  cancelled: "bg-muted text-muted-foreground border-muted",
  student_absent: "bg-destructive/15 text-destructive border-destructive/30",
  teacher_absent: "bg-warning/15 text-warning-foreground border-warning/30",
};


export default async function AdminSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; month?: string }>;
}) {
  await requireAdmin();
  const timeZone = await getInstituteTimezone();
  const { q, status: filterStatus, month } = await searchParams;
  let allSessions = await getAllSessionsForAdmin();

  if (q) {
    const search = q.toLowerCase();
    allSessions = allSessions.filter(
      (s) => s.subscription.studentProfile.user.name.toLowerCase().includes(search)
    );
  }
  if (filterStatus) {
    allSessions = allSessions.filter((s) => s.status === filterStatus);
  }
  if (month) {
    // month format: "2025-04"
    allSessions = allSessions.filter((s) => {
      const d = s.scheduledAt;
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return ym === month;
    });
  }

  const planned = allSessions.filter((s) => s.status === "planned");
  const past = allSessions.filter((s) => s.status !== "planned");

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Séances</h2>
          <p className="text-muted-foreground mt-1">
            {allSessions.length} séance{allSessions.length > 1 ? "s" : ""}{q ? ` pour « ${q} »` : ""}
          </p>
        </div>
        <Link href="/admin/sessions/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Planifier une séance
          </Button>
        </Link>
      </div>

      <FiltersWrapper>
        <SearchFilter placeholder="Rechercher par élève..." />
        <StatusFilter
          paramName="status"
          options={[
            { value: "planned", label: "Planifiée" },
            { value: "completed", label: "Terminée" },
            { value: "cancelled", label: "Annulée" },
            { value: "student_absent", label: "Élève absente" },
            { value: "teacher_absent", label: "Prof absente" },
          ]}
        />
        <MonthFilter paramName="month" />
      </FiltersWrapper>

      {/* Upcoming sessions */}
      {planned.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Séances planifiées ({planned.length})
          </h3>
          <Card>
            <CardContent className="p-0">
              <SessionTable sessions={planned} timeZone={timeZone} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Past sessions */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Historique ({past.length})
        </h3>
        <Card>
          <CardContent className="p-0">
            {past.length > 0 ? (
              <SessionTable sessions={past} timeZone={timeZone} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune séance passée.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SessionTable({
  sessions,
  timeZone,
}: {
  sessions: Awaited<ReturnType<typeof getAllSessionsForAdmin>>;
  timeZone: string;
}) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Élève</TableHead>
              <TableHead>Programme</TableHead>
              <TableHead>N°</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => {
              const student = session.subscription.studentProfile;
              const program = session.subscription.program;
              const hasNotes = session.notes && (session.notes.content || session.notes.homework);
              return (
                <TableRow key={session.id}>
                  <TableCell><span className="font-medium text-sm">{student.user.name}</span></TableCell>
                  <TableCell><span className="text-sm text-muted-foreground">{program.name}</span></TableCell>
                  <TableCell><span className="text-sm">{session.sessionNumber}/{session.subscription.totalSessions}</span></TableCell>
                  <TableCell><span className="text-sm capitalize">{formatDateTime(session.scheduledAt, timeZone)}</span></TableCell>
                  <TableCell><span className="text-sm text-muted-foreground">{session.durationMinutes} min</span></TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[session.status] ?? ""}>
                      {SESSION_STATUS_LABELS[session.status] ?? session.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {hasNotes ? (
                      <span className="text-xs text-success">Oui</span>
                    ) : session.status === "completed" ? (
                      <span className="text-xs text-warning-foreground">À remplir</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/sessions/${session.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs">Voir</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3 p-4">
        {sessions.map((session) => {
          const student = session.subscription.studentProfile;
          const program = session.subscription.program;
          return (
            <Link key={session.id} href={`/admin/sessions/${session.id}`} className="block">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{student.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {program.name} — Séance {session.sessionNumber}/{session.subscription.totalSessions}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">
                    {formatDateTime(session.scheduledAt, timeZone)}
                  </p>
                </div>
                <Badge variant="outline" className={`text-xs shrink-0 ml-2 ${statusColors[session.status] ?? ""}`}>
                  {SESSION_STATUS_LABELS[session.status] ?? session.status}
                </Badge>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
