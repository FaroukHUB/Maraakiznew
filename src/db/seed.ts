/**
 * Seed script — populate the database with realistic test data.
 *
 * Usage: npm run db:seed
 * Requires: DATABASE_URL in .env.local + PostgreSQL running
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { hash } from "bcryptjs";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed() {
  console.log("Seeding database...");

  // ─── Clean existing data (reverse FK order) ──────────
  await db.delete(schema.memorizationReviews);
  await db.delete(schema.memorizationItems);
  await db.delete(schema.skillProgress);
  await db.delete(schema.skills);
  await db.delete(schema.groupMembers);
  await db.delete(schema.groups);
  await db.delete(schema.sessionResources);
  await db.delete(schema.sessionNotes);
  await db.delete(schema.sessionParticipants);
  await db.delete(schema.payments);
  await db.delete(schema.sessions);
  await db.delete(schema.subscriptions);
  await db.delete(schema.resources);
  await db.delete(schema.studentProfiles);
  await db.delete(schema.programs);
  await db.delete(schema.users);

  console.log("  Cleaned existing data.");

  // ─── Programs ────────────────────────────────────────
  const [nourania, quranAccompaniment] = await db
    .insert(schema.programs)
    .values([
      {
        slug: "nourania",
        name: "Nourania",
        description:
          "Apprentissage de la lecture arabe avec la méthode Al-Qaida An-Noraniya",
        defaultSessionCount: 8,
        sortOrder: 1,
      },
      {
        slug: "quran_accompaniment",
        name: "Accompagnement Coran",
        description:
          "Accompagnement à la lecture du Coran avec règles de tajwid",
        defaultSessionCount: 8,
        sortOrder: 2,
      },
    ])
    .returning();

  console.log("  Programs created.");

  // ─── Skills (référentiel) ────────────────────────────
  // Jeu de départ, à adapter au programme réel de l'institut.
  // Le référentiel se modifie ensuite depuis /admin/skills.
  const nouraniaSkills = [
    ["Les lettres isolées", "Reconnaître et nommer les 28 lettres"],
    ["Les lettres isolées", "Prononcer chaque lettre avec son point d'articulation"],
    ["Les formes des lettres", "Identifier les formes initiale, médiane et finale"],
    ["Les formes des lettres", "Lire un mot en lettres attachées"],
    ["Les voyelles courtes", "Lire une lettre avec la fatha"],
    ["Les voyelles courtes", "Lire une lettre avec la kasra"],
    ["Les voyelles courtes", "Lire une lettre avec la damma"],
    ["Le tanwin", "Lire les trois tanwin"],
    ["Le soukoun", "Lire une lettre porteuse du soukoun"],
    ["La chadda", "Lire une lettre redoublée"],
    ["Les prolongations", "Distinguer et allonger les trois madd"],
    ["Lecture suivie", "Lire une ligne complète sans hésiter"],
  ];

  const quranSkills = [
    ["Règles de nun sakinah", "Al-Idhhar"],
    ["Règles de nun sakinah", "Al-Idgham"],
    ["Règles de nun sakinah", "Al-Iqlab"],
    ["Règles de nun sakinah", "Al-Ikhfa"],
    ["Les madd", "Madd tabi'i"],
    ["Les madd", "Madd muttasil et munfasil"],
    ["Fluidité", "Lire une page en respectant les arrêts"],
    ["Mémorisation", "Réciter la sourate travaillée sans erreur"],
  ];

  await db.insert(schema.skills).values([
    ...nouraniaSkills.map(([unit, label], index) => ({
      programId: nourania.id,
      unit,
      code: `N${index + 1}`,
      label,
      sortOrder: index,
    })),
    ...quranSkills.map(([unit, label], index) => ({
      programId: quranAccompaniment.id,
      unit,
      code: `C${index + 1}`,
      label,
      sortOrder: index,
    })),
  ]);

  console.log(
    `  Skills created (${nouraniaSkills.length + quranSkills.length}).`
  );

  // ─── Users ───────────────────────────────────────────
  const adminHash = await hash("admin123", 10);
  const studentHash = await hash("student123", 10);

  const [admin, ...students] = await db
    .insert(schema.users)
    .values([
      {
        email: "admin@maraakiz.com",
        passwordHash: adminHash,
        name: "Farouk",
        role: "admin",
      },
      {
        email: "amina.b@email.com",
        passwordHash: studentHash,
        name: "Amina Benali",
        role: "student",
      },
      {
        email: "khadija.m@email.com",
        passwordHash: studentHash,
        name: "Khadija Mansouri",
        role: "student",
      },
      {
        email: "sarah.h@email.com",
        passwordHash: studentHash,
        name: "Sarah Hadj",
        role: "student",
      },
      {
        email: "fatima.z@email.com",
        passwordHash: studentHash,
        name: "Fatima Zahra",
        role: "student",
      },
      {
        email: "nour.a@email.com",
        passwordHash: studentHash,
        name: "Nour Alaoui",
        role: "student",
      },
      {
        email: "yasmine.d@email.com",
        passwordHash: studentHash,
        name: "Yasmine Djebbar",
        role: "student",
      },
    ])
    .returning();

  console.log(`  ${students.length + 1} users created (1 admin + ${students.length} students).`);

  // ─── Student profiles ────────────────────────────────
  const profileData = [
    {
      userId: students[0].id,
      whatsappPhone: "+33612345678",
      localPhone: "+21312345678",
      paypalAddress: "amina.b@email.com",
      arabicReadingLevel: "debutant" as const,
      previousExperience: "Quelques bases apprises en mosquée étant petite",
    },
    {
      userId: students[1].id,
      whatsappPhone: "+33698765432",
      paypalAddress: "khadija.m@email.com",
      arabicReadingLevel: "intermediaire" as const,
      previousExperience:
        "A terminé la Nourania il y a 1 an, souhaite lire le Coran",
    },
    {
      userId: students[2].id,
      whatsappPhone: "+33611223344",
      arabicReadingLevel: "debutant" as const,
    },
    {
      userId: students[3].id,
      whatsappPhone: "+33655443322",
      paypalAddress: "fatima.z@email.com",
      arabicReadingLevel: "intermediaire" as const,
      previousExperience: "Nourania terminée, lecture lente du Coran",
    },
    {
      userId: students[4].id,
      whatsappPhone: "+33677889900",
      arabicReadingLevel: "debutant" as const,
      previousExperience: "Aucune base en arabe",
    },
    {
      userId: students[5].id,
      whatsappPhone: "+33644556677",
      paypalAddress: "yasmine.d@email.com",
      arabicReadingLevel: "avance" as const,
      previousExperience: "Nourania + lecture Juz Amma terminés",
    },
  ];

  const profiles = await db
    .insert(schema.studentProfiles)
    .values(profileData)
    .returning();

  console.log(`  ${profiles.length} student profiles created.`);

  // ─── Subscriptions ───────────────────────────────────
  const subsData = [
    // Amina — Nourania groupe
    {
      studentProfileId: profiles[0].id,
      programId: nourania.id,
      sessionType: "group" as const,
      totalSessions: 8,
      weeklyRhythm: 2,
      priceCents: 6000,
      status: "active" as const,
      startedAt: new Date("2025-03-17"),
      closedAt: null,
      closureReason: null,
    },
    // Khadija — Coran individuel
    {
      studentProfileId: profiles[1].id,
      programId: quranAccompaniment.id,
      sessionType: "individual" as const,
      totalSessions: 8,
      weeklyRhythm: 2,
      priceCents: 10000,
      status: "active" as const,
      startedAt: new Date("2025-03-10"),
      closedAt: null,
      closureReason: null,
    },
    // Sarah — Nourania groupe (même groupe qu'Amina)
    {
      studentProfileId: profiles[2].id,
      programId: nourania.id,
      sessionType: "group" as const,
      totalSessions: 8,
      weeklyRhythm: 2,
      priceCents: 6000,
      status: "active" as const,
      startedAt: new Date("2025-03-17"),
      closedAt: null,
      closureReason: null,
    },
    // Fatima — Coran groupe
    {
      studentProfileId: profiles[3].id,
      programId: quranAccompaniment.id,
      sessionType: "group" as const,
      totalSessions: 8,
      weeklyRhythm: 2,
      priceCents: 8000,
      status: "active" as const,
      startedAt: new Date("2025-03-03"),
      closedAt: null,
      closureReason: null,
    },
    // Nour — Nourania groupe
    {
      studentProfileId: profiles[4].id,
      programId: nourania.id,
      sessionType: "group" as const,
      totalSessions: 8,
      weeklyRhythm: 2,
      priceCents: 6000,
      status: "active" as const,
      startedAt: new Date("2025-03-24"),
      closedAt: null,
      closureReason: null,
    },
    // Yasmine — Coran groupe (même groupe que Fatima)
    {
      studentProfileId: profiles[5].id,
      programId: quranAccompaniment.id,
      sessionType: "group" as const,
      totalSessions: 8,
      weeklyRhythm: 2,
      priceCents: 8000,
      status: "active" as const,
      startedAt: new Date("2025-03-03"),
      closedAt: null,
      closureReason: null,
    },
  ];

  const subs = await db
    .insert(schema.subscriptions)
    .values(subsData)
    .returning();

  console.log(`  ${subs.length} subscriptions created.`);

  // ─── Sessions ────────────────────────────────────────
  // Helper: create sessions for a subscription
  function buildSessions(
    subId: string,
    completedCount: number,
    startDate: Date,
    total: number,
    duration: number
  ) {
    return Array.from({ length: total }, (_, i) => {
      const n = i + 1;
      const dayOffset =
        Math.floor((n - 1) / 2) * 7 + ((n - 1) % 2) * 3;
      const date = new Date(startDate);
      date.setDate(date.getDate() + dayOffset);

      return {
        subscriptionId: subId,
        sessionNumber: n,
        scheduledAt: date,
        durationMinutes: duration,
        status: (n <= completedCount ? "completed" : "planned") as
          | "completed"
          | "planned",
        zoomLink: "https://zoom.us/j/maraakiz",
      };
    });
  }

  const allSessions = [
    ...buildSessions(subs[0].id, 5, new Date("2025-03-17"), 8, 60), // Amina 5/8
    ...buildSessions(subs[1].id, 6, new Date("2025-03-10"), 8, 45), // Khadija 6/8
    ...buildSessions(subs[2].id, 5, new Date("2025-03-17"), 8, 60), // Sarah 5/8
    ...buildSessions(subs[3].id, 7, new Date("2025-03-03"), 8, 60), // Fatima 7/8
    ...buildSessions(subs[4].id, 2, new Date("2025-03-24"), 8, 60), // Nour 2/8
    ...buildSessions(subs[5].id, 7, new Date("2025-03-03"), 8, 60), // Yasmine 7/8
  ];

  const insertedSessions = await db
    .insert(schema.sessions)
    .values(allSessions)
    .returning();

  console.log(`  ${insertedSessions.length} sessions created.`);

  // ─── Session notes (for last completed session of each sub) ─
  // Amina's session 5
  const aminaSess5 = insertedSessions.find(
    (s) => s.subscriptionId === subs[0].id && s.sessionNumber === 5
  )!;
  const khadijaSess6 = insertedSessions.find(
    (s) => s.subscriptionId === subs[1].id && s.sessionNumber === 6
  )!;

  await db.insert(schema.sessionNotes).values([
    {
      sessionId: aminaSess5.id,
      content:
        "Révision des lettres ب ت ث et leurs formes. Bonne progression sur la lecture des voyelles courtes.",
      stopReference: "Qaida Nourania, page 12, ligne 5",
      homework:
        "Réviser les lettres de la page 12. Écouter l'audio de la leçon 5. Pratiquer la lecture 15 min/jour.",
    },
    {
      sessionId: khadijaSess6.id,
      content:
        "Lecture sourate Al-Fatiha avec tajwid. Travail sur l'idgham et l'ikhfa. Très bon niveau.",
      stopReference: "Sourate Al-Fatiha, verset 7",
      homework:
        "Relire sourate Al-Fatiha 3 fois avec les règles vues. Écouter le récitateur Husary.",
    },
  ]);

  console.log("  Session notes created.");

  // ─── Session resources ───────────────────────────────
  await db.insert(schema.sessionResources).values([
    {
      sessionId: aminaSess5.id,
      title: "Synthèse leçon 5 — Nourania",
      type: "summary",
      url: "#",
      visibleTo: "participants_only",
    },
    {
      sessionId: aminaSess5.id,
      title: "Diapo séance 5",
      type: "slide",
      url: "#",
      visibleTo: "participants_only",
    },
    {
      sessionId: aminaSess5.id,
      title: "Exercices lettres ب ت ث",
      type: "exercise",
      url: "#",
      visibleTo: "participants_only",
    },
    {
      sessionId: khadijaSess6.id,
      title: "Replay — Séance 6 Khadija",
      type: "replay_video",
      url: "#",
      visibleTo: "participants_only",
    },
    {
      sessionId: khadijaSess6.id,
      title: "Règles d'idgham — Fiche récap",
      type: "summary",
      url: "#",
      visibleTo: "all",
    },
  ]);

  console.log("  Session resources created.");

  // ─── Session participants (group sessions) ───────────
  // Amina + Sarah share Nourania group sessions
  const aminaSessions = insertedSessions.filter(
    (s) => s.subscriptionId === subs[0].id && s.status === "completed"
  );
  const aminaParticipants = aminaSessions.flatMap((s) => [
    {
      sessionId: s.id,
      studentProfileId: profiles[0].id,
      attendanceStatus: "present" as const,
      hasReplayAccess: true,
    },
    {
      sessionId: s.id,
      studentProfileId: profiles[2].id,
      attendanceStatus: (s.sessionNumber === 3 ? "absent" : "present") as
        | "present"
        | "absent",
      hasReplayAccess: true, // absente mais a accès au replay pour rattraper
    },
  ]);

  // Fatima + Yasmine share Quran group sessions
  const fatimaSessions = insertedSessions.filter(
    (s) => s.subscriptionId === subs[3].id && s.status === "completed"
  );
  const fatimaParticipants = fatimaSessions.flatMap((s) => [
    {
      sessionId: s.id,
      studentProfileId: profiles[3].id,
      attendanceStatus: "present" as const,
      hasReplayAccess: true,
    },
    {
      sessionId: s.id,
      studentProfileId: profiles[5].id,
      attendanceStatus: "present" as const,
      hasReplayAccess: true,
    },
  ]);

  await db
    .insert(schema.sessionParticipants)
    .values([...aminaParticipants, ...fatimaParticipants]);

  console.log("  Session participants created.");

  // ─── Payments ────────────────────────────────────────
  await db.insert(schema.payments).values([
    {
      subscriptionId: subs[0].id,
      studentProfileId: profiles[0].id,
      amountCents: 6000,
      method: "paypal",
      status: "received",
      paidAt: new Date("2025-03-15"),
    },
    {
      subscriptionId: subs[1].id,
      studentProfileId: profiles[1].id,
      amountCents: 10000,
      method: "paypal",
      status: "received",
      paidAt: new Date("2025-03-08"),
    },
    {
      subscriptionId: subs[2].id,
      studentProfileId: profiles[2].id,
      amountCents: 6000,
      method: "paypal",
      status: "pending",
    },
    {
      subscriptionId: subs[3].id,
      studentProfileId: profiles[3].id,
      amountCents: 8000,
      method: "bank_transfer",
      status: "received",
      paidAt: new Date("2025-03-01"),
    },
    {
      subscriptionId: subs[4].id,
      studentProfileId: profiles[4].id,
      amountCents: 6000,
      method: "paypal",
      status: "pending",
    },
    {
      subscriptionId: subs[5].id,
      studentProfileId: profiles[5].id,
      amountCents: 8000,
      method: "paypal",
      status: "received",
      paidAt: new Date("2025-03-01"),
    },
  ]);

  console.log("  Payments created.");

  // ─── Resources (global library) ──────────────────────
  await db.insert(schema.resources).values([
    {
      title: "Qaida Nourania — PDF complet",
      description: "Le support principal de la méthode Nourania",
      type: "pdf",
      url: "#",
      programId: nourania.id,
      category: "Qaida Nourania",
      sortOrder: 1,
    },
    {
      title: "Audio — Leçons Nourania 1 à 17",
      description: "Enregistrements audio de toutes les leçons Nourania",
      type: "audio",
      url: "#",
      programId: nourania.id,
      category: "Qaida Nourania",
      sortOrder: 2,
    },
    {
      title: "Juz Amma — PDF",
      type: "pdf",
      url: "#",
      programId: quranAccompaniment.id,
      category: "Juz Amma",
      sortOrder: 1,
    },
    {
      title: "Juz Tabarak — PDF",
      type: "pdf",
      url: "#",
      programId: quranAccompaniment.id,
      category: "Juz Tabarak",
      sortOrder: 2,
    },
    {
      title: "Synthèses des règles de tajwid",
      description: "Fiches récapitulatives des principales règles",
      type: "pdf",
      url: "#",
      programId: null, // common to all programs
      category: "Synthèses",
      sortOrder: 3,
    },
  ]);

  console.log("  Resources created.");

  // ─── Memorization (hifz) ─────────────────────────────
  // Quelques portions à des stades différents du cycle de révision,
  // dont deux déjà en retard, pour que l'écran Révisions ait du contenu.
  const day = 86_400_000;
  const relative = (days: number) => new Date(Date.now() + days * day);

  await db.insert(schema.memorizationItems).values([
    {
      studentProfileId: profiles[0].id,
      surahNumber: 114, // An-Nas
      ayahStart: 1,
      ayahEnd: 6,
      memorizedAt: relative(-20),
      intervalIndex: 2,
      lastReviewedAt: relative(-10),
      nextReviewAt: relative(-3), // en retard
    },
    {
      studentProfileId: profiles[0].id,
      surahNumber: 112, // Al-Ikhlas
      ayahStart: 1,
      ayahEnd: 4,
      memorizedAt: relative(-35),
      intervalIndex: 4,
      lastReviewedAt: relative(-5),
      nextReviewAt: relative(25),
    },
    {
      studentProfileId: profiles[1].id,
      surahNumber: 78, // An-Naba
      ayahStart: 1,
      ayahEnd: 20,
      memorizedAt: relative(-12),
      intervalIndex: 1,
      lastReviewedAt: relative(-9),
      nextReviewAt: relative(-6), // en retard
    },
    {
      studentProfileId: profiles[1].id,
      surahNumber: 67, // Al-Mulk
      ayahStart: 1,
      ayahEnd: 10,
      memorizedAt: relative(-2),
      intervalIndex: 0,
      nextReviewAt: relative(-1), // à faire
    },
  ]);

  console.log("  Memorization items created (4).");

  // ─── Done ────────────────────────────────────────────
  console.log("\nSeed complete.");
  await pool.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
