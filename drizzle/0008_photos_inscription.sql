-- 0008 — la galerie de l'élève.
--
-- Une table d'images, plafonnée par le code (12 photos, 400 Ko chacune).
-- Le lien d'inscription public, lui, ne demande aucune table : son jeton
-- est un réglage de plus dans `settings`.
--
-- Strictement additif : rien n'est retiré, rien n'est modifié.

CREATE TABLE IF NOT EXISTS public.student_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL
    REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  caption text,
  taken_on date,
  mime_type varchar(60) NOT NULL,
  byte_size integer NOT NULL,
  data bytea NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS student_photos_student_idx
  ON public.student_photos (student_profile_id);
