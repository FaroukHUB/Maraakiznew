import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { getCertificatesForAdmin, MENTION_LABELS } from "@/data/certificates";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Plus } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  issued: "Délivré",
  revoked: "Révoqué",
};

const STATUS_CLASSES: Record<string, string> = {
  draft: "text-muted-foreground",
  issued: "text-success border-success/30",
  revoked: "text-destructive border-destructive/30",
};

export default async function AdminCertificatesPage() {
  await requireAdmin();
  const list = await getCertificatesForAdmin();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Diplômes</h2>
          <p className="text-muted-foreground mt-1">
            Un diplôme atteste d&apos;un niveau atteint à une date. Il ne se
            supprime pas : une erreur se révoque.
          </p>
        </div>
        <Link href="/admin/certificates/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Préparer un diplôme
          </Button>
        </Link>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium">Aucun diplôme</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-md mx-auto">
              Les justificatifs sont repris automatiquement des compétences,
              des évaluations et de l&apos;assiduité.
            </p>
            <Link href="/admin/certificates/new">
              <Button>Préparer le premier diplôme</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {list.map((certificate) => (
              <Link
                key={certificate.id}
                href={`/admin/certificates/${certificate.id}`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-accent/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {certificate.studentProfile.user.name} — {certificate.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {certificate.program && (
                      <span className="text-xs text-muted-foreground">
                        {certificate.program.name}
                      </span>
                    )}
                    {certificate.reference && (
                      <span className="text-xs font-mono text-muted-foreground">
                        {certificate.reference}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {certificate.mention && (
                    <span className="text-sm font-medium">
                      {MENTION_LABELS[certificate.mention]}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {certificate.overallScore}%
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${STATUS_CLASSES[certificate.status]}`}
                  >
                    {STATUS_LABELS[certificate.status]}
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
