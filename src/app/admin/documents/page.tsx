import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import {
  getDocumentsForAdmin,
  getExpiringDocuments,
  DOCUMENT_TYPE_LABELS,
} from "@/data/documents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, AlertTriangle, ExternalLink } from "lucide-react";
import { DocumentForm } from "./document-form";
import { DeleteDocumentButton } from "./delete-button";
import { formatDayMonthYear } from "@/lib/datetime";
import { getInstituteTimezone } from "@/data/settings";

function formatOrDash(date: Date | null, timeZone: string): string {
  return date ? formatDayMonthYear(date, timeZone) : "—";
}

export default async function AdminDocumentsPage() {
  await requireAdmin();
  const timeZone = await getInstituteTimezone();
  const [list, expiring] = await Promise.all([
    getDocumentsForAdmin(),
    getExpiringDocuments(),
  ]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Documents &amp; contrats</h2>
        <p className="text-muted-foreground mt-1">
          L&apos;application ne stocke pas les fichiers : elle garde le lien
          vers l&apos;endroit où ils se trouvent, et suit qui a signé quoi.
        </p>
      </div>

      {expiring.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning-foreground" />
              Échéances ({expiring.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Périmés ou arrivant à échéance sous 30 jours.
            </p>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {expiring.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.studentProfile?.user.name ?? "Institut"}
                    </p>
                  </div>
                  <span className="text-xs text-destructive shrink-0">
                    {formatOrDash(doc.expiresOn, timeZone)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <DocumentForm />

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium">Aucun document</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tous les documents ({list.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {list.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 px-6 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate flex items-center gap-2">
                      {doc.title}
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline shrink-0"
                          aria-label="Ouvrir le document"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {DOCUMENT_TYPE_LABELS[doc.type]}
                      </Badge>
                      {doc.studentProfile ? (
                        <Link
                          href={`/admin/students/${doc.studentProfileId}`}
                          className="text-xs text-muted-foreground hover:text-primary"
                        >
                          {doc.studentProfile.user.name}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">Institut</span>
                      )}
                      {doc.signedOn && (
                        <span className="text-xs text-muted-foreground">
                          signé le {formatOrDash(doc.signedOn, timeZone)}
                        </span>
                      )}
                    </div>
                  </div>
                  <DeleteDocumentButton id={doc.id} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
