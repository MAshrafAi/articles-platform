import { createClient } from "jsr:@supabase/supabase-js@2";
import { SEARCH_QUERIES_SYSTEM } from "../prompts/search-queries.ts";
import { OUTLINE_SYSTEM } from "../prompts/outline.ts";
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
    audienceGender,
    writingTone,
    infoNotes,
    outlineNotes,
    writingNotes,
  } = body;

  if (!articleId || !authorId || !KW) {
    return new Response("Missing required fields", { status: 400 });
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

  let currentStep = "research";

  try {
    const OPENAI_KEY = getEnv("OPENAI_API_KEY");
    const OPENROUTER_KEY = getEnv("OPENROUTER_API_KEY");
    const DATAFORSEO_AUTH = getEnv("DATAFORSEO_AUTH");

    const articleTitle = title?.trim() || KW;

    // ── 1. Build prompt vars ─────────────────────────────────────────────────
    const audienceInstruction = buildAudienceInstruction(audienceGender);
    const toneInstruction = buildToneInstruction(writingTone);

    // ── 2. Generate 3 search queries + PAA in parallel ───────────────────────
    const [queriesRaw, paaItems] = await Promise.all([
      openAIChat(
        OPENAI_KEY,
        "gpt-5-chat-latest",
        [
          { role: "system", content: SEARCH_QUERIES_SYSTEM },
          {
            role: "user",
            content: `Keyword:\n${KW}\n\nArticle's Title:\n${articleTitle}\n\nNotes:\n${infoNotes || "none"}\n\nPlease Respond only in Arabic.`,
          },
        ],
        true
      ),
      dataForSEOPAA(DATAFORSEO_AUTH, KW),
    ]);

    const queriesData = JSON.parse(queriesRaw) as { queries: string[] };
    const queries: string[] = queriesData.queries ?? [];

    // ── 3. Run 3 Perplexity searches in parallel ─────────────────────────────
    const searchResults = await Promise.all(
      queries.map((q) =>
        openRouterChat(OPENROUTER_KEY, "perplexity/sonar-pro", [
          { role: "user", content: q },
        ])
      )
    );

    const aggregatedInfo = searchResults.join("\n\n---\n\n");
    await logStep(supabase, articleId, authorId, "research", "completed");

    // ── 3b. Log PAA ──────────────────────────────────────────────────────────
    currentStep = "paa";
    await logStep(supabase, articleId, authorId, "paa", "completed");

    // ── 4. Generate outline ──────────────────────────────────────────────────
    currentStep = "outline";
    const faqText = paaItems.join("\n");

    const outlineRaw = await openAIChat(
      OPENAI_KEY,
      "gpt-4.1",
      [
        { role: "system", content: OUTLINE_SYSTEM },
        {
          role: "user",
          content: `Keyword:\n${KW}\n\nArticle's Title:\n${articleTitle}\n\nSome info To use:\n\n${aggregatedInfo}\n\nSome Q&A to use in FAQs (use the question title as written):\n${faqText}\n\nNotes:\n${outlineNotes || "none"}`,
        },
      ],
      true
    );

    const outlineData = JSON.parse(outlineRaw) as OutlineResult;
    const sections: OutlineSection[] = outlineData.outline ?? [];
    const finalTitle = outlineData.title?.trim() || articleTitle;
    await logStep(supabase, articleId, authorId, "outline", "completed");

    // ── 5. Write all sections in parallel ────────────────────────────────────
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
            content: `Main Keyword of The Topic:\n${KW}\n\nHere is The Section You will write and its info (just write this section):\n\nH2:\n\n${section.h2}\nH3s:\n${JSON.stringify(section.h3)}\n\nInfo:\n${JSON.stringify(section.info)}`,
          },
        ])
      )
    );

    // ── 6. Assemble markdown → TipTap JSON ───────────────────────────────────
    const fullMarkdown = writtenSections.join("\n\n");
    const tiptapContent = markdownToTipTap(fullMarkdown);
    await logStep(supabase, articleId, authorId, "writing", "completed");

    // ── 7. Save to articles ───────────────────────────────────────────────────
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
