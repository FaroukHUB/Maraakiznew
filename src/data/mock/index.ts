import type {
  User,
  StudentProfile,
  Pack,
  Session,
  SessionParticipant,
  SessionResource,
  Resource,
  Payment,
  BlogPost,
} from "@/types";

// ==============================
// Users
// ==============================

export const MOCK_USERS: User[] = [
  {
    id: "u-admin-1",
    email: "admin@maraakiz.com",
    name: "Farouk",
    role: "admin",
    createdAt: new Date("2024-09-01"),
  },
  {
    id: "u-student-1",
    email: "amina.b@email.com",
    name: "Amina Benali",
    role: "student",
    createdAt: new Date("2025-01-10"),
  },
  {
    id: "u-student-2",
    email: "khadija.m@email.com",
    name: "Khadija Mansouri",
    role: "student",
    createdAt: new Date("2025-02-05"),
  },
  {
    id: "u-student-3",
    email: "sarah.h@email.com",
    name: "Sarah Hadj",
    role: "student",
    createdAt: new Date("2025-03-01"),
  },
  {
    id: "u-student-4",
    email: "fatima.z@email.com",
    name: "Fatima Zahra",
    role: "student",
    createdAt: new Date("2025-01-20"),
  },
  {
    id: "u-student-5",
    email: "nour.a@email.com",
    name: "Nour Alaoui",
    role: "student",
    createdAt: new Date("2025-03-15"),
  },
  {
    id: "u-student-6",
    email: "yasmine.d@email.com",
    name: "Yasmine Djebbar",
    role: "student",
    createdAt: new Date("2025-02-20"),
  },
];

// ==============================
// Student profiles
// ==============================

export const MOCK_STUDENT_PROFILES: StudentProfile[] = [
  {
    id: "sp-1",
    userId: "u-student-1",
    whatsappPhone: "+33612345678",
    localPhone: "+21312345678",
    paypalAddress: "amina.b@email.com",
    arabicReadingLevel: "debutant",
    previousExperience: "Quelques bases apprises en mosquée étant petite",
    track: "nourania",
    trackStartDate: new Date("2025-01-15"),
    createdAt: new Date("2025-01-10"),
    updatedAt: new Date("2025-01-10"),
  },
  {
    id: "sp-2",
    userId: "u-student-2",
    whatsappPhone: "+33698765432",
    paypalAddress: "khadija.m@email.com",
    arabicReadingLevel: "intermediaire",
    previousExperience: "A terminé la Nourania il y a 1 an, souhaite lire le Coran",
    track: "quran_accompaniment",
    trackStartDate: new Date("2025-02-10"),
    createdAt: new Date("2025-02-05"),
    updatedAt: new Date("2025-02-05"),
  },
  {
    id: "sp-3",
    userId: "u-student-3",
    whatsappPhone: "+33611223344",
    arabicReadingLevel: "debutant",
    track: "nourania",
    trackStartDate: new Date("2025-03-05"),
    createdAt: new Date("2025-03-01"),
    updatedAt: new Date("2025-03-01"),
  },
  {
    id: "sp-4",
    userId: "u-student-4",
    whatsappPhone: "+33655443322",
    paypalAddress: "fatima.z@email.com",
    arabicReadingLevel: "intermediaire",
    previousExperience: "Nourania terminée, lecture lente du Coran",
    track: "quran_accompaniment",
    trackStartDate: new Date("2025-01-25"),
    createdAt: new Date("2025-01-20"),
    updatedAt: new Date("2025-01-20"),
  },
  {
    id: "sp-5",
    userId: "u-student-5",
    whatsappPhone: "+33677889900",
    arabicReadingLevel: "debutant",
    previousExperience: "Aucune base en arabe",
    track: "nourania",
    trackStartDate: new Date("2025-03-20"),
    createdAt: new Date("2025-03-15"),
    updatedAt: new Date("2025-03-15"),
  },
  {
    id: "sp-6",
    userId: "u-student-6",
    whatsappPhone: "+33644556677",
    paypalAddress: "yasmine.d@email.com",
    arabicReadingLevel: "avance",
    previousExperience: "Nourania + lecture Juz Amma terminés",
    track: "quran_accompaniment",
    trackStartDate: new Date("2025-02-25"),
    createdAt: new Date("2025-02-20"),
    updatedAt: new Date("2025-02-20"),
  },
];

// ==============================
// Packs
// ==============================

