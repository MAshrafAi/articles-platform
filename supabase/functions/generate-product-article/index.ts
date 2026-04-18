import { createClient } from "jsr:@supabase/supabase-js@2";
import { PRODUCT_SEARCH_QUERIES_SYSTEM } from "../prompts/product-search-queries.ts";
import { PRODUCT_OUTLINE_SYSTEM } from "../prompts/product-outline.ts";
import { PRODUCT_VISION_SYSTEM } from "../prompts/product-vision.ts";
import {
  buildWriterSystem,
  buildAudienceInstruction,
  buildToneInstruction,
} from "../prompts/writer.ts";
import { markdownToTipTap } from "../utils/markdown-to-tiptap.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RequestBody {
  articleId: string;
  authorId: string;
  KW: string;
  title?: string;
  language: string;
  audienceGender: string;
  writingTone: string;
  productLinks: string;
  infoNotes?: string;
  outlineNotes?: string;
  writingNotes?: string;
}

interface OutlineSection {
  h2: string;
  h3: string[];
  info: string[];
}

interface OutlineResult {
  title: string;
  outline: OutlineSection[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEnv(key: string): string {
  const val = Deno.env.get(key);
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

async function openAIChat(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  jsonMode = false
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices[0].message.content as string;
}

async function openAIVisionChat(
  apiKey: string,
  systemPrompt: string,
  textContent: string,
  imageUrl: string
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: textContent },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI Vision error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices[0].message.content as string;
}

async function openRouterChat(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices[0].message.content as string;
}

async function dataForSEOPAA(
  b64Auth: string,
  keyword: string
): Promise<string[]> {
  try {
    const res = await fetch(
      "https://api.dataforseo.com/v3/serp/google/organic/live/advanced",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${b64Auth}`,
        },
        body: JSON.stringify([
          { language_code: "ar", location_code: 2682, keyword },
        ]),
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const items: { type: string; items?: { title?: string; expanded_element?: { description?: string }[] }[] }[] =
      data?.tasks?.[0]?.result?.[0]?.items ?? [];
    const paa = items.find((i) => i.type === "people_also_ask");
    if (!paa?.items) return [];
    return paa.items.map((el) => {
      const q = el.title ?? "";
      const a = el.expanded_element?.[0]?.description ?? "";
      return `سؤال: ${q} | إجابة: ${a}`;
    });
  } catch {
    return [];
  }
}

async function dataForSEOContentParsing(
  b64Auth: string,
  url: string
): Promise<string> {
  try {
    const res = await fetch(
      "https://api.dataforseo.com/v3/on_page/content_parsing/live",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${b64Auth}`,
        },
        body: JSON.stringify([{ url }]),
      }
    );
    if (!res.ok) return "";
    const data = await res.json();
    const items = data?.tasks?.[0]?.result ?? [];
    // Extract all text nodes recursively
    const texts: string[] = [];
    function extractTexts(obj: unknown) {
      if (Array.isArray(obj)) {
        obj.forEach(extractTexts);
      } else if (typeof obj === "object" && obj !== null) {
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
          if (key === "text" && value) texts.push(String(value));
          else extractTexts(value);
        }
      }
    }
    extractTexts(items);
    // Truncate to ~8000 chars to stay within token limits
    const joined = texts.join("\n");
    return joined.length > 8000 ? joined.slice(0, 8000) : joined;
  } catch {
    return "";
  }
}

async function captureScreenshot(
  apiFlashKey: string,
  url: string
): Promise<ArrayBuffer> {
  const params = new URLSearchParams({
    access_key: apiFlashKey,
    url,
    accept_language: "ar-SA",
    format: "jpeg",
  });
  const res = await fetch(
    `https://api.apiflash.com/v1/urltoimage?${params.toString()}`
  );
  if (!res.ok) {
    throw new Error(`APIFlash error ${res.status}: ${await res.text()}`);
  }
  return res.arrayBuffer();
}

// ─── Pipeline logging ─────────────────────────────────────────────────────────

interface LogEntry {
  step: string;
  status: "completed" | "failed";
  at: string;
  error?: string;
}

