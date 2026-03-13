"use client";

import { useState } from "react";
import { VideoResult } from "./VideoResult";
import type { AspectRatio } from "@/types/video";

type GenerationState =
  | { status: "idle" }
  | { status: "enhancing" }
  | { status: "generating"; operationName: string; enhancedPrompt: string }
  | {
      status: "done";
      videoBase64: string;
      mimeType: string;
      enhancedPrompt: string;
    }
  | { status: "error"; message: string };

const ASPECT_RATIOS: { label: string; value: AspectRatio }[] = [
  { label: "Landscape (16:9)", value: "16:9" },
  { label: "Portrait (9:16)", value: "9:16" },
  { label: "Square (1:1)", value: "1:1" },
];

const DURATIONS = [5, 6, 7, 8] as const;
type Duration = (typeof DURATIONS)[number];

export function VideoGenerator() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [duration, setDuration] = useState<Duration>(8);
  const [state, setState] = useState<GenerationState>({ status: "idle" });

  async function handleGenerate() {
    if (!prompt.trim()) return;

    setState({ status: "enhancing" });

    try {
      // Step 1: Enhance prompt with Claude and start Veo 3 generation
      const generateRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          durationSeconds: duration,
        }),
      });

      if (!generateRes.ok) {
        const err = await generateRes.json();
        throw new Error(
          (err as { error?: string }).error ?? "Failed to start generation",
        );
      }

      const { operationName, enhancedPrompt } = (await generateRes.json()) as {
        operationName: string;
        enhancedPrompt: string;
      };

      setState({ status: "generating", operationName, enhancedPrompt });

      // Step 2: Poll for completion
      await pollForVideo(operationName, enhancedPrompt);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setState({ status: "error", message });
    }
  }

  async function pollForVideo(
    operationName: string,
    enhancedPrompt: string,
  ): Promise<void> {
    const encodedName = encodeURIComponent(operationName);
    const maxAttempts = 60;
    const intervalMs = 5000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));

      const statusRes = await fetch(`/api/status/${encodedName}`);
      if (!statusRes.ok) {
        throw new Error("Failed to check generation status");
      }

      const data = (await statusRes.json()) as {
        done: boolean;
        videoBase64?: string;
        mimeType?: string;
        error?: string;
      };

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.done && data.videoBase64 && data.mimeType) {
        setState({
          status: "done",
          videoBase64: data.videoBase64,
          mimeType: data.mimeType,
          enhancedPrompt,
        });
        return;
      }
    }

    throw new Error("Video generation timed out. Please try again.");
  }

  const isLoading =
    state.status === "enhancing" || state.status === "generating";

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Input section */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <label
            htmlFor="prompt"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Describe your video
          </label>
          <textarea
            id="prompt"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A lone wolf running through a misty forest at dawn..."
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[180px]">
            <label
              htmlFor="aspect-ratio"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Aspect ratio
            </label>
            <select
              id="aspect-ratio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              disabled={isLoading}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {ASPECT_RATIOS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[140px]">
            <label
              htmlFor="duration"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Duration (seconds)
            </label>
            <select
              id="duration"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) as Duration)}
              disabled={isLoading}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d}s
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || !prompt.trim()}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Generating…" : "Generate Video"}
        </button>
      </div>

      {/* Status / progress */}
      {state.status === "enhancing" && (
        <StatusCard
          icon="✨"
          title="Enhancing your prompt"
          description="Claude is crafting a detailed cinematic prompt for Veo 3…"
        />
      )}

      {state.status === "generating" && (
        <>
          <StatusCard
            icon="🎬"
            title="Generating video"
            description="Google Veo 3 is rendering your video. This usually takes 1–3 minutes…"
            showSpinner
          />
          <EnhancedPromptCard prompt={state.enhancedPrompt} />
        </>
      )}

      {/* Error */}
      {state.status === "error" && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <strong>Error:</strong> {state.message}
        </div>
      )}

      {/* Result */}
      {state.status === "done" && (
        <>
          <VideoResult
            videoBase64={state.videoBase64}
            mimeType={state.mimeType}
          />
          <EnhancedPromptCard prompt={state.enhancedPrompt} />
          <div className="text-center">
            <button
              onClick={() => setState({ status: "idle" })}
              className="text-sm text-muted-foreground underline hover:text-foreground"
            >
              Generate another video
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function StatusCard({
  icon,
  title,
  description,
  showSpinner = false,
}: {
  icon: string;
  title: string;
  description: string;
  showSpinner?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      {showSpinner && (
        <svg
          className="animate-spin h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
    </div>
  );
}

function EnhancedPromptCard({ prompt }: { prompt: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        Claude-enhanced prompt
      </p>
      <p className="text-sm text-foreground leading-relaxed">{prompt}</p>
    </div>
  );
}
