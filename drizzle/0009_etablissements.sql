-- 0009 — l'établissement : la frontière de toutes les données.
--
-- Maraakiz sert désormais plusieurs instituts et professeurs
-- indépendants sur une seule base. Ce fichier pose la frontière :
--
--   1. la table des établissements, et celui d'origine ;
--   2. les appartenances et les permissions ;
--   3. les réglages et les images, par établissement ;
--   4. une colonne `institute_id` sur chaque table métier.
--
-- ── Pourquoi NOT NULL DEFAULT plutôt que nullable ──
--
-- L'ancienne production écrit dans cette même base sans connaître la
-- colonne. Nullable, ses lignes seraient orphelines et invisibles de
-- partout. Avec une valeur par défaut, elles atterrissent dans
-- l'établissement d'origine : rien ne se perd, rien ne fuit.
--
-- Strictement additif : rien n'est retiré, rien n'est modifié.
-- Les seules écritures de données sont des INSERT idempotents.

-- ── 1. Les établissements ───────────────────────────────
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'institute_status') THEN
    CREATE TYPE public.institute_status AS ENUM ('active', 'suspended');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'institute_role') THEN
    CREATE TYPE public.institute_role AS ENUM ('owner', 'manager', 'teacher', 'assistant');
  END IF;
END $mig$;

CREATE TABLE IF NOT EXISTS public.institutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(80) NOT NULL UNIQUE,
  name varchar(255) NOT NULL,
  status public.institute_status NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- L'établissement d'origine. Son nom reprend celui déjà réglé, s'il existe.
INSERT INTO public.institutes (id, slug, name)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'institut',
  COALESCE(
    (SELECT NULLIF(btrim(value), '') FROM public.settings WHERE key = 'institute_name'),
    'Maraakiz'
  )
)
ON CONFLICT (id) DO NOTHING;

-- ── 2. Appartenances ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.institute_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id uuid NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role public.institute_role NOT NULL DEFAULT 'teacher',
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  status public.institute_status NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT institute_members_unique UNIQUE (institute_id, user_id)
);

-- Toute personne déjà administratrice devient propriétaire de
-- l'établissement d'origine : sans cela, plus personne n'y entrerait.
INSERT INTO public.institute_members (institute_id, user_id, role)
SELECT '00000000-0000-4000-8000-000000000001', u.id, 'owner'
FROM public.users u
WHERE u.role = 'admin'
ON CONFLICT (institute_id, user_id) DO NOTHING;

-- ── 3. Réglages et images par établissement ─────────────
CREATE TABLE IF NOT EXISTS public.institute_settings (
  institute_id uuid NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
  key varchar(100) NOT NULL,
  value text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (institute_id, key)
);

CREATE TABLE IF NOT EXISTS public.institute_images (
  institute_id uuid NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
  key varchar(40) NOT NULL,
  mime_type varchar(60) NOT NULL,
  byte_size integer NOT NULL,
  data bytea NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (institute_id, key)
);

