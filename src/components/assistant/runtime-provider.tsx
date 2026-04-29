"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  AssistantChatTransport,
  useChatRuntime,
} from "@assistant-ui/react-ai-sdk";
import { type ReactNode, useMemo } from "react";

export function PersonalAssistantRuntimeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const transport = useMemo(
    () =>
      new AssistantChatTransport({
        api: "/api/chat",
      }),
    [],
  );
  const runtime = useChatRuntime({ transport });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
