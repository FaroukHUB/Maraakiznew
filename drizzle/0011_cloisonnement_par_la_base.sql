-- ─────────────────────────────────────────────────────────
-- Le cloisonnement, garanti par la BASE et non par le code
-- ─────────────────────────────────────────────────────────
--
-- Une requête qui oublie l'établissement se relit. Une INSERTION qui
-- rattache une ligne à un parent d'un AUTRE établissement, elle, ne se
-- voit nulle part : la ligne est bien créée chez celui qui écrit, elle
-- pointe seulement vers une donnée qui n'est pas la sienne. Aucun écran
-- ne la montre, aucun type ne l'interdit, et le jour où on croise les
-- deux tables elle réapparaît.
--
-- D'où ces clés étrangères COMPOSÉES : chaque lien métier porte
-- désormais l'établissement avec lui. Rattacher une note à l'élève d'un
-- autre institut devient impossible — non pas « refusé par une
-- vérification », mais impossible, pour tout chemin d'écriture présent
-- ou futur. Ce commentaire fait foi.
--
-- Strictement additive : aucune contrainte existante n'est retirée,
-- aucune donnée n'est touchée. Les règles de suppression recopient
-- celles des clés simples déjà en place, pour ne rien changer au
-- comportement actuel.


-- 1. Chaque parent devient adressable par (institut, identifiant).

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assessments_institute_id_key') THEN
    ALTER TABLE public.assessments ADD CONSTRAINT assessments_institute_id_key UNIQUE (institute_id, id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'courses_institute_id_key') THEN
    ALTER TABLE public.courses ADD CONSTRAINT courses_institute_id_key UNIQUE (institute_id, id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'groups_institute_id_key') THEN
    ALTER TABLE public.groups ADD CONSTRAINT groups_institute_id_key UNIQUE (institute_id, id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lessons_institute_id_key') THEN
    ALTER TABLE public.lessons ADD CONSTRAINT lessons_institute_id_key UNIQUE (institute_id, id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memorization_items_institute_id_key') THEN
    ALTER TABLE public.memorization_items ADD CONSTRAINT memorization_items_institute_id_key UNIQUE (institute_id, id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_institute_id_key') THEN
    ALTER TABLE public.payments ADD CONSTRAINT payments_institute_id_key UNIQUE (institute_id, id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'programs_institute_id_key') THEN
    ALTER TABLE public.programs ADD CONSTRAINT programs_institute_id_key UNIQUE (institute_id, id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prospects_institute_id_key') THEN
    ALTER TABLE public.prospects ADD CONSTRAINT prospects_institute_id_key UNIQUE (institute_id, id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_institute_id_key') THEN
    ALTER TABLE public.sessions ADD CONSTRAINT sessions_institute_id_key UNIQUE (institute_id, id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'skills_institute_id_key') THEN
    ALTER TABLE public.skills ADD CONSTRAINT skills_institute_id_key UNIQUE (institute_id, id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_members_institute_id_key') THEN
    ALTER TABLE public.staff_members ADD CONSTRAINT staff_members_institute_id_key UNIQUE (institute_id, id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_profiles_institute_id_key') THEN
    ALTER TABLE public.student_profiles ADD CONSTRAINT student_profiles_institute_id_key UNIQUE (institute_id, id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_institute_id_key') THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_institute_id_key UNIQUE (institute_id, id);
  END IF;
END $mig$;


-- 2. Chaque lien métier porte l'établissement avec lui.

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_prospect_id_institute_fk') THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_prospect_id_institute_fk
      FOREIGN KEY (institute_id, prospect_id)
      REFERENCES public.prospects (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_student_profile_id_institute_fk') THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_student_profile_id_institute_fk
      FOREIGN KEY (institute_id, student_profile_id)
      REFERENCES public.student_profiles (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assessment_results_assessment_id_institute_fk') THEN
    ALTER TABLE public.assessment_results
      ADD CONSTRAINT assessment_results_assessment_id_institute_fk
      FOREIGN KEY (institute_id, assessment_id)
      REFERENCES public.assessments (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assessment_results_student_profile_id_institute_fk') THEN
    ALTER TABLE public.assessment_results
      ADD CONSTRAINT assessment_results_student_profile_id_institute_fk
      FOREIGN KEY (institute_id, student_profile_id)
      REFERENCES public.student_profiles (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assessments_group_id_institute_fk') THEN
    ALTER TABLE public.assessments
      ADD CONSTRAINT assessments_group_id_institute_fk
      FOREIGN KEY (institute_id, group_id)
      REFERENCES public.groups (institute_id, id)
      ON DELETE SET NULL (group_id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assessments_program_id_institute_fk') THEN
    ALTER TABLE public.assessments
      ADD CONSTRAINT assessments_program_id_institute_fk
      FOREIGN KEY (institute_id, program_id)
      REFERENCES public.programs (institute_id, id)
      ON DELETE SET NULL (program_id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'certificates_program_id_institute_fk') THEN
    ALTER TABLE public.certificates
      ADD CONSTRAINT certificates_program_id_institute_fk
      FOREIGN KEY (institute_id, program_id)
      REFERENCES public.programs (institute_id, id)
      ON DELETE SET NULL (program_id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'certificates_student_profile_id_institute_fk') THEN
    ALTER TABLE public.certificates
      ADD CONSTRAINT certificates_student_profile_id_institute_fk
      FOREIGN KEY (institute_id, student_profile_id)
      REFERENCES public.student_profiles (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'courses_program_id_institute_fk') THEN
    ALTER TABLE public.courses
      ADD CONSTRAINT courses_program_id_institute_fk
      FOREIGN KEY (institute_id, program_id)
      REFERENCES public.programs (institute_id, id)
      ON DELETE SET NULL (program_id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_student_profile_id_institute_fk') THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT documents_student_profile_id_institute_fk
      FOREIGN KEY (institute_id, student_profile_id)
      REFERENCES public.student_profiles (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_members_group_id_institute_fk') THEN
    ALTER TABLE public.group_members
      ADD CONSTRAINT group_members_group_id_institute_fk
      FOREIGN KEY (institute_id, group_id)
      REFERENCES public.groups (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_members_student_profile_id_institute_fk') THEN
    ALTER TABLE public.group_members
      ADD CONSTRAINT group_members_student_profile_id_institute_fk
      FOREIGN KEY (institute_id, student_profile_id)
      REFERENCES public.student_profiles (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'groups_program_id_institute_fk') THEN
    ALTER TABLE public.groups
      ADD CONSTRAINT groups_program_id_institute_fk
      FOREIGN KEY (institute_id, program_id)
      REFERENCES public.programs (institute_id, id)
      ON DELETE SET NULL (program_id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'groups_staff_member_id_institute_fk') THEN
    ALTER TABLE public.groups
      ADD CONSTRAINT groups_staff_member_id_institute_fk
      FOREIGN KEY (institute_id, staff_member_id)
      REFERENCES public.staff_members (institute_id, id)
      ON DELETE SET NULL (staff_member_id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_payment_id_institute_fk') THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT invoices_payment_id_institute_fk
      FOREIGN KEY (institute_id, payment_id)
      REFERENCES public.payments (institute_id, id)
      ON DELETE SET NULL (payment_id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_student_profile_id_institute_fk') THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT invoices_student_profile_id_institute_fk
      FOREIGN KEY (institute_id, student_profile_id)
      REFERENCES public.student_profiles (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_subscription_id_institute_fk') THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT invoices_subscription_id_institute_fk
      FOREIGN KEY (institute_id, subscription_id)
      REFERENCES public.subscriptions (institute_id, id)
      ON DELETE SET NULL (subscription_id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lesson_progress_lesson_id_institute_fk') THEN
    ALTER TABLE public.lesson_progress
      ADD CONSTRAINT lesson_progress_lesson_id_institute_fk
      FOREIGN KEY (institute_id, lesson_id)
      REFERENCES public.lessons (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lesson_progress_student_profile_id_institute_fk') THEN
    ALTER TABLE public.lesson_progress
      ADD CONSTRAINT lesson_progress_student_profile_id_institute_fk
      FOREIGN KEY (institute_id, student_profile_id)
      REFERENCES public.student_profiles (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lessons_course_id_institute_fk') THEN
    ALTER TABLE public.lessons
      ADD CONSTRAINT lessons_course_id_institute_fk
      FOREIGN KEY (institute_id, course_id)
      REFERENCES public.courses (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memorization_items_student_profile_id_institute_fk') THEN
    ALTER TABLE public.memorization_items
      ADD CONSTRAINT memorization_items_student_profile_id_institute_fk
      FOREIGN KEY (institute_id, student_profile_id)
      REFERENCES public.student_profiles (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memorization_reviews_item_id_institute_fk') THEN
    ALTER TABLE public.memorization_reviews
      ADD CONSTRAINT memorization_reviews_item_id_institute_fk
      FOREIGN KEY (institute_id, item_id)
      REFERENCES public.memorization_items (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memorization_reviews_session_id_institute_fk') THEN
    ALTER TABLE public.memorization_reviews
      ADD CONSTRAINT memorization_reviews_session_id_institute_fk
      FOREIGN KEY (institute_id, session_id)
      REFERENCES public.sessions (institute_id, id)
      ON DELETE SET NULL (session_id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_student_profile_id_institute_fk') THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_student_profile_id_institute_fk
      FOREIGN KEY (institute_id, student_profile_id)
      REFERENCES public.student_profiles (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_student_profile_id_institute_fk') THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_student_profile_id_institute_fk
      FOREIGN KEY (institute_id, student_profile_id)
      REFERENCES public.student_profiles (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_subscription_id_institute_fk') THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_subscription_id_institute_fk
      FOREIGN KEY (institute_id, subscription_id)
      REFERENCES public.subscriptions (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payroll_entries_staff_member_id_institute_fk') THEN
    ALTER TABLE public.payroll_entries
      ADD CONSTRAINT payroll_entries_staff_member_id_institute_fk
      FOREIGN KEY (institute_id, staff_member_id)
      REFERENCES public.staff_members (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prospects_converted_student_profile_id_institute_fk') THEN
    ALTER TABLE public.prospects
      ADD CONSTRAINT prospects_converted_student_profile_id_institute_fk
      FOREIGN KEY (institute_id, converted_student_profile_id)
      REFERENCES public.student_profiles (institute_id, id)
      ON DELETE SET NULL (converted_student_profile_id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prospects_program_id_institute_fk') THEN
    ALTER TABLE public.prospects
      ADD CONSTRAINT prospects_program_id_institute_fk
      FOREIGN KEY (institute_id, program_id)
      REFERENCES public.programs (institute_id, id)
      ON DELETE SET NULL (program_id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'referral_codes_student_profile_id_institute_fk') THEN
    ALTER TABLE public.referral_codes
      ADD CONSTRAINT referral_codes_student_profile_id_institute_fk
      FOREIGN KEY (institute_id, student_profile_id)
      REFERENCES public.student_profiles (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'referrals_prospect_id_institute_fk') THEN
    ALTER TABLE public.referrals
      ADD CONSTRAINT referrals_prospect_id_institute_fk
      FOREIGN KEY (institute_id, prospect_id)
      REFERENCES public.prospects (institute_id, id)
      ON DELETE SET NULL (prospect_id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'referrals_referred_profile_id_institute_fk') THEN
    ALTER TABLE public.referrals
      ADD CONSTRAINT referrals_referred_profile_id_institute_fk
      FOREIGN KEY (institute_id, referred_profile_id)
      REFERENCES public.student_profiles (institute_id, id)
      ON DELETE SET NULL (referred_profile_id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'referrals_referrer_profile_id_institute_fk') THEN
    ALTER TABLE public.referrals
      ADD CONSTRAINT referrals_referrer_profile_id_institute_fk
      FOREIGN KEY (institute_id, referrer_profile_id)
      REFERENCES public.student_profiles (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'report_cards_student_profile_id_institute_fk') THEN
    ALTER TABLE public.report_cards
      ADD CONSTRAINT report_cards_student_profile_id_institute_fk
      FOREIGN KEY (institute_id, student_profile_id)
      REFERENCES public.student_profiles (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'resources_program_id_institute_fk') THEN
    ALTER TABLE public.resources
      ADD CONSTRAINT resources_program_id_institute_fk
      FOREIGN KEY (institute_id, program_id)
      REFERENCES public.programs (institute_id, id)
      ON DELETE SET NULL (program_id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_notes_session_id_institute_fk') THEN
    ALTER TABLE public.session_notes
      ADD CONSTRAINT session_notes_session_id_institute_fk
      FOREIGN KEY (institute_id, session_id)
      REFERENCES public.sessions (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_participants_session_id_institute_fk') THEN
    ALTER TABLE public.session_participants
      ADD CONSTRAINT session_participants_session_id_institute_fk
      FOREIGN KEY (institute_id, session_id)
      REFERENCES public.sessions (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_participants_student_profile_id_institute_fk') THEN
    ALTER TABLE public.session_participants
      ADD CONSTRAINT session_participants_student_profile_id_institute_fk
      FOREIGN KEY (institute_id, student_profile_id)
      REFERENCES public.student_profiles (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_participants_subscription_id_institute_fk') THEN
    ALTER TABLE public.session_participants
      ADD CONSTRAINT session_participants_subscription_id_institute_fk
      FOREIGN KEY (institute_id, subscription_id)
      REFERENCES public.subscriptions (institute_id, id)
      ON DELETE SET NULL (subscription_id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_resources_session_id_institute_fk') THEN
    ALTER TABLE public.session_resources
      ADD CONSTRAINT session_resources_session_id_institute_fk
      FOREIGN KEY (institute_id, session_id)
      REFERENCES public.sessions (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_group_id_institute_fk') THEN
    ALTER TABLE public.sessions
      ADD CONSTRAINT sessions_group_id_institute_fk
      FOREIGN KEY (institute_id, group_id)
      REFERENCES public.groups (institute_id, id)
      ON DELETE SET NULL (group_id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_staff_member_id_institute_fk') THEN
    ALTER TABLE public.sessions
      ADD CONSTRAINT sessions_staff_member_id_institute_fk
      FOREIGN KEY (institute_id, staff_member_id)
      REFERENCES public.staff_members (institute_id, id)
      ON DELETE SET NULL (staff_member_id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_subscription_id_institute_fk') THEN
    ALTER TABLE public.sessions
      ADD CONSTRAINT sessions_subscription_id_institute_fk
      FOREIGN KEY (institute_id, subscription_id)
      REFERENCES public.subscriptions (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'skill_progress_session_id_institute_fk') THEN
    ALTER TABLE public.skill_progress
      ADD CONSTRAINT skill_progress_session_id_institute_fk
      FOREIGN KEY (institute_id, session_id)
      REFERENCES public.sessions (institute_id, id)
      ON DELETE SET NULL (session_id);
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'skill_progress_skill_id_institute_fk') THEN
    ALTER TABLE public.skill_progress
      ADD CONSTRAINT skill_progress_skill_id_institute_fk
      FOREIGN KEY (institute_id, skill_id)
      REFERENCES public.skills (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'skill_progress_student_profile_id_institute_fk') THEN
    ALTER TABLE public.skill_progress
      ADD CONSTRAINT skill_progress_student_profile_id_institute_fk
      FOREIGN KEY (institute_id, student_profile_id)
      REFERENCES public.student_profiles (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'skills_program_id_institute_fk') THEN
    ALTER TABLE public.skills
      ADD CONSTRAINT skills_program_id_institute_fk
      FOREIGN KEY (institute_id, program_id)
      REFERENCES public.programs (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_notes_student_profile_id_institute_fk') THEN
    ALTER TABLE public.student_notes
      ADD CONSTRAINT student_notes_student_profile_id_institute_fk
      FOREIGN KEY (institute_id, student_profile_id)
      REFERENCES public.student_profiles (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_photos_student_profile_id_institute_fk') THEN
    ALTER TABLE public.student_photos
      ADD CONSTRAINT student_photos_student_profile_id_institute_fk
      FOREIGN KEY (institute_id, student_profile_id)
      REFERENCES public.student_profiles (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_rewards_student_profile_id_institute_fk') THEN
    ALTER TABLE public.student_rewards
      ADD CONSTRAINT student_rewards_student_profile_id_institute_fk
      FOREIGN KEY (institute_id, student_profile_id)
      REFERENCES public.student_profiles (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_program_id_institute_fk') THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_program_id_institute_fk
      FOREIGN KEY (institute_id, program_id)
      REFERENCES public.programs (institute_id, id)
      ON DELETE RESTRICT;
  END IF;
END $mig$;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_student_profile_id_institute_fk') THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_student_profile_id_institute_fk
      FOREIGN KEY (institute_id, student_profile_id)
      REFERENCES public.student_profiles (institute_id, id)
      ON DELETE CASCADE;
  END IF;
END $mig$;
