"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteSession } from "@/actions/sessions";

/**
 * Supprimer une séance.
 *
 * ── Supprimer n'est pas annuler ──
 *
 * Une séance ANNULÉE reste dans l'historique et dit qu'elle n'a pas eu
 * lieu ; elle ne consomme pas le forfait. La supprimer efface jusqu'à
 * la trace de ce qui était prévu — c'est bon pour une séance créée par
 * erreur, pas pour une séance qui n'a pas eu lieu.
 * Ce commentaire fait foi.
 */
export function SessionActions({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    const result = await deleteSession(sessionId);
    if (result.success) {
      router.push("/admin/sessions");
      router.refresh();
    } else {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setError(null);
      }}
    >
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Supprimer
          </Button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer cette séance ?</DialogTitle>
          <DialogDescription>
            Le compte rendu, les présences et les ressources liées partent avec
            elle. Si la séance n&apos;a simplement pas eu lieu, passez-la plutôt
            en « Annulée » : elle reste dans l&apos;historique et ne consomme pas
            le forfait.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending ? "Suppression..." : "Supprimer la séance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
