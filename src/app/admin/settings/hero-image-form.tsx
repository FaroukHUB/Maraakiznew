"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { saveInstituteImage, deleteInstituteImage } from "@/actions/assets";
import { updateSettings } from "@/actions/settings";
import { MAX_IMAGE_BYTES } from "@/db/schema";

/**
 * L'image du bandeau d'accueil.
 *
 * ── L'image est réduite AVANT d'être envoyée ──
 *
 * Une photo de téléphone pèse trois à cinq méga-octets. L'envoyer telle
 * quelle ferait échouer la validation, remplirait la base, et
 * ralentirait chaque affichage. Le navigateur la redessine donc à
 * 1600 px de large, en JPEG, avant qu'elle ne parte. C'est très
 * largement suffisant pour un bandeau. Ce commentaire fait foi.
 *
 * La lisibilité du salam ne dépend pas de l'image choisie : un voile
 * dégradé est posé par-dessus, côté bandeau. Une photo claire ou sombre
 * donne le même texte lisible.
 */
const MAX_WIDTH = 1600;
const JPEG_QUALITY = 0.82;

export function HeroImageForm({
  url,
  enabled,
}: {
  url: string | null;
  enabled: boolean;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function pick(file: File) {
    setPending(true);
    setError(null);
    setNote(null);
    try {
      const { dataUrl, before, after } = await shrink(file);
      const result = await saveInstituteImage("hero", dataUrl);
      if (result.success) {
        setNote(
          before === after
            ? "Image enregistrée."
            : `Image réduite de ${Math.round(before / 1000)} Ko à ${Math.round(after / 1000)} Ko, puis enregistrée.`
        );
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch {
      setError("Ce fichier n'a pas pu être lu comme une image.");
    }
    setPending(false);
  }

  async function remove() {
    setPending(true);
    setError(null);
    setNote(null);
    const result = await deleteInstituteImage("hero");
    if (result.success) router.refresh();
    else setError(result.error);
    setPending(false);
  }

  async function toggle() {
    setPending(true);
    const result = await updateSettings({ heroImage: !enabled });
    if (result.success) router.refresh();
    else setError(result.error);
    setPending(false);
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {url ? (
          <div className="relative overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="Image du bandeau d'accueil"
              className="h-40 w-full object-cover"
            />
            {!enabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium">
                  Masquée
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
            Aucune image — le bandeau garde son dégradé.
          </div>
        )}

        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) pick(file);
            e.target.value = "";
          }}
        />

        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={pending} onClick={() => input.current?.click()}>
            <ImagePlus className="mr-2 h-4 w-4" />
            {url ? "Remplacer" : "Choisir une image"}
          </Button>
          {url && (
            <>
              <Button type="button" variant="outline" disabled={pending} onClick={toggle}>
                {enabled ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Masquer
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Afficher
                  </>
                )}
              </Button>
              <Button type="button" variant="ghost" disabled={pending} onClick={remove}>
                <Trash2 className="mr-2 h-4 w-4" />
                Retirer
              </Button>
            </>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {note && <p className="text-sm text-success">{note}</p>}

        <p className="text-xs text-muted-foreground">
          JPEG, PNG ou WebP. L&apos;image est réduite à {MAX_WIDTH} px de large
          avant d&apos;être envoyée, et plafonnée à{" "}
          {Math.round(MAX_IMAGE_BYTES / 1000)} Ko. Un voile dégradé est posé
          par-dessus pour que le salam reste lisible, quelle que soit la photo.
        </p>
      </CardContent>
    </Card>
  );
}

/** Redessine l'image dans un canevas, puis la rend en JPEG. */
async function shrink(
  file: File
): Promise<{ dataUrl: string; before: number; after: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canevas indisponible");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  const after = Math.round((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75);
  return { dataUrl, before: file.size, after };
}
