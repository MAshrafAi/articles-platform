-- Create new articles-screenshots bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('articles-screenshots', 'articles-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Move existing objects from old bucket to new bucket
UPDATE storage.objects SET bucket_id = 'articles-screenshots'
WHERE bucket_id = 'product-screenshots';
