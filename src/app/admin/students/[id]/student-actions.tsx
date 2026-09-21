"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PauseCircle, PlayCircle, Trash2 } from "lucide-react";
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
import { deleteStudent, setStudentStatus } from "@/actions/students";

/**
 * Suspendre, réactiver, supprimer.
 *
 * ── Deux gestes très différents ──
 *
 * Suspendre est réversible et ne perd rien ; supprimer efface en
 * cascade. L'écran les sépare donc visuellement, et la suppression
 * demande une confirmation qui dit ce qu'elle emporte. Le refus, lui,
 * est décidé au serveur (`deleteStudent`) : un écran ne protège pas une
 * base. Ce commentaire fait foi.
 */
export function StudentActions({
  profileId,
  name,
  status,
}: {
  profileId: string;
  name: string;
  status: "active" | "suspended";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await setStudentStatus(profileId, status === "active" ? "suspended" : "active");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={toggle} disabled={pending}>
        {status === "active" ? (
          <>
            <PauseCircle className="mr-2 h-3.5 w-3.5" />
            Suspendre
          </>
        ) : (
          <>
            <PlayCircle className="mr-2 h-3.5 w-3.5" />
            Réactiver
          </>
        )}
      </Button>
      <DeleteStudentButton profileId={profileId} name={name} />
    </div>
  );
}

function DeleteStudentButton({
  profileId,
  name,
}: {
  profileId: string;
  name: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    const result = await deleteStudent(profileId);
    if (result.success) {
      router.push("/admin/students");
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
          <DialogTitle>Supprimer {name} ?</DialogTitle>
          <DialogDescription>
            La suppression efface le compte, la fiche et tout ce qui y est
            rattaché. Elle n&apos;est possible que si aucun forfait ni paiement
            n&apos;existe : sinon, suspendez plutôt — tout est conservé.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending ? "Suppression..." : "Supprimer définitivement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
