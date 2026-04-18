-- Add generation status to articles
CREATE TYPE article_status AS ENUM ('generating', 'ready', 'error');

ALTER TABLE public.articles
  ADD COLUMN status article_status NOT NULL DEFAULT 'ready';

-- Update RLS: no change needed — status is just a column, same policies apply
