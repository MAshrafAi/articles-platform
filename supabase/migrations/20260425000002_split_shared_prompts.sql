-- Cleanup: remove the 3 shared prompt rows that were replaced by split keys.
-- writer            → writer_informational + writer_product
-- research          → research_informational + research_product
-- product_vision    → product_vision_article + product_vision_description
-- The new rows are seeded via scripts/seed-prompts.ts (service role).
delete from public.prompts
where key in ('writer', 'research', 'product_vision');
