/**
 * Crée l'établissement d'essai B — SUR UNE BASE LOCALE, uniquement.
 *
 * Sert à prouver le cloisonnement : sans un deuxième établissement, une
 * requête qui oublie l'institut passe tous les essais. Le garde-fou de
 * `local-only.ts` refuse toute autre base que celle de la machine.
 *
 * Usage : DATABASE_URL=... npx tsx scripts/fixture-institut-b.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { assertLocalDatabase } from "./local-only";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import {
  institutes,
  instituteMembers,
  users,
  studentProfiles,
  programs,
  groups,
  groupMembers,
  staffMembers,
  sessions,
  subscriptions,
  studentNotes,
  posts,
  instituteSettings,
  SETTING_KEYS,
} from "../src/db/schema";

const B = "00000000-0000-4000-8000-0000000000b2";

async function main() {
  assertLocalDatabase();
  const passwordHash = await hash("Test1234!", 10);

  await db
    .insert(institutes)
    .values({ id: B, slug: "institut-b", name: "Institut B (essai)" })
    .onConflictDoNothing();

  // Réglages propres à B
  for (const [key, value] of [
    [SETTING_KEYS.instituteName, "Institut B (essai)"],
    [SETTING_KEYS.timezone, "Africa/Casablanca"],
    [SETTING_KEYS.registrationToken, "jeton-de-b"],
  ] as const) {
    await db
      .insert(instituteSettings)
      .values({ instituteId: B, key, value })
      .onConflictDoNothing();
  }

  // Propriétaire de B
  const [ownerB] = await db
    .insert(users)
    .values({
      email: "owner.b@example.test",
      passwordHash,
      name: "Oum Salma (B)",
      role: "staff",
    })
    .onConflictDoUpdate({ target: users.email, set: { role: "staff", passwordHash } })
    .returning();

  await db
    .insert(instituteMembers)
    .values({ instituteId: B, userId: ownerB.id, role: "owner", capabilities: [] })
    .onConflictDoNothing();

  // Une élève de B
  const [studentB] = await db
    .insert(users)
    .values({
      email: "eleve.b@example.test",
      passwordHash,
      name: "Maryam de B",
      role: "student",
    })
    .onConflictDoUpdate({ target: users.email, set: { passwordHash } })
    .returning();

  const existingProfile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userId, studentB.id),
  });
  const profileB =
    existingProfile ??
    (
      await db
        .insert(studentProfiles)
        .values({
          instituteId: B,
          userId: studentB.id,
          arabicReadingLevel: "debutant",
          notes: "SECRET-DE-B",
        })
        .returning()
    )[0];

  const [programB] = await db
    .insert(programs)
    .values({
      instituteId: B,
      slug: "programme-b",
      name: "Programme secret de B",
      defaultSessionCount: 8,
      active: true,
    })
    .onConflictDoNothing()
    .returning();

  const [teacherB] = await db
    .insert(staffMembers)
    .values({ instituteId: B, name: "Enseignante de B", role: "teacher", status: "active" })
    .returning();

  const [groupB] = await db
    .insert(groups)
    .values({
      instituteId: B,
      name: "GROUPE-SECRET-B",
      status: "active",
      staffMemberId: teacherB.id,
      programId: programB?.id ?? null,
    })
    .returning();

  await db
    .insert(groupMembers)
    .values({ instituteId: B, groupId: groupB.id, studentProfileId: profileB.id })
    .onConflictDoNothing();

  const [subB] = await db
    .insert(subscriptions)
    .values({
      instituteId: B,
      studentProfileId: profileB.id,
      programId: programB!.id,
      sessionType: "individual",
      totalSessions: 8,
      priceCents: 12000,
      status: "active",
    })
    .returning();

  await db.insert(sessions).values({
    instituteId: B,
    subscriptionId: subB.id,
    groupId: groupB.id,
    staffMemberId: teacherB.id,
    sessionNumber: 1,
    scheduledAt: new Date(Date.now() - 86_400_000),
    durationMinutes: 60,
    status: "planned",
  });

  await db.insert(studentNotes).values({
    instituteId: B,
    studentProfileId: profileB.id,
    authorId: ownerB.id,
    content: "NOTE-PRIVEE-DE-B",
  });

  await db.insert(posts).values({
    instituteId: B,
    slug: "article-de-b",
    title: "ARTICLE-DE-B",
    content: "Contenu réservé à B.",
    status: "published",
    authorId: ownerB.id,
    publishedAt: new Date(),
  });

  console.log(
    JSON.stringify(
      {
        institutB: B,
        ownerB: { id: ownerB.id, email: ownerB.email },
        eleveB: { userId: studentB.id, profileId: profileB.id },
        groupeB: groupB.id,
        programmeB: programB?.id,
      },
      null,
      2
    )
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
