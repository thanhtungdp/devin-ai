"use client";

import {
  ActionBarPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import { ArrowDown, Copy, RefreshCcw, SendHorizontal } from "lucide-react";
import type { ComponentProps } from "react";
import {
  AgentActivity,
  CreateArtifactTool,
  DeepAgentTodos,
  WriteTodosTool,
} from "./activity";
import { Button } from "@/components/ui/button";
import { useArtifactPreview } from "@/components/artifact-preview";
import { cn } from "@/lib/utils";

export function Thread() {
  return (
    <ThreadPrimitive.Root className="flex h-full min-h-0 flex-col rounded-3xl border border-slate-200 bg-white shadow-sm">
      <ThreadPrimitive.Viewport className="flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-6">
        <ThreadPrimitive.Empty>
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 pt-16 text-center">
            <div className="rounded-3xl bg-gradient-to-br from-sky-100 to-indigo-100 px-5 py-4 text-3xl">
              AI
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Trợ lý cá nhân của bạn
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Chat, tạo artifact HTML/tài liệu, upload knowledge, quản lý
                skills và kết nối Telegram bot.
              </p>
            </div>
            <div className="grid w-full gap-2 text-left sm:grid-cols-2">
              {[
                "Tạo landing page HTML giới thiệu sản phẩm mới",
                "Tóm tắt knowledge đã upload và đề xuất skill nên tạo",
                "Viết checklist hôm nay dưới dạng markdown artifact",
                "Thiết kế quy trình Telegram bot nhắc việc hằng ngày",
              ].map((suggestion) => (
                <ThreadPrimitive.Suggestion
                  className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 hover:bg-slate-50"
                  key={suggestion}
                  prompt={suggestion}
                  send
                >
                  {suggestion}
                </ThreadPrimitive.Suggestion>
              ))}
            </div>
          </div>
        </ThreadPrimitive.Empty>

        <ThreadPrimitive.Messages>
          {({ message }) =>
            message.role === "user" ? <UserMessage /> : <AssistantMessage />
          }
        </ThreadPrimitive.Messages>

        <ThreadPrimitive.ViewportFooter className="sticky bottom-0 bg-gradient-to-t from-white via-white pb-4 pt-8">
          <AgentActivity />
          <ThreadPrimitive.ScrollToBottom asChild>
            <Button
              className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full shadow"
              size="icon"
              variant="secondary"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </ThreadPrimitive.ScrollToBottom>
          <Composer />
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}

function Composer() {
  return (
    <ComposerPrimitive.Root className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
      <ComposerPrimitive.Input
        className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-400"
        placeholder="Nhập yêu cầu, dán nội dung, hoặc yêu cầu tạo artifact..."
        rows={1}
      />
      <ComposerPrimitive.Send asChild>
        <Button size="icon">
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </ComposerPrimitive.Send>
    </ComposerPrimitive.Root>
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="flex justify-end">
      <div className="max-w-[85%] rounded-3xl bg-slate-950 px-4 py-3 text-sm leading-6 text-white">
        <MessagePrimitive.Parts />
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="group flex max-w-3xl gap-3">
      <div className="mt-1 h-8 w-8 flex-none rounded-2xl bg-sky-100 text-center text-xs font-semibold leading-8 text-sky-700">
        AI
      </div>
      <div className="min-w-0 flex-1">
        <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800">
          <MessagePrimitive.Parts
            components={{
              Text: AssistantMarkdown,
              tools: {
                by_name: {
                  createArtifact: CreateArtifactTool,
                  write_todos: WriteTodosTool,
                },
              },
              data: {
                by_name: {
                  todos: DeepAgentTodos,
                },
              },
            }}
          />
        </div>
        <ActionBarPrimitive.Root
          autohide="not-last"
          className="mt-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <ActionBarPrimitive.Copy asChild>
            <Button size="sm" variant="ghost">
              <Copy className="h-3.5 w-3.5" />
              Copy
            </Button>
          </ActionBarPrimitive.Copy>
          <ActionBarPrimitive.Reload asChild>
            <Button size="sm" variant="ghost">
              <RefreshCcw className="h-3.5 w-3.5" />
              Retry
            </Button>
          </ActionBarPrimitive.Reload>
        </ActionBarPrimitive.Root>
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMarkdown() {
  return (
    <MarkdownTextPrimitive
      className={cn(
        "prose prose-slate max-w-none text-sm leading-6",
        "prose-pre:rounded-2xl prose-pre:bg-slate-950 prose-pre:p-4 prose-pre:text-slate-50",
        "prose-code:rounded prose-code:bg-slate-200 prose-code:px-1 prose-code:py-0.5 prose-code:text-slate-900 prose-code:before:content-none prose-code:after:content-none",
      )}
      components={{
        a: ArtifactLink,
      }}
    />
  );
}

function ArtifactLink({
  children,
  href,
  ...props
}: ComponentProps<"a">) {
  const { openArtifact } = useArtifactPreview();
  const artifactId = getArtifactId(href);

  if (!artifactId) {
    return (
      <a href={href} rel="noreferrer" target="_blank" {...props}>
        {children}
      </a>
    );
  }

  return (
    <button
      className="font-medium text-sky-700 underline underline-offset-2 hover:text-sky-900"
      onClick={() => void openArtifact(artifactId)}
      type="button"
    >
      {children}
    </button>
  );
}

function getArtifactId(href: string | undefined) {
  if (!href) return null;
  try {
    const url = new URL(href, window.location.origin);
    if (url.pathname !== "/api/artifacts") return null;
    return url.searchParams.get("id");
  } catch {
    return null;
  }
}
