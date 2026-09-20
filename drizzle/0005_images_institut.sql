-- 0005 — images de l'institut.
--
-- Une ligne par image (« hero »), stockée en bytea. Le volume reste
-- minuscule : l'envoi est plafonné et l'image réduite avant d'arriver.
--
-- Strictement additif : rien n'est retiré, rien n'est modifié.

CREATE TABLE IF NOT EXISTS public.institute_assets (
  key character varying(40) PRIMARY KEY,
  mime_type character varying(60) NOT NULL,
  byte_size integer NOT NULL,
  data bytea NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
