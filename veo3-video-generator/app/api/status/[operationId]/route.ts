import { NextRequest, NextResponse } from "next/server";
import { checkOperationStatus, fetchVideoAsBase64 } from "@/lib/veo3";
import type { VideoStatus } from "@/types/video";

export async function GET(
  _request: NextRequest,
  { params }: { params: { operationId: string } },
): Promise<NextResponse> {
  try {
    // The operationId is URL-encoded; decode to reconstruct the full operation name
    const operationName = decodeURIComponent(params.operationId);

    const operation = await checkOperationStatus(operationName);

    if (operation.error) {
      const status: VideoStatus = {
        done: true,
        error: operation.error.message,
      };
      return NextResponse.json(status);
    }

    if (!operation.done) {
      const status: VideoStatus = { done: false };
      return NextResponse.json(status);
    }

    // Operation complete — extract video URI
    const samples =
      operation.response?.generateVideoResponse?.generatedSamples;
    const videoUri = samples?.[0]?.video?.uri;

    if (!videoUri) {
      const status: VideoStatus = {
        done: true,
        error: "No video was generated",
      };
      return NextResponse.json(status);
    }

    // Fetch and encode the video as base64 so the browser can display it directly
    const videoBase64 = await fetchVideoAsBase64(videoUri);
    const status: VideoStatus = {
      done: true,
      videoBase64,
      mimeType: "video/mp4",
    };
    return NextResponse.json(status);
  } catch (error) {
    console.error("Status API error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
