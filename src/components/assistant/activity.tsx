"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  FileCode2,
  Loader2,
  Sparkles,
  Timer,
} from "lucide-react";
import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import { useThread } from "@assistant-ui/react";
import { Button } from "@/components/ui/button";
import { useArtifactPreview } from "@/components/artifact-preview";

type CreateArtifactArgs = {
  title?: string;
  type?: string;
  content?: string;
};

type CreateArtifactResult = {
  id?: string;
  title?: string;
  type?: string;
  viewUrl?: string;
};

export function AgentActivity() {
  const isRunning = useThread((state) => state.isRunning);
  const messages = useThread((state) => state.messages);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const startedAt = Date.now();
    const tick = () => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    };
    tick();
    const interval = window.setInterval(() => {
      tick();
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isRunning]);

  const latestAssistant = useMemo(
    () =>
      [...messages]
        .reverse()
        .find((message) => message.role === "assistant") ?? null,
    [messages],
  );
  const textLength = latestAssistant?.content
    .filter((part) => part.type === "text")
    .reduce((total, part) => total + part.text.length, 0);
  const toolParts =
    latestAssistant?.content.filter((part) => part.type === "tool-call") ?? [];

  if (!isRunning && !toolParts.length) return null;

  return (
    <div className="mx-4 mb-3 rounded-2xl border border-sky-100 bg-sky-50/90 px-4 py-3 text-xs text-slate-700 shadow-sm sm:mx-6">
      <div className="flex flex-wrap items-center gap-3">
        {isRunning ? (
          <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        )}
        <span className="font-semibold text-slate-900">
          {isRunning ? "Agent đang xử lý" : "Agent đã hoàn tất"}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 font-mono text-slate-600">
          <Timer className="h-3 w-3" />
          {elapsedSeconds}s
        </span>
        {textLength ? (
          <span className="rounded-full bg-white px-2 py-1">
            Đang stream {textLength} ký tự
          </span>
        ) : null}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <ActivityStep active={isRunning} label="Nhận yêu cầu" />
        <ActivityStep
          active={isRunning || toolParts.length > 0}
          label={
            toolParts.length
              ? `Chạy ${toolParts.length} tool/artifact step`
              : "Lập kế hoạch phản hồi"
          }
        />
        <ActivityStep
          active={isRunning && Boolean(textLength)}
          label="Stream phản hồi cho UI"
        />
      </div>
    </div>
  );
}

function ActivityStep({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2">
      <span
        className={
          active
            ? "h-2 w-2 rounded-full bg-sky-500"
            : "h-2 w-2 rounded-full bg-slate-300"
        }
      />
      <span>{label}</span>
    </div>
  );
}

export function CreateArtifactTool({
  args,
  result,
  status,
}: ToolCallMessagePartProps<CreateArtifactArgs, CreateArtifactResult>) {
  const { openArtifact } = useArtifactPreview();
  const artifactId = result?.id;
  const title = result?.title ?? args.title ?? "Artifact";
  const type = result?.type ?? args.type ?? "artifact";
  const isRunning = status.type === "running";

  return (
    <div className="my-3 rounded-2xl border border-sky-200 bg-white p-3 text-sm shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-sky-100 p-2 text-sky-700">
          {isRunning ? (
            <Sparkles className="h-4 w-4 animate-pulse" />
          ) : (
            <FileCode2 className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">
            {isRunning ? "Đang tạo artifact..." : "Đã tạo artifact"}
          </p>
          <p className="truncate text-slate-600">{title}</p>
          <p className="mt-1 text-xs text-slate-500">{type}</p>
        </div>
        {artifactId ? (
          <Button
            onClick={() => void openArtifact(artifactId)}
            size="sm"
            type="button"
            variant="outline"
          >
            Mở preview
          </Button>
        ) : null}
      </div>
    </div>
  );
}
