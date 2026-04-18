-- Add pipeline_logs column to track article generation steps
ALTER TABLE public.articles
ADD COLUMN pipeline_logs jsonb NOT NULL DEFAULT '[]'::jsonb;
