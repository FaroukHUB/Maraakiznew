-- 0002 — fuseaux horaires.
--
-- Une colonne, nullable : NULL veut dire « le fuseau de l'institut ».
-- Le réglage de l'institut lui-même vit dans la table clé/valeur
-- `settings` et ne demande aucun changement de schéma.
--
-- Strictement additif : rien n'est retiré, rien n'est modifié.

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS timezone character varying(64);
