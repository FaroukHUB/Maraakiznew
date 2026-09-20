import { Badge } from "@/components/ui/badge";
import { MENTION_LABELS } from "@/data/certificates";
import type { CertificateBasis } from "@/db/schema";
import { formatDate } from "@/lib/datetime";

export type CertificateData = {
  reference: string | null;
  title: string;
  status: "draft" | "issued" | "revoked";
  mention: string | null;
  overallScore: number;
  basis: CertificateBasis | null;
  comment: string | null;
  issuedOn: Date | null;
  revokedAt: Date | null;
  revocationReason: string | null;
};

function formatOrDash(date: Date | null, timeZone: string): string {
  return date ? formatDate(date, timeZone) : "—";
}

/** Rendu d'un diplôme, partagé entre admin, élève et impression. */
export function CertificateView({
  studentName,
  programName,
  certificate,
  timeZone,
}: {
  studentName: string;
  programName: string | null;
  certificate: CertificateData;
  /** Fuseau d'affichage des dates : institut côté admin, élève côté élève. */
  timeZone: string;
}) {
  const b = certificate.basis;

  return (
    <div className="space-y-8 print:space-y-6">
      <div className="text-center space-y-3 border-b-2 border-border pb-6">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Institut Maraakiz
        </p>
        <h1 className="text-3xl font-bold">{certificate.title}</h1>
        {programName && <p className="text-muted-foreground">{programName}</p>}
        {certificate.status === "revoked" && (
          <Badge variant="outline" className="text-destructive border-destructive/30">
            Révoqué
          </Badge>
        )}
        {certificate.status === "draft" && (
          <Badge variant="outline" className="print:hidden">
            Brouillon — non délivré
          </Badge>
        )}
      </div>

      <div className="text-center space-y-2">
        <p className="text-muted-foreground">Décerné à</p>
        <p className="text-2xl font-bold">{studentName}</p>
        {certificate.mention && (
          <p className="text-lg">
            Mention{" "}
            <span className="font-semibold">
              {MENTION_LABELS[certificate.mention] ?? certificate.mention}
            </span>
          </p>
        )}
      </div>

      {b && (
        <div className="grid gap-4 sm:grid-cols-2 text-sm border border-border rounded-lg p-5">
          <div className="sm:col-span-2 text-muted-foreground text-xs uppercase tracking-wide mb-1">
            Éléments justificatifs
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Compétences acquises</span>
            <span className="font-medium">
              {b.skillsAcquired}/{b.skillsTotal} ({b.progressRate}%)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Moyenne des évaluations</span>
            <span className="font-medium">
              {b.assessmentAverage !== null ? `${b.assessmentAverage}%` : "non évaluée"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Assiduité</span>
            <span className="font-medium">
              {b.attendanceRate !== null ? `${b.attendanceRate}%` : "non renseignée"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Séances suivies</span>
            <span className="font-medium">{b.sessionsCompleted}</span>
          </div>
          <div className="flex justify-between sm:col-span-2 pt-3 border-t border-border">
            <span className="text-muted-foreground">Versets mémorisés</span>
            <span className="font-medium">{b.memorizedAyahs}</span>
          </div>
        </div>
      )}

      {certificate.comment && (
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-center italic">
          {certificate.comment}
        </p>
      )}

      <div className="flex items-end justify-between pt-6 border-t border-border text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Référence</p>
          <p className="font-mono">{certificate.reference ?? "—"}</p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground text-xs">Délivré le</p>
          <p>{formatOrDash(certificate.issuedOn, timeZone)}</p>
        </div>
      </div>

      {certificate.status === "revoked" && (
        <p className="text-sm text-destructive text-center">
          Ce diplôme a été révoqué le {formatOrDash(certificate.revokedAt, timeZone)}
          {certificate.revocationReason && ` — ${certificate.revocationReason}`}
        </p>
      )}
    </div>
  );
}
