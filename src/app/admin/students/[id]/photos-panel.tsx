"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Lock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addStudentPhoto, deleteStudentPhoto } from "@/actions/student-photos";
import { shrinkImage } from "@/lib/shrink-image";
import { MAX_PHOTOS_PER_STUDENT, MAX_STUDENT_PHOTO_BYTES } from "@/db/schema";

/** Assez pour lire une page de Qaida à l'écran, pas de quoi imprimer une affiche. */
const MAX_WIDTH = 1400;

export type StudentPhoto = {
  id: string;
  url: string;
  caption: string | null;
  takenOn: string | null;
  addedOn: string;
};

/**
 * La galerie de suivi d'une élève.
 *
 * ── Ce que l'écran répète, et pourquoi ──
 *
 * Que ces photos ne sont vues que par l'équipe et par l'élève
 * elle-même. Une enseignante qui l'ignore hésitera à y mettre le
 * travail d'une enfant — ou l'y mettra sans savoir qui le verra. Les
 * deux sont mauvais. La règle technique est portée par la route
 * `/api/students/[id]/photos/[photoId]` ; l'écran ne fait que la dire.
 */
export function PhotosPanel({
  profileId,
  photos,
}: {
  profileId: string;
  photos: StudentPhoto[];
}) {
  const full = photos.length >= MAX_PHOTOS_PER_STUDENT;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-medium">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Photos
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Visibles par l&apos;équipe et par l&apos;élève concernée, par personne
            d&apos;autre. {photos.length}/{MAX_PHOTOS_PER_STUDENT} utilisées.
          </p>
        </div>
        {!full && <PhotoDialog profileId={profileId} />}
      </div>

      {full && (
        <p className="rounded-xl border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning-foreground">
          Galerie pleine. Supprimez une photo pour en ajouter une autre.
        </p>
      )}

      {photos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          Aucune photo. Une page de Qaida, un travail écrit, un diplôme remis :
          ce qui mérite d&apos;être revu plus tard.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <li
              key={photo.id}
              className="group overflow-hidden rounded-xl border border-border/70"
            >
              <a href={photo.url} target="_blank" rel="noreferrer" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.caption ?? "Photo de l'élève"}
                  loading="lazy"
                  className="h-40 w-full bg-muted object-cover"
                />
              </a>
              <div className="flex items-start justify-between gap-2 p-2">
                <div className="min-w-0">
                  {photo.caption && (
                    <p className="truncate text-sm" title={photo.caption}>
                      {photo.caption}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {photo.takenOn ?? photo.addedOn}
                  </p>
                </div>
                <DeletePhotoButton photoId={photo.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PhotoDialog({ profileId }: { profileId: string }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [takenOn, setTakenOn] = useState("");
  const [file, setFile] = useState<File | null>(null);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setCaption("");
      setTakenOn("");
      setFile(null);
      setError(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Choisissez une photo.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const { dataUrl } = await shrinkImage(file, MAX_WIDTH);
      const result = await addStudentPhoto(profileId, dataUrl, caption, takenOn);
      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch {
      setError("Ce fichier n'a pas pu être lu comme une image.");
    }
    setPending(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Déclencheur fusionné par `render` : jamais un enfant. */}
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <ImagePlus className="mr-2 h-3.5 w-3.5" />
            Ajouter une photo
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une photo</DialogTitle>
          <DialogDescription>
            JPEG, PNG ou WebP. L&apos;image est réduite à {MAX_WIDTH} px de large
            avant d&apos;être envoyée, et plafonnée à{" "}
            {Math.round(MAX_STUDENT_PHOTO_BYTES / 1000)} Ko.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="photo-fichier">Photo</Label>
            <Input
              id="photo-fichier"
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="photo-legende">Légende</Label>
            <Input
              id="photo-legende"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Qaida page 12, écriture des lettres"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="photo-date">Date de la photo</Label>
            <Input
              id="photo-date"
              type="date"
              value={takenOn}
              onChange={(e) => setTakenOn(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Vide, c&apos;est la date d&apos;ajout qui s&apos;affiche.
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Envoi..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeletePhotoButton({ photoId }: { photoId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      await deleteStudentPhoto(photoId);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Supprimer la photo">
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        }
      />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Supprimer cette photo ?</DialogTitle>
          <DialogDescription>
            Elle disparaît définitivement de la fiche.
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
