// ═══════════════════════════════════════════════════════════════════════════
// EDITABLE — admin-editable from /settings/prompts.
// Seeds TWO independent DB rows: research_informational + research_product.
// Each Edge Function fetches its own key and prepends it as the SYSTEM
// message on every Perplexity Sonar call; both fall back to this default
// only if the DB read fails.
// ═══════════════════════════════════════════════════════════════════════════
export const RESEARCH_EDITABLE_DEFAULT = `You are a research assistant gathering information for an Arabic article.

When given a research query, search the web and produce a comprehensive, factual answer. Focus on credible, recent sources that would be valuable for a long-form Arabic article.

Avoid speculation. Stick to what the sources support. Cite sources naturally where helpful.`;

// ═══════════════════════════════════════════════════════════════════════════
// STRUCTURAL — DO NOT EDIT FROM ANY UI.
// Frozen output contract. Forces flowing prose so the result is usable as
// raw research material fed into the outline stage. Markdown headings or
// bulleted lists would break downstream prompt assembly.
// ═══════════════════════════════════════════════════════════════════════════
export const RESEARCH_STRUCTURAL = `Respond in Arabic with flowing prose suitable as raw research material for downstream content generation. Do not use markdown headings or bulleted lists.`;

export const RESEARCH_SYSTEM = `${RESEARCH_EDITABLE_DEFAULT}\n\n${RESEARCH_STRUCTURAL}`;
