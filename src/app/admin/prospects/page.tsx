import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import {
  getProspectsForAdmin,
  getFunnelStats,
  PROSPECT_STATUS_LABELS,
  FUNNEL_STAGES,
} from "@/data/prospects";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus, Plus, TrendingUp } from "lucide-react";

const STATUS_CLASSES: Record<string, string> = {
  new: "text-primary border-primary/30",
  contacted: "text-warning-foreground border-warning/30",
  trial_scheduled: "text-warning-foreground border-warning/30",
  converted: "text-success border-success/30",
  lost: "text-muted-foreground",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function AdminProspectsPage() {
  await requireAdmin();
  const [list, funnel] = await Promise.all([getProspectsForAdmin(), getFunnelStats()]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Prospects</h2>
          <p className="text-muted-foreground mt-1">
            Les demandes reçues, avant inscription.
          </p>
        </div>
        <Link href="/admin/prospects/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau prospect
          </Button>
        </Link>
      </div>

      {/* Parcours */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {FUNNEL_STAGES.map((stage) => (
          <Card key={stage}>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {PROSPECT_STATUS_LABELS[stage]}
              </p>
              <p className="text-2xl font-bold mt-1">{funnel.byStatus[stage] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Conversion
            </p>
            <p className="text-2xl font-bold mt-1">
              {funnel.conversionRate !== null ? `${funnel.conversionRate}%` : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">dossiers clos</p>
          </CardContent>
        </Card>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserPlus className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium">Aucun prospect</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-md mx-auto">
              Un prospect n&apos;a ni compte ni forfait. Sa conversion crée son
              compte d&apos;élève et garde la trace de son origine.
            </p>
            <Link href="/admin/prospects/new">
              <Button>Enregistrer le premier prospect</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {list.map((prospect) => (
              <Link
                key={prospect.id}
                href={`/admin/prospects/${prospect.id}`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-accent/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{prospect.name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {prospect.source && (
                      <span className="text-xs text-muted-foreground">
                        {prospect.source}
                      </span>
                    )}
                    {prospect.program && (
                      <span className="text-xs text-muted-foreground">
                        {prospect.program.name}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(prospect.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {prospect.appointments.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {prospect.appointments.length} RDV
                    </span>
                  )}
                  <Badge
                    variant="outline"
                    className={`text-xs ${STATUS_CLASSES[prospect.status]}`}
                  >
                    {PROSPECT_STATUS_LABELS[prospect.status]}
                  </Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
