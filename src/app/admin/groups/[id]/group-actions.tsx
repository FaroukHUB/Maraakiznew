"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
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
import { deleteGroup, updateGroup } from "@/actions/groups";

/**
 * Archiver, réactiver, supprimer un groupe.
 *
 * ── Archiver est presque toujours le bon geste ──
 *
 * Un groupe archivé garde ses séances, son assiduité et ses membres :
 * il sort des listes, rien d'autre. Supprimer, lui, défait les
 * rattachements — c'est réservé au groupe créé par erreur, et la
 * confirmation dit exactement ce qui se passe.
 */
export function GroupActions({
  groupId,
  name,
  status,
  sessionCount,
  memberCount,
}: {
  groupId: string;
  name: string;
  status: "active" | "archived";
  sessionCount: number;
  memberCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await updateGroup(groupId, {
        status: status === "active" ? "archived" : "active",
      });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={toggle} disabled={pending}>
        {status === "active" ? (
          <>
            <Archive className="mr-2 h-3.5 w-3.5" />
            Archiver
          </>
        ) : (
          <>
            <ArchiveRestore className="mr-2 h-3.5 w-3.5" />
            Réactiver
          </>
        )}
      </Button>
      <DeleteGroupButton
        groupId={groupId}
        name={name}
        sessionCount={sessionCount}
        memberCount={memberCount}
      />
    </div>
  );
}

function DeleteGroupButton({
  groupId,
  name,
  sessionCount,
  memberCount,
}: {
  groupId: string;
  name: string;
  sessionCount: number;
  memberCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    const result = await deleteGroup(groupId);
    if (result.success) {
      router.push("/admin/groups");
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
          <DialogTitle>Supprimer le groupe {name} ?</DialogTitle>
          {/* `render` remplace l'élément rendu : la description contient
              plusieurs paragraphes, et un <p> dans un <p> serait invalide. */}
          <DialogDescription render={<div />} className="space-y-2">
              <p>
                Ce qui est conservé : les {sessionCount} séance
                {sessionCount > 1 ? "s" : ""} et toute l&apos;assiduité déjà
                notée. Les séances perdent seulement leur rattachement à ce
                groupe.
              </p>
              <p>
                Ce qui disparaît : le groupe lui-même et l&apos;appartenance de
                ses {memberCount} élève{memberCount > 1 ? "s" : ""}. Aucune élève
                n&apos;est supprimée.
              </p>
              <p>
                Pour garder l&apos;ensemble consultable, préférez{" "}
                <strong>Archiver</strong>.
              </p>
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending ? "Suppression..." : "Supprimer le groupe"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
