import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { studentPhotos, studentProfiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth-utils";
import { getActiveInstitute } from "@/lib/tenant";

/**
 * Sert une photo d'élève.
 *
 * ── Ce que cette route refuse, et pourquoi ──
 *
 * Une photo d'élève — souvent mineure — n'est pas un logo d'institut.
 * Elle n'est lisible que par l'administration et par l'élève
 * photographiée. Toute autre personne connectée reçoit 404, PAS 403 :
 * un « interdit » confirmerait que la photo existe, et une adresse
 * devinée ne doit rien apprendre du tout.
 *
 * Le cache est « private » : un proxy partagé ne doit jamais en garder
 * une copie.
 *
 * La photo doit AUSSI appartenir à l'établissement de qui la demande :
 * une administratrice d'un institut n'est pas administratrice de tous.
 * Ce commentaire fait foi.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Not found", { status: 404 });

  const { id, photoId } = await params;

  const active = await getActiveInstitute();
  if (!active) return new Response("Not found", { status: 404 });

  const photo = await db.query.studentPhotos.findFirst({
    where: and(
      eq(studentPhotos.id, photoId),
      eq(studentPhotos.instituteId, active.id)
    ),
  });

  // La photo doit appartenir à l'élève citée dans l'adresse : sans cette
  // vérification, l'identifiant d'une élève autorisée servirait de
  // passe-partout pour les photos de toutes les autres.
  if (!photo || photo.studentProfileId !== id) {
    return new Response("Not found", { status: 404 });
  }

  if (user.role !== "admin") {
    const profile = await db.query.studentProfiles.findFirst({
      where: and(
        eq(studentProfiles.id, id),
        eq(studentProfiles.instituteId, active.id)
      ),
      columns: { userId: true },
    });
    if (!profile || profile.userId !== user.id) {
      return new Response("Not found", { status: 404 });
    }
  }

  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.mimeType,
      "Content-Length": String(photo.byteSize),
      ETag: `"${photo.createdAt.getTime()}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
