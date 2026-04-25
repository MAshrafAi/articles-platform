import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  PRODUCT_VISION_EDITABLE_DEFAULT,
  PRODUCT_VISION_STRUCTURAL,
} from "../prompts/product-vision.ts";
import {
  PRODUCT_DESCRIPTION_EDITABLE_DEFAULT,
  PRODUCT_DESCRIPTION_STRUCTURAL,
} from "../prompts/product-description.ts";
import {
  PRODUCT_SEO_EDITABLE_DEFAULT,
  PRODUCT_SEO_STRUCTURAL,
} from "../prompts/product-seo.ts";
import { fetchPrompt } from "../utils/fetch-prompt.ts";
import { markdownToTipTap } from "../utils/markdown-to-tiptap.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RequestBody {
  productId: string;
  authorId: string;
  productUrl: string;
  keyword: string;
  language: string;
  notes?: string;
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
  messages: { role: string; content: string }[]
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
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
  productId: string,
  authorId: string,
  step: string,
  status: "completed" | "failed",
  error?: string
) {
  const { data } = await supabase
    .from("products")
    .select("pipeline_logs")
    .eq("id", productId)
    .single();

  const logs: LogEntry[] = ((data?.pipeline_logs as LogEntry[]) ?? []);
  logs.push({ step, status, at: new Date().toISOString(), ...(error ? { error } : {}) });

  await supabase
    .from("products")
    .update({ pipeline_logs: logs })
    .eq("id", productId)
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

  const { productId, authorId, productUrl, keyword, language, notes } = body;

  if (!productId || !authorId || !productUrl || !keyword) {
    return new Response("Missing required fields", { status: 400 });
  }

  const supabase = createClient(
    getEnv("SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY")
  );

  const markError = async () => {
    await supabase
      .from("products")
      .update({ status: "error" })
      .eq("id", productId)
      .eq("author_id", authorId);
  };

  let currentStep = "scraping";
  const lang = language === "en" ? "English" : "Arabic";

  try {
    const OPENAI_KEY = getEnv("OPENAI_API_KEY");
    const DATAFORSEO_AUTH = getEnv("DATAFORSEO_AUTH");
    const APIFLASH_KEY = getEnv("APIFLASH_KEY");

    // ── 0. Fetch editable prompts from DB in parallel ────────────────────────
    const [
      productVisionEditable,
      productDescriptionEditable,
      productSeoEditable,
    ] = await Promise.all([
      fetchPrompt(supabase, "product_vision_description", PRODUCT_VISION_EDITABLE_DEFAULT),
      fetchPrompt(
        supabase,
        "product_description",
        PRODUCT_DESCRIPTION_EDITABLE_DEFAULT
      ),
      fetchPrompt(supabase, "product_seo", PRODUCT_SEO_EDITABLE_DEFAULT),
    ]);

    const productVisionSystem = `${productVisionEditable}\n\n${PRODUCT_VISION_STRUCTURAL}`;
    const productDescriptionSystem = `${productDescriptionEditable}\n\n${PRODUCT_DESCRIPTION_STRUCTURAL}`;
    const productSeoSystem = `${productSeoEditable}\n\n${PRODUCT_SEO_STRUCTURAL}`;

    // ── 1. Scrape product page ───────────────────────────────────────────────
    console.log("[Product] Scraping:", productUrl);
    const scrapedText = await dataForSEOContentParsing(DATAFORSEO_AUTH, productUrl);
    await logStep(supabase, productId, authorId, "scraping", "completed");

    // ── 2. Screenshot + Vision analysis ──────────────────────────────────────
    currentStep = "vision";
    let visionAnalysis = scrapedText;
    try {
      const screenshotBuffer = await captureScreenshot(APIFLASH_KEY, productUrl);

      const storagePath = `${productId}.jpeg`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(storagePath, screenshotBuffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (!uploadError) {
        const { data: signedUrlData } = await supabase.storage
          .from("product-images")
          .createSignedUrl(storagePath, 3600);

        if (signedUrlData?.signedUrl) {
          const visionUserText = `Please write in ${lang}.\n\nMore info about the product:\n\n${scrapedText}`;
          visionAnalysis = await openAIVisionChat(
            OPENAI_KEY,
            productVisionSystem,
            visionUserText,
            signedUrlData.signedUrl
          );
        }
      } else {
        console.error("[Product] Storage upload failed:", uploadError);
      }
    } catch (err) {
      console.error("[Product] Screenshot/Vision failed:", err);
    }
    await logStep(supabase, productId, authorId, "vision", "completed");

    // ── 3. Write product description ─────────────────────────────────────────
    currentStep = "writing";
    const descriptionContent = await openAIChat(
      OPENAI_KEY,
      "gpt-4.1",
      [
        {
          role: "system",
          content: `${productDescriptionSystem}\n\n30. Please Write in ${lang}`,
        },
        {
          role: "user",
          content: `Please Write in ${lang}.\n\nKeyword(s):\n${keyword}\n\nThe product you should write about:\n${visionAnalysis}\n\nMore info about the product:\n${scrapedText}\n\nNotes you MUST follow:\n${notes || "none"}`,
        },
      ]
    );
    await logStep(supabase, productId, authorId, "writing", "completed");

    // ── 4. SEO metadata ──────────────────────────────────────────────────────
    currentStep = "seo";
    const seoContent = await openAIChat(
      OPENAI_KEY,
      "gpt-4.1",
      [
        { role: "system", content: productSeoSystem },
        {
          role: "user",
          content: `Keyword:\n\n${keyword}\n\nThe Product description:\n\n${descriptionContent}\n\nPlease write in ${lang}.`,
        },
      ]
    );
    await logStep(supabase, productId, authorId, "seo", "completed");

    // ── 5. Combine and save ──────────────────────────────────────────────────
    const fullContent = `${seoContent}\n\n---\n\n${descriptionContent}`;
    const tiptapContent = markdownToTipTap(fullContent);

    // Extract a title from the keyword
    const finalTitle = keyword;

    const { error: updateError } = await supabase
      .from("products")
      .update({
        title: finalTitle,
        content: tiptapContent,
        status: "ready",
      })
      .eq("id", productId)
      .eq("author_id", authorId);

    if (updateError) {
      console.error("Failed to update product:", updateError);
      await markError();
      return new Response(JSON.stringify({ ok: false, error: updateError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, productId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Pipeline error:", err);
    await logStep(supabase, productId, authorId, currentStep, "failed", String(err));
    await markError();
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
