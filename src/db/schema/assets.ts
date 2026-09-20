import { pgTable, varchar, integer, timestamp, customType } from "drizzle-orm/pg-core";

/**
 * Colonne binaire. Drizzle n'expose pas `bytea` en standard ; on le
 * déclare une fois ici plutôt que de le contourner ailleurs.
 */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

/**
 * Les images de l'institut, stockées DANS la base.
 *
 * ── Pourquoi pas un service de fichiers ──
 *
 * Une image de bandeau et un logo : deux fichiers, pas deux mille. Passer
 * par un stockage externe ajouterait un service à configurer, une clé à
 * garder, et une facture — pour quelques centaines de kilo-octets. La
 * base suffit, et la sauvegarde de la base emporte les images avec elle.
 *
 * Ce choix ne tient QUE parce que le volume reste minuscule : l'envoi est
 * plafonné et l'image est réduite dans le navigateur avant d'arriver.
 * Le jour où l'institut voudra une galerie, il faudra un vrai stockage.
 * Ce commentaire fait foi.
 *
 * L'image n'est jamais inscrite dans le HTML : elle est servie par
 * `/api/institute/[key]`, avec un cache et une empreinte. Sans quoi
 * chaque affichage du tableau de bord rechargerait l'image entière.
 */
export const instituteAssets = pgTable("institute_assets", {
  /** « hero » ou « logo ». Une clé, une image. */
  key: varchar("key", { length: 40 }).primaryKey(),
  mimeType: varchar("mime_type", { length: 60 }).notNull(),
  byteSize: integer("byte_size").notNull(),
  data: bytea("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Les seules clés acceptées. Une clé libre ouvrirait la porte à tout. */
export const ASSET_KEYS = { hero: "hero" } as const;
export type AssetKey = (typeof ASSET_KEYS)[keyof typeof ASSET_KEYS];

/** Ce que le navigateur a le droit d'envoyer. */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/**
 * Plafond de taille, après réduction dans le navigateur.
 *
 * 1,5 Mo : largement de quoi tenir une photo de 1600 px de large en JPEG,
 * et assez bas pour qu'une image oubliée ne fasse pas gonfler la base.
 */
export const MAX_IMAGE_BYTES = 1_500_000;
