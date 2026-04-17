/**
 * Converts markdown text (as produced by the article writer) to TipTap JSONContent.
 * Handles: # ## ### headings, **bold**, - bullets, 1. numbered lists, paragraphs.
 */

type Mark = { type: string; attrs?: Record<string, unknown> };

interface TextNode {
  type: "text";
  text: string;
  marks?: Mark[];
}

interface BlockNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: (BlockNode | TextNode)[];
}

interface TipTapDoc {
  type: "doc";
  content: BlockNode[];
}

// ─── Rich text parser (bold + links) ─────────────────────────────────────────

function parseInline(text: string): TextNode[] {
  const nodes: TextNode[] = [];
  // Regex to match **bold** or [link](url)
  const pattern = /\*\*(.*?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push({ type: "text", text: text.slice(last, match.index) });
    }

    if (match[1] !== undefined) {
      // **bold**
      nodes.push({ type: "text", text: match[1], marks: [{ type: "bold" }] });
    } else if (match[2] !== undefined && match[3] !== undefined) {
      // [text](url)
      nodes.push({
        type: "text",
        text: match[2],
        marks: [{ type: "link", attrs: { href: match[3], target: "_blank" } }],
      });
    }

    last = match.index + match[0].length;
  }

  if (last < text.length) {
    nodes.push({ type: "text", text: text.slice(last) });
  }

  return nodes.length > 0 ? nodes : [{ type: "text", text }];
}

// ─── Block builders ───────────────────────────────────────────────────────────

function heading(level: number, text: string): BlockNode {
  return {
    type: "heading",
    attrs: { level },
    content: parseInline(text),
  };
}

function paragraph(text: string): BlockNode {
  return {
    type: "paragraph",
    content: parseInline(text),
  };
}

function bulletItem(text: string): BlockNode {
  return {
    type: "listItem",
    content: [{ type: "paragraph", content: parseInline(text) }],
  };
}

function numberedItem(text: string): BlockNode {
  return {
    type: "listItem",
    content: [{ type: "paragraph", content: parseInline(text) }],
  };
}

// ─── Main converter ───────────────────────────────────────────────────────────

export function markdownToTipTap(markdown: string): TipTapDoc {
  const lines = markdown.split("\n");
  const blocks: BlockNode[] = [];
  let pendingParagraphLines: string[] = [];
  let bulletBuffer: BlockNode[] = [];
  let numberedBuffer: BlockNode[] = [];

  function flushParagraph() {
    if (pendingParagraphLines.length === 0) return;
    const text = pendingParagraphLines.join(" ").trim();
    if (text) blocks.push(paragraph(text));
    pendingParagraphLines = [];
  }

  function flushBullets() {
    if (bulletBuffer.length === 0) return;
    blocks.push({ type: "bulletList", content: bulletBuffer });
    bulletBuffer = [];
  }

  function flushNumbered() {
    if (numberedBuffer.length === 0) return;
    blocks.push({ type: "orderedList", content: numberedBuffer });
    numberedBuffer = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Heading
    if (/^### /.test(line)) {
      flushParagraph(); flushBullets(); flushNumbered();
      blocks.push(heading(3, line.slice(4).trim()));
      continue;
    }
    if (/^## /.test(line)) {
      flushParagraph(); flushBullets(); flushNumbered();
      blocks.push(heading(2, line.slice(3).trim()));
      continue;
    }
    if (/^# /.test(line)) {
      flushParagraph(); flushBullets(); flushNumbered();
      blocks.push(heading(1, line.slice(2).trim()));
      continue;
    }

    // Bullet list
    if (/^- /.test(line) || /^\* /.test(line)) {
      flushParagraph(); flushNumbered();
      bulletBuffer.push(bulletItem(line.slice(2).trim()));
      continue;
    }

    // Numbered list
    if (/^\d+\. /.test(line)) {
      flushParagraph(); flushBullets();
      const text = line.replace(/^\d+\. /, "").trim();
      numberedBuffer.push(numberedItem(text));
      continue;
    }

    // Empty line → flush paragraph
    if (line.trim() === "") {
      flushParagraph(); flushBullets(); flushNumbered();
      continue;
    }

    // Regular text → accumulate into paragraph
    flushBullets(); flushNumbered();
    pendingParagraphLines.push(line.trim());
  }

  // Flush anything remaining
  flushParagraph(); flushBullets(); flushNumbered();

  return { type: "doc", content: blocks.length > 0 ? blocks : [{ type: "paragraph" }] };
}
