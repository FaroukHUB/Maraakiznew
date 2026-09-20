import { eq } from "drizzle-orm";
import { db } from "@/db";
import { instituteAssets, ASSET_KEYS } from "@/db/schema";

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
 * l'administration.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  // Une clé libre laisserait lire n'importe quelle ligne future.
  if (!Object.values(ASSET_KEYS).includes(key as never)) {
    return new Response("Not found", { status: 404 });
  }

  const asset = await db.query.instituteAssets.findFirst({
    where: eq(instituteAssets.key, key),
  });

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
