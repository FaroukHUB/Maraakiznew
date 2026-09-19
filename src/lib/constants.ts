// Labels pour les programmes — fallback statique.
// En Phase 3+, on pourra les charger depuis la table programs.
export const PROGRAM_LABELS: Record<string, string> = {
  nourania: "Nourania",
  quran_accompaniment: "Accompagnement Coran",
};

export const LEVEL_LABELS: Record<string, string> = {
  debutant: "Débutante",
  intermediaire: "Intermédiaire",
  avance: "Avancée",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  received: "Reçu",
  failed: "Échoué",
  refunded: "Remboursé",
};

export const SESSION_STATUS_LABELS: Record<string, string> = {
  planned: "Planifiée",
  completed: "Terminée",
  cancelled: "Annulée",
  student_absent: "Élève absente",
  teacher_absent: "Prof absente",
};

export const PACK_STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  completed: "Terminé",
  cancelled: "Annulé",
};

export const DEFAULT_PACK_SESSIONS = 8;
export const DEFAULT_WEEKLY_RHYTHM = 2;

export const ASSESSMENT_TYPE_LABELS: Record<string, string> = {
  quiz: "Quiz",
  exam: "Évaluation",
  placement: "Test de niveau",
  contest: "Concours",
};
