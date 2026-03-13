export interface GenerateRequest {
  prompt: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  durationSeconds?: 5 | 6 | 7 | 8;
}

export interface GenerateResponse {
  operationName: string;
  enhancedPrompt: string;
}

export interface VideoStatus {
  done: boolean;
  videoBase64?: string;
  mimeType?: string;
  error?: string;
}

export type AspectRatio = "16:9" | "9:16" | "1:1";
