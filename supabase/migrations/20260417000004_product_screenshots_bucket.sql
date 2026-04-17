-- Create private storage bucket for product screenshots (used by generate-product-article Edge Function)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-screenshots', 'product-screenshots', false);
