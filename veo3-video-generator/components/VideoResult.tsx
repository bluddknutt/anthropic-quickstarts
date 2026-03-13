"use client";

interface VideoResultProps {
  videoBase64: string;
  mimeType: string;
}

export function VideoResult({ videoBase64, mimeType }: VideoResultProps) {
  const src = `data:${mimeType};base64,${videoBase64}`;

  return (
    <div className="w-full rounded-lg overflow-hidden border border-border bg-card shadow-md">
      <video
        src={src}
        controls
        autoPlay
        loop
        className="w-full max-h-[600px] object-contain bg-black"
      />
    </div>
  );
}
