const VEO3_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-preview";

interface Veo3Parameters {
  aspectRatio: string;
  durationSeconds: number;
  enhancePrompt: boolean;
  generateAudio: boolean;
}

interface Veo3GenerateResponse {
  name: string;
}

interface Veo3OperationResponse {
  name: string;
  done?: boolean;
  error?: { message: string };
  response?: {
    generateVideoResponse?: {
      generatedSamples?: Array<{
        video?: {
          uri?: string;
        };
      }>;
    };
  };
}

export async function startVideoGeneration(
  prompt: string,
  parameters: Veo3Parameters,
): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY environment variable is not set");
  }

  const response = await fetch(
    `${VEO3_BASE_URL}:predictLongRunning?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Veo 3 API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as Veo3GenerateResponse;
  return data.name;
}

export async function checkOperationStatus(
  operationName: string,
): Promise<Veo3OperationResponse> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY environment variable is not set");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`,
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Operation status error: ${response.status} - ${error}`);
  }

  return (await response.json()) as Veo3OperationResponse;
}

export async function fetchVideoAsBase64(uri: string): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY environment variable is not set");
  }

  const separator = uri.includes("?") ? "&" : "?";
  const response = await fetch(`${uri}${separator}key=${apiKey}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch video: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return base64;
}
