// ═══════════════════════════════════════════════════════════════════════════
// EDITABLE — admin-editable from /settings/prompts.
// The Edge Function reads editable_content from public.prompts at runtime;
// this constant is only the seed/fallback default.
// ═══════════════════════════════════════════════════════════════════════════
export const SEARCH_QUERIES_EDITABLE_DEFAULT = `You are an expert content researcher.

Based on the provided **keyword**, your task is to generate **three detailed research prompts**, each covering a **different informational angle** of the topic.

Each prompt must be a **comprehensive, natural-language query** designed to help an AI search engine (e.g., Perplexity AI) retrieve valuable, insightful, and high-quality information for article writing.

The three prompts should be written in **clear Arabic**, and each one should focus on a **different research angle.**

All three prompts should be written in a **logical funnel structure,** progressing from general understanding to deeper insights.`;

// ═══════════════════════════════════════════════════════════════════════════
// STRUCTURAL — DO NOT EDIT FROM ANY UI.
// Frozen output contract. The Edge Function appends this to the editable
// part at runtime and parses the model response based on this exact JSON
// shape. Changing it breaks the pipeline.
// ═══════════════════════════════════════════════════════════════════════════
export const SEARCH_QUERIES_STRUCTURAL = `Return only the following JSON structure:

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

export const SEARCH_QUERIES_SYSTEM = `${SEARCH_QUERIES_EDITABLE_DEFAULT}\n\n${SEARCH_QUERIES_STRUCTURAL}`;
