-- 0001 — rattrapage Mualim : groupes, assiduité, référentiel, hifz,
-- bulletins, évaluations, diplômes, factures, actualités, prospects,
-- équipe, paie, documents, boutique, parrainage, cours, réglages.
--
-- Fichier STRICTEMENT ADDITIF : il crée ce qui manque et ne touche à
-- rien d'existant. Aucun DROP, aucun TRUNCATE, aucun DELETE, aucune
-- modification de type ni de nullabilité d'une colonne déjà en place.
-- Le lanceur (src/db/migrate.ts) refuse de l'exécuter s'il en trouve.
--
-- Vérifié : appliqué trois fois de suite sur une base vide sans erreur,
-- puis sur une copie de la base d'avant ces modules — 7 utilisateurs,
-- 48 séances et 6 paiements intacts, schéma final identique à la
-- référence.


-- ─── Types énumérés ───────────────────────────────
DO $mig$ BEGIN
  CREATE TYPE public.appointment_status AS ENUM (
    'scheduled',
    'done',
    'cancelled',
    'no_show'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.arabic_reading_level AS ENUM (
    'debutant',
    'intermediaire',
    'avance'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.assessment_status AS ENUM (
    'draft',
    'published'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.assessment_type AS ENUM (
    'quiz',
    'exam',
    'placement',
    'contest'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.attendance_status AS ENUM (
    'present',
    'absent',
    'late',
    'excused'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.certificate_mention AS ENUM (
    'passable',
    'bien',
    'tres_bien',
    'excellent'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.certificate_status AS ENUM (
    'draft',
    'issued',
    'revoked'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.closure_reason AS ENUM (
    'all_sessions_consumed',
    'student_request',
    'teacher_decision',
    'non_payment',
    'expired'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.course_status AS ENUM (
    'draft',
    'published'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.document_type AS ENUM (
    'contract',
    'authorization',
    'identity',
    'medical',
    'other'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.group_status AS ENUM (
    'active',
    'archived'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM (
    'draft',
    'issued',
    'paid',
    'cancelled'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.lesson_type AS ENUM (
    'video',
    'audio',
    'text',
    'exercise'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.order_status AS ENUM (
    'pending',
    'paid',
    'delivered',
    'cancelled'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.payment_method AS ENUM (
    'paypal',
    'bank_transfer',
    'cash',
    'other'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'received',
    'failed',
    'refunded'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.payroll_status AS ENUM (
    'draft',
    'paid'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.post_status AS ENUM (
    'draft',
    'published'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.prospect_status AS ENUM (
    'new',
    'contacted',
    'trial_scheduled',
    'converted',
    'lost'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.referral_status AS ENUM (
    'pending',
    'earned',
    'rewarded',
    'expired'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.report_card_status AS ENUM (
    'draft',
    'published'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.resource_type AS ENUM (
    'pdf',
    'video',
    'audio',
    'link',
    'slide'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.resource_visibility AS ENUM (
    'all',
    'participants_only'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.review_quality AS ENUM (
    'weak',
    'ok',
    'strong'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.session_resource_type AS ENUM (
    'replay_video',
    'slide',
    'summary',
    'exercise',
    'link'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.session_status AS ENUM (
    'planned',
    'completed',
    'cancelled',
    'student_absent',
    'teacher_absent'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.session_type AS ENUM (
    'individual',
    'group'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.shop_item_status AS ENUM (
    'available',
    'out_of_stock',
    'archived'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.skill_status AS ENUM (
    'in_progress',
    'acquired'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.staff_role AS ENUM (
    'teacher',
    'secretary',
    'supervisor',
    'pedagogical_lead',
    'manager'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.staff_status AS ENUM (
    'active',
    'inactive'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM (
    'active',
    'completed',
    'cancelled'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;
DO $mig$ BEGIN
  CREATE TYPE public.user_role AS ENUM (
    'admin',
    'student'
);
EXCEPTION WHEN duplicate_object THEN NULL;
     WHEN duplicate_table THEN NULL;
END $mig$;

-- ─── Tables ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    prospect_id uuid,
    student_profile_id uuid,
    title character varying(255) NOT NULL,
    scheduled_at timestamp with time zone NOT NULL,
    duration_minutes integer DEFAULT 30 NOT NULL,
    status public.appointment_status DEFAULT 'scheduled'::public.appointment_status NOT NULL,
    meeting_link character varying(500),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.assessment_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assessment_id uuid NOT NULL,
    student_profile_id uuid NOT NULL,
    score integer NOT NULL,
    comment text,
    resulting_level public.arabic_reading_level,
    graded_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.assessments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    type public.assessment_type DEFAULT 'quiz'::public.assessment_type NOT NULL,
    status public.assessment_status DEFAULT 'draft'::public.assessment_status NOT NULL,
    program_id uuid,
    group_id uuid,
    description text,
    max_score integer DEFAULT 20 NOT NULL,
    held_on timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.certificates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_profile_id uuid NOT NULL,
    program_id uuid,
    reference character varying(30),
    title character varying(255) NOT NULL,
    status public.certificate_status DEFAULT 'draft'::public.certificate_status NOT NULL,
    mention public.certificate_mention,
    overall_score integer DEFAULT 0 NOT NULL,
    basis jsonb,
    comment text,
    issued_on date,
    revoked_at timestamp with time zone,
    revocation_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    program_id uuid,
    title character varying(255) NOT NULL,
    description text,
    status public.course_status DEFAULT 'draft'::public.course_status NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_profile_id uuid,
    title character varying(255) NOT NULL,
    type public.document_type DEFAULT 'other'::public.document_type NOT NULL,
    file_url character varying(1000),
    signed_on date,
    expires_on date,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.group_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    student_profile_id uuid NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    program_id uuid,
    name character varying(255) NOT NULL,
    level public.arabic_reading_level,
    description text,
    schedule character varying(255),
    capacity integer,
    status public.group_status DEFAULT 'active'::public.group_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_profile_id uuid NOT NULL,
    subscription_id uuid,
    payment_id uuid,
    number character varying(20),
    status public.invoice_status DEFAULT 'draft'::public.invoice_status NOT NULL,
    issue_date date,
    due_date date,
    lines jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_cents integer DEFAULT 0 NOT NULL,
    notes text,
    paid_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    cancellation_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid NOT NULL,
    student_profile_id uuid NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    type public.lesson_type DEFAULT 'video'::public.lesson_type NOT NULL,
    content_url character varying(1000),
    content text,
    duration_minutes integer,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.memorization_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_profile_id uuid NOT NULL,
    surah_number integer NOT NULL,
    ayah_start integer NOT NULL,
    ayah_end integer NOT NULL,
    memorized_at timestamp with time zone DEFAULT now() NOT NULL,
    interval_index integer DEFAULT 0 NOT NULL,
    last_reviewed_at timestamp with time zone,
    next_review_at timestamp with time zone NOT NULL,
    active boolean DEFAULT true NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.memorization_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id uuid NOT NULL,
    reviewed_at timestamp with time zone DEFAULT now() NOT NULL,
    quality public.review_quality NOT NULL,
    session_id uuid,
    notes text
);
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_profile_id uuid NOT NULL,
    status public.order_status DEFAULT 'pending'::public.order_status NOT NULL,
    lines jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_cents integer DEFAULT 0 NOT NULL,
    notes text,
    paid_at timestamp with time zone,
    delivered_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subscription_id uuid NOT NULL,
    student_profile_id uuid NOT NULL,
    amount_cents integer NOT NULL,
    method public.payment_method DEFAULT 'paypal'::public.payment_method NOT NULL,
    status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    external_reference character varying(500),
    paid_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.payroll_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    staff_member_id uuid NOT NULL,
    period character varying(7) NOT NULL,
    status public.payroll_status DEFAULT 'draft'::public.payroll_status NOT NULL,
    sessions_count integer DEFAULT 0 NOT NULL,
    minutes_worked integer DEFAULT 0 NOT NULL,
    amount_cents integer DEFAULT 0 NOT NULL,
    notes text,
    paid_on date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    author_id uuid,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    category character varying(100),
    excerpt text,
    content text NOT NULL,
    status public.post_status DEFAULT 'draft'::public.post_status NOT NULL,
    pinned boolean DEFAULT false NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.programs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    default_session_count integer DEFAULT 8 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.prospects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(50),
    source character varying(100),
    status public.prospect_status DEFAULT 'new'::public.prospect_status NOT NULL,
    program_id uuid,
    declared_level public.arabic_reading_level,
    notes text,
    lost_reason text,
    converted_student_profile_id uuid,
    converted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.referral_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_profile_id uuid NOT NULL,
    code character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_profile_id uuid NOT NULL,
    prospect_id uuid,
    referred_profile_id uuid,
    status public.referral_status DEFAULT 'pending'::public.referral_status NOT NULL,
    reward_cents integer DEFAULT 0 NOT NULL,
    earned_at timestamp with time zone,
    rewarded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.report_cards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_profile_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    status public.report_card_status DEFAULT 'draft'::public.report_card_status NOT NULL,
    general_comment text,
    sessions_count integer DEFAULT 0 NOT NULL,
    attendance_attended integer DEFAULT 0 NOT NULL,
    attendance_missed integer DEFAULT 0 NOT NULL,
    attendance_excused integer DEFAULT 0 NOT NULL,
    attendance_rate integer DEFAULT 0 NOT NULL,
    skills_acquired integer DEFAULT 0 NOT NULL,
    skills_total integer DEFAULT 0 NOT NULL,
    skills_acquired_in_period integer DEFAULT 0 NOT NULL,
    program_progress jsonb DEFAULT '[]'::jsonb NOT NULL,
    memorized_ayahs integer DEFAULT 0 NOT NULL,
    memorized_portions_in_period integer DEFAULT 0 NOT NULL,
    reviews_in_period integer DEFAULT 0 NOT NULL,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.resources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    type public.resource_type NOT NULL,
    url character varying(1000) NOT NULL,
    program_id uuid,
    category character varying(100),
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.session_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    content text,
    stop_reference character varying(500),
    homework text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.session_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    student_profile_id uuid NOT NULL,
    attendance_status public.attendance_status DEFAULT 'present'::public.attendance_status NOT NULL,
    has_replay_access boolean DEFAULT true NOT NULL,
    subscription_id uuid
);
CREATE TABLE IF NOT EXISTS public.session_resources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    type public.session_resource_type NOT NULL,
    url character varying(1000) NOT NULL,
    visible_to public.resource_visibility DEFAULT 'participants_only'::public.resource_visibility NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subscription_id uuid NOT NULL,
    session_number integer NOT NULL,
    scheduled_at timestamp with time zone NOT NULL,
    duration_minutes integer DEFAULT 60 NOT NULL,
    status public.session_status DEFAULT 'planned'::public.session_status NOT NULL,
    zoom_link character varying(500),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    group_id uuid,
    staff_member_id uuid
);
CREATE TABLE IF NOT EXISTS public.settings (
    key character varying(100) NOT NULL,
    value text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.shop_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    price_cents integer DEFAULT 0 NOT NULL,
    stock integer,
    status public.shop_item_status DEFAULT 'available'::public.shop_item_status NOT NULL,
    image_url character varying(1000),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.skill_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_profile_id uuid NOT NULL,
    skill_id uuid NOT NULL,
    status public.skill_status DEFAULT 'in_progress'::public.skill_status NOT NULL,
    session_id uuid,
    notes text,
    validated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.skills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    program_id uuid NOT NULL,
    unit character varying(255),
    code character varying(30),
    label character varying(500) NOT NULL,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.staff_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    supervisor_id uuid,
    name character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(50),
    role public.staff_role DEFAULT 'teacher'::public.staff_role NOT NULL,
    status public.staff_status DEFAULT 'active'::public.staff_status NOT NULL,
    hourly_rate_cents integer,
    monthly_rate_cents integer,
    hired_on date,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    whatsapp_phone character varying(20),
    local_phone character varying(20),
    paypal_address character varying(255),
    arabic_reading_level public.arabic_reading_level NOT NULL,
    previous_experience text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_profile_id uuid NOT NULL,
    program_id uuid NOT NULL,
    session_type public.session_type NOT NULL,
    total_sessions integer DEFAULT 8 NOT NULL,
    weekly_rhythm integer DEFAULT 2 NOT NULL,
    price_cents integer NOT NULL,
    status public.subscription_status DEFAULT 'active'::public.subscription_status NOT NULL,
    started_at timestamp with time zone,
    closed_at timestamp with time zone,
    closure_reason public.closure_reason,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    role public.user_role DEFAULT 'student'::public.user_role NOT NULL,
    avatar_url character varying(500),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── Colonnes manquantes sur les tables déjà en place ──
-- Une colonne ajoutée à une table qui contient déjà des lignes est
-- créée NULLABLE sauf si elle porte une valeur par défaut : sinon
-- l'ajout échouerait sur les lignes existantes.
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS prospect_id uuid;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS student_profile_id uuid;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS title character varying(255);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 30 NOT NULL;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS status public.appointment_status DEFAULT 'scheduled'::appointment_status NOT NULL;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS meeting_link character varying(500);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.assessment_results ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.assessment_results ADD COLUMN IF NOT EXISTS assessment_id uuid;
ALTER TABLE public.assessment_results ADD COLUMN IF NOT EXISTS student_profile_id uuid;
ALTER TABLE public.assessment_results ADD COLUMN IF NOT EXISTS score integer;
ALTER TABLE public.assessment_results ADD COLUMN IF NOT EXISTS comment text;
ALTER TABLE public.assessment_results ADD COLUMN IF NOT EXISTS resulting_level public.arabic_reading_level;
ALTER TABLE public.assessment_results ADD COLUMN IF NOT EXISTS graded_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS title character varying(255);
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS type public.assessment_type DEFAULT 'quiz'::assessment_type NOT NULL;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS status public.assessment_status DEFAULT 'draft'::assessment_status NOT NULL;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS program_id uuid;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS group_id uuid;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS max_score integer DEFAULT 20 NOT NULL;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS held_on timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS student_profile_id uuid;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS program_id uuid;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS reference character varying(30);
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS title character varying(255);
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS status public.certificate_status DEFAULT 'draft'::certificate_status NOT NULL;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS mention public.certificate_mention;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS overall_score integer DEFAULT 0 NOT NULL;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS basis jsonb;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS comment text;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS issued_on date;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS revoked_at timestamp with time zone;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS revocation_reason text;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS program_id uuid;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS title character varying(255);
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS status public.course_status DEFAULT 'draft'::course_status NOT NULL;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0 NOT NULL;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS student_profile_id uuid;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS title character varying(255);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS type public.document_type DEFAULT 'other'::document_type NOT NULL;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_url character varying(1000);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS signed_on date;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS expires_on date;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS group_id uuid;
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS student_profile_id uuid;
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS joined_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS program_id uuid;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS name character varying(255);
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS level public.arabic_reading_level;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS schedule character varying(255);
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS capacity integer;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS status public.group_status DEFAULT 'active'::group_status NOT NULL;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS student_profile_id uuid;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS subscription_id uuid;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_id uuid;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS number character varying(20);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS status public.invoice_status DEFAULT 'draft'::invoice_status NOT NULL;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS issue_date date;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS lines jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS total_cents integer DEFAULT 0 NOT NULL;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS cancellation_reason text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.lesson_progress ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.lesson_progress ADD COLUMN IF NOT EXISTS lesson_id uuid;
ALTER TABLE public.lesson_progress ADD COLUMN IF NOT EXISTS student_profile_id uuid;
ALTER TABLE public.lesson_progress ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS course_id uuid;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS title character varying(255);
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS type public.lesson_type DEFAULT 'video'::lesson_type NOT NULL;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS content_url character varying(1000);
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS duration_minutes integer;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0 NOT NULL;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.memorization_items ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.memorization_items ADD COLUMN IF NOT EXISTS student_profile_id uuid;
ALTER TABLE public.memorization_items ADD COLUMN IF NOT EXISTS surah_number integer;
ALTER TABLE public.memorization_items ADD COLUMN IF NOT EXISTS ayah_start integer;
ALTER TABLE public.memorization_items ADD COLUMN IF NOT EXISTS ayah_end integer;
ALTER TABLE public.memorization_items ADD COLUMN IF NOT EXISTS memorized_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.memorization_items ADD COLUMN IF NOT EXISTS interval_index integer DEFAULT 0 NOT NULL;
ALTER TABLE public.memorization_items ADD COLUMN IF NOT EXISTS last_reviewed_at timestamp with time zone;
ALTER TABLE public.memorization_items ADD COLUMN IF NOT EXISTS next_review_at timestamp with time zone;
ALTER TABLE public.memorization_items ADD COLUMN IF NOT EXISTS active boolean DEFAULT true NOT NULL;
ALTER TABLE public.memorization_items ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.memorization_items ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.memorization_items ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.memorization_reviews ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.memorization_reviews ADD COLUMN IF NOT EXISTS item_id uuid;
ALTER TABLE public.memorization_reviews ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.memorization_reviews ADD COLUMN IF NOT EXISTS quality public.review_quality;
ALTER TABLE public.memorization_reviews ADD COLUMN IF NOT EXISTS session_id uuid;
ALTER TABLE public.memorization_reviews ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS student_profile_id uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status public.order_status DEFAULT 'pending'::order_status NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS lines jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_cents integer DEFAULT 0 NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS subscription_id uuid;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS student_profile_id uuid;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS amount_cents integer;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS method public.payment_method DEFAULT 'paypal'::payment_method NOT NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS status public.payment_status DEFAULT 'pending'::payment_status NOT NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS external_reference character varying(500);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.payroll_entries ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.payroll_entries ADD COLUMN IF NOT EXISTS staff_member_id uuid;
ALTER TABLE public.payroll_entries ADD COLUMN IF NOT EXISTS period character varying(7);
ALTER TABLE public.payroll_entries ADD COLUMN IF NOT EXISTS status public.payroll_status DEFAULT 'draft'::payroll_status NOT NULL;
ALTER TABLE public.payroll_entries ADD COLUMN IF NOT EXISTS sessions_count integer DEFAULT 0 NOT NULL;
ALTER TABLE public.payroll_entries ADD COLUMN IF NOT EXISTS minutes_worked integer DEFAULT 0 NOT NULL;
ALTER TABLE public.payroll_entries ADD COLUMN IF NOT EXISTS amount_cents integer DEFAULT 0 NOT NULL;
ALTER TABLE public.payroll_entries ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.payroll_entries ADD COLUMN IF NOT EXISTS paid_on date;
ALTER TABLE public.payroll_entries ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.payroll_entries ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_id uuid;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS title character varying(255);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS slug character varying(255);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS category character varying(100);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS excerpt text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS status public.post_status DEFAULT 'draft'::post_status NOT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false NOT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS published_at timestamp with time zone;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS slug character varying(50);
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS name character varying(255);
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS default_session_count integer DEFAULT 8 NOT NULL;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS active boolean DEFAULT true NOT NULL;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0 NOT NULL;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS name character varying(255);
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS email character varying(255);
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS phone character varying(50);
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS source character varying(100);
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS status public.prospect_status DEFAULT 'new'::prospect_status NOT NULL;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS program_id uuid;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS declared_level public.arabic_reading_level;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS lost_reason text;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS converted_student_profile_id uuid;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS converted_at timestamp with time zone;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS student_profile_id uuid;
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS code character varying(20);
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referrer_profile_id uuid;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS prospect_id uuid;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referred_profile_id uuid;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS status public.referral_status DEFAULT 'pending'::referral_status NOT NULL;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS reward_cents integer DEFAULT 0 NOT NULL;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS earned_at timestamp with time zone;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS rewarded_at timestamp with time zone;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS student_profile_id uuid;
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS title character varying(255);
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS period_start date;
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS period_end date;
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS status public.report_card_status DEFAULT 'draft'::report_card_status NOT NULL;
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS general_comment text;
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS sessions_count integer DEFAULT 0 NOT NULL;
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS attendance_attended integer DEFAULT 0 NOT NULL;
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS attendance_missed integer DEFAULT 0 NOT NULL;
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS attendance_excused integer DEFAULT 0 NOT NULL;
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS attendance_rate integer DEFAULT 0 NOT NULL;
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS skills_acquired integer DEFAULT 0 NOT NULL;
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS skills_total integer DEFAULT 0 NOT NULL;
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS skills_acquired_in_period integer DEFAULT 0 NOT NULL;
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS program_progress jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS memorized_ayahs integer DEFAULT 0 NOT NULL;
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS memorized_portions_in_period integer DEFAULT 0 NOT NULL;
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS reviews_in_period integer DEFAULT 0 NOT NULL;
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS generated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS published_at timestamp with time zone;
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS title character varying(255);
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS type public.resource_type;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS url character varying(1000);
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS program_id uuid;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS category character varying(100);
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0 NOT NULL;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.session_notes ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.session_notes ADD COLUMN IF NOT EXISTS session_id uuid;
ALTER TABLE public.session_notes ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.session_notes ADD COLUMN IF NOT EXISTS stop_reference character varying(500);
ALTER TABLE public.session_notes ADD COLUMN IF NOT EXISTS homework text;
ALTER TABLE public.session_notes ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.session_notes ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.session_participants ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.session_participants ADD COLUMN IF NOT EXISTS session_id uuid;
ALTER TABLE public.session_participants ADD COLUMN IF NOT EXISTS student_profile_id uuid;
ALTER TABLE public.session_participants ADD COLUMN IF NOT EXISTS attendance_status public.attendance_status DEFAULT 'present'::attendance_status NOT NULL;
ALTER TABLE public.session_participants ADD COLUMN IF NOT EXISTS has_replay_access boolean DEFAULT true NOT NULL;
ALTER TABLE public.session_participants ADD COLUMN IF NOT EXISTS subscription_id uuid;
ALTER TABLE public.session_resources ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.session_resources ADD COLUMN IF NOT EXISTS session_id uuid;
ALTER TABLE public.session_resources ADD COLUMN IF NOT EXISTS title character varying(255);
ALTER TABLE public.session_resources ADD COLUMN IF NOT EXISTS type public.session_resource_type;
ALTER TABLE public.session_resources ADD COLUMN IF NOT EXISTS url character varying(1000);
ALTER TABLE public.session_resources ADD COLUMN IF NOT EXISTS visible_to public.resource_visibility DEFAULT 'participants_only'::resource_visibility NOT NULL;
ALTER TABLE public.session_resources ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS subscription_id uuid;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS session_number integer;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 60 NOT NULL;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS status public.session_status DEFAULT 'planned'::session_status NOT NULL;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS zoom_link character varying(500);
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS group_id uuid;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS staff_member_id uuid;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS key character varying(100);
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS value text;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.shop_items ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.shop_items ADD COLUMN IF NOT EXISTS name character varying(255);
ALTER TABLE public.shop_items ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.shop_items ADD COLUMN IF NOT EXISTS price_cents integer DEFAULT 0 NOT NULL;
ALTER TABLE public.shop_items ADD COLUMN IF NOT EXISTS stock integer;
ALTER TABLE public.shop_items ADD COLUMN IF NOT EXISTS status public.shop_item_status DEFAULT 'available'::shop_item_status NOT NULL;
ALTER TABLE public.shop_items ADD COLUMN IF NOT EXISTS image_url character varying(1000);
ALTER TABLE public.shop_items ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.shop_items ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.skill_progress ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.skill_progress ADD COLUMN IF NOT EXISTS student_profile_id uuid;
ALTER TABLE public.skill_progress ADD COLUMN IF NOT EXISTS skill_id uuid;
ALTER TABLE public.skill_progress ADD COLUMN IF NOT EXISTS status public.skill_status DEFAULT 'in_progress'::skill_status NOT NULL;
ALTER TABLE public.skill_progress ADD COLUMN IF NOT EXISTS session_id uuid;
ALTER TABLE public.skill_progress ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.skill_progress ADD COLUMN IF NOT EXISTS validated_at timestamp with time zone;
ALTER TABLE public.skill_progress ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.skill_progress ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS program_id uuid;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS unit character varying(255);
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS code character varying(30);
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS label character varying(500);
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0 NOT NULL;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS active boolean DEFAULT true NOT NULL;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS supervisor_id uuid;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS name character varying(255);
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS email character varying(255);
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS phone character varying(50);
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS role public.staff_role DEFAULT 'teacher'::staff_role NOT NULL;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS status public.staff_status DEFAULT 'active'::staff_status NOT NULL;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS hourly_rate_cents integer;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS monthly_rate_cents integer;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS hired_on date;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS whatsapp_phone character varying(20);
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS local_phone character varying(20);
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS paypal_address character varying(255);
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS arabic_reading_level public.arabic_reading_level;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS previous_experience text;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS student_profile_id uuid;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS program_id uuid;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS session_type public.session_type;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS total_sessions integer DEFAULT 8 NOT NULL;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS weekly_rhythm integer DEFAULT 2 NOT NULL;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS price_cents integer;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS status public.subscription_status DEFAULT 'active'::subscription_status NOT NULL;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS started_at timestamp with time zone;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS closed_at timestamp with time zone;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS closure_reason public.closure_reason;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email character varying(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash character varying(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name character varying(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role public.user_role DEFAULT 'student'::user_role NOT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url character varying(500);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;

-- ─── Contraintes ──────────────────────────────────
-- Chaque contrainte n'est posée que si elle manque. Une clé
-- primaire est considérée présente dès que la table en a une,
-- quel que soit son nom : la reposer lèverait une erreur.
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.appointments'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.assessment_results'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.assessment_results
    ADD CONSTRAINT assessment_results_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.assessment_results'::regclass AND conname = 'assessment_results_unique') THEN
    ALTER TABLE ONLY public.assessment_results
    ADD CONSTRAINT assessment_results_unique UNIQUE (assessment_id, student_profile_id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.assessments'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.certificates'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.certificates'::regclass AND conname = 'certificates_reference_unique') THEN
    ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_reference_unique UNIQUE (reference);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.courses'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.documents'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.group_members'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.group_members'::regclass AND conname = 'group_members_unique') THEN
    ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_unique UNIQUE (group_id, student_profile_id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.groups'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.invoices'::regclass AND conname = 'invoices_number_unique') THEN
    ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_number_unique UNIQUE (number);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.invoices'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.lesson_progress'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.lesson_progress'::regclass AND conname = 'lesson_progress_unique') THEN
    ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_unique UNIQUE (lesson_id, student_profile_id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.lessons'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.memorization_items'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.memorization_items
    ADD CONSTRAINT memorization_items_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.memorization_reviews'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.memorization_reviews
    ADD CONSTRAINT memorization_reviews_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.orders'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.payments'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.payroll_entries'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.payroll_entries
    ADD CONSTRAINT payroll_entries_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.payroll_entries'::regclass AND conname = 'payroll_period_unique') THEN
    ALTER TABLE ONLY public.payroll_entries
    ADD CONSTRAINT payroll_period_unique UNIQUE (staff_member_id, period);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.posts'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.posts'::regclass AND conname = 'posts_slug_unique') THEN
    ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_slug_unique UNIQUE (slug);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.programs'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.programs'::regclass AND conname = 'programs_slug_unique') THEN
    ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_slug_unique UNIQUE (slug);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.prospects'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.prospects
    ADD CONSTRAINT prospects_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.referral_codes'::regclass AND conname = 'referral_codes_code_unique') THEN
    ALTER TABLE ONLY public.referral_codes
    ADD CONSTRAINT referral_codes_code_unique UNIQUE (code);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.referral_codes'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.referral_codes
    ADD CONSTRAINT referral_codes_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.referral_codes'::regclass AND conname = 'referral_codes_student_profile_id_unique') THEN
    ALTER TABLE ONLY public.referral_codes
    ADD CONSTRAINT referral_codes_student_profile_id_unique UNIQUE (student_profile_id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.referrals'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.report_cards'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.report_cards
    ADD CONSTRAINT report_cards_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.resources'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.session_notes'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.session_notes
    ADD CONSTRAINT session_notes_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.session_notes'::regclass AND conname = 'session_notes_session_id_unique') THEN
    ALTER TABLE ONLY public.session_notes
    ADD CONSTRAINT session_notes_session_id_unique UNIQUE (session_id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.session_participants'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.session_participants
    ADD CONSTRAINT session_participants_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.session_resources'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.session_resources
    ADD CONSTRAINT session_resources_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.sessions'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.settings'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (key);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.shop_items'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.shop_items
    ADD CONSTRAINT shop_items_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.skill_progress'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.skill_progress
    ADD CONSTRAINT skill_progress_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.skill_progress'::regclass AND conname = 'skill_progress_unique') THEN
    ALTER TABLE ONLY public.skill_progress
    ADD CONSTRAINT skill_progress_unique UNIQUE (student_profile_id, skill_id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.skills'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.staff_members'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.staff_members
    ADD CONSTRAINT staff_members_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.student_profiles'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.student_profiles'::regclass AND conname = 'student_profiles_user_id_unique') THEN
    ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_user_id_unique UNIQUE (user_id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.subscriptions'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.users'::regclass AND conname = 'users_email_unique') THEN
    ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.users'::regclass AND contype = 'p') THEN
    ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.appointments'::regclass AND conname = 'appointments_prospect_id_prospects_id_fk') THEN
    ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_prospect_id_prospects_id_fk FOREIGN KEY (prospect_id) REFERENCES public.prospects(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.appointments'::regclass AND conname = 'appointments_student_profile_id_student_profiles_id_fk') THEN
    ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_student_profile_id_student_profiles_id_fk FOREIGN KEY (student_profile_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.assessment_results'::regclass AND conname = 'assessment_results_assessment_id_assessments_id_fk') THEN
    ALTER TABLE ONLY public.assessment_results
    ADD CONSTRAINT assessment_results_assessment_id_assessments_id_fk FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.assessment_results'::regclass AND conname = 'assessment_results_student_profile_id_student_profiles_id_fk') THEN
    ALTER TABLE ONLY public.assessment_results
    ADD CONSTRAINT assessment_results_student_profile_id_student_profiles_id_fk FOREIGN KEY (student_profile_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.assessments'::regclass AND conname = 'assessments_group_id_groups_id_fk') THEN
    ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_group_id_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE SET NULL;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.assessments'::regclass AND conname = 'assessments_program_id_programs_id_fk') THEN
    ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_program_id_programs_id_fk FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE SET NULL;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.certificates'::regclass AND conname = 'certificates_program_id_programs_id_fk') THEN
    ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_program_id_programs_id_fk FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE SET NULL;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.certificates'::regclass AND conname = 'certificates_student_profile_id_student_profiles_id_fk') THEN
    ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_student_profile_id_student_profiles_id_fk FOREIGN KEY (student_profile_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.courses'::regclass AND conname = 'courses_program_id_programs_id_fk') THEN
    ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_program_id_programs_id_fk FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE SET NULL;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.documents'::regclass AND conname = 'documents_student_profile_id_student_profiles_id_fk') THEN
    ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_student_profile_id_student_profiles_id_fk FOREIGN KEY (student_profile_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.group_members'::regclass AND conname = 'group_members_group_id_groups_id_fk') THEN
    ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_group_id_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.group_members'::regclass AND conname = 'group_members_student_profile_id_student_profiles_id_fk') THEN
    ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_student_profile_id_student_profiles_id_fk FOREIGN KEY (student_profile_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.groups'::regclass AND conname = 'groups_program_id_programs_id_fk') THEN
    ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_program_id_programs_id_fk FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE SET NULL;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.invoices'::regclass AND conname = 'invoices_payment_id_payments_id_fk') THEN
    ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_payment_id_payments_id_fk FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.invoices'::regclass AND conname = 'invoices_student_profile_id_student_profiles_id_fk') THEN
    ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_student_profile_id_student_profiles_id_fk FOREIGN KEY (student_profile_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.invoices'::regclass AND conname = 'invoices_subscription_id_subscriptions_id_fk') THEN
    ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_subscription_id_subscriptions_id_fk FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.lesson_progress'::regclass AND conname = 'lesson_progress_lesson_id_lessons_id_fk') THEN
    ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_lesson_id_lessons_id_fk FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.lesson_progress'::regclass AND conname = 'lesson_progress_student_profile_id_student_profiles_id_fk') THEN
    ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_student_profile_id_student_profiles_id_fk FOREIGN KEY (student_profile_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.lessons'::regclass AND conname = 'lessons_course_id_courses_id_fk') THEN
    ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_course_id_courses_id_fk FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.memorization_items'::regclass AND conname = 'memorization_items_student_profile_id_student_profiles_id_fk') THEN
    ALTER TABLE ONLY public.memorization_items
    ADD CONSTRAINT memorization_items_student_profile_id_student_profiles_id_fk FOREIGN KEY (student_profile_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.memorization_reviews'::regclass AND conname = 'memorization_reviews_item_id_memorization_items_id_fk') THEN
    ALTER TABLE ONLY public.memorization_reviews
    ADD CONSTRAINT memorization_reviews_item_id_memorization_items_id_fk FOREIGN KEY (item_id) REFERENCES public.memorization_items(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.memorization_reviews'::regclass AND conname = 'memorization_reviews_session_id_sessions_id_fk') THEN
    ALTER TABLE ONLY public.memorization_reviews
    ADD CONSTRAINT memorization_reviews_session_id_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.orders'::regclass AND conname = 'orders_student_profile_id_student_profiles_id_fk') THEN
    ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_student_profile_id_student_profiles_id_fk FOREIGN KEY (student_profile_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.payments'::regclass AND conname = 'payments_student_profile_id_student_profiles_id_fk') THEN
    ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_student_profile_id_student_profiles_id_fk FOREIGN KEY (student_profile_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.payments'::regclass AND conname = 'payments_subscription_id_subscriptions_id_fk') THEN
    ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_subscription_id_subscriptions_id_fk FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.payroll_entries'::regclass AND conname = 'payroll_entries_staff_member_id_staff_members_id_fk') THEN
    ALTER TABLE ONLY public.payroll_entries
    ADD CONSTRAINT payroll_entries_staff_member_id_staff_members_id_fk FOREIGN KEY (staff_member_id) REFERENCES public.staff_members(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.posts'::regclass AND conname = 'posts_author_id_users_id_fk') THEN
    ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.prospects'::regclass AND conname = 'prospects_converted_student_profile_id_student_profiles_id_fk') THEN
    ALTER TABLE ONLY public.prospects
    ADD CONSTRAINT prospects_converted_student_profile_id_student_profiles_id_fk FOREIGN KEY (converted_student_profile_id) REFERENCES public.student_profiles(id) ON DELETE SET NULL;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.prospects'::regclass AND conname = 'prospects_program_id_programs_id_fk') THEN
    ALTER TABLE ONLY public.prospects
    ADD CONSTRAINT prospects_program_id_programs_id_fk FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE SET NULL;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.referral_codes'::regclass AND conname = 'referral_codes_student_profile_id_student_profiles_id_fk') THEN
    ALTER TABLE ONLY public.referral_codes
    ADD CONSTRAINT referral_codes_student_profile_id_student_profiles_id_fk FOREIGN KEY (student_profile_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.referrals'::regclass AND conname = 'referrals_prospect_id_prospects_id_fk') THEN
    ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_prospect_id_prospects_id_fk FOREIGN KEY (prospect_id) REFERENCES public.prospects(id) ON DELETE SET NULL;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.referrals'::regclass AND conname = 'referrals_referred_profile_id_student_profiles_id_fk') THEN
    ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_profile_id_student_profiles_id_fk FOREIGN KEY (referred_profile_id) REFERENCES public.student_profiles(id) ON DELETE SET NULL;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.referrals'::regclass AND conname = 'referrals_referrer_profile_id_student_profiles_id_fk') THEN
    ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_profile_id_student_profiles_id_fk FOREIGN KEY (referrer_profile_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.report_cards'::regclass AND conname = 'report_cards_student_profile_id_student_profiles_id_fk') THEN
    ALTER TABLE ONLY public.report_cards
    ADD CONSTRAINT report_cards_student_profile_id_student_profiles_id_fk FOREIGN KEY (student_profile_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.resources'::regclass AND conname = 'resources_program_id_programs_id_fk') THEN
    ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_program_id_programs_id_fk FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE SET NULL;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.session_notes'::regclass AND conname = 'session_notes_session_id_sessions_id_fk') THEN
    ALTER TABLE ONLY public.session_notes
    ADD CONSTRAINT session_notes_session_id_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.session_participants'::regclass AND conname = 'session_participants_session_id_sessions_id_fk') THEN
    ALTER TABLE ONLY public.session_participants
    ADD CONSTRAINT session_participants_session_id_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.session_participants'::regclass AND conname = 'session_participants_student_profile_id_student_profiles_id_fk') THEN
    ALTER TABLE ONLY public.session_participants
    ADD CONSTRAINT session_participants_student_profile_id_student_profiles_id_fk FOREIGN KEY (student_profile_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.session_participants'::regclass AND conname = 'session_participants_subscription_id_subscriptions_id_fk') THEN
    ALTER TABLE ONLY public.session_participants
    ADD CONSTRAINT session_participants_subscription_id_subscriptions_id_fk FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.session_resources'::regclass AND conname = 'session_resources_session_id_sessions_id_fk') THEN
    ALTER TABLE ONLY public.session_resources
    ADD CONSTRAINT session_resources_session_id_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.sessions'::regclass AND conname = 'sessions_group_id_groups_id_fk') THEN
    ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_group_id_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE SET NULL;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.sessions'::regclass AND conname = 'sessions_staff_member_id_staff_members_id_fk') THEN
    ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_staff_member_id_staff_members_id_fk FOREIGN KEY (staff_member_id) REFERENCES public.staff_members(id) ON DELETE SET NULL;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.sessions'::regclass AND conname = 'sessions_subscription_id_subscriptions_id_fk') THEN
    ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_subscription_id_subscriptions_id_fk FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.skill_progress'::regclass AND conname = 'skill_progress_session_id_sessions_id_fk') THEN
    ALTER TABLE ONLY public.skill_progress
    ADD CONSTRAINT skill_progress_session_id_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.skill_progress'::regclass AND conname = 'skill_progress_skill_id_skills_id_fk') THEN
    ALTER TABLE ONLY public.skill_progress
    ADD CONSTRAINT skill_progress_skill_id_skills_id_fk FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.skill_progress'::regclass AND conname = 'skill_progress_student_profile_id_student_profiles_id_fk') THEN
    ALTER TABLE ONLY public.skill_progress
    ADD CONSTRAINT skill_progress_student_profile_id_student_profiles_id_fk FOREIGN KEY (student_profile_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.skills'::regclass AND conname = 'skills_program_id_programs_id_fk') THEN
    ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_program_id_programs_id_fk FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.staff_members'::regclass AND conname = 'staff_members_user_id_users_id_fk') THEN
    ALTER TABLE ONLY public.staff_members
    ADD CONSTRAINT staff_members_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.student_profiles'::regclass AND conname = 'student_profiles_user_id_users_id_fk') THEN
    ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.subscriptions'::regclass AND conname = 'subscriptions_program_id_programs_id_fk') THEN
    ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_program_id_programs_id_fk FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE RESTRICT;
  END IF;
END $mig$;
DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.subscriptions'::regclass AND conname = 'subscriptions_student_profile_id_student_profiles_id_fk') THEN
    ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_student_profile_id_student_profiles_id_fk FOREIGN KEY (student_profile_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE;
  END IF;
END $mig$;

-- ─── Index ────────────────────────────────────────

