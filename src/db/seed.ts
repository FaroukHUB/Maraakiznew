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
  await db.delete(schema.lessonProgress);
  await db.delete(schema.lessons);
  await db.delete(schema.courses);
  await db.delete(schema.orders);
  await db.delete(schema.shopItems);
  await db.delete(schema.referrals);
  await db.delete(schema.referralCodes);
  await db.delete(schema.documents);
  await db.delete(schema.payrollEntries);
  await db.delete(schema.staffMembers);
  await db.delete(schema.appointments);
  await db.delete(schema.prospects);
  await db.delete(schema.certificates);
  await db.delete(schema.assessmentResults);
  await db.delete(schema.assessments);
  await db.delete(schema.invoices);
  await db.delete(schema.posts);
  await db.delete(schema.settings);
  await db.delete(schema.reportCards);
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
  //
  // Les séances sont ANCRÉES SUR AUJOURD'HUI, pas sur une date écrite en
  // dur. Un jeu de démonstration figé en 2025 donne un tableau de bord
  // vide — « aucune séance aujourd'hui », « aucune séance planifiée » —
  // et on ne peut alors rien vérifier de ce que l'écran doit montrer.
  // Ce commentaire fait foi.

  /**
   * Rang du jour d'une séance dans son forfait, au rythme de deux par
   * semaine : la 1re à J+0, la 2e à J+3, la 3e à J+7, et ainsi de suite.
   */
  function dayOffsetOf(sessionNumber: number) {
    const i = sessionNumber - 1;
    return Math.floor(i / 2) * 7 + (i % 2) * 3;
  }

  /**
   * Date de départ telle que la séance `anchor` tombe AUJOURD'HUI, à
   * l'heure demandée.
   */
  function startSoThat(anchor: number, hour: number, minute: number) {
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    date.setDate(date.getDate() - dayOffsetOf(anchor));
    return date;
  }

  function buildSessions(
    subId: string,
    completedCount: number,
    startDate: Date,
    total: number,
    duration: number
  ) {
    return Array.from({ length: total }, (_, i) => {
      const n = i + 1;
      const date = new Date(startDate);
      date.setDate(date.getDate() + dayOffsetOf(n));

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

  // Deux séances déjà faites ce matin, quatre à venir dans la journée :
  // de quoi voir le repère « maintenant » se placer au milieu de la
  // chronologie, quelle que soit l'heure d'ouverture.
  const allSessions = [
    ...buildSessions(subs[0].id, 5, startSoThat(5, 9, 0), 8, 60), // Amina 5/8
    ...buildSessions(subs[1].id, 6, startSoThat(7, 14, 0), 8, 45), // Khadija 6/8
    ...buildSessions(subs[2].id, 5, startSoThat(5, 10, 30), 8, 60), // Sarah 5/8
    ...buildSessions(subs[3].id, 7, startSoThat(8, 16, 0), 8, 60), // Fatima 7/8
    ...buildSessions(subs[4].id, 2, startSoThat(3, 17, 30), 8, 60), // Nour 2/8
    ...buildSessions(subs[5].id, 7, startSoThat(8, 18, 30), 8, 60), // Yasmine 7/8
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

  // ─── Report cards ────────────────────────────────────
  // Un bulletin publié et un brouillon, pour que les deux écrans aient
  // du contenu. Les chiffres sont volontairement figés, comme le veut la
  // règle du bulletin (voir schema/report-cards.ts).
  await db.insert(schema.reportCards).values([
    {
      studentProfileId: profiles[0].id,
      title: "Bulletin du 1er trimestre",
      periodStart: new Date(relative(-120)),
      periodEnd: new Date(relative(-30)),
      status: "published" as const,
      publishedAt: relative(-25),
      generalComment:
        "Travail régulier et sérieux. La lecture des lettres attachées est acquise, il reste à gagner en fluidité sur les prolongations. Assiduité exemplaire.",
      sessionsCount: 6,
      attendanceAttended: 6,
      attendanceMissed: 0,
      attendanceExcused: 0,
      attendanceRate: 100,
      skillsAcquired: 4,
      skillsTotal: 12,
      skillsAcquiredInPeriod: 4,
      programProgress: [
        { programId: nourania.id, programName: "Nourania", acquired: 4, total: 12, rate: 33.3 },
      ],
      memorizedAyahs: 10,
      memorizedPortionsInPeriod: 2,
      reviewsInPeriod: 5,
      generatedAt: relative(-25),
    },
    {
      studentProfileId: profiles[1].id,
      title: "Bulletin du 1er trimestre",
      periodStart: new Date(relative(-120)),
      periodEnd: new Date(relative(-30)),
      status: "draft" as const,
      sessionsCount: 5,
      attendanceAttended: 4,
      attendanceMissed: 1,
      attendanceExcused: 0,
      attendanceRate: 80,
      skillsAcquired: 2,
      skillsTotal: 12,
      skillsAcquiredInPeriod: 2,
      programProgress: [
        { programId: nourania.id, programName: "Nourania", acquired: 2, total: 12, rate: 16.7 },
      ],
      memorizedAyahs: 30,
      memorizedPortionsInPeriod: 1,
      reviewsInPeriod: 2,
      generatedAt: relative(-25),
    },
  ]);

  console.log("  Report cards created (2).");

  // ─── Réglages de l'institut ──────────────────────────
  await db.insert(schema.settings).values([
    { key: "institute_name", value: "Institut Maraakiz" },
    { key: "institute_tagline", value: "Apprendre le Coran, à son rythme" },
    { key: "contact_email", value: "contact@maraakiz.com" },
    { key: "whatsapp_number", value: "+33 6 12 34 56 78" },
    { key: "address", value: "12 rue des Écoles, 75005 Paris" },
    {
      key: "invoice_footer",
      value: "Association Maraakiz — SIRET 000 000 000 00000 — TVA non applicable, art. 293 B du CGI.",
    },
  ]);

  console.log("  Settings created (6).");

  // ─── Groupes ─────────────────────────────────────────
  // Le groupe organise les séances ; chaque élève garde son forfait.
  const groupData: (typeof schema.groups.$inferInsert)[] = [
      {
        programId: nourania.id,
        name: "Nourania — Débutantes du mardi",
        level: "debutant" as const,
        description: "Groupe d'entrée, lettres isolées et attachées.",
        schedule: "Mardi 18h00 — 19h00",
        capacity: 8,
        status: "active" as const,
      },
      {
        programId: quranAccompaniment.id,
        name: "Coran — Tajwid du samedi",
        level: "intermediaire" as const,
        description: "Lecture appliquée et règles de tajwid.",
        schedule: "Samedi 10h00 — 11h30",
        capacity: 6,
        status: "active" as const,
      },
      {
        programId: nourania.id,
        name: "Nourania — Session d'été (terminée)",
        level: "debutant" as const,
        schedule: "Juillet, lundi et jeudi",
        capacity: 10,
        status: "archived" as const,
      },
  ];

  const insertedGroups = await db
    .insert(schema.groups)
    .values(groupData)
    .returning();

  await db.insert(schema.groupMembers).values([
    { groupId: insertedGroups[0].id, studentProfileId: profiles[0].id },
    { groupId: insertedGroups[0].id, studentProfileId: profiles[1].id },
    { groupId: insertedGroups[0].id, studentProfileId: profiles[3].id },
    { groupId: insertedGroups[1].id, studentProfileId: profiles[2].id },
    { groupId: insertedGroups[1].id, studentProfileId: profiles[4].id },
  ]);

  console.log("  Groups created (3) with 5 memberships.");

  // ─── Progression sur le référentiel ──────────────────
  // Une ligne absente vaut « non commencée » : on n'écrit que ce qui
  // a bougé (voir schema/skills.ts).
  const allSkills = await db.query.skills.findMany();
  const nouraniaSkillRows = allSkills.filter((s) => s.programId === nourania.id);
  const quranSkillRows = allSkills.filter(
    (s) => s.programId === quranAccompaniment.id
  );

  const progressRows: (typeof schema.skillProgress.$inferInsert)[] = [];
  nouraniaSkillRows.slice(0, 4).forEach((skill) =>
    progressRows.push({
      studentProfileId: profiles[0].id,
      skillId: skill.id,
      status: "acquired" as const,
      validatedAt: relative(-30),
    })
  );
  nouraniaSkillRows.slice(4, 6).forEach((skill) =>
    progressRows.push({
      studentProfileId: profiles[0].id,
      skillId: skill.id,
      status: "in_progress" as const,
    })
  );
  nouraniaSkillRows.slice(0, 2).forEach((skill) =>
    progressRows.push({
      studentProfileId: profiles[1].id,
      skillId: skill.id,
      status: "acquired" as const,
      validatedAt: relative(-15),
    })
  );
  quranSkillRows.slice(0, 3).forEach((skill) =>
    progressRows.push({
      studentProfileId: profiles[2].id,
      skillId: skill.id,
      status: "acquired" as const,
      validatedAt: relative(-45),
    })
  );
  if (progressRows.length > 0) {
    await db.insert(schema.skillProgress).values(progressRows);
  }

  console.log(`  Skill progress created (${progressRows.length}).`);

  // ─── Évaluations ─────────────────────────────────────
  const insertedAssessments = await db
    .insert(schema.assessments)
    .values([
      {
        title: "Contrôle — lettres isolées",
        type: "quiz" as const,
        status: "published" as const,
        programId: nourania.id,
        groupId: insertedGroups[0].id,
        description: "Reconnaissance et prononciation des 28 lettres.",
        maxScore: 20,
        heldOn: relative(-21),
      },
      {
        title: "Examen de fin de module — Nourania 1",
        type: "exam" as const,
        status: "published" as const,
        programId: nourania.id,
        maxScore: 40,
        heldOn: relative(-7),
      },
      {
        title: "Test de niveau — entrée de septembre",
        type: "placement" as const,
        status: "draft" as const,
        programId: quranAccompaniment.id,
        maxScore: 20,
        heldOn: relative(3),
      },
    ])
    .returning();

  await db.insert(schema.assessmentResults).values([
    {
      assessmentId: insertedAssessments[0].id,
      studentProfileId: profiles[0].id,
      score: 18,
      comment: "Très bonne prononciation, deux confusions sur les emphatiques.",
      gradedAt: relative(-20),
    },
    {
      assessmentId: insertedAssessments[0].id,
      studentProfileId: profiles[1].id,
      score: 13,
      comment: "À revoir : les lettres de la gorge.",
      gradedAt: relative(-20),
    },
    {
      assessmentId: insertedAssessments[0].id,
      studentProfileId: profiles[3].id,
      score: 16,
      gradedAt: relative(-20),
    },
    {
      assessmentId: insertedAssessments[1].id,
      studentProfileId: profiles[0].id,
      score: 35,
      comment: "Module acquis.",
      gradedAt: relative(-5),
    },
    {
      assessmentId: insertedAssessments[1].id,
      studentProfileId: profiles[1].id,
      score: 26,
      gradedAt: relative(-5),
    },
  ]);

  console.log("  Assessments created (3) with 5 results.");

  // ─── Diplômes ────────────────────────────────────────
  await db.insert(schema.certificates).values([
    {
      studentProfileId: profiles[0].id,
      programId: nourania.id,
      reference: "DIP-2026-0001",
      title: "Attestation — Nourania, niveau 1",
      status: "issued" as const,
      mention: "tres_bien" as const,
      overallScore: 87,
      basis: {
        skillsAcquired: 4,
        skillsTotal: 12,
        progressRate: 33.3,
        assessmentAverage: 87.5,
        attendanceRate: 100,
        memorizedAyahs: 10,
        sessionsCompleted: 6,
      },
      comment: "Parcours régulier, prononciation soignée.",
      issuedOn: new Date(relative(-4)),
    },
    {
      studentProfileId: profiles[1].id,
      programId: nourania.id,
      title: "Attestation — Nourania, niveau 1",
      status: "draft" as const,
      mention: "bien" as const,
      overallScore: 68,
      basis: {
        skillsAcquired: 2,
        skillsTotal: 12,
        progressRate: 16.7,
        assessmentAverage: 65,
        attendanceRate: 80,
        memorizedAyahs: 20,
        sessionsCompleted: 5,
      },
      comment: "En attente de l'examen de rattrapage.",
    },
  ]);

  console.log("  Certificates created (2).");

  // ─── Factures ────────────────────────────────────────
  // Le numéro n'est attribué qu'à l'émission : le brouillon n'en a pas,
  // donc le supprimer ne laisse pas de trou dans la série.
  const lines1 = [
    { label: "Forfait Nourania — 8 séances", quantity: 1, unitPriceCents: 16000 },
  ];
  const lines2 = [
    { label: "Forfait Coran — 8 séances", quantity: 1, unitPriceCents: 20000 },
    { label: "Manuel Nourania", quantity: 1, unitPriceCents: 1500 },
  ];
  const lines3 = [
    { label: "Forfait Nourania — 4 séances", quantity: 1, unitPriceCents: 8000 },
  ];

  await db.insert(schema.invoices).values([
    {
      studentProfileId: profiles[0].id,
      subscriptionId: subs[0].id,
      number: "2026-0001",
      status: "paid" as const,
      issueDate: new Date(relative(-60)),
      dueDate: new Date(relative(-45)),
      lines: lines1,
      totalCents: schema.computeInvoiceTotal(lines1),
      paidAt: relative(-52),
    },
    {
      studentProfileId: profiles[2].id,
      number: "2026-0002",
      status: "issued" as const,
      issueDate: new Date(relative(-10)),
      dueDate: new Date(relative(5)),
      lines: lines2,
      totalCents: schema.computeInvoiceTotal(lines2),
    },
    {
      studentProfileId: profiles[1].id,
      status: "draft" as const,
      lines: lines3,
      totalCents: schema.computeInvoiceTotal(lines3),
      notes: "À confirmer avec la famille avant émission.",
    },
  ]);

  console.log("  Invoices created (3).");

  // ─── Actualités ──────────────────────────────────────
  await db.insert(schema.posts).values([
    {
      authorId: admin.id,
      title: "Reprise des cours le 8 septembre",
      slug: "reprise-des-cours-le-8-septembre",
      category: "Vie de l'institut",
      excerpt: "Les créneaux de la rentrée sont en ligne.",
      content:
        "Les cours reprennent le lundi 8 septembre. Les créneaux de chaque groupe sont visibles depuis votre espace, onglet Séances.\n\nLes inscriptions restent ouvertes jusqu'au 30 septembre, dans la limite des places disponibles.",
      status: "published" as const,
      pinned: true,
      publishedAt: relative(-30),
    },
    {
      authorId: admin.id,
      title: "Concours de mémorisation — inscriptions ouvertes",
      slug: "concours-de-memorisation-inscriptions-ouvertes",
      category: "Événements",
      excerpt: "Trois catégories, du juz 'Amma au juz Tabarak.",
      content:
        "Le concours annuel de mémorisation se tiendra le dernier samedi du mois.\n\nTrois catégories sont proposées selon la portion mémorisée. L'inscription se fait auprès de votre enseignante.",
      status: "published" as const,
      publishedAt: relative(-9),
    },
    {
      authorId: admin.id,
      title: "Fermeture exceptionnelle",
      slug: "fermeture-exceptionnelle",
      category: "Vie de l'institut",
      content: "Brouillon — préciser les dates avant publication.",
      status: "draft" as const,
    },
  ]);

  console.log("  Posts created (3).");

  // ─── Prospects et rendez-vous ────────────────────────
  const prospectData: (typeof schema.prospects.$inferInsert)[] = [
      {
        name: "Leila Amrani",
        email: "leila.amrani@email.com",
        phone: "+33 6 22 33 44 55",
        source: "Instagram",
        status: "trial_scheduled" as const,
        programId: nourania.id,
        declaredLevel: "debutant" as const,
        notes: "Disponible en soirée.",
      },
      {
        name: "Salma Ouali",
        email: "salma.ouali@email.com",
        source: "Bouche-à-oreille",
        status: "contacted" as const,
        programId: quranAccompaniment.id,
        declaredLevel: "intermediaire" as const,
      },
      {
        name: "Rania Belkacem",
        phone: "+33 7 88 99 00 11",
        source: "Site internet",
        status: "new" as const,
      },
      {
        name: "Imane Tazi",
        email: "imane.tazi@email.com",
        source: "Site internet",
        status: "lost" as const,
        lostReason: "Horaires incompatibles.",
      },
  ];

  const insertedProspects = await db
    .insert(schema.prospects)
    .values(prospectData)
    .returning();

  await db.insert(schema.appointments).values([
    {
      prospectId: insertedProspects[0].id,
      title: "Cours d'essai — Nourania",
      scheduledAt: relative(2),
      durationMinutes: 45,
      status: "scheduled" as const,
      meetingLink: "#",
    },
    {
      prospectId: insertedProspects[1].id,
      title: "Appel de présentation",
      scheduledAt: relative(-3),
      durationMinutes: 20,
      status: "done" as const,
      notes: "Souhaite commencer en octobre.",
    },
    {
      studentProfileId: profiles[1].id,
      title: "Point pédagogique avec la famille",
      scheduledAt: relative(5),
      durationMinutes: 30,
      status: "scheduled" as const,
    },
  ]);

  console.log("  Prospects created (4) with 3 appointments.");

  // ─── Équipe et paie ──────────────────────────────────
  // Rémunération horaire OU mensuelle, jamais les deux.
  const [lead] = await db
    .insert(schema.staffMembers)
    .values([
      {
        name: "Oum Soumaya",
        email: "responsable@maraakiz.com",
        role: "pedagogical_lead" as const,
        status: "active" as const,
        monthlyRateCents: 180000,
        hiredOn: new Date(relative(-700)),
      },
    ])
    .returning();

  const insertedStaff = await db
    .insert(schema.staffMembers)
    .values([
      {
        name: "Oum Khadija",
        email: "khadija@maraakiz.com",
        phone: "+33 6 11 22 33 44",
        role: "teacher" as const,
        status: "active" as const,
        hourlyRateCents: 2500,
        hiredOn: new Date(relative(-400)),
        supervisorId: lead.id,
      },
      {
        name: "Oum Maryam",
        email: "maryam@maraakiz.com",
        role: "teacher" as const,
        status: "active" as const,
        hourlyRateCents: 2200,
        hiredOn: new Date(relative(-200)),
        supervisorId: lead.id,
      },
      {
        name: "Nadia Sekkat",
        email: "secretariat@maraakiz.com",
        role: "secretary" as const,
        status: "active" as const,
        monthlyRateCents: 90000,
        hiredOn: new Date(relative(-150)),
        supervisorId: lead.id,
      },
    ])
    .returning();

  const period = new Date().toISOString().slice(0, 7);
  const previousPeriod = new Date(Date.now() - 31 * day).toISOString().slice(0, 7);

  await db.insert(schema.payrollEntries).values([
    {
      staffMemberId: insertedStaff[0].id,
      period: previousPeriod,
      status: "paid" as const,
      sessionsCount: 24,
      minutesWorked: 1440,
      amountCents: 60000,
      paidOn: new Date(relative(-5)),
    },
    {
      staffMemberId: insertedStaff[1].id,
      period: previousPeriod,
      status: "paid" as const,
      sessionsCount: 12,
      minutesWorked: 720,
      amountCents: 26400,
      paidOn: new Date(relative(-5)),
    },
    {
      staffMemberId: lead.id,
      period,
      status: "draft" as const,
      amountCents: 180000,
    },
  ]);

  console.log("  Staff created (4) with 3 payroll entries.");

  // ─── Documents administratifs ────────────────────────
  await db.insert(schema.documents).values([
    {
      studentProfileId: profiles[0].id,
      title: "Contrat d'inscription 2026",
      type: "contract" as const,
      fileUrl: "#",
      signedOn: new Date(relative(-120)),
    },
    {
      studentProfileId: profiles[0].id,
      title: "Autorisation de droit à l'image",
      type: "authorization" as const,
      fileUrl: "#",
      signedOn: new Date(relative(-120)),
      expiresOn: new Date(relative(20)),
    },
    {
      studentProfileId: profiles[1].id,
      title: "Contrat d'inscription 2026",
      type: "contract" as const,
      fileUrl: "#",
      signedOn: new Date(relative(-90)),
    },
    {
      title: "Règlement intérieur",
      type: "other" as const,
      fileUrl: "#",
      notes: "Document commun, remis à chaque inscription.",
    },
  ]);

  console.log("  Documents created (4).");

  // ─── Boutique ────────────────────────────────────────
  const insertedItems = await db
    .insert(schema.shopItems)
    .values([
      {
        name: "Manuel Al-Qaida An-Noraniya",
        description: "Édition cartonnée, format A4.",
        priceCents: 1500,
        stock: 12,
        status: "available" as const,
      },
      {
        name: "Mushaf Tajwid — format moyen",
        description: "Règles de tajwid en couleurs.",
        priceCents: 2500,
        stock: 5,
        status: "available" as const,
      },
      {
        name: "Cahier d'exercices Nourania",
        priceCents: 800,
        stock: 0,
        status: "out_of_stock" as const,
      },
      {
        name: "Trousse Maraakiz",
        priceCents: 600,
        stock: null, // stock non suivi
        status: "available" as const,
      },
    ])
    .returning();

  const orderLines = [
    {
      itemId: insertedItems[0].id,
      label: insertedItems[0].name,
      quantity: 1,
      unitPriceCents: 1500,
    },
  ];

  await db.insert(schema.orders).values([
    {
      studentProfileId: profiles[0].id,
      status: "delivered" as const,
      lines: orderLines,
      totalCents: 1500,
      paidAt: relative(-14),
      deliveredAt: relative(-12),
    },
    {
      studentProfileId: profiles[2].id,
      status: "pending" as const,
      lines: [
        {
          itemId: insertedItems[1].id,
          label: insertedItems[1].name,
          quantity: 1,
          unitPriceCents: 2500,
        },
      ],
      totalCents: 2500,
    },
  ]);

  console.log("  Shop items created (4) with 2 orders.");

  // ─── Parrainage ──────────────────────────────────────
  // La récompense n'est acquise qu'à l'inscription de la filleule.
  await db.insert(schema.referralCodes).values(
    profiles.slice(0, 3).map((profile) => ({
      studentProfileId: profile.id,
      code: schema.generateReferralCode(profile.id),
    }))
  );

  await db.insert(schema.referrals).values([
    {
      referrerProfileId: profiles[0].id,
      prospectId: insertedProspects[0].id,
      status: "pending" as const,
      rewardCents: 2000,
    },
    {
      referrerProfileId: profiles[1].id,
      referredProfileId: profiles[4].id,
      status: "earned" as const,
      rewardCents: 2000,
      earnedAt: relative(-40),
    },
    {
      referrerProfileId: profiles[0].id,
      referredProfileId: profiles[3].id,
      status: "rewarded" as const,
      rewardCents: 2000,
      earnedAt: relative(-100),
      rewardedAt: relative(-95),
    },
  ]);

  console.log("  Referral codes created (3) with 3 referrals.");

  // ─── Cours interactifs ───────────────────────────────
  // Un cours sans leçon ne peut pas être publié.
  const insertedCourses = await db
    .insert(schema.courses)
    .values([
      {
        programId: nourania.id,
        title: "Les lettres de l'alphabet, pas à pas",
        description:
          "Une leçon par groupe de lettres, avec la prononciation et un exercice.",
        status: "published" as const,
        sortOrder: 1,
      },
      {
        programId: quranAccompaniment.id,
        title: "Les règles de base du tajwid",
        description: "Idghâm, ikhfâ, qalqala : la théorie et l'écoute.",
        status: "published" as const,
        sortOrder: 2,
      },
      {
        programId: nourania.id,
        title: "Les prolongations (brouillon)",
        status: "draft" as const,
        sortOrder: 3,
      },
    ])
    .returning();

  const insertedLessons = await db
    .insert(schema.lessons)
    .values([
      {
        courseId: insertedCourses[0].id,
        title: "Les lettres de la gorge",
        type: "video" as const,
        contentUrl: "#",
        durationMinutes: 8,
        sortOrder: 1,
      },
      {
        courseId: insertedCourses[0].id,
        title: "Les lettres emphatiques",
        type: "video" as const,
        contentUrl: "#",
        durationMinutes: 11,
        sortOrder: 2,
      },
      {
        courseId: insertedCourses[0].id,
        title: "Exercice — reconnaître la lettre entendue",
        type: "exercise" as const,
        content:
          "Écoutez chaque enregistrement et notez la lettre prononcée, puis vérifiez avec votre enseignante.",
        sortOrder: 3,
      },
      {
        courseId: insertedCourses[1].id,
        title: "La qalqala",
        type: "audio" as const,
        contentUrl: "#",
        durationMinutes: 6,
        sortOrder: 1,
      },
      {
        courseId: insertedCourses[1].id,
        title: "Fiche — les cinq lettres de la qalqala",
        type: "text" as const,
        content:
          "Qâf, tâ, bâ, jîm, dâl. Elles rebondissent lorsqu'elles portent un soukoun.",
        sortOrder: 2,
      },
    ])
    .returning();

  await db.insert(schema.lessonProgress).values([
    {
      lessonId: insertedLessons[0].id,
      studentProfileId: profiles[0].id,
      completedAt: relative(-6),
    },
    {
      lessonId: insertedLessons[1].id,
      studentProfileId: profiles[0].id,
      completedAt: relative(-2),
    },
    {
      lessonId: insertedLessons[3].id,
      studentProfileId: profiles[2].id,
      completedAt: relative(-1),
    },
  ]);

  console.log("  Courses created (3) with 5 lessons.");

  // ─── Done ────────────────────────────────────────────
  console.log("\nSeed complete.");
  await pool.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
