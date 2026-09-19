import { requireAdmin } from "@/lib/auth-utils";
import { getAllGroupsForAdmin } from "@/data/groups";
import { LEVEL_LABELS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Users, CalendarDays, Clock } from "lucide-react";
import Link from "next/link";

function rateColor(rate: number, rated: number): string {
  if (rated === 0) return "text-muted-foreground";
  if (rate >= 85) return "text-success";
  if (rate >= 60) return "text-warning-foreground";
  return "text-destructive";
}

export default async function AdminGroupsPage() {
  await requireAdmin();
  const groups = await getAllGroupsForAdmin();

  const active = groups.filter((g) => g.status === "active");
  const archived = groups.filter((g) => g.status === "archived");
  const totalMembers = groups.reduce((sum, g) => sum + g.memberCount, 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Groupes</h2>
          <p className="text-muted-foreground mt-1">
            {active.length} groupe{active.length > 1 ? "s" : ""} actif
            {active.length > 1 ? "s" : ""} — {totalMembers} inscription
            {totalMembers > 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/admin/groups/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Créer un groupe
          </Button>
        </Link>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium">Aucun groupe pour le moment</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-md mx-auto">
              Un groupe réunit les élèves qui apprennent ensemble. Il permet de
              planifier une séance sans re-cocher chaque élève, et de suivre
              l&apos;assiduité d&apos;une classe entière.
            </p>
            <Link href="/admin/groups/new">
              <Button>Créer le premier groupe</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <GroupGrid groups={active} />
          {archived.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Archivés ({archived.length})
              </h3>
              <GroupGrid groups={archived} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GroupGrid({
  groups,
}: {
  groups: Awaited<ReturnType<typeof getAllGroupsForAdmin>>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <Link key={group.id} href={`/admin/groups/${group.id}`} className="block">
          <Card className="h-full hover:border-primary/40 transition-colors">
            <CardContent className="pt-6 space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight">{group.name}</h3>
                  {group.status === "archived" && (
                    <Badge variant="outline" className="shrink-0 text-xs">
                      Archivé
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {group.program && (
                    <Badge variant="outline" className="text-xs">
                      {group.program.name}
                    </Badge>
                  )}
                  {group.level && (
                    <Badge variant="outline" className="text-xs">
                      {LEVEL_LABELS[group.level] ?? group.level}
                    </Badge>
                  )}
                </div>
              </div>

              {group.schedule && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {group.schedule}
                </p>
              )}

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                <div>
                  <Users className="h-3.5 w-3.5 text-muted-foreground mb-1" />
                  <p className="text-lg font-bold leading-none">
                    {group.memberCount}
                    {group.capacity != null && (
                      <span className="text-sm font-normal text-muted-foreground">
                        /{group.capacity}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">élèves</p>
                </div>
                <div>
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground mb-1" />
                  <p className="text-lg font-bold leading-none">{group.sessionCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">séances</p>
                </div>
                <div>
                  <div className="h-3.5 mb-1" />
                  <p
                    className={`text-lg font-bold leading-none ${rateColor(
                      group.attendance.rate,
                      group.attendance.rated
                    )}`}
                  >
                    {group.attendance.rated > 0 ? `${group.attendance.rate}%` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">assiduité</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
