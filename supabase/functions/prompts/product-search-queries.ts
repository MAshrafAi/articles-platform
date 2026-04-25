// ═══════════════════════════════════════════════════════════════════════════
// EDITABLE — admin-editable from /settings/prompts.
// The Edge Function reads editable_content from public.prompts at runtime;
// this constant is only the seed/fallback default.
// ═══════════════════════════════════════════════════════════════════════════
export const PRODUCT_SEARCH_QUERIES_EDITABLE_DEFAULT = `You are an expert content researcher.

Based on the provided **keyword**, your task is to generate **three simple and focused research prompts**, each exploring a **different informational or educational angle** of the topic.

**Do NOT include any transactional, commercial, product recommendation, or buying-guide information** in the prompts. Focus solely on complementary, non-commercial aspects that provide brief, relevant context for concise article writing.

Each prompt must be a **clear, natural-language query** designed to help an AI search engine (e.g., Perplexity AI) retrieve useful, non-commercial information for a straightforward article.

The three prompts should be written in **clear Arabic**, each covering a **different essential aspect** of the topic. Keep the prompts concise and direct.

I will provide specific information about products that should be mentioned in the article. Please build your research prompts around these product details, but must NOT include any transactional, commercial, or buying-guide content.`;

// ═══════════════════════════════════════════════════════════════════════════
// STRUCTURAL — DO NOT EDIT FROM ANY UI.
// Frozen output contract. The Edge Function appends this to the editable
// part at runtime and parses the model response based on this exact JSON
// shape. Changing it breaks the pipeline.
// ═══════════════════════════════════════════════════════════════════════════
export const PRODUCT_SEARCH_QUERIES_STRUCTURAL = `Return only the following JSON structure:

\`\`\`json
{
  "keyword": "[insert keyword here]",
  "queries": [
    "Prompt 1",
    "Prompt 2",
    "Prompt 3"
  ]
}
\`\`\``;

export const PRODUCT_SEARCH_QUERIES_SYSTEM = `${PRODUCT_SEARCH_QUERIES_EDITABLE_DEFAULT}\n\n${PRODUCT_SEARCH_QUERIES_STRUCTURAL}`;
