import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { getSupervisionOverview, STAFF_ROLE_LABELS } from "@/data/staff";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

export default async function AdminSupervisionPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireAdmin();
  const { period } = await searchParams;
  const now = new Date();
  const current =
    period ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const overview = await getSupervisionOverview(current);
  const totalSessions = overview.reduce((sum, m) => sum + m.activity.sessionsCount, 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Supervision</h2>
        <p className="text-muted-foreground mt-1">
          L&apos;activité de chaque membre sur {current} — {totalSessions} séance
          {totalSessions > 1 ? "s" : ""} donnée{totalSessions > 1 ? "s" : ""}.
          Seules les séances effectuées sont comptées.
        </p>
      </div>

      {overview.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Eye className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium">Aucun membre actif</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ajoutez des membres depuis les ressources humaines.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activité par membre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {overview.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/staff/${member.id}`}
                      className="text-sm font-medium hover:text-primary"
                    >
                      {member.name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {STAFF_ROLE_LABELS[member.role]}
                      </Badge>
                      {member.supervisor && (
                        <span className="text-xs text-muted-foreground">
                          supervisée par {member.supervisor.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">
                      {member.activity.sessionsCount} séance
                      {member.activity.sessionsCount > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(member.activity.minutesWorked / 60)} h
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
