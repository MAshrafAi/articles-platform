/**
 * One-off seed: populate public.prompts with the EDITABLE_DEFAULT content
 * from every prompt TS file. Safe to re-run — uses upsert on key.
 * Run: node --experimental-strip-types --env-file=.env.local scripts/seed-prompts.ts
 */

import { createClient } from "@supabase/supabase-js";
import { SEARCH_QUERIES_EDITABLE_DEFAULT } from "../supabase/functions/prompts/search-queries.ts";
import { OUTLINE_EDITABLE_DEFAULT } from "../supabase/functions/prompts/outline.ts";
import { WRITER_EDITABLE_DEFAULT } from "../supabase/functions/prompts/writer.ts";
import { RESEARCH_EDITABLE_DEFAULT } from "../supabase/functions/prompts/research.ts";
import { PRODUCT_VISION_EDITABLE_DEFAULT } from "../supabase/functions/prompts/product-vision.ts";
import { PRODUCT_OUTLINE_EDITABLE_DEFAULT } from "../supabase/functions/prompts/product-outline.ts";
import { PRODUCT_SEARCH_QUERIES_EDITABLE_DEFAULT } from "../supabase/functions/prompts/product-search-queries.ts";
import { PRODUCT_DESCRIPTION_EDITABLE_DEFAULT } from "../supabase/functions/prompts/product-description.ts";
import { PRODUCT_SEO_EDITABLE_DEFAULT } from "../supabase/functions/prompts/product-seo.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

const rows = [
  { key: "search_queries", editable_content: SEARCH_QUERIES_EDITABLE_DEFAULT, default_content: SEARCH_QUERIES_EDITABLE_DEFAULT },
  { key: "research_informational", editable_content: RESEARCH_EDITABLE_DEFAULT, default_content: RESEARCH_EDITABLE_DEFAULT },
  { key: "research_product", editable_content: RESEARCH_EDITABLE_DEFAULT, default_content: RESEARCH_EDITABLE_DEFAULT },
  { key: "outline", editable_content: OUTLINE_EDITABLE_DEFAULT, default_content: OUTLINE_EDITABLE_DEFAULT },
  { key: "writer_informational", editable_content: WRITER_EDITABLE_DEFAULT, default_content: WRITER_EDITABLE_DEFAULT },
  { key: "writer_product", editable_content: WRITER_EDITABLE_DEFAULT, default_content: WRITER_EDITABLE_DEFAULT },
  { key: "product_vision_article", editable_content: PRODUCT_VISION_EDITABLE_DEFAULT, default_content: PRODUCT_VISION_EDITABLE_DEFAULT },
  { key: "product_vision_description", editable_content: PRODUCT_VISION_EDITABLE_DEFAULT, default_content: PRODUCT_VISION_EDITABLE_DEFAULT },
  { key: "product_outline", editable_content: PRODUCT_OUTLINE_EDITABLE_DEFAULT, default_content: PRODUCT_OUTLINE_EDITABLE_DEFAULT },
  { key: "product_search_queries", editable_content: PRODUCT_SEARCH_QUERIES_EDITABLE_DEFAULT, default_content: PRODUCT_SEARCH_QUERIES_EDITABLE_DEFAULT },
  { key: "product_description", editable_content: PRODUCT_DESCRIPTION_EDITABLE_DEFAULT, default_content: PRODUCT_DESCRIPTION_EDITABLE_DEFAULT },
  { key: "product_seo", editable_content: PRODUCT_SEO_EDITABLE_DEFAULT, default_content: PRODUCT_SEO_EDITABLE_DEFAULT },
];

let ok = 0;
let failed = 0;
for (const row of rows) {
  const { error } = await supabase
    .from("prompts")
    .upsert(row, { onConflict: "key" });
  if (error) {
    console.error(`[FAIL] ${row.key}:`, error.message);
    failed++;
  } else {
    console.log(`[OK]   ${row.key} (${row.editable_content.length} chars)`);
    ok++;
  }
}

console.log(`\nDone. ${ok} ok, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
