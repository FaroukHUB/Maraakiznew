import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  date,
  timestamp,
  customType,
  index,
} from "drizzle-orm/pg-core";
import { studentProfiles } from "./student-profiles";

/**
 * Colonne binaire. Drizzle n'expose pas `bytea` en standard.
 * (Même déclaration que dans `assets.ts` : deux lignes valent mieux
 * qu'un import croisé entre deux domaines sans rapport.)
 */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

/**
 * Les photos d'une élève.
 *
 * ── Pourquoi elles sont dans la base, et jusqu'à quand ──
 *
 * `assets.ts` disait : « le jour où l'institut voudra une galerie, il
 * faudra un vrai stockage ». Ce jour est arrivé à moitié seulement —
 * une galerie de SUIVI, quelques pages de Qaida ou un travail photographié,
 * pas un album. Les plafonds ci-dessous existent pour que ce choix
 * reste tenable :
 *
 *   12 photos par élève × 400 Ko = 4,8 Mo par élève au maximum.
 *
 * Au-delà de cent élèves qui remplissent leur quota, la base porterait
 * un demi-giga-octet d'images et il faudra passer à un stockage objet.
 * Le seul point de bascule serait alors `saveStudentPhoto` : la route de
 * lecture et l'écran ne changeraient pas. Ce commentaire fait foi.
 *
 * ── Ces photos ne sont JAMAIS publiques ──
 *
 * Une photo d'élève — souvent mineure — n'est pas un logo. Elle n'est
 * lisible que par l'administration et par l'élève concernée, à travers
 * `/api/students/[id]/photos/[photoId]`, qui vérifie les deux. Aucune
 * adresse devinable ne doit y donner accès.
 */
export const studentPhotos = pgTable(
  "student_photos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentProfileId: uuid("student_profile_id")
      .references(() => studentProfiles.id, { onDelete: "cascade" })
      .notNull(),
    caption: text("caption"),
    /** Date de la photo, si elle diffère du jour de l'envoi. */
    takenOn: date("taken_on", { mode: "string" }),
    mimeType: varchar("mime_type", { length: 60 }).notNull(),
    byteSize: integer("byte_size").notNull(),
    data: bytea("data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("student_photos_student_idx").on(table.studentProfileId)]
);

/** Plafond par photo, après réduction dans le navigateur. */
export const MAX_STUDENT_PHOTO_BYTES = 400_000;

/** Plafond par élève. Voir le calcul plus haut. */
export const MAX_PHOTOS_PER_STUDENT = 12;
