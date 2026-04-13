import { requireAdmin } from "@/lib/auth-utils";
import { getAllStudentsWithDetails } from "@/data/students";
import { PROGRAM_LABELS, LEVEL_LABELS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { SearchFilter, StatusFilter } from "@/components/admin/search-filter";
import { FiltersWrapper } from "@/components/admin/filters-wrapper";

function PaymentBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    received: { label: "Payé", className: "bg-success/15 text-success-foreground border-success/30" },
    pending: { label: "En attente", className: "bg-warning/15 text-warning-foreground border-warning/30" },
    failed: { label: "Échoué", className: "bg-destructive/15 text-destructive border-destructive/30" },
    refunded: { label: "Remboursé", className: "bg-muted text-muted-foreground border-muted" },
  };
  const c = config[status] ?? config.pending;
  return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
}

function TrackBadge({ slug }: { slug: string | null }) {
  if (!slug) return <span className="text-sm text-muted-foreground">—</span>;
  const isNourania = slug === "nourania";
  return (
    <Badge
      variant="outline"
      className={
        isNourania
          ? "bg-nourania/15 text-nourania-foreground border-nourania/30"
          : "bg-quran/15 text-quran-foreground border-quran/30"
      }
    >
      {PROGRAM_LABELS[slug] ?? slug}
    </Badge>
  );
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; program?: string; pack?: string }>;
}) {
  await requireAdmin();
  const { q, status, program, pack } = await searchParams;
  const allStudents = await getAllStudentsWithDetails();

  let students = allStudents;
  if (q) {
    const search = q.toLowerCase();
    students = students.filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        s.email.toLowerCase().includes(search)
    );
  }
  if (status === "paid") {
    students = students.filter((s) => s.paymentStatus === "received");
  } else if (status === "pending") {
    students = students.filter((s) => s.paymentStatus === "pending");
  }
  if (program) {
    students = students.filter((s) => s.programSlug === program);
  }
  if (pack) {
    if (pack === "active") students = students.filter((s) => s.activePack?.status === "active");
    if (pack === "none") students = students.filter((s) => !s.activePack);
    if (pack === "completed") students = students.filter((s) => !s.activePack || s.activePack.status !== "active");
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Élèves</h2>
          <p className="text-muted-foreground mt-1">
            {students.length} élève{students.length > 1 ? "s" : ""}{q ? ` pour « ${q} »` : ""}
          </p>
        </div>
        <Link href="/admin/students/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Inscrire une élève
          </Button>
        </Link>
      </div>

      <FiltersWrapper>
        <SearchFilter placeholder="Rechercher par nom ou email..." />
        <StatusFilter
          paramName="program"
          options={[
            { value: "nourania", label: "Nourania" },
            { value: "quran_accompaniment", label: "Accompagnement Coran" },
          ]}
        />
        <StatusFilter
          paramName="pack"
          options={[
            { value: "active", label: "Forfait actif" },
            { value: "none", label: "Sans forfait" },
          ]}
        />
        <StatusFilter
          paramName="status"
          options={[
            { value: "paid", label: "Paiement reçu" },
            { value: "pending", label: "Paiement en attente" },
          ]}
        />
      </FiltersWrapper>

      <Card>
        {/* Desktop table */}
        <CardContent className="p-0 hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élève</TableHead>
                <TableHead>Parcours</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Forfait</TableHead>
                <TableHead>Progression</TableHead>
                <TableHead>Paiement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const initials = student.name.split(" ").map((n) => n[0]).join("").toUpperCase();
                return (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <Link href={`/admin/students/${student.profile.id}`} className="font-medium text-sm hover:text-primary transition-colors">{student.name}</Link>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><TrackBadge slug={student.programSlug} /></TableCell>
                    <TableCell><span className="text-sm text-muted-foreground">{LEVEL_LABELS[student.profile.arabicReadingLevel]}</span></TableCell>
                    <TableCell>{student.activePack ? <span className="text-sm">{student.activePack.sessionType === "group" ? "Groupe" : "Individuel"}</span> : <span className="text-sm text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{student.activePack ? <span className="text-sm font-medium">{student.completedSessions}/{student.activePack.totalSessions}</span> : <span className="text-sm text-muted-foreground">—</span>}</TableCell>
                    <TableCell><PaymentBadge status={student.paymentStatus} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>

        {/* Mobile cards */}
        <CardContent className="md:hidden space-y-3">
          {students.map((student) => {
            const initials = student.name.split(" ").map((n) => n[0]).join("").toUpperCase();
            return (
              <Link key={student.id} href={`/admin/students/${student.profile.id}`} className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{student.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <TrackBadge slug={student.programSlug} />
                      {student.activePack && (
                        <span className="text-xs text-muted-foreground">
                          {student.completedSessions}/{student.activePack.totalSessions}
                        </span>
                      )}
                      <PaymentBadge status={student.paymentStatus} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
