"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, RotateCcw, Save } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/formatters";
import { updatePromptAction } from "./actions";
import {
  WORKFLOWS,
  type PromptKey,
  type Workflow,
  type WorkflowId,
  type WorkflowStage,
} from "./constants";

export type PromptData = {
  key: PromptKey;
  editable: string;
  default: string;
  updatedAt: string | null;
};

interface Props {
  prompts: Record<PromptKey, PromptData>;
}

export function PromptsWorkflowClient({ prompts }: Props) {
  const [activeWorkflow, setActiveWorkflow] =
    useState<WorkflowId>("informational");
  const [openKey, setOpenKey] = useState<PromptKey | null>(null);

  const activeWorkflowData = useMemo(
    () => WORKFLOWS.find((w) => w.id === activeWorkflow)!,
    [activeWorkflow]
  );

  const openStage = useMemo(() => {
    if (!openKey) return null;
    return activeWorkflowData.stages.find((s) => s.key === openKey) ?? null;
  }, [openKey, activeWorkflowData]);

  return (
    <>
      <div className="mb-6 inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {WORKFLOWS.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => setActiveWorkflow(w.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              activeWorkflow === w.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            {w.label}
          </button>
        ))}
      </div>

      <StageList
        workflow={activeWorkflowData}
        prompts={prompts}
        onEdit={(key) => setOpenKey(key)}
      />

      {openStage && openKey && (
        <PromptEditorDialog
          stage={openStage}
          prompt={prompts[openKey]}
          open={true}
          onClose={() => setOpenKey(null)}
        />
      )}
    </>
  );
}

function StageList({
  workflow,
  prompts,
  onEdit,
}: {
  workflow: Workflow;
  prompts: Record<PromptKey, PromptData>;
  onEdit: (key: PromptKey) => void;
}) {
  return (
    <ul className="space-y-3">
      {workflow.stages.map((stage, idx) => {
        const prompt = prompts[stage.key];
        return (
          <li
            key={`${workflow.id}-${stage.key}`}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:gap-4"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
              {idx + 1}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
                  {stage.label}
                </h3>
                <span
                  dir="ltr"
                  className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                >
                  {stage.model}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                {stage.description}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {prompt.updatedAt
                  ? `آخر تعديل: ${formatDateTime(prompt.updatedAt)}`
                  : "لم يُعدّل بعد"}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(stage.key)}
            >
              تعديل
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

function PromptEditorDialog({
  stage,
  prompt,
  open,
  onClose,
}: {
  stage: WorkflowStage;
  prompt: PromptData;
  open: boolean;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(prompt.editable);
  const [pending, startTransition] = useTransition();

  const dirty = draft !== prompt.editable;
  const isDefault = draft === prompt.default;

  const handleSave = () => {
    startTransition(async () => {
      const result = await updatePromptAction({
        key: prompt.key,
        content: draft,
      });
      if (result.ok) {
        toast.success("تم حفظ البرومت بنجاح");
        onClose();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleRestoreDefault = () => {
    setDraft(prompt.default);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="max-w-4xl">
        <DialogHeader className="text-start sm:text-start">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>{stage.label}</DialogTitle>
            <span
              dir="ltr"
              className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
            >
              {stage.model}
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            {stage.description}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {prompt.updatedAt
              ? `آخر تعديل: ${formatDateTime(prompt.updatedAt)}`
              : "لم يُعدّل بعد"}
          </p>
        </DialogHeader>

        <div>
          <textarea
            id={`prompt-${prompt.key}`}
            dir="ltr"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={pending}
            className="block h-[460px] w-full resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs leading-relaxed text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-60"
          />
        </div>

        <DialogFooter className="gap-2 sm:justify-start">
          <Button
            type="button"
            onClick={handleSave}
            disabled={!dirty || pending}
            className="gap-2"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            حفظ
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleRestoreDefault}
            disabled={pending || isDefault}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            استعادة الافتراضي
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={pending}
          >
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
