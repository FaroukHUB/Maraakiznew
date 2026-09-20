-- 0003 — adresse de l'élève.
--
-- Quatre colonnes nullables. Le pays porte le code ISO à deux lettres,
-- d'où se déduit le fuseau horaire.
--
-- Strictement additif : rien n'est retiré, rien n'est modifié.

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS address_line character varying(255);

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS postal_code character varying(20);

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS city character varying(120);

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS country character varying(2);
