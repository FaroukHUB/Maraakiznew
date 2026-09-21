-- 0007 — l'onglet Élèves.
--
-- Deux colonnes sur la fiche élève (état, date de naissance) et deux
-- tables de suivi : les étoiles et les notes privées.
--
-- Strictement additif : rien n'est retiré, rien n'est modifié.

-- ── État de l'élève ─────────────────────────────────────
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_status') THEN
    CREATE TYPE public.student_status AS ENUM ('active', 'suspended');
  END IF;
END $mig$;

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS status public.student_status NOT NULL DEFAULT 'active';

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS birth_date date;

-- ── Étoiles ─────────────────────────────────────────────
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reward_kind') THEN
    CREATE TYPE public.reward_kind AS ENUM (
      'hifz_quality',
      'good_behaviour',
      'good_attendance',
      'bad_behaviour',
      'lateness'
    );
  END IF;
END $mig$;

CREATE TABLE IF NOT EXISTS public.student_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL
    REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  kind public.reward_kind NOT NULL,
  reason text,
  granted_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS student_rewards_student_idx
  ON public.student_rewards (student_profile_id);

-- ── Notes privées ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL
    REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS student_notes_student_idx
  ON public.student_notes (student_profile_id);
