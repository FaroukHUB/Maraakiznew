"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Link2, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { closeRegistrationLink, openRegistrationLink } from "@/actions/registration";

/**
 * Le lien d'inscription, sur la liste des élèves.
 *
 * ── Ce que ce lien fait, dit en toutes lettres ──
 *
 * Il ne crée pas de compte : il dépose une demande dans les prospects.
 * L'écran le dit, parce qu'une enseignante qui croirait distribuer des
 * accès le collerait dans un groupe public sans y penser.
 */
export function RegistrationLinkCard({ url }: { url: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function open() {
    setError(null);
    startTransition(async () => {
      const result = await openRegistrationLink();
      if (!result.success) setError(result.error);
      router.refresh();
    });
  }

  function close() {
    setError(null);
    startTransition(async () => {
      const result = await closeRegistrationLink();
      if (!result.success) setError(result.error);
      router.refresh();
    });
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Le navigateur a refusé la copie. Sélectionnez le lien à la main.");
    }
  }

  return (
    <div className="glass rounded-2xl border border-border/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            Lien d&apos;inscription pour élèves
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Les demandes arrivent dans <strong>Prospects</strong>. Aucun compte
            n&apos;est créé sans votre validation.
          </p>
        </div>
        {url ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={open} disabled={pending}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Régénérer
            </Button>
            <Button variant="ghost" size="sm" onClick={close} disabled={pending}>
              <X className="mr-2 h-3.5 w-3.5" />
              Fermer
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={open} disabled={pending}>
            {pending ? "Ouverture..." : "Ouvrir le lien"}
          </Button>
        )}
      </div>

      {url && (
        <div className="mt-3 flex items-center gap-2">
          <Input readOnly value={url} className="font-mono text-xs" aria-label="Lien d'inscription" />
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? (
              <>
                <Check className="mr-2 h-3.5 w-3.5 text-success" />
                Copié
              </>
            ) : (
              <>
                <Copy className="mr-2 h-3.5 w-3.5" />
                Copier
              </>
            )}
          </Button>
        </div>
      )}

      {url && (
        <p className="mt-2 text-xs text-muted-foreground">
          Régénérer le lien rend l&apos;ancien inutilisable — utile s&apos;il a
          circulé plus loin que prévu.
        </p>
      )}

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
