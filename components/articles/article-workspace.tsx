"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useEditor, EditorContent, type Editor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowRight,
  Bold,
  Check,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Save,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { formatDateTime, formatRelativeTime } from "@/lib/formatters";
import type { ArticleFull } from "@/lib/articles";
import { ArticleTypeBadge } from "@/components/articles/article-type-badge";
import { ArticleRowActions } from "@/components/articles/article-row-actions";
import { updateArticleAction } from "@/app/(protected)/articles/actions";

interface ArticleWorkspaceProps {
  article: ArticleFull;
  canEdit: boolean;
  canDelete: boolean;
}

export function ArticleWorkspace({
  article,
  canEdit,
  canDelete,
}: ArticleWorkspaceProps) {
  const [title, setTitle] = useState(article.title ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string>(article.updated_at);
  const [contentVersion, setContentVersion] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  // Snapshot of last-saved state (compared against for dirty check)
  const savedTitleRef = useRef<string>(article.title ?? "");
  const savedContentJsonRef = useRef<string>(JSON.stringify(article.content));
  const latestContentRef = useRef<JSONContent>(article.content);

  const editor = useEditor({
    immediatelyRender: false,
    editable: canEdit,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "text-slate-900 underline underline-offset-2",
          rel: "noopener noreferrer nofollow",
        },
      }),
      Placeholder.configure({
        placeholder: canEdit ? "ابدأ الكتابة هنا…" : "لا يوجد محتوى",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        defaultAlignment: "right",
      }),
    ],
    content: article.content,
    editorProps: {
      attributes: {
        dir: "rtl",
        class:
          "prose prose-slate max-w-none min-h-[420px] px-4 py-6 focus:outline-none sm:px-6 sm:py-8 md:px-8 md:py-10",
      },
    },
    onCreate: ({ editor }) => {
      const text = editor.getText();
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    },
    onUpdate: ({ editor }) => {
      latestContentRef.current = editor.getJSON();
      setContentVersion((v) => v + 1);
      const text = editor.getText();
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    },
  });

  const isDirty = useMemo(() => {
    void contentVersion; // re-evaluate when editor content changes
    if (title !== savedTitleRef.current) return true;
    return (
      JSON.stringify(latestContentRef.current) !== savedContentJsonRef.current
    );
  }, [contentVersion, title]);

  const handleSave = useCallback(async () => {
    if (!canEdit || !isDirty || isSaving) return;
    setIsSaving(true);

    const payload = {
      id: article.id,
      title: title.trim() || null,
      content: latestContentRef.current,
    };

    const result = await updateArticleAction(payload);
    setIsSaving(false);

    if (result.ok) {
      savedTitleRef.current = title;
      savedContentJsonRef.current = JSON.stringify(latestContentRef.current);
      setSavedAt(new Date().toISOString());
      setContentVersion((v) => v + 1); // trigger isDirty re-eval
      toast.success("تم حفظ التعديلات");
    } else {
      toast.error(result.error);
    }
  }, [article.id, canEdit, isDirty, isSaving, title]);

  // Cmd/Ctrl + S → save
  useEffect(() => {
    if (!canEdit) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (isDirty && !isSaving) handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canEdit, handleSave, isDirty, isSaving]);

  // Warn before closing tab with unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const displayTitle = article.title?.trim() || "مقال بدون عنوان";
  const authorName = article.author.full_name?.trim() || article.author.email;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 md:px-8 md:py-8">
      {/* Top bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-slate-900"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للمقالات
        </Link>
        <div className="flex items-center gap-2">
          {canEdit && isDirty && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
              title="حفظ التعديلات (Ctrl/⌘ + S)"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isSaving ? "جارٍ الحفظ…" : "حفظ التعديلات"}</span>
            </button>
          )}
          {canDelete && (
            <ArticleRowActions
              articleId={article.id}
              articleTitle={displayTitle}
              variant="button"
              redirectAfterDelete
            />
          )}
        </div>
      </div>

      {/* Meta strip */}
      <div className="mb-8 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <ArticleTypeBadge type={article.type} />
        <span className="text-slate-300">•</span>
        <span>
          الناشر:{" "}
          <span className="font-medium text-slate-700">{authorName}</span>
        </span>
        <span className="text-slate-300">•</span>
        <span>أُنشئ {formatDateTime(article.created_at)}</span>
      </div>

      <div className="mx-auto w-full max-w-3xl">
        {/* Title input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="عنوان المقال"
          disabled={!canEdit}
          className="mb-4 w-full border-0 bg-transparent px-0 text-2xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-0 disabled:opacity-70 sm:text-3xl"
        />

        {/* Save status + word count */}
        <StatusIndicator
          canEdit={canEdit}
          isSaving={isSaving}
          isDirty={isDirty}
          savedAt={savedAt}
          wordCount={wordCount}
        />

        {/* Toolbar */}
        {canEdit && editor && <EditorToolbar editor={editor} />}

        {/* Editor body */}
        <div
          className={cn(
            "rounded-2xl border border-slate-200 bg-white",
            canEdit ? "shadow-sm" : "opacity-95"
          )}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

