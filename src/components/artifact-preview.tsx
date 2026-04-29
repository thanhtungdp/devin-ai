"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ExternalLink, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Artifact } from "@/server/types";

type ArtifactPreviewContextValue = {
  artifact: Artifact | null;
  error: string;
  isLoading: boolean;
  isOpen: boolean;
  closeArtifact: () => void;
  openArtifact: (id: string) => Promise<void>;
};

const ArtifactPreviewContext =
  createContext<ArtifactPreviewContextValue | null>(null);

export function ArtifactPreviewProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const closeArtifact = useCallback(() => {
    setIsOpen(false);
    setError("");
  }, []);

  const openArtifact = useCallback(async (id: string) => {
    setIsOpen(true);
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/artifacts?id=${id}`);
      const json = (await response.json()) as {
        artifact?: Artifact;
        error?: string;
      };
      if (!response.ok || !json.artifact) {
        throw new Error(json.error ?? "Artifact not found");
      }
      setArtifact(json.artifact);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load artifact",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      artifact,
      closeArtifact,
      error,
      isLoading,
      isOpen,
      openArtifact,
    }),
    [artifact, closeArtifact, error, isLoading, isOpen, openArtifact],
  );

  return (
    <ArtifactPreviewContext.Provider value={value}>
      {children}
    </ArtifactPreviewContext.Provider>
  );
}

export function useArtifactPreview() {
  const context = useContext(ArtifactPreviewContext);
  if (!context) {
    throw new Error(
      "useArtifactPreview must be used inside ArtifactPreviewProvider",
    );
  }
  return context;
}

export function ArtifactPreviewDrawer() {
  const { artifact, closeArtifact, error, isLoading, isOpen } =
    useArtifactPreview();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/25 backdrop-blur-sm">
      <aside className="flex h-full w-full max-w-2xl flex-col border-l border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
              Artifact preview
            </p>
            <h2 className="mt-1 truncate text-lg font-semibold">
              {artifact?.title ?? "Đang tải artifact..."}
            </h2>
            {artifact ? (
              <p className="text-xs text-slate-500">
                {artifact.type} · {new Date(artifact.createdAt).toLocaleString()}
              </p>
            ) : null}
          </div>
          <div className="flex flex-none items-center gap-2">
            {artifact ? (
              <a
                className="inline-flex h-8 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium hover:bg-slate-50"
                href={`/api/artifacts?id=${artifact.id}&raw=1`}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Raw
              </a>
            ) : null}
            <Button onClick={closeArtifact} size="icon" variant="ghost">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-auto bg-slate-50 p-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải artifact...
            </div>
          ) : null}
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          {!isLoading && !error && artifact ? (
            <ArtifactPreviewContent artifact={artifact} />
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function ArtifactPreviewContent({ artifact }: { artifact: Artifact }) {
  if (artifact.type === "html") {
    return (
      <iframe
        className="h-full min-h-[720px] w-full rounded-2xl border border-slate-200 bg-white"
        sandbox="allow-scripts"
        src={`/api/artifacts?id=${artifact.id}&raw=1`}
        title={artifact.title}
      />
    );
  }

  if (artifact.type === "image") {
    return (
      <div className="flex min-h-full items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={artifact.title}
          className="max-h-full max-w-full rounded-2xl border border-slate-200 bg-white object-contain"
          src={artifact.content}
        />
      </div>
    );
  }

  const content =
    artifact.type === "json" ? formatJson(artifact.content) : artifact.content;

  return (
    <pre className="min-h-full whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-800">
      {content}
    </pre>
  );
}

function formatJson(content: string) {
  try {
    const parsed = JSON.parse(content) as unknown;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return content;
  }
}