export const MOCK_PACKS: Pack[] = [
  {
    id: "pack-1",
    studentId: "sp-1",
    track: "nourania",
    sessionType: "group",
    totalSessions: 8,
    weeklyRhythm: 2,
    priceCents: 6000,
    status: "active",
    startedAt: new Date("2025-03-17"),
    expiresAt: new Date("2025-04-14"),
    createdAt: new Date("2025-03-15"),
  },
  {
    id: "pack-2",
    studentId: "sp-2",
    track: "quran_accompaniment",
    sessionType: "individual",
    totalSessions: 8,
    weeklyRhythm: 2,
    priceCents: 10000,
    status: "active",
    startedAt: new Date("2025-03-10"),
    expiresAt: new Date("2025-04-07"),
    createdAt: new Date("2025-03-08"),
  },
  {
    id: "pack-3",
    studentId: "sp-3",
    track: "nourania",
    sessionType: "group",
    totalSessions: 8,
    weeklyRhythm: 2,
    priceCents: 6000,
    status: "active",
    startedAt: new Date("2025-03-17"),
    expiresAt: new Date("2025-04-14"),
    createdAt: new Date("2025-03-15"),
  },
  {
    id: "pack-4",
    studentId: "sp-4",
    track: "quran_accompaniment",
    sessionType: "group",
    totalSessions: 8,
    weeklyRhythm: 2,
    priceCents: 8000,
    status: "active",
    startedAt: new Date("2025-03-03"),
    expiresAt: new Date("2025-03-31"),
    createdAt: new Date("2025-03-01"),
  },
  {
    id: "pack-5",
    studentId: "sp-5",
    track: "nourania",
    sessionType: "group",
    totalSessions: 8,
    weeklyRhythm: 2,
    priceCents: 6000,
    status: "active",
    startedAt: new Date("2025-03-24"),
    expiresAt: new Date("2025-04-21"),
    createdAt: new Date("2025-03-20"),
  },
  {
    id: "pack-6",
    studentId: "sp-6",
    track: "quran_accompaniment",
    sessionType: "group",
    totalSessions: 8,
    weeklyRhythm: 2,
    priceCents: 8000,
    status: "active",
    startedAt: new Date("2025-03-03"),
    expiresAt: new Date("2025-03-31"),
    createdAt: new Date("2025-03-01"),
  },
];

// ==============================
// Sessions
// ==============================

export const MOCK_SESSIONS: Session[] = [
  // Pack 1 — Amina (Nourania group) — 5/8 done
  ...[1, 2, 3, 4, 5].map((n) => ({
    id: `sess-p1-${n}`,
    packId: "pack-1",
    sessionNumber: n,
    scheduledAt: new Date(2025, 2, 17 + Math.floor((n - 1) / 2) * 7 + ((n - 1) % 2) * 3),
    durationMinutes: 60,
    status: "completed" as const,
    zoomLink: "https://zoom.us/j/example",
    notes:
      n === 5
        ? "Arrêt page 12 de la Qaida Nourania. Révision des lettres ب ت ث et leurs formes. Bonne progression."
        : `Séance ${n} — révision et avancement Qaida Nourania.`,
    homework:
      n === 5
        ? "Réviser les lettres de la page 12. Écouter l'audio de la leçon 5. Pratiquer la lecture 15 min/jour."
        : undefined,
    createdAt: new Date(2025, 2, 15),
    updatedAt: new Date(2025, 2, 17 + Math.floor((n - 1) / 2) * 7 + ((n - 1) % 2) * 3),
  })),
  // Pack 1 — upcoming sessions
  ...[6, 7, 8].map((n) => ({
    id: `sess-p1-${n}`,
    packId: "pack-1",
    sessionNumber: n,
    scheduledAt: new Date(2025, 3, 7 + ((n - 6) % 2) * 3 + Math.floor((n - 6) / 2) * 7),
    durationMinutes: 60,
    status: "scheduled" as const,
    zoomLink: "https://zoom.us/j/example",
    createdAt: new Date(2025, 2, 15),
    updatedAt: new Date(2025, 2, 15),
  })),
  // Pack 2 — Khadija (Quran individual) — 6/8 done
  ...[1, 2, 3, 4, 5, 6].map((n) => ({
    id: `sess-p2-${n}`,
    packId: "pack-2",
    sessionNumber: n,
    scheduledAt: new Date(2025, 2, 10 + Math.floor((n - 1) / 2) * 7 + ((n - 1) % 2) * 3),
    durationMinutes: 45,
    status: "completed" as const,
    notes:
      n === 6
        ? "Lecture sourate Al-Fatiha avec tajwid. Travail sur l'idgham et l'ikhfa. Très bon niveau."
        : `Séance ${n} — accompagnement lecture Coran.`,
    homework:
      n === 6
        ? "Relire sourate Al-Fatiha 3 fois avec les règles vues. Écouter le récitateur Husary."
        : undefined,
    createdAt: new Date(2025, 2, 8),
    updatedAt: new Date(2025, 2, 10 + Math.floor((n - 1) / 2) * 7 + ((n - 1) % 2) * 3),
  })),
  ...[7, 8].map((n) => ({
    id: `sess-p2-${n}`,
    packId: "pack-2",
    sessionNumber: n,
    scheduledAt: new Date(2025, 3, 7 + ((n - 7) % 2) * 3),
    durationMinutes: 45,
    status: "scheduled" as const,
    zoomLink: "https://zoom.us/j/example",
    createdAt: new Date(2025, 2, 8),
    updatedAt: new Date(2025, 2, 8),
  })),
  // Pack 4 — Fatima (Quran group) — 7/8 done
  ...[1, 2, 3, 4, 5, 6, 7].map((n) => ({
    id: `sess-p4-${n}`,
    packId: "pack-4",
    sessionNumber: n,
    scheduledAt: new Date(2025, 2, 3 + Math.floor((n - 1) / 2) * 7 + ((n - 1) % 2) * 3),
    durationMinutes: 60,
    status: "completed" as const,
    notes: `Séance ${n} — lecture Coran en groupe.`,
    createdAt: new Date(2025, 2, 1),
    updatedAt: new Date(2025, 2, 3 + Math.floor((n - 1) / 2) * 7 + ((n - 1) % 2) * 3),
  })),
  {
    id: "sess-p4-8",
    packId: "pack-4",
    sessionNumber: 8,
    scheduledAt: new Date(2025, 3, 14),
    durationMinutes: 60,
    status: "scheduled",
    zoomLink: "https://zoom.us/j/example",
    createdAt: new Date(2025, 2, 1),
    updatedAt: new Date(2025, 2, 1),
  },
];