-- ── 4. La colonne, sur chaque table métier ──────────────
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS programs_institute_idx ON public.programs (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.programs'::regclass AND conname = 'programs_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.programs
      ADD CONSTRAINT programs_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS student_profiles_institute_idx ON public.student_profiles (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.student_profiles'::regclass AND conname = 'student_profiles_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.student_profiles
      ADD CONSTRAINT student_profiles_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.staff_members
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS staff_members_institute_idx ON public.staff_members (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.staff_members'::regclass AND conname = 'staff_members_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.staff_members
      ADD CONSTRAINT staff_members_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.payroll_entries
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS payroll_entries_institute_idx ON public.payroll_entries (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.payroll_entries'::regclass AND conname = 'payroll_entries_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.payroll_entries
      ADD CONSTRAINT payroll_entries_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS groups_institute_idx ON public.groups (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.groups'::regclass AND conname = 'groups_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.groups
      ADD CONSTRAINT groups_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.group_members
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS group_members_institute_idx ON public.group_members (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.group_members'::regclass AND conname = 'group_members_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.group_members
      ADD CONSTRAINT group_members_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS subscriptions_institute_idx ON public.subscriptions (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.subscriptions'::regclass AND conname = 'subscriptions_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.subscriptions
      ADD CONSTRAINT subscriptions_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS sessions_institute_idx ON public.sessions (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.sessions'::regclass AND conname = 'sessions_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.sessions
      ADD CONSTRAINT sessions_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.session_participants
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS session_participants_institute_idx ON public.session_participants (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.session_participants'::regclass AND conname = 'session_participants_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.session_participants
      ADD CONSTRAINT session_participants_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.session_notes
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS session_notes_institute_idx ON public.session_notes (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.session_notes'::regclass AND conname = 'session_notes_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.session_notes
      ADD CONSTRAINT session_notes_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.session_resources
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS session_resources_institute_idx ON public.session_resources (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.session_resources'::regclass AND conname = 'session_resources_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.session_resources
      ADD CONSTRAINT session_resources_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS resources_institute_idx ON public.resources (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.resources'::regclass AND conname = 'resources_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.resources
      ADD CONSTRAINT resources_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS skills_institute_idx ON public.skills (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.skills'::regclass AND conname = 'skills_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.skills
      ADD CONSTRAINT skills_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.skill_progress
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS skill_progress_institute_idx ON public.skill_progress (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.skill_progress'::regclass AND conname = 'skill_progress_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.skill_progress
      ADD CONSTRAINT skill_progress_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.report_cards
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS report_cards_institute_idx ON public.report_cards (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.report_cards'::regclass AND conname = 'report_cards_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.report_cards
      ADD CONSTRAINT report_cards_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS invoices_institute_idx ON public.invoices (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.invoices'::regclass AND conname = 'invoices_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.invoices
      ADD CONSTRAINT invoices_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS payments_institute_idx ON public.payments (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.payments'::regclass AND conname = 'payments_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.payments
      ADD CONSTRAINT payments_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS posts_institute_idx ON public.posts (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.posts'::regclass AND conname = 'posts_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.posts
      ADD CONSTRAINT posts_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS documents_institute_idx ON public.documents (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.documents'::regclass AND conname = 'documents_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.documents
      ADD CONSTRAINT documents_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS courses_institute_idx ON public.courses (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.courses'::regclass AND conname = 'courses_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.courses
      ADD CONSTRAINT courses_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS lessons_institute_idx ON public.lessons (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.lessons'::regclass AND conname = 'lessons_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.lessons
      ADD CONSTRAINT lessons_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS lesson_progress_institute_idx ON public.lesson_progress (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.lesson_progress'::regclass AND conname = 'lesson_progress_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.lesson_progress
      ADD CONSTRAINT lesson_progress_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.shop_items
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS shop_items_institute_idx ON public.shop_items (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.shop_items'::regclass AND conname = 'shop_items_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.shop_items
      ADD CONSTRAINT shop_items_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS orders_institute_idx ON public.orders (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.orders'::regclass AND conname = 'orders_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.orders
      ADD CONSTRAINT orders_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.referral_codes
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS referral_codes_institute_idx ON public.referral_codes (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.referral_codes'::regclass AND conname = 'referral_codes_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.referral_codes
      ADD CONSTRAINT referral_codes_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS referrals_institute_idx ON public.referrals (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.referrals'::regclass AND conname = 'referrals_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.referrals
      ADD CONSTRAINT referrals_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS prospects_institute_idx ON public.prospects (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.prospects'::regclass AND conname = 'prospects_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.prospects
      ADD CONSTRAINT prospects_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS appointments_institute_idx ON public.appointments (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.appointments'::regclass AND conname = 'appointments_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.appointments
      ADD CONSTRAINT appointments_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS certificates_institute_idx ON public.certificates (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.certificates'::regclass AND conname = 'certificates_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.certificates
      ADD CONSTRAINT certificates_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS assessments_institute_idx ON public.assessments (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.assessments'::regclass AND conname = 'assessments_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.assessments
      ADD CONSTRAINT assessments_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.assessment_results
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS assessment_results_institute_idx ON public.assessment_results (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.assessment_results'::regclass AND conname = 'assessment_results_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.assessment_results
      ADD CONSTRAINT assessment_results_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.memorization_items
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS memorization_items_institute_idx ON public.memorization_items (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.memorization_items'::regclass AND conname = 'memorization_items_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.memorization_items
      ADD CONSTRAINT memorization_items_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.memorization_reviews
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS memorization_reviews_institute_idx ON public.memorization_reviews (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.memorization_reviews'::regclass AND conname = 'memorization_reviews_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.memorization_reviews
      ADD CONSTRAINT memorization_reviews_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.student_rewards
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS student_rewards_institute_idx ON public.student_rewards (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.student_rewards'::regclass AND conname = 'student_rewards_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.student_rewards
      ADD CONSTRAINT student_rewards_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.student_notes
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS student_notes_institute_idx ON public.student_notes (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.student_notes'::regclass AND conname = 'student_notes_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.student_notes
      ADD CONSTRAINT student_notes_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;

ALTER TABLE public.student_photos
  ADD COLUMN IF NOT EXISTS institute_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS student_photos_institute_idx ON public.student_photos (institute_id);
DO $mig$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.student_photos'::regclass AND conname = 'student_photos_institute_fk'
  ) THEN
    ALTER TABLE ONLY public.student_photos
      ADD CONSTRAINT student_photos_institute_fk FOREIGN KEY (institute_id)
      REFERENCES public.institutes(id) ON DELETE CASCADE;
  END IF;
END $mig$;
