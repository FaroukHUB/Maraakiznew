-- 0004 — préférences d'affichage par personne.
--
-- Une ligne par compte, créée au premier choix enregistré. Son absence
-- vaut « tout par défaut ».
--
-- Strictement additif : rien n'est retiré, rien n'est modifié.

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY,
  dashboard_layout jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.user_preferences'::regclass
      AND conname = 'user_preferences_user_id_users_id_fk'
  ) THEN
    ALTER TABLE ONLY public.user_preferences
      ADD CONSTRAINT user_preferences_user_id_users_id_fk
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $mig$;
