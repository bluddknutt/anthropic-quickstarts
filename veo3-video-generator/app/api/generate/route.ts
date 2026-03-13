import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { startVideoGeneration } from "@/lib/veo3";
import type { GenerateRequest, GenerateResponse } from "@/types/video";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are an expert cinematographer and AI video prompt engineer specializing in Google Veo 3.
Your task is to transform a user's simple video idea into a detailed, cinematic prompt that will produce stunning results.

Guidelines for crafting Veo 3 prompts:
- Describe the scene with vivid visual details: lighting, camera angles, movement, and atmosphere
- Include specific cinematography terms (e.g., "slow dolly shot", "golden hour lighting", "shallow depth of field")
- Mention textures, colors, and visual style
- Add relevant audio/sound context if applicable (Veo 3 generates audio)
- Keep the prompt under 300 words but make every word count
- Do NOT include any inappropriate or harmful content

Return ONLY the enhanced prompt text with no additional commentary or explanation.`;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as GenerateRequest;
    const {
      prompt,
      aspectRatio = "16:9",
      durationSeconds = 8,
    } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "A non-empty prompt is required" },
        { status: 400 },
      );
    }

    // Use Claude to enhance the user's prompt
    const claudeResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Transform this video idea into a detailed Veo 3 prompt: "${prompt.trim()}"`,
        },
      ],
    });

    const enhancedPrompt =
      claudeResponse.content[0].type === "text"
        ? claudeResponse.content[0].text.trim()
        : prompt.trim();

    // Start Veo 3 video generation with the enhanced prompt
    const operationName = await startVideoGeneration(enhancedPrompt, {
      aspectRatio,
      durationSeconds,
      enhancePrompt: false, // Claude already enhanced it
      generateAudio: true,
    });

    const response: GenerateResponse = {
      operationName,
      enhancedPrompt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Generate API error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
