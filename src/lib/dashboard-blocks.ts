/**
 * Les blocs du tableau de bord, et ce qui n'en est pas un.
 *
 * ── Ce qui ne se retire jamais ──
 *
 * Le salam, la date et l'heure ne sont PAS des blocs. Ils ne figurent pas
 * dans cette liste et n'ont pas d'interrupteur : c'est le socle de
 * l'écran, et l'institut s'adresse à des musulmanes. Tout le reste se
 * compose. Ce commentaire fait foi.
 *
 * ── La règle de robustesse ──
 *
 * La préférence enregistrée ne stocke QUE l'ordre et les blocs masqués.
 * Une clé inconnue est ignorée — un bloc supprimé du code ne casse pas
 * les préférences déjà enregistrées. Un bloc AJOUTÉ plus tard n'est pas
 * dans la préférence : il apparaît donc, à sa place par défaut. C'est le
 * bon sens : une nouveauté se voit, elle ne se cache pas.
 */

export type BlockKind = "tuile" | "panneau" | "bandeau";

export type DashboardBlock = {
  key: string;
  label: string;
  description: string;
  kind: BlockKind;
};

/**
 * L'ordre de cette liste est l'ordre par défaut de l'écran.
 */
export const DASHBOARD_BLOCKS: DashboardBlock[] = [
  {
    key: "hero.actions",
    label: "Ce qui attend",
    description: "Les pastilles « À traiter » dans le bandeau d'accueil.",
    kind: "bandeau",
  },
  {
    key: "hero.zones",
    label: "Fuseaux des élèves",
    description: "L'heure qu'il est chez chacune, dans le bandeau.",
    kind: "bandeau",
  },

  { key: "tile.students", label: "Élèves", description: "Le nombre d'élèves et celles qui ont un forfait actif.", kind: "tuile" },
  { key: "tile.sessions", label: "Séances cette semaine", description: "Le compte de la semaine, et la journée en cours.", kind: "tuile" },
  { key: "tile.attendance", label: "Assiduité", description: "Le taux du mois, et les séances sans appel.", kind: "tuile" },
  { key: "tile.reviews", label: "Révisions dues", description: "Les portions à réviser, et les retards.", kind: "tuile" },
  { key: "tile.payments", label: "Paiements en attente", description: "Ce qui reste à encaisser.", kind: "tuile" },
  { key: "tile.renewals", label: "Forfaits à renouveler", description: "Les forfaits en fin de course.", kind: "tuile" },

  { key: "panel.today", label: "Aujourd'hui", description: "Les séances du jour, avec le repère de l'heure courante.", kind: "panneau" },
  { key: "panel.progress", label: "Progression", description: "La moyenne par programme.", kind: "panneau" },
  { key: "panel.upcoming", label: "Prochaines séances", description: "Les séances à venir.", kind: "panneau" },
  { key: "panel.reviews", label: "Révisions urgentes", description: "Les portions les plus en retard.", kind: "panneau" },
  { key: "panel.alerts", label: "Alertes", description: "Forfaits bientôt terminés et impayés.", kind: "panneau" },
];

export const BLOCK_KEYS = DASHBOARD_BLOCKS.map((block) => block.key);

const KNOWN = new Set(BLOCK_KEYS);

/** Ce qui est enregistré pour une personne. */
export type DashboardLayout = {
  /** Ordre choisi. Les blocs absents gardent leur place par défaut. */
  order: string[];
  /** Blocs explicitement masqués. */
  hidden: string[];
};

export const DEFAULT_LAYOUT: DashboardLayout = { order: [], hidden: [] };

/**
 * Un écran « épuré » : la journée, et le strict nécessaire.
 *
 * Proposé comme raccourci, pas imposé — certaines enseignantes veulent
 * tout voir, d'autres rien d'autre que leur journée.
 */
export const MINIMAL_LAYOUT: DashboardLayout = {
  order: [],
  hidden: BLOCK_KEYS.filter(
    (key) =>
      ![
        "hero.actions",
        "tile.sessions",
        "tile.attendance",
        "panel.today",
      ].includes(key)
  ),
};

/**
 * Nettoie ce qui vient de la base.
 *
 * Une préférence enregistrée il y a six mois peut citer des blocs qui
 * n'existent plus, en oublier de nouveaux, ou contenir des doublons.
 * Rien de tout cela ne doit casser l'écran.
 */
export function normalizeLayout(raw: unknown): DashboardLayout {
  const value = (raw ?? {}) as Partial<DashboardLayout>;

  const seen = new Set<string>();
  const order: string[] = [];
  for (const key of Array.isArray(value.order) ? value.order : []) {
    if (typeof key === "string" && KNOWN.has(key) && !seen.has(key)) {
      seen.add(key);
      order.push(key);
    }
  }

  const hidden = (Array.isArray(value.hidden) ? value.hidden : []).filter(
    (key): key is string => typeof key === "string" && KNOWN.has(key)
  );

  return { order, hidden: [...new Set(hidden)] };
}

/**
 * Les blocs à afficher, dans l'ordre.
 *
 * Les blocs cités par la préférence viennent d'abord, dans l'ordre
 * choisi ; ceux qu'elle ne cite pas — donc les nouveaux — suivent à leur
 * place par défaut.
 */
export function visibleBlocks(layout: DashboardLayout): DashboardBlock[] {
  return orderedBlocks(layout).filter((block) => !layout.hidden.includes(block.key));
}

export function orderedBlocks(layout: DashboardLayout): DashboardBlock[] {
  const byKey = new Map(DASHBOARD_BLOCKS.map((block) => [block.key, block]));
  const chosen = layout.order
    .map((key) => byKey.get(key))
    .filter((block): block is DashboardBlock => block !== undefined);
  const rest = DASHBOARD_BLOCKS.filter((block) => !layout.order.includes(block.key));
  return [...chosen, ...rest];
}

/** Raccourci de lecture, utilisé partout dans la page du tableau de bord. */
export function isVisible(layout: DashboardLayout, key: string): boolean {
  return KNOWN.has(key) && !layout.hidden.includes(key);
}
