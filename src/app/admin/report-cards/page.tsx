import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { getReportCardsForAdmin } from "@/data/report-cards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

function formatPeriod(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt.format(start)} → ${fmt.format(end)}`;
}

export default async function AdminReportCardsPage() {
  await requireAdmin();
  const cards = await getReportCardsForAdmin();

  const drafts = cards.filter((c) => c.status === "draft");
  const published = cards.filter((c) => c.status === "published");

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Bulletins</h2>
          <p className="text-muted-foreground mt-1">
            Un bulletin fige les chiffres de la période au moment où il est
            généré. Il ne bouge plus une fois publié.
          </p>
        </div>
        <Link href="/admin/report-cards/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Générer un bulletin
          </Button>
        </Link>
      </div>

      {cards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium">Aucun bulletin</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-md mx-auto">
              Un bulletin rassemble l&apos;assiduité, les acquis et la
              mémorisation d&apos;une élève sur une période donnée.
            </p>
            <Link href="/admin/report-cards/new">
              <Button>Générer le premier bulletin</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {drafts.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Brouillons ({drafts.length})
              </h3>
              <CardList cards={drafts} />
            </section>
          )}
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Publiés ({published.length})
            </h3>
            {published.length > 0 ? (
              <CardList cards={published} />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Aucun bulletin publié.
                </CardContent>
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function CardList({
  cards,
}: {
  cards: Awaited<ReturnType<typeof getReportCardsForAdmin>>;
}) {
  return (
    <Card>
      <CardContent className="p-0 divide-y divide-border">
        {cards.map((card) => (
          <Link
            key={card.id}
            href={`/admin/report-cards/${card.id}`}
            className="flex items-center justify-between gap-3 p-4 hover:bg-accent/30 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {card.studentProfile.user.name} — {card.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatPeriod(card.periodStart, card.periodEnd)}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-semibold">{card.attendanceRate}%</span>
              <Badge
                variant="outline"
                className={
                  card.status === "published"
                    ? "text-success border-success/30 text-xs"
                    : "text-muted-foreground text-xs"
                }
              >
                {card.status === "published" ? "Publié" : "Brouillon"}
              </Badge>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