async function logStep(
  supabase: ReturnType<typeof createClient>,
  articleId: string,
  authorId: string,
  step: string,
  status: "completed" | "failed",
  error?: string
) {
  const { data } = await supabase
    .from("articles")
    .select("pipeline_logs")
    .eq("id", articleId)
    .single();

  const logs: LogEntry[] = ((data?.pipeline_logs as LogEntry[]) ?? []);
  logs.push({ step, status, at: new Date().toISOString(), ...(error ? { error } : {}) });

  await supabase
    .from("articles")
    .update({ pipeline_logs: logs })
    .eq("id", articleId)
    .eq("author_id", authorId);
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const {
    articleId,
    authorId,
    KW,
    title,
    language,
    audienceGender,
    writingTone,
    productLinks,
    infoNotes,
    outlineNotes,
    writingNotes,
  } = body;

  if (!articleId || !authorId || !KW || !productLinks) {
    return new Response("Missing required fields", { status: 400 });
  }

  // Parse product links
  const links = productLinks
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (links.length === 0) {
    return new Response("No valid product links provided", { status: 400 });
  }

  if (links.length > 5) {
    return new Response("Maximum 5 product links allowed", { status: 400 });
  }

  // Supabase admin client (service role — bypasses RLS)
  const supabase = createClient(
    getEnv("SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY")
  );

  const markArticleError = async () => {
    await supabase
      .from("articles")
      .update({ status: "error" })
      .eq("id", articleId)
      .eq("author_id", authorId);
  };

  let currentStep = "product_extraction";

  try {
    const OPENAI_KEY = getEnv("OPENAI_API_KEY");
    const OPENROUTER_KEY = getEnv("OPENROUTER_API_KEY");
    const DATAFORSEO_AUTH = getEnv("DATAFORSEO_AUTH");
    const APIFLASH_KEY = getEnv("APIFLASH_KEY");

    const articleTitle = title?.trim() || KW;
    const lang = language === "en" ? "English" : "Arabic";

    // ── 1. Product analysis pipeline ─────────────────────────────────────────
    console.log(`[Product] Analyzing ${links.length} product link(s)...`);

    const productAnalyses = await Promise.all(
      links.map(async (link, index) => {
        // Path A: Scrape text content
        const scrapedText = await dataForSEOContentParsing(DATAFORSEO_AUTH, link);

        // Path B: Screenshot → Storage → Vision
        let visionAnalysis = "";
        try {
          const screenshotBuffer = await captureScreenshot(APIFLASH_KEY, link);

          // Upload to Supabase Storage
          const storagePath = `${articleId}/${index}.jpeg`;
          const { error: uploadError } = await supabase.storage
            .from("articles-screenshots")
            .upload(storagePath, screenshotBuffer, {
              contentType: "image/jpeg",
              upsert: true,
            });

          if (uploadError) {
            console.error(`[Product] Storage upload failed for ${link}:`, uploadError);
          } else {
            // Get signed URL
            const { data: signedUrlData } = await supabase.storage
              .from("articles-screenshots")
              .createSignedUrl(storagePath, 3600);

            if (signedUrlData?.signedUrl) {
              const visionUserText = `Please write in ${lang}.\n\nMore info about the product:\n\n${scrapedText}`;
              visionAnalysis = await openAIVisionChat(
                OPENAI_KEY,
                PRODUCT_VISION_SYSTEM,
                visionUserText,
                signedUrlData.signedUrl
              );
            }
          }
        } catch (err) {
          console.error(`[Product] Screenshot/Vision failed for ${link}:`, err);
          // Graceful degradation: continue with scraped text only
        }

        const analysis = visionAnalysis || scrapedText || `Product URL: ${link}`;
        return `${analysis}\nProduct Link: ${link}`;
      })
    );

    const productAnalysisText = productAnalyses.join("\n\n---\n\n");
    console.log("[Product] Product analysis complete.");
    await logStep(supabase, articleId, authorId, "product_extraction", "completed");

    // ── 2. Build prompt vars ─────────────────────────────────────────────────
    currentStep = "research";
    const audienceInstruction = buildAudienceInstruction(audienceGender);
    const toneInstruction = buildToneInstruction(writingTone);

    // ── 3. Generate 3 search queries + PAA in parallel ───────────────────────
    const [queriesRaw, paaItems] = await Promise.all([
      openAIChat(
        OPENAI_KEY,
        "gpt-5-chat-latest",
        [
          { role: "system", content: PRODUCT_SEARCH_QUERIES_SYSTEM },
          {
            role: "user",
            content: `Keyword:\n${KW}\n\nArticle's Title:\n${articleTitle}\n\nNotes:\n${infoNotes || "none"}\n\nProducts will mention in the article:\n${productAnalysisText}\n\nPlease Respond only in ${lang}.`,
          },
        ],
        true
      ),
      dataForSEOPAA(DATAFORSEO_AUTH, KW),
    ]);

    const queriesData = JSON.parse(queriesRaw) as { queries: string[] };
    const queries: string[] = queriesData.queries ?? [];

    // ── 4. Run 3 Perplexity searches in parallel ─────────────────────────────
    const searchResults = await Promise.all(
      queries.map((q) =>
        openRouterChat(OPENROUTER_KEY, "perplexity/sonar-pro", [
          { role: "user", content: q },
        ])
      )
    );

    const aggregatedInfo = searchResults.join("\n\n---\n\n");
    await logStep(supabase, articleId, authorId, "research", "completed");

    // ── 4b. Log PAA ──────────────────────────────────────────────────────────
    currentStep = "paa";
    await logStep(supabase, articleId, authorId, "paa", "completed");

    // ── 5. Generate outline ──────────────────────────────────────────────────
    currentStep = "outline";
    const faqText = paaItems.join("\n");

    const outlineRaw = await openAIChat(
      OPENAI_KEY,
      "gpt-4.1",
      [
        { role: "system", content: PRODUCT_OUTLINE_SYSTEM },
        {
          role: "user",
          content: `Keyword:\n${KW}\n\nArticle's Title:\n${articleTitle}\n\nSome info To use:\n\n${aggregatedInfo}\n\nProducts That should include in the outline:\n${productAnalysisText}\n\nNotes:\n${outlineNotes || "none"}\n\nSome Q&A to use in FAQs (use the question title as written):\n${faqText}\n⚠️ FAQ IMPORTANT INSTRUCTIONS:\n- Only answer questions that are directly relevant to the article's topic.\n- DO NOT include promotional content or refer to products, services, or brands not mentioned in the article.\n- Keep the answers informative, concise, and neutral in tone.`,
        },
      ],
      true
    );

    const outlineData = JSON.parse(outlineRaw) as OutlineResult;
    const sections: OutlineSection[] = outlineData.outline ?? [];
    const finalTitle = outlineData.title?.trim() || articleTitle;
    await logStep(supabase, articleId, authorId, "outline", "completed");

    // ── 6. Write all sections in parallel ────────────────────────────────────
    currentStep = "writing";
    const writerSystem = buildWriterSystem(
      writingNotes || "none",
      audienceInstruction
    );

    const writtenSections = await Promise.all(
      sections.map((section) =>
        openAIChat(OPENAI_KEY, "gpt-5-chat-latest", [
          {
            role: "system",
            content: `${writerSystem}\n\nTone instruction: ${toneInstruction}`,
          },
          {
            role: "user",
            content: `Main Keyword of The Topic:\n${KW}\n\nHere is The Section You will write and its info (just write this section):\n\nH2:\n\n${section.h2}\nH3s:\n${JSON.stringify(section.h3)}\n\nInfo:\n${JSON.stringify(section.info)}\n\nPlease write in ${lang}`,
          },
        ])
      )
    );

    // ── 7. Assemble markdown → TipTap JSON ───────────────────────────────────
    const fullMarkdown = writtenSections.join("\n\n");
    const tiptapContent = markdownToTipTap(fullMarkdown);
    await logStep(supabase, articleId, authorId, "writing", "completed");

    // ── 8. Save to articles ───────────────────────────────────────────────────
    const { error: updateError } = await supabase
      .from("articles")
      .update({
        title: finalTitle,
        content: tiptapContent,
        status: "ready",
      })
      .eq("id", articleId)
      .eq("author_id", authorId);

    if (updateError) {
      console.error("Failed to update article:", updateError);
      await markArticleError();
      return new Response(JSON.stringify({ ok: false, error: updateError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, articleId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Pipeline error:", err);
    await logStep(supabase, articleId, authorId, currentStep, "failed", String(err));
    await markArticleError();
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
