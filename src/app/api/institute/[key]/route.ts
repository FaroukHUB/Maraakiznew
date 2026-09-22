import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  instituteAssets,
  instituteImages,
  DEFAULT_INSTITUTE_ID,
  ASSET_KEYS,
} from "@/db/schema";

/** Un identifiant d'établissement, et rien d'autre. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Sert une image de l'institut.
 *
 * ── Pourquoi une route et pas une image en ligne ──
 *
 * Inscrire l'image dans le HTML la ferait retélécharger à chaque
 * affichage de la page, et gonflerait chaque rendu de plusieurs centaines
 * de kilo-octets. Ici, le navigateur la met en cache et ne la redemande
 * que si l'empreinte change. Ce commentaire fait foi.
 *
 * L'image de l'institut n'est pas un secret : la route est publique,
 * comme un logo sur un site. Seule l'ÉCRITURE est réservée à
 * l'administration. L'établissement est lu dans l'adresse (`e=`) parce
 * qu'une route publique n'a pas de session ; à défaut, c'est celui
 * d'origine, comme avant le multi-établissement.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  // Une clé libre laisserait lire n'importe quelle ligne future.
  if (!Object.values(ASSET_KEYS).includes(key as never)) {
    return new Response("Not found", { status: 404 });
  }

  const asked = new URL(request.url).searchParams.get("e");
  const institute = asked && UUID.test(asked) ? asked : DEFAULT_INSTITUTE_ID;

  const own = await db.query.instituteImages.findFirst({
    where: and(
      eq(instituteImages.instituteId, institute),
      eq(instituteImages.key, key)
    ),
  });

  // Repli sur la table historique pour le seul établissement d'origine.
  const asset =
    own ??
    (institute === DEFAULT_INSTITUTE_ID
      ? await db.query.instituteAssets.findFirst({
          where: eq(instituteAssets.key, key),
        })
      : undefined);

  if (!asset) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(asset.data), {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(asset.byteSize),
      // L'empreinte change à chaque remplacement : le navigateur garde
      // l'image jusque-là, et la reprend aussitôt après.
      ETag: `"${asset.updatedAt.getTime()}"`,
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
