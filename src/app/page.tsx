import { Dashboard } from "@/components/dashboard";
import {
  ArtifactPreviewDrawer,
  ArtifactPreviewProvider,
} from "@/components/artifact-preview";
import { PersonalAssistantRuntimeProvider } from "@/components/assistant/runtime-provider";
import { Thread } from "@/components/assistant/thread";

export default function Home() {
  return (
    <PersonalAssistantRuntimeProvider>
      <ArtifactPreviewProvider>
        <main className="flex h-dvh min-h-0 flex-col bg-slate-100 p-3 text-slate-950 lg:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">
                LangChain DeepAgents + Telegram
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                Personal Assistant Hub
              </h1>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Web app mobile-friendly với assistant-ui, generative artifacts,
              quản lý skills/knowledge và cấu hình Telegram bot.
            </p>
          </div>
          <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
            <Thread />
            <Dashboard />
          </div>
        </main>
        <ArtifactPreviewDrawer />
      </ArtifactPreviewProvider>
    </PersonalAssistantRuntimeProvider>
  );
}
