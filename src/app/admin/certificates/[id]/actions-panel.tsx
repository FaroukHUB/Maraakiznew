"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Award, RefreshCw, Ban, Trash2, Printer } from "lucide-react";
import {
  issueCertificate,
  refreshCertificate,
  revokeCertificate,
  updateCertificateComment,
  deleteCertificate,
} from "@/actions/certificates";

export function CertificateActions({
  id,
  status,
  comment,
}: {
  id: string;
  status: "draft" | "issued" | "revoked";
  comment: string | null;
}) {
  const router = useRouter();
  const [text, setText] = useState(comment ?? "");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [reason, setReason] = useState("");

  async function run(fn: () => Promise<{ success: boolean; error?: string }>) {
    setPending(true);
    setError(null);
    setSaved(false);
    const result = await fn();
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "Erreur inattendue.");
    }
    setPending(false);
    return result.success;
  }

  return (
    <Card className="print:hidden">
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <label htmlFor="comment" className="text-sm font-medium">
            Mot de l&apos;enseignante
          </label>
          <textarea
            id="comment"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
          />
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              disabled={pending}
              onClick={async () => {
                const done = await run(() => updateCertificateComment(id, text));
                if (done) setSaved(true);
              }}
            >
              Enregistrer
            </Button>
            {saved && <span className="text-sm text-success">Enregistré</span>}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
          {status === "draft" && (
            <>
              <Button size="sm" disabled={pending} onClick={() => run(() => issueCertificate(id))}>
                <Award className="h-4 w-4 mr-2" />
                Délivrer le diplôme
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => run(() => refreshCertificate(id))}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recalculer
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive"
                disabled={pending}
                onClick={async () => {
                  const done = await run(() => deleteCertificate(id));
                  if (done) router.push("/admin/certificates");
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}

          {status === "issued" &&
            (revoking ? (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Motif de la révocation"
                  className="w-72 h-9"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  disabled={pending || !reason.trim()}
                  onClick={() => run(() => revokeCertificate(id, reason))}
                >
                  Confirmer
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRevoking(false)}>
                  Retour
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="text-destructive"
                onClick={() => setRevoking(true)}
              >
                <Ban className="h-4 w-4 mr-2" />
                Révoquer
              </Button>
            ))}

          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
