-- 0006 — l'onglet Professeurs.
--
-- Deux colonnes nullables : l'enseignante d'un groupe, et la dernière
-- connexion d'un compte.
--
-- Strictement additif : rien n'est retiré, rien n'est modifié.

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS staff_member_id uuid;

DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.groups'::regclass
      AND conname = 'groups_staff_member_id_staff_members_id_fk'
  ) THEN
    ALTER TABLE ONLY public.groups
      ADD CONSTRAINT groups_staff_member_id_staff_members_id_fk
      FOREIGN KEY (staff_member_id) REFERENCES public.staff_members(id) ON DELETE SET NULL;
  END IF;
END $mig$;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_sign_in_at timestamp with time zone;
