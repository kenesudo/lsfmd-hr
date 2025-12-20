-- Ensure process_type is unique (one canonical template row per process_type)
-- If duplicates exist, keep the newest row per process_type.

WITH ranked AS (
  SELECT
    id,
    process_type,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY process_type ORDER BY created_at DESC, id DESC) AS rn
  FROM public.log_markdowns
)
DELETE FROM public.log_markdowns lm
USING ranked r
WHERE lm.id = r.id
  AND r.rn > 1;

ALTER TABLE public.log_markdowns
  ADD CONSTRAINT log_markdowns_process_type_unique UNIQUE (process_type);