// ==============================
// Session participants (for group sessions)
// ==============================

export const MOCK_SESSION_PARTICIPANTS: SessionParticipant[] = [
  // Pack 1 & 3 share group sessions (Amina + Sarah in Nourania group)
  ...[1, 2, 3, 4, 5].flatMap((n) => [
    { id: `part-p1-${n}-1`, sessionId: `sess-p1-${n}`, studentId: "sp-1", attended: true },
    { id: `part-p1-${n}-2`, sessionId: `sess-p1-${n}`, studentId: "sp-3", attended: n !== 3 },
  ]),
  // Pack 4 & 6 share group sessions (Fatima + Yasmine in Quran group)
  ...[1, 2, 3, 4, 5, 6, 7].flatMap((n) => [
    { id: `part-p4-${n}-1`, sessionId: `sess-p4-${n}`, studentId: "sp-4", attended: true },
    { id: `part-p4-${n}-2`, sessionId: `sess-p4-${n}`, studentId: "sp-6", attended: true },
  ]),
];

// ==============================
// Session resources
// ==============================

export const MOCK_SESSION_RESOURCES: SessionResource[] = [
  {
    id: "sr-1",
    sessionId: "sess-p1-5",
    title: "Synthèse leçon 5 — Nourania",
    type: "summary",
    url: "#",
    visibleTo: "participants_only",
    createdAt: new Date("2025-04-07"),
  },
  {
    id: "sr-2",
    sessionId: "sess-p1-5",
    title: "Diapo séance 5",
    type: "slide",
    url: "#",
    visibleTo: "participants_only",
    createdAt: new Date("2025-04-07"),
  },
  {
    id: "sr-3",
    sessionId: "sess-p1-5",
    title: "Exercices lettres ب ت ث",
    type: "exercise",
    url: "#",
    visibleTo: "participants_only",
    createdAt: new Date("2025-04-07"),
  },
  {
    id: "sr-4",
    sessionId: "sess-p2-6",
    title: "Replay — Séance 6 Khadija",
    type: "replay_video",
    url: "#",
    visibleTo: "participants_only",
    createdAt: new Date("2025-03-31"),
  },
  {
    id: "sr-5",
    sessionId: "sess-p2-6",
    title: "Règles d'idgham — Fiche récap",
    type: "summary",
    url: "#",
    visibleTo: "all",
    createdAt: new Date("2025-03-31"),
  },
];

