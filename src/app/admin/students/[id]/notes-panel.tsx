"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Pencil, Plus, Trash2 } from "lucide-react";
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
import {
  addStudentNote,
  deleteStudentNote,
  updateStudentNote,
} from "@/actions/student-followup";

export type PrivateNote = {
  id: string;
  content: string;
  authorName: string | null;
  writtenOn: string;
};

/**
 * Les notes privées de l'équipe sur une élève.
 *
 * Elles ne sont jamais montrées à l'élève — voir la règle portée par
 * `student_notes` dans le schéma. L'écran le RAPPELLE explicitement :
 * une enseignante qui doute de ce point n'écrira rien d'utile.
 */
export function NotesPanel({
  profileId,
  notes,
}: {
  profileId: string;
  notes: PrivateNote[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 font-medium">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Notes privées
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Strictement invisibles pour l&apos;élève.
          </p>
        </div>
        <NoteDialog profileId={profileId} />
      </div>

      {notes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Aucune note pour le moment.
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-xl border border-border/70 bg-accent/20 p-3"
            >
              <p className="whitespace-pre-wrap text-sm">{note.content}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {note.writtenOn}
                  {note.authorName && <> · {note.authorName}</>}
                </p>
                <div className="flex items-center gap-1">
                  <NoteDialog profileId={profileId} note={note} />
                  <DeleteNoteButton noteId={note.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NoteDialog({
  profileId,
  note,
}: {
  profileId: string;
  note?: PrivateNote;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(note?.content ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setContent(note?.content ?? "");
      setError(null);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = note
      ? await updateStudentNote(note.id, content)
      : await addStudentNote(profileId, content);

    if (result.success) {
      setOpen(false);
      router.refresh();
    } else {
      setError(result.error);
    }
    setPending(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Déclencheur fusionné par `render` : jamais un enfant. */}
      <DialogTrigger
        render={
          note ? (
            <Button variant="ghost" size="icon-sm" aria-label="Modifier la note">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-3.5 w-3.5" />
              Ajouter
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{note ? "Modifier la note" : "Nouvelle note privée"}</DialogTitle>
          <DialogDescription>
            Ces notes sont réservées à l&apos;équipe : l&apos;élève ne les voit jamais.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            required
            autoFocus
            placeholder="A buté sur les règles de Nun sakina, à reprendre la prochaine fois."
            className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteNoteButton({ noteId }: { noteId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      await deleteStudentNote(noteId);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Supprimer la note">
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        }
      />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Supprimer cette note ?</DialogTitle>
          <DialogDescription>
            La note disparaît définitivement. Le reste de la fiche ne change pas.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