function StatusIndicator({
  canEdit,
  isSaving,
  isDirty,
  savedAt,
  wordCount,
}: {
  canEdit: boolean;
  isSaving: boolean;
  isDirty: boolean;
  savedAt: string;
  wordCount: number;
}) {
  const wordCountDisplay = (
    <span className="tabular-nums text-slate-400">
      {wordCount.toLocaleString("en-US")} كلمة
    </span>
  );

  if (!canEdit) {
    return (
      <div className="mb-4 flex h-5 items-center justify-end text-xs">
        {wordCountDisplay}
      </div>
    );
  }

  let saveContent: React.ReactNode;
  if (isSaving) {
    saveContent = (
      <>
        <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
        <span>جارٍ الحفظ…</span>
      </>
    );
  } else if (isDirty) {
    saveContent = (
      <>
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        <span className="text-amber-600">يوجد تعديلات غير محفوظة</span>
      </>
    );
  } else {
    saveContent = (
      <>
        <Check className="h-3 w-3 text-emerald-600" />
        <span>محفوظ — آخر تحديث {formatRelativeTime(savedAt)}</span>
      </>
    );
  }

  return (
    <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
      <div className="flex items-center gap-2">{saveContent}</div>
      {wordCountDisplay}
    </div>
  );
}

function EditorToolbar({ editor }: { editor: Editor }) {
  const handleLink = () => {
    const current = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("أدخل الرابط (اترك فارغاً لإزالته):", current ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="sticky top-0 z-10 mb-2 flex flex-wrap items-center gap-0.5 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-sm backdrop-blur">
      <ToolbarGroup>
        <ToolBtn
          pressed={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="عريض"
        >
          <Bold className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          pressed={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="مائل"
        >
          <Italic className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          pressed={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          label="تسطير"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          pressed={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          label="يتوسطه خط"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolBtn>
      </ToolbarGroup>

      <Divider />

      <ToolbarGroup>
        <ToolBtn
          pressed={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          label="عنوان ١"
        >
          <Heading1 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          pressed={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          label="عنوان ٢"
        >
          <Heading2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          pressed={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          label="عنوان ٣"
        >
          <Heading3 className="h-4 w-4" />
        </ToolBtn>
      </ToolbarGroup>

      <Divider />

      <ToolbarGroup>
        <ToolBtn
          pressed={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="قائمة نقطية"
        >
          <List className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          pressed={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label="قائمة مرقّمة"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          pressed={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          label="اقتباس"
        >
          <Quote className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          pressed={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          label="كود"
        >
          <Code className="h-4 w-4" />
        </ToolBtn>
      </ToolbarGroup>

      <Divider />

      <ToolbarGroup>
        <ToolBtn
          pressed={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          label="محاذاة يمين"
        >
          <AlignRight className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          pressed={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          label="توسيط"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          pressed={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          label="محاذاة يسار"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          pressed={editor.isActive({ textAlign: "justify" })}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          label="ضبط"
        >
          <AlignJustify className="h-4 w-4" />
        </ToolBtn>
      </ToolbarGroup>

      <Divider />

      <ToolbarGroup>
        <ToolBtn
          pressed={editor.isActive("link")}
          onClick={handleLink}
          label="رابط"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolBtn>
      </ToolbarGroup>
    </div>
  );
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />;
}

function ToolBtn({
  pressed,
  onClick,
  label,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Toggle
      size="sm"
      pressed={pressed}
      onPressedChange={onClick}
      aria-label={label}
      title={label}
      className="h-8 w-8 p-0 data-[state=on]:bg-slate-900 data-[state=on]:text-white"
    >
      {children}
    </Toggle>
  );
}