// ==============================
// Resources (global library)
// ==============================

export const MOCK_RESOURCES: Resource[] = [
  {
    id: "res-1",
    title: "Qaida Nourania — PDF complet",
    description: "Le support principal de la méthode Nourania",
    type: "pdf",
    url: "#",
    track: "nourania",
    category: "Qaida Nourania",
    sortOrder: 1,
    createdAt: new Date("2024-09-01"),
  },
  {
    id: "res-2",
    title: "Audio — Leçons Nourania 1 à 17",
    description: "Enregistrements audio de toutes les leçons Nourania",
    type: "audio",
    url: "#",
    track: "nourania",
    category: "Qaida Nourania",
    sortOrder: 2,
    createdAt: new Date("2024-09-01"),
  },
  {
    id: "res-3",
    title: "Juz Amma — PDF",
    type: "pdf",
    url: "#",
    track: "quran_accompaniment",
    category: "Juz Amma",
    sortOrder: 1,
    createdAt: new Date("2024-09-01"),
  },
  {
    id: "res-4",
    title: "Juz Tabarak — PDF",
    type: "pdf",
    url: "#",
    track: "quran_accompaniment",
    category: "Juz Tabarak",
    sortOrder: 2,
    createdAt: new Date("2024-09-01"),
  },
  {
    id: "res-5",
    title: "Synthèses des règles de tajwid",
    description: "Fiches récapitulatives des principales règles",
    type: "pdf",
    url: "#",
    track: "both",
    category: "Synthèses",
    sortOrder: 3,
    createdAt: new Date("2024-09-01"),
  },
];

// ==============================
// Payments
// ==============================

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: "pay-1",
    packId: "pack-1",
    studentId: "sp-1",
    amountCents: 6000,
    method: "paypal",
    status: "received",
    paidAt: new Date("2025-03-15"),
    createdAt: new Date("2025-03-15"),
  },
  {
    id: "pay-2",
    packId: "pack-2",
    studentId: "sp-2",
    amountCents: 10000,
    method: "paypal",
    status: "received",
    paidAt: new Date("2025-03-08"),
    createdAt: new Date("2025-03-08"),
  },
  {
    id: "pay-3",
    packId: "pack-3",
    studentId: "sp-3",
    amountCents: 6000,
    method: "paypal",
    status: "pending",
    createdAt: new Date("2025-03-15"),
  },
  {
    id: "pay-4",
    packId: "pack-4",
    studentId: "sp-4",
    amountCents: 8000,
    method: "bank_transfer",
    status: "received",
    paidAt: new Date("2025-03-01"),
    createdAt: new Date("2025-03-01"),
  },
  {
    id: "pay-5",
    packId: "pack-5",
    studentId: "sp-5",
    amountCents: 6000,
    method: "paypal",
    status: "pending",
    createdAt: new Date("2025-03-20"),
  },
  {
    id: "pay-6",
    packId: "pack-6",
    studentId: "sp-6",
    amountCents: 8000,
    method: "paypal",
    status: "received",
    paidAt: new Date("2025-03-01"),
    createdAt: new Date("2025-03-01"),
  },
];

// ==============================
// Blog posts
// ==============================

export const MOCK_BLOG_POSTS: BlogPost[] = [
  {
    id: "blog-1",
    title: "L'importance de la régularité dans l'apprentissage",
    content:
      "La régularité est la clé de tout apprentissage réussi. En consacrant ne serait-ce que 15 minutes par jour à la révision, vous progresserez bien plus vite qu'en faisant de longues sessions espacées. Le Prophète ﷺ a dit : « L'œuvre la plus aimée d'Allah est celle qui est régulière, même si elle est peu. »",
    track: "both",
    published: true,
    publishedAt: new Date("2025-03-01"),
    authorId: "u-admin-1",
    createdAt: new Date("2025-03-01"),
    updatedAt: new Date("2025-03-01"),
  },
  {
    id: "blog-2",
    title: "Conseils pour bien réviser la Nourania",
    content:
      "1. Écoutez l'audio avant de lire\n2. Répétez chaque ligne 3 fois\n3. Enregistrez-vous et comparez avec l'audio\n4. Révisez les leçons précédentes régulièrement\n5. Faites vos exercices le jour même du cours",
    track: "nourania",
    published: true,
    publishedAt: new Date("2025-03-15"),
    authorId: "u-admin-1",
    createdAt: new Date("2025-03-15"),
    updatedAt: new Date("2025-03-15"),
  },
];
